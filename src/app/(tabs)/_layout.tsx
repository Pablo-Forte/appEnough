// src/app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

interface TabIconProps {
  focused: boolean;
  shape: "circle" | "square" | "triangle" | "diamond";
}

function TabIcon({ focused, shape }: TabIconProps) {
  const color = focused ? colors.accent : colors.textTertiary;
  return (
    <View style={styles.iconWrap}>
      <View
        style={[
          styles.shapeBase,
          shape === "circle" && { borderRadius: 999 },
          shape === "diamond" && { transform: [{ rotate: "45deg" }] },
          shape === "triangle" && styles.triangle,
          {
            borderColor: color,
            backgroundColor: focused ? color : "transparent",
          },
          shape === "triangle" && {
            borderBottomColor: focused ? color : color,
          },
        ]}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          ...typography.label,
          textTransform: "none",
          fontSize: 11,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} shape="circle" />
          ),
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: "Apps",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} shape="square" />
          ),
        }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: "Estadísticas",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} shape="triangle" />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} shape="diamond" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center", height: 20 },
  shapeBase: { width: 12, height: 12, borderWidth: 1.5 },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 11,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopWidth: 0,
  },
});
