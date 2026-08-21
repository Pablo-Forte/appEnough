// src/utils/format.ts

// Convierte minutos a un formato legible:
// 0-59   -> "58m"
// 60+    -> "1:00h", "1:05h", "2:30h", etc.
export function formatDuration(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);

  if (rounded < 60) {
    return `${rounded}m`;
  }

  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${hours}:${paddedMinutes}h`;
}
