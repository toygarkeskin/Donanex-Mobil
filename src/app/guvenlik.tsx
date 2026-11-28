import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { tarih } from "@/lib/bicim";
import { useOturum } from "@/state/Oturum";
import { useMesaj } from "@/components/Mesaj";
import { Buton, Kart, Yukleniyor } from "@/components/Ui";
import { bosluk, kose, renk } from "@/tema";

interface Oturum {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  clients: string[];
  current: boolean;
}
interface Bakis {
  score: number;
  level: "iyi" | "orta" | "zayif";
  checks: { key: string; label: string; passed: boolean; advice: string }[];
  sessions: Oturum[];
  passkeyCount: number;
  trustedDeviceCount: number;
  events: { id: string; action: string; createdAt: string; method: string | null; ip: string | null }[];
}

const OLAY: Record<string, string> = {
  "user.signed_in": "Giriş yapıldı",
  "user.password_changed": "Parola değiştirildi",
  "user.password_reset": "Parola sıfırlandı",
  "user.login_code_locked": "Giriş kodu kilitlendi",
  "user.passkey_added": "Passkey eklendi",
  "user.passkey_removed": "Passkey silindi",
  "user.passkey_renamed": "Passkey adlandırıldı",
  "user.passkey_failed": "Başarısız passkey denemesi",
  "user.session_revoked": "Bir oturum kapatıldı",
  "user.other_sessions_revoked": "Diğer oturumlar kapatıldı",
  "user.trusted_devices_forgotten": "Hatırlanan cihazlar unutuldu"
};

function cihaz(o: { userAgent: string | null; clients?: string[] }) {
  const s = o.userAgent ?? "";
  if (o.clients?.includes("donanex-mobil")) return "Donanex Mobil";
  const sistem = /iPhone|iPad/.test(s) ? "iPhone/iPad" : /Android/.test(s) ? "Android" : /Mac OS X/.test(s) ? "Mac" : /Windows/.test(s) ? "Windows" : "";
  const tarayici = /Edg\//.test(s) ? "Edge" : /Chrome\//.test(s) ? "Chrome" : /Firefox\//.test(s) ? "Firefox" : /Safari\//.test(s) ? "Safari" : "";
  return [sistem, tarayici].filter(Boolean).join(" · ") || "Bilinmeyen cihaz";
}

/** Onay: telefonda sistem penceresi, web önizlemesinde tarayıcı onayı. */
function sor(baslik: string, mesaj: string, eylem: string, yap: () => void) {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(`${baslik}\n${mesaj}`)) yap();
    return;
  }
  Alert.alert(baslik, mesaj, [
    { text: "Vazgeç", style: "cancel" },
    { text: eylem, style: "destructive", onPress: yap }
  ]);
}

/**
 * Güvenlik merkezi (web'deki Hesabım > Güvenlik). Passkey ekleme web'de:
 * Expo Go passkey desteklemiyor (yerel modül ve alan adı ilişkilendirmesi
 * gerekiyor); burada sayısı gösteriliyor.
 */
export default function Guvenlik() {
  const { kullanici, hazir } = useOturum();
  const mesaj = useMesaj();
  const [veri, setVeri] = useState<Bakis | null>(null);
  const [yenileniyor, setYenileniyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      setVeri(await api.get<Bakis>("/me/security"));
    } catch (e: any) {
      mesaj(e.message, "hata");
    }
  }, [mesaj]);

  useEffect(() => {
    if (kullanici) void yukle();
  }, [kullanici, yukle]);

  if (hazir && !kullanici) return <Redirect href="/giris" />;
  if (!veri) return <Yukleniyor />;

  const seviyeRengi = veri.level === "iyi" ? renk.yesil : veri.level === "orta" ? "#b45309" : renk.kirmizi;

  const kapat = (o: Oturum) =>
    sor("Oturum kapatılsın mı?", `${cihaz(o)} bir sonraki işleminde çıkış yapmış olacak.`, "Kapat", async () => {
      try {
        await api.delete(`/me/sessions/${o.id}`);
        mesaj("Oturum kapatıldı.", "basari");
        await yukle();
      } catch (e: any) {
        mesaj(e.message, "hata");
      }
    });

  const digerleri = () =>
    sor("Diğer oturumlar kapatılsın mı?", "Bu telefon dışındaki bütün oturumlar kapanır.", "Hepsini kapat", async () => {
      try {
        const r = await api.post<{ revoked: number }>("/me/sessions/revoke-others", {});
        mesaj(r.revoked ? `${r.revoked} oturum kapatıldı.` : "Kapatılacak başka oturum yok.", "basari");
        await yukle();
      } catch (e: any) {
        mesaj(e.message, "hata");
      }
    });

  const unut = async () => {
    try {
      await api.delete("/me/trusted-devices");
      mesaj("Hatırlanan cihazlar unutuldu.", "basari");
      await yukle();
    } catch (e: any) {
      mesaj(e.message, "hata");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: bosluk.l, gap: bosluk.l }}
      refreshControl={
        <RefreshControl
          refreshing={yenileniyor}
          onRefresh={async () => {
            setYenileniyor(true);
            await yukle();
            setYenileniyor(false);
          }}
          tintColor={renk.marka600}
        />
      }
    >
      <Kart style={{ gap: bosluk.s }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.m }}>
          <View style={[st.puan, { borderColor: seviyeRengi }]} accessible accessibilityLabel={`Güvenlik puanı ${veri.score} / 100`}>
            <Text style={st.puanYazi}>{veri.score}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.baslik}>Güvenlik puanı</Text>
            <Text style={{ color: seviyeRengi, fontWeight: "700" }}>{veri.level === "iyi" ? "İyi" : veri.level === "orta" ? "Orta" : "Zayıf"}</Text>
          </View>
        </View>
        {veri.checks.map((c) => (
          <View key={c.key} style={{ flexDirection: "row", gap: 8 }}>
            <Ionicons name={c.passed ? "checkmark-circle" : "alert-circle"} size={18} color={c.passed ? renk.yesil : "#b45309"} />
            <Text style={[st.metin, { flex: 1 }]}>{c.passed ? c.label : c.advice}</Text>
          </View>
        ))}
      </Kart>

      <Kart style={{ gap: bosluk.s }}>
        <Text style={st.baslik}>Açık oturumlar</Text>
        {veri.sessions.map((o) => (
          <View key={o.id} style={st.oturum}>
            <Ionicons name={o.clients.includes("donanex-mobil") ? "phone-portrait-outline" : "desktop-outline"} size={20} color={renk.marka600} />
            <View style={{ flex: 1 }}>
              <Text style={st.oturumAd}>
                {cihaz(o)}
                {o.current ? "  · Bu cihaz" : ""}
              </Text>
              <Text style={st.kucuk}>
                {o.ip ?? "IP yok"} · Son etkinlik {tarih(o.lastActiveAt)}
              </Text>
            </View>
            {!o.current ? <Buton baslik="Kapat" tur="hayalet" kucuk onPress={() => kapat(o)} /> : null}
          </View>
        ))}
        {veri.sessions.length > 1 ? <Buton baslik="Diğerlerinin hepsini kapat" tur="ikincil" onPress={digerleri} /> : null}
      </Kart>

      <Kart style={{ gap: 6 }}>
        <Text style={st.baslik}>Giriş yöntemleri</Text>
        <Text style={st.metin}>
          {veri.passkeyCount} passkey kayıtlı. Passkey eklemek ve yönetmek web sitesinde: Hesabım › Güvenlik.
        </Text>
        <Text style={st.metin}>{veri.trustedDeviceCount} hatırlanan cihazda giriş kodu sorulmuyor.</Text>
        {veri.trustedDeviceCount ? <Buton baslik="Hatırlanan cihazları unut" tur="ikincil" kucuk onPress={unut} /> : null}
      </Kart>

      <Kart style={{ gap: bosluk.s }}>
        <Text style={st.baslik}>Son güvenlik olayları</Text>
        {veri.events.length === 0 ? <Text style={st.kucuk}>Henüz kayıt yok.</Text> : null}
        {veri.events.map((e) => (
          <View key={e.id}>
            <Text style={st.metin}>{OLAY[e.action] ?? e.action}</Text>
            <Text style={st.kucuk}>
              {tarih(e.createdAt)} · {e.ip ?? "IP yok"}
            </Text>
          </View>
        ))}
      </Kart>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  puan: { width: 64, height: 64, borderRadius: 32, borderWidth: 5, alignItems: "center", justifyContent: "center" },
  puanYazi: { fontSize: 20, fontWeight: "800", color: renk.murekkep900 },
  baslik: { fontSize: 16, fontWeight: "800", color: renk.murekkep900 },
  metin: { fontSize: 14, color: renk.murekkep700, lineHeight: 20 },
  kucuk: { fontSize: 12, color: renk.murekkep500 },
  oturum: {
    flexDirection: "row",
    alignItems: "center",
    gap: bosluk.s,
    borderWidth: 1,
    borderColor: renk.murekkep100,
    borderRadius: kose.m,
    padding: bosluk.s
  },
  oturumAd: { fontSize: 14, fontWeight: "700", color: renk.murekkep900 }
});
