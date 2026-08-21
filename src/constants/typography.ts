// src/constants/typography.ts
//
// Escala tipográfica única para toda la app. Los números de tiempo
// (métricas) usan pesos más fuertes que el resto del texto.

export const typography = {
  metricHero: { fontSize: 56, fontWeight: "800" as const, letterSpacing: -1.5 },
  metricLarge: {
    fontSize: 34,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  metricMedium: { fontSize: 22, fontWeight: "700" as const },

  title: { fontSize: 28, fontWeight: "700" as const },
  subtitle: { fontSize: 17, fontWeight: "600" as const },

  body: { fontSize: 15, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const },

  caption: { fontSize: 13, fontWeight: "500" as const },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
};
