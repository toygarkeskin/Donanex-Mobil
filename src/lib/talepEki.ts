import * as DocumentPicker from "expo-document-picker";
import { api } from "./api";

/*
 * Destek talebi ekleri — web'deki kurallarla aynı: PNG, JPEG, WebP ya da
 * PDF; en fazla 5 MB; bir talepte en fazla 5 ek. Sunucu da aynı kuralları
 * uyguluyor; burada denetlemek yalnızca kullanıcıya erken haber vermek için.
 */
export const EK_TURLERI = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
export const EK_EN_FAZLA_BAYT = 5 * 1024 * 1024;
export const EK_EN_FAZLA = 5;

export interface SecilenEk {
  uri: string;
  ad: string;
  tur: string;
  boyut?: number;
}

export const boyutYaz = (bayt?: number | null) =>
  !bayt ? "" : bayt >= 1024 * 1024 ? `${(bayt / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bayt / 1024))} KB`;

/** Belge seçici; uygun olmayanlar için hata metinleri döner. */
export async function ekSec(kalanHak: number): Promise<{ ekler: SecilenEk[]; hatalar: string[] }> {
  const sonuc = await DocumentPicker.getDocumentAsync({ type: EK_TURLERI, multiple: true, copyToCacheDirectory: true });
  if (sonuc.canceled) return { ekler: [], hatalar: [] };
  const ekler: SecilenEk[] = [];
  const hatalar: string[] = [];
  for (const d of sonuc.assets) {
    const tur = d.mimeType ?? "";
    if (ekler.length >= kalanHak) {
      hatalar.push(`En fazla ${EK_EN_FAZLA} dosya eklenebilir.`);
      break;
    }
    if (!EK_TURLERI.includes(tur)) {
      hatalar.push(`${d.name}: yalnızca PNG, JPEG, WebP ve PDF eklenebilir.`);
      continue;
    }
    if (d.size && d.size > EK_EN_FAZLA_BAYT) {
      hatalar.push(`${d.name}: en fazla 5 MB olabilir (${boyutYaz(d.size)}).`);
      continue;
    }
    ekler.push({ uri: d.uri, ad: d.name, tur, boyut: d.size ?? undefined });
  }
  return { ekler, hatalar };
}

/** Eki talebe yükler (web'deki api.uploadNamed: ham gövde + dosya adı başlığı). */
export async function ekYukle(talepId: string, ek: SecilenEk) {
  const blob = await (await fetch(ek.uri)).blob();
  return api(`/me/tickets/${talepId}/ekler`, {
    method: "POST",
    ham: blob,
    turu: ek.tur,
    basliklar: { "X-Dosya-Adi": encodeURIComponent(ek.ad) }
  });
}
