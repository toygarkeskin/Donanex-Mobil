import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiHatasi, erisimAyarla, sepetKimligiSil, yenileyiciBagla } from "@/lib/api";
import { ANAHTAR, gizli } from "@/lib/depo";
import { girisBaslat, jetonYenile, kodDegistir, koduAl, type GirisIstegi, type Jetonlar } from "@/lib/giris";

export interface Kullanici {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  emailVerified?: boolean;
}

/** Parola adımından sonra kod bekleniyor. */
export interface KodBekleniyor {
  challengeId: string;
  maskedEmail: string;
}

interface OturumDegeri {
  hazir: boolean;
  kullanici: Kullanici | null;
  /** Parola adımı. Kod gerekiyorsa onu döndürür; gerekmiyorsa (güvenilen cihaz) oturum açılır ve null döner. */
  parolaGonder(email: string, parola: string): Promise<KodBekleniyor | null>;
  kodGonder(challengeId: string, kod: string): Promise<void>;
  koduYenidenGonder(challengeId: string): Promise<number>;
  kayitOl(adSoyad: string, email: string, parola: string): Promise<void>;
  cikis(): Promise<void>;
  yenile(): Promise<void>;
}

const Baglam = createContext<OturumDegeri | null>(null);

export function OturumSaglayici({ children, onDegisti }: { children: ReactNode; onDegisti?: () => void }) {
  const [hazir, setHazir] = useState(false);
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const istek = useRef<GirisIstegi | null>(null);
  const yenileniyor = useRef<Promise<string | null> | null>(null);
  const degisti = useRef(onDegisti);
  degisti.current = onDegisti;

  const temizle = useCallback(async () => {
    erisimAyarla(null);
    setKullanici(null);
    await gizli.del(ANAHTAR.yenileme);
  }, []);

  /*
   * Yenileme aynı anda bir kez: sunucu döndürülen yenileme jetonunun ikinci
   * kullanımını hırsızlık sayıp tüm zinciri kapatıyor (web'deki kuralın aynısı).
   */
  const sessizYenile = useCallback((): Promise<string | null> => {
    if (yenileniyor.current) return yenileniyor.current;
    yenileniyor.current = (async () => {
      try {
        const eski = await gizli.get(ANAHTAR.yenileme);
        if (!eski) return null;
        const jeton = await jetonYenile(eski);
        await jetonlariYaz(jeton);
        return jeton.access_token;
      } catch {
        await temizle();
        return null;
      } finally {
        yenileniyor.current = null;
      }
    })();
    return yenileniyor.current;
  }, [temizle]);

  async function jetonlariYaz(jeton: Jetonlar) {
    erisimAyarla(jeton.access_token);
    if (jeton.refresh_token) await gizli.set(ANAHTAR.yenileme, jeton.refresh_token);
  }

  const kullaniciYukle = useCallback(async () => {
    try {
      setKullanici(await api.get<Kullanici>("/me"));
    } catch {
      setKullanici(null);
    }
  }, []);

  useEffect(() => {
    yenileyiciBagla(sessizYenile, () => {
      void temizle();
    });
    (async () => {
      const jeton = await sessizYenile();
      if (jeton) await kullaniciYukle();
      setHazir(true);
    })();
  }, [sessizYenile, kullaniciYukle, temizle]);

  /** Kod ya da kayıt sonrası: dönüş adresinden kodu al, jetona çevir. */
  async function tamamla(redirectTo: string) {
    const bekleyen = istek.current;
    if (!bekleyen) throw new Error("Giriş isteği bulunamadı. Lütfen yeniden deneyin.");
    const jeton = await kodDegistir(koduAl(redirectTo, bekleyen.durum), bekleyen.dogrulayici);
    istek.current = null;
    await jetonlariYaz(jeton);
    // Misafir sepeti girişte kullanıcınınkiyle birleşti; misafir kimliği artık gereksiz.
    await sepetKimligiSil();
    await kullaniciYukle();
    degisti.current?.();
  }

  async function istekHazirla(): Promise<GirisIstegi> {
    const yeni = await girisBaslat();
    istek.current = yeni;
    return yeni;
  }

  const deger: OturumDegeri = {
    hazir,
    kullanici,

    async parolaGonder(email, parola) {
      const bekleyen = await istekHazirla();
      if (bekleyen.hazirKod) {
        // Sunucuda açık oturum var: kod hazır, parola adımı gereksiz.
        const jeton = await kodDegistir(bekleyen.hazirKod, bekleyen.dogrulayici);
        istek.current = null;
        await jetonlariYaz(jeton);
        await sepetKimligiSil();
        await kullaniciYukle();
        degisti.current?.();
        return null;
      }
      const yanit = await api.post<any>("/auth/sign-in", { email, password: parola, authRequestId: bekleyen.authRequestId });
      if (yanit.verificationRequired) return { challengeId: yanit.challengeId, maskedEmail: yanit.maskedEmail };
      await tamamla(yanit.redirectTo);
      return null;
    },

    async kodGonder(challengeId, kod) {
      const dogrula = () =>
        api.post<any>("/auth/sign-in/verify", { challengeId, code: kod, authRequestId: istek.current?.authRequestId });
      let yanit;
      try {
        yanit = await dogrula();
      } catch (hata) {
        /*
         * Kod ekranında uzun beklenip (kod yeniden istenince) yetkilendirme
         * isteğinin 15 dakikası dolduysa: sunucu kodu harcamadan reddediyor,
         * yeni istek açıp aynı kodu bir kez daha gönderiyoruz.
         */
        if (!(hata instanceof ApiHatasi) || hata.ayrinti?.reason !== "auth_request_expired") throw hata;
        await istekHazirla();
        yanit = await dogrula();
      }
      await tamamla(yanit.redirectTo);
    },

    async koduYenidenGonder(challengeId) {
      const yanit = await api.post<{ retryAfterSeconds: number }>("/auth/sign-in/resend", { challengeId });
      return yanit.retryAfterSeconds ?? 30;
    },

    async kayitOl(adSoyad, email, parola) {
      const bekleyen = await istekHazirla();
      const yanit = await api.post<any>("/auth/register", {
        fullName: adSoyad,
        email,
        password: parola,
        authRequestId: bekleyen.authRequestId
      });
      await tamamla(yanit.redirectTo);
    },

    async cikis() {
      const yenileme = await gizli.get(ANAHTAR.yenileme);
      await api.post("/auth/sign-out", {}).catch(() => {});
      if (yenileme) await api("/oauth/revoke", { method: "POST", form: { token: yenileme } }).catch(() => {});
      await temizle();
      degisti.current?.();
    },

    yenile: kullaniciYukle
  };

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useOturum() {
  const d = useContext(Baglam);
  if (!d) throw new Error("useOturum OturumSaglayici içinde kullanılmalı");
  return d;
}

export const useGirisli = () => Boolean(useOturum().kullanici);
