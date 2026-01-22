"use strict";

const jsesc = require("jsesc");
const json = require("../data/traspaso.json");
const map = new Map(Object.entries(json));

const header = "// Generated using `npm run build`. Do not edit!";
const output = `${header}\nexport const traspaso_map =  ${jsesc(map, {
  compact: true,
})};\n`;
require("fs").writeFileSync("./index.js", output);
