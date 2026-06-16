from __future__ import annotations

import logging
from typing import Any

import httpx
from django.conf import settings

from apps.nutrition.models import FoodItem

logger = logging.getLogger(__name__)

_USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
# USDA nutrient IDs we care about
_NID_ENERGY = 1008   # Energy (kcal)
_NID_PROTEIN = 1003  # Protein (g)
_NID_CARBS = 1005    # Carbohydrate, by difference (g)
_NID_FAT = 1004      # Total lipid (fat) (g)

# Words in USDA descriptions that indicate a processed/non-basic variant
_SKIP_WORDS = frozenset([
    "dehydrated", "dried", "powder", "freeze-dried", "chips", "flakes",
    "canned", "pickled", "smoked", "breaded", "fried", "battered",
    "lunchmeat", "processed", "imitation", "substitute",
])
# Words that signal a good basic match
_PREFER_WORDS = frozenset(["raw", "fresh", "cooked", "boiled", "plain"])

_CONFIDENCE_MAP = {"high": "high", "medium": "medium", "low": "low"}


def _score_result(food: dict) -> int:
    """Higher score = better match (prefer basic/raw, penalize processed)."""
    desc = food.get("description", "").lower()
    score = 0
    for w in _PREFER_WORDS:
        if w in desc:
            score += 2
    for w in _SKIP_WORDS:
        if w in desc:
            score -= 5
    # Prefer Foundation > SR Legacy (usually more complete)
    if food.get("dataType") == "Foundation":
        score += 3
    return score


class USDAService:
    """Look up food nutrition data from USDA FoodData Central with fallback chain."""

    def search_food(self, name: str) -> dict[str, Any] | None:
        """
        Search USDA FoodData Central for `name`.
        Returns a dict with keys: fdc_id, calories_per_100g, protein_per_100g,
        carbs_per_100g, fat_per_100g — or None on failure/no results.
        """
        api_key = getattr(settings, "USDA_API_KEY", "")
        if not api_key:
            return None
        try:
            resp = httpx.get(
                _USDA_SEARCH_URL,
                params={
                    "query": name,
                    "pageSize": 8,
                    "dataType": "Foundation,SR Legacy",
                    "api_key": api_key,
                },
                timeout=3.0,
            )
            resp.raise_for_status()
            data = resp.json()
        except (httpx.TimeoutException, httpx.HTTPError, Exception) as exc:
            logger.debug("USDA search failed for '%s': %s", name, exc)
            return None

        foods = data.get("foods", [])
        if not foods:
            return None

        # Pick the best-scored result that has calorie data
        best = None
        best_score = -999
        for food in foods:
            nutrients = {n["nutrientId"]: n.get("value", 0) for n in food.get("foodNutrients", [])}
            cal = nutrients.get(_NID_ENERGY, 0)
            if not cal:
                continue  # skip entries with no energy data
            score = _score_result(food)
            if score > best_score:
                best_score = score
                best = (food, nutrients)

        if best is None:
            return None

        food, nutrients = best
        return {
            "fdc_id": food.get("fdcId"),
            "calories_per_100g": nutrients.get(_NID_ENERGY, 0),
            "protein_per_100g": nutrients.get(_NID_PROTEIN, 0),
            "carbs_per_100g": nutrients.get(_NID_CARBS, 0),
            "fat_per_100g": nutrients.get(_NID_FAT, 0),
        }

    def _nutrients_from_local(self, name: str) -> dict[str, Any] | None:
        """Try an exact-then-case-insensitive match in the local FoodItem table."""
        item = FoodItem.objects.filter(name__iexact=name).first()
        if item:
            return {
                "fdc_id": None,
                "calories_per_100g": item.calories_per_100g,
                "protein_per_100g": item.protein_per_100g,
                "carbs_per_100g": item.carbs_per_100g,
                "fat_per_100g": item.fat_per_100g,
            }
        return None

    def enrich_food(self, food_data: dict[str, Any]) -> dict[str, Any]:
        """
        Enrich an AI-extracted food dict with real nutritional data.

        Fallback chain: USDA → local FoodItem → LLM estimate (keep as-is).
        Adds: nutrition_source, nutrition_confidence, usda_fdc_id.
        """
        name = food_data.get("name", "")
        search_name = food_data.get("name_en", "") or name
        quantity_grams = food_data.get("quantity_grams") or 100.0

        # --- Try USDA ---
        usda = self.search_food(search_name)
        if usda and usda["calories_per_100g"]:
            scale = quantity_grams / 100.0
            return {
                **food_data,
                "calories_estimated": round(usda["calories_per_100g"] * scale, 1),
                "protein_g": round(usda["protein_per_100g"] * scale, 1),
                "carbs_g": round(usda["carbs_per_100g"] * scale, 1),
                "fat_g": round(usda["fat_per_100g"] * scale, 1),
                "nutrition_source": "usda",
                "nutrition_confidence": "high",
                "usda_fdc_id": usda["fdc_id"],
            }

        # --- Try local FoodItem DB ---
        local = self._nutrients_from_local(name)
        if local and local["calories_per_100g"]:
            scale = quantity_grams / 100.0
            return {
                **food_data,
                "calories_estimated": round(local["calories_per_100g"] * scale, 1),
                "protein_g": round(local["protein_per_100g"] * scale, 1),
                "carbs_g": round(local["carbs_per_100g"] * scale, 1),
                "fat_g": round(local["fat_per_100g"] * scale, 1),
                "nutrition_source": "local",
                "nutrition_confidence": "medium",
                "usda_fdc_id": None,
            }

        # --- Fallback: keep LLM estimate ---
        confidence = food_data.get("confidence", "medium")
        return {
            **food_data,
            "nutrition_source": "llm",
            "nutrition_confidence": _CONFIDENCE_MAP.get(confidence, "medium"),
            "usda_fdc_id": None,
        }
