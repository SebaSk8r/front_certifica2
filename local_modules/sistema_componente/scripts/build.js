"use strict";

const jsesc = require("jsesc");
const json = require("../data/sistema_componente.json");
const arr = json;

const header = "// Generated using `npm run build`. Do not edit!";
const output = `${header}\nexport const sistema_componente =  ${jsesc(arr, {
  compact: true,
})};\n`;
require("fs").writeFileSync("./index.js", output);
