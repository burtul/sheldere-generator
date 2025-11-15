import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.burt.app',
  appName: 'График смен',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
