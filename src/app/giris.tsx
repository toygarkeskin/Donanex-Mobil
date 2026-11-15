import { useEffect, useRef, useState, type ComponentRef } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useOturum, type KodBekleniyor } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Alan, Buton, Uyari } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

/**
 * İki adımlı giriş: parola, ardından e-postaya gelen 6 haneli kod. Kod
 * alanı "one-time-code" olarak işaretli: iOS ve Android e-postadaki kodu
 * klavyenin üstünde öneriyor.
 */
export default function Giris() {
  const router = useRouter();
  const oturum = useOturum();
  const mesaj = useMesaj();
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [bekleyen, setBekleyen] = useState<KodBekleniyor | null>(null);
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [bekleme, setBekleme] = useState(0);
  const kodAlani = useRef<ComponentRef<typeof TextInput>>(null);
  const parolaAlani = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (bekleme <= 0) return;
    const t = setTimeout(() => setBekleme(bekleme - 1), 1000);
    return () => clearTimeout(t);
  }, [bekleme]);

  function bitti() {
    mesaj("Giriş yapıldı.", "basari");
    // Doğrudan bu ekrana gelindiyse (bağlantı, web) geri gidilecek ekran yok.
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function parolaGonder() {
    setHata("");
    setGonderiliyor(true);
    try {
      const sonuc = await oturum.parolaGonder(email.trim(), parola);
      if (!sonuc) return bitti();
      setBekleyen(sonuc);
      setKod("");
      setBekleme(30);
      setTimeout(() => kodAlani.current?.focus(), 250);
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  async function kodGonder(deger = kod) {
    if (!bekleyen || deger.length !== 6 || gonderiliyor) return;
    setHata("");
    setGonderiliyor(true);
    try {
      await oturum.kodGonder(bekleyen.challengeId, deger);
      bitti();
    } catch (e: any) {
      setHata(e.message);
      setKod("");
      // Kod öldüyse (süre ya da deneme sınırı) parola adımına dönülüyor.
      if (/yeniden giriş/i.test(e.message)) setBekleyen(null);
      else kodAlani.current?.focus();
    } finally {
      setGonderiliyor(false);
    }
  }

  async function yenidenGonder() {
    if (!bekleyen) return;
    setHata("");
    try {
      setBekleme(await oturum.koduYenidenGonder(bekleyen.challengeId));
      mesaj("Yeni kod gönderildi.", "basari");
    } catch (e: any) {
      setHata(e.message);
      if (/yeniden giriş/i.test(e.message)) setBekleyen(null);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={st.kap} keyboardShouldPersistTaps="handled">
        {!bekleyen ? (
          <>
            <Text style={st.baslik}>Hesabınıza girin</Text>
            <Text style={st.alt}>Siparişlerinizi takip edin, yorum yazın, satıcılara soru sorun.</Text>
            {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
            <Alan
              etiket="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => parolaAlani.current?.focus()}
              maxLength={254}
            />
            <Alan
              ref={parolaAlani}
              etiket="Parola"
              value={parola}
              onChangeText={setParola}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={parolaGonder}
              maxLength={200}
            />
            <Buton baslik="Devam et" yukleniyor={gonderiliyor} disabled={!email || !parola} onPress={parolaGonder} />
            <Pressable onPress={() => router.replace("/kayit")} style={{ alignSelf: "center", padding: 8 }} accessibilityRole="link">
              <Text style={st.link}>Hesabınız yok mu? Kayıt olun</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={st.baslik}>Doğrulama kodu</Text>
            <Text style={st.alt}>
              <Text style={{ fontWeight: "700", color: renk.murekkep800 }}>{bekleyen.maskedEmail}</Text> adresine 6 haneli bir kod
              gönderdik. Kod 10 dakika geçerli.
            </Text>
            {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
            <TextInput
              ref={kodAlani}
              value={kod}
              onChangeText={(t) => {
                const temiz = t.replace(/\D/g, "").slice(0, 6);
                setKod(temiz);
                if (temiz.length === 6) void kodGonder(temiz);
              }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={renk.murekkep300}
              style={st.kod}
              accessibilityLabel="Doğrulama kodu"
            />
            <Text style={st.ipucu}>E-postayı göremiyorsanız gereksiz klasörüne bakın.</Text>
            <Buton baslik="Giriş yap" yukleniyor={gonderiliyor} disabled={kod.length !== 6} onPress={() => kodGonder()} />
            <View style={st.altSatir}>
              <Pressable onPress={() => setBekleyen(null)} hitSlop={8} accessibilityRole="button">
                <Text style={st.ikincil}>← Farklı hesap</Text>
              </Pressable>
              <Pressable onPress={yenidenGonder} disabled={bekleme > 0} hitSlop={8} accessibilityRole="button">
                <Text style={[st.link, bekleme > 0 && { color: renk.murekkep400 }]}>
                  {bekleme > 0 ? `Yeni kod (${bekleme} sn)` : "Kodu yeniden gönder"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  kap: { padding: bosluk.xl, gap: bosluk.l },
  baslik: { fontSize: 24, fontWeight: "800", color: renk.murekkep900 },
  alt: { fontSize: 15, color: renk.murekkep500, lineHeight: 22 },
  link: { color: renk.marka600, fontWeight: "700", fontSize: 14 },
  ikincil: { color: renk.murekkep500, fontWeight: "600", fontSize: 14 },
  kod: {
    height: 64,
    borderWidth: 1,
    borderColor: renk.murekkep200,
    borderRadius: kose.m,
    backgroundColor: renk.beyaz,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 12,
    textAlign: "center",
    color: renk.murekkep900,
    fontVariant: ["tabular-nums"]
  },
  ipucu: { fontSize: 12, color: renk.murekkep500, marginTop: -8 },
  altSatir: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
