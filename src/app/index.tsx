// src/app/index.tsx
//
// Pantalla principal con Expo Router. Datos de EJEMPLO por ahora
// (no viene de trackeo real todavía).

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { initDatabase, saveTrackedApp, upsertUsageSession, getTrackedApps } from '../database/db';
import { TrackedApp } from'../models/types';

const DEMO_USER_ID = 'demo-user';
const TODAY = new Date().toISOString().split('T')[0];

export default function Index() {
  const [apps, setApps] = useState<TrackedApp[]>([]);

  useEffect(() => {
    initDatabase();
    seedDemoData();
    setApps(getTrackedApps(DEMO_USER_ID));
  }, []);

  function seedDemoData() {
    const now = new Date().toISOString();

    const instagram: TrackedApp = {
      id: 'app-instagram',
      userId: DEMO_USER_ID,
      appIdentifier: 'com.instagram.android',
      displayName: 'Instagram',
      platform: 'android',
      dailyLimitMinutes: 15,
      blockDurationMinutes: 120,
      warningMinutesBefore: 5,
      allowExceptions: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const tiktok: TrackedApp = {
      id: 'app-tiktok',
      userId: DEMO_USER_ID,
      appIdentifier: 'com.zhiliaoapp.musically',
      displayName: 'TikTok',
      platform: 'android',
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

    upsertUsageSession({
      id: 'session-instagram-today',
      appId: instagram.id,
      date: TODAY,
      minutesUsed: 12.5,
      opensCount: 6,
      blockedAttempts: 0,
      limitReached: false,
    });

    upsertUsageSession({
      id: 'session-tiktok-today',
      appId: tiktok.id,
      date: TODAY,
      minutesUsed: 8,
      opensCount: 3,
      blockedAttempts: 0,
      limitReached: false,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hoy</Text>
      {apps.map((app) => (
        <View key={app.id} style={styles.card}>
          <Text style={styles.appName}>{app.displayName}</Text>
          <Text style={styles.limit}>Límite diario: {app.dailyLimitMinutes} min</Text>
        </View>
      ))}
      {apps.length === 0 && (
        <Text style={styles.empty}>Cargando datos de ejemplo...</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 },
  card: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  appName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  limit: { fontSize: 14, color: '#9A9AA5', marginTop: 4 },
  empty: { color: '#9A9AA5', fontSize: 14 },
});
