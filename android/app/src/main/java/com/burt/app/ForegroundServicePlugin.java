package com.burt.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

@NativePlugin
public class ForegroundServicePlugin extends Plugin {
    
    private static final String CHANNEL_ID = "shift_timer_foreground_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_NAME = "Таймер смены";
    private static final String CHANNEL_DESCRIPTION = "Отображение таймера в строке статус-бара";
    
    private NotificationManager notificationManager;
    private boolean isServiceRunning = false;
    
    @Override
    public void load() {
        super.load();
        notificationManager = (NotificationManager) getContext().getSystemService(Service.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription(CHANNEL_DESCRIPTION);
            channel.setSound(null, null);
            channel.setVibrationPattern(new long[]{0});
            channel.setVibrationEnabled(false);
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    @PluginMethod
    public void startTimerService(PluginCall call) {
        String time = call.getString("time");
        if (time == null) {
            call.reject("Time is required");
            return;
        }
        
        Intent serviceIntent = new Intent(getContext(), TimerForegroundService.class);
        serviceIntent.putExtra("time", time);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        
        isServiceRunning = true;
        call.resolve();
    }
    
    @PluginMethod
    public void updateTimerService(PluginCall call) {
        String time = call.getString("time");
        if (time == null) {
            call.reject("Time is required");
            return;
        }
        
        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        intent.setAction("UPDATE");
        intent.putExtra("time", time);
        getContext().startService(intent);
        
        call.resolve();
    }
    
    @PluginMethod
    public void stopTimerService(PluginCall call) {
        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        getContext().stopService(intent);
        isServiceRunning = false;
        call.resolve();
    }
    
    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("running", isServiceRunning);
        call.resolve(ret);
    }
}
