// src/app/settings/set-limit.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/colors";
import { saveTrackedApp } from "../../database/db";

const USER_ID = "demo-user";
const DEFAULT_MINUTES = 20;
const STEP = 5;
const MIN_MINUTES = 5;
const MAX_MINUTES = 180;
const DEFAULT_BLOCK_MINUTES = 120;

export default function SetLimitScreen() {
  const router = useRouter();
  const { appId, displayName, appIdentifier } = useLocalSearchParams<{
    appId: string;
    displayName: string;
    appIdentifier: string;
  }>();
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);

  function adjust(delta: number) {
    setMinutes((prev) =>
      Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, prev + delta)),
    );
  }

  function handleConfirm() {
    if (!appId || !displayName || !appIdentifier) return;
    const now = new Date().toISOString();
    saveTrackedApp({
      id: appId,
      userId: USER_ID,
      appIdentifier,
      displayName,
      platform: "android",
      dailyLimitMinutes: minutes,
      blockDurationMinutes: DEFAULT_BLOCK_MINUTES,
      warningMinutesBefore: 5,
      allowExceptions: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    router.dismissTo("/settings");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          ¿Cuánto tiempo diario para {displayName}?
        </Text>
        <Text style={styles.subtitle}>
          Podés ajustarlo cuando quieras desde Ajustes.
        </Text>

        <View style={styles.stepperCard}>
          <Pressable style={styles.stepButton} onPress={() => adjust(-STEP)}>
            <Text style={styles.stepButtonText}>–</Text>
          </Pressable>
          <Text style={styles.minutesText}>{minutes} min</Text>
          <Pressable style={styles.stepButton} onPress={() => adjust(STEP)}>
            <Text style={styles.stepButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Agregar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, paddingTop: 60 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  stepperCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: { color: colors.primary, fontSize: 24, fontWeight: "700" },
  minutesText: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  footer: { padding: spacing.lg },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { color: colors.background, fontWeight: "700", fontSize: 16 },
});
