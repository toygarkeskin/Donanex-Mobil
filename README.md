# Donanex Mobil

Donanex çok satıcılı teknoloji pazaryerinin telefon uygulaması (Expo SDK 58, React Native 0.88,
Expo Router). Web sitesiyle **aynı API'yi** kullanır; ayrı bir sunucu yoktur.

## Ekranlar

| Sekme / ekran | Ne yapar |
|---|---|
| Ana sayfa | Canlı kategorilerden slider, kategoriler, son gelenler, mağazalar; bildirim zili |
| Ürünler | Arama (yazarken), kategori ve sıralama, sonsuz kaydırma |
| Ürün | Fotoğraf galerisi, adetli sepete ekleme, "Bunları da sepete ekleyebilirsiniz", yorumlar (fotoğraflı), soru-cevap, benzer ürünler |
| Mağaza | Mağaza vitrini ve ürünleri |
| Sepetim | Adet değiştirme, kaldırma, sorunlu satır uyarısı, tamamlayıcı öneriler; boşken genel öneriler |
| Siparişi tamamla / Ödeme | Kayıtlı adresle otomatik dolum, ödeme benzetimi, misafir takip kodu |
| Hesabım | Siparişlerim ve detayı (iptal), bildirimler, sipariş takibi, sunucu adresi, çıkış |
| Giriş / Kayıt | Parola + e-postaya gelen 6 haneli kod |

Mağaza ve yönetim panelleri web sitesinde kalır.

## Çalıştırma

Önce Donanex yığını bilgisayarda açık olmalı (`docker compose up -d`, site `http://localhost:8090`).

```bash
npm install
npx expo start
```

Telefona **Expo Go** kurup terminaldeki QR kodu okutun. Uygulama, Expo'nun çalıştığı bilgisayarı
bulup `http://<bilgisayar>:8090` adresine bağlanır.

Telefon bilgisayara aynı Wi-Fi'dan ulaşamıyorsa (güvenlik duvarı, misafir ağı):

1. Donanex klasöründe `node scripts/tunel.js` çalıştırın; bir `https://….trycloudflare.com` adresi verir.
2. Uygulamada **Hesabım → Sunucu adresi**'ne bu adresi yazın.
3. Expo Go da bilgisayara ulaşamıyorsa: `npx expo start --tunnel`.

Demo hesaplarının e-postaları (giriş kodu dahil) gerçek kutuya değil Mailpit'e gider:
`http://localhost:8093`.

> Bu bilgisayarda 8081 portunu McAfee (macmnsvc) tutuyor; Expo başka port isterse
> `npx expo start --port 8099` kullanın.

## Mimari

```
src/
  app/          Expo Router ekranları ((sekmeler) = alt sekme çubuğu)
  components/   Ortak arayüz parçaları (UrunKart, OneriSeridi, Yorumlar, Sorular, …)
  lib/          api (HTTP istemcisi), giris (OAuth+PKCE), sunucu, depo, bicim
  state/        Oturum ve Sepet (React context)
  tema.ts       Web sitesiyle aynı renk belirteçleri
```

### Kimlik doğrulama

Web sitesiyle aynı OAuth 2.1 yetkilendirme kodu + PKCE akışı, istemci `donanex-mobil`:

1. `GET /oauth/authorize` — `Accept: application/json` ile çağrılır (React Native 302'yi
   yakalayamaz), `prompt=login` ile (her girişte parola + kod; misafir sepeti bu adımda hesaba taşınır).
2. `POST /api/auth/sign-in` → e-postaya kod gider.
3. `POST /api/auth/sign-in/verify` → dönüş adresi `donanexmobil://giris?code=…` (hiç açılmaz, kod okunur).
4. `POST /oauth/token` → erişim jetonu bellekte, **yenileme jetonu cihazın güvenli deposunda**
   (Keychain / Keystore, `expo-secure-store`). Web istemcisinin yenileme jetonu gövdede hiç dönmez;
   bu ayrım sunucuda istemci kimliğine bağlı.

Yenileme aynı anda bir kez yapılır: sunucu döndürülen yenileme jetonunun ikinci kullanımını
hırsızlık sayıp bütün zinciri kapatır.

### Misafir sepeti

Telefonda tarayıcı çerezi yok; sepet kimliği `X-Sepet` başlığıyla taşınır, sunucu yeni sepet
açınca aynı başlıkla geri verir. Girişte sepet kullanıcının sepetiyle birleşir.

## Denetim

```bash
npx tsc --noEmit     # tip kontrolü
npx expo lint        # ESLint (expo yapılandırması)
npx expo-doctor      # bağımlılık ve yapılandırma denetimi
```

Üçü de temiz. `react-hooks/set-state-in-effect` kuralı kapalı; gerekçesi `eslint.config.js`'te.
