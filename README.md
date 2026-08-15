# App de Control de Uso — Redes Sociales

App móvil (Android + iOS) para ayudar a reducir el consumo compulsivo de contenido de formato corto (Reels, TikTok, Shorts) mediante límites, bloqueos temporales y seguimiento de progreso sin culpabilizar al usuario.

## Estado actual

Este repo contiene por ahora el **modelo de datos** (esquema SQLite + tipos TypeScript), base para el desarrollo de la app. El resto del proyecto (UI, lógica nativa de bloqueo, etc.) se añadirá por fases.

## Estructura

```
app-control-redes/
├── database/
│   └── schema.sql        # Esquema SQLite (fuente de verdad de la BD local)
├── src/
│   └── models/
│       └── types.ts      # Interfaces TypeScript equivalentes al esquema
└── README.md
```

## Notas técnicas clave

- **Todo el tracking de uso vive en el dispositivo** (SQLite local), no en un servidor, salvo que en el futuro se active sincronización premium opt-in.
- **iOS**: el bloqueo/seguimiento se implementará con la Screen Time API de Apple (`FamilyControls`, `DeviceActivity`, `ManagedSettings`). Esta API usa *tokens opacos* — la app nunca ve el nombre real de la app seleccionada ni tiempo de uso en vivo, solo umbrales configurados de antemano. El campo `app_identifier` en iOS guarda ese token, no un nombre.
- **Android**: se usará `UsageStatsManager` para medir tiempo de uso y `AccessibilityService` + overlay para el bloqueo en tiempo real. Requiere justificar el permiso de Accesibilidad en el listing de Google Play.

## Próximos pasos

1. Inicializar el proyecto Expo/React Native (`npx create-expo-app`).
2. Implementar la capa de acceso a datos (SQLite) usando estos tipos.
3. Módulo nativo Android: `UsageStatsManager` + `AccessibilityService`.
4. Módulo nativo iOS: `FamilyControls` + `DeviceActivity` (requiere entitlement especial de Apple).
5. Onboarding + Dashboard (UI).

## Cómo subir esto a GitHub

```bash
cd app-control-redes
git init
git add .
git commit -m "Modelo de datos inicial: esquema SQLite + tipos TypeScript"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

(Sustituye la URL del remote por la de tu repositorio real una vez lo crees en GitHub.)
