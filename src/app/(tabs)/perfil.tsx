// src/app/(tabs)/perfil.tsx

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AppBlockerModule from "../../../modules/app-blocker/src/AppBlockerModule";
import UsageStatsModule from "../../../modules/usage-stats/src/UsageStatsModule";
import { colors, radius, spacing } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { getUser } from "../../database/db";

const USER_ID = "demo-user";

export default function PerfilTab() {
  const [timePerception, setTimePerception] = useState<string | undefined>();
  const [mainGoal, setMainGoal] = useState<string | undefined>();
  const [usageGranted, setUsageGranted] = useState(false);
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const user = getUser(USER_ID);
      setTimePerception(user?.timePerception);
      setMainGoal(user?.mainGoal);
      setUsageGranted(UsageStatsModule.hasUsageAccessPermission());
      setAccessibilityGranted(AppBlockerModule.hasAccessibilityPermission());
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Tu objetivo</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>
            Percepción inicial de tiempo perdido
          </Text>
          <Text style={styles.infoValue}>{timePerception ?? "—"}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Meta principal</Text>
          <Text style={styles.infoValue}>{mainGoal ?? "—"}</Text>
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>
          Permisos
        </Text>
        <View style={styles.permissionRow}>
          <View style={styles.permissionText}>
            <Text style={styles.infoLabel}>Acceso a datos de uso</Text>
            <Text
              style={[
                styles.statusText,
                { color: usageGranted ? colors.accent : colors.danger },
              ]}
            >
              {usageGranted ? "Activado" : "Desactivado"}
            </Text>
          </View>
          {!usageGranted && (
            <Pressable
              style={styles.smallButton}
              onPress={() => UsageStatsModule.openUsageAccessSettings()}
            >
              <Text style={styles.smallButtonText}>Activar</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.permissionRow}>
          <View style={styles.permissionText}>
            <Text style={styles.infoLabel}>
              Servicio de accesibilidad (bloqueo)
            </Text>
            <Text
              style={[
                styles.statusText,
                { color: accessibilityGranted ? colors.accent : colors.danger },
              ]}
            >
              {accessibilityGranted ? "Activado" : "Desactivado"}
            </Text>
          </View>
          {!accessibilityGranted && (
            <Pressable
              style={styles.smallButton}
              onPress={() => AppBlockerModule.openAccessibilitySettings()}
            >
              <Text style={styles.smallButtonText}>Activar</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.footer}>Enough</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  sectionSpacing: { marginTop: spacing.xl },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: 4,
  },

  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionText: { flex: 1 },
  statusText: { ...typography.bodyStrong, marginTop: 4 },
  smallButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  smallButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 13,
  },

  footer: {
    textAlign: "center",
    color: colors.textTertiary,
    marginTop: spacing.xxl,
    fontSize: 13,
  },
});
