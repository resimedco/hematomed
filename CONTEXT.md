# Hematomed — Contexto del proyecto

## Qué es
PWA de docencia médica en Hematología y Oncología basada en MKSAP 18.
Usuarios: médicos residentes, docentes, universidades.
Desarrollador: médico general, vibe coding, sin equipo técnico.

## Stack
- Vite + React + TypeScript
- Tailwind CSS (solo utilities)
- Claude API claude-sonnet-4-6
- localStorage para persistencia
- vite-plugin-pwa para manifest y service worker

## Tokens de diseño (NO negociables)
navy: #0F1B2D | crimson: #8B1A2E | gold: #C9A84C
bg: #F7F5F2 | surface: #FFFFFF
Fuente UI: Inter | Fuente marca: Crimson Pro
Iconos: @tabler/icons-react

## Arquitectura de carpetas
src/
  components/   → UI reutilizable
  screens/      → Home, Quiz, Flash, Stats, Tutor, Profile
  hooks/        → useStats.ts, useTheme.ts, useClaudeAPI.ts
  data/         → temas.ts
  lib/          → claudeClient.ts
  types/        → index.ts

## Reglas de diseño
- App shell: 100dvh, overflow hidden, solo scroll-area hace scroll
- Bottom navigation fija con 5 tabs
- No efectos hover, solo :active (app táctil)
- No librerías de componentes (MUI, Bootstrap, Shadcn) — todo desde cero con Tailwind