/*
 * engine.js — Motor de cálculo del Liquidador de Intereses sobre Alimentos (Neuquén)
 *
 * Puro: sin DOM. Corre en Node (module.exports) y en el navegador (window.LiquidadorEngine).
 *
 * MÉTODO (calibrado contra el calculador oficial del Poder Judicial de Neuquén,
 * cintereses.agjusneuquen.gob.ar — validado al centavo, ver referencias/calibracion.md):
 *
 *   Las tasas son MENSUALES (% por mes). Para cada segmento dentro de un mes M:
 *       interés = capital × (tasaMensual_M / 100) × (díasDelSegmento / díasDelMes_M)
 *   Un mes completo devenga la tasa mensual plena; un mes parcial, proporcional a
 *   los días. El cómputo es INCLUSIVE: la cuota devenga desde su mora (día 11) y
 *   hasta la fecha de corte inclusive (por eso el fin del cálculo = corte + 1 día).
 *
 * Base legal:
 *   - Art. 552 CCyC : intereses sobre alimentos (mora desde el vencimiento; adicional judicial opcional).
 *   - Arts. 900-901 : imputación a la deuda más antigua (satisfecho por el modelo agregado).
 *   - Art. 903 CCyC : el pago se imputa PRIMERO a intereses, luego a capital.
 *   - Art. 770 CCyC : capitalización (anatocismo) — apagada por defecto, opcional por hitos.
 */
(function (global) {
  'use strict';

  var MS_DIA = 86400000;
  var MESES = ['01','02','03','04','05','06','07','08','09','10','11','12'];

  // ---- Utilidades de fecha (UTC) ----
  function parseFecha(s) {
    if (s instanceof Date) return Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m) throw new Error('Fecha inválida: "' + s + '" (se espera YYYY-MM-DD)');
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }
  function diasEntre(a, b) { return Math.round((b - a) / MS_DIA); }
  function sumarDias(ts, n) { return ts + n * MS_DIA; }
  function fechaISO(ts) {
    var d = new Date(ts);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') +
           '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function ym(ts) { var d = new Date(ts); return d.getUTCFullYear() + '-' + MESES[d.getUTCMonth()]; }
  function primerDiaMesSiguiente(ts) { var d = new Date(ts); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); }
  function diasDelMes(ts) { var d = new Date(ts); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); }

  function tramoEn(tramos, ts) {
    for (var i = 0; i < tramos.length; i++) {
      var t = tramos[i];
      if (ts >= t._desde && (t._hasta === null || ts <= t._hasta)) return t;
    }
    return null;
  }

  // Tasa MENSUAL (%) de la tasa base de un tramo, para el mes del segmento que empieza en ts.
  function tasaMensualBase(tramo, ts, series) {
    switch (tramo.modo) {
      case 'serie':
        var s = series && series[tramo.serie];
        if (!s) throw new Error('Serie de tasa no cargada: ' + tramo.serie);
        var v = s[ym(ts)];
        if (v == null) throw new Error('Falta la tasa "' + tramo.serie + '" para ' + ym(ts));
        return v;
      case 'mensual_fija': return tramo.valor;        // tasa mensual constante (%)
      case 'anual':        return tramo.valor / 12;   // tasa anual -> proporcional mensual
      default: throw new Error('Modo de tramo desconocido: ' + tramo.modo);
    }
  }

  // ---- Generador de cuotas mensuales (día 11 por defecto) ----
  function generarCuotas(cfg) {
    var dia = cfg.dia || 11;
    var d = /^(\d{4})-(\d{2})$/.exec(cfg.desde), h = /^(\d{4})-(\d{2})$/.exec(cfg.hasta);
    if (!d || !h) throw new Error('desde/hasta deben ser YYYY-MM');
    var y = +d[1], m = +d[2], yh = +h[1], mh = +h[2], out = [];
    while (y < yh || (y === yh && m <= mh)) {
      var mm = String(m).padStart(2, '0');
      out.push({ fecha: y + '-' + mm + '-' + String(dia).padStart(2, '0'), monto: cfg.montoMensual,
                 etiqueta: 'Cuota ' + mm + '/' + y });
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }

  // ---- Núcleo: liquidación ----
  function liquidar(input) {
    var series = input.series || {};

    var tramos = (input.tramos || []).map(function (t) {
      return { modo: t.modo || 'serie', serie: t.serie, valor: t.valor, etiqueta: t.etiqueta || '',
               _desde: parseFecha(t.desde), _hasta: t.hasta ? parseFecha(t.hasta) : null };
    }).sort(function (a, b) { return a._desde - b._desde; });

    var cuotas = (input.cuotas || []).map(function (c) {
      return { _fecha: parseFecha(c.fecha), monto: c.monto, etiqueta: c.etiqueta || '' };
    }).sort(function (a, b) { return a._fecha - b._fecha; });

    var pagos = (input.pagos || []).map(function (p) {
      return { _fecha: parseFecha(p.fecha), monto: p.monto };
    }).sort(function (a, b) { return a._fecha - b._fecha; });

    var capOn = !!(input.capitalizacion && input.capitalizacion.activada);
    var hitos = capOn ? (input.capitalizacion.hitos || []).map(parseFecha) : [];

    if (cuotas.length === 0) throw new Error('No hay cuotas cargadas.');
    var corte = parseFecha(input.fechaCorte);
    var inicio = cuotas[0]._fecha;
    if (corte < inicio) throw new Error('La fecha de corte es anterior a la primera cuota.');
    var fin = sumarDias(corte, 1); // cómputo inclusive del día de corte

    // Adicional judicial (art. 552 in fine) — opcional. modo 'anual' (default) o 'mensual_fija'.
    var adic = (input.adicional && input.adicional.activada) ? {
      modo: input.adicional.modo || 'anual', valor: input.adicional.valor,
      tipo: input.adicional.tipo || 'TNA', etiqueta: input.adicional.etiqueta || 'Adicional judicial (art. 552)',
      _desde: input.adicional.desde ? parseFecha(input.adicional.desde) : inicio,
      _hasta: input.adicional.hasta ? parseFecha(input.adicional.hasta) : null
    } : null;

    // ---- Breakpoints ----
    var bps = {};
    function addBp(ts) { if (ts >= inicio && ts <= fin) bps[ts] = true; }       // estructurales
    function addEv(ts) { if (ts >= inicio && ts <= corte) bps[ts] = true; }     // eventos
    addBp(inicio); addBp(fin);
    cuotas.forEach(function (c) { addEv(c._fecha); });
    pagos.forEach(function (p) { addEv(p._fecha); });
    hitos.forEach(function (h) { addEv(h); });
    tramos.forEach(function (t) { addBp(t._desde); if (t._hasta !== null) addBp(sumarDias(t._hasta, 1)); });
    if (adic) { addBp(adic._desde); if (adic._hasta !== null) addBp(sumarDias(adic._hasta, 1)); }
    // Inicio de cada mes (para segmentar el devengo mes a mes)
    var cur = primerDiaMesSiguiente(inicio);
    while (cur < fin) { addBp(cur); cur = primerDiaMesSiguiente(cur); }

    var fechas = Object.keys(bps).map(Number).sort(function (a, b) { return a - b; });

    var capital = 0, interes = 0, totalCuotas = 0, totalPagos = 0, saldoAFavor = 0;
    var filas = [];

    for (var i = 0; i < fechas.length; i++) {
      var ts = fechas[i];

      // 1) Devengar sobre [prev, ts) — un solo mes y un solo tramo (garantizado por los breakpoints)
      if (i > 0) {
        var prev = fechas[i - 1], d = diasEntre(prev, ts);
        if (d > 0 && capital > 0) {
          var tr = tramoEn(tramos, prev);
          if (!tr) throw new Error('Sin tasa definida para el mes ' + ym(prev));
          var rBase = tasaMensualBase(tr, prev, series);
          var rAdic = 0;
          if (adic && prev >= adic._desde && (adic._hasta === null || prev <= adic._hasta)) {
            rAdic = adic.modo === 'anual' ? adic.valor / 12 : adic.valor;
          }
          var dMes = diasDelMes(prev), factor = d / dMes;
          var devengado = capital * ((rBase + rAdic) / 100) * factor;
          interes += devengado;
          var det = tr.etiqueta || (tr.modo === 'serie' ? tr.serie : (rBase + '% mensual'));
          if (rAdic > 0) det += ' + ' + adic.etiqueta + ' (' + rAdic.toFixed(2) + '%/mes)';
          filas.push({ tipo: 'devengamiento', desde: fechaISO(prev), hasta: fechaISO(sumarDias(ts, -1)),
            evento: 'Interés', detalle: det, mes: ym(prev), dias: d, diasMes: dMes,
            tasaMensualPct: rBase + rAdic, tasaBaseMensualPct: rBase, tasaAdicMensualPct: rAdic,
            capitalBase: capital, interesSegmento: devengado, capital: capital, interes: interes });
        }
      }

      // 2) Vencimiento de cuotas en ts
      for (var ci = 0; ci < cuotas.length; ci++) if (cuotas[ci]._fecha === ts) {
        capital += cuotas[ci].monto; totalCuotas += cuotas[ci].monto;
        filas.push({ tipo: 'cuota', fecha: fechaISO(ts), evento: 'Vence cuota', detalle: cuotas[ci].etiqueta,
          monto: cuotas[ci].monto, capital: capital, interes: interes });
      }

      // 3) Capitalización (art. 770) en ts
      if (capOn && hitos.indexOf(ts) !== -1 && interes > 0) {
        var capz = interes; capital += capz; interes = 0;
        filas.push({ tipo: 'capitalizacion', fecha: fechaISO(ts), evento: 'Capitalización (art. 770)',
          detalle: 'Interés incorporado al capital', capitalizado: capz, capital: capital, interes: interes });
      }

      // 4) Pagos en ts — imputación art. 903 (interés primero, luego capital)
      for (var pi = 0; pi < pagos.length; pi++) if (pagos[pi]._fecha === ts) {
        var restante = pagos[pi].monto; totalPagos += pagos[pi].monto;
        var aInteres = Math.min(restante, interes); interes -= aInteres; restante -= aInteres;
        var aCapital = Math.min(restante, capital); capital -= aCapital; restante -= aCapital;
        if (restante > 1e-9) saldoAFavor += restante;
        filas.push({ tipo: 'pago', fecha: fechaISO(ts), evento: 'Pago',
          detalle: 'Imputado a interés y luego a capital (art. 903)', pago: pagos[pi].monto,
          aInteres: aInteres, aCapital: aCapital, aFavor: restante > 1e-9 ? restante : 0,
          capital: capital, interes: interes });
      }
    }

    return {
      capital: capital, interes: interes, total: capital + interes,
      totalCuotas: totalCuotas, totalPagos: totalPagos, saldoAFavor: saldoAFavor,
      fechaCorte: fechaISO(corte), filas: filas
    };
  }

  function formatearMoneda(n) {
    var neg = n < 0; n = Math.abs(n);
    var s = (Math.round(n * 100) / 100).toFixed(2).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + '$ ' + s[0] + ',' + s[1];
  }

  var api = { liquidar: liquidar, generarCuotas: generarCuotas, formatearMoneda: formatearMoneda,
              parseFecha: parseFecha, fechaISO: fechaISO, diasEntre: diasEntre, diasDelMes: diasDelMes, ym: ym };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.LiquidadorEngine = api;

})(typeof window !== 'undefined' ? window : this);
