import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/*
 * İki ayrı depo:
 *  - gizli: yenileme jetonu. Telefonda işletim sisteminin şifreli deposu
 *    (Keychain / Keystore). Web önizlemesinde SecureStore yok; orada
 *    localStorage'a düşülüyor (yalnızca geliştirme önizlemesi).
 *  - ayar: sunucu adresi, misafir sepet kimliği gibi gizli olmayan değerler.
 */
const webGizli = {
  async get(k: string) {
    try {
      return globalThis.localStorage?.getItem(k) ?? null;
    } catch {
      return null;
    }
  },
  async set(k: string, v: string) {
    try {
      globalThis.localStorage?.setItem(k, v);
    } catch {
      /* depo kapalı */
    }
  },
  async del(k: string) {
    try {
      globalThis.localStorage?.removeItem(k);
    } catch {
      /* depo kapalı */
    }
  }
};

export const gizli = {
  get: (k: string) => (Platform.OS === "web" ? webGizli.get(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? webGizli.set(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === "web" ? webGizli.del(k) : SecureStore.deleteItemAsync(k))
};

export const ayar = {
  async get(k: string) {
    try {
      return await AsyncStorage.getItem(k);
    } catch {
      return null;
    }
  },
  async set(k: string, v: string) {
    try {
      await AsyncStorage.setItem(k, v);
    } catch {
      /* yazılamazsa uygulama yine çalışır */
    }
  },
  async del(k: string) {
    try {
      await AsyncStorage.removeItem(k);
    } catch {
      /* yok sayılır */
    }
  }
};

export const ANAHTAR = {
  yenileme: "donanex.yenileme",
  sunucu: "donanex.sunucu",
  sepet: "donanex.sepet"
} as const;
