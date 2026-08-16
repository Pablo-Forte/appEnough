// src/app/onboarding/limits.tsx

import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import OnboardingScreen from "../../components/OnboardingScreen";
import { colors, radius, spacing } from "../../constants/colors";
import { useOnboarding } from "../../onboarding/OnboardingContext";

const DEFAULT_MINUTES = 20;
const STEP = 5;
const MIN_MINUTES = 5;
const MAX_MINUTES = 180;

export default function LimitsScreen() {
  const router = useRouter();
  const { data, setLimit } = useOnboarding();

  useEffect(() => {
    data.selectedApps.forEach((app) => {
      if (data.limitsByAppId[app.id] === undefined) {
        setLimit(app.id, DEFAULT_MINUTES);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function adjust(appId: string, delta: number) {
    const current = data.limitsByAppId[appId] ?? DEFAULT_MINUTES;
    const next = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, current + delta));
    setLimit(appId, next);
  }

  function handleNext() {
    router.push("/onboarding/block-duration");
  }

  return (
    <OnboardingScreen
      step={4}
      totalSteps={5}
      title="¿Cuánto tiempo querés permitirte?"
      subtitle="Podés ajustarlo cuando quieras, esto es solo el punto de partida."
      onNext={handleNext}
    >
      {data.selectedApps.map((app) => {
        const minutes = data.limitsByAppId[app.id] ?? DEFAULT_MINUTES;
        return (
          <View key={app.id} style={styles.row}>
            <Text style={styles.appName}>{app.displayName}</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepButton}
                onPress={() => adjust(app.id, -STEP)}
              >
                <Text style={styles.stepButtonText}>–</Text>
              </Pressable>
              <Text style={styles.minutesText}>{minutes} min</Text>
              <Pressable
                style={styles.stepButton}
                onPress={() => adjust(app.id, STEP)}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: { color: colors.primary, fontSize: 20, fontWeight: "700" },
  minutesText: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
});
