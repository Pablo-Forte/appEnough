package expo.modules.appblocker

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {

  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    // Revisa si el usuario activo nuestro servicio de accesibilidad
    Function("hasAccessibilityPermission") {
      val expectedServiceName = "${context.packageName}/${AppBlockerService::class.java.canonicalName}"
      val enabledServices = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: ""

      val splitter = TextUtils.SimpleStringSplitter(':')
      splitter.setString(enabledServices)
      var found = false
      while (splitter.hasNext()) {
        if (splitter.next().equals(expectedServiceName, ignoreCase = true)) {
          found = true
          break
        }
      }
      found
    }

    // Abre la pantalla de Ajustes > Accesibilidad, donde el usuario activa el servicio a mano
    Function("openAccessibilitySettings") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      context.startActivity(intent)
    }

    // Guarda la lista de packageNames que deben bloquearse AHORA MISMO.
    // El servicio (que corre en su propio proceso en 2do plano) lee esta lista
    // desde SharedPreferences, porque no comparte memoria directa con la app.
    Function("setBlockedPackages") { packages: List<String> ->
      val prefs = context.getSharedPreferences("app_blocker_prefs", Context.MODE_PRIVATE)
      prefs.edit().putStringSet("blocked_packages", packages.toSet()).apply()
    }

    Function("getBlockedPackages") {
      val prefs = context.getSharedPreferences("app_blocker_prefs", Context.MODE_PRIVATE)
      (prefs.getStringSet("blocked_packages", emptySet()) ?: emptySet()).toList()
    }
  }
}
