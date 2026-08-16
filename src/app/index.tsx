// src/app/index.tsx
//
// Ahora usa datos REALES de uso (UsageStats) Y activa el bloqueo real
// (AppBlocker) para las apps que superaron su limite diario.

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
import {
  getTrackedApps,
  initDatabase,
  saveTrackedApp,
  upsertUsageSession,
} from "../database/db";
import { TrackedApp } from "../models/types";

const DEMO_USER_ID = "demo-user";
const TODAY = new Date().toISOString().split("T")[0];

interface AppWithUsage extends TrackedApp {
  minutesUsedToday: number;
  isBlocked: boolean;
}

export default function Index() {
  const [apps, setApps] = useState<AppWithUsage[]>([]);
  const [hasUsagePermission, setHasUsagePermission] = useState<boolean | null>(
    null,
  );
  const [hasAccessibilityPermission, setHasAccessibilityPermission] = useState<
    boolean | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
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

    const trackedApps = getTrackedApps(DEMO_USER_ID);

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

    // Le avisa al servicio de accesibilidad cuales apps bloquear AHORA
    if (accessibilityGranted) {
      const blockedPackages = appsWithUsage
        .filter((a) => a.isBlocked)
        .map((a) => a.appIdentifier);
      AppBlockerModule.setBlockedPackages(blockedPackages);
    }
  }, []);

  useEffect(() => {
    initDatabase();
    setupTrackedApps();
    loadData();
  }, [loadData]);

  function setupTrackedApps() {
    const now = new Date().toISOString();

    const instagram: TrackedApp = {
      id: "app-instagram",
      userId: DEMO_USER_ID,
      appIdentifier: "com.instagram.android",
      displayName: "Instagram",
      platform: "android",
      dailyLimitMinutes: 15,
      blockDurationMinutes: 120,
      warningMinutesBefore: 5,
      allowExceptions: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const tiktok: TrackedApp = {
      id: "app-tiktok",
      userId: DEMO_USER_ID,
      appIdentifier: "com.zhiliaoapp.musically",
      displayName: "TikTok",
      platform: "android",
      dailyLimitMinutes: 20,
      blockDurationMinutes: 120,
      warningMinutesBefore: 5,
      allowExceptions: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    saveTrackedApp(instagram);
    saveTrackedApp(tiktok);
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  if (hasUsagePermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Falta un permiso</Text>
          <Text style={styles.permissionText}>
            Para medir tu tiempo de uso, necesitamos que actives el acceso a
            datos de uso en los Ajustes de Android.
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
            Para poder bloquear las apps cuando llegues a tu límite, activa
            nuestro servicio de accesibilidad.
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Hoy</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardBlocked: { borderWidth: 1, borderColor: "#E74C3C" },
  appName: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  limit: { fontSize: 14, color: "#9A9AA5", marginTop: 4 },
  blockedTag: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 6,
    fontWeight: "600",
  },
  permissionBox: { flex: 1, justifyContent: "center" },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: "#9A9AA5",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#6C5CE7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  buttonSecondary: { padding: 16, alignItems: "center" },
  buttonSecondaryText: { color: "#9A9AA5", fontSize: 14 },
});
