/*
 * Biçimlendirme: web sitesindeki lib/format.js'in aynısı. Intl telefonda da
 * var (Hermes); Türkçe para ve tarih biçimi iki tarafta aynı görünüyor.
 */
export type Para = { cents: number; amount?: string; currency?: string } | null | undefined;

const paraBicimi = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const tarihSaat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });
const tarihBicimi = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

export function para(deger: Para | number): string {
  if (deger === null || deger === undefined) return "—";
  const kurus = typeof deger === "object" ? deger.cents : deger;
  return paraBicimi.format(Number(kurus || 0) / 100);
}

export function tarih(deger: string | Date | null | undefined, saatli = true): string {
  if (!deger) return "—";
  const d = new Date(deger);
  if (Number.isNaN(d.getTime())) return "—";
  return (saatli ? tarihSaat : tarihBicimi).format(d);
}

const BIRIMLER: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60]
];
const goreli = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

export function gecenSure(deger: string | null | undefined): string {
  if (!deger) return "";
  const d = new Date(deger);
  if (Number.isNaN(d.getTime())) return "";
  const saniye = Math.round((d.getTime() - Date.now()) / 1000);
  for (const [birim, uzunluk] of BIRIMLER) {
    if (Math.abs(saniye) >= uzunluk) return goreli.format(Math.round(saniye / uzunluk), birim);
  }
  return "az önce";
}

export const SIPARIS_DURUMU: Record<string, { etiket: string; ton: Ton }> = {
  pending_payment: { etiket: "Ödeme bekleniyor", ton: "uyari" },
  paid: { etiket: "Ödendi", ton: "bilgi" },
  payment_failed: { etiket: "Ödeme başarısız", ton: "kotu" },
  cancelled: { etiket: "İptal edildi", ton: "kotu" },
  completed: { etiket: "Tamamlandı", ton: "iyi" }
};

export const PAKET_DURUMU: Record<string, { etiket: string; ton: Ton }> = {
  pending: { etiket: "Bekliyor", ton: "uyari" },
  preparing: { etiket: "Hazırlanıyor", ton: "bilgi" },
  shipped: { etiket: "Kargoya verildi", ton: "bilgi" },
  delivered: { etiket: "Teslim edildi", ton: "iyi" },
  cancelled: { etiket: "İptal edildi", ton: "kotu" },
  refunded: { etiket: "İade edildi", ton: "kotu" }
};

export const SEPET_SORUNU: Record<string, string> = {
  removed: "Bu ürün kaldırılmış.",
  unavailable: "Bu ürün şu anda satışta değil.",
  insufficient_stock: "Stok yetersiz, adedi azaltın."
};

export type Ton = "iyi" | "bilgi" | "uyari" | "kotu";
