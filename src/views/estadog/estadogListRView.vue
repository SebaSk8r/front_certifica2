<template>
  <q-table
    title="Registros"
    :rows="estado_general_arr"
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
        color="dark"
        label="Histórico"
        class="q-mr-sm"
        @click="exportTable"
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
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          color="green"
          icon="search"
          flat
          dense
          @click="onSearch(props.row)"
        />
      </q-td>
    </template>
  </q-table>
</template>
<script setup>
import { useEstadogStore } from "@/store/estadogStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { exportFile, useQuasar } from "quasar";
import { stringify } from "csv-stringify/browser/esm/sync";
import { useRouter } from "vue-router";

const visible_cols = [
  "uuid",
  "estado",
  "fecha_inicio",
  "hora_inicio",
  "unidad_negocio",
  "unidad_servicio",
  "lugar_inspeccion",
  "placa_patente",
  "kilometraje",
  "dbaja",
  "dmedia",
  "dalta",
  "defectos",
  "resultado",
  "fecha_termino",
  "hora_termino",
  "obs_inspeccion",
  "user_name",
  "hasPendingWrites",
  "actions",
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
      row.estado === 4
        ? "En Proceso"
        : row.estado === 5
        ? "Finalizada"
        : row.estado === 6
        ? "Eliminada"
        : "",
    align: "center",
    sortable: true,
  },
  {
    name: "fecha_inicio",
    label: "Fecha Creación",
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
    name: "hora_inicio",
    label: "Hora Creación",
    field: "hora_inicio",
    align: "center",
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
    name: "kilometraje",
    label: "Kilometraje",
    field: "kilometraje",
    align: "center",
    sortable: true,
  },
  {
    name: "user_name",
    label: "Monitor",
    field: "user_name",
    align: "center",
    sortable: true,
  },
  {
    name: "dbaja",
    label: "Defectos Bajos",
    field: (row) =>
      isNaN(row?.total_lows - row?.curr_lows)
        ? ""
        : row.total_lows - row.curr_lows,
    align: "center",
    sortable: true,
  },
  {
    name: "dmedia",
    label: "Defectos Medios",
    field: (row) =>
      isNaN(row?.total_mediums - row?.curr_mediums)
        ? ""
        : row.total_mediums - row.curr_mediums,
    align: "center",
    sortable: true,
  },
  {
    name: "dalta",
    label: "Defectos Altos",
    field: (row) =>
      isNaN(row?.total_highs - row?.curr_highs)
        ? ""
        : row.total_highs - row.curr_highs,
    align: "center",
    sortable: true,
  },
  {
    name: "defectos",
    label: "Defectos",
    field: (row) => row?.defectos?.join(","),
    align: "center",
    sortable: true,
  },
  {
    name: "resultado",
    label: "Resultado",
    field: (row) =>
      row.estado === 5 && row.resultado.at(-1)?.causa === 0
        ? "No Aprobado/No Presentado"
        : row.estado === 5 && row.resultado.at(-1)?.causa === 1
        ? "No Aprobado/Dtpm"
        : row.estado === 5 && row.resultado.at(-1)?.certifica === true
        ? "Aprobado"
        : row.estado === 5 && row.resultado.at(-1)?.certifica === false
        ? "No Aprobado"
        : "",
    align: "center",
    sortable: true,
  },
  {
    name: "fecha_termino",
    label: "Fecha Termino",
    field: (row) => (row.estado === 5 ? row.resultado.at(-1).fecha : ""),
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
    name: "hora_termino",
    label: "Hora Termino",
    field: (row) => (row.estado === 5 ? row.resultado.at(-1).hora : ""),
    align: "center",
  },
  {
    name: "obs_inspeccion",
    label: "Observacion",
    field: "obs_inspeccion",
    align: "center",
    sortable: true,
  },
  {
    name: "hasPendingWrites",
    label: "Sincronizado",
    field: "hasPendingWrites",
    align: "center",
  },
  { name: "actions", label: "Acciones", field: "", align: "center" },
  {
    name: "fecha_inicio_timestamp",
    field: "fecha_inicio_timestamp",
  },
];
const pagination = ref({
  sortBy: "fecha_inicio_timestamp",
  descending: true,
  page: 1,
  rowsPerPage: 7,
});

const { m_estado_general_change } = storeToRefs(useEstadogStore());
const { getall, gethistoric } = useEstadogStore();
const estado_general_arr = shallowRef([]);
const { notify } = useQuasar();
const filter = ref("");
const router = useRouter();
const loading = ref(true);
const loading_his = ref(false);

const onSearch = (row) => {
  router.push({
    name: "estadog_detr",
    params: { uuid: row.uuid, view: true },
  });
};
const exportTable = async () => {
  loading_his.value = true;
  const content = [];
  content.push([
    "UNIDAD NEGOCIO",
    "UNIDAD SERVICIO",
    "ID",
    "ESTADO",
    "FECHA CREACION",
    "HORA CREACION",
    "LUGAR INSPECCION",
    "PLACA PATENTE",
    "KILOMETRAJE",
    "MONITOR",
    "DEFECTOS BAJOS",
    "DEFECTOS MEDIOS",
    "DEFECTOS ALTOS",
    "DEFECTOS",
    "RESULTADO",
    "FECHA TERMINO",
    "HORA TERMINO",
    "OBSERVACION",
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
  for (const estado of registros) {
    //Reprog: En Proceso, Finalizado, Eliminado
    if (![4, 5, 6].includes(estado.estado)) continue;
    content.push([
      estado.unidad_negocio,
      estado.unidad_servicio,
      estado.uuid,
      estado.estado === 4
        ? "En Proceso"
        : estado.estado === 5
        ? "Finalizada"
        : estado.estado === 6
        ? "Eliminada"
        : "",
      estado.fecha_inicio,
      estado.hora_inicio,
      estado.lugar_inspeccion,
      estado.placa_patente,
      estado.kilometraje,
      estado.user_name,
      isNaN(estado?.total_lows - estado?.curr_lows)
        ? ""
        : estado.total_lows - estado.curr_lows,
      isNaN(estado?.total_mediums - estado?.curr_mediums)
        ? ""
        : estado.total_mediums - estado.curr_mediums,
      isNaN(estado?.total_highs - estado?.curr_highs)
        ? ""
        : estado.total_highs - estado.curr_highs,
      estado?.defectos?.join(","),
      estado.estado === 5 && estado.resultado.at(-1)?.causa === 0
        ? "No Aprobado/No Presentado"
        : estado.estado === 5 && estado.resultado.at(-1)?.causa === 1
        ? "No Aprobado/Dtpm"
        : estado.estado === 5 && estado.resultado.at(-1)?.certifica === true
        ? "Aprobado"
        : estado.estado === 5 && estado.resultado.at(-1)?.certifica === false
        ? "No Aprobado"
        : "",
      estado.estado === 5 ? estado.resultado.at(-1).fecha : "",
      estado.estado === 5 ? estado.resultado.at(-1).hora : "",
      estado.obs_inspeccion?.replaceAll("\n", ". "),
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  exportFile("reprograma.csv", data, "text/csv");
  loading_his.value = false;
};
watch(
  () => m_estado_general_change.value,
  async () => {
    estado_general_arr.value = await getall(true);
    if (m_estado_general_change.value > 0) loading.value = false;
  },
  { immediate: true }
);
</script>
