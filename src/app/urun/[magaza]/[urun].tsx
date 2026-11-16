import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { para, sayi, type Para } from "@/lib/bicim";
import { resim } from "@/lib/sunucu";
import { useSepet } from "@/state/Sepet";
import { useMesaj } from "@/components/Mesaj";
import { Bos, Buton, Kart, Yukleniyor } from "@/components/Ui";
import { YildizPuan } from "@/components/YildizPuan";
import { OneriSeridi } from "@/components/OneriSeridi";
import { Yorumlar, type YorumOzeti } from "@/components/Yorumlar";
import { Sorular } from "@/components/Sorular";
import { UrunKart, type Urun } from "@/components/UrunKart";
import { bosluk, kose, renk } from "@/tema";

interface UrunDetay extends Urun {
  description?: string | null;
  galleryUrls?: string[];
  storeDescription?: string | null;
  sku?: string | null;
  price: Para;
}

export default function UrunSayfasi() {
  const { magaza, urun: urunSlug } = useLocalSearchParams<{ magaza: string; urun: string }>();
  const router = useRouter();
  const sepet = useSepet();
  const mesaj = useMesaj();
  const alt = useSafeAreaInsets().bottom;
  const { width } = useWindowDimensions();
  const [urun, setUrun] = useState<UrunDetay | null>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "yok">("yukleniyor");
  const [sira, setSira] = useState(0);
  const [adet, setAdet] = useState(1);
  const [ekleniyor, setEkleniyor] = useState(false);
  const [ozet, setOzet] = useState<YorumOzeti | null>(null);
  const [benzerler, setBenzerler] = useState<Urun[]>([]);

  useEffect(() => {
    setDurum("yukleniyor");
    setSira(0);
    setAdet(1);
    api
      .get<UrunDetay>(`/products/${magaza}/${urunSlug}`)
      .then((u) => {
        setUrun(u);
        setDurum("hazir");
        return api.get<{ items: Urun[] }>(`/products?category=${encodeURIComponent(u.categorySlug ?? "")}&pageSize=8`);
      })
      .then((r) => r && setBenzerler((r.items ?? []).filter((b) => b.slug !== urunSlug)))
      .catch(() => setDurum((d) => (d === "hazir" ? d : "yok")));
  }, [magaza, urunSlug]);

  const ozetGeldi = useCallback((o: YorumOzeti | null) => setOzet(o), []);

  if (durum === "yukleniyor") return <Yukleniyor />;
  if (durum === "yok" || !urun)
    return (
      <Bos ikon="help-circle-outline" baslik="Ürün bulunamadı" aciklama="Ürün kaldırılmış ya da satıcı mağazasını kapatmış olabilir.">
        <Buton baslik="Ürünlere dön" onPress={() => router.replace("/urunler")} />
      </Bos>
    );

  const gorseller = [urun.imageUrl, ...(urun.galleryUrls ?? [])].filter(Boolean) as string[];
  const tukendi = urun.stock <= 0;

  async function ekle() {
    if (!urun) return;
    setEkleniyor(true);
    try {
      await sepet.ekle(urun.id, adet);
      mesaj(`${adet} adet sepete eklendi.`, "basari");
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setEkleniyor(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: urun.brandName ?? urun.categoryName ?? "Ürün" }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + alt }}>
        <View style={{ backgroundColor: renk.beyaz }}>
          <FlatList
            horizontal
            pagingEnabled
            data={gorseller}
            keyExtractor={(g, i) => `${g}-${i}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setSira(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={{ width, height: Math.min(width, 420), padding: bosluk.xl }}>
                <Image source={resim(item)} style={{ flex: 1 }} contentFit="contain" accessibilityLabel={urun.name} />
              </View>
            )}
          />
          {gorseller.length > 1 ? (
            <View style={st.noktalar}>
              {gorseller.map((_, i) => (
                <View key={i} style={[st.nokta, i === sira && st.noktaAktif]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ padding: bosluk.l, gap: bosluk.s }}>
          {urun.brandName ? <Text style={st.marka}>{urun.brandName}</Text> : null}
          <Text style={st.ad} accessibilityRole="header">
            {urun.name}
          </Text>
          {ozet?.count ? (
            <View style={st.puan}>
              <YildizPuan puan={ozet.average} />
              <Text style={st.puanYazi}>
                {sayi(ozet.average)} · {ozet.count} değerlendirme
              </Text>
            </View>
          ) : null}
          <Text style={st.fiyat}>{para(urun.price)}</Text>
          <Text style={[st.stok, tukendi && { color: renk.kirmizi }]}>
            {tukendi ? "Stokta yok" : urun.stock <= 5 ? `Son ${urun.stock} ürün` : "Stokta"} · Ücretsiz kargo
          </Text>

          <Pressable style={st.magaza} onPress={() => router.push(`/magaza/${urun.storeSlug}`)} accessibilityRole="link">
            <Ionicons name="storefront-outline" size={20} color={renk.marka600} />
            <View style={{ flex: 1 }}>
              <Text style={st.magazaAd}>{urun.storeName}</Text>
              {urun.storeDescription ? (
                <Text style={st.magazaAciklama} numberOfLines={2}>
                  {urun.storeDescription}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={renk.murekkep300} />
          </Pressable>

          {urun.description ? (
            <Kart style={{ marginTop: bosluk.s, gap: 6 }}>
              <Text style={st.bolum}>Ürün açıklaması</Text>
              <Text style={st.aciklama}>{urun.description}</Text>
            </Kart>
          ) : null}
        </View>

        <OneriSeridi baslik="Bunları da sepete ekleyebilirsiniz" urunIdleri={[urun.id]} />

        <View style={{ padding: bosluk.l, gap: bosluk.xl, marginTop: bosluk.s }}>
          <Yorumlar urunId={urun.id} ozetGeldi={ozetGeldi} />
          <Sorular urunId={urun.id} />
        </View>

        {benzerler.length ? (
          <View>
            <Text style={[st.bolum, { paddingHorizontal: bosluk.l, marginBottom: bosluk.m, fontSize: 18 }]}>Benzer ürünler</Text>
            <FlatList
              horizontal
              data={benzerler}
              keyExtractor={(b) => b.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: bosluk.l, gap: bosluk.m }}
              renderItem={({ item }) => <UrunKart urun={item} genislik={156} />}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={[st.altBar, { paddingBottom: alt + bosluk.s }]}>
        {!tukendi ? (
          <View style={st.adet}>
            <Pressable
              onPress={() => setAdet(Math.max(1, adet - 1))}
              style={st.adetDugme}
              accessibilityRole="button"
              accessibilityLabel="Adedi azalt"
              disabled={adet <= 1}
            >
              <Ionicons name="remove" size={18} color={adet <= 1 ? renk.murekkep300 : renk.murekkep800} />
            </Pressable>
            <Text style={st.adetYazi}>{adet}</Text>
            <Pressable
              onPress={() => setAdet(Math.min(urun.stock, adet + 1))}
              style={st.adetDugme}
              accessibilityRole="button"
              accessibilityLabel="Adedi artır"
              disabled={adet >= urun.stock}
            >
              <Ionicons name="add" size={18} color={adet >= urun.stock ? renk.murekkep300 : renk.murekkep800} />
            </Pressable>
          </View>
        ) : null}
        <Buton
          baslik={tukendi ? "Stokta yok" : "Sepete ekle"}
          ikon="cart-outline"
          disabled={tukendi}
          yukleniyor={ekleniyor}
          onPress={ekle}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  noktalar: { flexDirection: "row", justifyContent: "center", gap: 6, paddingBottom: bosluk.m },
  nokta: { width: 6, height: 6, borderRadius: 3, backgroundColor: renk.murekkep200 },
  noktaAktif: { width: 18, backgroundColor: renk.marka600 },
  marka: { fontSize: 12, fontWeight: "700", color: renk.marka600, letterSpacing: 0.5 },
  ad: { fontSize: 21, fontWeight: "800", color: renk.murekkep900, lineHeight: 27 },
  puan: { flexDirection: "row", alignItems: "center", gap: 6 },
  puanYazi: { fontSize: 13, color: renk.murekkep500 },
  fiyat: { fontSize: 26, fontWeight: "900", color: renk.marka700, marginTop: 4 },
  stok: { fontSize: 13, color: renk.yesil, fontWeight: "600" },
  magaza: {
    flexDirection: "row",
    alignItems: "center",
    gap: bosluk.m,
    backgroundColor: renk.beyaz,
    borderRadius: kose.m,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.m,
    marginTop: bosluk.s
  },
  magazaAd: { fontSize: 14, fontWeight: "700", color: renk.murekkep900 },
  magazaAciklama: { fontSize: 12, color: renk.murekkep500 },
  bolum: { fontSize: 15, fontWeight: "800", color: renk.murekkep900 },
  aciklama: { fontSize: 14, color: renk.murekkep700, lineHeight: 21 },
  altBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: bosluk.m,
    alignItems: "center",
    backgroundColor: renk.beyaz,
    borderTopWidth: 1,
    borderTopColor: renk.murekkep100,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.s
  },
  adet: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: renk.murekkep200, borderRadius: kose.m, height: 48 },
  adetDugme: { width: 40, height: 46, alignItems: "center", justifyContent: "center" },
  adetYazi: { minWidth: 24, textAlign: "center", fontWeight: "800", fontSize: 16, color: renk.murekkep900 }
});
