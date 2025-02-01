<template>
  <div class="q-pa-md">
    <q-table
      title="Registros"
      :rows="informes_arr"
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
          to="/info/add"
          label="Agregar"
          class="q-mr-sm"
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
        </q-td>
      </template>
    </q-table>
  </div>
</template>
<script setup>
import { useInfoStore } from "@/store/infoStore";
import { useUserStore } from "@/store/userStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { getStorage, ref as fref, getDownloadURL } from "firebase/storage";
import { useQuasar } from "quasar";

const visible_cols = ["unidad_servicio", "tipo", "mes_ano", "actions"];
const columns = [
  {
    name: "unidad_servicio",
    label: "Unidad Servicio",
    field: "unidad_servicio",
    align: "center",
  },
  {
    name: "tipo",
    label: "Tipo",
    field: "tipo",
    align: "center",
  },
  {
    name: "mes_ano",
    label: "Mes",
    field: (row) => row.mes + " " + row.ano,
    align: "center",
  },
  { name: "actions", label: "Acciones", field: "", align: "center" },
  {
    name: "fecha_creacion_timestamp",
    field: "fecha_creacion_timestamp",
  },
];
const pagination = ref({
  sortBy: "fecha_creacion_timestamp",
  descending: true,
  page: 1,
  rowsPerPage: 7,
});

const { m_informes_change } = storeToRefs(useInfoStore());
const { getall, update } = useInfoStore();
const informes_arr = shallowRef([]);
const { only_view } = useUserStore();
const { notify } = useQuasar();
const filter = ref("");
const downloading = ref([]);
const loading = ref(true);

const onDownload = async (row) => {
  downloading.value[row.uuid] = true;
  const url = await getDownloadURL(
    fref(getStorage(), `informes/${row.filename}`)
  );
  window.location.href = url;
  downloading.value[row.uuid] = false;
};

const onDelete = (row) => {
  update({ uuid: row.uuid, estado: 3 });
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Informe eliminado",
    timeout: 1000,
  });
};
watch(
  () => m_informes_change.value,
  async () => {
    informes_arr.value = await getall();
    if (m_informes_change.value > 0) loading.value = false;
  },
  { immediate: true }
);
</script>
