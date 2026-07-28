# Referencias jurisprudenciales — tasas de interés (Neuquén)

Base para la capa de datos de tasas del liquidador. La *selección* de la tasa
aplicable a alimentos es una decisión jurídica del usuario (ver nota final).

---

## Acuerdo N° 15 — "Casas c/ Provincia del Neuquén s/ Responsabilidad del Estado"

- **Tribunal:** TSJ Neuquén, Sala Procesal Administrativa.
- **Fecha:** 30/06/2025.
- **Expediente:** OPANQ1 10356/2018.
- **Materia:** responsabilidad del Estado / daño moral (NO alimentos).
- **Aportado por el usuario** como el fallo más reciente que fija los tramos de
  tasa.

### Tramos de tasa que establece

| Desde | Hasta | Tasa | Notas |
|-------|-------|------|-------|
| (previo) | 31/12/2020 | Tasa de descuento de documentos del BPN | Criterio previo (contexto "Di Luca") |
| 1/1/2021 | 31/3/2024 | TEA "Sucursales" del BPN (préstamos personales en sucursal, clientes sin paquete) | **Sin capitalizar.** Publicada por el Gabinete Técnico Contable como "tasa TEA Prop." |
| 1/4/2024 | efectivo pago | Tasa activa del BPN (descuento de documentos comerciales) | Corrección posterior a "Trotelli" |

### Precedentes citados

- **"Di Luca":** dispuso aplicar desde enero/2021 la TEA "Sucursales" al
  entender que la tasa previa (descuento de documentos BPN) ya no era adecuada.
- **Acuerdo Plenario 1 — "Trotelli c/ Experta ART" (13/3/2025):** convalidó la
  TEA "Sucursales" **solo hasta el 31/3/2024**; desde abril/2024 se vuelve a una
  tasa más moderada porque la TEA superaba notoriamente el IPC de Neuquén (en
  "Trotelli", TNA BNA, por ser la tasa legal del crédito laboral involucrado).
  En "Casas", al no existir tasa legal para el crédito, se adopta la activa BPN
  de descuento de documentos comerciales desde 1/4/2024.

---

## Fuente de datos de tasas (clave para la app)

Los índices/tasas los publica el **Gabinete Técnico Contable** en la página del
**Poder Judicial de Neuquén**. Es la fuente autoritativa y pública para la serie
temporal — no requiere convenio con el BPN. La app debe tomar sus índices.

**Pendiente:** ver el formato real de las planillas del Gabinete (¿tasas
periódicas o coeficientes acumulados?) para fijar la convención de cálculo.

---

## Nota sobre alimentos (art. 552 CCyC) — RESUELTO por el usuario (2026-07-22)

Aunque "Casas" es un crédito de responsabilidad del Estado, el usuario confirmó
que su doctrina de tramos **es plenamente aplicable a alimentos**. Por lo tanto,
el preset de alimentos usa:

| Desde | Hasta | Tasa |
|-------|-------|------|
| 1/1/2021 | 31/3/2024 | TEA "Sucursales" del BPN (sin capitalizar) |
| 1/4/2024 | efectivo pago | Tasa activa del BPN (descuento de documentos comerciales) |

El art. 552 CCyC (tasa más alta + adicional judicial) queda cubierto: la TEA
"Sucursales" es de las más altas, y el corte de abril/2024 sigue el criterio
del TSJ. La app además ofrece una tasa **"convencional"** editable para casos
con tasa pactada o fijada distinta, y una casilla opcional para el **adicional
judicial del art. 552 in fine** (interés reforzado/punitorio dispuesto por el
juez), que se suma linealmente a la tasa base.
