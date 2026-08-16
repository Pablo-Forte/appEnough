// src/app/index.tsx
//
// Ahora usa datos REALES de uso, via el modulo nativo UsageStats.
// Si el permiso no esta activado, muestra un boton para ir a Ajustes.

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
}

export default function Index() {
  const [apps, setApps] = useState<AppWithUsage[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    const granted = UsageStatsModule.hasUsageAccessPermission();
    setHasPermission(granted);

    if (!granted) {
      setApps([]);
      return;
    }

    // Trae el uso real de HOY para todas las apps del dispositivo
    const realUsage = UsageStatsModule.getTodayUsageStats();
    const usageByPackage = new Map(
      realUsage.map((u) => [u.packageName, u.minutesUsed]),
    );

    const trackedApps = getTrackedApps(DEMO_USER_ID);

    const appsWithUsage: AppWithUsage[] = trackedApps.map((app) => {
      const minutesUsedToday = usageByPackage.get(app.appIdentifier) ?? 0;

      // Guarda el dato real en la base de datos local
      upsertUsageSession({
        id: `session-${app.id}-${TODAY}`,
        appId: app.id,
        date: TODAY,
        minutesUsed: minutesUsedToday,
        opensCount: 0,
        blockedAttempts: 0,
        limitReached: minutesUsedToday >= app.dailyLimitMinutes,
      });

      return { ...app, minutesUsedToday };
    });

    setApps(appsWithUsage);
  }, []);

  useEffect(() => {
    initDatabase();
    setupTrackedApps();
    loadData();
  }, [loadData]);

  function setupTrackedApps() {
    const now = new Date().toISOString();

    // IMPORTANTE: estos appIdentifier deben coincidir EXACTO con el
    // package name real de la app instalada en el dispositivo.
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

  if (hasPermission === false) {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Hoy</Text>
        {apps.map((app) => (
          <View key={app.id} style={styles.card}>
            <Text style={styles.appName}>{app.displayName}</Text>
            <Text style={styles.limit}>
              {Math.round(app.minutesUsedToday)} / {app.dailyLimitMinutes} min
            </Text>
          </View>
        ))}
        {apps.length === 0 && hasPermission && (
          <Text style={styles.empty}>
            Sin uso registrado hoy todavía para Instagram/TikTok.
          </Text>
        )}
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
  appName: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  limit: { fontSize: 14, color: "#9A9AA5", marginTop: 4 },
  empty: { color: "#9A9AA5", fontSize: 14 },
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
