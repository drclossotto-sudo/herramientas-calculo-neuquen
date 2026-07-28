/*
 * Tests del motor de indemnización. Correr con:  node tests/indemnizacion.test.js
 */
var I = require('../src/indemnizacion.js');
var fallos = 0, corridos = 0;
function check(n, real, esp, tol) { corridos++; var ok = Math.abs(real - esp) <= (tol || 0.01);
  if (!ok) { fallos++; console.log('  ✗ ' + n + '  -> ' + real + ' (esperaba ' + esp + ')'); } else console.log('  ✓ ' + n + ' = ' + real); }
function sum(a) { return a.reduce(function (s, x) { return s + x.valorPresente; }, 0); }

console.log('\nTest 1 — Valor presente (renta constante), valores a mano');
check('pv(100, 10%, 1) = 90,9091', I.pvConstante(100, 0.10, 1), 90.909090, 1e-4);
check('pv(100, 10%, 2) = 173,5537', I.pvConstante(100, 0.10, 2), 173.553719, 1e-4);
check('pv(A,0%,n) = A·n', I.pvConstante(100, 0, 5), 500);
check('pv con n<=0 = 0', I.pvConstante(100, 0.1, 0), 0);

console.log('\nTest 2 — Acciarri constante: el desglaje suma el capital');
var ac = I.acciarriConstante({ edad: 40, edadLimite: 42, afectacionPct: 100, tasa: 10, ingresoAnual: 100 });
check('n = 2 (límite no incluida)', ac.n, 2);
check('capital = pv(100,10%,2)', ac.capital, 173.553719, 1e-4);
check('Σ desglose == capital', sum(ac.desglose), ac.capital, 1e-6);

console.log('\nTest 3 — Acciarri variable con un solo tramo == constante');
var av = I.acciarriVariable({ edad: 40, edadLimite: 42, afectacionPct: 100, tasa: 10,
  tramos: [{ desdeEdad: 40, ingresoAnual: 100, prob: 1 }] });
check('variable(1 tramo) == constante', av.capital, ac.capital, 1e-6);

console.log('\nTest 4 — Vuotto: n = 65−edad, i = 6%');
var vu = I.vuotto({ edad: 35, ingresoMensual: 100000, sac: true, afectacionPct: 100 });
check('n = 30', vu.n, 30);
check('i = 0.06', vu.i, 0.06, 1e-9);
check('renta anual afectada = 1.300.000 (×13)', vu.rentaAnualAfectada, 1300000);
check('Σ desglose == capital', sum(vu.desglose), vu.capital, 0.01);

console.log('\nTest 5 — Méndez: n = 75−edad, factor 60/edad, i = 4%');
var me = I.mendez({ edad: 30, ingresoMensual: 100, sac: false, afectacionPct: 100 });
check('n = 45', me.n, 45);
check('factor 60/30 = 2', me.factorEdad, 2, 1e-9);
check('renta anual = 1200 × 2 = 2400', me.rentaAnualAfectada, 2400);

console.log('\nTest 6 — Fallecimiento (afectación = porción a causahabientes)');
var fa = I.acciarriConstante({ edad: 40, edadLimite: 42, afectacionPct: 70, tasa: 10, ingresoAnual: 100 });
check('porción 70% => pv(70,10%,2)', fa.capital, I.pvConstante(70, 0.10, 2), 1e-6);

console.log('\nTest 7 — Acciarri variable: ingreso esperado arrastrado');
// Tramo1 100 (100%), Tramo2 200 con prob 50% => esperado tramo2 = 100 + 0.5·(200−100) = 150
var av2 = I.acciarriVariable({ edad: 40, edadLimite: 44, afectacionPct: 100, tasa: 0,
  tramos: [{ desdeEdad: 40, ingresoAnual: 100 }, { desdeEdad: 42, ingresoAnual: 200, prob: 0.5 }] });
check('esperado tramo2 = 150', av2.tramos[1].esperado, 150);
// tasa 0: capital = 100+100 (edad 40,41) + 150+150 (edad 42,43) = 500
check('capital (tasa 0) = 500', av2.capital, 500);

console.log('\nTest 8 — Agotamiento del capital llega a ~0 al final');
var ac2 = I.acciarriConstante({ edad:40, edadLimite:45, afectacionPct:100, tasa:5, ingresoAnual:1000000 });
var ag = I.agotamiento(ac2);
check('cantidad de años = 5', ag.length, 5);
check('capital antes año 1 = C × 1,05', ag[0].antes, ac2.capital * 1.05, 0.01);
check('primera extracción = renta anual', ag[0].extraccion, 1000000);
check('remanente final ≈ 0 (capital agotado)', ag[ag.length-1].remanente, 0, 0.01);

console.log('\nTest 9 — LRT: prestación art. 14 (53 × IB × 65/edad × %incap)');
var lrt = I.indemnizacionLRT({ edad:65, incapacidadPct:50, ib:100000 });
check('coef edad = 65/65 = 1', lrt.coefEdad, 1);
check('prestación = 53×100000×1×50% = 2.650.000', lrt.total, 2650000);
check('con 20% adicional = 3.180.000', I.indemnizacionLRT({edad:65,incapacidadPct:50,ib:100000,adicional20:true}).total, 3180000);
check('piso 3M > fórmula → base=piso; +20% = 3.600.000', I.indemnizacionLRT({edad:65,incapacidadPct:50,ib:100000,piso:3000000,adicional20:true}).total, 3600000);

console.log('\nTest 10 — LRT: ingreso base por RIPTE');
var RIP = require('../data/tasas.json').ripte;
check('coef=1 (mismo mes): IB = promedio simple', I.ibPorRipte([{mes:'2024-03',monto:600000},{mes:'2024-03',monto:400000}],'2024-03',RIP).ib, 500000);
check('actualizado por RIPTE (×705832.58/555269.16)', I.ibPorRipte([{mes:'2024-01',monto:500000}],'2024-03',RIP).ib, 500000*(705832.58/555269.16), 0.01);

console.log('\nTest 11 — LRT fallecimiento (sin porcentaje; art. 18 → 15.2)');
var mu = I.indemnizacionLRT({ supuesto:'fallecimiento', edad:65, ib:100000 });
check('muerte: 53×100000×(65/65) = 5.300.000 (sin %)', mu.total, 5300000);
check('con +20% y pago único (art.11.4): 5.3M×1,2 + 1M = 7.360.000',
  I.indemnizacionLRT({supuesto:'fallecimiento',edad:65,ib:100000,adicional20:true,adicionalPagoUnico:1000000}).total, 7360000);

console.log('\n========================================');
console.log(corridos + ' comprobaciones · ' + (corridos - fallos) + ' OK · ' + fallos + ' fallidas');
console.log(fallos === 0 ? '✓ MOTOR DE INDEMNIZACIÓN OK' : '✗ HAY FALLOS');

// ---- Casos para validar contra García Alonso (mismos inputs) ----
console.log('\n--- CASOS PARA VALIDAR CONTRA GARCÍA ALONSO ---');
var base = { edad: 35, ingresoMensual: 500000, sac: true, afectacionPct: 60 };
console.log('Inputs: edad 35 · ingreso mensual $500.000 (×13) · incapacidad 60%');
console.log('  Vuotto  (i 6%, tope 65): ' + I.formatearMoneda(I.vuotto(base).capital));
console.log('  Méndez  (i 4%, tope 75): ' + I.formatearMoneda(I.mendez(base).capital));
console.log('  Acciarri constante (i 4%, edad límite 75): ' + I.formatearMoneda(I.acciarriConstante({ edad: 35, ingresoMensual: 500000, sac: true, afectacionPct: 60, edadLimite: 75 }).capital));

process.exit(fallos === 0 ? 0 : 1);
