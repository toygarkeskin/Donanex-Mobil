import { Platform } from "react-native";
import Constants from "expo-constants";
import { ANAHTAR, ayar } from "./depo";

/*
 * Uygulama hangi Donanex sunucusuna bağlanacak?
 *
 * Sıra:
 *  1. Kullanıcının "Sunucu adresi" ekranında girdiği adres (ör. tünel adresi).
 *  2. EXPO_PUBLIC_API_URL ortam değişkeni.
 *  3. Web önizlemesi: sayfanın kendi adresi (önizleme vekili API'yi aynı
 *     adresten veriyor).
 *  4. Telefonda Expo Go: geliştirme sunucusunun (Metro) çalıştığı bilgisayar.
 *     Expo Go zaten o bilgisayara bağlandığına göre Donanex de büyük olasılıkla
 *     aynı makinede, 8090 portunda.
 */
let taban = "";

function varsayilan(): string {
  const ortam = process.env.EXPO_PUBLIC_API_URL;
  if (ortam) return temizle(ortam);
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.origin;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:8090` : "http://localhost:8090";
}

export const temizle = (adres: string) => adres.trim().replace(/\/+$/, "");

export async function sunucuYukle(): Promise<string> {
  const kayitli = await ayar.get(ANAHTAR.sunucu);
  taban = kayitli ? temizle(kayitli) : varsayilan();
  return taban;
}

export const sunucu = () => taban || varsayilan();
export const varsayilanSunucu = varsayilan;

export async function sunucuDegistir(adres: string | null): Promise<string> {
  if (adres && adres.trim()) await ayar.set(ANAHTAR.sunucu, temizle(adres));
  else await ayar.del(ANAHTAR.sunucu);
  return sunucuYukle();
}

/** Sunucunun verdiği "/yuklenen/..." gibi göreli görsel adresini tamamlar. */
export function resim(adres: string | null | undefined): string | undefined {
  if (!adres) return undefined;
  if (/^https?:\/\//.test(adres)) return adres;
  return `${sunucu()}${adres.startsWith("/") ? "" : "/"}${adres}`;
}
