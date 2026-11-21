import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, sorgu } from "@/lib/api";
import { resim } from "@/lib/sunucu";
import { Bos, Yukleniyor } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

interface Magaza {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  productCount: number;
}

/** Bütün mağazalar; yazdıkça süzülür (web'deki /magazalar). */
export default function Magazalar() {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [liste, setListe] = useState<Magaza[] | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    // Her tuşta değil, yazma durunca: kısa bekleme isteği azaltıyor.
    const zaman = setTimeout(() => {
      api
        .get<{ items: Magaza[] }>(`/storefront/stores${sorgu({ q: arama.trim() })}`)
        .then((r) => {
          setListe(r.items);
          setHata("");
        })
        .catch((e) => {
          setHata(e.message);
          setListe((o) => o ?? []);
        });
    }, 250);
    return () => clearTimeout(zaman);
  }, [arama]);

  return (
    <FlatList
      data={liste ?? []}
      keyExtractor={(m) => m.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}
      ListHeaderComponent={
        <View style={{ gap: bosluk.s }}>
          <View style={st.arama}>
            <Ionicons name="search" size={18} color={renk.murekkep400} />
            <TextInput
              value={arama}
              onChangeText={setArama}
              placeholder="Mağaza ara"
              placeholderTextColor={renk.murekkep400}
              style={st.aramaAlan}
              returnKeyType="search"
              accessibilityLabel="Mağaza ara"
            />
          </View>
          {hata ? <Text style={{ color: renk.kirmizi }}>{hata}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        liste === null ? (
          <Yukleniyor />
        ) : (
          <Bos ikon="storefront-outline" baslik={arama ? "Aramanıza uygun mağaza yok" : "Henüz mağaza yok"} />
        )
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/magaza/${item.slug}`)}
          style={({ pressed }) => [st.kart, pressed && { opacity: 0.85 }]}
          accessibilityRole="link"
          accessibilityLabel={`${item.name}, ${item.productCount} ürün`}
        >
          <View style={st.logo}>{item.logoUrl ? <Image source={resim(item.logoUrl)} style={{ flex: 1 }} contentFit="contain" /> : null}</View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.ad}>{item.name}</Text>
            {item.description ? (
              <Text style={st.aciklama} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <Text style={st.sayi}>{item.productCount} ürün</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={renk.murekkep300} />
        </Pressable>
      )}
    />
  );
}

const st = StyleSheet.create({
  arama: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: renk.beyaz,
    borderWidth: 1,
    borderColor: renk.murekkep200,
    borderRadius: kose.m,
    paddingHorizontal: bosluk.m
  },
  aramaAlan: { flex: 1, minHeight: 46, fontSize: 16, color: renk.murekkep900 },
  kart: {
    flexDirection: "row",
    alignItems: "center",
    gap: bosluk.m,
    backgroundColor: renk.beyaz,
    borderRadius: kose.l,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.l
  },
  logo: { width: 52, height: 52, borderRadius: kose.m, backgroundColor: renk.murekkep50, padding: 6 },
  ad: { fontSize: 16, fontWeight: "800", color: renk.murekkep900 },
  aciklama: { fontSize: 13, color: renk.murekkep600, lineHeight: 18 },
  sayi: { fontSize: 12, color: renk.marka600, fontWeight: "700" }
});
