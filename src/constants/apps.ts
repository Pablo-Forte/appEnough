// src/constants/apps.ts

export interface AvailableApp {
  id: string;
  displayName: string;
  appIdentifier: string;
  emoji: string;
}

export const AVAILABLE_APPS: AvailableApp[] = [
  {
    id: "app-instagram",
    displayName: "Instagram",
    appIdentifier: "com.instagram.android",
    emoji: "📸",
  },
  {
    id: "app-tiktok",
    displayName: "TikTok",
    appIdentifier: "com.zhiliaoapp.musically",
    emoji: "🎵",
  },
  {
    id: "app-youtube",
    displayName: "YouTube",
    appIdentifier: "com.google.android.youtube",
    emoji: "▶️",
  },
  {
    id: "app-facebook",
    displayName: "Facebook",
    appIdentifier: "com.facebook.katana",
    emoji: "👥",
  },
  {
    id: "app-x",
    displayName: "X",
    appIdentifier: "com.twitter.android",
    emoji: "✖️",
  },
  {
    id: "app-reddit",
    displayName: "Reddit",
    appIdentifier: "com.reddit.frontpage",
    emoji: "👽",
  },
  {
    id: "app-snapchat",
    displayName: "Snapchat",
    appIdentifier: "com.snapchat.android",
    emoji: "👻",
  },
];

export function emojiForApp(appId: string): string {
  return AVAILABLE_APPS.find((a) => a.id === appId)?.emoji ?? "📱";
}

export const REMOVAL_REASONS = [
  "Ya no la uso",
  "Cambié de rutina",
  "Quiero probar sin límite por un tiempo",
  "Otro motivo",
];

export const REMOVAL_DELAY_HOURS = 24;
