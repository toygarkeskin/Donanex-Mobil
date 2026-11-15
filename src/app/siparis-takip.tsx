import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { api } from "@/lib/api";
import { Alan, Buton, Kart, Uyari } from "@/components/Ui";
import { SiparisDetay, type Siparis } from "@/components/SiparisDetay";
import { bosluk, renk } from "@/tema";

/** Üye olmadan verilen siparişi sipariş numarası + takip koduyla sorgular. */
export default function SiparisTakip() {
  const [numara, setNumara] = useState("");
  const [kod, setKod] = useState("");
  const [siparis, setSiparis] = useState<Siparis | null>(null);
  const [hata, setHata] = useState("");
  const [araniyor, setAraniyor] = useState(false);

  async function sorgula() {
    setHata("");
    setSiparis(null);
    setAraniyor(true);
    try {
      setSiparis(await api.post<Siparis>("/orders/track", { orderNumber: numara.trim().toUpperCase(), trackingCode: kod.trim() }));
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setAraniyor(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }} keyboardShouldPersistTaps="handled">
      <Kart style={{ gap: bosluk.m }}>
        <Text style={{ fontSize: 14, color: renk.murekkep600, lineHeight: 20 }}>
          Sipariş numarası ve sipariş verirken gösterilen takip koduyla siparişinizin durumunu görün.
        </Text>
        {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
        <Alan etiket="Sipariş numarası" value={numara} onChangeText={setNumara} autoCapitalize="characters" placeholder="PZ-2026-000123" />
        <Alan etiket="Takip kodu" value={kod} onChangeText={setKod} autoCapitalize="none" autoCorrect={false} />
        <Buton baslik="Sorgula" yukleniyor={araniyor} disabled={!numara || !kod} onPress={sorgula} />
      </Kart>
      {siparis ? <SiparisDetay siparis={siparis} /> : null}
    </ScrollView>
  );
}
