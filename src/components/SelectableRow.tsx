// src/components/SelectableRow.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../constants/colors";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function SelectableRow({ label, selected, onPress }: Props) {
  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      <View style={[styles.dot, selected && styles.dotSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
  },
  label: { fontSize: 16, color: colors.textPrimary, flex: 1 },
  labelSelected: { fontWeight: "600" },
  dot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textTertiary,
  },
  dotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
