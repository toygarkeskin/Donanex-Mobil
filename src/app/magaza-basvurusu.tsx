import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { Redirect } from "expo-router";
import { api } from "@/lib/api";
import { sunucu } from "@/lib/sunucu";
import { useOturum } from "@/state/Oturum";
import { Alan, Buton, Kart, Uyari } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

/**
 * Mağaza başvurusu (web'deki Hesabım > Mağaza aç). Başvuru yönetici
 * onayından sonra açılır; mağaza paneli web sitesinde kalır — uzun ürün
 * formları ve tablolar telefon ekranına göre değil.
 */
export default function MagazaBasvurusu() {
  const { kullanici, hazir, yenile } = useOturum();
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [eposta, setEposta] = useState("");
  const [telefon, setTelefon] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [hata, setHata] = useState("");
  const [sonuc, setSonuc] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  if (hazir && !kullanici) return <Redirect href="/giris" />;

  const magazalar = kullanici?.stores ?? [];
  const paneliAc = (slug?: string) => void Linking.openURL(`${sunucu()}/magaza${slug ? `/${slug}` : ""}`);

  async function gonder() {
    setHata("");
    setGonderiliyor(true);
    try {
      const r = await api.post<{ message: string }>("/me/store-application", {
        name: ad,
        description: aciklama,
        contactEmail: eposta,
        phone: telefon,
        taxNumber: vergiNo
      });
      setSonuc(r.message);
      await yenile();
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  if (magazalar.length) {
    return (
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}>
        <Uyari ton="iyi">Mağazanız var. Mağaza paneli (ürünler, siparişler, ekip) web sitesinde.</Uyari>
        {magazalar.map((m) => (
          <Buton key={m.id} baslik={`${m.name} paneli`} ikon="open-outline" tur="ikincil" onPress={() => paneliAc(m.slug)} />
        ))}
      </ScrollView>
    );
  }

  const tamam = ad.trim() && aciklama.trim() && eposta.trim() && telefon.trim();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }} keyboardShouldPersistTaps="handled">
        <Text style={st.alt}>{"Donanex’te satış yapmak için başvurun. Yönetici onayından sonra web sitesindeki mağaza panelinden ürün ekleyebilirsiniz."}</Text>
        {sonuc ? (
          <Uyari ton="iyi">{sonuc}</Uyari>
        ) : (
          <Kart style={{ gap: bosluk.m }}>
            {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
            <Alan etiket="Mağaza adı *" ipucu="Müşterilerin göreceği ad." value={ad} onChangeText={setAd} maxLength={120} />
            <Alan etiket="Mağaza açıklaması *" ipucu="Ne sattığınızı kısaca anlatın." value={aciklama} onChangeText={setAciklama} multiline maxLength={2000} />
            <Alan
              etiket="İletişim e-postası *"
              value={eposta}
              onChangeText={setEposta}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              maxLength={254}
            />
            <Alan etiket="Telefon *" value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" autoComplete="tel" maxLength={30} />
            <Alan etiket="Vergi numarası" value={vergiNo} onChangeText={setVergiNo} keyboardType="number-pad" maxLength={30} />
            <Buton baslik="Başvuruyu gönder" yukleniyor={gonderiliyor} disabled={!tamam} onPress={gonder} />
          </Kart>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  alt: { fontSize: 14, color: renk.murekkep600, lineHeight: 20 }
});
