package com.burt.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.burt.app.ForegroundServicePlugin;
import com.burt.app.LiveIslandPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Плагины нужно регистрировать ДО super.onCreate: BridgeActivity
        // создаёт мост в конце своего onCreate, и более поздняя регистрация
        // в него уже не попадает.
        registerPlugin(ForegroundServicePlugin.class);
        registerPlugin(LiveIslandPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        // Выход из приложения при нажатии кнопки "Назад"
        finishAffinity();
    }
}
