"use strict";

const jsesc = require("jsesc");
const json = require("../data/repuestos.json");
const map = {
  0: new Map(Object.entries(json[0])), //carroceria
  1: new Map(Object.entries(json[1])), //chasis
};
const header = "// Generated using `npm run build`. Do not edit!";
const output = `${header}\nexport const repuestos_map =  ${jsesc(map, {
  compact: true,
})};\n`;
require("fs").writeFileSync("./index.js", output);
