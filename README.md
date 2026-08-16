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
- **iOS**: el bloqueo/seguimiento se implementará con la Screen Time API de Apple (`FamilyControls`, `DeviceActivity`, `ManagedSettings`). Esta API usa _tokens opacos_ — la app nunca ve el nombre real de la app seleccionada ni tiempo de uso en vivo, solo umbrales configurados de antemano. El campo `app_identifier` en iOS guarda ese token, no un nombre.
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

## Estado actual (15 ago 2026)

App corriendo nativa en emulador Android, con SQLite conectado (`schema.sql` + `types.ts` + `db.ts`) mostrando datos de ejemplo en el dashboard (`src/app/index.tsx`).

### Configuración de entorno que costó resolver (por si hay que repetir en otra máquina)

- `JAVA_HOME` apunta al JDK incluido en Android Studio: `C:\Program Files\Android\Android Studio\jbr`
- **Gradle usa un JDK aparte**: JDK 17 (Microsoft Build), configurado en `android/gradle.properties` con `org.gradle.java.home=C:\\Program Files\\Microsoft\\jdk-17.0.20.8-hotspot`. El JDK 25 (jbr) causa el error `WARNING: A restricted method in java.lang.System has been called` en tareas de CMake (react-native-worklets, react-native-screens).
- `ANDROID_HOME`: `C:\Users\pablo\AppData\Local\Android\Sdk`
- Windows Hypervisor Platform + Virtual Machine Platform habilitados, y virtualización (Intel VT-x) activada en la BIOS (Lenovo, tecla F2).
- Emulador con RAM limitada a 1536–2048 MB por el total de 8GB de la máquina.
- La vista web (`npx expo start` → `w`) **no funciona** por un error de resolución del módulo `wa-sqlite.wasm` en `expo-sqlite` — limitación conocida, no afecta Android/iOS nativos. No vale la pena perseguir el arreglo.
- Repo: `github.com/Pablo-Forte/appEnough`

## Hoja de ruta hacia el MVP

1. **Datos reales de uso (Android)** — implementar `UsageStatsManager` (módulo nativo Kotlin), reemplazar `seedDemoData()` por datos reales en `usage_sessions`, gestionar el permiso `PACKAGE_USAGE_STATS`.
2. **Sistema de bloqueo (Android)** — `AccessibilityService` para detectar apertura de apps trackeadas + overlay de pantalla de bloqueo. Cuidado: Google Play revisa de cerca el uso de este permiso.
3. **Onboarding real** — las 5 pantallas (percepción de tiempo, selección de apps, objetivo, límites, comportamiento al bloquear), conectadas a `users` y `tracked_apps`.
4. **Dashboard completo** — barras circulares de progreso, sección "Tiempo recuperado" (semana actual vs. anterior).
5. **Rachas y estadísticas** — cálculo diario de racha, vista semanal usando `usage_sessions`.
6. **Modo concentración** — bloqueo manual por tiempo definido, no depende de detectar apps de terceros, es la función más simple de implementar 100%.
7. **iOS** — solicitar el entitlement `Family Controls` a Apple (tarda, conviene pedirlo en paralelo), adaptar el modelo a los tokens opacos de Screen Time API.

**Siguiente paso recomendado:** punto 1 (`UsageStatsManager`), porque el resto (dashboard, rachas, tiempo recuperado) necesita datos reales para tener sentido.
