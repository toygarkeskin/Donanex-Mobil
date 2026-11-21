import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { EK_EN_FAZLA, boyutYaz, ekSec, ekYukle, type SecilenEk } from "@/lib/talepEki";
import { useOturum } from "@/state/Oturum";
import { Alan, Buton, Kart, Uyari } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

/**
 * Yeni destek talebi (web'deki /destek). Misafir de yazabilir; ek yalnızca
 * GİRİŞ YAPMIŞ kullanıcıya açık — ek, talepten sonra ayrı bir istekle
 * yükleniyor ve o uç talebin sahibini soruyor (web'deki gerekçenin aynısı).
 */
export default function Destek() {
  const router = useRouter();
  const { kullanici } = useOturum();
  const [email, setEmail] = useState("");
  const [ad, setAd] = useState("");
  const [konu, setKonu] = useState("");
  const [metin, setMetin] = useState("");
  const [ekler, setEkler] = useState<SecilenEk[]>([]);
  const [ekHatasi, setEkHatasi] = useState("");
  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState<{ reference: string; id: string; ekSayisi: number; yuklenemeyen: string[] } | null>(null);

  useEffect(() => {
    if (kullanici) {
      setEmail(kullanici.email);
      setAd(kullanici.fullName);
    }
  }, [kullanici]);

  async function dosyaSec() {
    setEkHatasi("");
    const { ekler: yeni, hatalar } = await ekSec(EK_EN_FAZLA - ekler.length);
    setEkler([...ekler, ...yeni].slice(0, EK_EN_FAZLA));
    if (hatalar.length) setEkHatasi(hatalar.join("\n"));
  }

  async function gonder() {
    setHata("");
    setGonderiliyor(true);
    try {
      const talep = await api.post<{ id: string; reference: string }>("/support/tickets", {
        email,
        fullName: ad,
        subject: konu,
        message: metin
      });
      // Biri yüklenemezse talep yine açılmış durumda; yalnızca hangisinin eksik kaldığı söyleniyor.
      const yuklenemeyen: string[] = [];
      for (const ek of ekler) {
        try {
          await ekYukle(talep.id, ek);
        } catch (e: any) {
          yuklenemeyen.push(`${ek.ad} (${e.message})`);
        }
      }
      setGonderildi({ ...talep, ekSayisi: ekler.length - yuklenemeyen.length, yuklenemeyen });
      setKonu("");
      setMetin("");
      setEkler([]);
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  if (gonderildi) {
    return (
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}>
        <Uyari ton="iyi">
          {`Talebiniz alındı. Talep numaranız ${gonderildi.reference}.`}
          {gonderildi.ekSayisi ? ` ${gonderildi.ekSayisi} dosya eklendi.` : ""}
          {" Yanıt e-posta adresinize gönderilecek."}
        </Uyari>
        {gonderildi.yuklenemeyen.length ? (
          <Uyari ton="kotu">{`Yüklenemeyen dosyalar: ${gonderildi.yuklenemeyen.join(", ")}. Talep ayrıntısından yeniden ekleyebilirsiniz.`}</Uyari>
        ) : null}
        {kullanici ? (
          <Buton baslik="Talebi aç" onPress={() => router.replace(`/talepler/${gonderildi.id}`)} />
        ) : null}
        <Buton baslik="Yeni talep" tur="ikincil" onPress={() => setGonderildi(null)} />
      </ScrollView>
    );
  }

  const tamam = email.trim() && ad.trim() && konu.trim() && metin.trim();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }} keyboardShouldPersistTaps="handled">
        <Text style={st.alt}>Sorununuzu yazın, ekibimiz e-posta ile dönüş yapsın.</Text>
        {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
        <Alan
          etiket="E-posta *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!kullanici}
          maxLength={254}
        />
        <Alan etiket="Ad Soyad *" value={ad} onChangeText={setAd} autoComplete="name" editable={!kullanici} maxLength={150} />
        <Alan etiket="Konu *" value={konu} onChangeText={setKonu} maxLength={200} />
        <Alan etiket="Mesajınız *" value={metin} onChangeText={setMetin} multiline maxLength={5000} />

        {kullanici ? (
          <Kart style={{ gap: bosluk.s }}>
            <Text style={st.ekBaslik}>Ekler (isteğe bağlı)</Text>
            <Text style={st.kucuk}>PNG, JPEG, WebP ya da PDF · en fazla 5 MB · en fazla {EK_EN_FAZLA} dosya</Text>
            {ekler.map((ek, i) => (
              <View key={ek.uri + i} style={st.ek}>
                <Ionicons name={ek.tur === "application/pdf" ? "document-text-outline" : "image-outline"} size={18} color={renk.marka600} />
                <Text style={st.ekAd} numberOfLines={1}>
                  {ek.ad} {boyutYaz(ek.boyut) ? `· ${boyutYaz(ek.boyut)}` : ""}
                </Text>
                <Pressable onPress={() => setEkler(ekler.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel={`${ek.ad} ekini çıkar`}>
                  <Ionicons name="close" size={18} color={renk.murekkep500} />
                </Pressable>
              </View>
            ))}
            {ekHatasi ? <Text style={{ color: renk.kirmizi, fontSize: 13 }}>{ekHatasi}</Text> : null}
            {ekler.length < EK_EN_FAZLA ? <Buton baslik="Dosya ekle" tur="ikincil" ikon="attach" kucuk onPress={dosyaSec} /> : null}
          </Kart>
        ) : (
          <Text style={st.kucuk}>Dosya eklemek için giriş yapın.</Text>
        )}

        <Buton baslik="Talebi gönder" yukleniyor={gonderiliyor} disabled={!tamam} onPress={gonder} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  alt: { fontSize: 14, color: renk.murekkep600, lineHeight: 20 },
  kucuk: { fontSize: 12, color: renk.murekkep500 },
  ekBaslik: { fontSize: 14, fontWeight: "700", color: renk.murekkep900 },
  ek: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    borderRadius: kose.s,
    padding: bosluk.s
  },
  ekAd: { flex: 1, fontSize: 13, color: renk.murekkep800 }
});
