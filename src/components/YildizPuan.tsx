import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sayi } from "@/lib/bicim";
import { renk } from "@/tema";

/** Salt okunur yıldızlar; kesirli puan yarım yıldıza yuvarlanır. */
export function YildizPuan({ puan, boyut = 14 }: { puan: number; boyut?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }} accessible accessibilityLabel={`5 üzerinden ${sayi(puan)} puan`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const kalan = puan - i;
        const ad = kalan >= 0.75 ? "star" : kalan >= 0.25 ? "star-half" : "star-outline";
        return <Ionicons key={i} name={ad} size={boyut} color={kalan >= 0.25 ? renk.amber : renk.murekkep300} />;
      })}
    </View>
  );
}

/** Puan seçici: her yıldız ayrı düğme, ekran okuyucu "3 yıldız" der. */
export function YildizSecici({ deger, degisti }: { deger: number; degisti: (p: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }} accessibilityRole="radiogroup" accessibilityLabel="Puan">
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          onPress={() => degisti(i)}
          accessibilityRole="radio"
          accessibilityState={{ checked: deger === i }}
          accessibilityLabel={`${i} yıldız`}
          hitSlop={6}
        >
          <Ionicons name={i <= deger ? "star" : "star-outline"} size={32} color={i <= deger ? renk.amber : renk.murekkep300} />
        </Pressable>
      ))}
    </View>
  );
}
