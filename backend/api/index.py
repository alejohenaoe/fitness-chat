# Punto de entrada de Django para Vercel (funcion serverless de Python)
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fitnesschat.wsgi import application  # noqa: E402

app = application
