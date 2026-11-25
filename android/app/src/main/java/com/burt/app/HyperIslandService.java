package com.burt.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Уведомление-таймер для Hyper Island (Xiaomi HyperOS).
 *
 * HyperOS рисует системный островок только для focus-уведомлений, отправленных
 * через NotificationManager.notify() с достаточно высоким каналом. Поэтому
 * сервис держит процесс через foreground-сервис с тихим служебным
 * уведомлением, а сам таймер публикует отдельным уведомлением.
 */
public class HyperIslandService extends Service {

    public static final String ACTION_START = "com.burt.app.action.HYPER_ISLAND_START";
    public static final String ACTION_UPDATE = "com.burt.app.action.HYPER_ISLAND_UPDATE";
    public static final String ACTION_STOP = "com.burt.app.action.HYPER_ISLAND_STOP";

    public static final String EXTRA_ENDS_AT = "endsAt";
    public static final String EXTRA_TEXT_MODE = "textMode";

    /** Доступно плагину, чтобы отвечать на isRunning без биндинга. */
    public static volatile boolean isRunning = false;

    private static final String SERVICE_CHANNEL_ID = "shift_hyper_island_service_channel";
    private static final String FOCUS_CHANNEL_ID = "shift_hyper_island_channel_v2";

    private static final int SERVICE_NOTIFICATION_ID = 1004;
    private static final int TIMER_NOTIFICATION_ID = 1003;

    private long endsAtMs = 0L;
    private boolean textMode = false;
    private NotificationManager notificationManager;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable stopAtEnd = new Runnable() {
        @Override
        public void run() {
            stopSelf();
        }
    };
    private final Runnable updateTicker = new Runnable() {
        @Override
        public void run() {
            if (!textMode || endsAtMs <= System.currentTimeMillis()) {
                return;
            }
            postTimerNotification();
            handler.postDelayed(this, 60_000L);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = getSystemService(NotificationManager.class);
        createChannels();
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
        if (intent.hasExtra(EXTRA_TEXT_MODE)) {
            textMode = intent.getBooleanExtra(EXTRA_TEXT_MODE, false);
        }

        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (endsAtMs <= System.currentTimeMillis()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        // Foreground-сервис нужен, чтобы система не убила процесс; само
        // уведомление-таймер публикуется отдельно через notify().
        startForeground(SERVICE_NOTIFICATION_ID, buildServiceNotification());
        postTimerNotification();
        scheduleStopAtEnd();
        scheduleTextUpdates();

        return START_NOT_STICKY;
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || notificationManager == null) {
            return;
        }

        NotificationChannel focusChannel = new NotificationChannel(
            FOCUS_CHANNEL_ID,
            "Таймер в Hyper Island",
            NotificationManager.IMPORTANCE_HIGH
        );
        focusChannel.setDescription("Обратный отсчёт смены для системного островка HyperOS");
        focusChannel.setSound(null, null);
        focusChannel.enableVibration(false);
        focusChannel.setShowBadge(false);
        notificationManager.createNotificationChannel(focusChannel);

        NotificationChannel serviceChannel = new NotificationChannel(
            SERVICE_CHANNEL_ID,
            "Служба таймера Hyper Island",
            NotificationManager.IMPORTANCE_MIN
        );
        serviceChannel.setDescription("Невидимое служебное уведомление foreground-сервиса");
        serviceChannel.setSound(null, null);
        serviceChannel.enableVibration(false);
        serviceChannel.setShowBadge(false);
        notificationManager.createNotificationChannel(serviceChannel);
    }

    private Notification buildServiceNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_calendar)
            .setContentTitle("Таймер смены")
            .setContentText("Сервис активен")
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build();
    }

    private void postTimerNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = HyperIslandNotifier.buildTimerNotification(
            this,
            FOCUS_CHANNEL_ID,
            endsAtMs,
            contentIntent,
            textMode
        );

        if (notification == null) {
            notification = buildFallbackNotification(contentIntent);
        }

        notificationManager.notify(TIMER_NOTIFICATION_ID, notification);
    }

    private Notification buildFallbackNotification(PendingIntent contentIntent) {
        return new NotificationCompat.Builder(this, FOCUS_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_calendar)
            .setContentTitle("Таймер смены")
            .setContentText("До конца смены")
            .setContentIntent(contentIntent)
            .setWhen(endsAtMs)
            .setShowWhen(true)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build();
    }

    private void scheduleStopAtEnd() {
        handler.removeCallbacks(stopAtEnd);
        long delay = endsAtMs - System.currentTimeMillis();
        if (delay > 0L) {
            handler.postDelayed(stopAtEnd, delay + 500L);
        }
    }

    private void scheduleTextUpdates() {
        handler.removeCallbacks(updateTicker);
        if (textMode && endsAtMs > System.currentTimeMillis()) {
            handler.postDelayed(updateTicker, 60_000L);
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(stopAtEnd);
        handler.removeCallbacks(updateTicker);
        if (notificationManager != null) {
            notificationManager.cancel(TIMER_NOTIFICATION_ID);
        }
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
