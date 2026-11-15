import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { para } from "@/lib/bicim";
import { siparisSakla } from "@/lib/siparis";
import { useOturum } from "@/state/Oturum";
import { useSepet } from "@/state/Sepet";
import { useMesaj } from "@/components/Mesaj";
import { Alan, Bos, Buton, Kart, Uyari } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

interface Adres {
  id: string;
  title?: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  postalCode?: string | null;
}

/** Siparişi tamamla: iletişim + teslimat adresi. Tutar sunucuda hesaplanıyor. */
export default function Odeme() {
  const router = useRouter();
  const { kullanici } = useOturum();
  const sepet = useSepet();
  const mesaj = useMesaj();
  const [form, setForm] = useState({ email: "", fullName: "", phone: "", city: "", district: "", line: "", postalCode: "", note: "" });
  const [adresler, setAdresler] = useState<Adres[]>([]);
  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const alan = (ad: keyof typeof form) => ({
    value: form[ad],
    onChangeText: (v: string) => setForm((f) => ({ ...f, [ad]: v }))
  });

  function adresKullan(a: Adres) {
    setForm((f) => ({ ...f, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, line: a.line, postalCode: a.postalCode ?? "" }));
  }

  useEffect(() => {
    if (!kullanici) return;
    setForm((f) => ({ ...f, email: kullanici.email, fullName: kullanici.fullName, phone: kullanici.phone ?? "" }));
    api
      .get<{ items: Adres[] }>("/me/addresses")
      .then((r) => {
        setAdresler(r.items ?? []);
        if (r.items?.length) adresKullan(r.items[0]);
      })
      .catch(() => {});
  }, [kullanici]);

  async function gonder() {
    setHata("");
    setGonderiliyor(true);
    try {
      const sonuc = await api.post<{ orderId: string; orderNumber: string; trackingCode?: string | null }>("/orders", {
        contact: { email: form.email.trim(), fullName: form.fullName.trim(), phone: form.phone.trim() },
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          district: form.district.trim(),
          line: form.line.trim(),
          postalCode: form.postalCode.trim() || null
        },
        note: form.note.trim() || null
      });
      siparisSakla({ orderId: sonuc.orderId, orderNumber: sonuc.orderNumber, trackingCode: sonuc.trackingCode ?? null });
      sepet.sifirla();
      router.replace(`/odeme/${sonuc.orderId}`);
    } catch (e: any) {
      setHata(e.message);
      mesaj(e.message, "hata");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (sepet.yuklendi && !sepet.items.length)
    return (
      <Bos ikon="cart-outline" baslik="Sepetiniz boş" aciklama="Sipariş verebilmek için önce sepetinize ürün ekleyin.">
        <Buton baslik="Ürünlere git" onPress={() => router.replace("/urunler")} />
      </Bos>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l, paddingBottom: bosluk.xxl }} keyboardShouldPersistTaps="handled">
        {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}

        <Kart style={{ gap: bosluk.m }}>
          <Text style={st.baslik}>İletişim</Text>
          <Alan etiket="E-posta" {...alan("email")} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!kullanici} />
          <Alan etiket="Ad soyad" {...alan("fullName")} autoComplete="name" />
          <Alan etiket="Telefon" {...alan("phone")} keyboardType="phone-pad" autoComplete="tel" placeholder="05xx xxx xx xx" />
        </Kart>

        <Kart style={{ gap: bosluk.m }}>
          <Text style={st.baslik}>Teslimat adresi</Text>
          {adresler.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {adresler.map((a) => (
                <Pressable key={a.id} style={st.adresCip} onPress={() => adresKullan(a)} accessibilityRole="button">
                  <Text style={st.adresCipYazi}>{a.title || `${a.district} / ${a.city}`}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <View style={{ flexDirection: "row", gap: bosluk.m }}>
            <View style={{ flex: 1 }}>
              <Alan etiket="İl" {...alan("city")} />
            </View>
            <View style={{ flex: 1 }}>
              <Alan etiket="İlçe" {...alan("district")} />
            </View>
          </View>
          <Alan etiket="Adres" {...alan("line")} multiline placeholder="Mahalle, sokak, bina ve daire" autoComplete="street-address" />
          <Alan etiket="Posta kodu (isteğe bağlı)" {...alan("postalCode")} keyboardType="number-pad" maxLength={5} />
          <Alan etiket="Sipariş notu (isteğe bağlı)" {...alan("note")} multiline maxLength={500} />
        </Kart>

        <Kart style={{ gap: bosluk.s }}>
          <View style={st.satir}>
            <Text style={st.etiket}>{sepet.itemCount} ürün</Text>
            <Text style={st.deger}>{para(sepet.subtotal)}</Text>
          </View>
          <View style={st.satir}>
            <Text style={st.etiket}>Kargo</Text>
            <Text style={[st.deger, { color: renk.yesil }]}>Ücretsiz</Text>
          </View>
          <View style={[st.satir, { borderTopWidth: 1, borderTopColor: renk.murekkep100, paddingTop: bosluk.s }]}>
            <Text style={[st.etiket, { fontWeight: "800", color: renk.murekkep900 }]}>Toplam</Text>
            <Text style={st.toplam}>{para(sepet.subtotal)}</Text>
          </View>
          <Buton baslik="Siparişi onayla" ikon="checkmark-circle-outline" yukleniyor={gonderiliyor} disabled={!sepet.canCheckout} onPress={gonder} />
          <Text style={st.not}>Tutar sunucuda hesaplanır; sepetteki fiyatlar güncel üründen okunur.</Text>
        </Kart>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  baslik: { fontSize: 16, fontWeight: "800", color: renk.murekkep900 },
  adresCip: { borderWidth: 1, borderColor: renk.marka200, backgroundColor: renk.marka50, borderRadius: kose.tam, paddingHorizontal: 12, paddingVertical: 7 },
  adresCipYazi: { color: renk.marka700, fontWeight: "600", fontSize: 13 },
  satir: { flexDirection: "row", justifyContent: "space-between" },
  etiket: { color: renk.murekkep600, fontSize: 14 },
  deger: { color: renk.murekkep900, fontSize: 14, fontWeight: "600" },
  toplam: { fontSize: 18, fontWeight: "800", color: renk.marka700 },
  not: { fontSize: 12, color: renk.murekkep500, textAlign: "center" }
});
