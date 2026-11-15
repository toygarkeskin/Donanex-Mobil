import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView } from "react-native";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Bos, Buton, Yukleniyor } from "@/components/Ui";
import { SiparisDetay, type Siparis } from "@/components/SiparisDetay";
import { bosluk } from "@/tema";

export default function SiparisSayfasi() {
  const { no } = useLocalSearchParams<{ no: string }>();
  const router = useRouter();
  const mesaj = useMesaj();
  const { kullanici, hazir } = useOturum();
  const [siparis, setSiparis] = useState<Siparis | null>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "yok">("yukleniyor");
  const [iptalEdiliyor, setIptalEdiliyor] = useState(false);

  /*
   * Oturum diskten geri yüklenmeden istek atılırsa 401 alıp "bulunamadı"
   * diyordu (bağlantıyla / bildirimden doğrudan açılınca). Önce oturum.
   */
  useEffect(() => {
    if (!kullanici) return;
    api
      .get<Siparis>(`/me/orders/${no}`)
      .then((s) => {
        setSiparis(s);
        setDurum("hazir");
      })
      .catch(() => setDurum("yok"));
  }, [no, kullanici]);

  async function iptal() {
    if (!siparis) return;
    setIptalEdiliyor(true);
    try {
      await api.post(`/me/orders/${siparis.id}/cancel`);
      setSiparis(await api.get<Siparis>(`/me/orders/${no}`));
      mesaj("Sipariş iptal edildi, stok iade edildi.", "basari");
    } catch (e: any) {
      mesaj(e.message, "hata");
    } finally {
      setIptalEdiliyor(false);
    }
  }

  function iptalSor() {
    if (Platform.OS === "web") return void iptal();
    Alert.alert("Siparişi iptal et", `${siparis?.orderNumber} numaralı sipariş iptal edilecek. Bu işlem geri alınamaz.`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "İptal et", style: "destructive", onPress: () => void iptal() }
    ]);
  }

  if (hazir && !kullanici) return <Redirect href="/giris" />;
  if (durum === "yukleniyor") return <Yukleniyor />;
  if (durum === "yok" || !siparis)
    return (
      <Bos ikon="receipt-outline" baslik="Sipariş bulunamadı">
        <Buton baslik="Siparişlerim" onPress={() => router.replace("/siparisler")} />
      </Bos>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.m }}>
      <Stack.Screen options={{ title: siparis.orderNumber }} />
      <SiparisDetay siparis={siparis} />
      {siparis.status === "pending_payment" ? (
        <>
          <Buton baslik="Ödemeye geç" onPress={() => router.push(`/odeme/${siparis.id}`)} />
          <Buton baslik="Siparişi iptal et" tur="tehlike" yukleniyor={iptalEdiliyor} onPress={iptalSor} />
        </>
      ) : null}
    </ScrollView>
  );
}
