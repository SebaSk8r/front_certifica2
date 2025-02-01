<template>
  <div class="q-pa-md">
    <q-table
      title="Registros"
      :rows="buses_arr"
      :columns="columns"
      :filter="filter"
      row-key="uuid"
      class="q-ma-md"
      :loading="loading"
      :pagination="pagination"
      :visible-columns="visible_cols"
      :rows-per-page-options="[0]"
      no-data-label="No se han encontrado registros"
      no-results-label="No se encuentran resultados para búsqueda"
      loading-label="Cargando.."
    >
      <template v-slot:top>
        <q-btn
          color="primary"
          icon-right="archive"
          label="Descargar"
          no-caps
          class="q-mr-sm"
          @click="exportTable"
        />
        <q-space />
        <q-input
          debounce="500"
          dense
          v-model="filter"
          label="Filtrar"
          type="search"
          style="max-width: 50%"
          input-class="text-uppercase"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:no-data="{ message }">
        <div class="full-width row flex-center text-accent q-gutter-sm">
          <q-icon size="2em" name="sentiment_dissatisfied" />
          <span> {{ message }} </span>
        </div>
      </template>
    </q-table>
  </div>
</template>
<script setup>
import { ref, shallowRef } from "vue";
import { exportFile } from "quasar";
import { stringify } from "csv-stringify/browser/esm/sync";
import buses from "@/assets/json/buses.json";
import { useEstadogStore } from "@/store/estadogStore";
import { useInspecStore } from "@/store/inspecStore";
import { useMprevStore } from "@/store/mprevStore";
import { useIncideStore } from "@/store/incideStore";
import { useRevtecStore } from "@/store/revtecStore";
import { useInfoStore } from "@/store/infoStore";
import { meses_estado_general, meses_inspeccion_tecnica } from "@/client";
import { useQuasar } from "quasar";
import { invoke, until, useDateFormat } from "@vueuse/core";
import { storeToRefs } from "pinia";

const visible_cols = [
  "unidad_negocio",
  "unidad_servicio",
  "placa_patente",
  "estado_bus",
  "estado_propiedad",
  "inicio_operacion",
  "vence_permiso_circula",
  "vence_revision_tecnica",
  "e_estado_general",
  "f_estado_general",
  "h_estado_general",
  "vence_estado_general",
  "e_inspeccion_tecnica",
  "f_inspeccion_tecnica",
  "h_inspeccion_tecnica",
  "vence_inspeccion_tecnica",
  "e_revision_documental",
  "f_revision_documental",
  "h_revision_documental",
];
const columns = [
  {
    name: "unidad_negocio",
    label: "Unidad Negocio",
    field: (row) => row[11],
    align: "center",
  },
  {
    name: "unidad_servicio",
    label: "Unidad Servicio",
    field: (row) => row[1],
    align: "center",
  },
  {
    name: "placa_patente",
    label: "Placa Patente",
    field: (row) => row[0],
    align: "center",
  },
  {
    name: "estado_bus",
    label: "Estado Bus",
    field: (row) => row[10],
    align: "center",
  },
  {
    name: "estado_propiedad",
    label: "Estado Propiedad",
    field: (row) => row[2],
    align: "center",
  },
  {
    name: "inicio_operacion",
    label: "Inicio Operación",
    field: (row) => row[3],
    align: "center",
  },
  {
    name: "vence_permiso_circula",
    label: "Vencimiento Permiso Circulación",
    field: (row) => row[4],
    align: "center",
  },
  {
    name: "vence_revision_tecnica",
    label: "Vencimiento Revisión Tecnica",
    field: (row) => row[9].crt_vencimiento_fecha,
    align: "center",
  },
  {
    name: "e_estado_general",
    label: "Estado General",
    field: (row) =>
      Date.now() > row[12]
        ? "Caducado"
        : row[5].certifica === true
        ? "Aprobado"
        : row[5].certifica === false
        ? "No Aprobado"
        : "Pendiente",
    align: "center",
  },
  {
    name: "f_estado_general",
    label: "Fecha Estado General",
    field: (row) => row[5].fecha,
    align: "center",
  },
  {
    name: "h_estado_general",
    label: "Hora Estado General",
    field: (row) => row[5].hora,
    align: "center",
  },
  {
    name: "vence_estado_general",
    label: "Vencimiento Estado General",
    field: (row) => row[14],
    align: "center",
  },
  {
    name: "e_inspeccion_tecnica",
    label: "Inspección Tecnica",
    field: (row) =>
      Date.now() > row[13]
        ? "Caducado"
        : row[6].certifica === true
        ? "Aprobado"
        : row[6].certifica === false
        ? "No Aprobado"
        : "Pendiente",
    align: "center",
  },
  {
    name: "f_inspeccion_tecnica",
    label: "Fecha Inspección Tecnica",
    field: (row) => row[6].fecha,
    align: "center",
  },
  {
    name: "h_inspeccion_tecnica",
    label: "Hora Inspección Tecnica",
    field: (row) => row[6].hora,
    align: "center",
  },
  {
    name: "vence_inspeccion_tecnica",
    label: "Vencimiento Inspección Tecnica",
    field: (row) => row[15],
    align: "center",
  },
  {
    name: "e_revision_documental",
    label: "Revisión Documental",
    field: (row) =>
      row[8] === true
        ? "Aprobado"
        : row[8] === false
        ? "No Aprobado"
        : "Pendiente",
    align: "center",
  },
  {
    name: "f_revision_documental",
    label: "Fecha Revisión Documental",
    field: (row) => row[7].fecha_creacion,
    align: "center",
  },
  {
    name: "h_revision_documental",
    label: "Hora Revisión Documental",
    field: (row) => row[7].hora_creacion,
    align: "center",
  },
];
const pagination = ref({
  page: 1,
  rowsPerPage: 7,
});

//Para referenciar los valores del ref en computed, debo agregar .value
//Cada vez que se cambie algo en cabecera o detalle se repinta..
//Ver si se puede mejorar
const { getlastf: getlastfe } = useEstadogStore();
const { getlastf: getlastfi } = useInspecStore();
const { getinc } = useMprevStore();
const { m_mant_prev_change } = storeToRefs(useMprevStore());
const { getlasto } = useIncideStore();
const { getlast: getlastr } = useRevtecStore();
const { getlast: getlasti } = useInfoStore();
const buses_arr = shallowRef([]);
const loading = ref(true);

/*
const buses_arr = computed(() => {
  if (loading.value) return [];
  const arr = [];
  const revdoc = u_informes.value.get("REVISION DOCUMENTAL");
  for (const [key, value] of Object.entries(buses)) {
    let [day, month, year] = value[31].split("/");
    if (isNaN(day) || isNaN(month) || isNaN(year))
      [day, month, year] = [1, 12, 2022];
    const inicio_operacion_date = new Date(`${year}-${month}-${day}`);
    let estadog = uf_estado_general.value.get(key);
    if (!estadog)
      estadog = {
        resultado: [
          {
            certifica: null,
            fecha_timestamp: inicio_operacion_date.getTime() / 1000,
          },
        ],
      };
    let inspec = uf_inspeccion_tecnica.value.get(key);
    if (!inspec)
      inspec = {
        resultado: [
          {
            certifica: null,
            fecha_timestamp: inicio_operacion_date.getTime() / 1000,
          },
        ],
      };
    const revdocE = !i_mantenimiento_preventivo.value.has(key);
    let tecnica = u_revision_tecnica.value.get(key);
    if (!tecnica) {
      tecnica = { crt_vencimiento_fecha: "" };
    }
    arr.push([
      key,
      value[17],
      value[24],
      value[31],
      value[21],
      estadog.resultado.at(-1),
      inspec.resultado.at(-1),
      revdoc,
      revdocE,
      tecnica,
    ]);
  }
  return arr;
});
*/
const filter = ref("");
const { notify } = useQuasar();
const exportTable = () => {
  const content = [];
  content.push([
    "UNIDAD NEGOCIO",
    "UNIDAD SERVICIO",
    "PLACA PATENTE",
    "ESTADO BUS",
    "ESTADO PROPIEDAD",
    "INICIO OPERACIÓN",
    "VENCIMIENTO PERMISO CIRCULACIÓN",
    "VENCIMIENTO REVISION TECNICA",
    "ESTADO GENERAL",
    "FECHA ESTADO GENERAL",
    "HORA ESTADO GENERAL",
    "VENCIMIENTO ESTADO GENERAL",
    "INSPECCIÓN TECNICA",
    "FECHA INSPECCIÓN TECNICA",
    "HORA INSPECCIÓN TECNICA",
    "VENCIMIENTO INSPECCIÓN TECNICA",
    "REVISION DOCUMENTAL",
    "FECHA REVISION DOCUMENTAL",
    "HORA REVISION DOCUMENTAL",
  ]);
  for (const bus of buses_arr.value) {
    content.push([
      bus[11],
      bus[1],
      bus[0],
      bus[10],
      bus[2],
      bus[3],
      bus[4],
      bus[9].crt_vencimiento_fecha,
      Date.now() > bus[12]
        ? "Caducado"
        : bus[5].certifica === true
        ? "Aprobado"
        : bus[5].certifica === false
        ? "No Aprobado"
        : "Pendiente",
      bus[5].fecha,
      bus[5].hora,
      bus[14],
      Date.now() > bus[13]
        ? "Caducado"
        : bus[6].certifica === true
        ? "Aprobado"
        : bus[6].certifica === false
        ? "No Aprobado"
        : "Pendiente",
      bus[6].fecha,
      bus[6].hora,
      bus[15],
      bus[8] === true
        ? "Aprobado"
        : bus[8] === false
        ? "No Aprobado"
        : "Pendiente",
      bus[7].fecha_creacion,
      bus[7].hora_creacion,
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  const status = exportFile("estado_certificacion.csv", data, "text/csv");
  if (status !== true) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "No ha sido posible descargar buses",
      timeout: 1000,
    });
  }
};
invoke(async () => {
  await until(m_mant_prev_change).toMatch((v) => v > 0);
  const arr = [];
  const revdoc = await getlasti();
  const incumple = await getinc();
  const u_revision_tecnica = await getlastr();
  const uf_estado_general = await getlastfe();
  const uf_inspeccion_tecnica = await getlastfi();
  const o_incidente = await getlasto();

  for (const [key, value] of Object.entries(buses)) {
    let [day, month, year] = value[31].split("/");
    if (isNaN(day) || isNaN(month) || isNaN(year))
      [day, month, year] = [1, 12, 2022];
    const inicio_operacion_date = new Date(`${year}-${month}-${day}`);
    let estadog = uf_estado_general.get(key);
    if (!estadog)
      estadog = {
        resultado: [
          {
            certifica: null,
            fecha_timestamp: inicio_operacion_date.getTime() / 1000,
          },
        ],
      };
    let inspec = uf_inspeccion_tecnica.get(key);
    if (!inspec)
      inspec = {
        resultado: [
          {
            certifica: null,
            fecha_timestamp: inicio_operacion_date.getTime() / 1000,
          },
        ],
      };
    const revdocE = !incumple.has(key);
    let tecnica = u_revision_tecnica.get(key);
    if (!tecnica) {
      tecnica = { crt_vencimiento_fecha: "" };
    }
    const estadog_cdate = new Date(
      estadog.resultado.at(-1).fecha_timestamp * 1000
    );
    estadog_cdate.setMonth(estadog_cdate.getMonth() + meses_estado_general);
    const inspec_cdate = new Date(
      inspec.resultado.at(-1).fecha_timestamp * 1000
    );
    inspec_cdate.setMonth(inspec_cdate.getMonth() + meses_inspeccion_tecnica);
    arr.push([
      key,
      value[17],
      value[24],
      value[31],
      value[21],
      estadog.resultado.at(-1),
      inspec.resultado.at(-1),
      revdoc,
      revdocE,
      tecnica,
      o_incidente.has(key) ? "Fuera de Servicio" : "Operativo",
      value[18],
      estadog_cdate.getTime(),
      inspec_cdate.getTime(),
      useDateFormat(estadog_cdate, "DD/MM/YYYY").value,
      useDateFormat(inspec_cdate, "DD/MM/YYYY").value,
    ]);
  }
  buses_arr.value = arr;
  loading.value = false;
});
</script>
