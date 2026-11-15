import { ANAHTAR, ayar } from "./depo";
import { sunucu } from "./sunucu";

/*
 * Tek HTTP istemcisi — web sitesindeki lib/api.js'in telefon karşılığı.
 *
 * Farklar:
 *  - Erişim jetonu bellekte, yenileme jetonu cihazın güvenli deposunda
 *    (tarayıcıdaki HttpOnly çerezin yerine).
 *  - Misafir sepet kimliği çerezle değil X-Sepet başlığıyla taşınıyor;
 *    sunucu yeni sepet açınca kimliği aynı başlıkla geri veriyor.
 */
export class ApiHatasi extends Error {
  durum: number;
  kod?: string;
  constructor(mesaj: string, durum: number, kod?: string) {
    super(mesaj);
    this.name = "ApiHatasi";
    this.durum = durum;
    this.kod = kod;
  }
}

let erisim: string | null = null;
let sepetKimligi: string | null = null;
let yenileyici: (() => Promise<string | null>) | null = null;
let oturumDustu: () => void = () => {};

export const erisimAyarla = (jeton: string | null) => {
  erisim = jeton;
};
export const erisimVar = () => Boolean(erisim);
export const yenileyiciBagla = (fn: () => Promise<string | null>, dustu: () => void) => {
  yenileyici = fn;
  oturumDustu = dustu;
};

export async function sepetKimligiYukle() {
  sepetKimligi = await ayar.get(ANAHTAR.sepet);
}
export async function sepetKimligiSil() {
  sepetKimligi = null;
  await ayar.del(ANAHTAR.sepet);
}

type Secenek = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Ham gövde (görsel yükleme): Content-Type çağırandan gelir. */
  ham?: Blob;
  turu?: string;
  form?: Record<string, string>;
  basliklar?: Record<string, string>;
  yeniden?: boolean;
};

export async function api<T = any>(yol: string, secenek: Secenek = {}): Promise<T> {
  const { method = "GET", body, ham, turu, form, basliklar = {}, yeniden = false } = secenek;
  const adres = yol.startsWith("http") ? yol : `${sunucu()}${yol.startsWith("/oauth") ? "" : "/api"}${yol}`;

  const headers: Record<string, string> = { Accept: "application/json", ...basliklar };
  let govde: BodyInit | undefined;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    govde = Object.entries(form)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
  } else if (ham) {
    headers["Content-Type"] = turu ?? "application/octet-stream";
    govde = ham;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    govde = JSON.stringify(body);
  }
  if (erisim) headers.Authorization = `Bearer ${erisim}`;
  else if (sepetKimligi) headers["X-Sepet"] = sepetKimligi;

  let yanit: Response;
  try {
    yanit = await fetch(adres, { method, headers, body: govde });
  } catch {
    throw new ApiHatasi(`Sunucuya ulaşılamadı (${sunucu()}). Bağlantınızı ya da Hesap > Sunucu adresi ayarını kontrol edin.`, 0);
  }

  const yeniSepet = yanit.headers.get("x-sepet");
  if (yeniSepet && !erisim) {
    sepetKimligi = yeniSepet;
    void ayar.set(ANAHTAR.sepet, yeniSepet);
  }

  if (yanit.status === 401 && erisim && !yeniden && yenileyici && !yol.startsWith("/oauth")) {
    const yeni = await yenileyici();
    if (yeni) return api<T>(yol, { ...secenek, yeniden: true });
    oturumDustu();
  }

  const metin = await yanit.text();
  let veri: any = null;
  try {
    veri = metin ? JSON.parse(metin) : null;
  } catch {
    veri = null;
  }

  if (!yanit.ok) {
    const mesaj = veri?.message || veri?.error_description || `İstek başarısız (${yanit.status}).`;
    throw new ApiHatasi(mesaj, yanit.status, veri?.error);
  }
  return veri as T;
}

api.get = <T = any>(yol: string, basliklar?: Record<string, string>) => api<T>(yol, { basliklar });
api.post = <T = any>(yol: string, body: unknown = {}) => api<T>(yol, { method: "POST", body });
api.put = <T = any>(yol: string, body: unknown = {}) => api<T>(yol, { method: "PUT", body });
api.delete = <T = any>(yol: string) => api<T>(yol, { method: "DELETE" });

/** Sorgu dizesi; boş değerler atlanır. */
export function sorgu(degerler: Record<string, string | number | null | undefined>) {
  const parca = Object.entries(degerler)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parca.length ? `?${parca.join("&")}` : "";
}
