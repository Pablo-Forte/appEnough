import { requireNativeModule } from "expo-modules-core";

export interface AppUsage {
  packageName: string;
  minutesUsed: number;
}

interface UsageStatsModuleType {
  hasUsageAccessPermission(): boolean;
  openUsageAccessSettings(): void;
  getTodayUsageStats(): AppUsage[];
}

const UsageStatsModule =
  requireNativeModule<UsageStatsModuleType>("UsageStats");

export default UsageStatsModule;
