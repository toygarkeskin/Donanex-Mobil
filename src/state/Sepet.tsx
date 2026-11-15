import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Para } from "@/lib/bicim";
import { useOturum } from "./Oturum";

export interface SepetSatiri {
  productId: string;
  name: string;
  slug?: string;
  storeSlug?: string;
  storeName?: string;
  imageUrl?: string;
  quantity: number;
  stock: number;
  unitPrice?: Para;
  lineTotal?: Para;
  available: boolean;
  issue?: string;
}

interface SepetVerisi {
  items: SepetSatiri[];
  itemCount: number;
  subtotal: Para;
  hasIssues: boolean;
  canCheckout: boolean;
}

interface SepetDegeri extends SepetVerisi {
  yuklendi: boolean;
  yukle(): Promise<void>;
  ekle(urunId: string, adet?: number): Promise<void>;
  adetDegistir(urunId: string, adet: number): Promise<void>;
  cikar(urunId: string): Promise<void>;
  sifirla(): void;
}

const BOS: SepetVerisi = { items: [], itemCount: 0, subtotal: null, hasIssues: false, canCheckout: false };
const Baglam = createContext<SepetDegeri | null>(null);

/*
 * Sepet sunucuda; burada yalnızca son görülen hali. Her değişiklik sunucunun
 * döndürdüğü güncel sepeti yazıyor — fiyat ve stok istemcide hesaplanmıyor.
 */
export function SepetSaglayici({ children }: { children: ReactNode }) {
  const { hazir, kullanici } = useOturum();
  const kimin = kullanici?.id ?? "misafir";
  const [veri, setVeri] = useState<SepetVerisi>(BOS);
  const [yuklendi, setYuklendi] = useState(false);

  const uygula = (s: SepetVerisi) => {
    setVeri({ ...BOS, ...s });
    setYuklendi(true);
  };

  const yukle = useCallback(async () => {
    try {
      uygula(await api.get<SepetVerisi>("/cart"));
    } catch {
      setYuklendi(true);
    }
  }, []);

  // Giriş ya da çıkışta sepet değişiyor (misafir sepeti kullanıcınınkiyle birleşiyor).
  useEffect(() => {
    if (hazir) void yukle();
  }, [hazir, kimin, yukle]);

  const deger: SepetDegeri = {
    ...veri,
    yuklendi,
    yukle,
    async ekle(urunId, adet = 1) {
      uygula(await api.post<SepetVerisi>("/cart/items", { productId: urunId, quantity: adet }));
    },
    async adetDegistir(urunId, adet) {
      uygula(await api.put<SepetVerisi>(`/cart/items/${urunId}`, { quantity: adet }));
    },
    async cikar(urunId) {
      uygula(await api.delete<SepetVerisi>(`/cart/items/${urunId}`));
    },
    sifirla() {
      setVeri(BOS);
      setYuklendi(false);
    }
  };

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useSepet() {
  const d = useContext(Baglam);
  if (!d) throw new Error("useSepet SepetSaglayici içinde kullanılmalı");
  return d;
}
