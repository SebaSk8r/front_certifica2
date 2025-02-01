<template>
  <q-table
    title="Registros"
    :rows="inspeccion_tecnica_arr"
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
        to="/inspec/add"
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
          color="primary"
          icon="edit"
          flat
          dense
          @click="onEdit(props.row)"
        />
        <q-btn
          color="green"
          icon="search"
          flat
          dense
          @click="onSearch(props.row)"
        />
        <q-btn
          v-if="!only_view"
          color="negative"
          icon="delete"
          flat
          dense
          @click="onDelete(props.row)"
        />
        <q-btn
          v-if="admin"
          color="accent"
          icon="change_circle"
          flat
          dense
          @click="onChange(props.row)"
        />
      </q-td>
    </template>
  </q-table>
</template>
<script setup>
import { useInspecStore } from "@/store/inspecStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { exportFile, useQuasar } from "quasar";
import { useUserStore } from "@/store/userStore";
import { stringify } from "csv-stringify/browser/esm/sync";
import inspeccion_tecnica from "@/assets/json/inspeccion_tecnica.json";
import { useRouter } from "vue-router";

const visible_cols = [
  "uuid",
  "estado",
  "fecha_inicio",
  "unidad_servicio",
  "unidad_negocio",
  "lugar_inspeccion",
  "placa_patente",
  "kilometraje",
  "ot_numero",
  "sistema_componente",
  "frecuencia",
  "pauta_ejecutada",
  "dbaja",
  "dmedia",
  "dalta",
  "defectos",
  "resultado1",
  "fecha2",
  "resultado2",
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
    name: "ot_numero",
    label: "Numero OT",
    field: "ot_numero",
    align: "center",
    sortable: true,
  },
  {
    name: "sistema_componente",
    label: "Sistema/Componente",
    field: (row) =>
      inspeccion_tecnica.sistema_componente[
        parseInt(row.sistema_componente) - 1
      ].label,
    align: "center",
    sortable: true,
  },
  {
    name: "frecuencia",
    label: "Frecuencia",
    field: "frecuencia",
    align: "center",
    sortable: true,
  },
  {
    name: "pauta_ejecutada",
    label: "Pauta Ejecutada",
    field: "pauta_ejecutada",
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
    name: "resultado1",
    label: "Resultado 1era",
    field: (row) =>
      row.resultado.length > 0 && row.resultado[0]?.causa === 0
        ? "No Aprobado/No Presentado"
        : row.resultado.length > 0 && row.resultado[0].certifica
        ? "Aprobado"
        : row.resultado.length > 0 && row.resultado[0].certifica === false
        ? "No Aprobado"
        : row.resultado.length > 0
        ? "Pendiente"
        : "",
    align: "center",
    sortable: true,
  },
  {
    name: "fecha2",
    label: "Periodo Cura",
    field: (row) =>
      row.resultado.length === 2
        ? row.resultado[1].fecha
        : row.resultado.length > 0 && row.resultado[0].certifica === null
        ? row.fecha_reins
        : "",
    align: "center",
    sortable: true,
    sort: (a, b) => {
      let datePartsA = a.split("/");
      let datePartsB = b.split("/");
      if (datePartsA.length < 3) datePartsA = [0, 0, 0];
      if (datePartsB.length < 3) datePartsB = [0, 0, 0];
      const dateA = new Date(+datePartsA[2], datePartsA[1] - 1, +datePartsA[0]);
      const dateB = new Date(+datePartsB[2], datePartsB[1] - 1, +datePartsB[0]);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    name: "resultado2",
    label: "Resultado 2da",
    field: (row) =>
      row.resultado.length > 1 && row.resultado[1].certifica
        ? "Aprobado"
        : row.resultado.length > 1 && row.resultado[1].certifica === false
        ? "No Aprobado"
        : "",
    align: "center",
    sortable: true,
  },
  {
    name: "fecha_termino",
    label: "Fecha Termino",
    field: (row) => (row.estado === 1 ? row.resultado.at(-1).fecha : ""),
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
    field: (row) => (row.estado === 1 ? row.resultado.at(-1).hora : ""),
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

const { m_inspeccion_tecnica_change } = storeToRefs(useInspecStore());
const { update, getall, gethistoric } = useInspecStore();
const inspeccion_tecnica_arr = shallowRef([]);
const { notify } = useQuasar();
const { uid, only_view, admin } = useUserStore();
const filter = ref("");
const router = useRouter();
const loading = ref(true);
const loading_his = ref(false);

const onEdit = (row) => {
  if ([1, 3].includes(row.estado) || (row.user_uid !== uid && !admin)) {
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
    name: "inspec_det",
    params: { uuid: row.uuid },
  });
};
const onSearch = (row) => {
  router.push({
    name: "inspec_det",
    params: { uuid: row.uuid, view: true },
  });
};
const onDelete = (row) => {
  if (([1, 3].includes(row.estado) || row.user_uid !== uid) && !admin) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "Inspección no puede ser eliminada",
      timeout: 1000,
    });
    return false;
  }
  update({ uuid: row.uuid, estado: 3 });
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Inspección eliminada",
    timeout: 1000,
  });
};
const onChange = (row) => {
  update({ uuid: row.uuid, estado: 0, resultado: [] });
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Inspección cambiada a En Proceso",
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
    "FECHA CREACION",
    "LUGAR INSPECCION",
    "PLACA PATENTE",
    "KILOMETRAJE",
    "NUMERO OT",
    "SISTEMA/COMPONENTE",
    "FRECUENCIA",
    "PAUTA EJECUTADA",
    "MONITOR",
    "DEFECTOS BAJOS",
    "DEFECTOS MEDIOS",
    "DEFECTOS ALTOS",
    "DEFECTOS",
    "RESULTADO 1ERA",
    "PERIODO CURA",
    "RESULTADO 2DA",
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
      estado.lugar_inspeccion,
      estado.placa_patente,
      estado.kilometraje,
      estado.ot_numero,
      inspeccion_tecnica.sistema_componente[
        parseInt(estado.sistema_componente) - 1
      ].label,
      estado.frecuencia,
      estado.pauta_ejecutada,
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
      estado.resultado.length > 0 && estado.resultado[0]?.causa === 0
        ? "No Aprobado/No Presentado"
        : estado.resultado.length > 0 && estado.resultado[0].certifica
        ? "Aprobado"
        : estado.resultado.length > 0 && estado.resultado[0].certifica === false
        ? "No Aprobado"
        : "Pendiente",
      estado.resultado.length === 2
        ? estado.resultado[1].fecha
        : estado.resultado.length > 0 && estado.resultado[0].certifica === null
        ? estado.fecha_reins
        : "",
      estado.resultado.length > 1 && estado.resultado[1].certifica
        ? "Aprobado"
        : estado.resultado.length > 1 && estado.resultado[1].certifica === false
        ? "No Aprobado"
        : "",
      estado.estado === 1 ? estado.resultado.at(-1).fecha : "",
      estado.estado === 1 ? estado.resultado.at(-1).hora : "",
      estado.obs_inspeccion?.replaceAll("\n", ". "),
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  exportFile("inspeccion_tecnica.csv", data, "text/csv");
  loading_his.value = false;
};
watch(
  () => m_inspeccion_tecnica_change.value,
  async () => {
    inspeccion_tecnica_arr.value = await getall();
    if (m_inspeccion_tecnica_change.value > 0) loading.value = false;
  },
  { immediate: true }
);
</script>
