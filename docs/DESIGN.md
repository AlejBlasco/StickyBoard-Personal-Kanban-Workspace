# Dirección de diseño

## Concepto: Creative Workspace

StickyBoard debe sentirse como un espacio creativo personal, no como un dashboard corporativo. La interfaz combina claridad operativa con calidez, carácter y una sensación táctil inspirada en notas adhesivas y papelería de calidad.

## Personalidad visual

- Cálida, premium, expresiva y ordenada.
- Superficies suaves, bordes sutiles y sombras contenidas.
- Jerarquía tipográfica clara y espacios generosos.
- Acentos cromáticos moderados; evitar saturación excesiva.
- Tarjetas con personalidad sin sacrificar legibilidad.

## Paleta y tipografía

Tema claro: fondo marfil cálido, superficies blancas o crema, texto carbón y acentos pastel controlados.

Tema oscuro: fondo carbón profundo, superficies grafito, texto claro y acentos adaptados con contraste suficiente. No invertir simplemente los colores del tema claro.

Tipografía: Plus Jakarta Sans. Usar escala consistente para títulos, metadatos y contenido de tarjeta.

Definir colores como tokens semánticos (background, surface, foreground, muted, border, primary, danger, warning, success) y no dispersar valores hexadecimales por componentes.

## Composición

- Cabecera compacta con identidad StickyBoard y acciones globales.
- Área principal con título/contexto y acciones de creación.
- Tres columnas Kanban: Pendiente, En progreso y Completado.
- Columnas diferenciadas sutilmente y con contador de tareas.
- Tarjetas con título prominente, descripción truncada cuando proceda, prioridad, fecha límite y acciones contextuales.
- Búsqueda y filtros visibles y fáciles de restablecer.

## Tarjetas

Contenido recomendado:
1. Título.
2. Descripción opcional, con límite visual razonable.
3. Indicador textual y visual de prioridad.
4. Fecha límite y estado vencido/próximo si aplica.
5. Menú contextual para editar/eliminar.

El color elegido por el usuario debe mantener contraste legible. No codificar prioridad únicamente mediante color.

## Interacciones y movimiento

- Drag & drop claro, con elevación/feedback al arrastrar y destino resaltado.
- Motion breve y funcional para apertura de diálogos, cambios de estado y feedback.
- Respetar `prefers-reduced-motion`.
- Evitar animaciones que dificulten operaciones rápidas.

## Responsive

En escritorio, mostrar las tres columnas simultáneamente cuando el ancho lo permita. En pantallas estrechas, permitir desplazamiento horizontal controlado o una navegación de columnas clara; no comprimir tarjetas hasta hacerlas ilegibles.

## Accesibilidad

Objetivo WCAG 2.2 AA:
- Contraste adecuado.
- Foco visible.
- Navegación por teclado.
- Alternativa al drag & drop.
- Nombres accesibles en icon-only buttons.
- Estados comunicados con texto/icono además de color.
- Diálogos con foco gestionado y cierre accesible.

## Estados a diseñar

Loading, vacío global, columna vacía, sin resultados de búsqueda, error de red, guardado, vencida, fecha próxima, arrastre activo, destino válido/no válido, confirmación de borrado y modo oscuro.

## Implementación

Los tokens semánticos viven en `frontend/src/index.css` (variables CSS para tema claro y oscuro, expuestas a Tailwind). Colores de tarjeta: `lavender`, `mint`, `peach`, `sky`, `lemon` y `rose`, con un valor distinto en cada tema. La prioridad se comunica con icono y texto; el vencimiento, con icono, texto y color. El tema se guarda en `localStorage` y se aplica antes del primer pintado (`frontend/public/theme-init.js`).
