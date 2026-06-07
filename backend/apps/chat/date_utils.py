from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

_WEEKDAY_ES = {
    "lunes": 0, "martes": 1, "miércoles": 2, "miercoles": 2,
    "jueves": 3, "viernes": 4, "sábado": 5, "sabado": 5, "domingo": 6,
}
_WEEKDAY_EN = {
    "monday": 0, "tuesday": 1, "wednesday": 2,
    "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
}


def _safe_tz(timezone_str: str) -> ZoneInfo:
    try:
        return ZoneInfo(timezone_str)
    except (ZoneInfoNotFoundError, Exception):
        return ZoneInfo("America/Bogota")


def resolve_event_date(
    event_date_str: str | None,
    reference_dt: datetime,
    timezone_str: str = "America/Bogota",
) -> date:
    """
    Resolve a natural-language or ISO event_date string to a concrete date.

    Returns reference_dt.date() (today) when event_date_str is None/empty.
    """
    tz = _safe_tz(timezone_str)
    # Convert reference_dt to timezone-aware local time
    if reference_dt.tzinfo is None:
        local_now = reference_dt.replace(tzinfo=tz)
    else:
        local_now = reference_dt.astimezone(tz)
    today = local_now.date()

    if not event_date_str:
        return today

    s = event_date_str.strip().lower()

    # Explicit ISO date (YYYY-MM-DD)
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        try:
            return date.fromisoformat(s)
        except ValueError:
            pass

    # Absolute keywords
    if s in ("hoy", "today", "esta mañana", "esta manana", "esta tarde", "esta noche"):
        return today
    if s in ("ayer", "yesterday"):
        return today - timedelta(days=1)
    if s in ("anteayer", "day before yesterday"):
        return today - timedelta(days=2)
    if s in ("anoche", "last night"):
        # anoche is almost always yesterday night; if it's past midnight, still yesterday
        return today - timedelta(days=1)

    # "el lunes pasado" / "el martes" / weekday names
    for prefix in ("el ", "la ", "last ", ""):
        candidate = s.removeprefix(prefix).removesuffix(" pasado").removesuffix(" anterior").strip()
        if candidate in _WEEKDAY_ES:
            return _last_weekday(today, _WEEKDAY_ES[candidate])
        if candidate in _WEEKDAY_EN:
            return _last_weekday(today, _WEEKDAY_EN[candidate])

    # Fallback: return today
    return today


def _last_weekday(reference: date, target_weekday: int) -> date:
    """Return the most recent date (strictly before reference) with the given weekday."""
    days_ago = (reference.weekday() - target_weekday) % 7
    if days_ago == 0:
        days_ago = 7  # same weekday → go back a full week
    return reference - timedelta(days=days_ago)
