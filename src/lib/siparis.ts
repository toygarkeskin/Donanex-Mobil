/*
 * Sipariş yanıtındaki takip kodu YALNIZCA bir kez, sipariş verilirken
 * geliyor (sunucuda yalnızca özeti var). Ödeme ekranına adres parametresiyle
 * taşınmıyor — adres geçmişte ve günlüklerde kalırdı; bellekte tutuluyor.
 */
export interface VerilenSiparis {
  orderId: string;
  orderNumber: string;
  trackingCode: string | null;
}

const bellek = new Map<string, VerilenSiparis>();

export const siparisSakla = (s: VerilenSiparis) => bellek.set(s.orderId, s);
export const siparisGetir = (orderId: string) => bellek.get(orderId) ?? null;
