// src/app/(tabs)/estadisticas.tsx

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { getRecentDailyTotals } from "../../database/db";
import { formatDuration } from "../../utils/format";

const USER_ID = "demo-user";
const HISTORY_DAYS = 14;
const TODAY = new Date().toISOString().split("T")[0];

const WEEKDAY_SHORT = ["D", "L", "M", "M", "J", "V", "S"];

export default function EstadisticasTab() {
  const [history, setHistory] = useState<
    { date: string; totalMinutes: number }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      setHistory(getRecentDailyTotals(USER_ID, HISTORY_DAYS));
    }, []),
  );

  const sorted = [...history].sort((a, b) => (a.date < b.date ? -1 : 1));
  const last7 = sorted.slice(-7);
  const previous7 = sorted.slice(-14, -7);

  const totalLast7 = last7.reduce((s, d) => s + d.totalMinutes, 0);
  const totalPrevious7 = previous7.reduce((s, d) => s + d.totalMinutes, 0);

  const hasComparison = previous7.length >= 3 && totalPrevious7 > 0;
  const percentChange = hasComparison
    ? Math.round(((totalLast7 - totalPrevious7) / totalPrevious7) * 100)
    : null;

  const maxValue = Math.max(1, ...last7.map((d) => d.totalMinutes));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {last7.length === 0 && (
          <Text style={styles.empty}>
            Todavía no hay datos suficientes. Volvé en unos días para ver tu
            evolución.
          </Text>
        )}

        {last7.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Esta semana</Text>
            {percentChange !== null ? (
              <Text
                style={[
                  typography.metricLarge,
                  { color: percentChange <= 0 ? colors.accent : colors.danger },
                ]}
              >
                {percentChange > 0 ? "↑" : "↓"} {Math.abs(percentChange)}%
              </Text>
            ) : (
              <Text
                style={[typography.metricLarge, { color: colors.textPrimary }]}
              >
                {formatDuration(totalLast7)}
              </Text>
            )}
            <Text style={styles.subLabel}>
              {percentChange !== null
                ? percentChange <= 0
                  ? "menos tiempo en redes que la semana pasada"
                  : "más tiempo en redes que la semana pasada"
                : "de uso total esta semana"}
            </Text>

            <View style={styles.chart}>
              {last7.map((day) => {
                const dayDate = new Date(day.date + "T00:00:00");
                const barHeight = 8 + (day.totalMinutes / maxValue) * 90;
                const isToday = day.date === TODAY;
                return (
                  <View key={day.date} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isToday
                            ? colors.accent
                            : colors.surfaceElevated,
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>
                      {WEEKDAY_SHORT[dayDate.getDay()]}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>
              Últimos {sorted.length} días
            </Text>
            {sorted
              .slice()
              .reverse()
              .map((day) => (
                <View key={day.date} style={styles.row}>
                  <Text style={styles.rowDate}>
                    {day.date === TODAY ? "Hoy" : day.date}
                  </Text>
                  <Text style={styles.rowValue}>
                    {formatDuration(day.totalMinutes)}
                  </Text>
                </View>
              ))}
          </>
        )}
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
    marginBottom: spacing.xs,
  },
  subLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xl,
  },

  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    marginBottom: spacing.xl,
  },
  barCol: { alignItems: "center", flex: 1 },
  bar: { width: 18, borderRadius: radius.sm },
  barLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDate: {
    ...typography.body,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  rowValue: { ...typography.bodyStrong, color: colors.textPrimary },

  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
