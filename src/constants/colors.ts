// src/constants/colors.ts
//
// Paleta "Enough" v3: dark-first, carbón (no negro puro), un solo
// acento con valor funcional. Colores de estado solo cuando aportan
// significado real (bloqueo, advertencia).

export const colors = {
  background: "#0E1113", // carbón, no negro absoluto
  surface: "#171B1E", // primer nivel de profundidad
  surfaceElevated: "#20262A", // segundo nivel (tarjetas activas/seleccionadas)
  border: "#2A3236",

  accent: "#1FD1B0", // único acento: progreso, acciones, métricas
  accentMuted: "#14493F", // fondo sutil detrás del acento (tracks de barras)

  textPrimary: "#F4F6F5",
  textSecondary: "#8B979A",
  textTertiary: "#586165",

  danger: "#E85D4A", // bloqueo (estado con significado real)
  warning: "#E0A93F", // cerca del límite (estado con significado real)

  // Alias retrocompatibles (código anterior usa colors.primary)
  primary: "#1FD1B0",
  success: "#1FD1B0",
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
