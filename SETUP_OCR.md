# Guía de Activación: OCR Real con Gemini (Google)

Esta guía te explica cómo activar la funcionalidad de escaneo real de facturas usando la inteligencia de **Google Gemini**.

## Requisitos Previos
1.  Tener instalada la **Supabase CLI** (`npm install -g supabase`) y haber hecho login (`supabase login`).
2.  Obtener una **API Key** gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).

## Paso 1: Configurar el Almacenamiento
*Si ya hiciste esto en la versión anterior, salta al paso 2.*

1.  Ve a [Supabase Dashboard](https://supabase.com/dashboard) -> **Storage**.
2.  Crea un bucket público llamado: `invoices`.
3.  Asegúrate de agregar políticas (Policies) para permitir escritura a usuarios autenticados.

## Paso 2: Desplegar la Función
Hemos actualizado la función para usar Gemini (es más rápido y económico).

1.  Abre tu terminal en la carpeta del proyecto.
2.  Despliega la función:
    ```bash
    supabase functions deploy review-invoice --project-ref TU_PROJECT_ID --no-verify-jwt
    ```

## Paso 3: Configurar la Clave de Gemini
Aquí es donde ocurre la magia.

1.  Copia tu API Key de Google AI Studio.
2.  Ejecuta en tu terminal:
    ```bash
    supabase secrets set --project-ref TU_PROJECT_ID GEMINI_API_KEY=tu_clave_de_google_ai_studio
    ```

## ¡Listo!
Ahora el botón de escaneo enviará la imagen a Gemini 1.5 Flash, que extraerá los datos con alta precisión.
