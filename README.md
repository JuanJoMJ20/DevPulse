# DevPulse — Dashboard adaptativo de productividad y bienestar para desarrolladores

**DevPulse** es una aplicación de escritorio para Windows construida con **Electron**, **React 19**, **TypeScript** y **Tailwind CSS 4** que mide la carga cognitiva del desarrollador en tiempo real a partir de señales reales del sistema operativo (cambios de ventana activa con `user32.dll`/`kernel32.dll` vía `koffi`, tiempo sin pausas y ritmo/correcciones de tecleo vía `uiohook-napi`) y reorganiza automáticamente la interfaz para proteger el foco.

---

## Características principales

- **Motor de carga cognitiva y modelo personal de IA (`electron/signals.cjs` y `electron/model.cjs`)**:
  - Evalúa 4 factores en vivo (`fragmentation`, `noBreak`, `corrections`, `rhythm`) sin registrar nunca el contenido de lo que se escribe.
  - Entrena localmente un modelo de **regresión logística** con regularización L2 a partir de los check-ins del usuario (1 a 5).
- **Interfaz adaptativa con histéresis (`src/config/layout.ts` y `src/hooks/useStressEngine.ts`)**:
  - **Carga Baja (`Vista densa`)**: 4 columnas con todos los paneles visibles.
  - **Carga Media (`Vista equilibrada`)**: 3 columnas priorizando tareas, métricas, notas y bloqueador.
  - **Carga Alta (`Enfoque Absoluto`)**: 2 columnas conservando únicamente el temporizador Pomodoro y el bloc de foco.
- **Bloqueador de contexto real (`electron/blocker.cjs`)**:
  - Cierra automáticamente aplicaciones distractoras configuradas por el usuario mientras el bloqueador está armado, protegiendo procesos críticos del sistema.
- **Cuentas locales cifradas (`electron/auth.cjs`)**:
  - Contraseñas derivadas con `scrypt` y sal aleatoria, manteniendo configuraciones, tareas y pesos del modelo aislados por usuario en `%APPDATA%\DevPulse`.

---

## Ejecución y empaquetado

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (Vite + Electron)
npm run dev

# Generar instalador para Windows (release/DevPulse.exe)
npm run dist
```
