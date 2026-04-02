# 🚀 Guía para Generar tu APK (DeporteLibre)

He configurado todo para que el proceso de creación del archivo `.apk` sea lo más sencillo posible. Tienes dos opciones principales:

## Opción 1: Automático (GitHub Actions) - RECOMENDADO
Esta es la forma más fácil si tiene instalado Android Studio.

1.  **Sube los cambios a GitHub**: Haz commit y push de todos los archivos que he modificado a tu repositorio de GitHub.
2.  **Ve a la pestaña "Actions"**: En tu repositorio de GitHub, busca la pestaña superior que dice **Actions**.
3.  **Selecciona "Build Android APK"**: En la lista de la izquierda, verás el flujo de trabajo que he creado.
4.  **Ejecuta el flujo**: Haz clic en el botón horizontal **Run workflow**. Una vez que termine (unos 3-5 minutos), verás un "Artifact" llamado `AniFlix-Android-APK`. Descárgalo, descomprímelo y ¡listo!

## Opción 2: Manual (Tu computadora)
Si tienes Android Studio y Java instalados:

1.  **Construye el proyecto web**:
    ```bash
    npm run build
    ```
2.  **Sincroniza con Android**:
    ```bash
    npx cap sync android
    ```
3.  **Compila el APK directamente**:
    ```bash
    cd android
    ./gradlew assembleDebug
    ```
    *El archivo aparecerá en: `android/app/build/outputs/apk/debug/app-debug.apk`*

---

### 📺 Notas para Smart TV
- El archivo generado se puede instalar en cualquier Android TV o TV Box.
- He optimizado la navegación para que funcione con el **control remoto** (flechas y botón OK).
- Si el televisor bloquea la instalación, recuerda activar "Fuentes Desconocidas" en los ajustes de seguridad de tu TV.
