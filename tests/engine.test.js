/*
 * Casos de prueba del motor. Correr con:  node tests/engine.test.js
 *
 * REGRESIÓN OFICIAL: los tests A y B reproducen, al centavo, dos corridas del
 * calculador oficial del Poder Judicial de Neuquén (ver referencias/calibracion.md).
 * MECÁNICA: los tests C'..G usan tasa mensual fija (o series) con números que
 * cierran redondos, para verificar imputación, capitalización, adicional y tramos.
 */
var E = require('../src/engine.js');
var TASAS = require('../data/tasas.json');
var S = TASAS.series;

var fallos = 0, corridos = 0;
function check(nombre, real, esperado, tol) {
  corridos++;
  var ok = Math.abs(real - esperado) <= (tol || 0.01);
  if (!ok) { fallos++; console.log('  ✗ ' + nombre + '  ->  obtuve ' + real + ', esperaba ' + esperado); }
  else console.log('  ✓ ' + nombre + '  = ' + real);
}

// Tramo preset alimentos (Casas): TEA_Prop hasta 2024-03-31, Activa desde 2024-04-01
var PRESET = [
  { modo: 'serie', serie: 'TEA_Prop', desde: '2021-01-01', hasta: '2024-03-31', etiqueta: 'TEA Sucursales' },
  { modo: 'serie', serie: 'Activa',   desde: '2024-04-01', hasta: null,          etiqueta: 'Activa BPN' }
];

console.log('\nTest A — REGRESIÓN OFICIAL: TEA Prop, 11/01/2024 a 31/03/2024 (mes final completo)');
var A = E.liquidar({ series: S, cuotas: [{ fecha: '2024-01-11', monto: 100000 }],
  tramos: [{ modo: 'serie', serie: 'TEA_Prop', desde: '2021-01-01', hasta: null }], fechaCorte: '2024-03-31' });
check('interés (oficial $65.851,29)', A.interes, 65851.29, 0.02);
check('total  (oficial $165.851,29)', A.total, 165851.29, 0.02);

console.log('\nTest B — REGRESIÓN OFICIAL: TEA Prop, 11/01/2024 a 15/02/2024 (mes final parcial)');
var B = E.liquidar({ series: S, cuotas: [{ fecha: '2024-01-11', monto: 100000 }],
  tramos: [{ modo: 'serie', serie: 'TEA_Prop', desde: '2021-01-01', hasta: null }], fechaCorte: '2024-02-15' });
check('interés (oficial $29.298,19)', B.interes, 29298.19, 0.02);

console.log("\nTest C' — Imputación art. 903 (pago parcial < interés), meses completos, 10%/mes");
var C = E.liquidar({ cuotas: [{ fecha: '2024-01-01', monto: 100000 }],
  tramos: [{ modo: 'mensual_fija', valor: 10, desde: '2024-01-01', hasta: null }],
  pagos: [{ fecha: '2024-02-01', monto: 4000 }], fechaCorte: '2024-02-29' });
check('capital (intacto)', C.capital, 100000);
check('interés (10000-4000 +10000)', C.interes, 16000);
check('total pagos', C.totalPagos, 4000);

console.log("\nTest D' — Dos cuotas, 10%/mes, meses completos");
var D = E.liquidar({ cuotas: [{ fecha: '2024-01-01', monto: 100000 }, { fecha: '2024-02-01', monto: 100000 }],
  tramos: [{ modo: 'mensual_fija', valor: 10, desde: '2024-01-01', hasta: null }], fechaCorte: '2024-02-29' });
check('capital', D.capital, 200000);
check('interés (10000 + 20000)', D.interes, 30000);

console.log("\nTest E' — Capitalización art. 770 (hito 01/02), 10%/mes");
var Ee = E.liquidar({ cuotas: [{ fecha: '2024-01-01', monto: 100000 }],
  tramos: [{ modo: 'mensual_fija', valor: 10, desde: '2024-01-01', hasta: null }],
  capitalizacion: { activada: true, hitos: ['2024-02-01'] }, fechaCorte: '2024-02-29' });
check('capital (100000+10000)', Ee.capital, 110000);
check('interés (110000·10%)', Ee.interes, 11000);
check('total', Ee.total, 121000);

console.log("\nTest F' — Adicional judicial anual 24% (=2%/mes) sobre base 10%/mes");
var F = E.liquidar({ cuotas: [{ fecha: '2024-01-01', monto: 100000 }],
  tramos: [{ modo: 'mensual_fija', valor: 10, desde: '2024-01-01', hasta: null }],
  adicional: { activada: true, modo: 'anual', valor: 24 }, fechaCorte: '2024-01-31' });
check('interés (100000·12%)', F.interes, 12000);

console.log('\nTest G — Preset alimentos cruzando el tramo TEA_Prop→Activa (ene a may 2024, meses completos)');
var G = E.liquidar({ series: S, cuotas: [{ fecha: '2024-01-01', monto: 100000 }],
  tramos: PRESET, fechaCorte: '2024-05-31' });
// 25.23+23.60+25.16 (TEA_Prop) + 7.21+4.42 (Activa) = 85.62%
check('interés (85,62% => $85.620)', G.interes, 85620, 0.5);

console.log('\nTest H — Generador de cuotas mensuales (día 11)');
var cu = E.generarCuotas({ montoMensual: 50000, desde: '2024-01', hasta: '2024-12' });
check('cantidad', cu.length, 12);
check('primera 2024-01-11', cu[0].fecha === '2024-01-11' ? 1 : 0, 1);

console.log('\nTest I — Días del mes: febrero bisiesto vs no bisiesto');
check('feb 2024 (bisiesto) = 29', E.diasDelMes(E.parseFecha('2024-02-15')), 29);
check('feb 2025 (no bisiesto) = 28', E.diasDelMes(E.parseFecha('2025-02-15')), 28);
check('feb 2028 (bisiesto) = 29', E.diasDelMes(E.parseFecha('2028-02-15')), 29);

console.log('\nTest J — Febrero NO bisiesto (2025) parcial: 01/02 a 14/02, TEA Prop 11,48%/mes');
var J = E.liquidar({ series: S, cuotas: [{ fecha: '2025-02-01', monto: 100000 }],
  tramos: [{ modo: 'serie', serie: 'TEA_Prop', desde: '2021-01-01', hasta: null }], fechaCorte: '2025-02-14' });
// 11,48% × 14/28 = 5,74% -> $5.740   (si usara 29 días daría $5.542, incorrecto)
check('interés (14/28 días => $5.740)', J.interes, 5740, 0.5);

console.log('\n----------------------------------------');
console.log(corridos + ' comprobaciones · ' + (corridos - fallos) + ' OK · ' + fallos + ' fallidas');
console.log(fallos === 0 ? '✓ TODOS LOS TESTS PASARON\n' : '✗ HAY FALLOS\n');
process.exit(fallos === 0 ? 0 : 1);
