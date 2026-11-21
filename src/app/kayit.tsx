import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Alan, Buton, Uyari } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

/** Kayıt: hesap açılınca oturum da açılıyor; misafir sepeti hesaba taşınıyor. */
export default function Kayit() {
  const router = useRouter();
  const { kayitOl } = useOturum();
  const mesaj = useMesaj();
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function gonder() {
    setHata("");
    setGonderiliyor(true);
    try {
      await kayitOl(ad.trim(), email.trim(), parola);
      mesaj("Hesabınız oluşturuldu. E-postanızı doğrulamayı unutmayın.", "basari");
      // Doğrudan bu ekrana gelindiyse (bağlantı, web) geri gidilecek ekran yok.
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={st.kap} keyboardShouldPersistTaps="handled">
        <Text style={st.baslik}>Hesap oluşturun</Text>
        <Text style={st.alt}>Sepetiniz korunur, siparişlerinizi takip kodu olmadan görürsünüz.</Text>
        {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
        <Alan etiket="Ad soyad" value={ad} onChangeText={setAd} autoComplete="name" textContentType="name" maxLength={120} />
        <Alan
          etiket="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={254}
        />
        <Alan
          etiket="Parola"
          value={parola}
          onChangeText={setParola}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          ipucu="En az 10 karakter; harf ve rakam içersin."
          maxLength={200}
        />
        <Buton baslik="Kayıt ol" yukleniyor={gonderiliyor} disabled={!ad || !email || !parola} onPress={gonder} />
        <Pressable onPress={() => router.replace("/giris")} style={{ alignSelf: "center", padding: 8 }} accessibilityRole="link">
          <Text style={st.link}>Zaten hesabınız var mı? Giriş yapın</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  kap: { padding: bosluk.xl, gap: bosluk.l },
  baslik: { fontSize: 24, fontWeight: "800", color: renk.murekkep900 },
  alt: { fontSize: 15, color: renk.murekkep500, lineHeight: 22 },
  link: { color: renk.marka600, fontWeight: "700", fontSize: 14 }
});
