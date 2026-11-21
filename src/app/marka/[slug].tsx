import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, sorgu } from "@/lib/api";
import { Bos, Rozet, Yukleniyor } from "@/components/Ui";
import { UrunKart, type Urun } from "@/components/UrunKart";
import { bosluk, kose, renk } from "@/tema";

interface Marka {
  id: string;
  slug: string;
  name: string;
  description?: string;
  verified?: boolean;
  productCount: number;
  stores: { id: string; slug: string; name: string; approved: boolean; productCount: number }[];
}

/** Marka sayfası: markayı satan mağazalar ve markanın ürünleri (web'deki /markalar/:slug). */
export default function MarkaSayfasi() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [marka, setMarka] = useState<Marka | null>(null);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [sayfa, setSayfa] = useState({ page: 0, pages: 1 });
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "yok">("yukleniyor");

  const urunYukle = useCallback(
    async (no: number) => {
      const r = await api.get<{ items: Urun[]; page: number; pages: number }>(`/products${sorgu({ brand: slug, page: no, pageSize: 20 })}`);
      setUrunler((o) => (no === 1 ? r.items : [...o, ...r.items]));
      setSayfa({ page: r.page, pages: r.pages });
    },
    [slug]
  );

  useEffect(() => {
    api
      .get<Marka>(`/brands/${slug}`)
      .then((m) => {
        setMarka(m);
        setDurum("hazir");
        return urunYukle(1);
      })
      .catch(() => setDurum("yok"));
  }, [slug, urunYukle]);

  if (durum === "yukleniyor") return <Yukleniyor />;
  if (durum === "yok" || !marka) return <Bos ikon="pricetag-outline" baslik="Marka bulunamadı" aciklama="Aradığınız marka kaldırılmış olabilir." />;

  return (
    <>
      <Stack.Screen options={{ title: marka.name }} />
      <FlatList
        data={urunler}
        keyExtractor={(u) => u.id}
        numColumns={2}
        columnWrapperStyle={{ gap: bosluk.m }}
        contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}
        onEndReached={() => sayfa.page < sayfa.pages && urunYukle(sayfa.page + 1)}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={{ gap: bosluk.m, marginBottom: bosluk.s }}>
            <View style={st.ust}>
              <View style={st.rozet}>
                <Text style={st.rozetYazi}>{/* Yabancı marka adı: Türkçe büyük harf ("Kİ") değil, düz büyük harf — web ile aynı. */}
                  {marka.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={st.ad} accessibilityRole="header">
                  {marka.name}
                </Text>
                <Text style={st.sayi}>Vitrinde {marka.productCount} ürün</Text>
                {marka.description ? <Text style={st.aciklama}>{marka.description}</Text> : null}
              </View>
            </View>

            {marka.stores.length ? (
              <View style={{ gap: bosluk.s }}>
                <Text style={st.bolum}>Bu markayı satan mağazalar</Text>
                {marka.stores.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => router.push(`/magaza/${m.slug}`)}
                    style={({ pressed }) => [st.magaza, pressed && { opacity: 0.85 }]}
                    accessibilityRole="link"
                  >
                    <Ionicons name="storefront-outline" size={18} color={renk.marka600} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={st.magazaAd}>{m.name}</Text>
                      <Text style={st.kucuk}>
                        {m.productCount} {marka.name} ürünü
                      </Text>
                    </View>
                    {m.approved ? <Rozet etiket="Onaylı satıcı" ton="iyi" /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={st.bolum}>{marka.name} ürünleri</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: "50%" }}>
            <UrunKart urun={item} />
          </View>
        )}
        ListEmptyComponent={<Bos baslik="Bu markanın satışta ürünü yok" />}
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
    padding: bosluk.l
  },
  rozet: { width: 56, height: 56, borderRadius: kose.m, backgroundColor: renk.marka50, alignItems: "center", justifyContent: "center" },
  rozetYazi: { fontSize: 18, fontWeight: "800", color: renk.marka700 },
  ad: { fontSize: 20, fontWeight: "800", color: renk.murekkep900 },
  sayi: { fontSize: 12, color: renk.marka600, fontWeight: "700" },
  aciklama: { fontSize: 13, color: renk.murekkep600, lineHeight: 19 },
  bolum: { fontSize: 16, fontWeight: "800", color: renk.murekkep900 },
  magaza: {
    flexDirection: "row",
    alignItems: "center",
    gap: bosluk.m,
    backgroundColor: renk.beyaz,
    borderRadius: kose.m,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.m
  },
  magazaAd: { fontSize: 15, fontWeight: "700", color: renk.murekkep900 },
  kucuk: { fontSize: 12, color: renk.murekkep500 }
});
