import { forwardRef, type ComponentRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { bosluk, golge, kose, renk } from "@/tema";
import type { Ton } from "@/lib/bicim";

type ButonTuru = "birincil" | "ikincil" | "hayalet" | "tehlike";

export function Buton({
  baslik,
  tur = "birincil",
  yukleniyor,
  ikon,
  kucuk,
  style,
  disabled,
  ...rest
}: PressableProps & {
  baslik: string;
  tur?: ButonTuru;
  yukleniyor?: boolean;
  ikon?: keyof typeof Ionicons.glyphMap;
  kucuk?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const kapali = disabled || yukleniyor;
  const yaziRengi = tur === "birincil" || tur === "tehlike" ? renk.beyaz : tur === "ikincil" ? renk.murekkep800 : renk.marka600;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!kapali, busy: !!yukleniyor }}
      disabled={kapali}
      style={({ pressed }) => [
        s.buton,
        kucuk && s.butonKucuk,
        tur === "birincil" && { backgroundColor: renk.marka600 },
        tur === "tehlike" && { backgroundColor: renk.kirmizi },
        tur === "ikincil" && { backgroundColor: renk.beyaz, borderWidth: 1, borderColor: renk.murekkep200 },
        tur === "hayalet" && { backgroundColor: "transparent" },
        pressed && { opacity: 0.85 },
        kapali && { opacity: 0.5 },
        style
      ]}
      {...rest}
    >
      {yukleniyor ? (
        <ActivityIndicator color={yaziRengi} size="small" />
      ) : (
        <>
          {ikon ? <Ionicons name={ikon} size={kucuk ? 15 : 18} color={yaziRengi} /> : null}
          <Text style={[s.butonYazi, kucuk && { fontSize: 13 }, { color: yaziRengi }]}>{baslik}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Kart({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.kart, style]}>{children}</View>;
}

const TONLAR: Record<Ton, { arka: string; yazi: string }> = {
  iyi: { arka: renk.yesilAcik, yazi: renk.yesil },
  bilgi: { arka: renk.marka50, yazi: renk.marka700 },
  uyari: { arka: renk.amberAcik, yazi: "#92400e" },
  kotu: { arka: renk.kirmiziAcik, yazi: renk.kirmizi }
};

export function Rozet({ etiket, ton = "bilgi" }: { etiket: string; ton?: Ton }) {
  return (
    <View style={[s.rozet, { backgroundColor: TONLAR[ton].arka }]}>
      <Text style={[s.rozetYazi, { color: TONLAR[ton].yazi }]}>{etiket}</Text>
    </View>
  );
}

export function Uyari({ children, ton = "uyari" }: { children: ReactNode; ton?: Ton }) {
  return (
    <View style={[s.uyari, { backgroundColor: TONLAR[ton].arka, borderColor: TONLAR[ton].yazi + "33" }]}>
      <Text style={{ color: TONLAR[ton].yazi, fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export function BolumBasligi({ baslik, sag }: { baslik: string; sag?: ReactNode }) {
  return (
    <View style={s.bolumBaslik}>
      <Text style={s.bolumBaslikYazi} accessibilityRole="header">
        {baslik}
      </Text>
      {sag}
    </View>
  );
}

export function Bos({
  ikon = "cube-outline",
  baslik,
  aciklama,
  children
}: {
  ikon?: keyof typeof Ionicons.glyphMap;
  baslik: string;
  aciklama?: string;
  children?: ReactNode;
}) {
  return (
    <View style={s.bos}>
      <View style={s.bosIkon}>
        <Ionicons name={ikon} size={28} color={renk.marka600} />
      </View>
      <Text style={s.bosBaslik}>{baslik}</Text>
      {aciklama ? <Text style={s.bosAciklama}>{aciklama}</Text> : null}
      {children ? <View style={{ marginTop: bosluk.l, alignSelf: "stretch" }}>{children}</View> : null}
    </View>
  );
}

export function Yukleniyor({ yazi }: { yazi?: string }) {
  return (
    <View style={s.yukleniyor}>
      <ActivityIndicator color={renk.marka600} />
      {yazi ? <Text style={{ color: renk.murekkep500, marginTop: 8 }}>{yazi}</Text> : null}
    </View>
  );
}

export const Alan = forwardRef<ComponentRef<typeof TextInput>, TextInputProps & { etiket: string; ipucu?: string }>(function Alan(
  { etiket, ipucu, style, ...rest },
  ref
) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.etiket}>{etiket}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={renk.murekkep400}
        accessibilityLabel={etiket}
        style={[s.alan, rest.multiline && { minHeight: 96, textAlignVertical: "top" }, style]}
        {...rest}
      />
      {ipucu ? <Text style={s.ipucu}>{ipucu}</Text> : null}
    </View>
  );
});

export const s = StyleSheet.create({
  buton: {
    minHeight: 48,
    paddingHorizontal: bosluk.l,
    borderRadius: kose.m,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  butonKucuk: { minHeight: 36, paddingHorizontal: bosluk.m, borderRadius: kose.s },
  butonYazi: { fontSize: 15, fontWeight: "600" },
  kart: {
    backgroundColor: renk.beyaz,
    borderRadius: kose.l,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    padding: bosluk.l,
    ...golge
  },
  rozet: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: kose.tam },
  rozetYazi: { fontSize: 11, fontWeight: "700" },
  uyari: { borderWidth: 1, borderRadius: kose.m, padding: bosluk.m },
  bolumBaslik: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: bosluk.m,
    paddingHorizontal: bosluk.l
  },
  bolumBaslikYazi: { fontSize: 18, fontWeight: "800", color: renk.murekkep900 },
  bos: { alignItems: "center", padding: bosluk.xl, gap: 6 },
  bosIkon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: renk.marka50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  bosBaslik: { fontSize: 17, fontWeight: "700", color: renk.murekkep900, textAlign: "center" },
  bosAciklama: { fontSize: 14, color: renk.murekkep500, textAlign: "center", lineHeight: 20 },
  yukleniyor: { padding: bosluk.xxl, alignItems: "center", justifyContent: "center" },
  etiket: { fontSize: 13, fontWeight: "600", color: renk.murekkep700 },
  ipucu: { fontSize: 12, color: renk.murekkep500 },
  alan: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: renk.murekkep200,
    borderRadius: kose.m,
    paddingHorizontal: bosluk.m,
    paddingVertical: 10,
    fontSize: 16,
    color: renk.murekkep900,
    backgroundColor: renk.beyaz
  }
});
