// src/app/(tabs)/apps.tsx

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import UsageStatsModule from "../../../modules/usage-stats/src/UsageStatsModule";
import ProgressBar from "../../components/ui/ProgressBar";
import { REMOVAL_DELAY_HOURS, emojiForApp } from "../../constants/apps";
import { colors, radius, spacing } from "../../constants/colors";
import { typography } from "../../constants/typography";
import {
    cancelAppRemoval,
    getTrackedApps,
    processPendingRemovals
} from "../../database/db";
import { formatDuration } from "../../utils/format";

const USER_ID = "demo-user";
const TODAY = new Date().toISOString().split("T")[0];

interface AppRow {
  id: string;
  displayName: string;
  appIdentifier: string;
  dailyLimitMinutes: number;
  pendingRemovalRequestedAt?: string;
  pendingRemovalReason?: string;
  minutesUsedToday: number;
}

function stateColor(percent: number): string {
  if (percent >= 100) return colors.danger;
  if (percent >= 80) return colors.warning;
  return colors.accent;
}

export default function AppsTab() {
  const router = useRouter();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [, forceTick] = useState(0);

  const load = useCallback(() => {
    processPendingRemovals(new Date().toISOString(), REMOVAL_DELAY_HOURS);

    const usageGranted = UsageStatsModule.hasUsageAccessPermission();
    const usageByPackage = usageGranted
      ? new Map(
          UsageStatsModule.getTodayUsageStats().map((u) => [
            u.packageName,
            u.minutesUsed,
          ]),
        )
      : new Map<string, number>();

    const rows = getTrackedApps(USER_ID) as any[];
    const withUsage: AppRow[] = rows.map((r) => ({
      ...r,
      minutesUsedToday: usageByPackage.get(r.appIdentifier) ?? 0,
    }));
    setApps(withUsage);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
        <Text style={styles.title}>Apps</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {apps.map((app) => {
          const isPending = !!app.pendingRemovalRequestedAt;
          const remainingMin = isPending
            ? removalMinutesRemaining(app.pendingRemovalRequestedAt!)
            : 0;
          const percent = Math.min(
            100,
            (app.minutesUsedToday / app.dailyLimitMinutes) * 100,
          );
          const color = stateColor(percent);

          return (
            <View key={app.id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.appEmoji}>{emojiForApp(app.id)}</Text>
                  <Text style={styles.appName}>{app.displayName}</Text>
                </View>
                {!isPending && (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/settings/remove-reason",
                        params: { appId: app.id },
                      })
                    }
                  >
                    <Text style={styles.removeLink}>Quitar</Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.appLimit}>
                {formatDuration(app.minutesUsedToday)} /{" "}
                {formatDuration(app.dailyLimitMinutes)}
              </Text>
              <ProgressBar percent={percent} color={color} height={6} />

              {isPending && (
                <View style={styles.pendingBox}>
                  <Text style={styles.pendingText}>
                    Se quitará en {formatDuration(remainingMin)} ·{" "}
                    {app.pendingRemovalReason}
                  </Text>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => handleCancelRemoval(app.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/settings/add-app")}
        >
          <Text style={styles.addButtonText}>+ Agregar app</Text>
        </Pressable>

        {apps.length === 0 && (
          <Text style={styles.empty}>No tenés apps controladas todavía.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function removalMinutesRemaining(requestedAtIso: string): number {
  const requestedAt = new Date(requestedAtIso).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - requestedAt) / (1000 * 60);
  const totalMinutes = REMOVAL_DELAY_HOURS * 60;
  return Math.max(0, totalMinutes - elapsedMinutes);
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

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  appEmoji: { fontSize: 18 },
  appName: { ...typography.bodyStrong, color: colors.textPrimary },
  removeLink: { ...typography.caption, color: colors.danger },
  appLimit: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  pendingBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingText: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
    marginRight: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 12,
  },

  addButton: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  addButtonText: { color: colors.accent, fontWeight: "600", fontSize: 15 },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
