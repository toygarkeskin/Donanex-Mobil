import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Alan, Buton, Kart, Uyari } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

/** Ad, telefon ve parola (web'deki Hesabım > Hesap bilgilerim). */
export default function Profil() {
  const { kullanici, hazir, yenile, cikis } = useOturum();
  const router = useRouter();
  const mesaj = useMesaj();
  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [profilKaydediliyor, setProfilKaydediliyor] = useState(false);
  const [mevcut, setMevcut] = useState("");
  const [yeni, setYeni] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [parolaHatasi, setParolaHatasi] = useState("");
  const [parolaKaydediliyor, setParolaKaydediliyor] = useState(false);

  useEffect(() => {
    setAd(kullanici?.fullName ?? "");
    setTelefon(kullanici?.phone ?? "");
  }, [kullanici]);

  if (hazir && !kullanici) return <Redirect href="/giris" />;

  async function profilKaydet() {
    setProfilKaydediliyor(true);
    try {
      const r = await api.put<{ message?: string }>("/me/profile", { fullName: ad, phone: telefon });
      await yenile();
      mesaj(r.message ?? "Bilgileriniz güncellendi.", "basari");
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setProfilKaydediliyor(false);
    }
  }

  async function parolaDegistir() {
    setParolaHatasi("");
    if (yeni !== tekrar) {
      setParolaHatasi("Yeni parolalar birbiriyle aynı değil.");
      return;
    }
    setParolaKaydediliyor(true);
    try {
      await api.put<{ reauthenticate?: boolean }>("/me/password", { currentPassword: mevcut, newPassword: yeni });
      /*
       * Sunucu parola değişince BÜTÜN yenileme jetonlarını iptal ediyor (bu
       * cihazınki dahil) ve reauthenticate: true dönüyor. Telefonda tarayıcı
       * oturumu olmadığı için sessizce yenilenemiyor; beklesek uygulama 15 dk
       * sonra habersiz oturumdan düşerdi. Açıkça yeni parolayla giriş isteniyor.
       */
      await cikis();
      mesaj("Parolanız değiştirildi. Yeni parolanızla giriş yapın.", "basari");
      router.replace("/giris");
    } catch (e: any) {
      setParolaHatasi(e.message);
    } finally {
      setParolaKaydediliyor(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }} keyboardShouldPersistTaps="handled">
        <Kart style={{ gap: bosluk.m }}>
          <Text style={st.baslik}>Kişisel bilgiler</Text>
          <Text style={st.kucuk}>E-posta: {kullanici?.email}</Text>
          <Alan etiket="Ad Soyad" value={ad} onChangeText={setAd} autoComplete="name" maxLength={150} />
          <Alan etiket="Telefon" value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" autoComplete="tel" maxLength={30} />
          <Buton baslik="Bilgilerimi kaydet" yukleniyor={profilKaydediliyor} disabled={!ad.trim()} onPress={profilKaydet} />
        </Kart>

        <Kart style={{ gap: bosluk.m }}>
          <Text style={st.baslik}>Parola değiştir</Text>
          <Text style={st.kucuk}>Parola değişince bütün cihazlardaki oturumlarınız kapanır; yeni parolanızla yeniden giriş yaparsınız.</Text>
          {parolaHatasi ? <Uyari ton="kotu">{parolaHatasi}</Uyari> : null}
          <Alan etiket="Mevcut parola" value={mevcut} onChangeText={setMevcut} secureTextEntry autoComplete="current-password" maxLength={200} />
          <Alan
            etiket="Yeni parola"
            ipucu="En az 10 karakter; harf ve rakam içermeli."
            value={yeni}
            onChangeText={setYeni}
            secureTextEntry
            autoComplete="new-password"
            maxLength={200}
          />
          <Alan etiket="Yeni parola (tekrar)" value={tekrar} onChangeText={setTekrar} secureTextEntry autoComplete="new-password" maxLength={200} />
          <Buton
            baslik="Parolayı değiştir"
            yukleniyor={parolaKaydediliyor}
            disabled={!mevcut || !yeni || !tekrar}
            onPress={parolaDegistir}
          />
        </Kart>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  baslik: { fontSize: 17, fontWeight: "800", color: renk.murekkep900 },
  kucuk: { fontSize: 13, color: renk.murekkep500, lineHeight: 19 }
});
