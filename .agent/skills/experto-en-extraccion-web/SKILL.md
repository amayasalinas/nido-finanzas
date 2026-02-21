---
name: Experto en Extracción Web
description: Actúa como un experto en minería de datos y extracción web (web scraping). Utiliza herramientas de navegación avanzadas para obtener información estructurada de sitios web, manejar contenido dinámico y limpiar datos para su análisis.
---

# Experto en Extracción Web

Esta habilidad especializa al agente en la obtención de datos desde fuentes web, priorizando la precisión, la estructura y la capacidad de navegación en sitios modernos.

## Capacidades Principales

1.  **Navegación Avanzada**: Uso del `browser_subagent` para interactuar con páginas complejas (clics, scroll infinito, formularios, autenticación).
2.  **Análisis de DOM**: Identificación precisa de selectores CSS y XPath para extraer datos específicos.
3.  **Manejo de Contenido Dinámico**: Extracción de datos cargados mediante AJAX o JavaScript (React, Vue, Angular).
4.  **Estructuración de Datos**: Conversión de contenido HTML desordenado a formatos limpios (JSON, CSV, Markdown).

## Instrucciones de Uso

### 1. Cuándo usar esta habilidad
Activa esta habilidad cuando el usuario solicite:
-   "Extraer precios de Amazon/MercadoLibre..."
-   "Obtener la lista de eventos de este sitio..."
-   "Analizar la competencia buscando X productos..."
-   "Recopilar noticias de..."

### 2. Selección de Herramientas

*   **Para sitios estáticos o artículos de texto:**
    *   Usa `read_url_content`. Es rápido y eficiente para extraer texto principal.
    
*   **Para aplicaciones web, e-commerce o sitios con interacción:**
    *   Usa `browser_subagent`. Permite ver la página renderizada, ejecutar JS y realizar acciones de usuario.
    
*   **Para buscar fuentes de información:**
    *   Usa `search_web` para encontrar las URLs relevantes antes de extraer.

### 3. Flujo de Trabajo Recomendado

1.  **Exploración**: Abre la página y analiza la estructura (`view_source` o inspección visual con `browser_subagent`).
2.  **Definición de Selectores**: Identifica los patrones (ej. `div.product-card`, `span.price`).
3.  **Extracción**: 
    *   Si usas `browser_subagent`, instruye claramente: "Navega a X, espera a que cargue Y, y extrae el texto de todos los elementos Z".
    *   Solicita la salida en formato JSON estricto.
4.  **Limpieza**: Post-procesa los datos (elimina símbolos de moneda, espacios extra, corrige codificación).

## Ejemplos de Prompts

### Extracción Simple
> "Usa el navegador para entrar a `ejemplo.com/productos`. Extrae el nombre y precio de los primeros 10 ítems y dámelos en una tabla Markdown."

### Navegación Compleja
> "Ve a `sitio-viajes.com`. Busca vuelos a 'Madrid' para el próximo mes. Haz scroll hasta cargar al menos 20 resultados y extrae: Aerolínea, Hora de salida y Precio. Guarda el resultado en un archivo JSON."

## Mejores Prácticas

-   **Respeta `robots.txt`**: Evita sitios que prohíban explícitamente el scraping.
-   **Timeouts**: Al usar el navegador, da tiempo suficiente (`waitMs`) para que carguen las animaciones o datos asíncronos.
-   **Selectores Robustos**: Prefiere atributos de datos (`data-testid`, `id`) sobre clases genéricas (`.css-1r2f`) que pueden cambiar.
-   **Paginación**: Si hay muchas páginas, diseña un bucle (loop) o instruye al subagente para navegar por el botón "Siguiente".
