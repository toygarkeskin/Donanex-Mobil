import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSepet } from "@/state/Sepet";
import { renk } from "@/tema";

type IkonAdi = keyof typeof Ionicons.glyphMap;
function SekmeIkonu({ dolu, bos, color, focused, size }: { dolu: IkonAdi; bos: IkonAdi; color: unknown; focused: boolean; size: number }) {
  return <Ionicons name={focused ? dolu : bos} color={String(color)} size={size} />;
}
const ikon = (dolu: IkonAdi, bos: IkonAdi) =>
  function Ikon(p: { color: unknown; focused: boolean; size: number }) {
    return <SekmeIkonu dolu={dolu} bos={bos} {...p} />;
  };

export default function SekmeDuzeni() {
  const sepet = useSepet();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: renk.marka600,
        tabBarInactiveTintColor: renk.murekkep400,
        headerTitleStyle: { color: renk.murekkep900, fontWeight: "800" },
        sceneStyle: { backgroundColor: renk.murekkep50 }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Ana sayfa", headerShown: false, tabBarIcon: ikon("home", "home-outline") }} />
      <Tabs.Screen name="urunler" options={{ title: "Ürünler", tabBarIcon: ikon("grid", "grid-outline") }} />
      <Tabs.Screen
        name="sepet"
        options={{
          title: "Sepetim",
          tabBarIcon: ikon("cart", "cart-outline"),
          tabBarBadge: sepet.itemCount ? (sepet.itemCount > 99 ? "99+" : sepet.itemCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: renk.marka600 }
        }}
      />
      <Tabs.Screen name="hesap" options={{ title: "Hesabım", tabBarIcon: ikon("person", "person-outline") }} />
    </Tabs>
  );
}
