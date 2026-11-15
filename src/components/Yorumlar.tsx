import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { tarih } from "@/lib/bicim";
import { resim } from "@/lib/sunucu";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "./Mesaj";
import { Alan, Buton, Kart } from "./Ui";
import { YildizPuan, YildizSecici } from "./YildizPuan";
import { bosluk, kose, renk } from "@/tema";

interface Yorum {
  id: string;
  rating: number;
  body: string;
  authorName: string;
  verifiedPurchase: boolean;
  createdAt: string;
  photos?: { id: string; imageUrl: string }[];
}
export interface YorumOzeti {
  count: number;
  average: number;
  distribution: number[];
  verifiedCount: number;
}
interface Sayfa {
  items: Yorum[];
  total: number;
  page: number;
  pages: number;
  summary: YorumOzeti | null;
}

const EN_FAZLA_FOTO = 3;
const EN_FAZLA_BAYT = 2 * 1024 * 1024;
const TURLER = ["image/png", "image/jpeg", "image/webp"];

/**
 * Yorumlar: özet, liste ve yorum formu. Fotoğraflar yorum yazıldıktan SONRA
 * tek tek yükleniyor (sunucu yalnızca yorumun sahibine izin veriyor).
 */
export function Yorumlar({ urunId, ozetGeldi }: { urunId: string; ozetGeldi?: (o: YorumOzeti | null) => void }) {
  const router = useRouter();
  const { kullanici } = useOturum();
  const mesaj = useMesaj();
  const [sayfa, setSayfa] = useState<Sayfa | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [puan, setPuan] = useState(0);
  const [metin, setMetin] = useState("");
  const [fotolar, setFotolar] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(
    async (no = 1) => {
      try {
        const yeni = await api.get<Sayfa>(`/urunler/${urunId}/yorumlar?page=${no}&pageSize=5`);
        setSayfa((onceki) => (no === 1 || !onceki ? yeni : { ...yeni, items: [...onceki.items, ...yeni.items] }));
        ozetGeldi?.(yeni.summary);
      } catch {
        setSayfa({ items: [], total: 0, page: 1, pages: 1, summary: null });
      }
    },
    [urunId, ozetGeldi]
  );

  useEffect(() => {
    void yukle(1);
  }, [yukle]);

  async function fotoSec() {
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: EN_FAZLA_FOTO - fotolar.length,
      quality: 0.8
    });
    if (sonuc.canceled) return;
    const uygun: ImagePicker.ImagePickerAsset[] = [];
    for (const f of sonuc.assets) {
      const tur = f.mimeType ?? "image/jpeg";
      if (!TURLER.includes(tur)) {
        mesaj("Yalnızca PNG, JPEG ve WebP fotoğraf eklenebilir.", "hata");
        continue;
      }
      if (f.fileSize && f.fileSize > EN_FAZLA_BAYT) {
        mesaj("Fotoğraf en fazla 2 MB olabilir.", "hata");
        continue;
      }
      uygun.push(f);
    }
    setFotolar([...fotolar, ...uygun].slice(0, EN_FAZLA_FOTO));
  }

  async function gonder() {
    if (!puan) return mesaj("Lütfen bir puan seçin.", "hata");
    if (metin.trim().length < 10) return mesaj("Yorum en az 10 karakter olmalı.", "hata");
    setGonderiliyor(true);
    try {
      const yorum = await api.post<{ id: string; created?: boolean }>(`/urunler/${urunId}/yorumlar`, { rating: puan, body: metin });
      let eklenemeyen = 0;
      for (const f of fotolar) {
        try {
          const blob = await (await fetch(f.uri)).blob();
          await api(`/urunler/${urunId}/yorumlar/${yorum.id}/fotograflar`, {
            method: "POST",
            ham: blob,
            turu: f.mimeType ?? "image/jpeg"
          });
        } catch {
          eklenemeyen++;
        }
      }
      mesaj(yorum.created === false ? "Yorumunuz güncellendi." : "Yorumunuz yayınlandı. Teşekkürler!", "basari");
      if (eklenemeyen) mesaj(`${eklenemeyen} fotoğraf eklenemedi.`, "hata");
      setFormAcik(false);
      setPuan(0);
      setMetin("");
      setFotolar([]);
      await yukle(1);
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setGonderiliyor(false);
    }
  }

  const ozet = sayfa?.summary;
  return (
    <View style={{ gap: bosluk.m }}>
      <View style={st.baslikSatir}>
        <Text style={st.baslik} accessibilityRole="header">
          Değerlendirmeler {sayfa?.total ? `(${sayfa.total})` : ""}
        </Text>
        {kullanici && !formAcik ? <Buton kucuk tur="ikincil" baslik="Yorum yaz" ikon="create-outline" onPress={() => setFormAcik(true)} /> : null}
        {!kullanici ? <Buton kucuk tur="ikincil" baslik="Yorum için giriş yap" onPress={() => router.push("/giris")} /> : null}
      </View>

      {ozet?.count ? (
        <Kart style={st.ozet}>
          <View style={{ alignItems: "center", paddingRight: bosluk.m }}>
            <Text style={st.ortalama}>{ozet.average.toLocaleString("tr-TR")}</Text>
            <YildizPuan puan={ozet.average} boyut={16} />
            <Text style={st.kucuk}>{ozet.count} değerlendirme</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            {ozet.distribution.map((adet, i) => (
              <View key={i} style={st.dagilim}>
                <Text style={st.kucuk}>{5 - i}★</Text>
                <View style={st.cubuk}>
                  <View style={[st.cubukDolu, { width: `${ozet.count ? Math.round((adet / ozet.count) * 100) : 0}%` }]} />
                </View>
                <Text style={[st.kucuk, { width: 22, textAlign: "right" }]}>{adet}</Text>
              </View>
            ))}
          </View>
        </Kart>
      ) : null}

      {formAcik ? (
        <Kart style={{ gap: bosluk.m }}>
          <Text style={st.etiket}>Puanınız</Text>
          <YildizSecici deger={puan} degisti={setPuan} />
          <Alan
            etiket="Yorumunuz"
            value={metin}
            onChangeText={setMetin}
            multiline
            maxLength={2000}
            placeholder="Ürünü nasıl buldunuz? Neyi beğendiniz, neyi beğenmediniz?"
            ipucu={`En az 10 karakter. Adınız "Ayşe Y." biçiminde kısaltılarak görünür.`}
          />
          <Text style={st.etiket}>Fotoğraflar (isteğe bağlı, en fazla 3)</Text>
          <View style={st.fotolar}>
            {fotolar.map((f, i) => (
              <View key={f.uri} style={st.foto}>
                <Image source={f.uri} style={{ flex: 1 }} contentFit="cover" />
                <Pressable
                  style={st.fotoSil}
                  onPress={() => setFotolar(fotolar.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel="Fotoğrafı çıkar"
                  hitSlop={6}
                >
                  <Ionicons name="close" size={14} color={renk.beyaz} />
                </Pressable>
              </View>
            ))}
            {fotolar.length < EN_FAZLA_FOTO ? (
              <Pressable style={[st.foto, st.fotoEkle]} onPress={fotoSec} accessibilityRole="button" accessibilityLabel="Fotoğraf ekle">
                <Ionicons name="camera-outline" size={22} color={renk.murekkep500} />
                <Text style={st.kucuk}>Ekle</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", gap: bosluk.s }}>
            <Buton baslik="Yorumu gönder" yukleniyor={gonderiliyor} onPress={gonder} style={{ flex: 1 }} />
            <Buton baslik="Vazgeç" tur="hayalet" onPress={() => setFormAcik(false)} />
          </View>
        </Kart>
      ) : null}

      {sayfa && !sayfa.items.length ? <Text style={st.bosYazi}>Bu ürün için henüz yorum yok. İlk yorumu siz yazın.</Text> : null}

      {sayfa?.items.map((y) => (
        <Kart key={y.id} style={{ gap: 6 }}>
          <View style={st.yorumUst}>
            <YildizPuan puan={y.rating} />
            <Text style={st.yazar}>{y.authorName}</Text>
            {y.verifiedPurchase ? (
              <View style={st.rozet}>
                <Ionicons name="checkmark-circle" size={12} color={renk.yesil} />
                <Text style={st.rozetYazi}>Satın aldı</Text>
              </View>
            ) : null}
          </View>
          <Text style={st.govde}>{y.body}</Text>
          {y.photos?.length ? (
            <View style={st.fotolar}>
              {y.photos.map((f) => (
                <Image key={f.id} source={resim(f.imageUrl)} style={st.foto} contentFit="cover" accessibilityLabel={`${y.authorName} kullanıcısının fotoğrafı`} />
              ))}
            </View>
          ) : null}
          <Text style={st.kucuk}>{tarih(y.createdAt, false)}</Text>
        </Kart>
      ))}

      {sayfa && sayfa.page < sayfa.pages ? (
        <Buton tur="ikincil" baslik={`Daha fazla yorum (${sayfa.total - sayfa.items.length})`} onPress={() => yukle(sayfa.page + 1)} />
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  baslikSatir: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  baslik: { fontSize: 18, fontWeight: "800", color: renk.murekkep900, flexShrink: 1 },
  ozet: { flexDirection: "row", alignItems: "center" },
  ortalama: { fontSize: 34, fontWeight: "800", color: renk.murekkep900 },
  kucuk: { fontSize: 12, color: renk.murekkep500 },
  dagilim: { flexDirection: "row", alignItems: "center", gap: 6 },
  cubuk: { flex: 1, height: 6, borderRadius: 3, backgroundColor: renk.murekkep100, overflow: "hidden" },
  cubukDolu: { height: 6, borderRadius: 3, backgroundColor: renk.amber },
  etiket: { fontSize: 13, fontWeight: "600", color: renk.murekkep700 },
  fotolar: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  foto: { width: 76, height: 76, borderRadius: kose.s, overflow: "hidden", backgroundColor: renk.murekkep100 },
  fotoEkle: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: renk.murekkep300,
    backgroundColor: renk.beyaz,
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  fotoSil: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(15,23,41,0.7)",
    alignItems: "center",
    justifyContent: "center"
  },
  bosYazi: { color: renk.murekkep500, fontSize: 14 },
  yorumUst: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  yazar: { fontWeight: "700", color: renk.murekkep800, fontSize: 14 },
  rozet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: renk.yesilAcik,
    borderRadius: kose.tam,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  rozetYazi: { fontSize: 11, color: renk.yesil, fontWeight: "700" },
  govde: { fontSize: 14, color: renk.murekkep700, lineHeight: 20 }
});
