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

public class TimerForegroundService extends Service {
    
    private static final String CHANNEL_ID = "shift_timer_foreground_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_NAME = "Таймер смены";
    private static final String CHANNEL_DESCRIPTION = "Отображение таймера в строке статус-бара";
    
    private String currentTime = "00:00";
    private NotificationManager notificationManager;
    
    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
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
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String time = intent.getStringExtra("time");
            if (time != null) {
                currentTime = time;
            }
            
            String action = intent.getAction();
            if ("UPDATE".equals(action)) {
                updateNotification();
            } else {
                startForeground(NOTIFICATION_ID, createNotification());
            }
        }
        
        return START_STICKY;
    }
    
    private Notification createNotification() {
        // Create a pending intent to open the app
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? 
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT : 
                PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Таймер смены")
            .setContentText("До конца смены: " + currentTime)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Use your own icon
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Makes it non-dismissible
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    private void updateNotification() {
        Notification notification = createNotification();
        notificationManager.notify(NOTIFICATION_ID, notification);
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
