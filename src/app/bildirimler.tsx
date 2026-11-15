import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Redirect, Stack, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { gecenSure } from "@/lib/bicim";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Bos, Yukleniyor } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

interface Bildirim {
  id: string;
  title: string;
  body?: string | null;
  url?: string | null;
  readAt?: string | null;
  createdAt: string;
}

/*
 * Bildirimlerdeki adresler web sitesinin adresleri. Uygulamada karşılığı
 * olanlar uygulama ekranına çevriliyor; olmayanlar (mağaza paneli, destek
 * talepleri) yalnızca okundu işaretleniyor.
 */
function uygulamaAdresi(url?: string | null): string | null {
  if (!url) return null;
  const yol = url.split("#")[0];
  let m = yol.match(/^\/urunler\/([^/]+)\/([^/?]+)/);
  if (m) return `/urun/${m[1]}/${m[2]}`;
  m = yol.match(/\/siparisler\/([^/?]+)$/);
  if (m && yol.startsWith("/hesabim")) return `/siparisler/${m[1]}`;
  return null;
}

export default function Bildirimler() {
  const router = useRouter();
  const mesaj = useMesaj();
  const { kullanici, hazir } = useOturum();
  const [liste, setListe] = useState<Bildirim[] | null>(null);
  const [okunmamis, setOkunmamis] = useState(0);

  const yukle = useCallback(async () => {
    try {
      const r = await api.get<{ items: Bildirim[]; unread: number }>("/me/notifications");
      setListe(r.items ?? []);
      setOkunmamis(r.unread ?? 0);
    } catch (e: any) {
      mesaj(e.message, "hata");
      setListe((o) => o ?? []);
    }
  }, [mesaj]);

  useEffect(() => {
    if (kullanici) void yukle();
  }, [kullanici, yukle]);

  async function ac(b: Bildirim) {
    if (!b.readAt) {
      api.post(`/me/notifications/${b.id}/read`).catch(() => {});
      setListe((l) => l?.map((x) => (x.id === b.id ? { ...x, readAt: new Date().toISOString() } : x)) ?? l);
      setOkunmamis((n) => Math.max(0, n - 1));
    }
    const hedef = uygulamaAdresi(b.url);
    if (hedef) router.push(hedef as any);
  }

  async function hepsiOkundu() {
    try {
      await api.post("/me/notifications/read-all");
      await yukle();
    } catch (e: any) {
      mesaj(e.message, "hata");
    }
  }

  if (hazir && !kullanici) return <Redirect href="/giris" />;
  if (!liste) return <Yukleniyor />;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: okunmamis
            ? () => (
                <Pressable onPress={hepsiOkundu} hitSlop={8} accessibilityRole="button">
                  <Text style={{ color: renk.marka600, fontWeight: "700" }}>Tümü okundu</Text>
                </Pressable>
              )
            : undefined
        }}
      />
      <FlatList
        data={liste}
        keyExtractor={(b) => b.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={yukle} tintColor={renk.marka600} />}
        ListEmptyComponent={<Bos ikon="notifications-outline" baslik="Bildirim yok" aciklama="Sipariş, kargo ve soru yanıtları burada görünür." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => ac(item)}
            style={({ pressed }) => [st.satir, !item.readAt && st.okunmamis, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={`${item.readAt ? "" : "Okunmamış. "}${item.title}`}
          >
            {!item.readAt ? <View style={st.nokta} /> : <View style={{ width: 8 }} />}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[st.baslik, !item.readAt && { fontWeight: "800" }]}>{item.title}</Text>
              {item.body ? <Text style={st.govde}>{item.body}</Text> : null}
              <Text style={st.zaman}>{gecenSure(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </>
  );
}

const st = StyleSheet.create({
  satir: {
    flexDirection: "row",
    gap: bosluk.m,
    padding: bosluk.l,
    backgroundColor: renk.beyaz,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: renk.murekkep100,
    alignItems: "flex-start"
  },
  okunmamis: { backgroundColor: renk.marka50 },
  nokta: { width: 8, height: 8, borderRadius: 4, backgroundColor: renk.marka600, marginTop: 6 },
  baslik: { fontSize: 15, fontWeight: "600", color: renk.murekkep900 },
  govde: { fontSize: 14, color: renk.murekkep600, lineHeight: 20 },
  zaman: { fontSize: 12, color: renk.murekkep400 }
});
