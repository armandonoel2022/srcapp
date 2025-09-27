# Configuración de Autenticación Biométrica - SRC App

## Archivos ya creados/configurados ✅

### 1. Configuración de iOS - Info.plist
- **Ubicación**: `ios/App/App/Info.plist`
- **Incluye**: Permisos para Face ID y autenticación biométrica
- **Descripción**: Configuración completa para iOS

### 2. Configuración de Android - AndroidManifest.xml
- **Ubicación**: `android/app/src/main/AndroidManifest.xml`
- **Incluye**: Permisos para USE_FINGERPRINT y USE_BIOMETRIC
- **Descripción**: Configuración completa para Android

### 3. Hook de Autenticación Biométrica
- **Ubicación**: `src/hooks/useBiometricAuthCapacitor.tsx`
- **Descripción**: Hook personalizado que funciona tanto en web como en mobile

### 4. Componente de Configuración
- **Ubicación**: `src/components/BiometricAuthSetup.tsx`
- **Descripción**: Interfaz de usuario para configurar autenticación biométrica

## Próximos pasos para el desarrollador 🔧

### 1. Sincronización con las plataformas nativas
Después de hacer git pull del proyecto:

```bash
# Instalar dependencias
npm install

# Sincronizar con las plataformas nativas
npx cap sync

# Para iOS (requiere Mac con Xcode)
npx cap open ios

# Para Android (requiere Android Studio)
npx cap open android
```

### 2. Plugin de Biometría (Opcional - Mejora futura)
Para una implementación más robusta, considera instalar:

```bash
npm install @capacitor-community/biometric-auth
npx cap sync
```

Luego actualizar `useBiometricAuthCapacitor.tsx` para usar el plugin real.

### 3. Configuración adicional en Android Studio

1. Abre el proyecto Android en Android Studio
2. Verifica que en `build.gradle` (app level) tengas:

```gradle
dependencies {
    implementation 'androidx.biometric:biometric:1.1.0'
}
```

3. En `MainActivity.java` o `MainActivity.kt`, añade la inicialización si usas el plugin:

```java
import com.capacitorjs.plugins.biometric.BiometricAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registrar el plugin de biometría
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            add(BiometricAuth.class);
        }});
    }
}
```

### 4. Configuración adicional en Xcode (iOS)

1. Abre el proyecto iOS en Xcode
2. Verifica que en `Capabilities` esté habilitado "Touch ID & Face ID"
3. Los permisos en Info.plist ya están configurados

## Cómo funciona actualmente 🚀

### En Web (Navegador)
- Usa WebAuthn API cuando está disponible
- Fallback a confirmación simple para pruebas

### En Mobile (Capacitor)
- Sistema preparado para usar plugin nativo
- Actualmente usa fallback que se puede actualizar fácilmente

### Base de datos
- Tabla `biometric_credentials` ya existe en Supabase
- Almacena credenciales biométricas de forma segura

## Testing 🧪

1. **En navegador**: Ve a Configuración → Autenticación Biométrica
2. **En mobile**: Después de `npx cap sync`, ejecuta la app en dispositivo real
3. La funcionalidad está integrada en el menú de configuración

## Estado actual ✨

- ✅ Configuración completa para iOS y Android
- ✅ Hook funcional con fallbacks
- ✅ UI integrada en el sistema de configuración
- ✅ Base de datos configurada
- ✅ Capacitor config actualizado
- 🔄 Listo para plugin nativo (mejora futura)

## Notas importantes ⚠️

1. **Dispositivos reales**: La autenticación biométrica solo funciona en dispositivos reales, no en emuladores
2. **HTTPS requerido**: Para WebAuthn en navegadores, se requiere HTTPS
3. **Permisos**: Los usuarios deben aceptar permisos biométricos en el dispositivo
4. **Fallback**: Siempre mantener opciones de autenticación tradicional (usuario/contraseña)