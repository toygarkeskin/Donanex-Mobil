import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { siparisGetir } from "@/lib/siparis";
import { useOturum } from "@/state/Oturum";
import { useSepet } from "@/state/Sepet";
import { useMesaj } from "@/components/Mesaj";
import { Buton, Kart, Uyari } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

/**
 * Ödeme benzetimi — web'deki ödeme ekranının aynısı. Gerçek bir ödeme
 * sağlayıcısı yok, para hareketi olmuyor; kart bilgisi İSTENMİYOR.
 */
export default function OdemeEkrani() {
  const { siparis } = useLocalSearchParams<{ siparis: string }>();
  const router = useRouter();
  const { kullanici } = useOturum();
  const sepet = useSepet();
  const mesaj = useMesaj();
  const kayit = siparisGetir(siparis);
  const [sonuc, setSonuc] = useState<{ status: string } | null>(null);
  const [isleniyor, setIsleniyor] = useState(false);

  async function ode(outcome: "success" | "failure") {
    setIsleniyor(true);
    try {
      const r = await api.post<{ status: string }>(`/orders/${siparis}/payment`, { outcome, trackingCode: kayit?.trackingCode ?? null });
      setSonuc(r);
      await sepet.yukle();
      mesaj(outcome === "success" ? "Ödeme alındı." : "Ödeme başarısız sayıldı, stok iade edildi.", outcome === "success" ? "basari" : "bilgi");
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setIsleniyor(false);
    }
  }

  const basarili = sonuc?.status === "paid" || sonuc?.status === "completed";

  return (
    <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }}>
      <Stack.Screen options={{ title: kayit ? `Sipariş ${kayit.orderNumber}` : "Ödeme" }} />

      {sonuc ? (
        <Kart style={{ alignItems: "center", gap: bosluk.s, paddingVertical: bosluk.xl }}>
          <Ionicons name={basarili ? "checkmark-circle" : "close-circle"} size={56} color={basarili ? renk.yesil : renk.kirmizi} />
          <Text style={st.sonuc}>{basarili ? "Siparişiniz alındı" : "Ödeme başarısız"}</Text>
          <Text style={st.aciklama}>
            {basarili ? "Satıcılar siparişinizi hazırlamaya başlayacak. Kargo bilgisi bildirim olarak gelecek." : "Stok iade edildi. Sepetinize dönüp yeniden deneyebilirsiniz."}
          </Text>
          <View style={{ alignSelf: "stretch", gap: 8, marginTop: bosluk.s }}>
            {kullanici ? <Buton baslik="Siparişlerim" onPress={() => router.replace("/siparisler")} /> : null}
            <Buton baslik="Alışverişe devam" tur="ikincil" onPress={() => router.replace("/")} />
          </View>
        </Kart>
      ) : (
        <>
          <Uyari>Bu bir ödeme benzetimidir. Gerçek bir ödeme sağlayıcısı bağlı değil ve para hareketi olmaz. Kart bilgisi girmeyin; sonucu aşağıdan siz seçersiniz.</Uyari>

          {kayit?.trackingCode ? (
            <Kart style={{ gap: bosluk.s }}>
              <Text style={st.baslik}>Sipariş takip kodunuz</Text>
              <Text selectable style={st.kod}>
                {kayit.trackingCode}
              </Text>
              <Text style={st.aciklamaSol}>
                Bu kodu saklayın (basılı tutup kopyalayabilirsiniz). Üye değilseniz siparişinizi görmek için sipariş numarasıyla birlikte gerekir.
              </Text>
            </Kart>
          ) : null}

          {!kayit && !kullanici ? (
            <Uyari ton="kotu">Bu siparişin takip kodu bu cihazda bulunamadı. Ödeme yapmak için giriş yapın.</Uyari>
          ) : null}

          <Buton baslik="Ödemeyi onayla (benzetim)" ikon="card-outline" yukleniyor={isleniyor} onPress={() => ode("success")} />
          <Buton baslik="Başarısız ödeme dene" tur="ikincil" disabled={isleniyor} onPress={() => ode("failure")} />
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  baslik: { fontSize: 13, fontWeight: "700", color: renk.murekkep500, letterSpacing: 0.5 },
  kod: { fontFamily: "monospace", fontSize: 13, backgroundColor: renk.murekkep100, borderRadius: kose.s, padding: bosluk.m, color: renk.murekkep900 },
  sonuc: { fontSize: 20, fontWeight: "800", color: renk.murekkep900 },
  aciklama: { fontSize: 14, color: renk.murekkep500, textAlign: "center", lineHeight: 20 },
  aciklamaSol: { fontSize: 12, color: renk.murekkep500, lineHeight: 18 }
});
