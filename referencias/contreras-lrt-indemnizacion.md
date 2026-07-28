# Contreras — indemnización LRT (art. 14) e ingreso base (art. 12)

**Fallo:** "Contreras c/ Galeno ART" — Acuerdo N° 16/23, TSJ Neuquén (Expte.
JZA1S1 N° 45.005/2019). Deja sin efecto la doctrina de "Retamales" (Ac. Pleno
30/21) en cuanto a la interpretación del art. 12 LRT. Criterio vigente.

---

## Fórmula de la prestación (art. 14, ap. 2, inc. a, LRT)

```
Prestación = 53 × IB × (65 / edad) × % incapacidad
```

- **53**: coeficiente fijo (DNU 1694/09).
- **IB** = ingreso base (ver abajo).
- **65 / edad**: coeficiente de edad a la fecha de la PMI (primera manifestación
  invalidante) / siniestro.
- **% incapacidad** permanente.
- **+ 20 %** (art. 3, Ley 26773) para accidentes/enfermedades, salvo *in itinere*.
- **Piso mínimo**: se compara con el mínimo vigente a la PMI (Resolución/Nota SRT);
  se toma **el mayor** entre la fórmula y el piso.

Ejemplo del fallo: 53 × $70.029,96 × 1,18 × 42,65 % = **$1.867.930,83**
(supera el piso SRT de esa época, $1.234.944).

## Ingreso base (art. 12, inc. 1) — acá entra el RIPTE

- Promedio mensual de los salarios de los **12 meses anteriores a la PMI** (o
  fracción).
- Cada salario mensual se **actualiza por la variación del índice RIPTE** hasta la
  **fecha de la PMI** (fecha de corte del ajuste = PMI, criterio Contreras).
- RIPTE = Remuneraciones Imponibles Promedio de los Trabajadores Estables
  (publicado por el Ministerio; el GTC de Neuquén lo replica en
  https://ripte.agjusneuquen.gob.ar).

## Intereses (art. 12, incs. 2 y 3)

- **Inc. 2:** desde la PMI hasta la liquidación, el IB devenga interés = **TNA BNA**
  (tasa activa cartera general 30 días).
- **Inc. 3:** desde la mora en el pago, **TNA BNA** hasta el efectivo pago, con
  capitalización del art. 770.
- La tasa concreta y sus tramos los fija **"Trotelli" (Ac. 1/2025)** — ya
  implementado en la materia LRT del módulo de intereses.
- Contreras evita la **doble actualización**: RIPTE actualiza los salarios sólo
  hasta la PMI; desde ahí corre el interés (no se superponen).

---

## Diseño en la app (a definir con el usuario)

Calculadora nueva en el módulo "Cálculo de indemnización": régimen **LRT**.
- Núcleo: la fórmula (53 × IB × 65/edad × %incap), + 20 % opcional, máx. con piso.
- IB: (a) cargado directo por el profesional, o (b) calculado desde los 12 salarios
  con actualización RIPTE (requiere la serie RIPTE del GTC).
- El interés (PMI → corte) se hace con la materia LRT del módulo de intereses.
