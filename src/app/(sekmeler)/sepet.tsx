import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { para, SEPET_SORUNU } from "@/lib/bicim";
import { resim } from "@/lib/sunucu";
import { useSepet, type SepetSatiri } from "@/state/Sepet";
import { useMesaj } from "@/components/Mesaj";
import { Bos, Buton, Kart, Yukleniyor } from "@/components/Ui";
import { OneriSeridi } from "@/components/OneriSeridi";
import { bosluk, kose, renk } from "@/tema";

export default function Sepet() {
  const router = useRouter();
  const sepet = useSepet();
  const mesaj = useMesaj();
  const [mesgul, setMesgul] = useState<string | null>(null);
  const [yenileniyor, setYenileniyor] = useState(false);

  async function islem(urunId: string, fn: () => Promise<void>) {
    setMesgul(urunId);
    try {
      await fn();
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setMesgul(null);
    }
  }

  const urunIdleri = sepet.items.map((i) => i.productId);

  return (
    <ScrollView
      contentContainerStyle={{ paddingVertical: bosluk.l, paddingBottom: bosluk.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={yenileniyor}
          onRefresh={async () => {
            setYenileniyor(true);
            await sepet.yukle();
            setYenileniyor(false);
          }}
          tintColor={renk.marka600}
        />
      }
    >
      {!sepet.yuklendi ? <Yukleniyor /> : null}

      {sepet.yuklendi && !sepet.items.length ? (
        <>
          <Bos ikon="cart-outline" baslik="Sepetiniz boş" aciklama="Ürünleri gezip sepetinize ekleyebilirsiniz. Üye olmanıza gerek yok.">
            <Buton baslik="Ürünlere git" onPress={() => router.push("/urunler")} />
          </Bos>
          <OneriSeridi baslik="Bunlara göz atabilirsiniz" urunIdleri={[]} />
        </>
      ) : null}

      {sepet.items.length ? (
        <>
          <View style={{ paddingHorizontal: bosluk.l, gap: bosluk.m }}>
            {sepet.items.map((satir) => (
              <Satir
                key={satir.productId}
                satir={satir}
                mesgul={mesgul === satir.productId}
                ac={() => satir.slug && satir.storeSlug && router.push(`/urun/${satir.storeSlug}/${satir.slug}`)}
                azalt={() => islem(satir.productId, () => sepet.adetDegistir(satir.productId, satir.quantity - 1))}
                artir={() => islem(satir.productId, () => sepet.adetDegistir(satir.productId, satir.quantity + 1))}
                cikar={() => islem(satir.productId, () => sepet.cikar(satir.productId))}
              />
            ))}

            <Kart style={{ gap: bosluk.s }}>
              <Text style={st.ozetBaslik}>Sipariş özeti</Text>
              <View style={st.ozetSatir}>
                <Text style={st.ozetEtiket}>Ara toplam ({sepet.itemCount} ürün)</Text>
                <Text style={st.ozetDeger}>{para(sepet.subtotal)}</Text>
              </View>
              <View style={st.ozetSatir}>
                <Text style={st.ozetEtiket}>Kargo</Text>
                <Text style={[st.ozetDeger, { color: renk.yesil }]}>Ücretsiz</Text>
              </View>
              <View style={[st.ozetSatir, st.toplam]}>
                <Text style={st.toplamEtiket}>Toplam</Text>
                <Text style={st.toplamDeger}>{para(sepet.subtotal)}</Text>
              </View>
              {sepet.hasIssues ? (
                <Text style={{ color: "#92400e", fontSize: 13 }}>Sepetteki bazı ürünlerde sorun var; önce onları düzeltin.</Text>
              ) : null}
              <Buton baslik="Siparişi tamamla" ikon="lock-closed" disabled={!sepet.canCheckout} onPress={() => router.push("/odeme")} />
              <Text style={st.not}>Üye olmadan da sipariş verebilirsiniz.</Text>
            </Kart>
          </View>
          <OneriSeridi baslik="Bunları da alabilirsiniz" urunIdleri={urunIdleri} />
        </>
      ) : null}
    </ScrollView>
  );
}

function Satir({
  satir,
  mesgul,
  ac,
  azalt,
  artir,
  cikar
}: {
  satir: SepetSatiri;
  mesgul: boolean;
  ac: () => void;
  azalt: () => void;
  artir: () => void;
  cikar: () => void;
}) {
  const sorunlu = !satir.available;
  return (
    <View style={[st.satir, sorunlu && { borderColor: renk.amber, backgroundColor: renk.amberAcik }]}>
      <Pressable onPress={ac} style={st.gorsel} accessibilityRole="link" accessibilityLabel={satir.name}>
        {satir.imageUrl ? <Image source={resim(satir.imageUrl)} style={{ flex: 1 }} contentFit="contain" /> : null}
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={st.ad} numberOfLines={2} onPress={ac}>
          {satir.name}
        </Text>
        {satir.storeName ? <Text style={st.magaza}>{satir.storeName}</Text> : null}
        {sorunlu ? <Text style={st.sorun}>{SEPET_SORUNU[satir.issue ?? ""] ?? "Bu ürün sipariş edilemiyor."}</Text> : null}
        <View style={st.altSatir}>
          {satir.available || satir.issue === "insufficient_stock" ? (
            <View style={st.adet}>
              <Pressable
                onPress={azalt}
                disabled={mesgul || satir.quantity <= 1}
                style={[st.adetDugme, (mesgul || satir.quantity <= 1) && { opacity: 0.4 }]}
                accessibilityRole="button"
                accessibilityLabel={`${satir.name} adedini azalt`}
              >
                <Ionicons name="remove" size={16} color={renk.murekkep800} />
              </Pressable>
              <Text style={st.adetYazi} accessibilityLabel={`Adet ${satir.quantity}`}>
                {satir.quantity}
              </Text>
              <Pressable
                onPress={artir}
                disabled={mesgul || satir.quantity >= satir.stock}
                style={[st.adetDugme, (mesgul || satir.quantity >= satir.stock) && { opacity: 0.4 }]}
                accessibilityRole="button"
                accessibilityLabel={`${satir.name} adedini artır`}
              >
                <Ionicons name="add" size={16} color={renk.murekkep800} />
              </Pressable>
            </View>
          ) : (
            <View />
          )}
          <Text style={st.tutar}>{para(satir.lineTotal)}</Text>
        </View>
      </View>
      <Pressable onPress={cikar} disabled={mesgul} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${satir.name} sepetten kaldır`}>
        <Ionicons name="trash-outline" size={20} color={renk.murekkep400} />
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  satir: {
    flexDirection: "row",
    gap: bosluk.m,
    backgroundColor: renk.beyaz,
    borderRadius: kose.l,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.m,
    alignItems: "flex-start"
  },
  gorsel: { width: 76, height: 76, borderRadius: kose.m, backgroundColor: renk.beyaz, padding: 4 },
  ad: { fontSize: 14, fontWeight: "600", color: renk.murekkep900, lineHeight: 19 },
  magaza: { fontSize: 12, color: renk.murekkep500 },
  sorun: { fontSize: 12, color: "#92400e", fontWeight: "600" },
  altSatir: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  adet: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: renk.murekkep200, borderRadius: kose.s },
  adetDugme: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  adetYazi: { minWidth: 28, textAlign: "center", fontWeight: "700", color: renk.murekkep900 },
  tutar: { fontSize: 15, fontWeight: "800", color: renk.murekkep900 },
  ozetBaslik: { fontSize: 16, fontWeight: "800", color: renk.murekkep900 },
  ozetSatir: { flexDirection: "row", justifyContent: "space-between" },
  ozetEtiket: { color: renk.murekkep600, fontSize: 14 },
  ozetDeger: { color: renk.murekkep900, fontSize: 14, fontWeight: "600" },
  toplam: { borderTopWidth: 1, borderTopColor: renk.murekkep100, paddingTop: bosluk.s, marginBottom: bosluk.s },
  toplamEtiket: { fontSize: 16, fontWeight: "700", color: renk.murekkep900 },
  toplamDeger: { fontSize: 18, fontWeight: "800", color: renk.marka700 },
  not: { fontSize: 12, color: renk.murekkep500, textAlign: "center" }
});
