package com.burt.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor-мост к live-островку.
 *
 * Плагин не хранит состояние расписания: он только проверяет разрешение,
 * запускает/обновляет/останавливает {@link LiveIslandService}.
 */
@CapacitorPlugin(name = "LiveIsland")
public class LiveIslandPlugin extends Plugin {

    private Context context() {
        return getContext();
    }

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }
        Context context = context();
        return context != null && Settings.canDrawOverlays(context);
    }

    private JSObject statusObject() {
        JSObject status = new JSObject();
        status.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.O);
        status.put("permission", canDrawOverlays());
        status.put("running", LiveIslandService.isRunning);
        return status;
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.O);
        result.put("androidSdk", Build.VERSION.SDK_INT);
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(statusObject());
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (canDrawOverlays()) {
            call.resolve(statusObject());
            return;
        }

        Intent intent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + context().getPackageName())
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            context().startActivity(intent);
        } catch (Exception error) {
            call.reject("Не удалось открыть настройки разрешения", "SETTINGS_UNAVAILABLE");
            return;
        }

        // Пользователь вернётся из настроек — актуальный статус читается заново.
        call.resolve(statusObject());
    }

    @PluginMethod
    public void show(PluginCall call) {
        if (!canDrawOverlays()) {
            call.reject("Нет разрешения «Поверх других приложений»", "PERMISSION_DENIED");
            return;
        }

        Long endsAt = call.getLong("endsAt");
        if (endsAt == null || endsAt <= 0L) {
            call.reject("Параметр endsAt обязателен", "INVALID_ARGUMENT");
            return;
        }

        Intent intent = new Intent(context(), LiveIslandService.class);
        intent.setAction(LiveIslandService.ACTION_SHOW);
        intent.putExtra(LiveIslandService.EXTRA_ENDS_AT, endsAt.longValue());
        String remaining = call.getString("remaining", "");
        if (remaining != null && !remaining.isEmpty()) {
            intent.putExtra(LiveIslandService.EXTRA_REMAINING, remaining);
        }
        intent.putExtra(LiveIslandService.EXTRA_TOP_OFFSET, topOffset(call));

        try {
            ContextCompat.startForegroundService(context(), intent);
        } catch (Exception error) {
            call.reject("Не удалось запустить сервис островка", "SERVICE_START_FAILED");
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

        Intent intent = new Intent(context(), LiveIslandService.class);
        intent.setAction(LiveIslandService.ACTION_UPDATE);
        intent.putExtra(LiveIslandService.EXTRA_ENDS_AT, endsAt.longValue());
        String remaining = call.getString("remaining", "");
        if (remaining != null && !remaining.isEmpty()) {
            intent.putExtra(LiveIslandService.EXTRA_REMAINING, remaining);
        }
        intent.putExtra(LiveIslandService.EXTRA_TOP_OFFSET, topOffset(call));

        try {
            if (LiveIslandService.isRunning) {
                context().startService(intent);
            } else {
                // Сервис мог быть остановлен системой — поднимаем заново.
                ContextCompat.startForegroundService(context(), intent);
            }
        } catch (Exception error) {
            call.reject("Не удалось обновить островок", "SERVICE_UPDATE_FAILED");
            return;
        }

        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        try {
            context().stopService(new Intent(context(), LiveIslandService.class));
        } catch (Exception error) {
            call.reject("Не удалось остановить сервис островка", "SERVICE_STOP_FAILED");
            return;
        }
        call.resolve();
    }

    private int topOffset(PluginCall call) {
        Integer value = call.getInt("topOffset", 0);
        return value == null ? 0 : value;
    }
}
