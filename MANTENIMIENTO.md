# Mantenimiento — qué verificar mes a mes

La app usa tres bases de datos que hay que mantener al día. Todas se publican en
el **Gabinete Técnico Contable (GTC) del Poder Judicial de Neuquén**.

> El RIPTE y las tasas se publican con **rezago** (2–3 meses), así que es normal
> que el último mes disponible esté algo atrás respecto del mes en curso.

---

## 1. Tasa ACTIVA del Banco Provincia del Neuquén (BPN)

- **Qué es:** "Descuento de documentos comerciales" (mensual, %).
- **Para qué se usa:** intereses en **civil / daños** y **alimentos** — tramo
  desde 01/04/2024 del preset "Casas".
- **Dónde verificarla:** https://cintereses.agjusneuquen.gob.ar
  (listado de tasas / "Tipo Tasa: Activa").
- **En el proyecto:** `data/tasas.json` → `series.Activa`.
- **Actualizada hasta:** julio 2026.

## 2. Tasa ACTIVA del Banco de la Nación Argentina (TNA BNA)

- **Qué es:** columna "ACTIVA" de "Tasas Banco Nacion" (mensual, %).
- **Para qué se usa:** intereses en **accidentes de trabajo / enfermedad
  profesional (LRT)** — tramo desde 01/04/2024 del preset "Trotelli".
- **Dónde verificarla:** https://ripte.agjusneuquen.gob.ar/tasas
- **En el proyecto:** `data/tasas.json` → `series.TNA_BNA`.
- **Actualizada hasta:** julio 2026.

## 3. Índice RIPTE

- **Qué es:** columna "Monto" (Remuneraciones Imponibles Promedio de los
  Trabajadores Estables).
- **Para qué se usa:** ingreso base (IB) en la **indemnización LRT** (art. 12.1).
- **Dónde verificarlo:** https://ripte.agjusneuquen.gob.ar/riptes
- **En el proyecto:** `data/tasas.json` → `ripte`.
- **Actualizado hasta:** marzo 2026.

## 4. TEA "Sucursales" (BPN)

- **Qué es:** columna "T.E.A. Prop." del listado del BPN (TEA préstamos
  personales, canal sucursales, clientes sin paquete, sin IVA) — mensual, %.
- **Para qué se usa:** los presets la aplican **solo hasta el 31/03/2024** (tramo
  cerrado). Pero conviene mantenerla al día por si un profesional quiere **aplicar
  la TEA a un período posterior con una tasa manual/convencional** — más allá de
  que hoy no sea el criterio jurisprudencial vigente.
- **Dónde verificarla:** https://cintereses.agjusneuquen.gob.ar
  (listado de tasas / "T.E.A. Prop.").
- **En el proyecto:** `data/tasas.json` → `series.TEA_Prop`.
- **Actualizada hasta:** julio 2026.

---

## Lo que NO hace falta actualizar

- **Pasiva, Promedio, TNA (BPN):** sólo se usan si el profesional elige una tasa
  manual/convencional. Mantenerlas es opcional.
- **Pisos mínimos de la SRT (LRT):** NO son una base guardada; se cargan **a mano
  por caso** (Resoluciones/Notas SRT vigentes a la PMI).

---

## Cómo aplicar la actualización

1. Agregar los meses nuevos en `data/tasas.json` (en la serie que corresponda).
2. Regenerar el archivo distribuible:  `node build.js`
3. Publicar:  `git add -A && git commit -m "Actualizo tasas/RIPTE hasta <mes>" && git push`
4. GitHub Pages se actualiza solo en ~1 minuto.
5. Actualizar también los textos "actualizada hasta …" en `index.html` (nota
   global bajo el disclaimer y los pies de resultado) y volver a `node build.js`.

> Sugerencia: pedir ayuda para transcribir los meses nuevos desde las páginas del
> GTC evita errores de tipeo (los valores no tienen descarga directa).
