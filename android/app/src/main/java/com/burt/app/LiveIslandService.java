package com.burt.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.Locale;

/**
 * Live-островок смены: плавающая капсула в районе выреза камеры.
 *
 * Окно рисуется поверх других приложений (TYPE_APPLICATION_OVERLAY), поэтому
 * сервис обязан быть foreground-сервисом: система требует постоянное
 * уведомление, пока окно висит на экране.
 *
 * Координата y = 0 совпадает с верхней кромкой экрана, то есть капсула
 * оказывается ровно в зоне статус-бара и выреза камеры. Иконки статус-бара
 * рисуются системой поверх окна, а вырез камеры физически перекрывает
 * центральную часть капсулы — за счёт этого и получается «островок».
 *
 * Остаток времени сервис считает сам по `endsAt` (epoch ms), поэтому таймер
 * продолжает идти, когда приложение свёрнуто и JS-таймеры WebView заморожены.
 */
public class LiveIslandService extends Service {

    public static final String ACTION_SHOW = "com.burt.app.action.LIVE_ISLAND_SHOW";
    public static final String ACTION_UPDATE = "com.burt.app.action.LIVE_ISLAND_UPDATE";
    public static final String ACTION_HIDE = "com.burt.app.action.LIVE_ISLAND_HIDE";

    public static final String EXTRA_REMAINING = "remaining";
    public static final String EXTRA_ENDS_AT = "endsAt";
    public static final String EXTRA_TOP_OFFSET = "topOffset";

    /** Доступно плагину, чтобы отвечать на isRunning без биндинга. */
    public static volatile boolean isRunning = false;

    private static final String CHANNEL_ID = "shift_live_island_channel";
    private static final String CHANNEL_NAME = "Островок смены";
    private static final String CHANNEL_DESCRIPTION = "Плавающий таймер смены поверх других приложений";
    private static final int NOTIFICATION_ID = 1002;
    private static final int DEFAULT_TOP_OFFSET_DP = 0;
    private static final long TICK_INTERVAL_MS = 1000L;

    private WindowManager windowManager;
    private View islandView;
    private TextView islandTime;
    private boolean islandAttached = false;
    private String remaining = "--:--";
    private long endsAtMs = 0L;
    private int topOffsetDp = DEFAULT_TOP_OFFSET_DP;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            if (endsAtMs <= 0L) {
                return;
            }

            long leftMs = endsAtMs - System.currentTimeMillis();
            if (leftMs <= 0L) {
                remaining = formatRemaining(0L);
                updateIslandText();
                // Смена закончилась — островок больше не нужен.
                removeIsland();
                stopSelf();
                return;
            }

            remaining = formatRemaining(leftMs);
            updateIslandText();
            handler.postDelayed(this, TICK_INTERVAL_MS);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
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
        if (intent.hasExtra(EXTRA_TOP_OFFSET)) {
            topOffsetDp = intent.getIntExtra(EXTRA_TOP_OFFSET, DEFAULT_TOP_OFFSET_DP);
        }

        if (endsAtMs > 0L) {
            remaining = formatRemaining(endsAtMs - System.currentTimeMillis());
        } else if (intent.hasExtra(EXTRA_REMAINING)) {
            String value = intent.getStringExtra(EXTRA_REMAINING);
            if (value != null) {
                remaining = value;
            }
        }

        switch (action) {
            case ACTION_SHOW:
            case ACTION_UPDATE:
                // Foreground-режим обязателен для окна поверх других приложений.
                startForeground(NOTIFICATION_ID, buildNotification());
                ensureIslandView();
                updateIslandText();
                attachIsland();
                startTicker();
                break;
            case ACTION_HIDE:
                removeIsland();
                stopSelf();
                break;
            default:
                stopSelf();
                break;
        }

        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_MIN
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

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Таймер смены")
            .setContentText("До конца смены: " + remaining)
            .setSmallIcon(R.drawable.ic_notification_calendar)
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);

        if (endsAtMs > 0L) {
            // Системный хронометр сам обновляет счётчик в уведомлении.
            builder.setWhen(endsAtMs)
                .setUsesChronometer(true)
                .setChronometerCountDown(true);
        }

        return builder.build();
    }

    private void ensureIslandView() {
        if (islandView != null) {
            return;
        }

        islandView = LayoutInflater.from(this).inflate(R.layout.live_island, null);
        islandTime = islandView.findViewById(R.id.live_island_time);
        islandView.setOnClickListener(v -> openApp());
    }

    private void updateIslandText() {
        if (islandTime != null) {
            islandTime.setText(remaining);
        }
    }

    private void startTicker() {
        handler.removeCallbacks(ticker);
        if (endsAtMs > 0L) {
            handler.post(ticker);
        }
    }

    private void attachIsland() {
        if (islandAttached || islandView == null || windowManager == null) {
            return;
        }

        // Разрешение могли отозвать, пока сервис работал.
        if (!Settings.canDrawOverlays(this)) {
            stopSelf();
            return;
        }

        WindowManager.LayoutParams params = buildWindowParams();

        try {
            windowManager.addView(islandView, params);
            islandAttached = true;
        } catch (Exception error) {
            // Окно запрещено системой (BadTokenException/SecurityException)
            // или сервис уже уничтожен.
            stopSelf();
        }
    }

    private WindowManager.LayoutParams buildWindowParams() {
        int flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
            | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
            | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;

        int windowType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            windowType,
            flags,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        params.x = 0;
        params.y = dp(topOffsetDp);
        params.setTitle("ShiftLiveIsland");

        // Разрешаем окну заходить в область выреза камеры.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            params.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        return params;
    }

    private void removeIsland() {
        if (islandAttached && islandView != null && windowManager != null) {
            try {
                windowManager.removeView(islandView);
            } catch (IllegalArgumentException ignored) {
                // Окно уже удалено системой.
            }
        }
        islandAttached = false;
    }

    private String formatRemaining(long leftMs) {
        long totalMinutes = Math.max(0L, leftMs) / 60_000L;
        long hours = totalMinutes / 60L;
        long minutes = totalMinutes % 60L;
        return String.format(Locale.US, "%02d:%02d", hours, minutes);
    }

    private void openApp() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        try {
            startActivity(intent);
        } catch (Exception ignored) {
            // Не удалось открыть приложение — островок продолжает работать.
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(ticker);
        removeIsland();
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
