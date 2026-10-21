// Copia os arquivos do app web para a pasta "www", que o Capacitor empacota no APK.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "www");
const files = ["index.html", "style.css", "app.js", "manifest.json", "sw.js", "icon-192.png", "icon-512.png"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
files.forEach((f) => fs.copyFileSync(path.join(root, f), path.join(out, f)));
console.log("www/ pronto com " + files.length + " arquivos");
