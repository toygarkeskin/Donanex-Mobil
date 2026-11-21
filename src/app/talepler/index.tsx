import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { TALEP_DURUMU, tarih } from "@/lib/bicim";
import { useOturum } from "@/state/Oturum";
import { Bos, Buton, Rozet, Yukleniyor } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

interface Talep {
  id: string;
  reference: string;
  subject: string;
  status: string;
  createdAt: string;
}

/** Destek taleplerim (web'deki Hesabım > Destek taleplerim). */
export default function Talepler() {
  const router = useRouter();
  const { kullanici, hazir } = useOturum();
  const [liste, setListe] = useState<Talep[] | null>(null);
  const [sayfa, setSayfa] = useState({ page: 0, pages: 1 });
  const [hata, setHata] = useState("");

  const yukle = useCallback(async (no = 1) => {
    try {
      const r = await api.get<{ items: Talep[]; page: number; pages: number }>(`/me/tickets?page=${no}`);
      setListe((o) => (no === 1 || !o ? r.items : [...o, ...r.items]));
      setSayfa({ page: r.page, pages: r.pages });
      setHata("");
    } catch (e: any) {
      setHata(e.message);
      setListe((o) => o ?? []);
    }
  }, []);

  // Yeni talep açıp dönüldüğünde liste tazelensin.
  useFocusEffect(
    useCallback(() => {
      if (kullanici) void yukle(1);
    }, [kullanici, yukle])
  );

  if (hazir && !kullanici) return <Redirect href="/giris" />;
  if (!liste) return <Yukleniyor />;

  return (
    <FlatList
      data={liste}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => yukle(1)} tintColor={renk.marka600} />}
      onEndReached={() => sayfa.page < sayfa.pages && yukle(sayfa.page + 1)}
      ListHeaderComponent={
        <View style={{ gap: bosluk.s }}>
          <Buton baslik="Yeni talep" ikon="add" onPress={() => router.push("/destek")} />
          {hata ? <Text style={{ color: renk.kirmizi }}>{hata}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <Bos ikon="chatbubbles-outline" baslik="Henüz destek talebiniz yok" aciklama="Bir sorun yaşarsanız destek ekibimize yazabilirsiniz." />
      }
      renderItem={({ item }) => {
        const d = TALEP_DURUMU[item.status];
        return (
          <Pressable style={st.kart} onPress={() => router.push(`/talepler/${item.id}`)} accessibilityRole="link">
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={st.no}>{item.reference}</Text>
                <Rozet etiket={d?.etiket ?? item.status} ton={d?.ton ?? "bilgi"} />
              </View>
              <Text style={st.konu} numberOfLines={2}>
                {item.subject}
              </Text>
              <Text style={st.kucuk}>{tarih(item.createdAt, false)}</Text>
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
  no: { fontSize: 12, fontWeight: "700", color: renk.murekkep500 },
  konu: { fontSize: 15, fontWeight: "700", color: renk.murekkep900 },
  kucuk: { fontSize: 12, color: renk.murekkep500 }
});
