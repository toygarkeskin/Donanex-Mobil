import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { tarih } from "@/lib/bicim";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "./Mesaj";
import { Alan, Buton, Kart } from "./Ui";
import { bosluk, renk } from "@/tema";

interface Yanit {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
}
interface Soru {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  answers?: Yanit[];
}
interface Sayfa {
  items: Soru[];
  total: number;
  page: number;
  pages: number;
}

/**
 * Ürün soru-cevap. Soruyu giriş yapmış herkes soruyor; yanıtı satıcı web
 * panelinden ya da sitenin ürün sayfasından veriyor. Yanıt gelince soran
 * kişiye bildirim ve e-posta gidiyor.
 */
export function Sorular({ urunId }: { urunId: string }) {
  const router = useRouter();
  const { kullanici } = useOturum();
  const mesaj = useMesaj();
  const [sayfa, setSayfa] = useState<Sayfa | null>(null);
  const [metin, setMetin] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(
    async (no = 1) => {
      try {
        const yeni = await api.get<Sayfa>(`/urunler/${urunId}/sorular?page=${no}&pageSize=5`);
        setSayfa((onceki) => (no === 1 || !onceki ? yeni : { ...yeni, items: [...onceki.items, ...yeni.items] }));
      } catch {
        setSayfa({ items: [], total: 0, page: 1, pages: 1 });
      }
    },
    [urunId]
  );

  useEffect(() => {
    void yukle(1);
  }, [yukle]);

  async function sor() {
    if (metin.trim().length < 5) return mesaj("Soru en az 5 karakter olmalı.", "hata");
    setGonderiliyor(true);
    try {
      const soru = await api.post<Soru>(`/urunler/${urunId}/sorular`, { body: metin });
      setSayfa((s) => (s ? { ...s, items: [soru, ...s.items], total: s.total + 1 } : s));
      setMetin("");
      mesaj("Sorunuz satıcıya iletildi. Yanıtlanınca haber vereceğiz.", "basari");
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <View style={{ gap: bosluk.m }}>
      <Text style={st.baslik} accessibilityRole="header">
        Soru & cevap {sayfa?.total ? `(${sayfa.total})` : ""}
      </Text>

      {kullanici ? (
        <Kart style={{ gap: bosluk.s }}>
          <Alan etiket="Satıcıya sorunuz" value={metin} onChangeText={setMetin} maxLength={1000} placeholder="Bu ürün hakkında bir soru sorun…" multiline />
          <Buton baslik="Soru sor" yukleniyor={gonderiliyor} onPress={sor} />
        </Kart>
      ) : (
        <Kart style={st.giris}>
          <Text style={{ flex: 1, color: renk.murekkep600 }}>Satıcıya soru sormak için giriş yapın.</Text>
          <Buton kucuk tur="ikincil" baslik="Giriş yap" onPress={() => router.push("/giris")} />
        </Kart>
      )}

      {sayfa && !sayfa.items.length ? <Text style={st.bos}>Bu ürün hakkında henüz soru sorulmadı.</Text> : null}

      {sayfa?.items.map((soru) => (
        <Kart key={soru.id} style={{ gap: 10 }}>
          <View style={st.satir}>
            <View style={[st.ikon, { backgroundColor: renk.murekkep100 }]}>
              <Text style={{ fontWeight: "800", color: renk.murekkep600, fontSize: 12 }}>S</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.soru}>{soru.body}</Text>
              <Text style={st.kucuk}>
                {soru.authorName} · {tarih(soru.createdAt, false)}
              </Text>
            </View>
          </View>
          {soru.answers?.length ? (
            soru.answers.map((y) => (
              <View key={y.id} style={[st.satir, st.yanit]}>
                <View style={[st.ikon, { backgroundColor: renk.marka50 }]}>
                  <Ionicons name="storefront-outline" size={13} color={renk.marka600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.yanitYazi}>{y.body}</Text>
                  <Text style={st.kucuk}>
                    <Text style={{ color: renk.marka600, fontWeight: "700" }}>{y.authorName}</Text> · {tarih(y.createdAt, false)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[st.kucuk, { paddingLeft: 38 }]}>Satıcının yanıtı bekleniyor.</Text>
          )}
        </Kart>
      ))}

      {sayfa && sayfa.page < sayfa.pages ? (
        <Buton tur="ikincil" baslik={`Daha fazla soru (${sayfa.total - sayfa.items.length})`} onPress={() => yukle(sayfa.page + 1)} />
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  baslik: { fontSize: 18, fontWeight: "800", color: renk.murekkep900 },
  giris: { flexDirection: "row", alignItems: "center", gap: bosluk.s },
  bos: { color: renk.murekkep500, fontSize: 14 },
  satir: { flexDirection: "row", gap: 10 },
  ikon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  soru: { fontSize: 14, fontWeight: "600", color: renk.murekkep800 },
  yanit: { borderTopWidth: 1, borderTopColor: renk.murekkep100, paddingTop: 10, paddingLeft: 8 },
  yanitYazi: { fontSize: 14, color: renk.murekkep700, lineHeight: 20 },
  kucuk: { fontSize: 12, color: renk.murekkep400, marginTop: 2 }
});
