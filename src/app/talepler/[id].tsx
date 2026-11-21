import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, erisimJetonu } from "@/lib/api";
import { TALEP_DURUMU, tarih } from "@/lib/bicim";
import { sunucu } from "@/lib/sunucu";
import { EK_EN_FAZLA, boyutYaz, ekSec, ekYukle } from "@/lib/talepEki";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Bos, Buton, Kart, Rozet, Yukleniyor } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

interface Ek {
  id: string;
  originalName: string;
  contentType: string;
  size: number;
  isStaff?: boolean;
  createdAt: string;
}

interface TalepDetay {
  id: string;
  reference: string;
  subject: string;
  status: string;
  message: string;
  createdAt: string;
  messages?: { id: string; body: string; isStaff: boolean; createdAt: string }[];
  attachments?: Ek[];
}

/**
 * Talep ayrıntısı: ilk mesaj, destek ekibinin yanıtları ve ekler. Kapatılmış
 * talebe ek eklenemiyor (sunucu da reddediyor); düğme o durumda çizilmiyor.
 * Görsel ekler önizleniyor — dosya korumalı, istek erişim jetonuyla gidiyor.
 */
export default function TalepSayfasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kullanici, hazir } = useOturum();
  const mesaj = useMesaj();
  const [talep, setTalep] = useState<TalepDetay | null>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "yok">("yukleniyor");
  const [yukleniyor, setYukleniyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      setTalep(await api.get<TalepDetay>(`/me/tickets/${id}`));
      setDurum("hazir");
    } catch {
      setDurum("yok");
    }
  }, [id]);

  // Oturum hazır olmadan istek atılmıyor: doğrudan açılan bağlantıda jeton henüz yok (siparişlerdeki ders).
  useEffect(() => {
    if (kullanici) void yukle();
  }, [kullanici, yukle]);

  if (hazir && !kullanici) return <Redirect href="/giris" />;
  if (durum === "yukleniyor") return <Yukleniyor />;
  if (durum === "yok" || !talep) return <Bos ikon="chatbubbles-outline" baslik="Talep bulunamadı" />;

  const d = TALEP_DURUMU[talep.status];
  const ekler = talep.attachments ?? [];
  const ekAcik = talep.status !== "closed" && ekler.length < EK_EN_FAZLA;

  async function ekEkle() {
    const { ekler: secilen, hatalar } = await ekSec(EK_EN_FAZLA - ekler.length);
    hatalar.forEach((h) => mesaj(h, "hata"));
    if (!secilen.length) return;
    setYukleniyor(true);
    let yuklenen = 0;
    for (const ek of secilen) {
      try {
        await ekYukle(talep!.id, ek);
        yuklenen++;
      } catch (e: any) {
        mesaj(`${ek.ad}: ${e.message}`, "hata");
      }
    }
    setYukleniyor(false);
    if (yuklenen) mesaj(`${yuklenen} dosya eklendi.`, "basari");
    await yukle();
  }

  const jeton = erisimJetonu();

  return (
    <>
      <Stack.Screen options={{ title: talep.reference }} />
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}>
        <Kart style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={st.no}>{talep.reference}</Text>
            <Rozet etiket={d?.etiket ?? talep.status} ton={d?.ton ?? "bilgi"} />
          </View>
          <Text style={st.konu}>{talep.subject}</Text>
          <Text style={st.kucuk}>{tarih(talep.createdAt)}</Text>
          <Text style={st.metin}>{talep.message}</Text>
        </Kart>

        {talep.messages?.length ? (
          talep.messages.map((m) => (
            <View key={m.id} style={[st.yanit, m.isStaff && st.yanitEkip]}>
              <Text style={st.kucuk}>
                {m.isStaff ? "Destek ekibi" : "Siz"} · {tarih(m.createdAt)}
              </Text>
              <Text style={st.metin}>{m.body}</Text>
            </View>
          ))
        ) : (
          <Text style={st.kucuk}>Henüz yanıt verilmedi. Yanıt e-posta adresinize de gönderilir.</Text>
        )}

        <Kart style={{ gap: bosluk.s }}>
          <Text style={st.ekBaslik}>Ekler</Text>
          {ekler.length === 0 ? <Text style={st.kucuk}>Ek yok.</Text> : null}
          {ekler.map((ek) => (
            <View key={ek.id} style={st.ek}>
              {ek.contentType.startsWith("image/") && jeton ? (
                <Image
                  source={{ uri: `${sunucu()}/api/me/tickets/${talep.id}/ekler/${ek.id}`, headers: { Authorization: `Bearer ${jeton}` } }}
                  style={st.onizleme}
                  contentFit="cover"
                  accessibilityLabel={ek.originalName}
                />
              ) : (
                <View style={[st.onizleme, { alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="document-text-outline" size={22} color={renk.marka600} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={st.ekAd} numberOfLines={1}>
                  {ek.originalName}
                </Text>
                <Text style={st.kucuk}>
                  {ek.isStaff ? "Destek ekibi · " : ""}
                  {boyutYaz(ek.size)} · {tarih(ek.createdAt, false)}
                </Text>
              </View>
            </View>
          ))}
          {ekler.some((e) => !e.contentType.startsWith("image/")) ? (
            <Text style={st.kucuk}>PDF ekleri web sitesindeki Hesabım › Destek taleplerim bölümünden indirilebilir.</Text>
          ) : null}
          {ekAcik ? (
            <Buton baslik="Dosya ekle" tur="ikincil" ikon="attach" kucuk yukleniyor={yukleniyor} onPress={ekEkle} />
          ) : talep.status === "closed" ? (
            <Text style={st.kucuk}>Kapatılmış talebe dosya eklenemez.</Text>
          ) : (
            <Text style={st.kucuk}>Bu talebe en fazla {EK_EN_FAZLA} dosya eklenebilir.</Text>
          )}
        </Kart>
      </ScrollView>
    </>
  );
}

const st = StyleSheet.create({
  no: { fontSize: 12, fontWeight: "700", color: renk.murekkep500 },
  konu: { fontSize: 17, fontWeight: "800", color: renk.murekkep900 },
  kucuk: { fontSize: 12, color: renk.murekkep500, lineHeight: 17 },
  metin: { fontSize: 14, color: renk.murekkep800, lineHeight: 21, marginTop: 4 },
  yanit: { backgroundColor: renk.beyaz, borderWidth: 1, borderColor: renk.murekkep100, borderRadius: kose.m, padding: bosluk.m },
  yanitEkip: { borderColor: renk.marka200, backgroundColor: renk.marka50 },
  ekBaslik: { fontSize: 14, fontWeight: "700", color: renk.murekkep900 },
  ek: { flexDirection: "row", alignItems: "center", gap: bosluk.s },
  onizleme: { width: 48, height: 48, borderRadius: kose.s, backgroundColor: renk.murekkep50 },
  ekAd: { fontSize: 13, fontWeight: "600", color: renk.murekkep800 }
});
