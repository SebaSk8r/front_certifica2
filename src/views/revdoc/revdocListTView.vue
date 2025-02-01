<template>
  <div class="q-pa-md">
    <q-table
      title="Registros"
      :rows="revision_tecnica_arr"
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
          to="/revdocT/add"
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
    </q-table>
  </div>
</template>
<script setup>
import { useQuasar } from "quasar";
import { useRevtecStore } from "@/store/revtecStore";
import { storeToRefs } from "pinia";
import { ref, watch, shallowRef } from "vue";
import { exportFile } from "quasar";
import { stringify } from "csv-stringify/browser/esm/sync";

const visible_cols = [
  "unidad_negocio",
  "unidad_servicio",
  "uuid",
  "placa_patente",
  "tipo_servicio",
  "sistema_componente",

  "crt_num_certificado",
  "crt_apertura_fecha",
  "crt_apertura_hora",
  "crt_cierre_fecha",
  "crt_cierre_hora",
  "crt_taller_planta",
  "km_ejecucion",
  "cantidad_defectos",
  "resultado",
  "crt_vencimiento_fecha",
  "crt_vencimiento_hora",
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
    name: "sistema_componente",
    label: "Sistema / Componente",
    field: "sistema_componente",
    align: "center",
  },
  {
    name: "crt_num_certificado",
    label: "Numero Certificado",
    field: "crt_num_certificado",
    align: "center",
  },

  {
    name: "crt_apertura_fecha",
    label: "Fecha Apertura",
    field: "crt_apertura_fecha",
    align: "center",
  },
  {
    name: "crt_apertura_hora",
    label: "Hora Apertura",
    field: "crt_apertura_hora",
    align: "center",
  },
  {
    name: "crt_cierre_fecha",
    label: "Fecha Cierre",
    field: "crt_cierre_fecha",
    align: "center",
  },
  {
    name: "crt_cierre_hora",
    label: "Hora Cierre",
    field: "crt_cierre_hora",
    align: "center",
  },
  {
    name: "crt_taller_planta",
    label: "Taller / Planta",
    field: "crt_taller_planta",
    align: "center",
  },
  {
    name: "km_ejecucion",
    label: "Km Ejecución",
    field: "km_ejecucion",
    align: "center",
  },
  {
    name: "cantidad_defectos",
    label: "Cantidad Defectos",
    field: (row) => row.defectos.length,
    align: "center",
  },

  {
    name: "resultado",
    label: "Resultado",
    field: (row) => (row.certifica === true ? "APROBADO" : "NO APROBADO"),
    align: "center",
  },
  {
    name: "crt_vencimiento_fecha",
    label: "Fecha Vencimiento",
    field: "crt_vencimiento_fecha",
    align: "center",
  },
  {
    name: "crt_vencimiento_hora",
    label: "Hora Vencimiento",
    field: "crt_vencimiento_hora",
    align: "center",
  },
  {
    name: "crt_apertura_timestamp",
    field: "crt_apertura_timestamp",
  },
];
const pagination = ref({
  sortBy: "crt_apertura_timestamp",
  descending: true,
  page: 1,
  rowsPerPage: 7,
});

const { m_rev_tecnica_change } = storeToRefs(useRevtecStore());
const { getall, gethistoric } = useRevtecStore();
const revision_tecnica_arr = shallowRef([]);
const { notify } = useQuasar();
const filter = ref("");
const loading = ref(true);
const loading_his = ref(false);
const exportTable = async () => {
  loading_his.value = true;
  const content = [];
  content.push([
    "UNIDAD NEGOCIO",
    "UNIDAD SERVICIO",
    "ID",
    "PLACA PATENTE",
    "TIPO SERVICIO",
    "SISTEMA / COMPONENTE",
    "NUMERO CERTIFICADO",
    "FECHA APERTURA",
    "HORA APERTURA",
    "FECHA CIERRE",
    "HORA CIERRE",
    "TALLER / PLANTA",
    "KM EJECUCION",
    "CANTIDAD DEFECTOS",
    "RESULTADO",
    "FECHA VENCIMIENTO",
    "HORA VENCIMIENTO",
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
  for (const revision of registros) {
    content.push([
      revision.unidad_negocio,
      revision.unidad_servicio,
      revision.uuid,
      revision.placa_patente,
      revision.tipo_servicio,
      revision.sistema_componente,
      revision.crt_num_certificado,
      revision.crt_apertura_fecha,
      revision.crt_apertura_hora,
      revision.crt_cierre_fecha,
      revision.crt_cierre_hora,
      revision.crt_taller_planta,
      revision.km_ejecucion,
      revision.defectos.length,
      revision.certifica === true ? "APROBADO" : "NO APROBADO",
      revision.crt_vencimiento_fecha,
      revision.crt_vencimiento_hora,
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  exportFile("revision_tecnica.csv", data, "text/csv");
  loading_his.value = false;
};
watch(
  () => m_rev_tecnica_change.value,
  async () => {
    revision_tecnica_arr.value = await getall();
    if (m_rev_tecnica_change.value > 0) loading.value = false;
  },
  { immediate: true }
);
</script>
