import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { gecenSure, para, type Para } from "@/lib/bicim";
import { resim } from "@/lib/sunucu";
import { useSepet } from "@/state/Sepet";
import { useMesaj } from "./Mesaj";
import { kose, renk } from "@/tema";

export interface Urun {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  previewUrls?: string[];
  stock: number;
  price: Para;
  storeSlug: string;
  storeName: string;
  categoryName?: string;
  categorySlug?: string;
  brandName?: string | null;
  publishedAt?: string | null;
}

/**
 * Izgara kartı. Web'de fare kartın üstünde gezince fotoğraf değişiyordu;
 * dokunmatik ekranda "üstünde gezinme" yok, bu yüzden kartın sol/sağ
 * yarısına kısa dokunuş değil — uzun basış fotoğrafı değiştiriyor, kısa
 * dokunuş ürünü açıyor (kaydırmayla karışmasın diye).
 */
export function UrunKart({ urun, zamanGoster, genislik }: { urun: Urun; zamanGoster?: boolean; genislik?: number }) {
  const router = useRouter();
  const sepet = useSepet();
  const mesaj = useMesaj();
  const [ekleniyor, setEkleniyor] = useState(false);
  const [sira, setSira] = useState(0);

  const gorseller = urun.previewUrls?.length ? urun.previewUrls : urun.imageUrl ? [urun.imageUrl] : [];
  const tukendi = urun.stock <= 0;

  async function ekle() {
    setEkleniyor(true);
    try {
      await sepet.ekle(urun.id);
      mesaj(`${urun.name} sepete eklendi.`, "basari");
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setEkleniyor(false);
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [st.kart, genislik ? { width: genislik } : { flex: 1 }, pressed && { opacity: 0.92 }]}
      onPress={() => router.push(`/urun/${urun.storeSlug}/${urun.slug}`)}
      onLongPress={() => gorseller.length > 1 && setSira((sira + 1) % gorseller.length)}
      accessibilityRole="link"
      accessibilityLabel={`${urun.name}, ${para(urun.price)}`}
      accessibilityHint={gorseller.length > 1 ? "Basılı tutarak diğer fotoğrafı görebilirsiniz" : undefined}
    >
      <View style={st.gorselKap}>
        <Image source={resim(gorseller[sira])} style={st.gorsel} contentFit="contain" />
        {gorseller.length > 1 ? (
          <View style={st.cizgiler}>
            {gorseller.map((_, i) => (
              <View key={i} style={[st.cizgi, { backgroundColor: i === sira ? renk.marka600 : renk.murekkep200 }]} />
            ))}
          </View>
        ) : null}
        {tukendi ? (
          <View style={st.tukendi}>
            <Text style={st.tukendiYazi}>Tükendi</Text>
          </View>
        ) : null}
      </View>
      <View style={st.govde}>
        <Text style={st.magaza} numberOfLines={1}>
          {zamanGoster && urun.publishedAt ? gecenSure(urun.publishedAt) : urun.storeName}
        </Text>
        <Text style={st.ad} numberOfLines={2}>
          {urun.name}
        </Text>
        <View style={st.alt}>
          <Text style={st.fiyat}>{para(urun.price)}</Text>
          {!tukendi ? (
            <Pressable
              onPress={ekle}
              disabled={ekleniyor}
              style={({ pressed }) => [st.ekle, (pressed || ekleniyor) && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={`${urun.name} sepete ekle`}
              hitSlop={8}
            >
              <Ionicons name={ekleniyor ? "hourglass-outline" : "add"} size={20} color={renk.beyaz} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  kart: {
    backgroundColor: renk.beyaz,
    borderRadius: kose.l,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    overflow: "hidden"
  },
  gorselKap: { aspectRatio: 1, backgroundColor: renk.beyaz, padding: 10 },
  gorsel: { flex: 1 },
  cizgiler: { position: "absolute", bottom: 6, left: 12, right: 12, flexDirection: "row", gap: 3 },
  cizgi: { flex: 1, height: 3, borderRadius: 2 },
  tukendi: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: renk.murekkep800,
    borderRadius: kose.tam,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  tukendiYazi: { color: renk.beyaz, fontSize: 11, fontWeight: "700" },
  govde: { padding: 10, gap: 3, flex: 1 },
  magaza: { fontSize: 11, color: renk.murekkep500 },
  ad: { fontSize: 14, fontWeight: "600", color: renk.murekkep900, minHeight: 36, lineHeight: 18 },
  alt: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  fiyat: { fontSize: 15, fontWeight: "800", color: renk.marka700 },
  ekle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: renk.marka600,
    alignItems: "center",
    justifyContent: "center"
  }
});
