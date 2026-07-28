# Calibración contra el calculador oficial

**Fuente:** Calculador de intereses del Poder Judicial de Neuquén
`https://cintereses.agjusneuquen.gob.ar` (desarrollado por Eureka; tasas del BPN,
Gabinete Técnico Contable).

El motor (`src/engine.js`) fue calibrado y **coincide al centavo** con este sistema.

---

## Método oficial (descifrado)

Las tasas de la tabla son **mensuales** (% por mes). Para un capital entre dos
fechas:

```
interés del mes = capital × (tasaMensual_del_mes / 100) × (díasUsados / díasDelMes)
```

- **Mes completo** (cubierto de día 1 a fin de mes) → tasa mensual plena.
- **Mes parcial** (primero desde la mora, o último hasta el corte) → proporcional
  a los días.
- **Cómputo inclusive:** se cuentan la fecha de mora y la fecha de corte. Por eso
  el motor calcula hasta `corte + 1 día`.
- Interés total = suma de los meses. **Sin capitalizar** (salvo hito art. 770).

## Tipos de tasa del sistema oficial

| Opción | Definición oficial |
|--------|--------------------|
| Activa | Descuento de documentos comerciales (Descuento de Valores Comprados) |
| Pasiva | Depósito a plazo fijo 30 días |
| Promedio | Promedio entre activa y pasiva |
| TEA Prop | TEA del BPN (clientes sin paquete, préstamos personales, sucursales, sin IVA), proporcional a cada mes |
| TNA | TNA del mismo producto |
| **Art 552 CCN** | **Tasa diaria acumulada del BCRA** (lectura literal del art. 552; distinta de la progresión "Casas") |
| Pactada | Se ingresa la tasa anual y el sistema calcula el período |

> **Nota:** el preset de alimentos de esta app usa **TEA Prop** (hasta 31/3/2024)
> y **Activa** (desde 1/4/2024), conforme "Casas" (ver `jurisprudencia.md`), NO la
> opción "Art 552 CCN" (BCRA). Se podría ofrecer esta última a futuro.

---

## Casos de regresión validados (2026-07-22)

Ambos reproducidos por los tests A y B en `tests/engine.test.js`.

### Caso 1 — mes final completo
- Capital 100.000 · 11/01/2024 → 31/03/2024 · TEA Prop
- Oficial: 81 días · primer mes parcial 17,09 % · meses completos 48,76 % ·
  total 65,85 % → **$ 65.851,29**
- Motor: **$ 65.851,29** ✓

### Caso 2 — mes final parcial
- Capital 100.000 · 11/01/2024 → 15/02/2024 · TEA Prop
- Oficial: 36 días · primer mes 17,09 % · último mes parcial 12,21 % ·
  total 29,30 % → **$ 29.298,19**
- Motor: **$ 29.298,19** ✓

Desglose Caso 1: ene 25,23 % × 21/31 = 17,09 % · feb 23,60 % (completo) ·
mar 25,16 % (completo).
