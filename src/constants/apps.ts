// src/constants/apps.ts

export interface AvailableApp {
  id: string;
  displayName: string;
  appIdentifier: string;
}

export const AVAILABLE_APPS: AvailableApp[] = [
  {
    id: "app-instagram",
    displayName: "Instagram",
    appIdentifier: "com.instagram.android",
  },
  {
    id: "app-tiktok",
    displayName: "TikTok",
    appIdentifier: "com.zhiliaoapp.musically",
  },
  {
    id: "app-youtube",
    displayName: "YouTube",
    appIdentifier: "com.google.android.youtube",
  },
  {
    id: "app-facebook",
    displayName: "Facebook",
    appIdentifier: "com.facebook.katana",
  },
  { id: "app-x", displayName: "X", appIdentifier: "com.twitter.android" },
  {
    id: "app-reddit",
    displayName: "Reddit",
    appIdentifier: "com.reddit.frontpage",
  },
  {
    id: "app-snapchat",
    displayName: "Snapchat",
    appIdentifier: "com.snapchat.android",
  },
];

export const REMOVAL_REASONS = [
  "Ya no la uso",
  "Cambié de rutina",
  "Quiero probar sin límite por un tiempo",
  "Otro motivo",
];

export const REMOVAL_DELAY_HOURS = 24;
