// src/components/ui/ProgressBar.tsx

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, radius } from "../../constants/colors";

interface Props {
  percent: number; // 0-100
  color?: string;
  trackColor?: string;
  height?: number;
}

export default function ProgressBar({
  percent,
  color = colors.accent,
  trackColor = colors.accentMuted,
  height = 8,
}: Props) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(100, Math.max(0, percent)),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [percent, animatedWidth]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor, borderRadius: radius.pill },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { width, backgroundColor: color, borderRadius: radius.pill },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", overflow: "hidden" },
  fill: { height: "100%" },
});
