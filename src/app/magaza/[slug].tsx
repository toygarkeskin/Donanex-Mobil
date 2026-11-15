import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { api, sorgu } from "@/lib/api";
import { resim } from "@/lib/sunucu";
import { Bos, Yukleniyor } from "@/components/Ui";
import { UrunKart, type Urun } from "@/components/UrunKart";
import { bosluk, kose, renk } from "@/tema";

interface Magaza {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  productCount: number;
}

export default function MagazaSayfasi() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [magaza, setMagaza] = useState<Magaza | null>(null);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [sayfa, setSayfa] = useState({ page: 0, pages: 1 });
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "yok">("yukleniyor");

  const urunYukle = useCallback(
    async (no: number) => {
      const r = await api.get<{ items: Urun[]; page: number; pages: number }>(`/products${sorgu({ store: slug, page: no, pageSize: 20 })}`);
      setUrunler((o) => (no === 1 ? r.items : [...o, ...r.items]));
      setSayfa({ page: r.page, pages: r.pages });
    },
    [slug]
  );

  useEffect(() => {
    api
      .get<Magaza>(`/storefront/stores/${slug}`)
      .then((m) => {
        setMagaza(m);
        setDurum("hazir");
        return urunYukle(1);
      })
      .catch(() => setDurum("yok"));
  }, [slug, urunYukle]);

  if (durum === "yukleniyor") return <Yukleniyor />;
  if (durum === "yok" || !magaza) return <Bos ikon="storefront-outline" baslik="Mağaza bulunamadı" aciklama="Mağaza kapanmış ya da adres değişmiş olabilir." />;

  return (
    <>
      <Stack.Screen options={{ title: magaza.name }} />
      <FlatList
        data={urunler}
        keyExtractor={(u) => u.id}
        numColumns={2}
        columnWrapperStyle={{ gap: bosluk.m }}
        contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}
        onEndReached={() => sayfa.page < sayfa.pages && urunYukle(sayfa.page + 1)}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={st.ust}>
            <View style={st.logo}>{magaza.logoUrl ? <Image source={resim(magaza.logoUrl)} style={{ flex: 1 }} contentFit="contain" /> : null}</View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={st.ad}>{magaza.name}</Text>
              {magaza.description ? <Text style={st.aciklama}>{magaza.description}</Text> : null}
              <Text style={st.sayi}>{magaza.productCount} ürün</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: "50%" }}>
            <UrunKart urun={item} />
          </View>
        )}
        ListEmptyComponent={<Bos baslik="Bu mağazada henüz ürün yok" />}
      />
    </>
  );
}

const st = StyleSheet.create({
  ust: {
    flexDirection: "row",
    gap: bosluk.m,
    backgroundColor: renk.beyaz,
    borderRadius: kose.l,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.l,
    marginBottom: bosluk.s
  },
  logo: { width: 64, height: 64, borderRadius: kose.m, backgroundColor: renk.murekkep50, padding: 8 },
  ad: { fontSize: 19, fontWeight: "800", color: renk.murekkep900 },
  aciklama: { fontSize: 13, color: renk.murekkep600, lineHeight: 19 },
  sayi: { fontSize: 12, color: renk.marka600, fontWeight: "700" }
});
