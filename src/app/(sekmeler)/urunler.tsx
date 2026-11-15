import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, sorgu } from "@/lib/api";
import { Bos, Yukleniyor } from "@/components/Ui";
import { UrunKart, type Urun } from "@/components/UrunKart";
import type { Kategori } from "@/components/AnaSlider";
import { bosluk, kose, renk } from "@/tema";

const SIRALAR = [
  { deger: "newest", etiket: "En yeni" },
  { deger: "price_asc", etiket: "Fiyat artan" },
  { deger: "price_desc", etiket: "Fiyat azalan" }
] as const;

function Cip({ secili, etiket, onPress }: { secili: boolean; etiket: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.cip, secili && st.cipSecili]}
      accessibilityRole="button"
      accessibilityState={{ selected: secili }}
    >
      <Text style={[st.cipYazi, secili && { color: renk.beyaz }]}>{etiket}</Text>
    </Pressable>
  );
}

interface Sayfa {
  items: Urun[];
  total: number;
  page: number;
  pages: number;
}

export default function Urunler() {
  const params = useLocalSearchParams<{ kategori?: string; siralama?: string; ara?: string; q?: string }>();
  const [aranan, setAranan] = useState(params.q ?? "");
  const [arama, setArama] = useState(params.q ?? "");
  const [kategori, setKategori] = useState<string | null>(params.kategori ?? null);
  const [siralama, setSiralama] = useState<string>(params.siralama ?? "newest");
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [sayfa, setSayfa] = useState<Sayfa | null>(null);
  const [ekYukleniyor, setEkYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const aramaKutusu = useRef<ComponentRef<typeof TextInput>>(null);

  // Ana sayfadan gelen kategori / sıralama / arama isteği.
  useEffect(() => {
    if (params.kategori !== undefined) setKategori(params.kategori || null);
    if (params.siralama) setSiralama(params.siralama);
    if (params.ara) setTimeout(() => aramaKutusu.current?.focus(), 300);
  }, [params.kategori, params.siralama, params.ara]);

  useEffect(() => {
    api.get<{ items: Kategori[] }>("/categories").then((r) => setKategoriler(r.items ?? [])).catch(() => {});
  }, []);

  // Yazarken her harfte istek atılmasın: 350 ms bekleniyor.
  useEffect(() => {
    const t = setTimeout(() => setArama(aranan.trim()), 350);
    return () => clearTimeout(t);
  }, [aranan]);

  const yukle = useCallback(
    async (no = 1) => {
      setHata("");
      try {
        const yeni = await api.get<Sayfa>(
          `/products${sorgu({ q: arama || null, category: kategori, sort: siralama, page: no, pageSize: 20 })}`
        );
        setSayfa((onceki) => (no === 1 || !onceki ? yeni : { ...yeni, items: [...onceki.items, ...yeni.items] }));
      } catch (e: any) {
        setHata(e.message);
      }
    },
    [arama, kategori, siralama]
  );

  useEffect(() => {
    setSayfa(null);
    void yukle(1);
  }, [yukle]);

  async function devami() {
    if (!sayfa || ekYukleniyor || sayfa.page >= sayfa.pages) return;
    setEkYukleniyor(true);
    await yukle(sayfa.page + 1);
    setEkYukleniyor(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={st.filtre}>
        <View style={st.arama}>
          <Ionicons name="search" size={18} color={renk.murekkep400} />
          <TextInput
            ref={aramaKutusu}
            value={aranan}
            onChangeText={setAranan}
            placeholder="Ürün, marka veya mağaza ara"
            placeholderTextColor={renk.murekkep400}
            style={st.aramaAlan}
            returnKeyType="search"
            accessibilityLabel="Ürün ara"
            autoCorrect={false}
          />
          {aranan ? (
            <Pressable onPress={() => setAranan("")} accessibilityLabel="Aramayı temizle" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={renk.murekkep400} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.cipler}>
          <Cip secili={!kategori} etiket="Tümü" onPress={() => setKategori(null)} />
          {kategoriler.map((k) => (
            <Cip key={k.id} secili={kategori === k.slug} etiket={k.name} onPress={() => setKategori(k.slug)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.cipler}>
          {SIRALAR.map((s) => (
            <Cip key={s.deger} secili={siralama === s.deger} etiket={s.etiket} onPress={() => setSiralama(s.deger)} />
          ))}
          {sayfa ? <Text style={st.sayi}>{sayfa.total} ürün</Text> : null}
        </ScrollView>
      </View>

      {!sayfa && !hata ? <Yukleniyor /> : null}
      {hata && !sayfa ? <Bos ikon="cloud-offline-outline" baslik="Ürünler yüklenemedi" aciklama={hata} /> : null}

      {sayfa ? (
        <FlatList
          data={sayfa.items}
          keyExtractor={(u) => u.id}
          numColumns={2}
          columnWrapperStyle={{ gap: bosluk.m }}
          contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}
          renderItem={({ item }) => (
            <View style={{ flex: 1, maxWidth: "50%" }}>
              <UrunKart urun={item} />
            </View>
          )}
          onEndReached={devami}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => yukle(1)} tintColor={renk.marka600} />}
          ListEmptyComponent={
            <Bos
              ikon="search-outline"
              baslik="Sonuç bulunamadı"
              aciklama={arama ? `"${arama}" için ürün yok. Başka bir kelime deneyin.` : "Bu kategoride henüz ürün yok."}
            />
          }
          ListFooterComponent={ekYukleniyor ? <Yukleniyor /> : undefined}
        />
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  filtre: { backgroundColor: renk.beyaz, borderBottomWidth: 1, borderBottomColor: renk.murekkep100, paddingTop: bosluk.m, gap: bosluk.s, paddingBottom: bosluk.s },
  arama: {
    marginHorizontal: bosluk.l,
    height: 44,
    borderRadius: kose.m,
    backgroundColor: renk.murekkep50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: bosluk.m
  },
  aramaAlan: { flex: 1, fontSize: 15, color: renk.murekkep900, height: 44 },
  cipler: { paddingHorizontal: bosluk.l, gap: bosluk.s, alignItems: "center" },
  cip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: kose.tam,
    borderWidth: 1,
    borderColor: renk.murekkep200,
    backgroundColor: renk.beyaz,
    justifyContent: "center"
  },
  cipSecili: { backgroundColor: renk.marka600, borderColor: renk.marka600 },
  cipYazi: { fontSize: 13, fontWeight: "600", color: renk.murekkep700 },
  sayi: { fontSize: 12, color: renk.murekkep500, marginLeft: 4 }
});
