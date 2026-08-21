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
import { REMOVAL_DELAY_HOURS } from "../constants/apps";
import { colors, radius, spacing } from "../constants/colors";
import {
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

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

interface AppWithUsage extends TrackedApp {
  minutesUsedToday: number;
  isBlocked: boolean;
}

function formatToday(): string {
  const now = new Date();
  return `${WEEKDAYS[now.getDay()]} ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
}

function progressColor(percent: number): string {
  if (percent >= 100) return colors.danger;
  if (percent >= 80) return colors.warning;
  return colors.primary;
}

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [apps, setApps] = useState<AppWithUsage[]>([]);
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

  const totalUsed = apps.reduce((sum, a) => sum + a.minutesUsedToday, 0);
  const totalLimit = apps.reduce((sum, a) => sum + a.dailyLimitMinutes, 0);
  const totalPercent =
    totalLimit > 0 ? Math.min(100, (totalUsed / totalLimit) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hoy</Text>
          <Text style={styles.date}>{formatToday()}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          hitSlop={12}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {apps.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tiempo total usado hoy</Text>
            <Text style={styles.summaryValue}>{formatDuration(totalUsed)}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${totalPercent}%`,
                    backgroundColor: progressColor(totalPercent),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {apps.map((app) => {
          const percent = Math.min(
            100,
            (app.minutesUsedToday / app.dailyLimitMinutes) * 100,
          );
          const barColor = progressColor(percent);
          return (
            <View
              key={app.id}
              style={[styles.card, app.isBlocked && styles.cardBlocked]}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.appName}>{app.displayName}</Text>
                {app.isBlocked && (
                  <Text style={styles.blockedTag}>Bloqueada</Text>
                )}
              </View>
              <Text style={styles.limit}>
                {formatDuration(app.minutesUsedToday)} /{" "}
                {formatDuration(app.dailyLimitMinutes)}
              </Text>
              <View style={styles.progressTrackSmall}>
                <View
                  style={[
                    styles.progressFillSmall,
                    { width: `${percent}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
            </View>
          );
        })}

        {apps.length === 0 && (
          <Text style={styles.empty}>
            No tenés apps controladas. Agregá una desde Ajustes.
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  greeting: { fontSize: 30, fontWeight: "700", color: colors.textPrimary },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  settingsIcon: { fontSize: 18, color: colors.textSecondary },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.md },

  summaryCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  summaryValue: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  progressTrack: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: radius.pill },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBlocked: { borderColor: colors.danger },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appName: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  blockedTag: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  limit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  progressTrackSmall: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFillSmall: { height: "100%", borderRadius: radius.pill },

  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  permissionBox: { flex: 1, justifyContent: "center", padding: spacing.lg },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonText: { color: colors.background, fontWeight: "700", fontSize: 16 },
  buttonSecondary: { padding: 16, alignItems: "center" },
  buttonSecondaryText: { color: colors.textSecondary, fontSize: 14 },
});
