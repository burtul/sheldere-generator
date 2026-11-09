package com.burt.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.burt.app.ForegroundServicePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(ForegroundServicePlugin.class);
    }
    
    @Override
    public void onBackPressed() {
        // Выход из приложения при нажатии кнопки "Назад"
        finishAffinity();
    }
}
