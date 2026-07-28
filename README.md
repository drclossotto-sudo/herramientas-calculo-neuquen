# Liquidador de Intereses — Neuquén

Herramienta libre y de código abierto para operadores jurídicos de Neuquén, con
dos módulos: **(1) liquidación de intereses** (alimentos y civil / daños) y
**(2) indemnización por rentas futuras** (fórmulas Vuotto, Méndez y Acciarri).
Un aporte a la matrícula.

**Autor:** Otto Closs — Defensor Público Civil de Neuquén · Licencia MIT.

> ⚠️ **Herramienta auxiliar.** El resultado es orientativo; cada profesional debe
> verificar la planilla que presenta y es responsable de ella. No constituye
> asesoramiento ni liquidación oficial.

---

## Cómo usarla

Abrí **`dist/index.html`** en cualquier navegador (doble clic). Es un único
archivo autocontenido: funciona **offline**, sin instalar nada, y los datos del
expediente **nunca salen de tu navegador**.

## Qué hace

- **Dos materias** (selector arriba): *Alimentos* (flujo de cuotas mensuales, mora
  día 11, adicional del art. 552 opcional) y *Civil / Daños* (capital o rubros
  desde su fecha de mora, sin art. 552). Tasa, pagos y capitalización idénticas.
- Método **calibrado al centavo** contra el calculador oficial del Poder Judicial
  de Neuquén (`cintereses.agjusneuquen.gob.ar`). Ver `referencias/calibracion.md`.
- Tasas mensuales del **BPN** (Gabinete Técnico Contable). Preset **"Casas"** para
  alimentos: **TEA Sucursales** hasta 31/03/2024 y **Activa BPN** desde 01/04/2024.
- Cuotas como **suma fija** o **porcentaje sobre base neta**.
- **Pagos parciales** con imputación del art. 903 CCyC (primero interés, luego
  capital; deuda más antigua primero).
- **Capitalización** opcional (art. 770), apagada por defecto.
- **Adicional judicial** opcional (art. 552 in fine), apagado por defecto.
- **Tasa convencional** editable.
- Planilla por período desglosada + detalle día por día. Export **CSV** e
  **impresión/PDF**.

## Módulo 2 — Indemnización por rentas futuras

Pestaña "Indemnización". Calcula el capital que repara la pérdida de ingresos
futuros por **incapacidad** o **fallecimiento** (art. 1746 CCyC):

- **Vuotto** (i 6 %, n = 65 − edad) y **Méndez** (i 4 %, n = 75 − edad, × 60/edad),
  con comparativa lado a lado.
- **Acciarri** en dos variantes: renta **constante** y renta **variable/probable**
  (tramos de ingreso con probabilidades), replicando la calculadora de García Alonso.
- Ingresos en valores reales; tasa pura. Planilla año a año + PDF limpio.
- Motor validado contra la calculadora de García Alonso (Vuotto/Méndez coinciden
  al centavo). Ver `src/indemnizacion.js` y sus tests.

## Actualizar las tasas

Cuando el Gabinete Técnico Contable publique nuevos meses:
1. Actualizá `data/tasas.json` (misma estructura).
2. Corré `node build.js` para regenerar `dist/index.html`.

## Estructura

```
index.html            App (versión de desarrollo; carga src/ y data/)
dist/index.html       App autocontenida (distribuible) — la que se comparte
src/engine.js         Motor de cálculo (puro, testeable)
data/tasas.json       Serie oficial de tasas mensuales (fuente de verdad)
data/tasas.js         Igual, envuelto para el navegador
tests/                Pruebas del motor (incl. regresión oficial) y de la UI
referencias/          Jurisprudencia ("Casas") y calibración del método
build.js              Genera dist/index.html autocontenido
```

## Desarrollo

```bash
npm install        # jsdom, solo para los tests de UI
npm test           # motor + interfaz
npm run build      # regenera dist/index.html
```
