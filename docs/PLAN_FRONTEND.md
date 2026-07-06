# Plan de Migración: Frontend Web → Mobile-aligned

## Objetivo

Replicar las funcionalidades, flujos y estilos del frontend mobile (`fitness-chat-mobile`) en el frontend web actual (`fitness-chat/frontend`), manteniendo el formulario de registro completo existente.

---

## Consideraciones Responsive (aplican a todas las fases)

Este frontend web debe verse bien en **escritorio, tablet y móvil**. El mobile (React Native) siempre es full-screen portrait; acá necesitamos adaptar layouts con Tailwind responsive utilities (`sm:`, `md:`, `lg:`).

### Breakpoints

| Rango | Dispositivo | Estrategia de layout |
|---|---|---|
| `< 640px` | Móvil | Bottom tab bar + hamburger menu. Sin sidebar fija. Drawer full-width. Bottom sheets modales. |
| `640px - 1024px` | Tablet | Sidebar colapsable (íconos sin texto) o hamburger. Layout híbrido. |
| `>= 1024px` | Escritorio | Sidebar fija visible + main area. Drawer como overlay lateral. Dashboard/progress como página. |

### Patrones responsive compartidos

- **Navegación móvil**: 4 tabs inferiores con íconos (Chat, Progreso, Tendencias, Perfil), exactamente como el mobile.
- **Navegación desktop**: Sidebar izquierda con textos + íconos (Chat, Historial, Perfil). Progreso es una ruta más.
- **Bottom sheets**: En móvil, los paneles modales (entries, drawer) deben ocupar full-width con overlay. En desktop pueden ser sidebars flotantes.
- **Cards**: En móvil usan todo el ancho disponible. En desktop pueden tener `max-w` para no estirarse.
- **Chat**: En móvil el input y chips están fijos al fondo. En desktop pueden estar en la parte inferior del área de chat.
- **Gestos**: En desktop no hay swipe; todo es click/tap. Drawer se abre con botón hamburger en todos los tamaños.

---

## Fase 0 — Paleta de Colores y Estilos Base

**Cambiar del tema dark green al tema light blue del mobile.**

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `frontend/tailwind.config.ts` | Reemplazar paleta `brand` (verde → azul) y `surface` (oscuro → claro) |
| `frontend/src/index.css` | Reemplazar `.glass`, `.glow-*`, `.bg-mesh`, `.noise`, `progress-gradient`, scrollbars para modo claro |

### Consideraciones responsive
- Los estilos base son compartidos en todos los breakpoints.
- Las animaciones/transiciones deben respetar `prefers-reduced-motion`.

### Nueva paleta

```ts
colors: {
  brand: {
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    900: '#1E3A5F',
  },
  surface: {
    50: '#111827',    // Texto principal
    100: '#4B5563',   // Texto secundario
    700: '#9CA3AF',   // Texto placeholder
    800: '#DFE1E5',   // Superficie cards
    850: '#E8EAED',   // Superficie hover
    900: '#F0F2F5',   // Superficie paneles
    950: '#F8F9FA',   // Superficie sutil
  },
  white: '#FFFFFF',
  red:    { 400: '#F87171' },
  amber:  { 400: '#FBBF24' },
  green:  { 400: '#22C55E' },
  orange: { 400: '#FB923C' },
  blue:   { 400: '#60A5FA' },
  border: '#E5E7EB',
}
```

### Nuevo index.css
- `background: #FFFFFF` (body)
- `color: #111827` (texto)
- `.glass` → fondo blanco semi-transparente con border `#E5E7EB`
- `.glow-card` → sombra sutil `rgba(0,0,0,0.06)`
- Sin `.bg-mesh`, sin `.noise`, sin gradientes verdes
- Scrollbar delgada oscura sobre fondo claro

---

## Fase 1 — API Service y Store

**Alinear la conexión al backend con el mobile.**

### `services/api.ts`
- Renombrar keys de localStorage: `fc_access` → `access_token`, `fc_refresh` → `refresh_token`
- Coincidir con mobile para que sea compatible

### `stores/useAppStore.ts` — Añadir

| Prop/Método | Descripción |
|---|---|
| `sessions: ChatSession[]` | Lista de sesiones del usuario |
| `setSessions(sessions)` | Setter |
| `currentSessionId: number \| null` | Sesión activa |
| `setCurrentSessionId(id)` | Setter |
| `isAiTyping: boolean` | Ya existe |
| `updateMessage(index, updates)` | Actualizar un mensaje por índice (útil para scan) |
| `loadSessionMessages(sessionId)` | Cargar mensajes de una sesión específica |

### Endpoints a actualizar

| Actual | Nuevo |
|---|---|
| `GET /auth/me/` | `GET /profile/` |
| `GET /nutrition/today/` | `GET /nutrition/meals/today/` |
| `GET /exercise/today/` | `GET /exercise/logs/today/` |

### Endpoints nuevos a agregar

| Endpoint | Uso |
|---|---|
| `POST /chat/scan/` (multipart) | Escanear etiqueta nutricional |
| `GET /chat/sessions/today/` | Obtener sesión del día |
| `GET /chat/sessions/:id/messages/` | Cargar mensajes de sesión |
| `POST /auth/logout/` | Logout (backend) |
| `DELETE /auth/delete-account/` | Eliminar cuenta |

---

## Fase 2 — AuthPage (Login/Registro)

**Rediseñar manteniendo el formulario de registro completo.**

### Layout
- Fondo blanco, sin `bg-mesh`
- Panel izquierdo branding: icono azul, título, descripción (modo claro)
- Panel derecho con el formulario

### Consideraciones responsive
- **Desktop (`>=1024px`)**: Dos columnas: 50% branding + 50% formulario.
- **Tablet/móvil (`<1024px`)**: Una sola columna. Branding solo como logo + título compacto arriba. Formulario ocupa todo el ancho con padding.

### Toggle (Registro / Iniciar sesión)
- Usar el mismo estilo de tabs del mobile: fondo `#F0F2F5`, tab activo azul `#3B82F6`, texto blanco
- Misma estructura visual que mobile (pill-shaped tabs)

### Formularios
- **Login**: email + password (estilo mobile: input con borde `#E5E7EB`, border-radius `xl`, fondo `#DFE1E5`)
- **Registro**: mantener campos actuales (name, email, password, age, gender, weight_kg, height_cm, goal, activity_level) pero con el nuevo estilo visual azul claro
- En móvil: inputs en vertical (1 columna). En desktop: grids de 2 columnas para campos cortos (edad/género, peso/altura).

### Submit button
- Fondo `#3B82F6`, border-radius `xl`, texto blanco bold, full-width en todos los tamaños
- Loading state con spinner

---

## Fase 3 — MainLayout (Sidebar + Navegación)

**Rediseñar con la paleta azul claro y navegación responsive.**

### Consideraciones responsive

| Breakpoint | Sidebar | Navegación principal |
|---|---|---|
| `>=1024px` | Fija, 240px de ancho. Visible siempre. | Links con texto + icono en la sidebar. |
| `640px - 1024px` | Colapsable: hamburger toggle, overlay, 240px. O íconos sin texto (60px). | Nav items solo íconos, tooltip opcional. |
| `<640px` | Oculta. Reemplazada por **bottom tab bar** fija. | 4 tabs inferiores: Chat, Progreso, Tendencias, Perfil. |

### Sidebar (desktop)
- Fondo `#F0F2F5`, borde derecho `#E5E7EB`
- Logo: icono `Sparkles` con bg azul `#3B82F6`
- Nav items: 4 (Chat, Progreso, Historial, Perfil) — se añade "Progreso" como ruta nueva
  - Inactive: texto `#4B5563`
  - Active: bg `#3B82F6/10` + texto `#3B82F6`
- User section: avatar circular con inicial, nombre
- Logout: texto `#4B5563`, hover `#F87171`

### Bottom tab bar (móvil)
- Fondo `#F0F2F5`, borde superior `#E5E7EB`
- 4 tabs con íconos sin texto (o texto muy pequeño): `MessageSquare` (Chat), `TrendingUp` (Progreso), `BarChart3` (Tendencias), `User` (Perfil)
- Active tint: `#3B82F6`, inactive: `#9CA3AF`
- Misma experiencia que el mobile: al tocar un tab cambia la vista sin recargar
- Uso de React Router con layouts anidados (ruta layout padre decide sidebar vs bottom tabs)

### Main area
- Fondo `#FFFFFF`
- Sin `DashboardPanel` lateral por defecto (se reemplaza con vista de progreso como tab aparte, igual que mobile)

---

## Fase 4 — ChatPage (Chat Principal)

**Replicar el chat del mobile con mode chips y escáner.**

### Consideraciones responsive
- Header, chips, input: siempre visibles en todos los tamaños.
- En móvil: el header es más compacto (menos padding), oculta botón logout (va en el bottom tab o en el profile tab).
- En desktop: el área de mensajes es más amplia, puede tener `max-w-2xl` centrado.

### Header
- Título "✨ NutriCoach"
- Subtítulo "En línea" / "Escribiendo..."
- Botón "Registros" (abre `EntriesPanel`/modal) con badge de count
- Botón logout visible solo en desktop (en móvil está en Profile tab)

### Mode Chips (NUEVO)
- 3 chips: **Comida**, **Ejercicio**, **Preguntar** (iconos: `UtensilsCrossed`, `Activity`, `MessageCircle`)
- Estilo: fondo `#9CA3AF` (inactive), fondo `#3B82F6` (active), texto blanco, pill shape
- El chip activo define el placeholder del input y el `mode` que se envía al backend

### ChatInput (modificado)
- Placeholder dinámico según modo:
  - food: "¿Qué comiste?"
  - exercise: "¿Cómo fue tu ejercicio?"
  - ask: "Pregunta lo que quieras"
- Botón de cámara → `<input type="file" accept="image/*" hidden>` con label/button
- Botón de send (activo solo con texto)
- Fondo `#F0F2F5`

### ChatMessages
- Burbujas user: bg `#3B82F6`, texto blanco, alineadas derecha
- Burbujas assistant: bg `#DFE1E5`, texto `#111827`, alineadas izquierda
- `MessageCard` para datos extraídos (comidas/ejercicios)
- `TypingIndicator` animado

### Empty State
- Icono `Sparkles` azul
- "¡Hola! Soy NutriCoach"
- Texto descriptivo

---

## Fase 5 — useChat Hook + Escáner

**Actualizar hook con soporte de modos, sesiones y escáner.**

### `sendMessage(text, mode)`
- Enviar `POST /chat/message/` con `{ message, mode, session_id }`
- Manejar response: `assistant_message` + invalidar queries

### `sendScan(file)`
- Enviar `POST /chat/scan/` con `FormData` (multipart)
- Soporte para web: convertir File/Blob a FormData
- Timeout extendido (60s)
- Manejar response: actualizar mensaje usuario con `image_uri`, agregar `assistant_message`

### Sesiones
- Al cargar chat: `GET /chat/sessions/today/` → obtener `sessionId`
- Cargar mensajes: `GET /chat/sessions/:id/messages/`
- Drawer con historial de sesiones

---

## Fase 6 — Drawer de Sesiones (NUEVO)

**Drawer lateral para historial de chats.**

### Consideraciones responsive
- **Desktop**: Drawer flotante con overlay, ancho ~320px, mismo comportamiento que mobile.
- **Móvil/tablet**: Drawer ocupa casi todo el ancho (80-100%) con overlay completo. Igual que el mobile.
- En todos los tamaños se abre con el botón hamburger (`Menu`) en el header del chat.

### Implementación
- Slide-in animado desde la izquierda (framer-motion `AnimatePresence`)
- Título "Sesiones"
- Lista de sesiones (fecha, hora)
- "Nuevo chat" button (limpia sesión actual)
- Logout button al final
- Overlay oscuro (`rgba(0,0,0,0.3)`) al abrir, click cierra
- Estilo: fondo `#FFFFFF`, borde derecho `#E5E7EB`, mismo lenguaje visual del mobile

---

## Fase 7 — ProgressPage (Reemplaza DashboardPanel)

**Vista de progreso diario similar al mobile.**

### Consideraciones responsive
- **Desktop**: Layout de 2 columnas: izquierda (calorías + macros) y derecha (comidas + ejercicio). O una columna centrada con `max-w-2xl`.
- **Móvil**: Una columna, scroll vertical. Cards full-width.
- Pull-to-refresh no existe en web; se reemplaza con botón "Recargar" o refetch al focus.

### Layout
- Título "Progreso de hoy"
- Fecha formateada (date-fns, locale español)
- Scroll vertical

### Componentes a crear/adaptar

| Componente | Descripción |
|---|---|
| `CalorieBar` | Barra horizontal animada: consumidas vs target. Rojo si excede, azul si ok |
| `MacroRing` | Anillo SVG de progreso para Proteína (verde), Carbos (azul), Grasas (ámbar) |
| `MealSection` | Lista de comidas agrupadas por tipo, con toggle "Ver más" |
| `ExerciseSection` | Lista de ejercicios con duración, toggle "Ver más" |

### Cards
- Usar fondo `#DFE1E5`, border-radius `lg`, border `#E5E7EB` (mismo estilo `GlassCard` del mobile)

---

## Fase 8 — HistoryPage (Tendencias)

**Rediseñar con paleta clara y navegación semanal tipo mobile.**

### Consideraciones responsive
- **Desktop**: Layout de 2 columnas (barras + resumen a la par) o una columna centrada.
- **Móvil**: Una columna, scroll vertical. Igual que mobile.
- Pull-to-refresh → botón de recargar o refetch automático.

### Layout
- Fondo blanco
- Header con título "Tendencias"
- Navegación semanal: flechas izq/der, label "Semana del X al Y"
- Botón de recargar

### Componentes
- **Daily bars**: barras horizontales por día (rojo si excede, azul si ok), con net/meta
- **Recomendaciones**: cards con badges de color según tipo (proteína baja, carbos altos, etc.)
- **Resumen semanal**: promedio, vs semana anterior, días registrados, racha, macros totales

### Colores
- Barras: `#60A5FA` (ok), `#F87171` (excede)
- Badges recomendaciones: bg con 20% opacidad del color correspondiente
- Texto: `#111827` (principal), `#4B5563` (secundario)

---

## Fase 9 — ProfilePage

**Rediseñar con acordeones como mobile.**

### Consideraciones responsive
- **Desktop**: Una columna centrada con `max-w-xl`. Acordeones lado a lado en grid 2 columnas para tablets grandes.
- **Móvil**: Una columna, scroll vertical, acordeones full-width.
- Avatar y nombre siempre centrados arriba.

### Layout
- Fondo blanco, scroll vertical
- Título "Perfil"
- Avatar circular azul con inicial + nombre + email

### Accordion: "Tus datos"
- Chevron animado (rotación)
- Expandible: muestra `PersonalDataSection` (age, weight_kg, height_cm, gender, goal, activity_level)
- Summary cuando colapsado: "X años · Y kg · Z cm · Objetivo"
- Botón "Guardar cambios" (solo activo si dirty)

### Accordion: "Objetivos nutricionales"
- Expandible: `NutritionTargetsDisplay` (calorías, proteína, carbos, grasas targets)
- Summary cuando colapsado: "Calorías: X · Prot: Yg"

### Settings
- "Cerrar sesión" con icono `LogOut`
- "Eliminar cuenta" con icono `Trash2`, texto rojo

### DeleteAccountModal
- Modal simple: input password + confirmar
- Mismo estilo visual

---

---

## Fase 10 — PWA (Progressive Web App)

**Convertir el frontend en una PWA instalable con soporte offline parcial.**

### Dependencia a agregar

```bash
npm install -D vite-plugin-pwa
```

### Configuración en `vite.config.ts`

Agregar el plugin `VitePWA` con la configuración de manifest y Workbox:

```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'FitnessChat',
        short_name: 'FitnessChat',
        description: 'Tu asistente de nutrición personal con IA',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
});
```

### Assets necesarios

| Archivo | Descripción |
|---|---|
| `public/pwa-192x192.png` | Icono PWA 192x192 (generar desde logo) |
| `public/pwa-512x512.png` | Icono PWA 512x512 (generar desde logo) |

### `index.html` — meta tags adicionales

Agregar dentro de `<head>`:
```html
<meta name="theme-color" content="#3B82F6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="FitnessChat">
<link rel="apple-touch-icon" href="/pwa-192x192.png">
```

### Update prompt (opcional pero recomendado)

En `App.tsx` o componente de layout principal, registrar el evento `swUpdated` para notificar al usuario que hay una nueva versión disponible:

```tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

function PWAUpdater() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 ...">
      Nueva versión disponible.
      <button onClick={() => updateServiceWorker()}>Actualizar</button>
    </div>
  );
}
```

### Alcance offline
- **Assets estáticos**: cacheados automáticamente por Workbox (JS, CSS, HTML, fuentes). La app carga sin conexión.
- **API calls**: `NetworkFirst` — intenta red, si falla usa cache. Las respuestas del historial y dashboard pueden servirse de caché.
- **Auth**: No hay soporte offline para login. El SW redirige al login si no hay token.
- **Chat**: Las consultas de chat no se cachean (son únicas por request). Sin conexión, el input se deshabilita y muestra "Sin conexión".

### Tiempo estimado
- Configuración del plugin + manifest: 1 hora
- Generación de iconos: 30 min
- Update prompt + pruebas: 2 horas
- **Total**: ~4 horas

---

## Resumen de Archivos a Crear vs Modificar

### Archivos NUEVOS

| Archivo | Propósito |
|---|---|
| `src/components/chat/ScanButton.tsx` | Input file wrapper con preview |
| `src/components/chat/ModeChips.tsx` | Chips Comida/Ejercicio/Preguntar |
| `src/components/chat/Drawer.tsx` | Drawer de sesiones |
| `src/components/chat/TypingIndicator.tsx` | Animación "escribiendo..." |
| `src/components/chat/MessageCard.tsx` | Card de datos extraídos (foods/exercises) |
| `src/components/progress/CalorieBar.tsx` | Barra de calorías animada |
| `src/components/progress/MacroRing.tsx` | Anillo SVG de macros |
| `src/components/progress/MealSection.tsx` | Lista de comidas con toggle |
| `src/components/progress/ExerciseSection.tsx` | Lista de ejercicios con toggle |
| `src/components/ui/GlassCard.tsx` | Card container reutilizable |
| `src/pages/ProgressPage.tsx` | Vista de progreso diario |
| `src/components/PWAUpdater.tsx` | Banner de actualización disponible (SW) |
| `public/pwa-192x192.png` | Icono PWA 192x192 |
| `public/pwa-512x512.png` | Icono PWA 512x512 |

### Archivos a MODIFICAR

| Archivo | Cambio principal |
|---|---|
| `tailwind.config.ts` | Paleta azul claro |
| `src/index.css` | Estilos modo claro |
| `src/services/api.ts` | Endpoints, keys localStorage |
| `src/stores/useAppStore.ts` | Sessions, updateMessage, loadSessionMessages |
| `src/hooks/useChat.ts` | Modos, scan, sesiones |
| `src/hooks/useDailyProgress.ts` | Polling 30s |
| `src/App.tsx` | Ruta ProgressPage |
| `src/types/index.ts` | ChatSession, ajustes |
| `src/pages/AuthPage.tsx` | Estilo azul claro, mantener registro completo |
| `src/pages/HistoryPage.tsx` | Estilo azul claro, navegación semanal |
| `src/pages/ProfilePage.tsx` | Acordeones, avatar, estilo claro |
| `src/components/layout/MainLayout.tsx` | Sidebar azul claro, sin DashboardPanel |
| `src/components/chat/ChatPage.tsx` | Mode chips, scan button, drawer |
| `src/components/chat/ChatInput.tsx` | Placeholder dinámico, botón cámara |
| `src/components/chat/ChatMessage.tsx` | Colores claros |
| `src/components/dashboard/DashboardPanel.tsx` | Eliminar o convertir a ProgressPage |
| `src/components/profile/*` | Estilo azul claro |
| `src/constants/profileConstants.ts` | Ajustar colores si aplica |
| `vite.config.ts` | Agregar plugin `vite-plugin-pwa` |
| `index.html` | Meta tags PWA (theme-color, apple-touch-icon, etc.) |
