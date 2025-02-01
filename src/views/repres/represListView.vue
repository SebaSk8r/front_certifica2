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
        v-if="!only_view"
        color="primary"
        to="/repres/add"
        label="Agregar"
        class="q-mr-sm"
      />
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
          v-if="!only_view"
          color="negative"
          icon="delete"
          flat
          dense
          @click="onDelete(props.row)"
        />
      </q-td>
    </template>
  </q-table>
</template>
<script setup>
import { useRepresStore } from "@/store/represStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { exportFile, useQuasar } from "quasar";
import { useUserStore } from "@/store/userStore";
import { stringify } from "csv-stringify/browser/esm/sync";

const visible_cols = [
  "uuid",
  "estado",
  "fecha_inicio",
  "hora_inicio",
  "unidad_negocio",
  "unidad_servicio",
  "lugar_inspeccion",
  "fecha_termino",
  "hora_termino",
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
      row.estado === 0
        ? "En Proceso"
        : row.estado === 1
        ? "Finalizada"
        : row.estado === 2
        ? "Reinspección"
        : row.estado === 3
        ? "Eliminada"
        : "",
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
    name: "user_name",
    label: "Monitor",
    field: "user_name",
    align: "center",
    sortable: true,
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
    name: "hora_termino",
    label: "Hora Termino",
    field: "hora_termino",
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

const { m_change } = storeToRefs(useRepresStore());
const { update, getall, gethistoric } = useRepresStore();
const registros_arr = shallowRef([]);
const { notify } = useQuasar();
const { uid, only_view, admin } = useUserStore();
const filter = ref("");
const loading = ref(true);
const loading_his = ref(false);

const onDelete = (row) => {
  if (([3].includes(row.estado) || row.user_uid !== uid) && !admin) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "Presencia no puede ser eliminada",
      timeout: 1000,
    });
    return false;
  }
  update({ uuid: row.uuid, estado: 3 });
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Presencia eliminada",
    timeout: 1000,
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
    "LUGAR INSPECCION",
    "MONITOR",
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
  for (const estado of registros) {
    content.push([
      estado.unidad_negocio,
      estado.unidad_servicio,
      estado.uuid,
      estado.estado === 0
        ? "En Proceso"
        : estado.estado === 1
        ? "Finalizada"
        : estado.estado === 2
        ? "Reinspección"
        : estado.estado === 3
        ? "Eliminada"
        : "",
      estado.fecha_inicio,
      estado.hora_inicio,
      estado.lugar_inspeccion,
      estado.user_name,
      estado.fecha_termino,
      estado.hora_termino,
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  exportFile("registro_presencial.csv", data, "text/csv");
  loading_his.value = false;
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
