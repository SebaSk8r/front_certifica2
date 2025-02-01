<template>
  <div class="q-pa-md">
    <q-table
      title="Registros"
      :rows="buses_arr"
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
          icon-right="archive"
          label="Descargar"
          no-caps
          class="q-mr-sm"
          @click="exportTable"
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
    <div id="map" class="map"></div>
  </div>
</template>
<script setup>
import { useQuasar } from "quasar";
import { ref, watch, onMounted, shallowRef } from "vue";
import { exportFile } from "quasar";
import { stringify } from "csv-stringify/browser/esm/sync";
import buses from "@/assets/json/buses.json";
import { useEstadogStore } from "@/store/estadogStore";
import { useInspecStore } from "@/store/inspecStore";
import { useIncideStore } from "@/store/incideStore";
import { storeToRefs } from "pinia";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerManager } from "@googlemaps/markermanager";
import { useGeolocation, useIntervalFn, until } from "@vueuse/core";
import { usePosicionStore } from "@/store/posicionStore";
import haversine from "haversine-distance";
import { meses_estado_general, meses_inspeccion_tecnica } from "@/client";

const visible_cols = [
  "unidad_servicio",
  "placa_patente",
  "estado_bus",
  "inicio_operacion",
  "e_estado_general",
  "f_estado_general",
  "d_estado_general",
  "e_inspeccion_tecnica",
  "d_inspeccion_tecnica",
  "ubicacion",
  "m_ubicacion",
  "distancia",
  "actions",
];
const columns = [
  {
    name: "unidad_servicio",
    label: "Unidad Servicio",
    field: (row) => row[0],
    align: "center",
  },
  {
    name: "placa_patente",
    label: "Placa Patente",
    field: (row) => row[1],
    align: "center",
    sortable: true,
  },
  {
    name: "estado_bus",
    label: "Estado Bus",
    field: (row) => row[10],
    align: "center",
  },
  {
    name: "inicio_operacion",
    label: "Inicio Operación",
    field: (row) => row[9],
    align: "center",
    sortable: true,
  },
  {
    name: "e_estado_general",
    label: "Estado General",
    field: (row) =>
      Date.now() > row[11]
        ? "Caducado"
        : row[2].certifica === true
        ? "Aprobado"
        : row[2].certifica === false
        ? "No Aprobado"
        : "Pendiente",
    align: "center",
    sortable: true,
  },
  {
    name: "d_estado_general",
    label: "Dias Estado General",
    field: (row) =>
      Math.round((Date.now() / 1000 - row[2].fecha_timestamp) / (3600 * 24)),
    align: "center",
    sortable: true,
  },
  {
    name: "e_inspeccion_tecnica",
    label: "Inspección Tecnica",
    field: (row) =>
      Date.now() > row[12]
        ? "Caducado"
        : row[3].certifica === true
        ? "Aprobado"
        : row[3].certifica === false
        ? "No Aprobado"
        : "Pendiente",
    align: "center",
    sortable: true,
  },
  {
    name: "d_inspeccion_tecnica",
    label: "Dias Inspección Tecnica",
    field: (row) =>
      Math.round((Date.now() / 1000 - row[3].fecha_timestamp) / (3600 * 24)),
    align: "center",
    sortable: true,
  },
  {
    name: "ubicacion",
    label: "Ubicación",
    field: (row) => row[8],
    align: "center",
    sortable: true,
  },
  {
    name: "m_ubicacion",
    label: "Minutos Ubicación",
    field: (row) => row[7],
    align: "center",
    sortable: true,
  },
  {
    name: "distancia",
    label: "Distancia",
    field: (row) => row[6],
    align: "center",
    sortable: true,
  },
  { name: "actions", label: "Acciones", field: "", align: "center" },
];
const pagination = ref({
  sortBy: "distancia",
  descending: false,
  page: 1,
  rowsPerPage: 7,
});
const filter = ref("");
const { getlastf: getlastfe } = useEstadogStore();
const { getlastf: getlastfi } = useInspecStore();
const { m_posicion_change } = storeToRefs(usePosicionStore());
const { getall } = usePosicionStore();
const { getlasto } = useIncideStore();
const { m_incidente_change } = storeToRefs(useIncideStore());
const buses_arr = shallowRef([]);
const loading = ref(true);

const { coords } = useGeolocation();
const curr_date = ref(Date.now() / 1000);
useIntervalFn(() => {
  curr_date.value = Date.now() / 1000;
}, 30000);

let map = null;
let infoWindow = null;
let position_marker = null;
let marker_manager = null;
let marker_manager_load = false;
let google = null;
const { notify } = useQuasar();

const setMarkers = (m_posicion) => {
  marker_manager.clearMarkers();
  infoWindow.close();
  const markers = [];
  for (const [key, value] of m_posicion.entries()) {
    const marker = new google.maps.Marker({
      position: {
        lat: value[0],
        lng: value[1],
      },
      title: key,
      optimized: true,
    });
    marker.addListener("click", () => {
      infoWindow.close();
      infoWindow.setContent(key);
      infoWindow.open(map, marker);
    });
    markers.push(marker);
  }
  marker_manager.addMarkers(markers, 0);
  marker_manager.refresh();
};
/*
watch(m_posicion, () => {
  if (!marker_manager_load) return;
  setMarkers();
});
*/

//Mi posicion no es administrada por el marker manager
watch(coords, () => {
  if (
    !position_marker ||
    !isFinite(coords.value.latitude) ||
    !isFinite(coords.value.longitude)
  )
    return;
  position_marker.setPosition({
    lat: coords.value.latitude,
    lng: coords.value.longitude,
  });
});

onMounted(async () => {
  const loader = new Loader({
    apiKey: "AIzaSyBOgaVzmCfZTL6Rs8dGgJ2AJRFNqnJS1CQ",
    version: "weekly",
  });
  google = await loader.load();
  //Crear con posicion por defecto si corrdenadas invalidas
  //Se centra en la moneda -33.442903876968494, -70.65383698099131
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.442903876968494, lng: -70.65383698099131 },
    zoom: 10,
    mapId: "2523ba55831ae7ec",
    mapTypeControl: false,
    streetViewControl: false,
  });
  infoWindow = new google.maps.InfoWindow();
  //Mi posicion en el mapa. Por defecto
  position_marker = new google.maps.Marker({
    position: { lat: -33.442903876968494, lng: -70.65383698099131 },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillOpacity: 1,
      strokeWeight: 2,
      fillColor: "#5384ED",
      strokeColor: "#ffffff",
    },
    optimized: true,
    map: map,
  });
  const locationButton = document.createElement("button");
  locationButton.textContent = "\ue55c";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    map.setCenter(position_marker.getPosition());
    map.setZoom(17);
  });
  marker_manager = new MarkerManager(map, {});
  google.maps.event.addListenerOnce(marker_manager, "loaded", () => {
    marker_manager_load = true;
    //setMarkers();
  });
});
const onSearch = (row) => {
  document.getElementById("map").scrollIntoView();
  map.setCenter({ lat: row[4], lng: row[5] });
  map.setZoom(17);
  infoWindow.close();
  infoWindow.setContent(row[1]);
  infoWindow.setPosition({ lat: row[4], lng: row[5] });
  infoWindow.open(map);
};
const exportTable = () => {
  const content = [];
  content.push([
    "UNIDAD SERVICIO",
    "PLACA PATENTE",
    "ESTADO BUS",
    "INICIO OPERACIÓN",
    "ESTADO GENERAL",
    "DIAS ESTADO GENERAL",
    "INSPECCIÓN TECNICA",
    "DIAS INSEPCCIÓN TECNICA",
    "UBICACIÓN",
    "MINUTOS UBICACIÓN",
    "DISTANCIA",
  ]);
  for (const bus of buses_arr.value) {
    content.push([
      bus[0],
      bus[1],
      bus[10],
      bus[9],
      Date.now() > bus[11]
        ? "Caducado"
        : bus[2].certifica === true
        ? "Aprobado"
        : bus[2].certifica === false
        ? "No Aprobado"
        : "Pendiente",
      Math.round((Date.now() / 1000 - bus[2].fecha_timestamp) / (3600 * 24)),
      Date.now() > bus[12]
        ? "Caducado"
        : bus[3].certifica === true
        ? "Aprobado"
        : bus[3].certifica === false
        ? "No Aprobado"
        : "Pendiente",
      Math.round((Date.now() / 1000 - bus[3].fecha_timestamp) / (3600 * 24)),
      bus[8],
      bus[7],
      bus[6].toLocaleString(),
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  const status = exportFile("sinoptico.csv", data, "text/csv");
  if (status !== true) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "No ha sido posible descargar buses",
      timeout: 1000,
    });
  }
};
watch(
  () => m_posicion_change.value,
  async () => {
    await until(m_incidente_change).toMatch((v) => v > 0);
    const arr = [];
    const uf_estado_general = await getlastfe();
    const uf_inspeccion_tecnica = await getlastfi();
    const o_incidente = await getlasto();
    const m_posicion = await getall();

    for (const [key, value] of Object.entries(buses)) {
      let [day, month, year] = value[31].split("/");
      if (isNaN(day) || isNaN(month) || isNaN(year))
        [day, month, year] = [1, 12, 2022];
      const inicio_operacion_date = new Date(`${year}-${month}-${day}`);
      let estadog = uf_estado_general.get(key);
      if (!estadog)
        estadog = {
          resultado: [
            {
              certifica: null,
              fecha_timestamp: inicio_operacion_date.getTime() / 1000,
            },
          ],
        };
      let inspec = uf_inspeccion_tecnica.get(key);
      if (!inspec)
        inspec = {
          resultado: [
            {
              certifica: null,
              fecha_timestamp: inicio_operacion_date.getTime() / 1000,
            },
          ],
        };
      const posicion = m_posicion.get(key);
      let distancia = "";
      if (
        isFinite(coords.value.longitude) &&
        isFinite(coords.value.latitude) &&
        !isNaN(posicion[1]) &&
        !isNaN(posicion[0])
      )
        distancia =
          Math.round(
            (haversine(
              [coords.value.longitude, coords.value.latitude],
              [posicion[1], posicion[0]]
            ) /
              1000) *
              1e2
          ) / 1e2; //2 decimales

      const estadog_cdate = new Date(
        estadog.resultado.at(-1).fecha_timestamp * 1000
      );
      estadog_cdate.setMonth(estadog_cdate.getMonth() + meses_estado_general);
      const inspec_cdate = new Date(
        inspec.resultado.at(-1).fecha_timestamp * 1000
      );
      inspec_cdate.setMonth(inspec_cdate.getMonth() + meses_inspeccion_tecnica);

      arr.push([
        value[17],
        key,
        estadog.resultado.at(-1),
        inspec.resultado.at(-1),
        posicion[0],
        posicion[1],
        distancia,
        Math.round((curr_date.value - posicion[4]) / 60),
        posicion[5],
        value[31],
        o_incidente.has(key) ? "Fuera de Servicio" : "Operativo",
        estadog_cdate.getTime(),
        inspec_cdate.getTime(),
      ]);
      //console.log(new Date(estadog.resultado.at(-1).fecha_timestamp * 1000));
    }
    buses_arr.value = arr;
    loading.value = false;
    if (!marker_manager_load || !m_posicion) return;
    setMarkers(m_posicion);
  },
  { immediate: true }
);
</script>
<style lang="scss" scoped>
.map {
  height: 400px;
  margin: 0;
  padding: 0;
}
.map :deep(.custom-map-control-button) {
  background-color: #fff;
  border: 2px solid #fff;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  color: rgb(102, 102, 102);
  margin: 10px;
  font: 400 24px Material Icons;
  cursor: pointer;
  text-align: center;
  line-height: 34px;
}
.map :deep(.custom-map-control-button:hover) {
  color: rgb(17, 17, 17);
}
</style>
