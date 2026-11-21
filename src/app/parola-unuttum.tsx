import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { Alan, Buton, Uyari } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

/**
 * Parola sıfırlama isteği. Yanıt her zaman aynı: bir e-postanın kayıtlı olup
 * olmadığı bu uçtan anlaşılamıyor (hesap sayımını engeller). Bağlantı
 * e-postayla gelir ve web sitesinde açılır; yeni parola orada belirlenir.
 */
export default function ParolaUnuttum() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sonuc, setSonuc] = useState("");
  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function gonder() {
    setHata("");
    setGonderiliyor(true);
    try {
      const r = await api.post<{ message: string }>("/auth/password/forgot", { email: email.trim() });
      setSonuc(r.message);
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }} keyboardShouldPersistTaps="handled">
        <Text style={st.alt}>E-posta adresinize sıfırlama bağlantısı gönderelim. Bağlantı web sitesinde açılır.</Text>
        {sonuc ? (
          <>
            <Uyari ton="iyi">{sonuc}</Uyari>
            <Buton baslik="Girişe dön" onPress={() => (router.canGoBack() ? router.back() : router.replace("/giris"))} />
          </>
        ) : (
          <>
            {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
            <Alan
              etiket="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={gonder}
              maxLength={254}
            />
            <Buton baslik="Bağlantı gönder" yukleniyor={gonderiliyor} disabled={!email.trim()} onPress={gonder} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  alt: { fontSize: 14, color: renk.murekkep600, lineHeight: 20 }
});
