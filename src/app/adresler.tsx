import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { api } from "@/lib/api";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Alan, Bos, Buton, Kart, Yukleniyor } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

interface Adres {
  id: string;
  title?: string | null;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  postalCode?: string | null;
}

type Form = Omit<Adres, "id">;
const BOS: Form = { title: "", fullName: "", phone: "", city: "", district: "", line: "", postalCode: "" };

/** Kayıtlı adresler: ekle, düzenle, sil (web'deki Hesabım > Adreslerim). Ödemede hazır gelir. */
export default function Adresler() {
  const { kullanici, hazir } = useOturum();
  const mesaj = useMesaj();
  const [liste, setListe] = useState<Adres[] | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<string | "yeni" | null>(null);
  const [form, setForm] = useState<Form>(BOS);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      setListe((await api.get<{ items: Adres[] }>("/me/addresses")).items);
    } catch (e: any) {
      mesaj(e.message, "hata");
      setListe((o) => o ?? []);
    }
  }, [mesaj]);

  useEffect(() => {
    if (kullanici) void yukle();
  }, [kullanici, yukle]);

  if (hazir && !kullanici) return <Redirect href="/giris" />;
  if (!liste) return <Yukleniyor />;

  const alan = (ad: keyof Form) => (deger: string) => setForm((f) => ({ ...f, [ad]: deger }));

  function ac(adres?: Adres) {
    setForm(adres ? { ...adres, title: adres.title ?? "", postalCode: adres.postalCode ?? "" } : BOS);
    setDuzenlenen(adres ? adres.id : "yeni");
  }

  async function kaydet() {
    setKaydediliyor(true);
    try {
      const govde = { ...form, postalCode: form.postalCode || null };
      if (duzenlenen === "yeni") await api.post("/me/addresses", govde);
      else await api.put(`/me/addresses/${duzenlenen}`, govde);
      mesaj("Adresiniz kaydedildi.", "basari");
      setDuzenlenen(null);
      await yukle();
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setKaydediliyor(false);
    }
  }

  function sil(adres: Adres) {
    const yap = async () => {
      try {
        await api.delete(`/me/addresses/${adres.id}`);
        mesaj("Adres silindi.", "bilgi");
        await yukle();
      } catch (e: any) {
        mesaj(e.message, "hata");
      }
    };
    // Web önizlemesinde Alert düğmeleri yok; tarayıcının onayı kullanılıyor.
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(`"${adres.title || adres.line}" adresi silinsin mi?`)) void yap();
      return;
    }
    Alert.alert("Adres silinsin mi?", adres.title || adres.line, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => void yap() }
    ]);
  }

  if (duzenlenen) {
    const tamam = form.fullName.trim() && form.phone.trim() && form.city.trim() && form.district.trim() && form.line.trim();
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }} keyboardShouldPersistTaps="handled">
          <Text style={st.baslik}>{duzenlenen === "yeni" ? "Yeni adres" : "Adresi düzenle"}</Text>
          <Alan etiket="Adres başlığı" ipucu="Örn. Ev, İş" value={form.title ?? ""} onChangeText={alan("title")} maxLength={60} />
          <Alan etiket="Ad Soyad *" value={form.fullName} onChangeText={alan("fullName")} autoComplete="name" maxLength={150} />
          <Alan etiket="Telefon *" value={form.phone} onChangeText={alan("phone")} keyboardType="phone-pad" autoComplete="tel" maxLength={30} />
          <View style={{ flexDirection: "row", gap: bosluk.m }}>
            <View style={{ flex: 1 }}>
              <Alan etiket="İl *" value={form.city} onChangeText={alan("city")} maxLength={80} />
            </View>
            <View style={{ flex: 1 }}>
              <Alan etiket="İlçe *" value={form.district} onChangeText={alan("district")} maxLength={80} />
            </View>
          </View>
          <Alan etiket="Posta kodu" value={form.postalCode ?? ""} onChangeText={alan("postalCode")} keyboardType="number-pad" maxLength={10} />
          <Alan etiket="Açık adres *" value={form.line} onChangeText={alan("line")} multiline maxLength={500} />
          <Buton baslik="Kaydet" yukleniyor={kaydediliyor} disabled={!tamam} onPress={kaydet} />
          <Buton baslik="Vazgeç" tur="ikincil" onPress={() => setDuzenlenen(null)} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}>
      <Buton baslik="Yeni adres" ikon="add" onPress={() => ac()} />
      {liste.length === 0 ? (
        <Bos ikon="location-outline" baslik="Kayıtlı adresiniz yok" aciklama="Eklediğiniz adresler ödeme adımında hazır gelir." />
      ) : (
        liste.map((a) => (
          <Kart key={a.id} style={{ gap: 4 }}>
            {a.title ? <Text style={st.adresBaslik}>{a.title}</Text> : null}
            <Text style={st.satir}>
              {a.fullName} · {a.phone}
            </Text>
            <Text style={st.satir}>{a.line}</Text>
            <Text style={st.satir}>
              {a.district} / {a.city}
              {a.postalCode ? ` · ${a.postalCode}` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: bosluk.s, marginTop: bosluk.s }}>
              <Buton baslik="Düzenle" tur="ikincil" kucuk onPress={() => ac(a)} style={{ flex: 1 }} />
              <Buton baslik="Sil" tur="hayalet" kucuk onPress={() => sil(a)} style={{ flex: 1 }} />
            </View>
          </Kart>
        ))
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  baslik: { fontSize: 20, fontWeight: "800", color: renk.murekkep900 },
  adresBaslik: { fontSize: 15, fontWeight: "800", color: renk.murekkep900 },
  satir: { fontSize: 14, color: renk.murekkep700, lineHeight: 20 }
});
