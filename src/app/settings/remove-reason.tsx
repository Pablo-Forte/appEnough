// src/app/settings/remove-reason.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import SelectableRow from "../../components/SelectableRow";
import { REMOVAL_DELAY_HOURS, REMOVAL_REASONS } from "../../constants/apps";
import { colors, radius, spacing } from "../../constants/colors";
import { requestAppRemoval } from "../../database/db";

export default function RemoveReasonScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const [selected, setSelected] = useState<string | null>(null);

  function handleConfirm() {
    if (!selected || !appId) return;
    requestAppRemoval(appId, selected, new Date().toISOString());
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¿Por qué querés sacar esta app?</Text>
        <Text style={styles.subtitle}>
          Se va a quitar recién en {REMOVAL_DELAY_HOURS} horas. Si te
          arrepentís, podés cancelarlo desde Ajustes.
        </Text>

        {REMOVAL_REASONS.map((reason) => (
          <SelectableRow
            key={reason}
            label={reason}
            selected={selected === reason}
            onPress={() => setSelected(reason)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={!selected}
        >
          <Text style={styles.buttonText}>
            Confirmar baja en {REMOVAL_DELAY_HOURS}h
          </Text>
        </Pressable>
        <Pressable style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, paddingTop: 60 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  footer: { padding: spacing.lg },
  button: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.background, fontWeight: "700", fontSize: 15 },
  cancelLink: { alignItems: "center", padding: spacing.sm },
  cancelLinkText: { color: colors.textSecondary, fontSize: 14 },
});
