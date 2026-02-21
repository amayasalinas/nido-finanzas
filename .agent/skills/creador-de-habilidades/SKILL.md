---
name: Creador de Habilidades
description: Utiliza esta habilidad cuando el usuario necesite crear, estructurar o documentar nuevas habilidades (skills) para el agente en el espacio de trabajo, siguiendo el estándar oficial de Antigravity.
---

# Creador de Habilidades

Esta habilidad proporciona las directrices y el soporte necesario para expandir las capacidades del agente mediante la creación de nuevas habilidades.

## Estructura de una Habilidad

Cada habilidad debe residir en su propia carpeta dentro de `.agent/skills/` y contener al menos un archivo `SKILL.md`.

Estructura recomendada:
- `.agent/skills/<nombre-de-la-habilidad>/`
  - `SKILL.md` (Obligatorio: Instrucciones principales y metadatos)
  - `scripts/` (Opcional: Scripts de ayuda en Python, JS, Bash, etc.)
  - `examples/` (Opcional: Ejemplos de uso o archivos de referencia)
  - `resources/` (Opcional: Plantillas, archivos de datos o recursos estáticos)

## Formato de SKILL.md

El archivo `SKILL.md` debe comenzar con un bloque YAML (frontmatter) que define cómo el agente debe identificar y usar la habilidad.

### YAML Frontmatter
```yaml
---
name: Nombre Legible de la Habilidad
description: Una descripción clara y concisa en tercera persona sobre qué hace la habilidad y cuándo activarla. Actúa como el disparador semántico.
---
```

### Secciones Recomendadas en SKILL.md
1. **Descripción General**: Resumen de la capacidad.
2. **Requisitos**: Dependencias, variables de entorno o archivos necesarios.
3. **Instrucciones de Uso**: Guía paso a paso sobre cómo invocar las funciones o scripts de la habilidad.
4. **Ejemplos**: Fragmentos de código o comandos de ejemplo.
5. **Mejores Prácticas**: Consejos para un rendimiento óptimo.

## Proceso de Creación

Cuando se active esta habilidad para crear una nueva:
1. **Planificación**: Definir el propósito, nombre y alcance de la nueva habilidad.
2. **Estructura**: Crear la carpeta bajo `.agent/skills/`.
3. **Documentación**: Redactar el `SKILL.md` con su YAML frontmatter.
4. **Implementación**: Crear scripts o recursos adicionales si son necesarios.
5. **Verificación**: Comprobar que el agente reconoce y puede ejecutar las instrucciones de la nueva habilidad.

> [!TIP]
> Mantén las descripciones en el YAML frontmatter precisas y ricas en palabras clave para asegurar que el enrutador de Antigravity active la habilidad en el momento adecuado.
