<template>
  <q-table
    title="Registros"
    :rows="registros_arr"
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
        label="Programa"
        class="q-mr-sm"
        @click="exportTable(false)"
        :loading="loading_hisp"
      />
      <q-btn
        color="dark"
        label="Histórico"
        class="q-mr-sm"
        @click="exportTable(true)"
        :loading="loading_his"
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
  "uuid",
  "estado",
  "fecha_inicio",
  "hora_inicio",
  "unidad_negocio",
  "unidad_servicio",
  "lugar_inspeccion",
  "placa_patente",
  "numero_interno",
  "certifica_inicio",
  "fecha_programa",
  "dias_restantes",
  "fecha_nopresenta1",
  "fecha_nopresenta2",
  "fecha_nopresenta3",
  "fecha_termino",
  "certifica_termino",
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
    name: "estado",
    label: "Estado",
    field: (row) =>
      row.estado === 0 && row.fecha_programa_timestamp >= date.getTime() / 1000
        ? "En Plazo"
        : row.estado === 0 &&
          row.fecha_caduca_timestamp >= date.getTime() / 1000
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
    name: "fecha_inicio",
    label: "Fecha Ultima",
    field: "fecha_inicio",
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
    name: "lugar_inspeccion",
    label: "Lugar Inspección",
    field: "lugar_inspeccion",
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
    name: "numero_interno",
    label: "Numero Interno",
    field: (row) => buses[row.placa_patente][0],
    align: "center",
    sortable: true,
  },
  {
    name: "certifica_inicio",
    label: "Resultado Actual",
    field: (row) =>
      row.certifica_inicio === true ? "Aprobado" : "No Aprobado",
    align: "center",
    sortable: true,
  },
  {
    name: "fecha_programa",
    label: "Fecha Programada",
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
    name: "dias_restantes",
    label: "Dias Restantes",
    field: (row) =>
      row.estado === 0 && row.fecha_caduca_timestamp > date.getTime() / 1000
        ? Math.trunc(
            (row.fecha_caduca_timestamp - date.getTime() / 1000) / (3600 * 24)
          )
        : row.estado === 0
        ? 0
        : "",

    align: "center",
    sortable: true,
  },
  {
    name: "fecha_nopresenta1",
    label: "No Presenta 1",
    field: (row) => row.fecha_nopresenta.at(-3),
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
    name: "fecha_nopresenta2",
    label: "No Presenta 2",
    field: (row) => row.fecha_nopresenta.at(-2),
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
    name: "fecha_nopresenta3",
    label: "No Presenta 3",
    field: (row) => row.fecha_nopresenta.at(-1),
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
    name: "fecha_termino",
    label: "Fecha Termino",
    field: "fecha_termino",
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
    name: "certifica_termino",
    label: "Resultado",
    field: (row) =>
      row.certifica_termino === true
        ? "Aprobado"
        : row.certifica_termino === false
        ? "No Aprobado"
        : "",
    align: "center",
    sortable: true,
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

const exportTable = async (historic) => {
  if (historic) loading_his.value = true;
  else loading_hisp.value = true;
  const content = [];
  content.push([
    "UNIDAD NEGOCIO",
    "UNIDAD SERVICIO",
    "ID",
    "ESTADO",
    "FECHA ULTIMA",
    "LUGAR INSPECCION",
    "PLACA PATENTE",
    "NUMERO INTERNO",
    "RESULTADO ACTUAL",
    "FECHA PROGRAMADA",
    "DIAS RESTANTES",
    "NO PRESENTA 1",
    "NO PRESENTA 2",
    "NO PRESENTA 3",
    "FECHA TERMINO",
    "RESULTADO",
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
    content.push([
      registro.unidad_negocio,
      registro.unidad_servicio,
      registro.uuid,
      registro.estado === 0 &&
      registro.fecha_programa_timestamp >= date.getTime() / 1000
        ? "En Plazo"
        : registro.estado === 0 &&
          registro.fecha_caduca_timestamp >= date.getTime() / 1000
        ? "Por Vencer"
        : registro.estado === 0 &&
          registro.fecha_caduca_timestamp < date.getTime() / 1000
        ? "Vencida"
        : registro.estado === 1
        ? "Finalizada"
        : registro.estado === 3
        ? "Eliminada"
        : "",
      registro.fecha_inicio,
      registro.lugar_inspeccion,
      registro.placa_patente,
      buses[registro.placa_patente][0],
      registro.certifica_inicio === true ? "Aprobado" : "No Aprobado",
      registro.fecha_programa,
      registro.estado === 0 &&
      registro.fecha_caduca_timestamp > date.getTime() / 1000
        ? Math.trunc(
            (registro.fecha_caduca_timestamp - date.getTime() / 1000) /
              (3600 * 24)
          )
        : registro.estado === 0
        ? 0
        : "",
      registro.fecha_nopresenta.at(-3),
      registro.fecha_nopresenta.at(-2),
      registro.fecha_nopresenta.at(-1),
      registro.fecha_termino,
      registro.certifica_termino === true
        ? "Aprobado"
        : registro.certifica_termino === false
        ? "Aprobado"
        : "",
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
  { immediate: true }
);
</script>
