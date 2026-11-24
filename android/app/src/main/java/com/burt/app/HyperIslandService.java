package com.burt.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Уведомление-таймер для Hyper Island (Xiaomi HyperOS) через Hyper Bridge.
 *
 * Hyper Bridge превращает обычные Android-уведомления в системный островок.
 * Чтобы уведомление распозналось как таймер, нужны:
 *  - заголовок (Hyper Bridge берёт его как подпись);
 *  - {@code setUsesChronometer(true)} (флаг EXTRA_SHOW_CHRONOMETER);
 *  - {@code setWhen(endsAt)} с моментом окончания в будущем — по нему
 *    Hyper Bridge строит обратный отсчёт.
 *
 * Своего окна сервис не рисует: Hyper Island показывает системный островок.
 * Когда время выходит, сервис останавливается и уведомление исчезает.
 */
public class HyperIslandService extends Service {

    public static final String ACTION_START = "com.burt.app.action.HYPER_ISLAND_START";
    public static final String ACTION_UPDATE = "com.burt.app.action.HYPER_ISLAND_UPDATE";
    public static final String ACTION_STOP = "com.burt.app.action.HYPER_ISLAND_STOP";

    public static final String EXTRA_ENDS_AT = "endsAt";

    /** Доступно плагину, чтобы отвечать на isRunning без биндинга. */
    public static volatile boolean isRunning = false;

    private static final String CHANNEL_ID = "shift_hyper_island_channel";
    private static final String CHANNEL_NAME = "Таймер в Hyper Island";
    private static final String CHANNEL_DESCRIPTION = "Обратный отсчёт смены для системного островка HyperOS";
    private static final int NOTIFICATION_ID = 1003;

    private long endsAtMs = 0L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable stopAtEnd = new Runnable() {
        @Override
        public void run() {
            stopSelf();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        isRunning = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();

        if (intent.hasExtra(EXTRA_ENDS_AT)) {
            endsAtMs = intent.getLongExtra(EXTRA_ENDS_AT, 0L);
        }

        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (endsAtMs <= System.currentTimeMillis()) {
            // Смена уже закончилась — показывать нечего.
            stopSelf();
            return START_NOT_STICKY;
        }

        startForeground(NOTIFICATION_ID, buildNotification());
        scheduleStopAtEnd();

        return START_NOT_STICKY;
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
            channel.enableVibration(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, openIntent, pendingFlags);

        // На HyperOS 3+ собираем нативный focus-notification: островок рисует
        // сама система, Hyper Bridge не нужен.
        Notification nativeIsland =
            HyperIslandNotifier.buildTimerNotification(this, CHANNEL_ID, endsAtMs, contentIntent);
        if (nativeIsland != null) {
            return nativeIsland;
        }

        Bitmap largeIcon = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Таймер смены")
            .setContentText("До конца смены")
            .setSmallIcon(R.drawable.ic_notification_calendar)
            .setLargeIcon(largeIcon)
            .setContentIntent(contentIntent)
            .setWhen(endsAtMs)
            .setShowWhen(true)
            // Эти три поля превращают уведомление в таймер для Hyper Bridge.
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build();
    }

    private void scheduleStopAtEnd() {
        handler.removeCallbacks(stopAtEnd);
        long delay = endsAtMs - System.currentTimeMillis();
        if (delay > 0L) {
            handler.postDelayed(stopAtEnd, delay + 500L);
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(stopAtEnd);
        isRunning = false;
        stopForeground(true);
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
