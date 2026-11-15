import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { sunucu, sunucuDegistir, temizle, varsayilanSunucu } from "@/lib/sunucu";
import { useMesaj } from "@/components/Mesaj";
import { useOturum } from "@/state/Oturum";
import { useSepet } from "@/state/Sepet";
import { sepetKimligiSil } from "@/lib/api";
import { Alan, Buton, Kart, Uyari } from "@/components/Ui";
import { bosluk, renk } from "@/tema";

/**
 * Hangi Donanex sunucusuna bağlanılacağı. Telefonda en kolayı tünel adresi
 * (node scripts/tunel.js'in yazdığı https://….trycloudflare.com); aynı Wi-Fi
 * ağındaysa bilgisayarın adresi de olur (http://192.168.x.x:8090).
 */
export default function SunucuAyari() {
  const router = useRouter();
  const mesaj = useMesaj();
  const { kullanici, cikis } = useOturum();
  const sepet = useSepet();
  const [adres, setAdres] = useState(sunucu());
  const [deneniyor, setDeneniyor] = useState(false);
  const [hata, setHata] = useState("");

  async function kaydet(yeni: string | null) {
    setHata("");
    setDeneniyor(true);
    try {
      const hedef = yeni ? temizle(yeni) : varsayilanSunucu();
      if (!/^https?:\/\/[^\s/]+/i.test(hedef)) throw new Error("Adres http:// ya da https:// ile başlamalı.");
      // Kaydetmeden önce gerçekten bir Donanex sunucusu mu, bakılıyor.
      const yanit = await fetch(`${hedef}/api/health`).catch(() => null);
      if (!yanit || !yanit.ok) throw new Error(`${hedef} adresinde Donanex sunucusu yanıt vermedi.`);
      // Jetonlar ve misafir sepeti eski sunucuya ait; yenisinde geçmez.
      if (kullanici) await cikis();
      await sepetKimligiSil();
      await sunucuDegistir(yeni);
      await sepet.yukle();
      mesaj("Sunucu adresi kaydedildi. Uygulama yeniden yükleniyor…", "basari");
      router.replace("/");
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setDeneniyor(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }} keyboardShouldPersistTaps="handled">
      <Kart style={{ gap: bosluk.m }}>
        <Text style={{ fontSize: 14, color: renk.murekkep600, lineHeight: 20 }}>
          {"Bilgisayarda tünel açıkken (node scripts/tunel.js) verdiği"} https adresini buraya yazın. Aynı Wi-Fi ağındaysanız bilgisayarın yerel adresi de
          çalışır.
        </Text>
        {hata ? <Uyari ton="kotu">{hata}</Uyari> : null}
        <Alan
          etiket="Sunucu adresi"
          value={adres}
          onChangeText={setAdres}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://….trycloudflare.com"
        />
        <Buton baslik="Dene ve kaydet" yukleniyor={deneniyor} onPress={() => kaydet(adres)} />
        <Buton baslik={`Varsayılana dön (${varsayilanSunucu()})`} tur="hayalet" disabled={deneniyor} onPress={() => kaydet(null)} />
      </Kart>
    </ScrollView>
  );
}
