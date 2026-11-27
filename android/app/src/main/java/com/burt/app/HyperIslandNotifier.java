package com.burt.app;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.lang.reflect.Method;
import java.util.Locale;

/**
 * Нативная интеграция с HyperOS Hyper Island (focus notifications).
 *
 * HyperOS принимает не обычное уведомление, а JSON-payload в extras
 * (`miui.focus.param`) плюс Bundle с картинками (`miui.focus.pics`).
 * Здесь этот payload собирается напрямую, без сторонних библиотек и без
 * Hyper Bridge.
 *
 * Есть два режима:
 *  - нативный таймер (TimerInfo) — система сама ведёт отсчёт;
 *  - текстовый отсчёт — для смен, переходящих через полночь: HyperOS
 *    не ведёт такой таймер через сутки, поэтому сервис обновляет текст
 *    раз в минуту.
 */
public final class HyperIslandNotifier {

    private static final String BUSINESS_NAME = "shift_schedule";
    private static final String PICTURE_KEY = "miui.focus.pic_shift_icon";
    private static final String FOCUS_PARAM = "miui.focus.param";
    private static final String FOCUS_PICS = "miui.focus.pics";
    private static final String TITLE = "Таймер смены";
    private static final String CAPTION = "До конца смены";

    private HyperIslandNotifier() {
    }

    /** Поддерживает ли прошивка нативные focus notifications. */
    public static boolean isSupported(Context context) {
        // Намеренно не проверяем persist.sys.feature.island через reflection:
        // на Android 14+ скрытый API может быть заблокирован, и тогда
        // Hyper Island ошибочно считался бы неподдерживаемым. Если HyperOS
        // не умеет focus-уведомления, payload просто проигнорируется.
        return isXiaomiDevice();
    }

    public static Notification buildTimerNotification(
        Context context,
        String channelId,
        long endsAt,
        PendingIntent contentIntent
    ) {
        return buildTimerNotification(context, channelId, endsAt, contentIntent, false);
    }

    /**
     * Собирает уведомление с нативным островком.
     *
     * @param textMode true — текстовый отсчёт для смен через полночь,
     *                 false — нативный таймер HyperOS.
     */
    public static Notification buildTimerNotification(
        Context context,
        String channelId,
        long endsAt,
        PendingIntent contentIntent,
        boolean textMode
    ) {
        if (!isSupported(context) || !hasFocusPermission(context)) {
            // Без разрешения Focus notifications HyperOS проигнорирует payload.
            return null;
        }

        long now = System.currentTimeMillis();
        if (endsAt <= now) {
            return null;
        }

        try {
            String remaining = formatRemaining(endsAt - now);
            String param = buildParam(endsAt, now, textMode);

            Bundle pictures = new Bundle();
            pictures.putParcelable(
                PICTURE_KEY,
                Icon.createWithResource(context, R.drawable.ic_notification_calendar)
            );

            Bundle focusExtras = new Bundle();
            focusExtras.putBundle(FOCUS_PICS, pictures);

            Notification notification = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_notification_calendar)
                .setContentTitle(TITLE)
                .setContentText(CAPTION + ": " + remaining)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addExtras(focusExtras)
                .build();

            notification.extras.putString(FOCUS_PARAM, param);
            return notification;
        } catch (Exception error) {
            // Прошивка неожиданно не приняла payload — используем обычное уведомление.
            return null;
        }
    }

    /** Отдаёт JSON-payload для диагностики (не зависит от поддержки устройства). */
    public static String buildPayloadPreview(long endsAt) throws Exception {
        return buildPayloadPreview(endsAt, false);
    }

    /** Отдаёт JSON-payload для диагностики с выбором режима. */
    public static String buildPayloadPreview(long endsAt, boolean textMode) throws Exception {
        return buildParam(endsAt, System.currentTimeMillis(), textMode);
    }

    private static String buildParam(long endsAt, long now, boolean textMode) throws Exception {
        JSONObject picture = new JSONObject()
            .put("type", 1)
            .put("pic", PICTURE_KEY)
            .put("loop", false)
            .put("autoplay", false)
            .put("number", 0);

        JSONObject imageTextLeft = new JSONObject()
            .put("type", 1)
            .put("picInfo", picture);

        JSONObject bigIsland = new JSONObject().put("imageTextInfoLeft", imageTextLeft);
        JSONObject chatInfo = new JSONObject()
            .put("type", 1)
            .put("title", TITLE)
            .put("picProfile", PICTURE_KEY);

        if (textMode) {
            // Текстовый отсчёт: обновляется сервисом раз в минуту.
            // HyperOS рисует у textInfo и title, и content, поэтому время — только в title.
            String remaining = formatRemaining(endsAt - now);
            bigIsland.put("textInfo", new JSONObject()
                .put("title", remaining)
                .put("showHighlightColor", false));
            chatInfo.put("content", remaining);
        } else {
            JSONObject timer = new JSONObject()
                .put("timerType", -1)
                .put("timerWhen", endsAt)
                .put("timerTotal", endsAt - now)
                .put("timerSystemCurrent", now);
            bigIsland.put("sameWidthDigitInfo", new JSONObject()
                .put("timerInfo", timer)
                .put("showHighlightColor", true)
                .put("turnAnim", false));
            chatInfo.put("timerInfo", timer);
        }

        JSONObject paramIsland = new JSONObject()
            .put("islandProperty", 1)
            .put("islandPriority", 2)
            .put("islandOrder", false)
            .put("dismissIsland", false)
            .put("maxSize", false)
            .put("needCloseAnimation", true)
            .put("bigIslandArea", bigIsland)
            .put("smallIslandArea", new JSONObject().put("picInfo", picture));

        JSONObject paramV2 = new JSONObject()
            .put("protocol", 3)
            .put("business", BUSINESS_NAME)
            .put("updatable", true)
            .put("ticker", TITLE)
            .put("enableFloat", false)
            .put("isShowNotification", true)
            .put("islandFirstFloat", false)
            .put("param_island", paramIsland)
            .put("chatInfo", chatInfo);

        return new JSONObject()
            .put("param_v2", paramV2)
            .put("isShowNotification", true)
            .toString();
    }

    /** Формат HH:MM из миллисекунд. */
    public static String formatRemaining(long leftMs) {
        long totalMinutes = Math.max(0L, leftMs) / 60_000L;
        long hours = totalMinutes / 60L;
        long minutes = totalMinutes % 60L;
        return String.format(Locale.US, "%02d:%02d", hours, minutes);
    }

    private static boolean isXiaomiDevice() {
        String manufacturer = Build.MANUFACTURER == null
            ? ""
            : Build.MANUFACTURER.toLowerCase(Locale.US);
        return manufacturer.contains("xiaomi")
            || manufacturer.contains("redmi")
            || manufacturer.contains("poco");
    }

    /** HyperOS разрешает focus-уведомления только приложению из белого списка. */
    public static boolean hasFocusPermission(Context context) {
        try {
            Bundle arguments = new Bundle();
            arguments.putString("package", context.getPackageName());

            Bundle result = context.getContentResolver().call(
                Uri.parse("content://miui.statusbar.notification.public"),
                "canShowFocus",
                null,
                arguments
            );

            return result != null && result.getBoolean("canShowFocus", false);
        } catch (Exception error) {
            return false;
        }
    }

    /** Системное свойство persist.sys.feature.island включает Hyper Island. */
    public static boolean isIslandFeatureEnabled() {
        try {
            Class<?> systemProperties = Class.forName("android.os.SystemProperties");
            Method getBoolean = systemProperties.getDeclaredMethod(
                "getBoolean",
                String.class,
                boolean.class
            );
            Object value = getBoolean.invoke(null, "persist.sys.feature.island", false);
            return value instanceof Boolean && (Boolean) value;
        } catch (Exception error) {
            return false;
        }
    }
}
