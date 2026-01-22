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
    <template v-slot:body-cell-desconexion="props">
      <q-td :props="props">
        <q-chip
          :color="
            props.row.version === 'G'
              ? 'white'
              : props.row.c0_pend === false && props.row.l0_pend === false
              ? 'primary'
              : 'red'
          "
          text-color="white"
          dense
          class="text-weight-bold"
          square
          >{{
            props.row.version === "G"
              ? ""
              : props.row.c0_pend === false && props.row.l0_pend === false
              ? "Finalizada"
              : "Pendiente"
          }}</q-chip
        >
      </q-td>
    </template>
    <template v-slot:body-cell-loza="props">
      <q-td :props="props">
        <q-chip
          :color="
            props.row.c1_pend === false && props.row.l1_pend === false
              ? 'primary'
              : 'red'
          "
          text-color="white"
          dense
          class="text-weight-bold"
          square
          >{{
            props.row.c1_pend === false && props.row.l1_pend === false
              ? "Finalizada"
              : "Pendiente"
          }}</q-chip
        >
      </q-td>
    </template>
    <template v-slot:body-cell-pozo="props">
      <q-td :props="props">
        <q-chip
          :color="
            props.row.c2_pend === false && props.row.l2_pend === false
              ? 'primary'
              : 'red'
          "
          text-color="white"
          dense
          class="text-weight-bold"
          square
          >{{
            props.row.c2_pend === false && props.row.l2_pend === false
              ? "Finalizada"
              : "Pendiente"
          }}</q-chip
        >
      </q-td>
    </template>
    <template v-slot:body-cell-techo="props">
      <q-td :props="props">
        <q-chip
          :color="
            props.row.c3_pend === false && props.row.l3_pend === false
              ? 'primary'
              : 'red'
          "
          text-color="white"
          dense
          class="text-weight-bold"
          square
          >{{
            props.row.c3_pend === false && props.row.l3_pend === false
              ? "Finalizada"
              : "Pendiente"
          }}</q-chip
        >
      </q-td>
    </template>
    <template v-slot:body-cell-yutong="props">
      <q-td :props="props">
        <q-chip
          :color="
            props.row.version === 'G'
              ? 'white'
              : props.row.c4_pend === false && props.row.l4_pend === false
              ? 'primary'
              : 'red'
          "
          text-color="white"
          dense
          class="text-weight-bold"
          square
          >{{
            props.row.version === "G"
              ? ""
              : props.row.c4_pend === false && props.row.l4_pend === false
              ? "Finalizada"
              : "Pendiente"
          }}</q-chip
        >
      </q-td>
    </template>
    <template v-slot:body-cell-fotos="props">
      <q-td :props="props">
        <q-chip
          :color="props.row.filenames.length >= 5 ? 'primary' : 'red'"
          text-color="white"
          dense
          class="text-weight-bold"
          square
          >{{
            props.row.filenames.length >= 5 ? "Finalizada" : "Pendiente"
          }}</q-chip
        >
      </q-td>
    </template>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          v-if="!only_view"
          color="primary"
          icon="edit"
          flat
          dense
          @click="onEdit(props.row)"
        />
        <q-btn
          color="primary"
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
import { useTraspmStore } from "@/store/traspmStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { exportFile, useQuasar } from "quasar";
import { useUserStore } from "@/store/userStore";
import { stringify } from "csv-stringify/browser/esm/sync";
import { useRouter } from "vue-router";

const visible_cols = [
  "uuid",
  "estado",
  "fecha_inicio",
  "hora_inicio",
  "unidad_negocio",
  "unidad_servicio",
  "placa_patente",
  "tipo",
  "desconexion",
  "loza",
  "pozo",
  "techo",
  "yutong",
  "fotos",
  "fecha_termino",
  "hora_termino",
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
    field: (row) => (row.estado === 0 ? "Abierta" : "Cerrada"),
    align: "center",
    sortable: true,
  },
  {
    name: "fecha_inicio",
    label: "Fecha Inicio",
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
    label: "Hora Inicio",
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
    name: "tipo",
    label: "Tipo",
    field: (row) => (row.version === "G" ? "Diesel" : "Electrico"),
    align: "center",
    sortable: true,
  },
  { name: "desconexion", label: "Desconexion", field: "", align: "center" },
  { name: "loza", label: "Loza", field: "", align: "center" },
  { name: "pozo", label: "Pozo", field: "", align: "center" },
  { name: "techo", label: "Techo", field: "", align: "center" },
  { name: "yutong", label: "Yutong", field: "", align: "center" },
  { name: "fotos", label: "Fotos", field: "", align: "center" },
  {
    name: "fecha_termino",
    label: "Fecha Termino",
    field: (row) =>
      (row.version === "G" || (!row.c0_pend && !row.l0_pend)) &&
      !row.c1_pend &&
      !row.l1_pend &&
      !row.c2_pend &&
      !row.l2_pend &&
      !row.c3_pend &&
      !row.l3_pend &&
      (row.version === "G" || (!row.c4_pend && !row.l4_pend)) &&
      row.filenames.length >= 5
        ? row.fecha
        : "",
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
    field: (row) =>
      (row.version === "G" || (!row.c0_pend && !row.l0_pend)) &&
      !row.c1_pend &&
      !row.l1_pend &&
      !row.c2_pend &&
      !row.l2_pend &&
      !row.c3_pend &&
      !row.l3_pend &&
      (row.version === "G" || (!row.c4_pend && !row.l4_pend)) &&
      row.filenames.length >= 5
        ? row.hora
        : "",
    align: "center",
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

const { reg_change } = storeToRefs(useTraspmStore());
const { getall, gethistoric } = useTraspmStore();
const estado_general_arr = shallowRef([]);
const { notify } = useQuasar();
const { only_view } = useUserStore();
const filter = ref("");
const router = useRouter();
const loading = ref(true);
const loading_his = ref(false);

const onEdit = (row) => {
  if (![0].includes(row.estado)) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "Inspección no puede ser editada",
      timeout: 1000,
    });
    return false;
  }
  router.push({
    name: "traspm_det",
    params: { uuid: row.uuid },
  });
};
const onSearch = (row) => {
  router.push({
    name: "traspm_det",
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
    "FECHA INICIO",
    "HORA INICIO",
    "PLACA PATENTE",
    "TIPO",
    "DESCONEXION",
    "LOZA",
    "POZO",
    "TECHO",
    "YUTONG",
    "FOTOS",
    "FECHA TERMINO",
    "HORA TERMINO",
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
    //Reprog: En Proceso, Finalizado, Eliminado
    if ([4, 5, 6].includes(registro.estado)) continue;
    content.push([
      registro.unidad_negocio,
      registro.unidad_servicio,
      registro.uuid,
      registro.estado === 0 ? "Abierta" : "Cerrada",
      registro.fecha_inicio,
      registro.hora_inicio,
      registro.placa_patente,
      registro.version === "G" ? "Diesel" : "Electrico",
      registro.version === "G"
        ? null
        : registro.c0_pend === false && registro.l0_pend === false
        ? "Finalizada"
        : "Pendiente",
      registro.c1_pend === false && registro.l1_pend === false
        ? "Finalizada"
        : "Pendiente",
      registro.c2_pend === false && registro.l2_pend === false
        ? "Finalizada"
        : "Pendiente",
      registro.c3_pend === false && registro.l3_pend === false
        ? "Finalizada"
        : "Pendiente",
      registro.version === "G"
        ? null
        : registro.c4_pend === false && registro.l4_pend === false
        ? "Finalizada"
        : "Pendiente",
      registro.filenames.length >= 5 ? "Finalizada" : "Pendiente",
      (registro.version === "G" || (!registro.c0_pend && !registro.l0_pend)) &&
      !registro.c1_pend &&
      !registro.l1_pend &&
      !registro.c2_pend &&
      !registro.l2_pend &&
      !registro.c3_pend &&
      !registro.l3_pend &&
      (registro.version === "G" || (!registro.c4_pend && !registro.l4_pend)) &&
      registro.filenames.length >= 5
        ? registro.fecha
        : "",
      (registro.version === "G" || (!registro.c0_pend && !registro.l0_pend)) &&
      !registro.c1_pend &&
      !registro.l1_pend &&
      !registro.c2_pend &&
      !registro.l2_pend &&
      !registro.c3_pend &&
      !registro.l3_pend &&
      (registro.version === "G" || (!registro.c4_pend && !registro.l4_pend)) &&
      registro.filenames.length >= 5
        ? registro.hora
        : "",
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  exportFile("inspeccion_traspaso_mayor.csv", data, "text/csv");
  loading_his.value = false;
};
watch(
  () => reg_change.value,
  async () => {
    estado_general_arr.value = await getall(false);
    if (reg_change.value > 0) loading.value = false;
  },
  { immediate: true }
);
</script>
