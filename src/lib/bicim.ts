/*
 * Biçimlendirme: web sitesindeki lib/format.js ile aynı çıktı ("₺80.497,00",
 * "16 Kas 2026 14:05", "3 saat önce").
 *
 * Intl KULLANILMIYOR: telefondaki JavaScript motoru Hermes'te Intl eksik.
 * iOS'ta Intl.RelativeTimeFormat hiç yok (modül yüklenirken "undefined cannot
 * be used as a constructor" ile uygulama açılmıyordu), NumberFormat /
 * DateTimeFormat ve toLocaleString de platforma göre farklı ya da yerelsiz
 * sonuç veriyor. Biçimler sabit ve Türkçe; elle yazmak her cihazda aynı sonucu
 * veriyor.
 */
export type Para = { cents: number; amount?: string; currency?: string } | null | undefined;

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const iki = (n: number) => (n < 10 ? "0" : "") + n;

/** 1234567 → "1.234.567" (binlik ayırıcı nokta). */
function binlik(tam: number): string {
  return String(tam).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Sayıyı Türkçe yazar: 4.5 → "4,5", 1234 → "1.234". */
export function sayi(deger: number, basamak?: number): string {
  if (!Number.isFinite(deger)) return "—";
  const isaret = deger < 0 ? "-" : "";
  const mutlak = Math.abs(deger);
  const metin = basamak === undefined ? String(Math.round(mutlak * 100) / 100) : mutlak.toFixed(basamak);
  const [tam, kesir] = metin.split(".");
  return isaret + binlik(Number(tam)) + (kesir ? "," + kesir : "");
}

export function para(deger: Para | number): string {
  if (deger === null || deger === undefined) return "—";
  const kurus = Math.round(Number(typeof deger === "object" ? deger.cents : deger) || 0);
  const isaret = kurus < 0 ? "-" : "";
  const mutlak = Math.abs(kurus);
  return `${isaret}₺${binlik(Math.floor(mutlak / 100))},${iki(mutlak % 100)}`;
}

export function tarih(deger: string | Date | null | undefined, saatli = true): string {
  if (!deger) return "—";
  const d = new Date(deger);
  if (Number.isNaN(d.getTime())) return "—";
  const gun = `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
  return saatli ? `${gun} ${iki(d.getHours())}:${iki(d.getMinutes())}` : gun;
}

const BIRIMLER: [string, number][] = [
  ["yıl", 365 * 86400],
  ["ay", 30 * 86400],
  ["gün", 86400],
  ["saat", 3600],
  ["dakika", 60]
];

export function gecenSure(deger: string | null | undefined): string {
  if (!deger) return "";
  const d = new Date(deger);
  if (Number.isNaN(d.getTime())) return "";
  const saniye = Math.round((d.getTime() - Date.now()) / 1000);
  for (const [birim, uzunluk] of BIRIMLER) {
    if (Math.abs(saniye) < uzunluk) continue;
    const n = Math.round(Math.abs(saniye) / uzunluk);
    if (n === 1 && birim === "gün") return saniye < 0 ? "dün" : "yarın";
    return saniye < 0 ? `${n} ${birim} önce` : `${n} ${birim} sonra`;
  }
  return "az önce";
}

/** Türkçe büyük harf: "istanbul" → "İSTANBUL" (toLocaleUpperCase Hermes'te yerelsiz). */
export function buyukHarf(metin: string): string {
  return metin.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();
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

export const TALEP_DURUMU: Record<string, { etiket: string; ton: Ton }> = {
  open: { etiket: "Açık", ton: "uyari" },
  in_progress: { etiket: "İnceleniyor", ton: "bilgi" },
  answered: { etiket: "Yanıtlandı", ton: "iyi" },
  closed: { etiket: "Kapatıldı", ton: "bilgi" }
};

export const SEPET_SORUNU: Record<string, string> = {
  removed: "Bu ürün kaldırılmış.",
  unavailable: "Bu ürün şu anda satışta değil.",
  insufficient_stock: "Stok yetersiz, adedi azaltın."
};

export type Ton = "iyi" | "bilgi" | "uyari" | "kotu";
