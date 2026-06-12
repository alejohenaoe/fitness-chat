# FitnessChat

Aplicación de seguimiento nutricional y de ejercicio asistida por IA. El usuario interactúa con un chat en lenguaje natural para registrar comidas y entrenamientos; el modelo extrae automáticamente los datos, los persiste y los refleja en tiempo real en un dashboard de progreso diario.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Django 5.1 · Django REST Framework 3.15 · SimpleJWT 5.3 · PostgreSQL |
| IA | Groq API · Llama 3.3 70B · HTTPX |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Zustand 5 · TanStack Query 5 |
| Gráficas | Recharts 2 · Framer Motion 11 |
| Infraestructura | Docker · Docker Compose |

## Funcionalidades implementadas

- **Chat inteligente** — el LLM interpreta mensajes en lenguaje natural, extrae alimentos y ejercicios, persiste los registros y responde con un análisis contextual del día.
- **Registro de comidas** — identifica nombre, cantidad (gramos + descripción libre), tipo de comida (desayuno, almuerzo, cena, snacks, bebidas, etc.) y macronutrientes. Fuente de nutrición trazable (`usda` / `local` / `llm`) con nivel de confianza.
- **Registro de ejercicio** — detecta tipo de actividad (cardio, fuerza, HIIT, yoga, ciclismo, natación…), duración, intensidad y calorías quemadas estimadas.
- **Dashboard diario** — panel lateral derecho con anillos SVG de progreso para calorías y macros vs. objetivos, sección de comidas y sección de ejercicios del día.
- **Panel de entradas (bottom sheet)** — listado de comidas y ejercicios del día con opción de borrado individual y actualización reactiva de los totales.
- **Historial con gráficas** — página `/history` con gráficas de barras y área (Recharts), filtros por semana / mes / rango personalizado y desglose por día.
- **Resumen diario con IA** — síntesis narrativa generada por el modelo (prompt separado en `daily_summary_prompt.md`).
- **Perfil de usuario** — datos antropométricos, nivel de actividad, objetivo fitness y cálculo automático de TDEE (Mifflin–St Jeor) + distribución de macros al guardar.
- **Estadísticas de perfil** — racha de días activos y promedio calórico de los últimos 7 días (`/api/profile/stats/`).
- **Autenticación** — JWT con refresh token, blacklist en logout y auto-refresh transparente en el cliente (interceptor Axios con reintentos).
- **Eliminación de cuenta** — flujo completo con modal de confirmación (componentes implementados; botón deshabilitado en la UI pendiente de activar).
- **Base de datos de alimentos** — fixture precargado con ítems y macros de referencia.

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

Variables disponibles en `.env.example`:

| Variable | Descripción |
|---|---|
| `SECRET_KEY` | Clave secreta de Django |
| `DEBUG` | `True` en desarrollo |
| `ALLOWED_HOSTS` | Hosts permitidos |
| `DB_NAME / DB_USER / DB_PASSWORD / DB_HOST / DB_PORT` | Conexión PostgreSQL |
| `GROQ_API_KEY` | API key de Groq |
| `VITE_API_BASE_URL` | URL base del backend usada por el frontend |

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

## API — Endpoints

Todos requieren `Authorization: Bearer <access_token>` salvo los marcados como públicos.

### Autenticación `/api/auth/`
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/register/` | Crear cuenta | Público |
| POST | `/login/` | Obtener tokens JWT | Público |
| POST | `/token/refresh/` | Renovar access token | Público |
| POST | `/logout/` | Invalidar refresh token | ✓ |
| GET | `/me/` | Datos del usuario autenticado | ✓ |
| DELETE | `/delete-account/` | Eliminar cuenta y datos | ✓ |

### Perfil `/api/profile/`
| Método | Ruta | Descripción |
|---|---|---|
| GET / PUT | `/` | Ver o actualizar perfil; recalcula TDEE y macros automáticamente |
| GET | `/stats/` | Racha de días y promedio calórico 7 días |

### Dashboard `/api/dashboard/`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/today/` | Totales del día (calorías, macros, ejercicio) vs. objetivos |
| GET | `/history/` | Historial; parámetros: `?days=N` o `?start_date=&end_date=` |

### Chat `/api/chat/`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/message/` | Enviar mensaje; pipeline completo de IA + persistencia |
| GET | `/sessions/` | Listar sesiones del usuario |
| GET | `/sessions/today/` | Sesión del día actual |
| GET | `/sessions/<date>/` | Sesión de una fecha específica |
| GET | `/sessions/<id>/messages/` | Mensajes de una sesión |

### Nutrición `/api/nutrition/`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/today/` | Comidas del día con totales |
| GET | `/date/<YYYY-MM-DD>/` | Comidas de una fecha |
| GET | `/weekly/` | Resumen semanal |
| GET | `/progress/` | Progreso calórico |
| DELETE | `/meal/<id>/` | Eliminar comida; devuelve totales actualizados |

### Ejercicio `/api/exercise/`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/today/` | Ejercicios del día |
| GET | `/date/<YYYY-MM-DD>/` | Ejercicios de una fecha |
| GET | `/summary/` | Totales de los últimos 7 días |
| DELETE | `/log/<id>/` | Eliminar registro; devuelve totales actualizados |

## Modelos de datos principales

### `UserProfile`
Extiende `User` de Django (OneToOne). Almacena datos antropométricos (`age`, `gender`, `weight_kg`, `height_cm`), objetivo (`goal`), nivel de actividad (`activity_level`), zona horaria, y targets calculados (`daily_calorie_target`, `protein_target_g`, `carbs_target_g`, `fat_target_g`). Método `calculate_tdee()` con fórmula Mifflin–St Jeor.

### `ChatSession` / `ChatMessage`
Una sesión por usuario por día (`unique_together`). Los mensajes guardan el `role` (user/assistant), tipo (`food_log`, `exercise_log`, `both`, `analysis`, `summary`, `text`), y el JSON extraído por el modelo en `extracted_data`.

### `MealLog`
Registra nombre, cantidad en gramos, descripción libre, tipo de comida, macros, timestamp (`occurred_at`), y la fuente de los valores nutricionales (`nutrition_source`: usda/local/llm) con `nutrition_confidence` (high/medium/low) y `usda_fdc_id` opcional.

### `ExerciseLog`
Registra nombre, tipo de ejercicio (10 categorías), duración, intensidad, calorías quemadas, bandera `estimated` y timestamp `occurred_at`.

## Estructura del proyecto

```
fitness-chat/
├── .env                        # variables de entorno (no versionado)
├── .env.example                # plantilla versionada
├── docker-compose.yml
├── backend/
│   ├── apps/
│   │   ├── ai/                 # servicio Groq, prompts system + daily_summary
│   │   ├── chat/               # ChatSession, ChatMessage, pipeline de mensajes
│   │   ├── nutrition/          # FoodItem, MealLog, usda_service
│   │   ├── exercise/           # ExerciseLog
│   │   └── users/              # UserProfile, TDEE, autenticación, dashboard
│   ├── fixtures/
│   │   └── food_database.json
│   └── fitnesschat/            # configuración Django (settings, urls, wsgi, asgi)
└── frontend/
    └── src/
        ├── components/
        │   ├── chat/           # ChatPage, ChatInput, ChatMessage, MessageCard, EntriesPanel
        │   ├── dashboard/      # DashboardPanel (anillos SVG + resumen)
        │   ├── layout/         # MainLayout (sidebar + outlet)
        │   └── profile/        # ProfileForm, secciones, DeleteAccountModal
        ├── hooks/              # useChat, useDailyProgress (polling 30s), useLogManager
        ├── pages/              # AuthPage, HistoryPage (Recharts), ProfilePage
        ├── services/           # api.ts — Axios con interceptores JWT
        ├── stores/             # useAppStore (Zustand)
        └── types/              # index.ts, profile.ts
```

## Dependencias principales

### Backend (Python)
| Paquete | Versión |
|---|---|
| Django | 5.1.4 |
| djangorestframework | 3.15.2 |
| djangorestframework-simplejwt | 5.3.1 |
| django-cors-headers | 4.4.0 |
| psycopg2-binary | 2.9.10 |
| groq | 0.11.0 |
| httpx | 0.27.2 |
| python-decouple | 3.8 |
| gunicorn | 23.0.0 |

### Frontend (npm)
| Paquete | Versión |
|---|---|
| react / react-dom | ^18.3.1 |
| react-router-dom | ^6.28.0 |
| @tanstack/react-query | ^5.62.0 |
| zustand | ^5.0.2 |
| axios | ^1.7.9 |
| react-hook-form + zod | ^7.54.1 / ^3.23.8 |
| recharts | ^2.14.1 |
| framer-motion | ^11.13.1 |
| lucide-react | ^0.468.0 |
| date-fns | ^4.1.0 |

## Pendientes / trabajo en progreso

- `progress/` y `utils/` en `frontend/src/` están vacíos — componentes/helpers previstos aún no implementados.
- El botón de eliminar cuenta (`DeleteAccountButton`) está comentado en `ProfilePage`; los componentes del modal están completos.
- El campo `streak_days` en `UserProfile` existe en la BD pero no se actualiza automáticamente todavía.

