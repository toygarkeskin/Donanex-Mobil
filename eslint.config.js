// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      /*
       * Kapalı: bu kural, efektin içinden çağrılan ve state yazan HER
       * fonksiyonu işaretliyor — React belgelerinin önerdiği "efektte veri
       * çek, await'ten sonra state'e yaz" kalıbını da. Uygulamadaki bütün
       * isabetler bu kalıp (ekran açılınca / filtre değişince sunucudan
       * yükleme). Türetilebilecek state'i efektle eşitlemek yasak kalmaya
       * devam ediyor; kod incelemesinde aranıyor.
       */
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
