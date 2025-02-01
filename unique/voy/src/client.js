const client = "voy";
const unidad_servicio = "4";
const unidad_negocio = "4";
const unidad_negocio_arr = ["4"];
const unidad_map = new Map([["4", "U4"]]);
const terminales_map = new Map([
  ["LA VARA", ["4", -70.7084936, -33.5681571]],
  ["LO ESPEJO", ["4", -70.7027855, -33.5337455]],
  ["MUJICA", ["4", -70.604075, -33.56303]],
  ["RINCONADA DE NOS", ["4", -70.6964612, -33.6219017]],
]);
const terminales = ["LA VARA", "LO ESPEJO", "MUJICA", "RINCONADA DE NOS"];
const inspeccion_pautas = ["ZK6128", "S"];
const meses_estado_general = 3;
const meses_inspeccion_tecnica = 6;
const dashboard_link = "https://app.powerbi.com/home";
const revdoc_map = new Map([
  [true, "APROBADO"],
  [false, "NO APROBADO"],
]);
export {
  client,
  unidad_servicio,
  unidad_negocio,
  terminales,
  unidad_negocio_arr,
  inspeccion_pautas,
  meses_estado_general,
  meses_inspeccion_tecnica,
  dashboard_link,
  unidad_map,
  terminales_map,
  revdoc_map,
};
