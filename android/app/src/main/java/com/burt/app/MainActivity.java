package com.burt.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        // Выход из приложения при нажатии кнопки "Назад"
        finishAffinity();
    }
}
