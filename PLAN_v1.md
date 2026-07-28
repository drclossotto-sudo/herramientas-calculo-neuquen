# Plan v1 — Liquidador de Intereses sobre Alimentos (Neuquén)

**Status:** DRAFT (a la espera de aprobación)
**Fecha:** 2026-07-22
**Autor del proyecto:** Defensor Público Civil — Neuquén
**Destinatario:** colegas de la matrícula (foro de Neuquén)
**Licencia prevista:** open source (MIT o similar)

---

## 1. Alcance lockeado (v1)

- **Fuero:** alimentos únicamente (otros fueros → versiones futuras).
- **Carga de deuda:** tabla editable — el motor genera las cuotas mensuales
  automáticamente y el usuario puede agregar / editar / borrar filas.
- **Pagos parciales:** incluidos, con imputación legal (art. 903 CCyC).
- **Tasas por tramos temporales:** núcleo de la herramienta — distintas tasas
  para distintos lapsos (rasgo típico de la jurisprudencia neuquina).
- **Capitalización (anatocismo, art. 770 CCyC):** configurable, **apagada por
  defecto**.
- **Salida:** planilla desglosada con fuente y fórmula, exportable.
- **Serie de tasas:** la provee el usuario; la app también permite carga manual
  de tramos (no depende de ningún convenio ni servidor).

---

## 2. Arquitectura técnica (decisión tomada)

- **App web estática, 100% del lado del cliente.** Un único archivo
  `index.html` autocontenido (HTML + CSS + JS en línea), sin build, sin
  dependencias externas, sin backend.
- **Por qué:** (a) *auditable* — una sola pieza de código que cualquiera lee y
  verifica, coherente con el espíritu open source; (b) *privada* — los datos del
  expediente nunca salen del navegador del colega; (c) *sin mantenimiento de
  servidor* — se hostea gratis (GitHub Pages / Netlify) o se comparte como
  archivo por mail y funciona offline.
- **Compatibilidad:** navegador de escritorio y celular.

---

## 3. Modelo de datos

- **Cuota** `{ fecha_vencimiento, monto, etiqueta }`
  Lista de cuotas adeudadas. Se generan desde una plantilla mensual
  (monto + día de vencimiento + rango de meses) y luego son editables fila por
  fila (para reflejar homologaciones / actualizaciones de cuota).
- **Tramo de tasa** `{ desde, hasta, tasa, tipo, base_dias }`
  Distintas tasas para distintos períodos. `tipo` define la convención
  (ver §7). Editable a mano; opcionalmente precargado con la serie que el
  usuario aporte.
- **Pago** `{ fecha, monto }`
  Pagos totales o parciales, imputados según art. 903.
- **Config de capitalización** `{ activada, hitos[] }`
  Apagada por defecto. Si se activa, el usuario define los hitos
  (p. ej. notificación de demanda, liquidación aprobada — art. 770 CCyC).
- **Fecha de liquidación** — fecha de corte del cálculo.

---

## 4. Motor de cálculo (algoritmo de libro mayor por eventos)

Cálculo determinístico sobre una línea de tiempo de "eventos" ordenados por
fecha (vencimientos de cuotas, cambios de tasa, pagos, hitos de capitalización,
fecha de corte). Entre dos eventos consecutivos la tasa es constante y no ocurre
nada: se devenga interés sobre el saldo.

1. **Vencimiento de cuota:** se suma el monto al capital adeudado; empieza a
   devengar interés desde esa fecha (art. 552 CCyC — mora por incumplimiento del
   plazo).
2. **Devengo por segmento:** `interés = capital_base × tasa_diaria × días`
   (interés simple dentro del tramo).
3. **Pago:** se imputa **primero a intereses devengados, luego a capital**
   (art. 903 CCyC), y a la **deuda más antigua primero** (arts. 900–901).
4. **Hito de capitalización** (si está activada): los intereses devengados a esa
   fecha se incorporan al capital y pasan a devengar (art. 770 CCyC). Si está
   apagada, los intereses nunca se capitalizan.
5. **Cambio de tasa:** solo cambia la tasa aplicable al siguiente segmento.
6. **Fecha de corte:** se devenga hasta ahí y se totaliza.

Cada línea de la planilla registra: fecha, evento, días, tasa aplicada (con su
fuente), capital base, interés del segmento, pagos imputados (a interés / a
capital), saldo de capital y saldo de interés. **Nada de "cajas negras".**

---

## 5. Base legal citada en la app

- **Art. 552 CCyC** — intereses sobre alimentos adeudados (tasa más alta que
  cobran los bancos + eventual adicional judicial).
- **Arts. 900–901 CCyC** — imputación a la deuda más antigua / más onerosa.
- **Art. 903 CCyC** — pago a cuenta de capital e intereses se imputa primero a
  intereses.
- **Art. 770 CCyC** — anatocismo: supuestos de capitalización.
- Criterio de tasa vigente en Neuquén (TSJ / tasa activa BPN): **lo aporta el
  usuario**; la app no lo cablea.

---

## 6. Interfaz (secciones)

1. **Datos de la deuda** — plantilla de cuota mensual + tabla editable.
2. **Tramos de tasa** — tabla editable (desde / hasta / tasa / tipo).
3. **Pagos** — tabla editable.
4. **Opciones** — fecha de liquidación; capitalización (off por defecto);
   base de días; redondeo.
5. **Resultado** — planilla desglosada + totales (capital, intereses, pagos,
   saldo), con fuente y fórmula visibles.
6. **Disclaimer** — permanente, visible.

---

## 7. Supuestos de cálculo (CONFIRMADOS por el usuario — 2026-07-22)

- **Base de días:** 365. Interés simple dentro de cada tramo.
- **Mora de cada cuota:** por defecto **día 11 de cada mes** (la cuota vence el
  10), **editable** por cuota (por si se convino o resolvió otra fecha).
- **Convenciones de tasa soportadas:** TNA, TEA (aplicada de forma **lineal /
  sin capitalizar**, día = valor anual / 365), mensual, diaria.
- **Tasa "convencional":** opción adicional a completar por el profesional (tasa
  pactada / fijada), además de los presets.
- **Tasa reforzada / adicional (art. 552 in fine):** casilla opcional (apagada
  por defecto) para adicionar un interés dispuesto judicialmente (p. ej.
  punitorio). El usuario elige el tipo (tasa activa/TNA o TEA) y el valor; se
  suma linealmente sobre la tasa base. Poco frecuente, pero contemplado.
- **Capitalización:** apagada por defecto (art. 770); configurable con hitos.
- **Redondeo:** 2 decimales en presentación; cálculo interno a precisión completa.

### Preset de tasas para ALIMENTOS (confirmado — "Casas" aplicable a alimentos)

| Desde | Hasta | Tasa |
|-------|-------|------|
| 1/1/2021 | 31/3/2024 | TEA "Sucursales" del BPN (sin capitalizar) |
| 1/4/2024 | efectivo pago | Tasa activa del BPN (descuento de documentos comerciales) |

**Datos de tasas (CARGADOS):** serie mensual oficial extraída de
`cintereses.agjusneuquen.gob.ar` (Poder Judicial de Neuquén — Gabinete Técnico
Contable) a `data/tasas.json`. Series: Activa, Pasiva, Promedio, TEA_Prop, TNA.
Preset alimentos: **TEA_Prop** (2021-01 → 2024-03) y **Activa** (desde 2024-04).

**Método de cálculo (ACTUALIZADO — pivote):** las tasas son **mensuales** (% por
mes), NO anuales. El interés se computa aplicando la tasa del mes al saldo,
**proporcional por días en meses parciales** (mora desde el día 11). Esto
reemplaza el devengo "anual/365" del motor inicial. La estructura del motor
(libro mayor, imputación art. 903, capitalización art. 770, adicional art. 552)
se conserva; solo cambia la fórmula del interés por segmento. **VALIDADO al
centavo** contra el calculador oficial del Poder Judicial (2 casos de regresión).
Ver `referencias/calibracion.md`.

**Formato de planilla:** reproducir el modelo oficial del Poder Judicial
(`Planilla_de_Liquidacion_Alimentos_definitiva.pdf`). Contempla cuota como suma
fija o como porcentaje sobre ingresos; planillas separadas art. 645 vs 648.

---

## 8. Salida / exportación

- **Planilla desglosada** en pantalla (una fila por segmento/evento).
- **Exportar CSV** (para pegar en el expediente / recalcular).
- **Vista imprimible → PDF** vía impresión del navegador (cero dependencias).
- **Copiar total** al portapapeles.

---

## 9. Disclaimer y transparencia (requerimiento del usuario)

Dos pilares, visibles en la app y en la exportación:

1. **Herramienta auxiliar:** el cálculo es orientativo; **cada colega debe
   verificar la planilla** que presenta y es responsable de ella. La app no
   constituye asesoramiento ni liquidación oficial.
2. **Transparencia metodológica:** la app muestra siempre qué tasa usó, de qué
   fuente, en qué período y con qué fórmula. El código es abierto y auditable.

---

## 10. Qué necesito de vos para completar la v1

- La **serie / criterio de tasa** para alimentos en Neuquén (tramos con fechas y
  valores, y la convención de §7). *No bloquea el desarrollo*: el motor ya
  acepta tramos manuales; tu serie se precarga como default cuando la tengas.
- Confirmar los **supuestos de §7**.

---

## 11. Pasos de implementación

1. Estructura del proyecto + `index.html` base + estilos.
2. Motor de cálculo (libro mayor por eventos) — módulo JS puro y testeable.
3. Casos de prueba a mano (liquidaciones cortas verificables) para validar el
   motor antes de la UI.
4. UI: tablas editables (cuotas, tramos, pagos), opciones, resultado.
5. Exportación (CSV, imprimible, copiar).
6. Disclaimer + textos legales + notas de fuente.
7. README + licencia + instrucciones de despliegue.

---

## 12. Verificación

- [ ] Motor validado contra al menos 3 liquidaciones calculadas a mano
      (una con pagos parciales, una con cambio de tasa, una con capitalización).
- [ ] Sin dependencias externas; funciona offline (abrir el `.html` a secas).
- [ ] Funciona en celular.
- [ ] Planilla exporta a CSV y a PDF (impresión).
- [ ] Disclaimer visible en pantalla y en exportación.
