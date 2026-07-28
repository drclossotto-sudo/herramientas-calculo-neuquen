# Plan — Módulo de Indemnización por rentas futuras (Vuotto / Méndez / Acciarri)

**Status:** DRAFT (a la espera de aprobación)
**Fecha:** 2026-07-22
**Amplía:** el aplicativo pasa de "liquidador de intereses" a herramienta con dos
grandes módulos.

---

## 1. Arquitectura

Pestañas de nivel superior en `index.html`:

- **① Liquidación de intereses** — lo actual (materias Alimentos / Civil).
- **② Indemnización — rentas futuras** — nuevo módulo.

Comparten: tema claro/oscuro, disclaimer, estilos de impresión (PDF limpio), autoría.

Motor nuevo y puro: `src/indemnizacion.js` + `tests/indemnizacion.test.js`.

---

## 2. Alcance (confirmado)

- **Supuestos:** Incapacidad **y** Fallecimiento.
- **Fórmulas:** Vuotto, Méndez, Acciarri **simplificada** (renta constante) y
  Acciarri **flexible** (renta variable/probable), como en García Alonso.

---

## 3. Fórmulas

### Base — renta constante no perpetua (Vuotto / Méndez / Acciarri simplificada)

```
C = A · [ 1 − (1 + i)^(−n) ] / i
```

| Fórmula | i (tasa pura) | n (años) | A (renta anual afectada) |
|---------|---------------|----------|--------------------------|
| **Vuotto** | 6 % | 65 − edad | ingreso mensual × 13 × %incap |
| **Méndez** | 4 % | 75 − edad | ingreso mensual × 13 × %incap × (60 / edad) |
| **Acciarri simplificada** | editable (def. 4 %) | (edad cese − edad) | ingreso mensual × 13 × %incap |

- SAC (×13) por defecto, con opción ×12.
- El factor `60/edad` de Méndez se aplica tal cual (para edad > 60 reduce la base).

### Acciarri flexible — renta variable / probable

```
C = Σ_{t=1..n}  ( ingreso_real_t · %incap · prob_t )  /  (1 + i)^t
```

- Tabla editable de **tramos** (año/edad → ingreso real, probabilidad).
- `i` = tasa pura anual (def. 4 %); ingresos en **valores reales** del momento inicial.
- Edad límite de cómputo (ej. 75 → computa hasta 74, criterio García Alonso).

### Fallecimiento

Misma estructura de valor presente, pero la renta es la **porción del ingreso que
el fallecido destinaba a sus causahabientes** (no el % de incapacidad):

- `A = ingreso mensual × 13 × porción_familia`
- `n` = años de vida productiva probable (hasta edad de cese).
- Opción de reparto entre beneficiarios (cónyuge / hijos).
- *Nota:* el cálculo por muerte tiene más variantes doctrinarias → se valida y se
  deja todo editable.

---

## 4. Entradas comunes

- Edad (o fecha de nacimiento → edad a la fecha del hecho)
- Ingreso mensual (valores reales)
- SAC (×13 / ×12)
- % de incapacidad (incapacidad) o porción a causahabientes (fallecimiento)
- Tasa pura anual (default por fórmula, editable)
- Edad de cese / tope (Vuotto 65, Méndez 75, editable)

---

## 5. Salidas

- **Capital indemnizatorio** por cada fórmula seleccionada.
- **Comparativa** Vuotto vs Méndez vs Acciarri.
- **Planilla año a año** (edad, renta, factor de descuento, valor presente) para
  transparencia y para adjuntar.
- **PDF limpio** para el expediente (mismo criterio que intereses: sin marca ni
  autoría).
- Aclaración: NO calcula intereses, actualización, daño moral ni otros rubros
  (igual que la referencia).

---

## 6. Validación

- Contra la **calculadora de García Alonso** (Vuotto-Méndez y Acciarri): el usuario
  corre 2–3 casos y comparamos al peso (yo no puedo acceder al sitio).
- Contra ejemplos publicados (planilla UNS Acciarri / doctrina).

---

## 7. Pasos

1. Motor `src/indemnizacion.js` (fórmulas base + flexible + fallecimiento) con tests.
2. Validación numérica contra casos de García Alonso.
3. UI: pestañas superiores; formulario del módulo; comparativa + planilla; export.
4. Build autocontenido + README.

---

## 7bis. Checklist de campos vs. calculadora García Alonso (Acciarri art. 1746)

Verificado contra captura de pantalla de la calculadora oficial de García Alonso:

| Campo García Alonso | Cubierto | Semántica a respetar |
|---------------------|----------|----------------------|
| Edad inicial | ✅ | Edad al hecho o al cálculo (a criterio del usuario) |
| Edad límite (no incluida), def. 75 | ✅ | **No se incluye**: cargar 75 computa hasta 74 → n = límite − edad inicial |
| Incapacidad % | ✅ | Sobre el ingreso esperado de cada período |
| Tasa pura anual, def. 4 % | ✅ | Ayuda: UNS 4–6 %; editable |
| Ingreso constante \| variable/probable | ✅ | Toggle = Acciarri simplificada / flexible |
| Forma de carga: Mensual \| Anual | ✅ | La fórmula trabaja en anual; solo convierte |
| Ingreso (valores reales, sin inflación) | ✅ | Nota explícita en la UI |
| Conversión: ×12 sin SAC \| ×13 con SAC | ✅ | Toggle idéntico |
| Tramos de ingreso + probabilidades (modo variable) | ✅ | Tabla editable: tramo → ingreso real + probabilidad |

Vuotto/Méndez (calculadora aparte en García Alonso): edad tope 65/75, tasa 6/4 %,
factor 60/edad (Méndez), mismos campos de edad/incapacidad/ingreso (×12/×13).

## 8. Fuentes

- Editorial García Alonso — Calculadora Acciarri y Calculadora Vuotto-Méndez.
- Acciarri & Irigoyen Testa — "Fórmulas y herramientas para cuantificar
  indemnizaciones por incapacidad" (planilla UNS); art. 1746 CCyC.
