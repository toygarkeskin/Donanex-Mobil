import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { BILGI_SAYFALARI } from "@/icerik/bilgiSayfalari";
import { Bos, Uyari } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

/** Tek bilgilendirme sayfası; metin web'dekiyle aynı kaynaktan (bkz. icerik/bilgiSayfalari). */
export default function BilgiSayfasi() {
  const { anahtar } = useLocalSearchParams<{ anahtar: string }>();
  const sayfa = BILGI_SAYFALARI[anahtar];
  if (!sayfa) return <Bos ikon="information-circle-outline" baslik="Sayfa bulunamadı" />;

  return (
    <>
      <Stack.Screen options={{ title: sayfa.baslik }} />
      <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }}>
        <Text style={st.baslik} accessibilityRole="header">
          {sayfa.baslik}
        </Text>
        {sayfa.ornekMetin ? (
          <Uyari>Bu metin örnektir: Donanex bir okul/demo projesi; burası gerçek bir hukuk metni değildir.</Uyari>
        ) : null}
        {sayfa.bolumler.map((b, i) => (
          <View key={i} style={{ gap: 6 }}>
            {b.baslik ? <Text style={st.bolum}>{b.baslik}</Text> : null}
            {(b.paragraflar ?? []).map((p, j) => (
              <Text key={j} style={st.paragraf}>
                {p}
              </Text>
            ))}
            {(b.liste ?? []).map((m, k) => (
              <View key={k} style={{ flexDirection: "row", gap: 8 }}>
                <Text style={st.paragraf}>•</Text>
                <Text style={[st.paragraf, { flex: 1 }]}>{m}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const st = StyleSheet.create({
  baslik: { fontSize: 22, fontWeight: "800", color: renk.murekkep900 },
  bolum: { fontSize: 16, fontWeight: "800", color: renk.murekkep900 },
  paragraf: { fontSize: 14, color: renk.murekkep700, lineHeight: 21 }
});
