/*
 * indemnizacion.js — Cálculo del capital indemnizatorio por rentas futuras
 * (incapacidad o fallecimiento). Neuquén / Argentina — art. 1746 CCyC.
 *
 * Puro: sin DOM. Corre en Node (module.exports) y navegador (window.Indemnizacion).
 *
 * Fórmula base (renta constante no perpetua) — Vuotto, Méndez y Acciarri constante:
 *     C = A · [ 1 − (1 + i)^(−n) ] / i           (equivale a  Σ_{t=1..n} A / (1+i)^t)
 *   A = renta anual afectada, i = tasa (decimal), n = años (renta al fin de cada año).
 *
 *   Vuotto : i = 6 %, n = 65 − edad, A = ingreso anual × afectación
 *   Méndez : i = 4 %, n = 75 − edad, A = ingreso anual × afectación × (60 / edad)
 *   Acciarri constante : i, n editables; A = ingreso anual × afectación
 *
 * Acciarri variable/probable (renta que varía por tramos):
 *     C = Σ_{t=1..n} ( ingreso_esperado_t · afectación ) / (1 + i)^t
 *   El ingreso esperado se arrastra por tramos: E_k = E_{k-1} + prob_k·(ingreso_k − E_{k-1}),
 *   con el primer tramo al 100 % (criterio García Alonso / planilla UNS).
 *
 * "afectación" es genérica: en INCAPACIDAD = % de incapacidad; en FALLECIMIENTO =
 * porción del ingreso destinada a los causahabientes. Mismas fórmulas, distinta etiqueta.
 *
 * Los ingresos se cargan en VALORES REALES (sin inflación); la tasa es PURA.
 */
(function (global) {
  'use strict';

  function num(x) { return typeof x === 'number' ? x : (parseFloat(x) || 0); }

  // Valor presente de una renta constante A, tasa i, durante n años (renta al fin de año).
  function pvConstante(A, i, n) {
    if (n <= 0) return 0;
    if (i === 0) return A * n;
    return A * (1 - Math.pow(1 + i, -n)) / i;
  }

  function desgloseConstante(A, i, n, edadIni) {
    var filas = [];
    for (var t = 1; t <= n; t++) {
      var factor = (i === 0) ? 1 : 1 / Math.pow(1 + i, t);
      filas.push({ edad: edadIni + t - 1, t: t, ingresoEsperado: A, rentaAfectada: A,
                   factor: factor, valorPresente: A * factor });
    }
    return filas;
  }

  function ingresoAnualDe(p) {
    if (p.ingresoAnual != null) return num(p.ingresoAnual);
    return num(p.ingresoMensual) * ((p.sac !== false) ? 13 : 12); // ×13 con SAC por defecto
  }

  function armar(nombre, A, i, n, edad, ingresoAnual, afect, extra) {
    var res = { formula: nombre, capital: pvConstante(A, i, n), rentaAnualAfectada: A,
                ingresoAnual: ingresoAnual, afectacion: afect, i: i, n: n,
                desglose: desgloseConstante(A, i, n, edad) };
    for (var k in extra) if (extra.hasOwnProperty(k)) res[k] = extra[k];
    return res;
  }

  // ---- Vuotto ----
  function vuotto(p) {
    var edad = num(p.edad), tasa = (p.tasa != null ? num(p.tasa) : 6), tope = (p.edadTope != null ? num(p.edadTope) : 65);
    var ingA = ingresoAnualDe(p), afect = num(p.afectacionPct) / 100;
    return armar('Vuotto', ingA * afect, tasa / 100, tope - edad, edad, ingA, afect, { edadTope: tope, tasa: tasa });
  }

  // ---- Méndez ----
  function mendez(p) {
    var edad = num(p.edad), tasa = (p.tasa != null ? num(p.tasa) : 4), tope = (p.edadTope != null ? num(p.edadTope) : 75);
    var ingA = ingresoAnualDe(p), afect = num(p.afectacionPct) / 100;
    var factorEdad = edad > 0 ? 60 / edad : 1;
    return armar('Méndez', ingA * afect * factorEdad, tasa / 100, tope - edad, edad, ingA * factorEdad, afect,
                 { edadTope: tope, tasa: tasa, factorEdad: factorEdad });
  }

  // ---- Acciarri (renta constante) ----
  function acciarriConstante(p) {
    var edad = num(p.edad), tasa = (p.tasa != null ? num(p.tasa) : 4), lim = (p.edadLimite != null ? num(p.edadLimite) : 75);
    var ingA = ingresoAnualDe(p), afect = num(p.afectacionPct) / 100;
    return armar('Acciarri (constante)', ingA * afect, tasa / 100, lim - edad, edad, ingA, afect,
                 { edadLimite: lim, tasa: tasa });
  }

  // ---- Acciarri (renta variable / probable) ----
  // tramos: [{ desdeEdad, ingresoAnual, prob }]  (el primero se toma al 100 %).
  function acciarriVariable(p) {
    var edad = num(p.edad), tasa = (p.tasa != null ? num(p.tasa) : 4), lim = (p.edadLimite != null ? num(p.edadLimite) : 75);
    var afect = num(p.afectacionPct) / 100, i = tasa / 100, n = lim - edad;
    var tramos = (p.tramos || []).map(function (t) {
      return { desdeEdad: num(t.desdeEdad), ingresoAnual: num(t.ingresoAnual), prob: (t.prob != null ? num(t.prob) : 1) };
    }).sort(function (a, b) { return a.desdeEdad - b.desdeEdad; });
    if (!tramos.length) throw new Error('Cargá al menos un tramo de ingreso.');

    // Ingreso esperado arrastrado (variación respecto del esperado anterior); 1º tramo al 100 %.
    var Eprev = 0;
    tramos.forEach(function (t, k) {
      var prob = (k === 0) ? 1 : t.prob;
      t.esperado = Eprev + prob * (t.ingresoAnual - Eprev);
      Eprev = t.esperado;
    });
    function tramoEn(age) { var sel = tramos[0]; for (var k = 0; k < tramos.length; k++) if (tramos[k].desdeEdad <= age) sel = tramos[k]; return sel; }

    var C = 0, desglose = [];
    for (var t = 1; t <= n; t++) {
      var age = edad + t - 1, tr = tramoEn(age);
      var renta = tr.esperado * afect, factor = (i === 0) ? 1 : 1 / Math.pow(1 + i, t);
      C += renta * factor;
      desglose.push({ edad: age, t: t, ingresoEsperado: tr.esperado, rentaAfectada: renta, factor: factor, valorPresente: renta * factor });
    }
    return { formula: 'Acciarri (variable)', capital: C, afectacion: afect, i: i, n: n,
             edadLimite: lim, tasa: tasa, tramos: tramos, desglose: desglose };
  }

  // ---- Comparativa de las tres fórmulas clásicas ----
  function comparativa(p) { return { vuotto: vuotto(p), mendez: mendez(p), acciarri: acciarriConstante(p) }; }

  // ---- Agotamiento del capital (art. 1746 CCyC) ----
  // Demuestra que el capital, reinvertido a la tasa pura, se consume con las
  // extracciones anuales (renta afectada) hasta llegar a ~0 al final del período.
  function agotamiento(res) {
    var i = res.i, cap = res.capital, filas = [];
    (res.desglose || []).forEach(function (y) {
      var antes = cap * (1 + i);
      var remanente = antes - y.rentaAfectada;
      filas.push({ edad: y.edad, antes: antes, extraccion: y.rentaAfectada, remanente: remanente });
      cap = remanente;
    });
    return filas;
  }

  // ---- LRT: ingreso base por RIPTE (art. 12.1 LRT) ----
  // salarios: [{mes:'YYYY-MM', monto}]. Cada salario se actualiza por RIPTE hasta el mes de la
  // PMI y se promedian. IB = (1/n) Σ salario_i × (RIPTE_PMI / RIPTE_mes_i).
  function ibPorRipte(salarios, mesPMI, ripte) {
    if (!ripte) throw new Error('Falta la serie RIPTE.');
    var rPMI = ripte[mesPMI];
    if (rPMI == null) throw new Error('Sin índice RIPTE para la PMI (' + mesPMI + ').');
    var arr = (salarios || []).filter(function (s) { return s.mes && +s.monto; });
    if (!arr.length) throw new Error('Cargá los salarios del ingreso base.');
    var suma = 0, detalle = [];
    arr.forEach(function (s) {
      var rm = ripte[s.mes];
      if (rm == null) throw new Error('Sin índice RIPTE para ' + s.mes + '.');
      var coef = rPMI / rm, act = (+s.monto) * coef;
      suma += act;
      detalle.push({ mes: s.mes, monto: +s.monto, ripteMes: rm, coef: coef, actualizado: act });
    });
    return { ib: suma / arr.length, n: arr.length, riptePMI: rPMI, mesPMI: mesPMI, detalle: detalle };
  }

  // ---- LRT: prestación dineraria (art. 14, ap. 2, inc. a) ----
  //   Prestación = 53 × IB × (65/edad) × %incap ; +20% (art. 3 Ley 26773) opcional ; mín. = piso.
  function indemnizacionLRT(p) {
    var edad = num(p.edad), ib = num(p.ib), piso = num(p.piso || 0), adic20 = !!p.adicional20;
    var muerte = p.supuesto === 'fallecimiento';
    var incap = muerte ? 1 : num(p.incapacidadPct) / 100;   // fallecimiento: sin % (art. 18 → 15.2)
    var coefEdad = edad > 0 ? 65 / edad : 0;
    var prest14 = 53 * ib * coefEdad * incap;
    var base = Math.max(prest14, piso);
    var adicMonto = adic20 ? base * 0.20 : 0;
    var pagoUnico = num(p.adicionalPagoUnico || 0);          // art. 11.4 (fallecimiento), manual/opcional
    return { formula: muerte ? 'Indemnización LRT — fallecimiento (art. 18 → 15.2)' : 'Indemnización LRT (art. 14.2.a)',
             muerte: muerte, coef53: 53, ib: ib, edad: edad, coefEdad: coefEdad,
             incapacidadPct: muerte ? 100 : num(p.incapacidadPct), prestacion14: prest14, piso: piso,
             usoPiso: piso > prest14, base: base, adicional20: adicMonto, adicionalPagoUnico: pagoUnico,
             total: base + adicMonto + pagoUnico };
  }

  function formatearMoneda(nm) {
    var neg = nm < 0; nm = Math.abs(nm);
    var s = (Math.round(nm * 100) / 100).toFixed(2).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + '$ ' + s[0] + ',' + s[1];
  }

  var api = { pvConstante: pvConstante, vuotto: vuotto, mendez: mendez,
              acciarriConstante: acciarriConstante, acciarriVariable: acciarriVariable,
              comparativa: comparativa, agotamiento: agotamiento,
              ibPorRipte: ibPorRipte, indemnizacionLRT: indemnizacionLRT, formatearMoneda: formatearMoneda };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Indemnizacion = api;

})(typeof window !== 'undefined' ? window : this);
