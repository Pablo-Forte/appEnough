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

const USER_ID = "demo-user";
const TODAY = new Date().toISOString().split("T")[0];

interface AppWithUsage extends TrackedApp {
  minutesUsedToday: number;
  isBlocked: boolean;
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

  // Refresca cada vez que se vuelve a esta pantalla (ej. al salir de Ajustes)
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hoy</Text>
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
        {apps.map((app) => (
          <View
            key={app.id}
            style={[styles.card, app.isBlocked && styles.cardBlocked]}
          >
            <Text style={styles.appName}>{app.displayName}</Text>
            <Text style={styles.limit}>
              {Math.round(app.minutesUsedToday)} / {app.dailyLimitMinutes} min
            </Text>
            {app.isBlocked && <Text style={styles.blockedTag}>Bloqueada</Text>}
          </View>
        ))}

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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsIcon: { fontSize: 18, color: colors.textSecondary },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg, // mas espacio entre tarjetas
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBlocked: { borderColor: colors.danger },
  appName: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  limit: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  blockedTag: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 10,
    fontWeight: "700",
  },
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
