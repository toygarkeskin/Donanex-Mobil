import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { sunucuYukle } from "@/lib/sunucu";
import { sepetKimligiYukle } from "@/lib/api";
import { OturumSaglayici } from "@/state/Oturum";
import { SepetSaglayici } from "@/state/Sepet";
import { MesajSaglayici } from "@/components/Mesaj";
import { Yukleniyor } from "@/components/Ui";
import { renk } from "@/tema";

/*
 * Kök düzen. Sunucu adresi ve misafir sepet kimliği diskten okunmadan hiçbir
 * istek atılmıyor; aksi halde ilk istek yanlış sunucuya ya da yeni bir boş
 * sepete giderdi.
 */
export default function KokDuzen() {
  const [basladi, setBasladi] = useState(false);

  useEffect(() => {
    Promise.all([sunucuYukle(), sepetKimligiYukle()]).finally(() => setBasladi(true));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {basladi ? (
        <MesajSaglayici>
          <OturumSaglayici>
            <SepetSaglayici>
              <Stack
                screenOptions={{
                  headerTransparent: false,
                  headerTintColor: renk.marka600,
                  headerTitleStyle: { color: renk.murekkep900, fontWeight: "700" },
                  headerBackTitle: "Geri",
                  contentStyle: { backgroundColor: renk.murekkep50 }
                }}
              >
                <Stack.Screen name="(sekmeler)" options={{ headerShown: false, title: "Donanex" }} />
                <Stack.Screen name="urun/[magaza]/[urun]" options={{ title: "Ürün" }} />
                <Stack.Screen name="magaza/[slug]" options={{ title: "Mağaza" }} />
                <Stack.Screen name="giris" options={{ title: "Giriş yap", presentation: "modal" }} />
                <Stack.Screen name="kayit" options={{ title: "Kayıt ol", presentation: "modal" }} />
                <Stack.Screen name="odeme/index" options={{ title: "Siparişi tamamla" }} />
                <Stack.Screen name="odeme/[siparis]" options={{ title: "Ödeme", headerBackVisible: false }} />
                <Stack.Screen name="siparisler/index" options={{ title: "Siparişlerim" }} />
                <Stack.Screen name="siparisler/[no]" options={{ title: "Sipariş" }} />
                <Stack.Screen name="bildirimler" options={{ title: "Bildirimler" }} />
                <Stack.Screen name="sunucu" options={{ title: "Sunucu adresi" }} />
                <Stack.Screen name="siparis-takip" options={{ title: "Sipariş takibi" }} />
                <Stack.Screen name="magazalar" options={{ title: "Mağazalar" }} />
                <Stack.Screen name="marka/[slug]" options={{ title: "Marka" }} />
                <Stack.Screen name="adresler" options={{ title: "Adreslerim" }} />
                <Stack.Screen name="profil" options={{ title: "Hesap bilgilerim" }} />
                <Stack.Screen name="guvenlik" options={{ title: "Güvenlik" }} />
                <Stack.Screen name="talepler/index" options={{ title: "Destek taleplerim" }} />
                <Stack.Screen name="talepler/[id]" options={{ title: "Destek talebi" }} />
                <Stack.Screen name="destek" options={{ title: "Destek" }} />
                <Stack.Screen name="parola-unuttum" options={{ title: "Parolamı unuttum" }} />
                <Stack.Screen name="magaza-basvurusu" options={{ title: "Mağaza aç" }} />
                <Stack.Screen name="bilgi/index" options={{ title: "Yardım ve bilgiler" }} />
                <Stack.Screen name="bilgi/[anahtar]" options={{ title: "Bilgi" }} />
              </Stack>
            </SepetSaglayici>
          </OturumSaglayici>
        </MesajSaglayici>
      ) : (
        <Yukleniyor />
      )}
    </SafeAreaProvider>
  );
}
