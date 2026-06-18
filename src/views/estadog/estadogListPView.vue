<template>
  <q-table
    title="Registros"
    :rows="registros_arr"
    :columns="columns"
    :filter="filter"
    :filter-method="filterMethod"
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
      <q-btn color="primary" label="Programa" class="q-mr-sm" @click="exportTable(false)" :loading="loading_hisp" />
      <q-btn color="dark" label="Histórico" class="q-mr-sm" @click="exportTable(true)" :loading="loading_his" />
      <q-space />
      <q-input debounce="500" dense v-model="filter" label="Filtrar" type="search" style="max-width: 50%" input-class="text-uppercase">
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
</template>
<script setup>
import { useEstadogpStore } from "@/store/estadogpStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import buses from "@/assets/json/buses.json";
import { exportFile, useQuasar } from "quasar";
import { stringify } from "csv-stringify/browser/esm/sync";

const date = new Date();
const visible_cols = [
  "unidad_negocio",
  "unidad_servicio",
  "uuid",
  "placa_patente",
  "terminal",
  "estado",
  "certifica_inicio",
  "fecha_programa",
  "dias_restantes",
  "fecha_expira",
  "hora_expira",
  "fecha_agenda",
  "hora_agenda",
  "lugar_agenda",
  "ot_agenda",
];
const columns = [
  {
    name: "unidad_negocio",
    label: "Unidad Negocio",
    field: "unidad_negocio",
    align: "center",
  },
  {
    name: "unidad_servicio",
    label: "Unidad Servicio",
    field: "unidad_servicio",
    align: "center",
  },
  {
    name: "uuid",
    label: "Id",
    field: "uuid",
    align: "center",
    sortable: true,
  },
  {
    name: "placa_patente",
    label: "Placa Patente",
    field: "placa_patente",
    align: "center",
    sortable: true,
  },
  {
    name: "terminal",
    label: "Terminal",
    field: (row) => buses[row.placa_patente]?.[23] ?? "",
    align: "center",
  },
  {
    name: "estado",
    label: "Estado",
    field: (row) =>
      row.estado === 0 && row.fecha_programa_timestamp >= date.getTime() / 1000
        ? "En Plazo"
        : row.estado === 0 && row.fecha_caduca_timestamp >= date.getTime() / 1000
          ? "Por Vencer"
          : row.estado === 0 && row.fecha_caduca_timestamp < date.getTime() / 1000
            ? "Vencida"
            : row.estado === 1
              ? "Finalizada"
              : row.estado === 3
                ? "Eliminada"
                : "",
    align: "center",
    sortable: true,
  },

  {
    name: "certifica_inicio",
    label: "Resultado Actual",
    field: (row) => (row.certifica_inicio === true ? "Aprobado" : "No Aprobado"),
    align: "center",
    sortable: true,
  },

  {
    name: "fecha_programa",
    label: "Fecha Propuesta",
    field: "fecha_programa",
    align: "center",
    sortable: true,
    sort: (a, b) => {
      const datePartsA = a.split("/");
      const datePartsB = b.split("/");
      const dateA = new Date(+datePartsA[2], datePartsA[1] - 1, +datePartsA[0]);
      const dateB = new Date(+datePartsB[2], datePartsB[1] - 1, +datePartsB[0]);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    name: "fecha_expira",
    label: "Fecha Expiración",
    field: "fecha_caduca",
    align: "center",
    sortable: true,
    sort: (a, b) => {
      const datePartsA = a.split("/");
      const datePartsB = b.split("/");
      const dateA = new Date(+datePartsA[2], datePartsA[1] - 1, +datePartsA[0]);
      const dateB = new Date(+datePartsB[2], datePartsB[1] - 1, +datePartsB[0]);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    name: "hora_expira",
    label: "Hora Expiración",
    field: "hora_caduca",
    align: "center",
  },
  {
    name: "dias_restantes",
    label: "Dias Restantes",
    field: (row) =>
      row.estado === 0 && row.fecha_caduca_timestamp > date.getTime() / 1000
        ? Math.trunc((row.fecha_caduca_timestamp - date.getTime() / 1000) / (3600 * 24))
        : row.estado === 0
          ? 0
          : "",

    align: "center",
    sortable: true,
  },
  {
    name: "fecha_agenda",
    label: "Fecha Programa",
    field: (row) => (row.agenda?.at(-1)?.values ? row.agenda.at(-1).values[0] : null),
    align: "center",
    sortable: true,
    sort: (a, b) => {
      const datePartsA = a.split("/");
      const datePartsB = b.split("/");
      const dateA = new Date(+datePartsA[2], datePartsA[1] - 1, +datePartsA[0]);
      const dateB = new Date(+datePartsB[2], datePartsB[1] - 1, +datePartsB[0]);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    name: "hora_agenda",
    label: "Hora Programa",
    field: (row) => (row.agenda?.at(-1)?.values ? row.agenda.at(-1).values[1] : null),
    align: "center",
  },
  {
    name: "lugar_agenda",
    label: "Lugar Programa",
    field: (row) => (row.agenda?.at(-1)?.values ? row.agenda.at(-1).values[3] : null),
    align: "center",
  },
  {
    name: "ot_agenda",
    label: "OT Programa",
    field: (row) => (row.agenda?.at(-1)?.values ? row.agenda.at(-1).values[4] : null),
    align: "center",
  },
  {
    name: "fecha_caduca_timestamp",
    field: "fecha_caduca_timestamp",
  },
];
const pagination = ref({
  sortBy: "fecha_caduca_timestamp",
  descending: false,
  page: 1,
  rowsPerPage: 7,
});

const { m_change } = storeToRefs(useEstadogpStore());
const { getall, gethistoric } = useEstadogpStore();
const registros_arr = shallowRef([]);
const { notify } = useQuasar();
const filter = ref("");
const loading = ref(true);
const loading_his = ref(false);
const loading_hisp = ref(false);

/**
 * Método de filtrado personalizado para q-table.
 *
 * Permite buscar por múltiples términos simultáneamente separados por coma (",").
 * Cada término se evalúa como condición "Y" (AND): un registro se incluye solo si
 * contiene TODOS los términos ingresados en al menos una de sus columnas visibles.
 *
 * Ejemplos:
 *   "SALTO"        → registros que contienen "SALTO" en cualquier columna.
 *   "SALTO, US1"  → registros que contienen "SALTO" en alguna columna Y "US1" en alguna columna.
 *
 * @param {Array} rows - Filas de la tabla.
 * @param {string} terms - Texto ingresado en el campo de filtro.
 * @param {Array} cols - Columnas visibles de la tabla.
 * @param {Function} getCellValue - Función de Quasar para obtener el valor de una celda.
 * @returns {Array} Filas que cumplen todos los términos de búsqueda.
 */
const filterMethod = (rows, terms, cols, getCellValue) => {
  const parts = terms
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  if (parts.length === 0) return rows;
  return rows.filter((row) =>
    parts.every((term) =>
      cols.some((col) => {
        const val = getCellValue(col, row);
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      }),
    ),
  );
};

const exportTable = async (historic) => {
  if (historic) loading_his.value = true;
  else loading_hisp.value = true;
  const content = [];
  content.push([
    "UNIDAD NEGOCIO",
    "UNIDAD SERVICIO",
    "ID",
    "PLACA PATENTE",
    "TERMINAL",
    "ESTADO",
    "RESULTADO ACTUAL",
    "FECHA PROPUESTA",
    "FECHA EXPIRACIÓN",
    "HORA EXPIRACIÓN",
    "DIAS RESTANTES",
    "FECHA PROGRAMA",
    "HORA PROGRAMA",
    "LUGAR PROGRAMA",
    "OT PROGRAMA",
  ]);
  const registros = await gethistoric();
  if (registros.length === 0) {
    loading_his.value = false;
    return notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "No ha sido posible descargar histórico",
      timeout: 1000,
    });
  }
  for (const registro of registros) {
    //Cuando no es historic filtramos aquellos registros con estado distinto a 0
    if (!historic && registro.estado !== 0) continue;
    const agenda = registro.agenda?.at(-1)?.values ?? null;
    content.push([
      registro.unidad_negocio,
      registro.unidad_servicio,
      registro.uuid,
      registro.placa_patente,
      buses[registro.placa_patente]?.[23] ?? "",
      registro.estado === 0 && registro.fecha_programa_timestamp >= date.getTime() / 1000
        ? "En Plazo"
        : registro.estado === 0 && registro.fecha_caduca_timestamp >= date.getTime() / 1000
          ? "Por Vencer"
          : registro.estado === 0 && registro.fecha_caduca_timestamp < date.getTime() / 1000
            ? "Vencida"
            : registro.estado === 1
              ? "Finalizada"
              : registro.estado === 3
                ? "Eliminada"
                : "",
      registro.certifica_inicio === true ? "Aprobado" : "No Aprobado",
      registro.fecha_programa,
      registro.fecha_caduca,
      registro.hora_caduca,
      registro.estado === 0 && registro.fecha_caduca_timestamp > date.getTime() / 1000
        ? Math.trunc((registro.fecha_caduca_timestamp - date.getTime() / 1000) / (3600 * 24))
        : registro.estado === 0
          ? 0
          : "",
      agenda ? agenda[0] : null,
      agenda ? agenda[1] : null,
      agenda ? agenda[3] : null,
      agenda ? agenda[4] : null,
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  exportFile("estado_general_prog.csv", data, "text/csv");
  loading_his.value = false;
  loading_hisp.value = false;
};
watch(
  () => m_change.value,
  async () => {
    registros_arr.value = await getall();
    if (m_change.value > 0) loading.value = false;
  },
  { immediate: true },
);
</script>
