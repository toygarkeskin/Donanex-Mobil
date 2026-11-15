import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { api, sorgu } from "@/lib/api";
import { BolumBasligi } from "./Ui";
import { UrunKart, type Urun } from "./UrunKart";
import { bosluk } from "@/tema";

/*
 * "Bunları da sepete ekleyebilirsiniz" şeridi. Sunucu tamamlayıcı
 * kategorilerden öneriyor (mouse için klavye/mousepad/kulaklık, başka mouse
 * değil). Şerit yatay kaydırılıyor; sitede kaç uygun ürün varsa o kadar.
 */
export function OneriSeridi({ baslik, urunIdleri, adet = 30 }: { baslik: string; urunIdleri: string[]; adet?: number }) {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const anahtar = [...urunIdleri].sort().join(",");

  useEffect(() => {
    let iptal = false;
    api
      // Sunucu "urun" parametresini tekrarlı bekliyor: ?urun=a&urun=b
      .get<{ items: Urun[] }>(
        `/oneriler${sorgu({ adet })}${anahtar ? anahtar.split(",").map((id) => `&urun=${id}`).join("") : ""}`
      )
      .then((r) => !iptal && setUrunler(r.items ?? []))
      .catch(() => !iptal && setUrunler([]));
    return () => {
      iptal = true;
    };
  }, [anahtar, adet]);

  if (!urunler.length) return null;
  return (
    <View style={{ marginTop: bosluk.xl }}>
      <BolumBasligi baslik={baslik} />
      <FlatList
        horizontal
        data={urunler}
        keyExtractor={(u) => u.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: bosluk.l, gap: bosluk.m }}
        renderItem={({ item }) => <UrunKart urun={item} genislik={156} />}
        accessibilityLabel={baslik}
      />
    </View>
  );
}
