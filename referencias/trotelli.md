# Trotelli — intereses en accidentes de trabajo / enfermedad profesional (LRT)

**Fallo:** Acuerdo Plenario N° 1/2025, TSJ Neuquén **en pleno**, 13/03/2025.
**Autos:** "Trotelli, Samanta Verónica c/ Experta ART S.A. s/ Enfermedad
Profesional con ART" (Expte. JJUCI1 N° 73.647 — Año 2022).
**Materia:** intereses moratorios sobre créditos de la **Ley de Riesgos del
Trabajo (Ley 24557 / LRT, t.o. Ley 27348)**.

---

## La norma y su declaración de inconstitucionalidad

- El **art. 12, inc. 3 de la LRT** fija como **tasa legal**: el *"promedio de la
  tasa activa cartera general nominal anual vencida a treinta (30) días del Banco
  de la Nación Argentina"* — es decir, **TNA BNA** — desde la mora hasta la
  efectiva cancelación.
- El TSJ **confirma la inconstitucionalidad sobreviniente** de esa tasa legal,
  **por un lapso de tiempo**, por su desfasaje frente al IPC de Neuquén a partir
  de 2022 (la TNA BNA quedó muy por debajo, licuando el crédito del trabajador).

## Régimen de tasas que fija (parte resolutiva)

Los intereses moratorios del art. 12 inc. 3 LRT se calculan:

| Desde | Hasta | Tasa |
|-------|-------|------|
| Mora | **31/03/2024** | **TEA "Sucursales"** (BPN: préstamos personales, canal sucursales, clientes sin paquete, sin capitalizar, sin IVA) |
| **01/04/2024** | efectivo pago | **TNA BNA** (se retoma la tasa legal del art. 12.3 LRT: tasa activa cartera general BNA, 30 días) |

Fundamento del corte en marzo/2024: a partir de abril/2024 la TNA BNA vuelve a
ajustarse razonablemente al IPC neuquino, mientras que la TEA "Sucursales" pasó a
superarlo notoriamente (mismo criterio temporal que "Casas").

## Diferencia clave con "Casas" (civil/alimentos)

- **Primer tramo idéntico:** TEA "Sucursales" hasta 31/03/2024.
- **Segundo tramo distinto:** en LRT se retoma la **TNA BNA (Banco Nación)**,
  no la Activa BPN. Es la tasa legal propia del sistema de riesgos del trabajo.

## Modelo de carga sugerido (en la app)

Como civil/daños: **un capital** (la condena) con su **fecha de mora**; sin art.
552; anatocismo art. 770 disponible pero apagado por defecto (la mayoría no
capitalizó).

## Serie de datos (RESUELTO)

- **TEA "Sucursales"** (primer tramo) = TEA_Prop en `data/tasas.json` (BPN, ya la teníamos).
- **TNA BNA** (segundo tramo) = serie **TNA_BNA** en `data/tasas.json`, tomada de la
  **fuente oficial**: Gabinete Técnico Contable del Poder Judicial de Neuquén,
  columna "ACTIVA" de "Tasas Banco Nacion" — https://ripte.agjusneuquen.gob.ar/tasas
  (mensual, 2021-01 → 2026-07). Es la misma que usa el Poder Judicial para "Trotelli".

**Nota:** los valores se transcribieron de la página del GTC; conviene un control
puntual. Una serie anterior (Colegio de Abogados de Rafaela, "descuento de
documentos comerciales") resultó **distinta** de la del GTC y se descartó.
