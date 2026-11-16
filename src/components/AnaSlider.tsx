import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { resim } from "@/lib/sunucu";
import { buyukHarf } from "@/lib/bicim";
import { bosluk, kose, renk } from "@/tema";

export interface Kategori {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  imageUrl?: string | null;
}

/* Web'deki AnaSlider ile aynı metinler: iki tarafta aynı vitrin. */
const METINLER: Record<string, { baslik: string; alt: string }> = {
  "ekran-karti": { baslik: "Ekran kartlarında yeni sezon", alt: "Oyunda ve tasarımda performansı ikiye katlayın." },
  laptop: { baslik: "Her işe bir dizüstü", alt: "Oyuncudan iş bilgisayarına, tek yerde." },
  klavye: { baslik: "Yazdıkça hissedin", alt: "Mekanik ve oyuncu klavyeleri bir arada." },
  mouse: { baslik: "İsabetli her tık", alt: "Kablosuz, hafif, oyuncu mouse'ları." },
  monitor: { baslik: "Daha geniş, daha akıcı", alt: "Yüksek yenileme hızlı oyuncu monitörleri." },
  kulaklik: { baslik: "Sesin tamamı", alt: "Oyun ve müzik için kulaklıklar." },
  depolama: { baslik: "Hızlı ve geniş depolama", alt: "NVMe SSD'lerle saniyeler içinde açılış." },
  islemci: { baslik: "Sistemin beyni", alt: "Yeni nesil işlemciler." }
};

interface Slayt {
  anahtar: string;
  ust: string;
  baslik: string;
  alt: string;
  gorsel?: string | null;
  kategori?: string;
  dugme: string;
}

/**
 * Ana sayfa vitrini: canlı kategorilerden slaytlar, 6 sn'de bir kendiliğinden
 * ilerliyor. Kullanıcı kaydırınca ya da "hareketi azalt" açıksa otomatik
 * ilerleme duruyor.
 */
export function AnaSlider({ kategoriler, urunSayisi, magazaSayisi }: { kategoriler: Kategori[]; urunSayisi?: number; magazaSayisi?: number }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const genislik = Math.min(width, 720) - bosluk.l * 2;
  const liste = useRef<FlatList<Slayt>>(null);
  const [sira, setSira] = useState(0);
  const [durdu, setDurdu] = useState(false);

  const slaytlar = useMemo<Slayt[]>(() => {
    const kat = [...kategoriler]
      .filter((k) => k.imageUrl && k.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 4)
      .map((k) => ({
        anahtar: k.slug,
        ust: k.name,
        baslik: METINLER[k.slug]?.baslik ?? `${k.name} seçkisi`,
        alt: METINLER[k.slug]?.alt ?? `${k.productCount} ürün, farklı mağazalardan.`,
        gorsel: k.imageUrl,
        kategori: k.slug,
        dugme: `${k.name} ürünleri`
      }));
    return [
      {
        anahtar: "genel",
        ust: "Donanex",
        baslik: "Onlarca mağaza, tek sepet, tek ödeme.",
        alt:
          urunSayisi && magazaSayisi
            ? `${magazaSayisi} mağazadan ${urunSayisi} ürün. Üye olmadan da sipariş verebilirsiniz.`
            : "Gezmek ve sepete eklemek için üye olmanıza gerek yok.",
        gorsel: kat[0]?.gorsel ?? null,
        dugme: "Ürünleri keşfet"
      },
      ...kat
    ];
  }, [kategoriler, urunSayisi, magazaSayisi]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => azalt && setDurdu(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (durdu || slaytlar.length < 2) return;
    const zaman = setInterval(() => {
      setSira((onceki) => {
        const sonraki = (onceki + 1) % slaytlar.length;
        liste.current?.scrollToOffset({ offset: sonraki * (genislik + bosluk.m), animated: true });
        return sonraki;
      });
    }, 6000);
    return () => clearInterval(zaman);
  }, [durdu, slaytlar.length, genislik]);

  return (
    <View>
      <FlatList
        ref={liste}
        horizontal
        data={slaytlar}
        keyExtractor={(s) => s.anahtar}
        showsHorizontalScrollIndicator={false}
        snapToInterval={genislik + bosluk.m}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: bosluk.l, gap: bosluk.m }}
        onScrollBeginDrag={() => setDurdu(true)}
        onMomentumScrollEnd={(e) => setSira(Math.round(e.nativeEvent.contentOffset.x / (genislik + bosluk.m)))}
        renderItem={({ item }) => (
          <Pressable
            style={[st.slayt, { width: genislik }]}
            onPress={() => router.push(item.kategori ? `/urunler?kategori=${item.kategori}` : "/urunler")}
            accessibilityRole="link"
            accessibilityLabel={`${item.baslik}. ${item.dugme}`}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={st.ust}>{buyukHarf(item.ust)}</Text>
              <Text style={st.baslik} numberOfLines={3}>
                {item.baslik}
              </Text>
              <Text style={st.alt} numberOfLines={3}>
                {item.alt}
              </Text>
              <View style={st.dugme}>
                <Text style={st.dugmeYazi}>{item.dugme} →</Text>
              </View>
            </View>
            {item.gorsel ? (
              <View style={st.gorselKap}>
                <Image source={resim(item.gorsel)} style={{ flex: 1 }} contentFit="contain" />
              </View>
            ) : null}
          </Pressable>
        )}
      />
      <View style={st.noktalar} accessibilityElementsHidden>
        {slaytlar.map((s, i) => (
          <View key={s.anahtar} style={[st.nokta, i === sira && st.noktaAktif]} />
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  slayt: {
    backgroundColor: renk.gece,
    borderRadius: kose.l,
    padding: bosluk.l,
    minHeight: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: bosluk.m,
    overflow: "hidden"
  },
  ust: { color: renk.marka200, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  baslik: { color: renk.beyaz, fontSize: 20, fontWeight: "800", lineHeight: 25 },
  alt: { color: renk.murekkep300, fontSize: 13, lineHeight: 18 },
  dugme: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: renk.beyaz,
    borderRadius: kose.tam,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  dugmeYazi: { color: renk.marka700, fontWeight: "700", fontSize: 13 },
  gorselKap: { width: 108, height: 108, backgroundColor: renk.beyaz, borderRadius: kose.m, padding: 8 },
  noktalar: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  nokta: { width: 6, height: 6, borderRadius: 3, backgroundColor: renk.murekkep300 },
  noktaAktif: { width: 18, backgroundColor: renk.marka600 }
});
