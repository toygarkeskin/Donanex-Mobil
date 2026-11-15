import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { PAKET_DURUMU, SIPARIS_DURUMU, para, tarih, type Para } from "@/lib/bicim";
import { resim } from "@/lib/sunucu";
import { Kart, Rozet } from "./Ui";
import { bosluk, kose, renk } from "@/tema";

export interface Siparis {
  id: string;
  orderNumber: string;
  status: string;
  placedAt: string;
  total: Para;
  note?: string | null;
  shippingAddress?: { fullName: string; phone: string; city: string; district: string; line: string; postalCode?: string | null };
  packages: {
    id: string;
    storeName: string;
    status: string;
    subtotal: Para;
    carrier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    items: { productId: string; name: string; imageUrl?: string | null; quantity: number; unitPrice: Para; lineTotal: Para }[];
  }[];
}

/** Yalnızca http/https bağlantı açılır (kargo takip adresi satıcıdan geliyor). */
const guvenliAdres = (a?: string | null) => (a && /^https?:\/\//i.test(a) ? a : null);

/** Sipariş detayı: hesaptaki siparişlerde ve misafir takibinde aynı görünüm. */
export function SiparisDetay({ siparis }: { siparis: Siparis }) {
  const durum = SIPARIS_DURUMU[siparis.status];
  return (
    <View style={{ gap: bosluk.m }}>
      <Kart style={{ gap: 6 }}>
        <View style={st.ust}>
          <Text style={st.numara}>{siparis.orderNumber}</Text>
          <Rozet etiket={durum?.etiket ?? siparis.status} ton={durum?.ton ?? "bilgi"} />
        </View>
        <Text style={st.kucuk}>{tarih(siparis.placedAt)}</Text>
        <Text style={st.toplam}>{para(siparis.total)}</Text>
      </Kart>

      {siparis.packages.map((paket) => {
        const pd = PAKET_DURUMU[paket.status];
        const takip = guvenliAdres(paket.trackingUrl);
        return (
          <Kart key={paket.id} style={{ gap: bosluk.s }}>
            <View style={st.ust}>
              <Text style={st.magaza}>{paket.storeName}</Text>
              <Rozet etiket={pd?.etiket ?? paket.status} ton={pd?.ton ?? "bilgi"} />
            </View>
            {paket.items.map((k) => (
              <View key={k.productId} style={st.kalem}>
                <View style={st.gorsel}>{k.imageUrl ? <Image source={resim(k.imageUrl)} style={{ flex: 1 }} contentFit="contain" /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text style={st.ad} numberOfLines={2}>
                    {k.name}
                  </Text>
                  <Text style={st.kucuk}>
                    {k.quantity} × {para(k.unitPrice)}
                  </Text>
                </View>
                <Text style={st.tutar}>{para(k.lineTotal)}</Text>
              </View>
            ))}
            {paket.carrier || paket.trackingNumber ? (
              <Pressable
                disabled={!takip}
                onPress={() => takip && Linking.openURL(takip)}
                style={st.kargo}
                accessibilityRole={takip ? "link" : undefined}
              >
                <Text style={st.kargoYazi}>
                  {paket.carrier ?? "Kargo"} · {paket.trackingNumber ?? "takip no yok"}
                  {takip ? "  Takip et →" : ""}
                </Text>
              </Pressable>
            ) : null}
          </Kart>
        );
      })}

      {siparis.shippingAddress ? (
        <Kart style={{ gap: 4 }}>
          <Text style={st.magaza}>Teslimat adresi</Text>
          <Text style={st.adres}>{siparis.shippingAddress.fullName}</Text>
          <Text style={st.adres}>{siparis.shippingAddress.line}</Text>
          <Text style={st.adres}>
            {siparis.shippingAddress.district} / {siparis.shippingAddress.city} {siparis.shippingAddress.postalCode ?? ""}
          </Text>
          <Text style={st.kucuk}>{siparis.shippingAddress.phone}</Text>
        </Kart>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  ust: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  numara: { fontSize: 17, fontWeight: "800", color: renk.murekkep900 },
  toplam: { fontSize: 20, fontWeight: "800", color: renk.marka700, marginTop: 4 },
  magaza: { fontSize: 15, fontWeight: "700", color: renk.murekkep900, flexShrink: 1 },
  kalem: { flexDirection: "row", alignItems: "center", gap: bosluk.m },
  gorsel: { width: 52, height: 52, borderRadius: kose.s, backgroundColor: renk.beyaz, borderWidth: 1, borderColor: renk.murekkep100, padding: 3 },
  ad: { fontSize: 13, fontWeight: "600", color: renk.murekkep800 },
  tutar: { fontSize: 14, fontWeight: "700", color: renk.murekkep900 },
  kucuk: { fontSize: 12, color: renk.murekkep500 },
  kargo: { backgroundColor: renk.marka50, borderRadius: kose.s, padding: bosluk.s },
  kargoYazi: { color: renk.marka700, fontSize: 13, fontWeight: "600" },
  adres: { fontSize: 14, color: renk.murekkep700 }
});
