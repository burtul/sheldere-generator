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
 * Используется шаблон чата с таймером: система сама ведёт обратный отсчёт
 * до `timerWhen`, поэтому обновлять уведомление каждую минуту не нужно.
 */
public final class HyperIslandNotifier {

    private static final String BUSINESS_NAME = "shift_schedule";
    private static final String PICTURE_KEY = "miui.focus.pic_shift_icon";
    private static final String FOCUS_PARAM = "miui.focus.param";
    private static final String FOCUS_PICS = "miui.focus.pics";
    private static final String TITLE = "Таймер смены";

    private HyperIslandNotifier() {
    }

    /** Поддерживает ли прошивка нативные focus notifications. */
    public static boolean isSupported(Context context) {
        return isXiaomiDevice() && isIslandFeatureEnabled();
    }

    /**
     * Собирает уведомление с нативным островком-таймером.
     * Возвращает null, если HyperOS не поддерживается или смена уже кончилась.
     */
    public static Notification buildTimerNotification(
        Context context,
        String channelId,
        long endsAt,
        PendingIntent contentIntent
    ) {
        if (!isSupported(context)) {
            return null;
        }

        long now = System.currentTimeMillis();
        if (endsAt <= now) {
            return null;
        }

        try {
            String param = buildParam(endsAt, now);

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
                .setContentText("До конца смены")
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
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
        return buildParam(endsAt, System.currentTimeMillis());
    }

    private static String buildParam(long endsAt, long now) throws Exception {        JSONObject timer = new JSONObject()
            .put("timerType", -1)
            .put("timerWhen", endsAt)
            .put("timerTotal", endsAt - now)
            .put("timerSystemCurrent", now);

        JSONObject picture = new JSONObject()
            .put("type", 1)
            .put("pic", PICTURE_KEY)
            .put("loop", false)
            .put("autoplay", false)
            .put("number", 0);

        JSONObject bigIsland = new JSONObject()
            .put("imageTextInfoLeft", new JSONObject()
                .put("type", 1)
                .put("picInfo", picture))
            .put("sameWidthDigitInfo", new JSONObject()
                .put("timerInfo", timer)
                .put("showHighlightColor", true)
                .put("turnAnim", false));

        JSONObject paramIsland = new JSONObject()
            .put("islandProperty", 1)
            .put("islandPriority", 2)
            .put("islandOrder", false)
            .put("dismissIsland", false)
            .put("maxSize", false)
            .put("needCloseAnimation", true)
            .put("bigIslandArea", bigIsland)
            .put("smallIslandArea", new JSONObject().put("picInfo", picture));

        JSONObject chatInfo = new JSONObject()
            .put("type", 1)
            .put("title", TITLE)
            .put("picProfile", PICTURE_KEY)
            .put("timerInfo", timer);

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
    private static boolean isIslandFeatureEnabled() {
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
