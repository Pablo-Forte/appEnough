// src/app/settings/index.tsx

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { REMOVAL_DELAY_HOURS, emojiForApp } from "../../constants/apps";
import { colors, radius, spacing } from "../../constants/colors";
import {
  cancelAppRemoval,
  getTrackedApps,
  processPendingRemovals,
} from "../../database/db";
import { formatDuration } from "../../utils/format";

const USER_ID = "demo-user";

interface AppRow {
  id: string;
  displayName: string;
  dailyLimitMinutes: number;
  pendingRemovalRequestedAt?: string;
  pendingRemovalReason?: string;
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
});

// Antes usaba Math.ceil(horas), lo que hacia que se viera "24h" fijo
// durante toda la primera hora. Ahora calcula minutos exactos y usa
// formatDuration, que muestra "23:45h" y va bajando de verdad.
function minutesRemaining(requestedAtIso: string): number {
  const requestedAt = new Date(requestedAtIso).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - requestedAt) / (1000 * 60);
  const totalMinutes = REMOVAL_DELAY_HOURS * 60;
  return Math.max(0, totalMinutes - elapsedMinutes);
}

export default function SettingsScreen() {
  const router = useRouter();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [, forceTick] = useState(0);

  const load = useCallback(() => {
    processPendingRemovals(new Date().toISOString(), REMOVAL_DELAY_HOURS);
    const rows = getTrackedApps(USER_ID) as AppRow[];
    setApps(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Refresca el numero cada 30s mientras la pantalla esta abierta,
  // asi el contador se ve bajar en vivo, no solo al reabrir la pantalla.
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  function handleCancelRemoval(appId: string) {
    cancelAppRemoval(appId);
    load();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backButton}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Apps controladas</Text>

        {apps.map((app) => {
          const isPending = !!app.pendingRemovalRequestedAt;
          const remainingMin = isPending
            ? minutesRemaining(app.pendingRemovalRequestedAt!)
            : 0;

          return (
            <View key={app.id} style={[styles.card, cardShadow]}>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.appEmoji}>{emojiForApp(app.id)}</Text>
                  <Text style={styles.appName}>{app.displayName}</Text>
                </View>
                <Text style={styles.appLimit}>
                  {formatDuration(app.dailyLimitMinutes)} diarios
                </Text>
                {isPending && (
                  <Text style={styles.pendingText}>
                    Se quitará en {formatDuration(remainingMin)} ·{" "}
                    {app.pendingRemovalReason}
                  </Text>
                )}
              </View>

              {isPending ? (
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => handleCancelRemoval(app.id)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.removeButton}
                  onPress={() =>
                    router.push({
                      pathname: "/settings/remove-reason",
                      params: { appId: app.id },
                    })
                  }
                >
                  <Text style={styles.removeButtonText}>Quitar</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <Pressable
          style={[styles.addButton, cardShadow]}
          onPress={() => router.push("/settings/add-app")}
        >
          <Text style={styles.addButtonText}>+ Agregar app</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backButton: { color: colors.primary, fontSize: 16, marginRight: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  content: { padding: spacing.lg, paddingTop: spacing.sm },
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInfo: { flex: 1, marginRight: spacing.sm },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  appEmoji: { fontSize: 18 },
  appName: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  appLimit: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  pendingText: { fontSize: 12, color: colors.danger, marginTop: 6 },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removeButtonText: { color: colors.danger, fontWeight: "600", fontSize: 13 },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 13,
  },
  addButton: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  addButtonText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
});
