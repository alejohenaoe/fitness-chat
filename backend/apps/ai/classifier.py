import numpy as np
import pickle
import os
import tempfile
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer

_GREETINGS = [
    "hola", "hola,", "buenos días", "buenas tardes", "buenas noches",
    "buenas", "buen día", "qué tal", "que tal", "hey", "ey",
]

_REFERENCES = {
    "generic": [
        "Cuál es la capital de Francia?",
        "Dime un chiste",
        "Cuánto es 2 más 2?",
        "Qué hora es?",
        "Cuál es la temperatura en Bogotá?",
        "Quién escribió Cien Años de Soledad?",
        "Háblame de la teoría de la relatividad",
        "Cuál es el sentido de la vida?",
        "Cómo se dice hola en inglés?",
        "Qué día es hoy?",
        "En qué año terminó la Segunda Guerra Mundial?",
        "Cuéntame algo interesante",
    ],
    "food_log": [
        "Acabo de tomar un café con pan",
        "Desayuné dos huevos con arepa",
        "Almorcé arroz con pollo y jugo",
        "Comí una manzana de postre",
        "Tomé un vaso de leche antes de dormir",
        "Merendé un yogur con granola",
        "Cené una ensalada con pollo",
        "Bebí un batido de proteínas después del gym",
        "Agregá 200 gramos de arroz a mi comida",
        "Registrá que comí una pizza entera",
        "Desayune arepa huevo y queso",
        "Almorce pasta con carne",
        "Cene pescado con verduras",
        "Comí un sandwich de jamon y queso",
        "Registra esto a mis comidas",
        "Ingresa eso a mis registros",
        "Guarda eso en mi registro de comidas",
        "Quiero agregar lo que comi a mis registros",
        "Pon eso en mis alimentos",
        "Pero quiero que lo ingreses a mis registros",
        "Quiero que lo guardes en mis registros",
        "Puedes registrar eso que te dije",
        "Agrega eso a mi comida de hoy",
    ],
    "exercise_log": [
        "Acabo de caminar 30 minutos",
        "Hice pesas en el gym",
        "Corrí 5 kilómetros esta mañana",
        "Hice yoga por una hora",
        "Fui a nadar 45 minutos",
        "Hice bicicleta 20 minutos",
        "Entrené pierna en el gimnasio",
        "Salí a trotar 3 kilómetros",
        "Hice abdominales por 10 minutos",
        "Jugué fútbol una hora",
    ],
    "both": [
        "Comí arroz con pollo y luego caminé 30 minutos",
        "Desayuné arepa con huevo y después fui al gym",
        "Almorcé pasta y corrí 5k en la tarde",
        "Cené ensalada y luego hice yoga",
        "Tomé café con pan y salí a trotar",
    ],
    "query": [
        "Haz un desglose de lo que he comido hoy",
        "Cuántas calorías me quedan?",
        "Qué progreso tengo hoy?",
        "Muéstrame mis comidas de hoy",
        "Cuánta proteína he consumido?",
        "Qué ejercicios he registrado hoy?",
        "Cuántas calorías he quemado?",
        "Cómo voy con mis macros?",
        "Qué tan cerca estoy de mi meta calórica?",
        "Cuánta agua debería tomar hoy?",
    ],
    "analysis": [
        "Cómo voy hoy con mis macros?",
        "Haz un resumen de mi día",
        "Cómo puedo mejorar mi alimentación?",
        "Qué debería comer en la cena?",
        "Recomiéndame algo para la merienda",
        "Estoy comiendo bien para mi objetivo?",
        "Qué cambiarías de mi alimentación hoy?",
        "Dame una recomendación para la próxima comida",
        "Cómo distribuir mejor mis calorías restantes?",
        "Qué ejercicio me recomiendas para hoy?",
    ],
}

_MODEL_DIR = Path("/app/classifier_data")
_MODEL_PATH = _MODEL_DIR / "model.pkl"


class IntentClassifier:
    _vectorizer: TfidfVectorizer | None = None
    _reference_matrix = None
    _reference_labels: list[str] = []
    _reference_texts: list[str] = []

    @classmethod
    def load(cls) -> None:
        if cls._vectorizer is not None:
            return

        if _MODEL_PATH.exists():
            with open(_MODEL_PATH, "rb") as f:
                data = pickle.load(f)
                cls._vectorizer = data["vectorizer"]
                cls._reference_matrix = data["matrix"]
                cls._reference_labels = data["labels"]
                cls._reference_texts = data["texts"]
            return

        texts, labels = [], []
        for label, examples in _REFERENCES.items():
            for ex in examples:
                texts.append(ex)
                labels.append(label)
        cls._fit(texts, labels)
        cls._reference_texts = texts

    @classmethod
    def _fit(cls, texts: list[str], labels: list[str]) -> None:
        vectorizer = TfidfVectorizer()
        matrix = vectorizer.fit_transform(texts)
        cls._vectorizer = vectorizer
        cls._reference_matrix = matrix
        cls._reference_labels = labels

    @classmethod
    def classify(cls, text: str, threshold: float = 0.35) -> str:
        cls.load()
        assert cls._vectorizer is not None
        assert cls._reference_matrix is not None

        clean = text.lower().strip()
        for g in _GREETINGS:
            if clean.startswith(g):
                clean = clean[len(g):].strip()
                break
        text = clean if clean else text

        vec = cls._vectorizer.transform([text])
        norms = np.sqrt(cls._reference_matrix.multiply(cls._reference_matrix).sum(axis=1).A1)
        vec_norm = np.sqrt(vec.multiply(vec).sum(axis=1).A1)[0]
        denom = norms * vec_norm
        dot = cls._reference_matrix.dot(vec.T).toarray().ravel()
        similarities = dot / np.where(denom == 0, 1, denom)

        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])
        best_label = cls._reference_labels[best_idx]

        cls._log_example(text, best_label, best_score)

        if best_score < threshold:
            return "generic"
        return best_label

    @classmethod
    def _log_example(cls, text: str, label: str, confidence: float) -> None:
        try:
            from apps.ai.models import TrainingExample
            TrainingExample.objects.create(
                message_text=text,
                intent_label=label,
                confidence=confidence,
                source="predicted",
            )
        except Exception:
            pass

    @classmethod
    def retrain(cls) -> None:
        from apps.ai.models import TrainingExample

        texts: list[str] = []
        labels: list[str] = []

        for label, examples in _REFERENCES.items():
            for ex in examples:
                texts.append(ex)
                labels.append(label)

        confirmed = TrainingExample.objects.filter(
            is_active=True, source="confirmed"
        ).values_list("message_text", "intent_label")
        for msg_text, intent_label in confirmed:
            texts.append(msg_text)
            labels.append(intent_label)

        seed_count = sum(len(exs) for exs in _REFERENCES.values())
        if len(texts) <= seed_count:
            return

        cls._fit(texts, labels)
        cls._reference_texts = texts

        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        tmp = tempfile.NamedTemporaryFile(delete=False, dir=_MODEL_DIR)
        try:
            with open(tmp.name, "wb") as f:
                pickle.dump({
                    "vectorizer": cls._vectorizer,
                    "matrix": cls._reference_matrix,
                    "labels": cls._reference_labels,
                    "texts": cls._reference_texts,
                }, f)
            os.replace(tmp.name, _MODEL_PATH)
        except Exception:
            os.unlink(tmp.name)
            raise
