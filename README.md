# FitnessChat

Aplicación de seguimiento nutricional y de ejercicio asistida por IA. El usuario interactúa con un chat en lenguaje natural para registrar comidas y entrenamientos; el modelo extrae automáticamente los datos, los persiste y los refleja en tiempo real en un dashboard de progreso diario.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Django 5 · Django REST Framework · SimpleJWT · PostgreSQL |
| IA | Groq API · Llama 3.3 70B |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Query |
| Infraestructura | Docker · Docker Compose |

## Funcionalidades

- **Chat inteligente** — el LLM interpreta mensajes en lenguaje natural, extrae alimentos y ejercicios, y responde con un análisis contextual del día.
- **Registro de comidas** — identifica nombre, cantidad, tipo de comida (desayuno, almuerzo, cena, etc.) y macronutrientes (calorías, proteínas, carbohidratos, grasas).
- **Registro de ejercicio** — detecta tipo de actividad, duración, intensidad y calorías quemadas estimadas.
- **Dashboard diario** — progreso en tiempo real de calorías y macros vs. objetivos, resumen de actividad física.
- **Resumen diario con IA** — síntesis narrativa del día generada por el modelo al cierre de la jornada.
- **Perfil de usuario** — datos antropométricos, nivel de actividad, objetivo fitness y cálculo automático de TDEE (Mifflin–St Jeor).
- **Autenticación** — JWT con refresh token y blacklist.
- **Base de datos de alimentos** — fixture precargado con items y macros de referencia.

## Requisitos previos

- Docker y Docker Compose, **o** Python 3.11+ y Node.js 20+
- Cuenta en [Groq](https://console.groq.com) para obtener una `GROQ_API_KEY`

## Configuración de variables de entorno

Las variables de entorno están centralizadas en un único archivo en la raíz del proyecto.

```bash
cp .env.example .env
```

Edita `.env` y reemplaza al menos:

```env
SECRET_KEY=<genera uno con: openssl rand -base64 48>
GROQ_API_KEY=<tu API key de Groq>
```

## Inicio rápido con Docker

```bash
docker-compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| Admin Django | http://localhost:8000/admin |

## Setup manual

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata fixtures/food_database.json
python manage.py runserver
```

> `python-decouple` busca el `.env` subiendo por el árbol de directorios, por lo que lee el archivo en la raíz automáticamente.

### Frontend

```bash
cd frontend
cp ../.env .env          # o crea un symlink: ln -s ../.env .env
npm install
npm run dev
```

## Estructura del proyecto

```
fitness-chat/
├── .env                   # variables de entorno (no versionado)
├── .env.example           # plantilla versionada
├── docker-compose.yml
├── backend/
│   ├── apps/
│   │   ├── ai/            # servicio Groq + prompts
│   │   ├── chat/          # sesiones y mensajes
│   │   ├── nutrition/     # FoodItem, MealLog
│   │   ├── exercise/      # ExerciseLog
│   │   └── users/         # UserProfile, TDEE
│   ├── fixtures/
│   │   └── food_database.json
│   └── fitnesschat/       # configuración Django
└── frontend/
    └── src/
        ├── components/    # Chat, Dashboard, Layout
        ├── hooks/         # useChat, useDailyProgress, useLogManager
        ├── pages/         # Auth, History, Profile
        ├── services/      # cliente Axios
        ├── stores/        # Zustand (estado global)
        └── types/
```

