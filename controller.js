/**
 * controller.js — PC o'yinlarini Node.js va robotjs yordamida boshqarish
 *
 * Ishga tushurish:
 *   npm install robotjs
 *   node controller.js
 *
 * So'ng brauzerdan: http://localhost:5000/steer?action=left&gas=true&brake=false
 */

const http = require('http');
const url  = require('url');

let robot;
try {
  robot = require('robotjs');
} catch (e) {
  console.log('====================================');
  console.log("XATOLIK: robotjs moduli o'rnatilmagan.");
  console.log("Iltimos terminalda yozing: npm install robotjs");
  console.log('====================================');
  process.exit(1);
}

// ---- Holat ----
let currentAction = 'center';
let gasPressed    = false;
let brakePressed  = false;

// ---- Joriy bosilgan tugmalar ----
let leftAct  = false;
let rightAct = false;
let gasAct   = false;
let brakeAct = false;

// ---- Klaviatura yordamchilari ----
function pressKey(key) {
  try { robot.keyToggle(key, 'down'); } catch (_) {}
}
function releaseKey(key) {
  try { robot.keyToggle(key, 'up'); } catch (_) {}
}

// robotjs kalit nomlari: 'left', 'right', 'up', 'down', 'a', 'd', 'w', 's'

function applyKeys() {
  // ---- CHAP ----
  if (currentAction === 'left') {
    if (rightAct) { releaseKey('right'); releaseKey('d'); rightAct = false; }
    if (!leftAct) { pressKey('left');    pressKey('a');   leftAct  = true;  }
  }
  // ---- O'NG ----
  else if (currentAction === 'right') {
    if (leftAct)  { releaseKey('left');  releaseKey('a'); leftAct  = false; }
    if (!rightAct){ pressKey('right');   pressKey('d');   rightAct = true;  }
  }
  // ---- MARKAZDA ----
  else {
    if (leftAct)  { releaseKey('left');  releaseKey('a'); leftAct  = false; }
    if (rightAct) { releaseKey('right'); releaseKey('d'); rightAct = false; }
  }

  // ---- GAZ ----
  if (gasPressed && !gasAct) {
    pressKey('up'); pressKey('w'); gasAct = true;
  } else if (!gasPressed && gasAct) {
    releaseKey('up'); releaseKey('w'); gasAct = false;
  }

  // ---- TORMOZ ----
  if (brakePressed && !brakeAct) {
    pressKey('down'); pressKey('s'); brakeAct = true;
  } else if (!brakePressed && brakeAct) {
    releaseKey('down'); releaseKey('s'); brakeAct = false;
  }
}

// ---- HTTP Server ----
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/steer') {
    const q = parsed.query;
    if (q.action !== undefined) currentAction = q.action;
    if (q.gas    !== undefined) gasPressed    = q.gas.toLowerCase()   === 'true';
    if (q.brake  !== undefined) brakePressed  = q.brake.toLowerCase() === 'true';

    // Tugmalarni darhol qo'llaymiz
    applyKeys();
  }

  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  res.end('{"status":"ok"}');
});

// ---- Chiqishda hamma tugmalarni bo'shatish ----
function releaseAll() {
  ['left','right','up','down','a','d','w','s'].forEach(k => {
    try { robot.keyToggle(k, 'up'); } catch (_) {}
  });
}
process.on('SIGINT',  () => { releaseAll(); process.exit(); });
process.on('SIGTERM', () => { releaseAll(); process.exit(); });

// ---- Serverni ishga tushurish ----
const PORT = 5000;
server.listen(PORT, () => {
  console.log('====================================');
  console.log(`Server http://localhost:${PORT} ishga tushdi...`);
  console.log("O'yinlar uchun ARROWS (up,down..) VA W,A,S,D baravar bosiladi!");
  console.log("Barcha web va PC o'yinlariga mos keladi.");
  console.log("To'xtatish uchun: Ctrl+C");
  console.log('====================================');
  console.log("Dastur tayyor! O'yin oynasini Active qilishni unutmang!");
});
