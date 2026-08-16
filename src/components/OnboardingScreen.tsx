// src/components/OnboardingScreen.tsx

import React from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { colors, radius, spacing } from "../constants/colors";

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export default function OnboardingScreen({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = "Siguiente",
  nextDisabled = false,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(step / totalSteps) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, nextDisabled && styles.buttonDisabled]}
          onPress={onNext}
          disabled={nextDisabled}
        >
          <Text style={styles.buttonText}>{nextLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  body: { marginTop: spacing.sm },
  footer: { padding: spacing.lg },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.background, fontWeight: "700", fontSize: 16 },
});
