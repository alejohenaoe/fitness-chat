# Prompt — FitnessChat Mobile (React Native / Expo)

## Contexto del proyecto

Existe una app web llamada **FitnessChat** cuyo backend Django ya está construido y en funcionamiento. El backend expone una API REST con autenticación JWT. Esta app mobile debe ser la versión móvil de esa misma aplicación, consumiendo los mismos endpoints, pero con una experiencia diseñada para teléfono: **el chat es el elemento central**, no un panel secundario.

### Backend disponible (no modificar)

- Base URL configurable via variable de entorno `EXPO_PUBLIC_API_BASE_URL` (ej: `http://192.168.x.x:8000/api`)
- Auth: JWT Bearer (`access` + `refresh`). El cliente debe auto-renovar con `/auth/token/refresh/` ante un 401 y reintentar la request original.
- Todos los endpoints requieren `Authorization: Bearer <access_token>` salvo los públicos.

---

## Objetivo

Construir una app **React Native con Expo** que replique la funcionalidad completa de la versión web con las siguientes diferencias de UX:

1. **Pantalla principal = Chat del día actual.** Al abrir la app el usuario ve directamente el chat de hoy. El historial de conversaciones de días anteriores NO se muestra en la pantalla de chat; el chat sólo muestra la sesión del día.
2. **Navegación por tab bar inferior** en lugar de barra lateral. Cuatro tabs: Chat, Progreso, Historial, Perfil.
3. Todos los elementos que en web son paneles laterales o bottom-sheets (Dashboard, Registros del día) pasan a ser **bottom sheets nativos** accesibles desde el chat.
4. Diseño oscuro coherente con la web: fondo `#0a0a0f`, acentos violeta `#7c3aed` / `#8b5cf6`.

---

## Stack requerido

| Paquete | Propósito |
|---|---|
| `expo` ~52 | Framework base |
| `expo-router` ~4 | Navegación basada en archivos (file-based routing) |
| `@gorhom/bottom-sheet` | Bottom sheets nativos (Registros, Dashboard móvil) |
| `@tanstack/react-query` ^5 | Fetching y caché de datos |
| `zustand` ^5 | Estado global (auth, sesión activa, progreso diario) |
| `axios` ^1 | Cliente HTTP con interceptores JWT |
| `react-hook-form` + `zod` | Formularios con validación |
| `react-native-reanimated` ^3 | Animaciones (requerido por bottom-sheet) |
| `react-native-gesture-handler` ^2 | Gestos (requerido por bottom-sheet) |
| `react-native-svg` | Anillos SVG de macros (igual que en web) |
| `date-fns` ^4 | Formateo de fechas |
| `@react-native-async-storage/async-storage` | Persistencia de tokens JWT |
| `expo-secure-store` | Almacenamiento seguro de tokens (preferir sobre AsyncStorage para secrets) |
| `react-native-gifted-chat` o implementación propia | Opcional; se recomienda implementación propia para control total |

> Inicializar con: `npx create-expo-app fitness-chat-mobile --template blank-typescript`

---

## Estructura de archivos

```
fitness-chat-mobile/
├── app/
│   ├── _layout.tsx              # Root layout: QueryClient, GestureHandler, BottomSheetModalProvider, auth guard
│   ├── (auth)/
│   │   └── index.tsx            # Login + Registro (pantalla única con tabs)
│   └── (tabs)/
│       ├── _layout.tsx          # Tab bar: Chat | Progreso | Historial | Perfil
│       ├── index.tsx            # Tab Chat → <ChatScreen />
│       ├── progress.tsx         # Tab Progreso → <ProgressScreen />
│       ├── history.tsx          # Tab Historial → <HistoryScreen />
│       └── profile.tsx          # Tab Perfil → <ProfileScreen />
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatBubble.tsx       # Burbuja de mensaje (user / assistant)
│   │   │   ├── ChatInput.tsx        # Barra de entrada con botón enviar
│   │   │   ├── TypingIndicator.tsx  # Tres puntos animados
│   │   │   └── MessageCard.tsx      # Card especial cuando el mensaje contiene extracted_data
│   │   ├── progress/
│   │   │   ├── MacroRing.tsx        # Anillo SVG animado (react-native-svg + Reanimated)
│   │   │   ├── CalorieBar.tsx       # Barra horizontal calorías consumidas vs objetivo
│   │   │   ├── MealSection.tsx      # Lista de comidas agrupadas por tipo
│   │   │   └── ExerciseSection.tsx  # Lista de ejercicios del día
│   │   ├── entries/
│   │   │   ├── EntriesBottomSheet.tsx  # Bottom sheet: listado comidas + ejercicios con delete
│   │   │   └── EntryItem.tsx           # Ítem individual con swipe-to-delete
│   │   ├── history/
│   │   │   ├── CaloriesBarChart.tsx    # Gráfica de barras (react-native-svg charts o Victory Native)
│   │   │   ├── MacrosAreaChart.tsx     # Gráfica de área macros
│   │   │   └── DayDetailCard.tsx       # Tarjeta expandible por día
│   │   ├── profile/
│   │   │   ├── PersonalDataSection.tsx
│   │   │   ├── FitnessGoalSection.tsx
│   │   │   ├── NutritionTargetsDisplay.tsx
│   │   │   └── DeleteAccountModal.tsx
│   │   └── ui/
│   │       ├── Screen.tsx           # SafeAreaView + KeyboardAvoidingView wrapper
│   │       ├── GlassCard.tsx        # Tarjeta con fondo semitransparente y blur
│   │       ├── Badge.tsx
│   │       └── Spinner.tsx
│   ├── hooks/
│   │   ├── useChat.ts               # Envía mensaje, maneja estado isTyping, actualiza store
│   │   ├── useDailyProgress.ts      # Polling 30s a /dashboard/today/
│   │   ├── useLogManager.ts         # Queries comidas/ejercicios; deleteMeal/deleteExercise
│   │   └── useProfile.ts            # GET/PUT /profile/ con recálculo TDEE
│   ├── services/
│   │   └── api.ts                   # Axios instance + interceptores JWT con auto-refresh
│   ├── stores/
│   │   └── useAppStore.ts           # Zustand: user, tokens, dailyProgress, messages, UI state
│   ├── types/
│   │   └── index.ts                 # Mismas interfaces TypeScript que en la web
│   └── constants/
│       ├── colors.ts                # Paleta de colores del design system
│       └── layout.ts                # Spacing, border radius, font sizes
├── .env                             # EXPO_PUBLIC_API_BASE_URL=http://...
└── app.json
```

---

## Pantallas y comportamiento detallado

### 1. Pantalla de autenticación — `(auth)/index.tsx`

- Pantalla única con dos tabs: **Iniciar sesión** / **Crear cuenta**.
- **Login**: campos email + password. POST `/auth/login/`. Guarda `access` y `refresh` en `expo-secure-store`. Redirige a `/(tabs)/`.
- **Registro**: campos first_name, email, password. POST `/auth/register/`. Si el registro devuelve tokens, hacer login directo; si no, redirigir a login.
- Validación con Zod: email válido, password ≥ 8 caracteres.
- Mostrar errores inline bajo cada campo.
- Botón de acción con estado loading (spinner).

### 2. Tab Chat — `(tabs)/index.tsx` → `<ChatScreen />`

**Comportamiento fundamental:** muestra únicamente la sesión del día actual. Al iniciar la app, llama a `GET /chat/sessions/today/` para obtener el `session_id` del día y luego `GET /chat/sessions/<id>/messages/` para cargar el historial de mensajes de hoy. Si no existe sesión del día, el chat aparece vacío con el mensaje de bienvenida.

**Layout:**
```
┌─────────────────────────────┐
│  [≡]  NutriCoach  [📋 N]   │  ← Header: hamburger menu (izq), nombre + estado, botón registros (der)
├─────────────────────────────┤
│                             │
│   [Bienvenido si vacío]     │
│                             │
│   ● Burbuja usuario         │
│   ● Burbuja asistente       │
│   ● ... typing indicator    │
│                             │
├─────────────────────────────┤
│  [      Escribe...    ] [▶] │  ← ChatInput pegado al teclado
└─────────────────────────────┘
```

**Header:**
- Ícono izquierdo (≡ hamburger): abre un **Drawer lateral** (usando `expo-router` Drawer o un componente propio) que contiene: avatar del usuario, nombre, email, separador, links a Progreso / Historial / Perfil / Cerrar sesión. Sirve como menú alternativo al tab bar para acceso rápido.
- Centro: nombre "NutriCoach" con ícono ✨, subtítulo "Escribiendo..." o "En línea".
- Ícono derecho 📋: badge con número total de entradas del día. Al tocar abre `<EntriesBottomSheet />`.

**Burbujas de mensaje:**
- Mensajes del usuario: alineados a la derecha, fondo violeta `#7c3aed`, texto blanco.
- Mensajes del asistente: alineados a la izquierda, fondo `#1a1a2e`, texto blanco.
- Si el mensaje tiene `extracted_data` con comidas o ejercicios, renderizar debajo de la burbuja un `<MessageCard />` con el listado de ítems extraídos (nombre, calorías).
- Scroll automático al último mensaje al recibir uno nuevo.

**ChatInput:**
- `TextInput` multilinea (máx 4 líneas) que crece con el contenido.
- Botón enviar deshabilitado mientras `isTyping === true`.
- `KeyboardAvoidingView` para que el input suba con el teclado.
- Al enviar: POST `/chat/message/` con `{ content: string }`. Muestra `<TypingIndicator />` mientras espera respuesta. Al recibir respuesta, invalidar caché de `useDailyProgress` y `useLogManager`.

**EntriesBottomSheet (`@gorhom/bottom-sheet`):**
- Se abre desde el botón 📋 del header.
- `snapPoints`: `['50%', '85%']`.
- Dos secciones: 🍽 Comidas y 🏋 Ejercicios del día.
- Cada ítem muestra nombre, tipo, calorías, y un botón 🗑 para borrar (con confirmación `Alert.alert`).
- Al borrar llama a DELETE `/nutrition/meal/<id>/` o DELETE `/exercise/log/<id>/` y actualiza el store.

### 3. Tab Progreso — `(tabs)/progress.tsx` → `<ProgressScreen />`

Esta pantalla es la versión a pantalla completa del `DashboardPanel` de la web.

**Layout:**
```
┌─────────────────────────────┐
│  Progreso de hoy            │
│  [fecha actual]             │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │  🔥 Calorías netas   │   │
│  │  [Barra de progreso] │   │
│  │  consumidas / obj    │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │  Macronutrientes     │   │
│  │  [Ring] [Ring] [Ring]│   │
│  │  Prot.  Carbs  Grasa │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │  🍽 Comidas de hoy   │   │
│  │  (lista agrupada)    │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │  🏋 Ejercicio hoy    │   │
│  │  (lista)             │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

- Datos desde `useDailyProgress` (polling cada 30s).
- `MacroRing`: implementar con `react-native-svg` → `<Circle>` con `strokeDasharray` + `strokeDashoffset`. Animar con `Reanimated.useSharedValue` interpolando de 0 al valor final en 1s.
- Si calorías superan el objetivo, el anillo de calorías cambia a rojo/ámbar (mismo criterio que en web: >20% exceso = rojo).
- `RefreshControl` en el `ScrollView` para pull-to-refresh.

### 4. Tab Historial — `(tabs)/history.tsx` → `<HistoryScreen />`

Equivalente a `HistoryPage` de la web.

**Filtros:**
- Segmented control nativo (o botones estilizados): **Semana** (7d) | **Mes** (30d) | **Personalizado** (date pickers).
- Para "Personalizado" usar `@react-native-community/datetimepicker` o `expo-date-picker`.

**Gráficas:**
- Usar `victory-native` ^41 (compatible con Reanimated 3) o `react-native-gifted-charts`.
- Gráfica de barras: calorías por día, barra objetivo como `ReferenceLine`.
- Barras en dos colores: violeta para calorías dentro del objetivo, rojo para exceso.
- Gráfica de área: proteínas / carbos / grasas apiladas (mismos colores que en web: `#8b5cf6`, `#3b82f6`, `#f59e0b`).

**Cards por día:**
- Lista de `<DayDetailCard />` debajo de las gráficas.
- Cada card expandible: al tocar muestra lista de comidas y ejercicios de ese día.
- Indicador: ✓ verde si alcanzó el objetivo calórico, ✗ rojo si no.

**Resumen del período (mismo que web):**
- Promedio calórico, días registrados, racha de días.

### 5. Tab Perfil — `(tabs)/profile.tsx` → `<ProfileScreen />`

- Datos actuales del usuario con opción de editar.
- Secciones:
  - **Datos personales**: edad, género, peso (kg), altura (cm).
  - **Objetivo fitness**: selector entre weight_loss / muscle_gain / body_recomposition / maintenance / athletic_performance.
  - **Nivel de actividad**: sedentary / light / moderate / active / very_active.
  - **Objetivos nutricionales** (solo lectura, calculados automáticamente): calorías, proteínas, carbos, grasas.
  - **Zona horaria**: texto simple (no editable en mobile por ahora).
- Formulario con `react-hook-form` + Zod. Botón "Guardar cambios" → PUT `/profile/`.
- Al guardar exitosamente: mostrar toast/snackbar de confirmación y actualizar el store.
- **Estadísticas**: sección con `GET /profile/stats/` → muestra racha de días y promedio calórico 7 días.
- **Eliminar cuenta**: botón rojo al final → `<DeleteAccountModal />` con confirmación de contraseña → DELETE `/auth/delete-account/` → logout y redirect a auth.
- **Cerrar sesión**: botón en la parte inferior. POST `/auth/logout/`, limpiar tokens del secure store, resetear store y navegar a `/(auth)`.

---

## Tipos TypeScript compartidos

Usar las mismas interfaces que en la web (copiar directamente de `frontend/src/types/index.ts`):

```typescript
// src/types/index.ts
export interface ExtractedFood { name: string; quantity_grams?: number; quantity_description?: string; meal_type?: string; calories_estimated: number; protein_g: number; carbs_g: number; fat_g: number; confidence?: string }
export interface ExtractedExercise { name: string; exercise_type?: string; duration_minutes?: number; intensity?: string; calories_burned_estimated?: number; calories_burned?: number; notes?: string }
export interface ExtractedData { extracted_foods?: ExtractedFood[]; extracted_exercises?: ExtractedExercise[] }
export interface User { id: number; first_name: string; email: string; profile?: UserProfile }
export interface UserProfile { age: number; gender: string; weight_kg: number; height_cm: number; goal: string; activity_level: string; daily_calorie_target: number; protein_target_g: number; carbs_target_g: number; fat_target_g: number; }
export interface MealLog { id?: number; name: string; meal_type?: string; calories: number; protein_g?: number; carbs_g?: number; fat_g?: number; quantity_description?: string; occurred_at?: string; created_at?: string }
export interface ExerciseLog { id?: number; name: string; duration_minutes?: number; calories_burned: number; exercise_type?: string; intensity?: string; notes?: string; occurred_at?: string; created_at?: string }
export interface ChatMessage { id?: number; role: 'user' | 'assistant'; content: string; message_type?: string; created_at?: string; extracted_data?: ExtractedData }
export interface DailyProgress { caloriesConsumed: number; caloriesBurned: number; netCalories: number; calorieTarget: number; progressPct: number; proteinG: number; carbsG: number; fatG: number; mealsLogged: MealLog[]; exercisesLogged: ExerciseLog[] }
export interface DayHistory { date: string; calories_consumed: number; calories_burned: number; net_calories: number; calorie_target: number; progress_pct: number; protein_g: number; carbs_g: number; fat_g: number; meals_count: number; exercises_count: number }
export interface PeriodSummary { avg_calories: number; registered_days: number; total_days: number; streak_days: number }
```

---

## Servicio API — `src/services/api.ts`

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
});

// Adjuntar access token en cada request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh en 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
      }
      isRefreshing = true;
      try {
        const refresh = await SecureStore.getItemAsync('refresh_token');
        const { data } = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/token/refresh/`, { refresh });
        await SecureStore.setItemAsync('access_token', data.access);
        failedQueue.forEach((p) => p.resolve(data.access));
        failedQueue = [];
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (e) {
        failedQueue.forEach((p) => p.reject(e));
        failedQueue = [];
        // Limpiar tokens y forzar logout (emitir evento o actualizar store directamente)
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Store Zustand — `src/stores/useAppStore.ts`

```typescript
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, DailyProgress, ChatMessage, MealLog, ExerciseLog } from '../types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;

  // Chat
  currentSessionId: number | null;
  currentSessionMessages: ChatMessage[];
  isAiTyping: boolean;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setIsAiTyping: (v: boolean) => void;
  setCurrentSessionId: (id: number | null) => void;

  // Daily progress
  dailyProgress: DailyProgress;
  setDailyProgress: (p: DailyProgress) => void;

  // Today's logs
  todayMeals: MealLog[];
  todayExercises: ExerciseLog[];
  setTodayMeals: (m: MealLog[]) => void;
  setTodayExercises: (e: ExerciseLog[]) => void;

  // UI
  showEntries: boolean;
  toggleEntries: () => void;
}
```

Persistir `user` y tokens usando `SecureStore` (fuera del store de Zustand, gestionar en la capa de auth).

---

## Paleta de colores — `src/constants/colors.ts`

```typescript
export const colors = {
  background: '#0a0a0f',
  surface900: '#111118',
  surface800: '#1a1a2e',
  surface100: '#a0a0b0',
  brand500: '#7c3aed',
  brand600: '#6d28d9',
  brand400: '#8b5cf6',
  white: '#ffffff',
  red400: '#f87171',
  amber400: '#fbbf24',
  green400: '#4ade80',
  orange400: '#fb923c',
  blue400: '#60a5fa',
  // Macros
  protein: '#8b5cf6',
  carbs: '#3b82f6',
  fat: '#f59e0b',
};
```

---

## Navegación — `app/(tabs)/_layout.tsx`

```tsx
import { Tabs } from 'expo-router';
import { MessageSquare, TrendingUp, History, User } from 'lucide-react-native';
import { colors } from '../../src/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.surface900, borderTopColor: 'rgba(255,255,255,0.05)' },
        tabBarActiveTintColor: colors.brand400,
        tabBarInactiveTintColor: colors.surface100,
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Chat', tabBarIcon: ({ color }) => <MessageSquare color={color} size={22} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progreso', tabBarIcon: ({ color }) => <TrendingUp color={color} size={22} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Historial', tabBarIcon: ({ color }) => <History color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
```

---

## Root layout — `app/_layout.tsx`

```tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../src/stores/useAppStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated, setUser } = useAppStore();
  const router = useRouter();
  const segments = useSegments();

  // Auth guard: redirigir según estado de autenticación
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

---

## Comportamiento específico del chat (regla del día actual)

- Al montar `<ChatScreen />`: llamar `GET /chat/sessions/today/`.
  - Si devuelve sesión (status 200): guardar `session_id` en store, llamar `GET /chat/sessions/<id>/messages/` y cargar mensajes en store.
  - Si devuelve 404 o array vacío: el chat inicia en blanco, la sesión se creará automáticamente al enviar el primer mensaje (el backend lo hace en `POST /chat/message/`).
- **No mostrar** un selector de fechas ni sesiones anteriores en la pantalla de chat. El historial de otros días está exclusivamente en el tab "Historial".
- Al medianoche (cambio de día), si la app está abierta, la siguiente request al chat detectará automáticamente la nueva sesión del día.
- Al navegar fuera del tab de chat y volver, re-fetchear los mensajes de hoy (no persistir en memoria entre sesiones de app).

---

## Drawer lateral (menú hamburger)

Implementar como `expo-router` Drawer o como un componente propio con `Animated.Value` + `TouchableWithoutFeedback` para overlay.

**Contenido del drawer:**
```
┌────────────────────────┐
│  ✨ FitnessChat        │
├────────────────────────┤
│  [Avatar] Nombre       │
│           email        │
├────────────────────────┤
│  💬  Chat              │
│  📈  Progreso          │
│  📅  Historial         │
│  👤  Perfil            │
├────────────────────────┤
│  🚪  Cerrar sesión     │
└────────────────────────┘
```

---

## Consideraciones de implementación

1. **SafeAreaView** en todas las pantallas para respetar notch/island en iOS y barra de estado en Android.
2. **KeyboardAvoidingView** en `ChatScreen` con `behavior="padding"` en iOS y `"height"` en Android.
3. **`FlatList` en lugar de `ScrollView`** para la lista de mensajes del chat, con `inverted` si se prefiere orden invertido, o con `ref` para scroll automático al final.
4. El `TextInput` del chat debe tener `returnKeyType="send"` y manejar `onSubmitEditing` sólo si `blurOnSubmit={false}` para multilinea.
5. Todas las requests deben manejar estados de error visibles: mostrar un `Alert.alert` o un banner de error inline.
6. **No duplicar la lógica de extracción de datos del AI**: el backend ya hace todo el procesamiento; el mobile sólo envía el texto y renderiza la respuesta.
7. Usar `useFocusEffect` de `@react-navigation/native` (o el equivalente de expo-router) para refrescar datos cuando el tab recibe foco.

---

## Variables de entorno

```env
# .env (en la raíz del proyecto mobile)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.X:8000/api
```

> Usar la IP local de la máquina donde corre el backend (no `localhost` desde el dispositivo físico).

---

## Comandos de inicio del proyecto

```bash
npx create-expo-app fitness-chat-mobile --template blank-typescript
cd fitness-chat-mobile
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-secure-store @react-native-async-storage/async-storage
npm install @gorhom/bottom-sheet @tanstack/react-query zustand axios \
  react-hook-form zod @hookform/resolvers react-native-reanimated \
  react-native-gesture-handler react-native-svg date-fns lucide-react-native \
  victory-native
```

Configurar `babel.config.js` para `expo-router` y `react-native-reanimated`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};
```

Configurar `app.json`:

```json
{
  "expo": {
    "scheme": "fitnesschat",
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```
