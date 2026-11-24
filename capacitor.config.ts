import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emrecelik.medyastudyo',
  appName: 'EÇ Medya Stüdyo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0A0D12',
    allowMixedContent: false,
  },
};

export default config;
