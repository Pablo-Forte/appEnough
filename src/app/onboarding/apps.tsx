// src/app/onboarding/apps.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import OnboardingScreen from "../../components/OnboardingScreen";
import { AVAILABLE_APPS } from "../../constants/apps";
import { colors, radius, spacing } from "../../constants/colors";
import { useOnboarding } from "../../onboarding/OnboardingContext";

export default function SelectAppsScreen() {
  const router = useRouter();
  const { setSelectedApps } = useOnboarding();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(appId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }

  function handleNext() {
    const chosen = AVAILABLE_APPS.filter((a) => selectedIds.has(a.id));
    setSelectedApps(chosen);
    router.push("/onboarding/goal");
  }

  return (
    <OnboardingScreen
      step={2}
      totalSteps={5}
      title="¿Qué apps querés controlar?"
      subtitle="Podés elegir más de una."
      onNext={handleNext}
      nextDisabled={selectedIds.size === 0}
    >
      {AVAILABLE_APPS.map((app) => {
        const selected = selectedIds.has(app.id);
        return (
          <Pressable
            key={app.id}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => toggle(app.id)}
          >
            <View style={styles.left}>
              <Text style={styles.emoji}>{app.emoji}</Text>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {app.displayName}
              </Text>
            </View>
            <View style={[styles.dot, selected && styles.dotSelected]} />
          </Pressable>
        );
      })}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { fontSize: 20 },
  label: { fontSize: 16, color: colors.textPrimary },
  labelSelected: { fontWeight: "600" },
  dot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textTertiary,
  },
  dotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
