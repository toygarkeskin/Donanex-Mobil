/*
 * Web sitesindeki renk belirteçlerinin aynısı (frontend/src/styles): aynı
 * marka mavisi, aynı mürekkep grisi. Uygulama sitenin "kardeşi" görünsün.
 */
export const renk = {
  marka50: "#eef4ff",
  marka100: "#dbe6fe",
  marka200: "#bfd3fe",
  marka500: "#3b6ef0",
  marka600: "#2456d8",
  marka700: "#1d44ae",
  gece: "#0f1729",
  murekkep50: "#f6f7f9",
  murekkep100: "#eceef2",
  murekkep200: "#d6dae2",
  murekkep300: "#b1b8c6",
  murekkep400: "#7d8798",
  murekkep500: "#5b6475",
  murekkep600: "#434b59",
  murekkep700: "#343a45",
  murekkep800: "#252a33",
  murekkep900: "#12151b",
  beyaz: "#ffffff",
  yesil: "#047857",
  yesilAcik: "#ecfdf5",
  kirmizi: "#b91c1c",
  kirmiziAcik: "#fef2f2",
  amber: "#f59e0b",
  amberAcik: "#fffbeb"
} as const;

export const bosluk = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const kose = { s: 8, m: 12, l: 16, tam: 999 } as const;

export const golge = {
  shadowColor: "#0f1729",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2
} as const;
