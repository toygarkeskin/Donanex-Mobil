import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { SIPARIS_DURUMU, para, tarih } from "@/lib/bicim";
import { useOturum } from "@/state/Oturum";
import { Bos, Buton, Rozet, Yukleniyor } from "@/components/Ui";
import type { Siparis } from "@/components/SiparisDetay";
import { bosluk, kose, renk } from "@/tema";

export default function Siparisler() {
  const router = useRouter();
  const { kullanici, hazir } = useOturum();
  const [liste, setListe] = useState<Siparis[] | null>(null);
  const [sayfa, setSayfa] = useState({ page: 0, pages: 1 });
  const [hata, setHata] = useState("");

  const yukle = useCallback(async (no = 1) => {
    try {
      const r = await api.get<{ items: Siparis[]; page: number; pages: number }>(`/me/orders?page=${no}&pageSize=10`);
      setListe((o) => (no === 1 || !o ? r.items : [...o, ...r.items]));
      setSayfa({ page: r.page, pages: r.pages });
    } catch (e: any) {
      setHata(e.message);
      setListe((o) => o ?? []);
    }
  }, []);

  useEffect(() => {
    if (kullanici) void yukle(1);
  }, [kullanici, yukle]);

  if (hazir && !kullanici) return <Redirect href="/giris" />;
  if (!liste) return <Yukleniyor />;

  return (
    <FlatList
      data={liste}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => yukle(1)} tintColor={renk.marka600} />}
      onEndReached={() => sayfa.page < sayfa.pages && yukle(sayfa.page + 1)}
      ListHeaderComponent={hata ? <Text style={{ color: renk.kirmizi }}>{hata}</Text> : undefined}
      ListEmptyComponent={
        <Bos ikon="receipt-outline" baslik="Henüz siparişiniz yok" aciklama="Verdiğiniz siparişler burada görünür.">
          <Buton baslik="Alışverişe başla" onPress={() => router.replace("/urunler")} />
        </Bos>
      }
      renderItem={({ item }) => {
        const d = SIPARIS_DURUMU[item.status];
        const urunSayisi = item.packages?.reduce((t, p) => t + p.items.length, 0) ?? 0;
        return (
          <Pressable style={st.kart} onPress={() => router.push(`/siparisler/${item.orderNumber}`)} accessibilityRole="link">
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={st.numara}>{item.orderNumber}</Text>
                <Rozet etiket={d?.etiket ?? item.status} ton={d?.ton ?? "bilgi"} />
              </View>
              <Text style={st.kucuk}>
                {tarih(item.placedAt)} · {urunSayisi} ürün · {item.packages?.length ?? 0} paket
              </Text>
              <Text style={st.tutar}>{para(item.total)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={renk.murekkep300} />
          </Pressable>
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  kart: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: renk.beyaz,
    borderRadius: kose.l,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.l
  },
  numara: { fontSize: 15, fontWeight: "800", color: renk.murekkep900 },
  kucuk: { fontSize: 12, color: renk.murekkep500 },
  tutar: { fontSize: 16, fontWeight: "800", color: renk.marka700 }
});
