// src/components/ui/CountUpText.tsx

import { useEffect, useRef, useState } from "react";
import { Text, TextStyle } from "react-native";

interface Props {
  targetValue: number; // valor final (en minutos, por ejemplo)
  formatter: (value: number) => string; // como mostrarlo (ej. formatDuration)
  style?: TextStyle | TextStyle[];
  durationMs?: number;
}

export default function CountUpText({
  targetValue,
  formatter,
  style,
  durationMs = 700,
}: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    let frameId: number;

    function step(timestamp: number) {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      // easing suave (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(targetValue * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    }

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, durationMs]);

  return <Text style={style}>{formatter(displayValue)}</Text>;
}
