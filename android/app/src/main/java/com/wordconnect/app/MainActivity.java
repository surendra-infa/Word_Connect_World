package com.wordconnect.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private WindowInsetsControllerCompat insetsController;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Edge-to-edge: the app draws behind the status/navigation bars, which
    // are then hidden. On Android 15+ the legacy FLAG_FULLSCREEN approach is
    // ignored and caused bars to hide/show repeatedly (screen "fluctuation");
    // WindowInsetsController is the supported path on all Android versions
    // this app targets.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    insetsController.setSystemBarsBehavior(
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    hideSystemBars();
  }

  private void hideSystemBars() {
    insetsController.hide(
        WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      hideSystemBars();
    }
  }
}
