<template>
  <div class="q-pa-md">
    <q-table
      title="Registros"
      :rows="mantenimiento_preventivo_arr"
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
          to="/revdocP/add"
          label="Agregar"
          class="q-mr-sm"
        />
        <q-btn
          color="dark"
          label="Histórico"
          class="q-mr-sm"
          @click="onDownload"
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
  </div>
</template>
<script setup>
import { useMprevStore } from "@/store/mprevStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { getStorage, ref as fref, getDownloadURL } from "firebase/storage";
import { client, revdoc_map } from "@/client";

const visible_cols = [
  "unidad_negocio",
  "uuid",
  "placa_patente",
  "tipo_servicio",
  "pauta_proyectada",
  "sistema_componente",
  "causa_origen",
  "km_proyectado",
  "frecuencia",
  "tolerancia",
  "fecha_proyectada",

  "ot_numero",
  "ot_apertura_fecha",
  "ot_apertura_hora",
  "ot_cierre_fecha",
  "ot_cierre_hora",
  "taller_planta",
  "km_ejecucion",
  "pauta_ejecutada",
  "cantidad_trepuestos",
  "cantidad_tinsumos",
  "observacion",
  "km_diferencia",
  "resultado",
];
const columns = [
  {
    name: "unidad_negocio",
    label: "Unidad Negocio",
    field: "unidad_negocio",
    align: "center",
  },
  {
    name: "uuid",
    label: "ID",
    field: "uuid",
    align: "center",
  },
  {
    name: "placa_patente",
    label: "Placa Patente",
    field: "placa_patente",
    align: "center",
  },
  {
    name: "tipo_servicio",
    label: "Tipo Servicio",
    field: "tipo_servicio",
    align: "center",
  },
  {
    name: "pauta_proyectada",
    label: "Pauta proyectada",
    field: "pauta_proyectada",
    align: "center",
  },
  {
    name: "sistema_componente",
    label: "Sistema / Componente",
    field: "sistema_componente",
    align: "center",
  },
  {
    name: "causa_origen",
    label: "Causa / Origen",
    field: "causa_origen",
    align: "center",
  },
  {
    name: "km_proyectado",
    label: "KM Proyectado",
    field: "km_proyectado",
    align: "center",
  },
  {
    name: "frecuencia",
    label: "Frecuencia",
    field: "frecuencia",
    align: "center",
  },
  {
    name: "tolerancia",
    label: "Tolerancia",
    field: "tolerancia",
    align: "center",
  },
  {
    name: "fecha_proyectada",
    label: "Fecha Proyectada",
    field: "fecha_proyectada",
    align: "center",
  },
  {
    name: "ot_numero",
    label: "Numero OT",
    field: "ot_numero",
    align: "center",
  },
  {
    name: "ot_apertura_fecha",
    label: "Fecha Apertura",
    field: "ot_apertura_fecha",
    align: "center",
  },
  {
    name: "ot_apertura_hora",
    label: "Hora Apertura",
    field: "ot_apertura_hora",
    align: "center",
  },
  {
    name: "ot_cierre_fecha",
    label: "Fecha Cierre",
    field: "ot_cierre_fecha",
    align: "center",
  },
  {
    name: "ot_cierre_hora",
    label: "Hora Cierre",
    field: "ot_cierre_hora",
    align: "center",
  },
  {
    name: "taller_planta",
    label: "Taller / Planta",
    field: "taller_planta",
    align: "center",
  },
  {
    name: "km_ejecucion",
    label: "Km Ejecución",
    field: "km_ejecucion",
    align: "center",
  },
  {
    name: "pauta_ejecutada",
    label: "Pauta Ejecutada",
    field: "pauta_ejecutada",
    align: "center",
  },
  {
    name: "cantidad_trepuestos",
    label: "Cantidad Tipos Repuestos",
    field: (row) => row.repuestos?.length,
    align: "center",
  },
  {
    name: "cantidad_tinsumos",
    label: "Cantidad Tipos Insumos",
    field: (row) => row.insumos?.length,
    align: "center",
  },
  {
    name: "observacion",
    label: "Observacion",
    field: "observacion",
    align: "center",
  },
  {
    name: "km_diferencia",
    label: "Km Diferencia",
    field: "km_diferencia",
    align: "center",
  },
  {
    name: "resultado",
    label: "Resultado",
    field: (row) => revdoc_map.get(row.resultado) || "",
    align: "center",
  },
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

const { m_mant_prev_change } = storeToRefs(useMprevStore());
const { getall } = useMprevStore();
const mantenimiento_preventivo_arr = shallowRef([]);
const filter = ref("");
const loading = ref(true);
const loading_his = ref(false);

watch(
  () => m_mant_prev_change.value,
  async () => {
    mantenimiento_preventivo_arr.value = await getall();
    if (m_mant_prev_change.value > 0) loading.value = false;
  },
  { immediate: true }
);
const onDownload = async () => {
  loading_his.value = true;
  const url = await getDownloadURL(
    fref(
      getStorage(),
      `revision_documental/mantenimiento_preventivo_${client}.csv`
    )
  );
  window.location.href = url;
  loading_his.value = false;
};
</script>
