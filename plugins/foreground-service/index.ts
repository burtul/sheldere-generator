import { registerPlugin } from '@capacitor/core';

const ForegroundService = registerPlugin<ForegroundServicePlugin>('ForegroundService', {
  android: {
    name: 'com.burt.app.ForegroundServicePlugin',
  },
});

export interface ForegroundServicePlugin {
  /**
   * Start foreground service with timer
   * @param time Time in hh:mm format
   */
  startTimerService(time: string): Promise<void>;
  
  /**
   * Update the timer in foreground service
   * @param time Time in hh:mm format
   */
  updateTimerService(time: string): Promise<void>;
  
  /**
   * Stop foreground service
   */
  stopTimerService(): Promise<void>;
  
  /**
   * Check if service is running
   */
  isRunning(): Promise<{ running: boolean }>;
}

export { ForegroundService };
