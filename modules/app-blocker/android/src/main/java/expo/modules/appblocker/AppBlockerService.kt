package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.view.accessibility.AccessibilityEvent

class AppBlockerService : AccessibilityService() {

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

    val packageName = event.packageName?.toString() ?: return

    val prefs = getSharedPreferences("app_blocker_prefs", Context.MODE_PRIVATE)
    val blockedPackages = prefs.getStringSet("blocked_packages", emptySet()) ?: emptySet()

    if (blockedPackages.contains(packageName)) {
      // MVP: manda al usuario directo a la pantalla de inicio.
      // Mas adelante: reemplazar por una pantalla de bloqueo propia (Activity a pantalla completa).
      performGlobalAction(GLOBAL_ACTION_HOME)
    }
  }

  override fun onInterrupt() {
    // Requerido por la clase base, no necesitamos hacer nada especial aca.
  }
}