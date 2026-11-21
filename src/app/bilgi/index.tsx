import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BILGI_ROTALARI, BILGI_SAYFALARI, ILETISIM } from "@/icerik/bilgiSayfalari";
import { Kart } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

/** Bilgilendirme sayfalarının listesi (web'de sayfa altındaki bağlantılar). */
export default function Bilgiler() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }}>
      <View style={st.grup}>
        {BILGI_ROTALARI.map((r) => {
          const sayfa = BILGI_SAYFALARI[r.anahtar];
          return (
            <Pressable
              key={r.anahtar}
              onPress={() => router.push(`/bilgi/${r.anahtar}`)}
              style={({ pressed }) => [st.satir, pressed && { backgroundColor: renk.murekkep50 }]}
              accessibilityRole="link"
            >
              <View style={{ flex: 1 }}>
                <Text style={st.baslik}>{sayfa.baslik}</Text>
                {sayfa.aciklama ? (
                  <Text style={st.alt} numberOfLines={1}>
                    {sayfa.aciklama}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={renk.murekkep300} />
            </Pressable>
          );
        })}
      </View>

      <Kart style={{ gap: 4 }}>
        <Text style={st.baslik}>İletişim</Text>
        <Text style={st.alt}>{ILETISIM.telefon}</Text>
        <Text style={st.alt}>{ILETISIM.eposta}</Text>
        <Text style={st.alt}>{ILETISIM.calismaSaatleri}</Text>
        <Text style={st.alt}>{ILETISIM.adres}</Text>
      </Kart>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  grup: { backgroundColor: renk.beyaz, borderRadius: kose.l, borderWidth: 1, borderColor: renk.murekkep100, overflow: "hidden" },
  satir: {
    flexDirection: "row",
    alignItems: "center",
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: renk.murekkep100
  },
  baslik: { fontSize: 15, fontWeight: "700", color: renk.murekkep900 },
  alt: { fontSize: 13, color: renk.murekkep500, lineHeight: 19 }
});
