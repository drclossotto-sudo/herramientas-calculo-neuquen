/*
 * build.js — genera dist/index.html AUTOCONTENIDO (un solo archivo, sin dependencias).
 * Fuente de verdad: index.html (versión de desarrollo que carga src/engine.js y data/tasas.js).
 * Este build reemplaza esos <script src> por el código embebido.
 * Correr con:  node build.js
 */
var fs = require('fs');
var path = require('path');
var root = __dirname;

var html   = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var engine = fs.readFileSync(path.join(root, 'src', 'engine.js'), 'utf8');
var indem  = fs.readFileSync(path.join(root, 'src', 'indemnizacion.js'), 'utf8');
var tasas  = fs.readFileSync(path.join(root, 'data', 'tasas.json'), 'utf8');

// Regenerar el wrapper data/tasas.js — es lo que carga la versión de desarrollo
// (root index.html) y, por lo tanto, el sitio publicado en GitHub Pages.
// Antes NO se regeneraba: las actualizaciones de tasas.json no llegaban al sitio.
fs.writeFileSync(path.join(root, 'data', 'tasas.js'),
  '/* Generado desde data/tasas.json — NO editar a mano */\nwindow.TASAS = ' + tasas + ';\n');

html = html.replace('<script src="src/engine.js"></script>', '<script>\n' + engine + '\n</script>');
html = html.replace('<script src="src/indemnizacion.js"></script>', '<script>\n' + indem + '\n</script>');
html = html.replace('<script src="data/tasas.js"></script>', '<script>\nwindow.TASAS = ' + tasas + ';\n</script>');

if (html.indexOf('src="src/engine.js"') !== -1 || html.indexOf('src="src/indemnizacion.js"') !== -1 || html.indexOf('src="data/tasas.js"') !== -1)
  throw new Error('No se pudieron reemplazar los <script src>. Revisá index.html.');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log('dist/index.html generado — ' + Math.round(html.length / 1024) + ' KB, autocontenido.');
console.log('data/tasas.js regenerado desde data/tasas.json (lo carga el sitio publicado).');
