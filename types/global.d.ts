import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    Capacitor: typeof Capacitor;
  }
}