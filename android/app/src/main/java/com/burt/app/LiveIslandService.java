package com.burt.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.view.Display;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
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
 * Позицию можно менять двумя способами:
 *  - перетаскиванием пальцем (работает, когда капсула ниже строки статуса:
 *    касания в зоне статус-бара перехватывает SystemUI);
 *  - кнопками «сдвинуть» из бургер-меню (работает при любой позиции).
 *
 * Выбранная позиция сохраняется в SharedPreferences и восстанавливается
 * при следующем запуске сервиса.
 */
public class LiveIslandService extends Service {

    public static final String ACTION_SHOW = "com.burt.app.action.LIVE_ISLAND_SHOW";
    public static final String ACTION_UPDATE = "com.burt.app.action.LIVE_ISLAND_UPDATE";
    public static final String ACTION_HIDE = "com.burt.app.action.LIVE_ISLAND_HIDE";
    public static final String ACTION_MOVE_BY = "com.burt.app.action.LIVE_ISLAND_MOVE_BY";
    public static final String ACTION_RESET_POSITION = "com.burt.app.action.LIVE_ISLAND_RESET_POSITION";

    public static final String EXTRA_REMAINING = "remaining";
    public static final String EXTRA_ENDS_AT = "endsAt";
    public static final String EXTRA_TOP_OFFSET = "topOffset";
    public static final String EXTRA_DX = "dx";
    public static final String EXTRA_DY = "dy";

    /** Доступно плагину, чтобы отвечать на isRunning без биндинга. */
    public static volatile boolean isRunning = false;

    private static final String CHANNEL_ID = "shift_live_island_channel";
    private static final String CHANNEL_NAME = "Островок смены";
    private static final String CHANNEL_DESCRIPTION = "Плавающий таймер смены поверх других приложений";
    private static final int NOTIFICATION_ID = 1002;
    private static final int DEFAULT_TOP_OFFSET_DP = 0;
    private static final long TICK_INTERVAL_MS = 1000L;

    private static final String PREFS_NAME = "live_island_position";
    private static final String PREF_X = "x";
    private static final String PREF_Y = "y";
    private static final String PREF_SAVED = "saved";

    private WindowManager windowManager;
    private View islandView;
    private TextView islandTime;
    private WindowManager.LayoutParams islandParams;
    private boolean islandAttached = false;
    private String remaining = "--:--";
    private long endsAtMs = 0L;
    private int topOffsetDp = DEFAULT_TOP_OFFSET_DP;

    private boolean hasSavedPosition = false;
    private int savedX = 0;
    private int savedY = 0;

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
        loadSavedPosition();
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
            case ACTION_MOVE_BY:
                if (!islandAttached) {
                    stopSelf();
                    break;
                }
                moveByDp(
                    intent.getIntExtra(EXTRA_DX, 0),
                    intent.getIntExtra(EXTRA_DY, 0)
                );
                break;
            case ACTION_RESET_POSITION:
                resetPosition();
                if (!islandAttached) {
                    stopSelf();
                }
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
        installDragHandler();
    }

    private void installDragHandler() {
        if (islandView == null) {
            return;
        }

        final int touchSlop = ViewConfiguration.get(this).getScaledTouchSlop();

        islandView.setOnTouchListener(new View.OnTouchListener() {
            private float downRawX;
            private float downRawY;
            private int startX;
            private int startY;
            private boolean dragging;

            @Override
            public boolean onTouch(View view, MotionEvent event) {
                if (islandParams == null) {
                    return false;
                }

                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        downRawX = event.getRawX();
                        downRawY = event.getRawY();
                        startX = islandParams.x;
                        startY = islandParams.y;
                        dragging = false;
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        float dx = event.getRawX() - downRawX;
                        float dy = event.getRawY() - downRawY;
                        if (!dragging && Math.hypot(dx, dy) > touchSlop) {
                            dragging = true;
                        }
                        if (dragging) {
                            moveTo(startX + Math.round(dx), startY + Math.round(dy));
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        if (dragging) {
                            dragging = false;
                            if (islandParams != null) {
                                persistPosition(islandParams.x, islandParams.y);
                            }
                        } else {
                            view.performClick();
                        }
                        return true;

                    case MotionEvent.ACTION_CANCEL:
                        if (dragging) {
                            dragging = false;
                            if (islandParams != null) {
                                persistPosition(islandParams.x, islandParams.y);
                            }
                        }
                        return true;

                    default:
                        return false;
                }
            }
        });
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

        if (islandParams == null) {
            islandParams = buildWindowParams(initialX(), initialY());
        }

        try {
            windowManager.addView(islandView, islandParams);
            islandAttached = true;
        } catch (Exception error) {
            // Окно запрещено системой (BadTokenException/SecurityException)
            // или сервис уже уничтожен.
            stopSelf();
        }
    }

    private WindowManager.LayoutParams buildWindowParams(int x, int y) {
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

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = clampX(x);
        params.y = clampY(y);
        params.setTitle("ShiftLiveIsland");

        // Разрешаем окну заходить в область выреза камеры.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            params.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        return params;
    }

    private int initialX() {
        int width = islandWidth();
        if (hasSavedPosition) {
            return savedX;
        }
        int screenWidth = screenSize()[0];
        return Math.max(0, (screenWidth - width) / 2);
    }

    private int initialY() {
        return hasSavedPosition ? savedY : dp(topOffsetDp);
    }

    private void moveTo(int x, int y) {
        if (!islandAttached || islandParams == null || windowManager == null) {
            return;
        }

        islandParams.x = clampX(x);
        islandParams.y = clampY(y);

        try {
            windowManager.updateViewLayout(islandView, islandParams);
        } catch (IllegalArgumentException ignored) {
            // Окно уже удалено системой.
        }
    }

    private void moveByDp(int dxDp, int dyDp) {
        if (!islandAttached || islandParams == null) {
            return;
        }
        moveTo(islandParams.x + dp(dxDp), islandParams.y + dp(dyDp));
        persistPosition(islandParams.x, islandParams.y);
    }

    private void resetPosition() {
        clearSavedPosition();

        if (!islandAttached || islandParams == null || islandView == null) {
            return;
        }

        int width = islandWidth();
        int screenWidth = screenSize()[0];
        moveTo(Math.max(0, (screenWidth - width) / 2), dp(topOffsetDp));
    }

    private int islandWidth() {
        if (islandView == null) {
            return 0;
        }
        if (islandView.getWidth() > 0) {
            return islandView.getWidth();
        }
        islandView.measure(
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
        );
        return islandView.getMeasuredWidth();
    }

    private int islandHeight() {
        if (islandView == null) {
            return 0;
        }
        if (islandView.getHeight() > 0) {
            return islandView.getHeight();
        }
        islandView.measure(
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
        );
        return islandView.getMeasuredHeight();
    }

    private int clampX(int x) {
        int[] screen = screenSize();
        int max = Math.max(0, screen[0] - islandWidth());
        return Math.max(0, Math.min(max, x));
    }

    private int clampY(int y) {
        int[] screen = screenSize();
        int max = Math.max(0, screen[1] - islandHeight());
        return Math.max(0, Math.min(max, y));
    }

    private int[] screenSize() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Rect bounds = windowManager.getCurrentWindowMetrics().getBounds();
            return new int[]{bounds.width(), bounds.height()};
        }
        Display display = windowManager.getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        return new int[]{size.x, size.y};
    }

    private void loadSavedPosition() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        hasSavedPosition = prefs.getBoolean(PREF_SAVED, false);
        savedX = prefs.getInt(PREF_X, 0);
        savedY = prefs.getInt(PREF_Y, 0);
    }

    private void persistPosition(int x, int y) {
        savedX = x;
        savedY = y;
        hasSavedPosition = true;
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .edit()
            .putInt(PREF_X, x)
            .putInt(PREF_Y, y)
            .putBoolean(PREF_SAVED, true)
            .apply();
    }

    private void clearSavedPosition() {
        hasSavedPosition = false;
        savedX = 0;
        savedY = 0;
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().clear().apply();
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
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // После поворота экрана не даём капсуле уехать за границы.
        if (islandAttached && islandParams != null) {
            moveTo(islandParams.x, islandParams.y);
        }
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
