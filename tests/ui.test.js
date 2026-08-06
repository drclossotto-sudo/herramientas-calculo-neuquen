/*
 * Smoke-test de la interfaz (headless, con jsdom).
 * Carga dist/index.html (autocontenido), simula el uso real y verifica que el
 * resultado mostrado coincida con el motor. Correr con:  node tests/ui.test.js
 * (requiere: node build.js  y  npm install)
 */
var fs = require('fs'), path = require('path');
var { JSDOM } = require('jsdom');
var E = require('../src/engine.js');
var SERIES = require('../data/tasas.json').series;

var fallos = 0;
function ok(n, cond){ if(!cond){ fallos++; console.log('  ✗ ' + n); } else console.log('  ✓ ' + n); }
function aprox(a,b){ return Math.abs(a-b) < 0.02; }

var html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
var errores = [];
var dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse: function(w){ w.HTMLElement.prototype.scrollIntoView = function(){}; w.scrollTo = function(){}; } });
var w = dom.window, d = w.document;
dom.virtualConsole.on('jsdomError', function(e){ errores.push(e.message); });

console.log('\nUI Test 1 — carga inicial (pantalla de inicio)');
ok('motores y tasas embebidos', !!w.LiquidadorEngine && !!w.TASAS && !!w.Indemnizacion);
ok('inicio visible al cargar', d.getElementById('home').style.display !== 'none');
ok('módulos ocultos al inicio', d.getElementById('tabIntereses').style.display === 'none' && d.getElementById('tabIndemnizacion').style.display === 'none');
d.querySelector('#home [data-go="intereses"]').click();
ok('entra al módulo intereses', d.getElementById('tabIntereses').style.display !== 'none' && d.getElementById('home').style.display === 'none');
ok('preset Casas con 3 filas (previo 2021 + TEA + Activa)', d.querySelectorAll('#tTramos tbody tr').length === 3);

console.log('\nUI Test 1c — regresión: deuda anterior a 2021 (preset Casas cubre el tramo previo)');
var oldDebt = E.liquidar({ series: SERIES,
  cuotas: [{fecha:'2020-01-11', monto:100000}],
  tramos: [{modo:'serie',serie:'Activa',  desde:'2000-01-01',hasta:'2020-12-31'},
           {modo:'serie',serie:'TEA_Prop',desde:'2021-01-01',hasta:'2024-03-31'},
           {modo:'serie',serie:'Activa',  desde:'2024-04-01',hasta:null}],
  fechaCorte: '2026-07-29' });
ok('cuota 2020-01 → corte 2026 liquida sin "Sin tasa definida"', oldDebt.capital === 100000 && oldDebt.total > 100000);
ok('el primer devengamiento arranca en 2020-01 (no en 2021)', oldDebt.filas.some(function(f){ return f.mes === '2020-01'; }));

console.log('\nUI Test 1b — selector de fecha (columnas mes/año + almanaque)');
ok('campos de fecha son datefield readonly', d.getElementById('corte').classList.contains('datefield') && d.getElementById('corte').readOnly);
ok('el "Hasta" del generador es día exacto (datefield)', d.getElementById('genHasta').classList.contains('datefield'));
ok('el "Desde" del generador es mes (monthfield)', d.getElementById('genDesde').classList.contains('monthfield'));
d.getElementById('corte').dispatchEvent(new w.Event('focusin', { bubbles: true }));
var dpop = d.querySelector('.dpop');
ok('el selector se abre', !!dpop && dpop.style.display === 'block');
ok('tiene columnas de mes y año', !!d.querySelector('.dpop .dp-months .dp-mo') && !!d.querySelector('.dpop .dp-years .dp-yr'));
ok('tiene almanaque de días', !!d.querySelector('.dpop .dp-day'));
d.querySelector('.dpop .dp-day').click();
ok('al elegir un día, el campo toma formato ISO', /^\d{4}-\d{2}-\d{2}$/.test(d.getElementById('corte').value));

console.log('\nUI Test 2 — generar cuotas + calcular (suma fija)');
d.getElementById('genMonto').value = '100000';
d.getElementById('genDia').value = '11';
d.getElementById('genDesde').value = '2024-01';
d.getElementById('genHasta').value = '2024-03-31';
d.getElementById('btnGen').click();
ok('generó 3 cuotas', d.querySelectorAll('#tCuotas tbody tr').length === 3);
ok('el "Hasta" fijó la fecha de corte', d.getElementById('corte').value === '2024-03-31');
d.getElementById('corte').value = '2024-03-31';
d.getElementById('btnCalcular').click();
ok('resultado visible', d.getElementById('resultado').style.display === 'block');
var uiRes = w.__ULT.res;
var eng = E.liquidar({ series: SERIES,
  cuotas: [{fecha:'2024-01-11',monto:100000},{fecha:'2024-02-11',monto:100000},{fecha:'2024-03-11',monto:100000}],
  tramos: [{modo:'serie',serie:'TEA_Prop',desde:'2021-01-01',hasta:'2024-03-31'},
           {modo:'serie',serie:'Activa',desde:'2024-04-01',hasta:null}],
  fechaCorte: '2024-03-31' });
ok('capital = 300.000', uiRes.capital === 300000);
ok('total UI == total motor (' + eng.total.toFixed(2) + ')', aprox(uiRes.total, eng.total));
ok('bloque de total para impresión poblado', /Total adeudado/.test(d.getElementById('printTotal').innerHTML));
ok('encabezado/autoría marcados noprint', d.querySelector('header.app').classList.contains('noprint') && d.querySelector('footer.author').classList.contains('noprint'));
ok('título neutro solo-impresión presente', /Liquidación de intereses/.test(d.getElementById('printTitulo').innerHTML));

console.log('\nUI Test 3 — agregar un pago y recalcular');
d.getElementById('btnAddPago').click();
var pin = d.querySelectorAll('#tPagos tbody input');
pin[0].value = '2024-02-11'; pin[0].dispatchEvent(new w.Event('change'));
pin[1].value = '50000';      pin[1].dispatchEvent(new w.Event('change'));
d.getElementById('btnCalcular').click();
var uiRes2 = w.__ULT.res;
var eng2 = E.liquidar({ series: SERIES,
  cuotas: [{fecha:'2024-01-11',monto:100000},{fecha:'2024-02-11',monto:100000},{fecha:'2024-03-11',monto:100000}],
  pagos: [{fecha:'2024-02-11',monto:50000}],
  tramos: [{modo:'serie',serie:'TEA_Prop',desde:'2021-01-01',hasta:'2024-03-31'},
           {modo:'serie',serie:'Activa',desde:'2024-04-01',hasta:null}],
  fechaCorte: '2024-03-31' });
ok('pago imputado (total pagos = 50.000)', uiRes2.totalPagos === 50000);
ok('total con pago UI == motor (' + eng2.total.toFixed(2) + ')', aprox(uiRes2.total, eng2.total));

console.log('\nUI Test 3b — agregar dos períodos con montos distintos (suma fija variable)');
d.querySelector('#modoCuota button[data-m="fija"]').click();
d.getElementById('btnClearCuotas').click();
while(d.querySelector('#tPagos [data-del]')) d.querySelector('#tPagos [data-del]').click(); // limpiar pagos del test anterior
d.getElementById('genMonto').value='50000'; d.getElementById('genDesde').value='2024-01'; d.getElementById('genHasta').value='2024-03-31'; d.getElementById('btnGen').click();
d.getElementById('genMonto').value='80000'; d.getElementById('genDesde').value='2024-04'; d.getElementById('genHasta').value='2024-05-31'; d.getElementById('btnGen').click();
ok('5 filas (3 + 2 apilados)', d.querySelectorAll('#tCuotas tbody tr').length === 5);
d.getElementById('corte').value='2024-05-31'; d.getElementById('btnCalcular').click();
var uiRes3 = w.__ULT.res;
var eng3 = E.liquidar({ series: SERIES, cuotas: [
  {fecha:'2024-01-11',monto:50000},{fecha:'2024-02-11',monto:50000},{fecha:'2024-03-11',monto:50000},
  {fecha:'2024-04-11',monto:80000},{fecha:'2024-05-11',monto:80000}],
  tramos: [{modo:'serie',serie:'TEA_Prop',desde:'2021-01-01',hasta:'2024-03-31'},
           {modo:'serie',serie:'Activa',desde:'2024-04-01',hasta:null}], fechaCorte:'2024-05-31' });
ok('capital = 310.000 (3×50k + 2×80k)', uiRes3.capital === 310000);
ok('total UI == motor', aprox(uiRes3.total, eng3.total));
d.getElementById('btnClearCuotas').click();
d.getElementById('genMonto').value='100000'; d.getElementById('genDesde').value='2024-01'; d.getElementById('genHasta').value='2024-03-31'; d.getElementById('btnGen').click();

console.log('\nUI Test 4 — cambio a modo porcentaje');
d.querySelector('#modoCuota button[data-m="pct"]').click();
ok('aparece campo Base neta en generador', d.getElementById('genBaseWrap').style.display !== 'none');
ok('columna Base neta en la tabla', /Base neta/.test(d.getElementById('tCuotas').innerHTML));

console.log('\nUI Test 4b — modo Civil / Daños');
d.querySelector('#selMateria button[data-mat="civil"]').click();
ok('sección 1 → "Capital / rubros"', /Capital \/ rubros/.test(d.getElementById('sec1titulo').textContent));
ok('generador mensual oculto', d.getElementById('genWrap').style.display === 'none');
ok('toggle fija/% oculto', d.getElementById('modoCuotaWrap').style.display === 'none');
ok('art. 552 oculto en civil', d.getElementById('adic552Wrap').style.display === 'none');
ok('capitalización (art. 770) sigue disponible', d.getElementById('capOn') !== null);
d.getElementById('btnClearCuotas').click();
d.getElementById('btnAddCuota').click();
var cin = d.querySelectorAll('#tCuotas tbody input');
cin[0].value='2024-01-11'; cin[0].dispatchEvent(new w.Event('change'));  // fecha de mora
cin[2].value='100000';     cin[2].dispatchEvent(new w.Event('change'));  // monto (cin[1]=concepto)
d.getElementById('corte').value='2024-03-31'; d.getElementById('btnCalcular').click();
var uiC = w.__ULT.res;
var engC = E.liquidar({ series: SERIES, cuotas:[{fecha:'2024-01-11',monto:100000}],
  tramos:[{modo:'serie',serie:'TEA_Prop',desde:'2021-01-01',hasta:'2024-03-31'},
          {modo:'serie',serie:'Activa',desde:'2024-04-01',hasta:null}], fechaCorte:'2024-03-31' });
ok('civil: capital único = 100.000', uiC.capital === 100000);
ok('civil: total == calculador oficial ($165.851,29)', aprox(uiC.total, engC.total));
ok('civil: título de impresión neutro (sin "cuota alimentaria")',
   /Liquidación de intereses/.test(d.getElementById('printTitulo').innerHTML) && !/cuota alimentaria/.test(d.getElementById('printTitulo').innerHTML));

console.log('\nUI Test 4c — módulo Indemnización (pestaña 2)');
var IN = require('../src/indemnizacion.js');
d.querySelector('#tabIntereses [data-home]').click();          // volver a inicio
ok('botón "Inicio" vuelve al home', d.getElementById('home').style.display !== 'none');
d.querySelector('#home [data-go="indemnizacion"]').click();
ok('pestaña intereses oculta', d.getElementById('tabIntereses').style.display === 'none');
ok('pestaña indemnización visible', d.getElementById('tabIndemnizacion').style.display !== 'none');
d.getElementById('iEdad').value='35'; d.getElementById('iAfect').value='60';
d.getElementById('iForma').value='mensual'; d.getElementById('iSac').value='13'; d.getElementById('iIngreso').value='500000';
d.getElementById('btnCalcularInd').click();
ok('resultado indemnización visible', d.getElementById('resInd').style.display === 'block');
var uiInd = w.__IND;
var engV = IN.vuotto({ edad:35, ingresoAnual:6500000, afectacionPct:60, tasa:6, edadTope:65 });
var engM = IN.mendez({ edad:35, ingresoAnual:6500000, afectacionPct:60, tasa:4, edadTope:75 });
ok('Vuotto UI == motor ($53.682.841)', aprox(uiInd.comp.vuotto.capital, engV.capital));
ok('Méndez UI == motor ($132.328.831)', aprox(uiInd.comp.mendez.capital, engM.capital));
ok('planilla principal = Acciarri', uiInd.res.formula.indexOf('Acciarri') >= 0);
ok('tabla de agotamiento (40 años)', d.querySelectorAll('#tAgota tbody tr').length === 40);
d.querySelector('#kpisInd [data-formula="mendez"]').click();
ok('al tocar Méndez, la planilla pasa a Méndez', /Méndez/.test(d.getElementById('tituloPlanillaInd').textContent));
ok('muestra la fórmula aplicada', /Fórmula aplicada/.test(d.getElementById('formulaBox').innerHTML));
d.querySelector('#selFormula button[data-f="variable"]').click();
ok('params Acciarri variable visibles', d.getElementById('fParamsVar').style.display !== 'none');
d.getElementById('btnCalcularInd').click();
ok('capital Acciarri variable > 0', w.__IND.res.capital > 0);

console.log('\nUI Test 4c-bis — régimen LRT (indemnización art. 14)');
d.querySelector('#selRegimen button[data-r="lrt"]').click();
ok('régimen LRT visible, civil oculto', d.getElementById('regLRT').style.display !== 'none' && d.getElementById('regCivil').style.display === 'none');
d.getElementById('lEdad').value='65'; d.getElementById('lIncap').value='50'; d.getElementById('lIB').value='100000';
d.getElementById('btnCalcularLRT').click();
ok('LRT: resultado visible', d.getElementById('resLRT').style.display === 'block');
ok('LRT: total = 53×100000×(65/65)×50% = 2.650.000', aprox(w.__LRT.total, 2650000));
d.getElementById('lAdic').checked = true; d.getElementById('btnCalcularLRT').click();
ok('LRT con +20% = 3.180.000', aprox(w.__LRT.total, 3180000));
d.querySelector('#selSupuestoLRT button[data-s="fallecimiento"]').click();
ok('fallecimiento: campo % oculto', d.getElementById('grpIncap').style.display === 'none');
d.getElementById('lAdic').checked = false; d.getElementById('btnCalcularLRT').click();
ok('LRT fallecimiento: 53×100000×1 = 5.300.000 (sin %)', aprox(w.__LRT.total, 5300000));

d.querySelector('#tabIndemnizacion [data-home]').click(); // volver a inicio

console.log('\nUI Test 4d — materia Accidentes de trabajo (LRT / Trotelli)');
d.querySelector('#home [data-go="intereses"]').click();
d.querySelector('#selMateria button[data-mat="lrt"]').click();
ok('nota LRT visible', d.getElementById('lrtNota').style.display !== 'none');
ok('art. 552 oculto en LRT', d.getElementById('adic552Wrap').style.display === 'none');
ok('modelo capital (sec1 = "Capital / rubros")', /Capital \/ rubros/.test(d.getElementById('sec1titulo').textContent));
ok('preset LRT usa TNA Banco Nación', /Banco Naci/.test(d.getElementById('tTramos').innerHTML));
d.getElementById('btnClearCuotas').click();
d.getElementById('btnAddCuota').click();
var lc = d.querySelectorAll('#tCuotas tbody input');
lc[0].value='2024-01-11'; lc[0].dispatchEvent(new w.Event('change'));   // fecha de mora
lc[2].value='100000';     lc[2].dispatchEvent(new w.Event('change'));   // capital
d.getElementById('corte').value='2024-12-31'; d.getElementById('btnCalcular').click();
var uiL = w.__ULT.res;
var engL = E.liquidar({ series: SERIES, cuotas:[{fecha:'2024-01-11',monto:100000}],
  tramos:[{modo:'serie',serie:'TEA_Prop',desde:'2021-01-01',hasta:'2024-03-31'},
          {modo:'serie',serie:'TNA_BNA',desde:'2024-04-01',hasta:null}], fechaCorte:'2024-12-31' });
ok('LRT: capital único = 100.000', uiL.capital === 100000);
ok('LRT: total UI == motor (TEA Sucursales → TNA BNA)', aprox(uiL.total, engL.total));
d.querySelector('#tabIntereses [data-home]').click();

console.log('\nUI Test 5 — sin errores de ejecución');
ok('sin jsdomError', errores.length === 0);
if (errores.length) errores.forEach(function(e){ console.log('    · ' + e.split('\n')[0]); });

console.log('\n----------------------------------------');
console.log(fallos === 0 ? '✓ UI OK\n' : '✗ ' + fallos + ' FALLOS EN UI\n');
process.exit(fallos === 0 ? 0 : 1);
