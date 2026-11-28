import { useCallback, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { sunucu } from "@/lib/sunucu";
import { useOturum } from "@/state/Oturum";
import { Buton, Kart } from "@/components/Ui";
import { useMesaj } from "@/components/Mesaj";
import { buyukHarf } from "@/lib/bicim";
import { bosluk, kose, renk } from "@/tema";

type IkonAdi = keyof typeof Ionicons.glyphMap;

function Satir({ ikon, baslik, alt, rozet, onPress }: { ikon: IkonAdi; baslik: string; alt?: string; rozet?: number; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [st.satir, pressed && { backgroundColor: renk.murekkep50 }]} onPress={onPress} accessibilityRole="button">
      <View style={st.satirIkon}>
        <Ionicons name={ikon} size={20} color={renk.marka600} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.satirBaslik}>{baslik}</Text>
        {alt ? (
          <Text style={st.satirAlt} numberOfLines={1}>
            {alt}
          </Text>
        ) : null}
      </View>
      {rozet ? (
        <View style={st.rozet}>
          <Text style={st.rozetYazi}>{rozet > 99 ? "99+" : rozet}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={renk.murekkep300} />
    </Pressable>
  );
}

export default function Hesap() {
  const router = useRouter();
  const mesaj = useMesaj();
  const { kullanici, cikis, hazir } = useOturum();
  const [okunmamis, setOkunmamis] = useState(0);

  // Sekmeye her dönüldüğünde okunmamış sayısı tazeleniyor.
  useFocusEffect(
    useCallback(() => {
      if (!kullanici) return;
      api
        .get<{ unread: number }>("/me/notifications/unread-count")
        .then((r) => setOkunmamis(r.unread ?? 0))
        .catch(() => {});
    }, [kullanici])
  );

  function cikisSor() {
    const yap = async () => {
      await cikis();
      mesaj("Çıkış yapıldı.", "bilgi");
    };
    // Web önizlemesinde Alert düğmeleri yok; doğrudan çıkılıyor.
    if (Platform.OS === "web") return void yap();
    Alert.alert("Çıkış yap", "Hesabınızdan çıkmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış yap", style: "destructive", onPress: () => void yap() }
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }}>
      {kullanici ? (
        <Kart style={st.profil}>
          <View style={st.avatar}>
            <Text style={st.avatarYazi}>{buyukHarf(kullanici.fullName.slice(0, 1))}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.ad}>{kullanici.fullName}</Text>
            <Text style={st.eposta}>{kullanici.email}</Text>
          </View>
        </Kart>
      ) : (
        <Kart style={{ gap: bosluk.m }}>
          <Text style={st.ad}>{"Donanex’e hoş geldiniz"}</Text>
          <Text style={st.eposta}>Siparişlerinizi takip etmek, yorum yazmak ve soru sormak için giriş yapın.</Text>
          <Buton baslik="Giriş yap" ikon="log-in-outline" onPress={() => router.push("/giris")} disabled={!hazir} />
          <Buton baslik="Kayıt ol" tur="ikincil" onPress={() => router.push("/kayit")} disabled={!hazir} />
        </Kart>
      )}

      <View style={st.grup}>
        {kullanici ? (
          <>
            <Satir ikon="receipt-outline" baslik="Siparişlerim" onPress={() => router.push("/siparisler")} />
            <Satir ikon="notifications-outline" baslik="Bildirimler" rozet={okunmamis} onPress={() => router.push("/bildirimler")} />
            <Satir ikon="location-outline" baslik="Adreslerim" alt="Ödemede hazır gelir" onPress={() => router.push("/adresler")} />
            <Satir ikon="person-outline" baslik="Hesap bilgilerim" alt="Ad, telefon, parola" onPress={() => router.push("/profil")} />
            <Satir ikon="shield-checkmark-outline" baslik="Güvenlik" alt="Oturumlar, güvenlik puanı" onPress={() => router.push("/guvenlik")} />
            <Satir ikon="chatbubbles-outline" baslik="Destek taleplerim" onPress={() => router.push("/talepler")} />
            <Satir
              ikon="storefront-outline"
              baslik={kullanici.stores?.length ? "Mağazam" : "Mağaza aç"}
              alt={kullanici.stores?.length ? "Mağaza paneli web sitesinde" : "Donanex'te satış yapın"}
              onPress={() => router.push("/magaza-basvurusu")}
            />
          </>
        ) : null}
        <Satir ikon="business-outline" baslik="Mağazalar" onPress={() => router.push("/magazalar")} />
        <Satir ikon="search-outline" baslik="Sipariş takibi" alt="Üye olmadan verilen siparişler için" onPress={() => router.push("/siparis-takip")} />
        {kullanici ? null : <Satir ikon="help-buoy-outline" baslik="Destek" alt="Bize yazın" onPress={() => router.push("/destek")} />}
        <Satir ikon="information-circle-outline" baslik="Yardım ve bilgiler" alt="SSS, iade, KVKK, sözleşmeler" onPress={() => router.push("/bilgi")} />
        <Satir ikon="server-outline" baslik="Sunucu adresi" alt={sunucu()} onPress={() => router.push("/sunucu")} />
      </View>

      {kullanici ? <Buton baslik="Çıkış yap" tur="ikincil" ikon="log-out-outline" onPress={cikisSor} /> : null}

      <Text style={st.surum}>Donanex Mobil 1.0 · Mağaza ve yönetim panelleri web sitesinde.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  profil: { flexDirection: "row", alignItems: "center", gap: bosluk.m },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: renk.marka600, alignItems: "center", justifyContent: "center" },
  avatarYazi: { color: renk.beyaz, fontSize: 22, fontWeight: "800" },
  ad: { fontSize: 18, fontWeight: "800", color: renk.murekkep900 },
  eposta: { fontSize: 14, color: renk.murekkep500, lineHeight: 20 },
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
  satirIkon: { width: 36, height: 36, borderRadius: 10, backgroundColor: renk.marka50, alignItems: "center", justifyContent: "center" },
  satirBaslik: { fontSize: 15, fontWeight: "600", color: renk.murekkep900 },
  satirAlt: { fontSize: 12, color: renk.murekkep500 },
  rozet: { backgroundColor: renk.kirmizi, borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  rozetYazi: { color: renk.beyaz, fontSize: 11, fontWeight: "800" },
  surum: { textAlign: "center", fontSize: 12, color: renk.murekkep400 }
});
