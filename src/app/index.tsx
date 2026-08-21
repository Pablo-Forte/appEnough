// src/app/index.tsx

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppBlockerModule from "../../modules/app-blocker/src/AppBlockerModule";
import UsageStatsModule from "../../modules/usage-stats/src/UsageStatsModule";
import CountUpText from "../components/ui/CountUpText";
import ProgressBar from "../components/ui/ProgressBar";
import { REMOVAL_DELAY_HOURS, emojiForApp } from "../constants/apps";
import { colors, radius, spacing } from "../constants/colors";
import { typography } from "../constants/typography";
import {
  getRecentDailyTotals,
  getTrackedApps,
  getUser,
  initDatabase,
  processPendingRemovals,
  upsertUsageSession,
} from "../database/db";
import { TrackedApp } from "../models/types";
import { formatDuration } from "../utils/format";

const USER_ID = "demo-user";
const TODAY = new Date().toISOString().split("T")[0];
const HISTORY_DAYS = 8; // hoy + 7 dias anteriores

interface AppWithUsage extends TrackedApp {
  minutesUsedToday: number;
  isBlocked: boolean;
}

function stateColor(percent: number): string {
  if (percent >= 100) return colors.danger;
  if (percent >= 80) return colors.warning;
  return colors.accent;
}

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [apps, setApps] = useState<AppWithUsage[]>([]);
  const [history, setHistory] = useState<
    { date: string; totalMinutes: number }[]
  >([]);
  const [hasUsagePermission, setHasUsagePermission] = useState<boolean | null>(
    null,
  );
  const [hasAccessibilityPermission, setHasAccessibilityPermission] = useState<
    boolean | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    processPendingRemovals(new Date().toISOString(), REMOVAL_DELAY_HOURS);

    const usageGranted = UsageStatsModule.hasUsageAccessPermission();
    const accessibilityGranted = AppBlockerModule.hasAccessibilityPermission();
    setHasUsagePermission(usageGranted);
    setHasAccessibilityPermission(accessibilityGranted);

    if (!usageGranted) {
      setApps([]);
      return;
    }

    const realUsage = UsageStatsModule.getTodayUsageStats();
    const usageByPackage = new Map(
      realUsage.map((u) => [u.packageName, u.minutesUsed]),
    );

    const trackedApps = getTrackedApps(USER_ID);

    const appsWithUsage: AppWithUsage[] = trackedApps.map((app) => {
      const minutesUsedToday = usageByPackage.get(app.appIdentifier) ?? 0;
      const isBlocked = minutesUsedToday >= app.dailyLimitMinutes;

      upsertUsageSession({
        id: `session-${app.id}-${TODAY}`,
        appId: app.id,
        date: TODAY,
        minutesUsed: minutesUsedToday,
        opensCount: 0,
        blockedAttempts: 0,
        limitReached: isBlocked,
      });

      return { ...app, minutesUsedToday, isBlocked };
    });

    setApps(appsWithUsage);
    setHistory(getRecentDailyTotals(USER_ID, HISTORY_DAYS));

    if (accessibilityGranted) {
      const blockedPackages = appsWithUsage
        .filter((a) => a.isBlocked)
        .map((a) => a.appIdentifier);
      AppBlockerModule.setBlockedPackages(blockedPackages);
    }
  }, []);

  useEffect(() => {
    initDatabase();
    const user = getUser(USER_ID);
    if (!user || !user.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    setReady(true);
    loadData();
  }, [loadData, router]);

  useFocusEffect(
    useCallback(() => {
      if (ready) loadData();
    }, [ready, loadData]),
  );

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  if (!ready) {
    return <SafeAreaView style={styles.container} />;
  }

  if (hasUsagePermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Falta un permiso</Text>
          <Text style={styles.permissionText}>
            Para medir tu tiempo de uso, activá el acceso a datos de uso en los
            Ajustes de Android.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => UsageStatsModule.openUsageAccessSettings()}
          >
            <Text style={styles.buttonText}>Abrir Ajustes</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={loadData}>
            <Text style={styles.buttonSecondaryText}>
              Ya lo activé, revisar de nuevo
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (hasAccessibilityPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Falta otro permiso</Text>
          <Text style={styles.permissionText}>
            Para poder bloquear las apps al llegar a tu límite, activá nuestro
            servicio de accesibilidad.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => AppBlockerModule.openAccessibilitySettings()}
          >
            <Text style={styles.buttonText}>
              Abrir Ajustes de Accesibilidad
            </Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={loadData}>
            <Text style={styles.buttonSecondaryText}>
              Ya lo activé, revisar de nuevo
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- Calculos con datos 100% reales ---
  const totalToday = apps.reduce((sum, a) => sum + a.minutesUsedToday, 0);
  const totalLimit = apps.reduce((sum, a) => sum + a.dailyLimitMinutes, 0);
  const todayPercent =
    totalLimit > 0 ? Math.min(100, (totalToday / totalLimit) * 100) : 0;

  // Dias anteriores reales (excluye hoy), para promedio y percentil
  const previousDays = history.filter((h) => h.date !== TODAY);
  const hasHistory = previousDays.length >= 2;

  const weeklyAverage = hasHistory
    ? previousDays.reduce((sum, d) => sum + d.totalMinutes, 0) /
      previousDays.length
    : 0;

  const recoveredMinutes = hasHistory
    ? Math.max(0, weeklyAverage - totalToday)
    : 0;

  const daysWithMoreUsage = previousDays.filter(
    (d) => d.totalMinutes > totalToday,
  ).length;
  const percentileBetter = hasHistory
    ? Math.round((daysWithMoreUsage / previousDays.length) * 100)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Hoy</Text>
        <Pressable onPress={() => router.push("/settings")} hitSlop={12}>
          <Text style={styles.settingsIcon}>⋯</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Metrica hero */}
        <View style={styles.hero}>
          {hasHistory ? (
            <>
              <CountUpText
                targetValue={recoveredMinutes}
                formatter={formatDuration}
                style={[typography.metricHero, styles.heroNumber]}
              />
              <Text style={styles.heroLabel}>de tiempo recuperado hoy</Text>
            </>
          ) : (
            <>
              <CountUpText
                targetValue={totalToday}
                formatter={formatDuration}
                style={[typography.metricHero, styles.heroNumber]}
              />
              <Text style={styles.heroLabel}>
                usados hoy · en unos días vas a ver tu comparación
              </Text>
            </>
          )}
        </View>

        {/* Antes / Ahora */}
        {hasHistory && (
          <View style={styles.compareRow}>
            <View style={styles.compareCol}>
              <Text style={styles.compareLabel}>PROMEDIO</Text>
              <Text style={[typography.metricMedium, styles.compareValueMuted]}>
                {formatDuration(weeklyAverage)}
              </Text>
              <View style={styles.compareBarTrack}>
                <View
                  style={[
                    styles.compareBarFill,
                    { width: "100%", backgroundColor: colors.textTertiary },
                  ]}
                />
              </View>
            </View>
            <View style={styles.compareCol}>
              <Text style={styles.compareLabel}>HOY</Text>
              <Text
                style={[typography.metricMedium, { color: colors.textPrimary }]}
              >
                {formatDuration(totalToday)}
              </Text>
              <View style={styles.compareBarTrack}>
                <View
                  style={[
                    styles.compareBarFill,
                    {
                      width: `${weeklyAverage > 0 ? Math.min(100, (totalToday / weeklyAverage) * 100) : 0}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Tu dia */}
        {totalLimit > 0 && (
          <View style={styles.dayProgressBlock}>
            <View style={styles.dayProgressHeader}>
              <Text style={styles.sectionLabel}>Tu día</Text>
              <Text style={styles.dayProgressPercent}>
                {Math.round(todayPercent)}%
              </Text>
            </View>
            <ProgressBar
              percent={todayPercent}
              color={stateColor(todayPercent)}
            />
            {percentileBetter !== null && (
              <Text style={styles.percentileText}>
                Vas mejor que el {percentileBetter}% de tus últimos días.
              </Text>
            )}
          </View>
        )}

        {/* Apps */}
        <Text style={[styles.sectionLabel, styles.appsSectionLabel]}>Apps</Text>
        {apps.map((app) => {
          const percent = Math.min(
            100,
            (app.minutesUsedToday / app.dailyLimitMinutes) * 100,
          );
          const remaining = Math.max(
            0,
            app.dailyLimitMinutes - app.minutesUsedToday,
          );
          const color = stateColor(percent);

          return (
            <View key={app.id} style={styles.appRow}>
              <View style={styles.appRowTop}>
                <View style={styles.appRowLeft}>
                  <Text style={styles.appEmoji}>{emojiForApp(app.id)}</Text>
                  <Text style={styles.appName}>{app.displayName}</Text>
                </View>
                <Text style={[styles.appStatus, { color }]}>
                  {app.isBlocked
                    ? "Bloqueada"
                    : `Quedan ${formatDuration(remaining)}`}
                </Text>
              </View>
              <ProgressBar percent={percent} color={color} height={6} />
            </View>
          );
        })}

        {apps.length === 0 && (
          <Text style={styles.empty}>
            No tenés apps controladas. Agregá una desde el menú.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  headerLabel: { ...typography.subtitle, color: colors.textSecondary },
  settingsIcon: {
    fontSize: 22,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  hero: {
    alignItems: "flex-start",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  heroNumber: { color: colors.textPrimary },
  heroLabel: { ...typography.body, color: colors.textSecondary, marginTop: 2 },

  compareRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  compareCol: { flex: 1 },
  compareLabel: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  compareValueMuted: { color: colors.textSecondary },
  compareBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  compareBarFill: { height: "100%", borderRadius: radius.pill },

  dayProgressBlock: { marginBottom: spacing.xl },
  dayProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.sm,
  },
  sectionLabel: { ...typography.label, color: colors.textTertiary },
  dayProgressPercent: { ...typography.bodyStrong, color: colors.textPrimary },
  percentileText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  appsSectionLabel: { marginBottom: spacing.md },
  appRow: { marginBottom: spacing.lg },
  appRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  appRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  appEmoji: { fontSize: 18 },
  appName: { ...typography.bodyStrong, color: colors.textPrimary },
  appStatus: { ...typography.caption },

  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  permissionBox: { flex: 1, justifyContent: "center", padding: spacing.lg },
  permissionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonText: { color: colors.background, fontWeight: "700", fontSize: 16 },
  buttonSecondary: { padding: 16, alignItems: "center" },
  buttonSecondaryText: { color: colors.textSecondary, fontSize: 14 },
});
