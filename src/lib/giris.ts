import * as Crypto from "expo-crypto";
import { api } from "./api";

/*
 * OAuth 2.1 yetkilendirme kodu + PKCE, telefon için.
 *
 * Web sitesiyle aynı sunucu akışı; tek fark tarayıcıya hiç gidilmemesi:
 *   1. /oauth/authorize JSON olarak çağrılır → bekleyen isteğin kimliği
 *   2. /api/auth/sign-in (parola) → e-postaya 6 haneli kod gider
 *   3. /api/auth/sign-in/verify (kod) → dönüş adresi, içinde yetkilendirme kodu
 *   4. /oauth/token (kod + doğrulayıcı) → erişim + yenileme jetonu
 * Dönüş adresi "donanexmobil://giris?code=…" hiç açılmıyor; kod oradan okunuyor.
 */
export const ISTEMCI = "donanex-mobil";
export const DONUS = "donanexmobil://giris";
const KAPSAM = "openid profile email shop";

export interface Jetonlar {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface GirisIstegi {
  authRequestId: string | null;
  dogrulayici: string;
  durum: string;
  /** Tarayıcı oturumu zaten açıksa sunucu kodu doğrudan verir. */
  hazirKod: string | null;
}

const base64url = (b64: string) => b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function rastgele(bayt: number): string {
  const dizi = Crypto.getRandomBytes(bayt);
  let ikili = "";
  dizi.forEach((b) => (ikili += String.fromCharCode(b)));
  return base64url(btoa(ikili));
}

/** React Native'in URL'si searchParams desteklemiyor; basit ayrıştırıcı. */
export function parametre(adres: string, ad: string): string | null {
  const eslesme = adres.match(new RegExp(`[?&#]${ad}=([^&#]*)`));
  return eslesme ? decodeURIComponent(eslesme[1].replace(/\+/g, " ")) : null;
}

export async function girisBaslat(): Promise<GirisIstegi> {
  const dogrulayici = rastgele(48);
  const ozet = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dogrulayici, {
    encoding: Crypto.CryptoEncoding.BASE64
  });
  const durum = rastgele(16);

  const yol =
    `/oauth/authorize?response_type=code&client_id=${ISTEMCI}` +
    `&redirect_uri=${encodeURIComponent(DONUS)}&scope=${encodeURIComponent(KAPSAM)}` +
    `&state=${durum}&code_challenge=${base64url(ozet)}&code_challenge_method=S256` +
    // Her girişte parola + kod: misafir sepeti ancak bu adımda hesaba taşınıyor.
    `&prompt=login`;

  const { redirectTo } = await api.get<{ redirectTo: string }>(yol);
  if (redirectTo.startsWith(DONUS)) {
    return { authRequestId: null, dogrulayici, durum, hazirKod: koduAl(redirectTo, durum) };
  }
  return { authRequestId: parametre(redirectTo, "auth"), dogrulayici, durum, hazirKod: null };
}

/** Dönüş adresinden kodu çıkarır; state tutmazsa reddeder (araya giren yanıt). */
export function koduAl(redirectTo: string, durum: string): string {
  if (parametre(redirectTo, "state") !== durum) throw new Error("Giriş yanıtı doğrulanamadı. Lütfen yeniden deneyin.");
  const kod = parametre(redirectTo, "code");
  if (!kod) throw new Error("Sunucu yetkilendirme kodu vermedi.");
  return kod;
}

export function kodDegistir(kod: string, dogrulayici: string): Promise<Jetonlar> {
  return api<Jetonlar>("/oauth/token", {
    method: "POST",
    form: {
      grant_type: "authorization_code",
      code: kod,
      redirect_uri: DONUS,
      client_id: ISTEMCI,
      code_verifier: dogrulayici
    }
  });
}

export function jetonYenile(yenileme: string): Promise<Jetonlar> {
  return api<Jetonlar>("/oauth/token", {
    method: "POST",
    form: { grant_type: "refresh_token", refresh_token: yenileme, client_id: ISTEMCI }
  });
}
