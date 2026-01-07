# Guía de Activación: OCR Real con IA (Supabase + OpenAI)

Esta guía te explica cómo activar la funcionalidad de escaneo real de facturas en tu aplicación **Nido Finanzas**.

## Requisitos Previos
1.  Tener instalada la **Supabase CLI** en tu computadora (`npm install -g supabase`).
2.  Tener una cuenta en [OpenAI Platform](https://platform.openai.com/) y una **API Key** (`sk-...`).
3.  Haber iniciado sesión en Supabase desde tu terminal (`supabase login`).

## Paso 1: Crear el Bucket de Almacenamiento
Para que la IA pueda leer la imagen, primero debemos subirla a la nube.

1.  Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2.  Entra a **Storage** y crea un nuevo Bucket llamado: `invoices`.
3.  **Configuración del Bucket**:
    *   **Public**: OFF (Privado es más seguro, pero necesitarás configurar RLS. Para pruebas rápidas puedes dejarlo Public u Off con Signed URLs).
    *   **Allowed MIME types**: `image/*`
4.  **Políticas RLS (Importante)**:
    *   Ve a la pestaña **Configuration** -> **Policies**.
    *   Agrega una política para `invoices` que permita `INSERT` y `SELECT` a usuarios autenticados (`auth.role() = 'authenticated'`).

## Paso 2: Desplegar la Función (Backend)
El código de la función ya está creado en tu proyecto en: `supabase/functions/review-invoice/index.ts`.

1.  Abre tu terminal en la carpeta del proyecto (`c:\Users\Amaya\Downloads\Nido`).
2.  Ejecuta el siguiente comando para desplegar la función en tu proyecto de Supabase:
    ```bash
    supabase functions deploy review-invoice --project-ref TU_PROJECT_ID
    ```
    *(Nota: `TU_PROJECT_ID` es la cadena que aparece en la URL de tu dashboard: `https://supabase.com/dashboard/project/abcxyz123`)*

## Paso 3: Configurar la API Key
Para que la función pueda hablar con OpenAI, necesitamos guardar tu clave de forma segura.

1.  Ejecuta este comando en tu terminal:
    ```bash
    supabase secrets set --project-ref TU_PROJECT_ID OPENAI_API_KEY=sk-tu-clave-secreta-de-openai
    ```

## ¡Listo!
La próxima vez que uses el botón **Escaneo Inteligente** en la App:
1.  La imagen se subirá a tu Supabase.
2.  La función `review-invoice` analizará la foto con GPT-4o.
3.  ¡Los datos de la factura se llenarán automáticamente con precisión real!

---
> **Nota**: Si no realizas estos pasos, la aplicación seguirá funcionando en **Modo Simulación** (usando datos de prueba) para no afectar tu experiencia.
