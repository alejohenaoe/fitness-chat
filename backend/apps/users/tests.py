from django.test import SimpleTestCase

from .models import UserProfile


def profile(**kw):
    data = dict(age=32, gender="male", weight_kg=78, height_cm=176, activity_level="moderate", goal="maintenance")
    data.update(kw)
    p = UserProfile(**data)
    p.recalculate_targets()
    return p


def macro_kcal(p):
    return p.protein_target_g * 4 + p.carbs_target_g * 4 + p.fat_target_g * 9


class RecalculateTargetsTests(SimpleTestCase):
    def test_ajuste_de_calorias_por_objetivo(self):
        tdee = profile().calculate_tdee()  # 2673 para el perfil de ejemplo
        self.assertEqual(profile(goal="maintenance").daily_calorie_target, tdee)
        self.assertEqual(profile(goal="weight_loss").daily_calorie_target, round(tdee * 0.80))
        self.assertEqual(profile(goal="muscle_gain").daily_calorie_target, round(tdee * 1.10))
        self.assertEqual(profile(goal="body_recomposition").daily_calorie_target, round(tdee * 0.90))
        self.assertEqual(profile(goal="athletic_performance").daily_calorie_target, tdee)

    def test_los_macros_suman_la_meta(self):
        for goal in ["weight_loss", "muscle_gain", "body_recomposition", "maintenance", "athletic_performance"]:
            p = profile(goal=goal)
            # Solo difieren por el redondeo de cada macro a gramos enteros.
            self.assertLessEqual(abs(macro_kcal(p) - p.daily_calorie_target), 10, goal)

    def test_ejemplo_perder_peso(self):
        p = profile(goal="weight_loss")
        self.assertEqual(
            (p.daily_calorie_target, p.protein_target_g, p.carbs_target_g, p.fat_target_g),
            (2138, 156, 246, 59),
        )

    def test_piso_de_calorias(self):
        p = profile(gender="female", age=60, weight_kg=45, height_cm=150, activity_level="sedentary", goal="weight_loss")
        self.assertGreaterEqual(p.daily_calorie_target, 1200)
        self.assertGreaterEqual(p.daily_calorie_target, round(p.calculate_bmr()))
        hombre = profile(age=60, weight_kg=55, height_cm=160, activity_level="sedentary", goal="weight_loss")
        self.assertGreaterEqual(hombre.daily_calorie_target, 1500)

    def test_proteina_con_imc_alto_usa_peso_de_referencia(self):
        p = profile(weight_kg=120, height_cm=170, goal="weight_loss")  # IMC 41,5
        self.assertEqual(p.protein_target_g, round(25 * 1.70 ** 2 * 2.0))  # 144 g, no 240 g

    def test_grasa_minima(self):
        p = profile(gender="female", age=60, weight_kg=95, height_cm=150, activity_level="sedentary", goal="weight_loss")
        self.assertGreaterEqual(p.fat_target_g, round(95 * 0.6))
