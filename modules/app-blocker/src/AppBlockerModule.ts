import { requireNativeModule } from "expo-modules-core";

interface AppBlockerModuleType {
  hasAccessibilityPermission(): boolean;
  openAccessibilitySettings(): void;
  setBlockedPackages(packages: string[]): void;
  getBlockedPackages(): string[];
}

const AppBlockerModule =
  requireNativeModule<AppBlockerModuleType>("AppBlocker");

export default AppBlockerModule;
