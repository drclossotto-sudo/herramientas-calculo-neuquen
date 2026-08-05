# Méndez — indemnización LRT (art. 14) e ingreso base (art. 12)

**Fallo vigente:** "MÉNDEZ, César Emilio c/ PREVENCIÓN ART S.A. s/ accidente de
trabajo con ART" — **Acuerdo (Plenario) N° 14/24**, TSJ Neuquén, 12/06/2024
(Expte. JNQLA6 N° 515.897 – Año 2019).

> ⚠️ **No confundir** con la **fórmula "Méndez"** del régimen **civil** (CNAT,
> cálculo actuarial de renta futura, tope 75 / factor 60·edad⁻¹). Comparten
> apellido y nada más. Éste es un plenario neuquino sobre el art. 12 LRT.

**Qué resolvió:** dejó sin efecto la doctrina de **"Contreras" (Ac. Pleno 16/23)**
y **restableció "Retamales" (Ac. Pleno 30/21)** en cuanto a la interpretación del
art. 12 LRT (t.o. Ley 27348). Es el **criterio vigente**.

**Por qué:** "Contreras" ordenaba una **doble actualización** del ingreso base
—actualizar los salarios por RIPTE **hasta la fecha de la sentencia / último índice
publicado** y, ADEMÁS, aplicarles intereses (TNA activa BNA) desde la PMI con
capitalización (art. 770)—. Esa superposición arrojaba montos "exorbitantes": en
el propio caso, un IB de $4.489.133,15 y una prestación de **$222.696.917,30**
(53 × 4.489.133,15 × 1,44 × 65 %). Méndez descartó ese criterio por
desproporcionado.

---

## Método vigente (Retamales, restablecido por Méndez)

### Fórmula de la prestación (art. 14, ap. 2, inc. a, LRT) — SIN cambios

```
Prestación = 53 × IB × (65 / edad) × % incapacidad
```

Idéntica en Retamales y en Contreras: **los fallos discuten el IB, no el art. 14.**

- **53**: coeficiente fijo (DNU 1694/09).
- **65 / edad**: coeficiente de edad a la PMI (primera manifestación invalidante).
- **% incapacidad** permanente.
- **+ 20 %** (art. 3, Ley 26773) para accidentes/enfermedades, salvo *in itinere*.
- **Piso mínimo SRT**: se toma **el mayor** entre la fórmula y el piso vigente a la PMI.

Ejemplo de la fórmula: 53 × $70.029,96 × 1,18 × 42,65 % = **$1.867.930,83**.

### Ingreso base (art. 12, inc. 1) — RIPTE **solo hasta la PMI**

- Promedio mensual de los salarios de los **12 meses anteriores a la PMI** (o fracción).
- Cada salario se **actualiza por RIPTE hasta la fecha de la PMI** — **NO** hasta la
  sentencia. Éste es exactamente el punto que Méndez restablece frente al exceso
  de Contreras.
- RIPTE = Remuneraciones Imponibles Promedio de los Trabajadores Estables; **índice
  nacional** (Seguridad Social de la Nación). El GTC de Neuquén lo **republica** en
  https://ripte.agjusneuquen.gob.ar/riptes.

### Intereses (art. 12, incs. 2 y 3)

- **Inc. 2:** desde la PMI hasta la liquidación, el IB devenga interés = **TNA activa
  BNA** (cartera general, 30 días).
- **Inc. 3:** desde la mora en el pago, **TNA BNA** hasta el efectivo pago, con
  capitalización del art. 770.
- La tasa concreta y sus tramos los fija **"Trotelli" (Ac. Pleno 1/2025)** — materia
  LRT del módulo de intereses.
- **Sin superposición:** el RIPTE llega hasta la PMI; desde ahí corre el interés.

---

## Cómo lo implementa la app  (ya conforme a Méndez)

- Módulo "Cálculo de indemnización", régimen **LRT**: fórmula 53 × IB × (65/edad) ×
  %incap, + 20 % opcional, máx. con piso.
- **IB:** (a) cargado directo por el profesional, o (b) `ibPorRipte()` — actualiza los
  12 salarios por RIPTE **hasta la PMI** (`rPMI = ripte[mesPMI]`) y promedia. Esto **es**
  el método Retamales/Méndez, no el de Contreras.
- El **interés** (PMI → corte) se hace aparte, en la materia LRT del módulo de
  intereses (Trotelli), con **mora = PMI**. No hay doble actualización.

**Conclusión:** el cambio Contreras → Méndez **NO altera el cálculo de la app**; solo
corrige la cita del fallo. La app ya aplicaba el método hoy vigente.
