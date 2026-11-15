import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { resim } from "@/lib/sunucu";
import { useOturum } from "@/state/Oturum";
import { AnaSlider, type Kategori } from "@/components/AnaSlider";
import { BolumBasligi, Bos, Buton, Yukleniyor } from "@/components/Ui";
import { UrunKart, type Urun } from "@/components/UrunKart";
import { bosluk, kose, renk } from "@/tema";

interface Magaza {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string | null;
  productCount: number;
}

export default function AnaSayfa() {
  const router = useRouter();
  const ust = useSafeAreaInsets().top;
  const { kullanici } = useOturum();
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [sonGelenler, setSonGelenler] = useState<Urun[]>([]);
  const [urunSayisi, setUrunSayisi] = useState(0);
  const [magazalar, setMagazalar] = useState<Magaza[]>([]);
  const [okunmamisSayi, setOkunmamis] = useState(0);
  // Çıkış yapınca rozet hemen kaybolsun: sayı oturuma göre türetiliyor.
  const okunmamis = kullanici ? okunmamisSayi : 0;
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "hata">("yukleniyor");
  const [hata, setHata] = useState("");
  const [yenileniyor, setYenileniyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      const [k, u, m] = await Promise.all([
        api.get<{ items: Kategori[] }>("/categories"),
        api.get<{ items: Urun[]; total: number }>("/products?pageSize=8&sort=newest"),
        api.get<{ items: Magaza[] }>("/storefront/stores")
      ]);
      setKategoriler(k.items ?? []);
      setSonGelenler(u.items ?? []);
      setUrunSayisi(u.total ?? 0);
      setMagazalar(m.items ?? []);
      setDurum("hazir");
    } catch (e: any) {
      setHata(e.message);
      setDurum("hata");
    }
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  useEffect(() => {
    if (!kullanici) return;
    api
      .get<{ unread: number }>("/me/notifications/unread-count")
      .then((r) => setOkunmamis(r.unread ?? 0))
      .catch(() => {});
  }, [kullanici, durum]);

  async function yenile() {
    setYenileniyor(true);
    await yukle();
    setYenileniyor(false);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: renk.murekkep50 }}
      contentContainerStyle={{ paddingTop: ust + bosluk.s, paddingBottom: bosluk.xxl }}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.marka600} />}
    >
      <View style={st.ustBar}>
        <View style={st.logo}>
          <View style={st.logoKutu}>
            <Text style={st.logoHarf}>D</Text>
          </View>
          <Text style={st.logoYazi}>Donanex</Text>
        </View>
        <Pressable
          onPress={() => router.push(kullanici ? "/bildirimler" : "/giris")}
          style={st.zil}
          accessibilityRole="button"
          accessibilityLabel={okunmamis ? `Bildirimler, ${okunmamis} okunmamış` : "Bildirimler"}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={22} color={renk.murekkep800} />
          {okunmamis ? (
            <View style={st.zilRozet}>
              <Text style={st.zilRozetYazi}>{okunmamis > 9 ? "9+" : okunmamis}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <Pressable style={st.arama} onPress={() => router.push("/urunler?ara=1")} accessibilityRole="search" accessibilityLabel="Ürün, marka veya mağaza ara">
        <Ionicons name="search" size={18} color={renk.murekkep400} />
        <Text style={st.aramaYazi}>Ürün, marka veya mağaza ara</Text>
      </Pressable>

      {durum === "yukleniyor" ? <Yukleniyor yazi="Vitrin hazırlanıyor…" /> : null}
      {durum === "hata" ? (
        <Bos ikon="cloud-offline-outline" baslik="Mağazaya ulaşılamadı" aciklama={hata}>
          <Buton baslik="Tekrar dene" onPress={() => { setDurum("yukleniyor"); void yukle(); }} />
          <Buton baslik="Sunucu adresini değiştir" tur="hayalet" onPress={() => router.push("/sunucu")} style={{ marginTop: 8 }} />
        </Bos>
      ) : null}

      {durum === "hazir" ? (
        <>
          <AnaSlider kategoriler={kategoriler} urunSayisi={urunSayisi} magazaSayisi={magazalar.length} />

          <View style={{ marginTop: bosluk.xl }}>
            <BolumBasligi baslik="Ne arıyorsunuz?" />
            <FlatList
              horizontal
              data={kategoriler}
              keyExtractor={(k) => k.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: bosluk.l, gap: bosluk.s }}
              renderItem={({ item }) => (
                <Pressable
                  style={st.kategori}
                  onPress={() => router.push(`/urunler?kategori=${item.slug}`)}
                  accessibilityRole="link"
                  accessibilityLabel={`${item.name}, ${item.productCount} ürün`}
                >
                  <View style={st.kategoriGorsel}>
                    {item.imageUrl ? <Image source={resim(item.imageUrl)} style={{ flex: 1 }} contentFit="contain" /> : null}
                  </View>
                  <Text style={st.kategoriAd} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          <View style={{ marginTop: bosluk.xl }}>
            <BolumBasligi
              baslik="Son gelenler"
              sag={
                <Pressable onPress={() => router.push("/urunler?siralama=newest")} hitSlop={8} accessibilityRole="link">
                  <Text style={st.tumu}>Tümü</Text>
                </Pressable>
              }
            />
            <FlatList
              horizontal
              data={sonGelenler}
              keyExtractor={(u) => u.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: bosluk.l, gap: bosluk.m }}
              renderItem={({ item }) => <UrunKart urun={item} genislik={160} zamanGoster />}
            />
          </View>

          <View style={{ marginTop: bosluk.xl, paddingHorizontal: bosluk.l, gap: bosluk.m }}>
            <Text style={st.bolum} accessibilityRole="header">
              Mağazalar
            </Text>
            {magazalar.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => router.push(`/magaza/${m.slug}`)}
                style={({ pressed }) => [st.magaza, pressed && { transform: [{ scale: 0.98 }] }]}
                accessibilityRole="link"
                accessibilityLabel={`${m.name}, ${m.productCount} ürün`}
              >
                <View style={st.magazaLogo}>
                  {m.logoUrl ? <Image source={resim(m.logoUrl)} style={{ flex: 1 }} contentFit="contain" /> : null}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={st.magazaAd}>{m.name}</Text>
                  {m.description ? (
                    <Text style={st.magazaAciklama} numberOfLines={2}>
                      {m.description}
                    </Text>
                  ) : null}
                  <Text style={st.magazaSayi}>{m.productCount} ürün</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={renk.murekkep300} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  ustBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: bosluk.l },
  logo: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoKutu: { width: 32, height: 32, borderRadius: 9, backgroundColor: renk.marka600, alignItems: "center", justifyContent: "center" },
  logoHarf: { color: renk.beyaz, fontWeight: "900", fontSize: 17 },
  logoYazi: { fontSize: 20, fontWeight: "800", color: renk.murekkep900 },
  zil: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  zilRozet: {
    position: "absolute",
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: renk.kirmizi,
    alignItems: "center",
    justifyContent: "center"
  },
  zilRozetYazi: { color: renk.beyaz, fontSize: 10, fontWeight: "800" },
  arama: {
    marginHorizontal: bosluk.l,
    marginTop: bosluk.s,
    marginBottom: bosluk.l,
    height: 46,
    borderRadius: kose.m,
    backgroundColor: renk.beyaz,
    borderWidth: 1,
    borderColor: renk.murekkep200,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: bosluk.m
  },
  aramaYazi: { color: renk.murekkep400, fontSize: 15 },
  kategori: { width: 84, alignItems: "center", gap: 6 },
  kategoriGorsel: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: renk.beyaz,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: 12
  },
  kategoriAd: { fontSize: 12, fontWeight: "600", color: renk.murekkep700 },
  tumu: { color: renk.marka600, fontWeight: "700", fontSize: 14 },
  bolum: { fontSize: 18, fontWeight: "800", color: renk.murekkep900 },
  magaza: {
    flexDirection: "row",
    alignItems: "center",
    gap: bosluk.m,
    backgroundColor: renk.beyaz,
    borderRadius: kose.l,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.m
  },
  magazaLogo: { width: 52, height: 52, borderRadius: kose.m, backgroundColor: renk.murekkep50, padding: 8 },
  magazaAd: { fontSize: 15, fontWeight: "700", color: renk.murekkep900 },
  magazaAciklama: { fontSize: 12, color: renk.murekkep500, lineHeight: 17 },
  magazaSayi: { fontSize: 12, color: renk.marka600, fontWeight: "600" }
});
