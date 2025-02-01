<template>
  <div class="q-pa-md">
    <q-table
      title="Registros"
      :rows="documentos_arr"
      :columns="columns"
      :filter="filter"
      row-key="uuid"
      class="q-ma-md"
      :pagination="pagination"
      :visible-columns="visible_cols"
      :rows-per-page-options="[0]"
      no-data-label="No se han encontrado registros"
      no-results-label="No se encuentran resultados para búsqueda"
      loading-label="Cargando.."
    >
      <template v-slot:top>
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
      <template v-slot:body-cell-acciones="props">
        <q-td :props="props">
          <q-btn
            color="primary"
            icon="download"
            flat
            dense
            @click="onDownload(props.row)"
            :loading="downloading[props.row]"
          />
        </q-td>
      </template>
    </q-table>
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import documentos from "@/assets/json/documentos.json";
import { unidad_negocio } from "@/client";
import { getStorage, ref as fref, getDownloadURL } from "firebase/storage";

const visible_cols = ["unidad_negocio", "tipo", "descripcion", "acciones"];
const columns = [
  {
    name: "unidad_negocio",
    label: "Unidad Negocio",
    field: () => unidad_negocio,
    align: "center",
  },
  {
    name: "tipo",
    label: "Tipo",
    field: (row) => row[2],
    align: "center",
  },
  {
    name: "descripcion",
    label: "Descripción",
    field: (row) => row[0],
    align: "center",
  },
  { name: "acciones", label: "Acciones", field: "", align: "center" },
];
const pagination = ref({
  page: 1,
  rowsPerPage: 7,
});

//Para referenciar los valores del ref en computed, debo agregar .value
//Cada vez que se cambie algo en cabecera o detalle se repinta..
//Ver si se puede mejorar
const documentos_arr = computed(() => documentos[unidad_negocio]);
const filter = ref("");
const downloading = ref([]);

const onDownload = async (row) => {
  downloading.value[row] = true;
  const url = await getDownloadURL(fref(getStorage(), `documentos/${row[1]}`));
  window.location.href = url;
  downloading.value[row] = false;
};
</script>
