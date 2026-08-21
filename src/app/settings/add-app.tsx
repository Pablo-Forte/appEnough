// src/app/settings/add-app.tsx

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AVAILABLE_APPS } from "../../constants/apps";
import { colors, radius, spacing } from "../../constants/colors";
import { getTrackedApps } from "../../database/db";

const USER_ID = "demo-user";

export default function AddAppScreen() {
  const router = useRouter();
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      const rows = getTrackedApps(USER_ID);
      setTrackedIds(new Set(rows.map((r) => r.id)));
    }, []),
  );

  function handleSelect(appId: string) {
    const app = AVAILABLE_APPS.find((a) => a.id === appId);
    if (!app) return;
    router.push({
      pathname: "/settings/set-limit",
      params: {
        appId: app.id,
        displayName: app.displayName,
        appIdentifier: app.appIdentifier,
      },
    });
  }

  const availableToAdd = AVAILABLE_APPS.filter((a) => !trackedIds.has(a.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backButton}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.title}>Agregar app</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {availableToAdd.length === 0 && (
          <Text style={styles.empty}>
            Ya estás controlando todas las apps disponibles.
          </Text>
        )}
        {availableToAdd.map((app) => (
          <Pressable
            key={app.id}
            style={styles.card}
            onPress={() => handleSelect(app.id)}
          >
            <Text style={styles.appName}>{app.displayName}</Text>
            <Text style={styles.plus}>+</Text>
          </Pressable>
        ))}
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
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.lg,
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
  appName: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  plus: { fontSize: 20, color: colors.primary, fontWeight: "700" },
});
