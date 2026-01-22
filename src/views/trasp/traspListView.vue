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
        v-if="!only_view"
        color="primary"
        to="/trasp/add"
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
          color="primary"
          icon="download"
          flat
          dense
          @click="onDownload(props.row)"
          :loading="downloading[props.row.uuid]"
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
  <q-dialog
    v-model="dialog_repair"
    transition-show="scale"
    transition-hide="scale"
    persistent
  >
    <q-card>
      <q-form @submit="onCRepair()">
        <q-linear-progress :value="1.0" color="primary"></q-linear-progress>
        <q-card-section class="row items-center no-wrap">
          <div>
            <div class="row">
              <div class="text-weight-bold q-mr-sm">RESOLVER</div>
              <div class="text-grey">{{ estado_uuid }}</div>
            </div>
          </div>
          <q-btn
            flat
            round
            color="dark"
            icon="cancel"
            v-close-popup
            @click="causa = null"
          >
            <q-tooltip class="bg-dark" :offset="[0, 5]">Cancelar</q-tooltip>
          </q-btn>
          <q-btn flat round color="indigo" icon="construction" type="submit">
            <q-tooltip class="bg-indigo" :offset="[0, 5]">Resolver</q-tooltip>
          </q-btn>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { useTraspStore } from "@/store/traspStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { getStorage, ref as fref, getDownloadURL } from "firebase/storage";
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
  "fecha_reparacion",
  "resultado_repdoc",
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
        : row.estado === 4
        ? "Reprograma"
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
      row.estado === 1 && row.resultado.at(0).certifica === true
        ? "Cumple"
        : row.estado === 1 && row.resultado.at(0).certifica === false
        ? "No Cumple"
        : row.estado === 1 && row.resultado.at(0).certifica === null
        ? "Condicional"
        : "",
    align: "center",
    sortable: true,
  },
  {
    name: "fecha_termino",
    label: "Fecha Termino",
    field: (row) => (row.estado === 1 ? row.resultado.at(0).fecha : ""),
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
    field: (row) => (row.estado === 1 ? row.resultado.at(0).hora : ""),
    align: "center",
  },
  {
    name: "fecha_reparacion",
    label: "Fecha Reparación",
    field: (row) => row.fecha_reparacion,
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
    name: "resultado_repdoc",
    label: "Resultado Reparacion Documental",
    field: (row) =>
      row.estado === 1 &&
      row.resultado.length == 2 &&
      row.resultado.at(1).certifica === true
        ? "Cumple"
        : row.estado === 1 &&
          row.resultado.length == 2 &&
          row.resultado.at(1).certifica === false
        ? "No Cumple"
        : "",
    align: "center",
    sortable: true,
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

const { reg_change } = storeToRefs(useTraspStore());
const { update, getall, gethistoric } = useTraspStore();
const estado_general_arr = shallowRef([]);
const { notify } = useQuasar();
const { uid, only_view, admin } = useUserStore();
const filter = ref("");
const router = useRouter();
const loading = ref(true);
const loading_his = ref(false);
const dialog_repair = ref(false);
const estado_uuid = ref(null);
const downloading = ref([]);

const onEdit = (row) => {
  if ([1, 3, 4].includes(row.estado) || (row.user_uid !== uid && !admin)) {
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
    name: "trasp_det",
    params: { uuid: row.uuid },
  });
};
const onSearch = (row) => {
  router.push({
    name: "trasp_det",
    params: { uuid: row.uuid, view: true },
  });
};
const onDownload = async (row) => {
  if (!row.filename_reparacion) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "No hay archivo de reparación disponible",
      timeout: 1000,
    });
    return false;
  }
  downloading.value[row.uuid] = true;
  const url = await getDownloadURL(
    fref(getStorage(), "traspaso/" + row.filename_reparacion)
  );
  window.location.href = url;
  downloading.value[row.uuid] = false;
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
    "FECHA REPARACION",
    "RESULTADO REPARACION DOCUMENTAL",
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
    if ([4, 5, 6].includes(estado.estado)) continue;
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
        : estado.estado === 4
        ? "Reprograma"
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

      estado.estado === 1 && estado.resultado.at(0).certifica === true
        ? "Cumple"
        : estado.estado === 1 && estado.resultado.at(0).certifica === false
        ? "No Cumple"
        : estado.estado === 1 && estado.resultado.at(0).certifica === null
        ? "Condicional"
        : "",
      estado.estado === 1 ? estado.resultado.at(0).fecha : "",
      estado.estado === 1 ? estado.resultado.at(0).hora : "",
      estado.fecha_reparacion,
      estado.estado === 1 &&
      estado.resultado.length == 2 &&
      estado.resultado.at(1).certifica === true
        ? "Cumple"
        : estado.estado === 1 &&
          estado.resultado.length == 2 &&
          estado.resultado.at(1).certifica === false
        ? "No Cumple"
        : "",
      estado.obs_inspeccion?.replaceAll("\n", ". "),
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  exportFile("inspeccion_traspaso.csv", data, "text/csv");
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
