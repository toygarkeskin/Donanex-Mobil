import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { kose, renk } from "@/tema";

/*
 * Kısa bilgi mesajı (web'deki toast'ın karşılığı). Ekranın altında 3 saniye
 * görünüp kayboluyor; ekran okuyucuya "polite" olarak duyuruluyor.
 */
type Tur = "basari" | "hata" | "bilgi";
const Baglam = createContext<(mesaj: string, tur?: Tur) => void>(() => {});

export function MesajSaglayici({ children }: { children: ReactNode }) {
  const [mesaj, setMesaj] = useState<{ metin: string; tur: Tur } | null>(null);
  const [opaklik] = useState(() => new Animated.Value(0));
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alt = useSafeAreaInsets().bottom;

  const goster = useCallback(
    (metin: string, tur: Tur = "bilgi") => {
      if (zaman.current) clearTimeout(zaman.current);
      setMesaj({ metin, tur });
      Animated.timing(opaklik, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      zaman.current = setTimeout(() => {
        Animated.timing(opaklik, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMesaj(null));
      }, 3200);
    },
    [opaklik]
  );

  const ikon = mesaj?.tur === "basari" ? "checkmark-circle" : mesaj?.tur === "hata" ? "alert-circle" : "information-circle";
  const arka = mesaj?.tur === "hata" ? renk.kirmizi : mesaj?.tur === "basari" ? renk.yesil : renk.gece;

  return (
    <Baglam.Provider value={goster}>
      {children}
      {mesaj ? (
        <Animated.View pointerEvents="none" style={[st.kap, { bottom: alt + 72, opacity: opaklik }]}>
          <View style={[st.kutu, { backgroundColor: arka }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Ionicons name={ikon} size={18} color={renk.beyaz} />
            <Text style={st.yazi}>{mesaj.metin}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Baglam.Provider>
  );
}

export const useMesaj = () => useContext(Baglam);

const st = StyleSheet.create({
  kap: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  kutu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: kose.m,
    maxWidth: 480
  },
  yazi: { color: renk.beyaz, fontSize: 14, fontWeight: "500", flexShrink: 1 }
});
