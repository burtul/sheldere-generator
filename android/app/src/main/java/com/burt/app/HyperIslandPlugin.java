package com.burt.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

import androidx.core.content.ContextCompat;

/**
 * Мост к режиму Hyper Island (Xiaomi HyperOS).
 *
 * Сам Hyper Island недоступен сторонним приложениям напрямую: уведомление
 * превращает в системный островок приложение Hyper Bridge. Плагин проверяет,
 * установлен ли Hyper Bridge на устройстве, и запускает
 * {@link HyperIslandService} с уведомлением-таймером.
 */
@CapacitorPlugin(name = "HyperIsland")
public class HyperIslandPlugin extends Plugin {

    private static final String HYPER_BRIDGE_PACKAGE = "com.d4viddf.hyperbridge";
    private static final String HYPER_BRIDGE_MARKET_URI =
        "market://details?id=" + HYPER_BRIDGE_PACKAGE;
    private static final String HYPER_BRIDGE_WEB_URI =
        "https://play.google.com/store/apps/details?id=" + HYPER_BRIDGE_PACKAGE;

    private Context context() {
        return getContext();
    }

    private boolean isHyperBridgeInstalled() {
        Context context = context();
        if (context == null) {
            return false;
        }
        try {
            context.getPackageManager().getPackageInfo(HYPER_BRIDGE_PACKAGE, 0);
            return true;
        } catch (PackageManager.NameNotFoundException error) {
            return false;
        }
    }

    private boolean isXiaomiDevice() {
        String manufacturer = Build.MANUFACTURER == null
            ? ""
            : Build.MANUFACTURER.toLowerCase(Locale.US);
        return manufacturer.contains("xiaomi")
            || manufacturer.contains("redmi")
            || manufacturer.contains("poco");
    }

    @PluginMethod
    public void previewPayload(PluginCall call) {
        Long endsAt = call.getLong("endsAt", System.currentTimeMillis() + 3_600_000L);
        try {
            JSObject result = new JSObject();
            result.put("payload", HyperIslandNotifier.buildPayloadPreview(endsAt));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Не удалось собрать payload", "PAYLOAD_FAILED");
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("installed", isHyperBridgeInstalled());
        result.put("deviceSupported", isXiaomiDevice());
        result.put("nativeSupported", HyperIslandNotifier.isSupported(context()));
        result.put("focusAllowed", HyperIslandNotifier.hasFocusPermission(context()));
        result.put("running", HyperIslandService.isRunning);
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        Long endsAt = call.getLong("endsAt");
        if (endsAt == null || endsAt <= 0L) {
            call.reject("Параметр endsAt обязателен", "INVALID_ARGUMENT");
            return;
        }

        Intent intent = new Intent(context(), HyperIslandService.class);
        intent.setAction(HyperIslandService.ACTION_START);
        intent.putExtra(HyperIslandService.EXTRA_ENDS_AT, endsAt.longValue());

        try {
            ContextCompat.startForegroundService(context(), intent);
        } catch (Exception error) {
            call.reject("Не удалось запустить таймер Hyper Island", "SERVICE_START_FAILED");
            return;
        }

        call.resolve();
    }

    @PluginMethod
    public void update(PluginCall call) {
        Long endsAt = call.getLong("endsAt");
        if (endsAt == null || endsAt <= 0L) {
            call.reject("Параметр endsAt обязателен", "INVALID_ARGUMENT");
            return;
        }

        Intent intent = new Intent(context(), HyperIslandService.class);
        intent.setAction(HyperIslandService.ACTION_UPDATE);
        intent.putExtra(HyperIslandService.EXTRA_ENDS_AT, endsAt.longValue());

        try {
            if (HyperIslandService.isRunning) {
                context().startService(intent);
            } else {
                ContextCompat.startForegroundService(context(), intent);
            }
        } catch (Exception error) {
            call.reject("Не удалось обновить таймер Hyper Island", "SERVICE_UPDATE_FAILED");
            return;
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            context().stopService(new Intent(context(), HyperIslandService.class));
        } catch (Exception error) {
            call.reject("Не удалось остановить таймер Hyper Island", "SERVICE_STOP_FAILED");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void openHyperBridge(PluginCall call) {
        Context context = context();
        if (context == null) {
            call.reject("Контекст недоступен", "NO_CONTEXT");
            return;
        }

        PackageManager packageManager = context.getPackageManager();
        Intent launch = packageManager.getLaunchIntentForPackage(HYPER_BRIDGE_PACKAGE);
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                context.startActivity(launch);
                call.resolve();
                return;
            } catch (Exception ignored) {
                // Пробуем открыть магазин ниже.
            }
        }

        Intent market = new Intent(Intent.ACTION_VIEW, Uri.parse(HYPER_BRIDGE_MARKET_URI));
        market.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(market);
            call.resolve();
            return;
        } catch (Exception ignored) {
            // Магазина нет — открываем веб-версию.
        }

        Intent web = new Intent(Intent.ACTION_VIEW, Uri.parse(HYPER_BRIDGE_WEB_URI));
        web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(web);
        } catch (Exception error) {
            call.reject("Не удалось открыть Hyper Bridge", "NO_BROWSER");
            return;
        }

        call.resolve();
    }
}
