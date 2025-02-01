<template>
  <div class="q-pa-md">
    <q-table
      title="Registros"
      :rows="buses_arr"
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
import { exportFile } from "quasar";
import { stringify } from "csv-stringify/browser/esm/sync";
import buses from "@/assets/json/buses.json";
import { getStorage, ref as fref, getDownloadURL } from "firebase/storage";
import { useQuasar } from "quasar";

const visible_cols = [
  "unidad_negocio",
  "unidad_servicio",
  "placa_patente",
  "codigo_activo",
  "ano_bus",
  "numero_vin",
  "numero_motor",
  "marca_chasis",
  "modelo_chasis",
  "marca_carroceria",
  "modelo_carroceria",
  "marca_motor",
  "modelo_motor",
  "torque",
  "marca_transmision",
  "modelo_transmision",
  "tipo_propulsion",
  "norma_emision",
  "certificado_homologacion",
  "plazas_totales",
  "folio",
  "fecha_inscripcion",
  "vencimiento_permiso_circulacion",
  "terminal",
  "estado_propiedad",
  "km_inicial",
  "km_acumulado",
  "marca_aire_acondicionado",
  "modelo_aire_acondicionado",
  "tipo_rutero",
  "identificacion_neumaticos",
  "inicio_operacion",
  "instalacion_equipo_sonda",
  "tipo_equipamiento",
  "tipologia_bus",
  "diferencial",
  "largo",
  "peso",
  "tipo_torniquete",
  "marca_torniquete",
  "modelo_torniquete",
  "numero_puertas_costado_derecho",
  "numero_puertas_costado_izquierdo",
  "marca_sistema_asistencia_conductor",
  "modelo_sistema_asistencia_conductor",
  "marca_pantalla_informacion_interior",
  "modelo_pantalla_informacion_interior",
  "numero_asistentos_pasajeros",
  "actions",
];
const columns = [
  {
    name: "unidad_negocio",
    label: "Unidad Negocio",
    field: (row) => row[19],
    align: "center",
  },
  {
    name: "unidad_servicio",
    label: "Unidad Servicio",
    field: (row) => row[18],
    align: "center",
  },
  {
    name: "placa_patente",
    label: "Placa Patente",
    field: (row) => row[0],
    align: "center",
  },
  {
    name: "codigo_activo",
    label: "Codigo Activo",
    field: (row) => row[1],
    align: "center",
  },
  {
    name: "ano_bus",
    label: "Año Bus",
    field: (row) => row[2],
    align: "center",
  },
  {
    name: "numero_vin",
    label: "Numero VIN",
    field: (row) => row[3],
    align: "center",
  },
  {
    name: "numero_motor",
    label: "Numero Motor",
    field: (row) => row[4],
    align: "center",
  },
  {
    name: "marca_chasis",
    label: "Marca Chasis",
    field: (row) => row[5],
    align: "center",
  },
  {
    name: "modelo_chasis",
    label: "Modelo Chasis",
    field: (row) => row[6],
    align: "center",
  },
  {
    name: "marca_carroceria",
    label: "Marca Carroceria",
    field: (row) => row[7],
    align: "center",
  },
  {
    name: "modelo_carroceria",
    label: "Modelo Carroceria",
    field: (row) => row[8],
    align: "center",
  },
  {
    name: "marca_motor",
    label: "Marca Motor",
    field: (row) => row[9],
    align: "center",
  },
  {
    name: "modelo_motor",
    label: "Modelo Motor",
    field: (row) => row[10],
    align: "center",
  },
  {
    name: "torque",
    label: "Torque",
    field: (row) => row[11],
    align: "center",
  },
  {
    name: "marca_transmision",
    label: "Marca Transmision",
    field: (row) => row[12],
    align: "center",
  },
  {
    name: "modelo_transmision",
    label: "Modelo Transmision",
    field: (row) => row[13],
    align: "center",
  },
  {
    name: "tipo_propulsion",
    label: "Tipo Propulsion",
    field: (row) => row[14],
    align: "center",
  },
  {
    name: "norma_emision",
    label: "Norma Emision",
    field: (row) => row[15],
    align: "center",
  },
  {
    name: "certificado_homologacion",
    label: "Certificado Homologacion",
    field: (row) => row[16],
    align: "center",
  },
  {
    name: "plazas_totales",
    label: "Plazas Totales",
    field: (row) => row[17],
    align: "center",
  },
  {
    name: "folio",
    label: "Folio",
    field: (row) => row[20],
    align: "center",
  },
  {
    name: "fecha_inscripcion",
    label: "Fecha Inscripcion",
    field: (row) => row[21],
    align: "center",
  },
  {
    name: "vencimiento_permiso_circulacion",
    label: "Vencimiento Permiso Circulación",
    field: (row) => row[22],
    align: "center",
  },

  {
    name: "terminal",
    label: "Terminal",
    field: (row) => row[24],
    align: "center",
  },
  {
    name: "estado_propiedad",
    label: "Estado Propiedad",
    field: (row) => row[25],
    align: "center",
  },
  {
    name: "km_inicial",
    label: "Km Inicial",
    field: (row) => row[26],
    align: "center",
  },
  {
    name: "km_acumulado",
    label: "Km Acumulado",
    field: (row) => row[27],
    align: "center",
  },
  {
    name: "marca_aire_acondicionado",
    label: "Marca Aire Acondicionado",
    field: (row) => row[28],
    align: "center",
  },
  {
    name: "modelo_aire_acondicionado",
    label: "Modelo Aire Acondicionado",
    field: (row) => row[29],
    align: "center",
  },
  {
    name: "tipo_rutero",
    label: "Tipo Rutero",
    field: (row) => row[30],
    align: "center",
  },
  {
    name: "identificacion_neumaticos",
    label: "Identificacion Neumaticos",
    field: (row) => row[31],
    align: "center",
  },
  {
    name: "inicio_operacion",
    label: "Inicio Operacion",
    field: (row) => row[32],
    align: "center",
  },
  {
    name: "instalacion_equipo_sonda",
    label: "Instalacion Equipo Sonda",
    field: (row) => row[33],
    align: "center",
  },
  {
    name: "tipo_equipamiento",
    label: "Tipo Equipamiento",
    field: (row) => row[34],
    align: "center",
  },

  {
    name: "tipologia_bus",
    label: "Tipologia Bus",
    field: (row) => row[36],
    align: "center",
  },
  {
    name: "diferencial",
    label: "Diferencial",
    field: (row) => row[37],
    align: "center",
  },
  {
    name: "largo",
    label: "Largo",
    field: (row) => row[38],
    align: "center",
  },
  {
    name: "peso",
    label: "Peso",
    field: (row) => row[39],
    align: "center",
  },
  {
    name: "tipo_torniquete",
    label: "Tipo Torniquete",
    field: (row) => row[40],
    align: "center",
  },
  {
    name: "marca_torniquete",
    label: "Marca Torniquete",
    field: (row) => row[41],
    align: "center",
  },
  {
    name: "modelo_torniquete",
    label: "Modelo Torniquete",
    field: (row) => row[42],
    align: "center",
  },
  {
    name: "numero_puertas_costado_derecho",
    label: "Numero Puertas Costado Derecho",
    field: (row) => row[43],
    align: "center",
  },
  {
    name: "numero_puertas_costado_izquierdo",
    label: "Numero Puertas Costado Izquierdo",
    field: (row) => row[44],
    align: "center",
  },
  {
    name: "marca_sistema_asistencia_conductor",
    label: "Marca Sistema Asistencia Conductor",
    field: (row) => row[45],
    align: "center",
  },
  {
    name: "modelo_sistema_asistencia_conductor",
    label: "Modelo Sistema Asistencia Conductor",
    field: (row) => row[46],
    align: "center",
  },
  {
    name: "marca_pantalla_informacion_interior",
    label: "Marca Pantalla Informacion Interior",
    field: (row) => row[47],
    align: "center",
  },
  {
    name: "modelo_pantalla_informacion_interior",
    label: "Modelo Pantalla Informacion Interior",
    field: (row) => row[48],
    align: "center",
  },
  {
    name: "numero_asistentos_pasajeros",
    label: "Numero Asistentos Pasajeros",
    field: (row) => row[49],
    align: "center",
  },

  { name: "actions", label: "Acciones", field: "", align: "center" },
];
const pagination = ref({
  page: 1,
  rowsPerPage: 7,
});

//Para referenciar los valores del ref en computed, debo agregar .value
//Cada vez que se cambie algo en cabecera o detalle se repinta..
//Ver si se puede mejorar
const buses_arr = computed(() => {
  const arr = [];
  for (const [key, value] of Object.entries(buses)) {
    arr.push([key].concat(value));
  }
  return arr;
});
const filter = ref("");
const downloading = ref([]);
const { notify } = useQuasar();

const exportTable = () => {
  const content = [];
  content.push([
    "UNIDAD NEGOCIO",
    "UNIDAD SERVICIO",
    "PLACA PATENTE",
    "CODIGO ACTIVO",
    "AÑO BUS",
    "NUMERO VIN",
    "NUMERO MOTOR",
    "MARCA CHASIS",
    "MODELO CHASIS",
    "MARCA CARROCERIA",
    "MODELO CARROCERIA",
    "MARCA MOTOR",
    "MODELO MOTOR",
    "TORQUE",
    "MARCA TRANSMISION",
    "MODELO TRANSMISION",
    "TIPO PROPULSION",
    "NORMA EMISION",
    "CERTIFICADO HOMOLOGACION",
    "PLAZAS TOTALES",
    "FOLIO",
    "FECHA INSCRIPCION",
    "VENCIMIENTO PERMISO CIRCULACIÓN",
    "TERMINAL",
    "ESTADO PROPIEDAD",
    "KM INICIAL",
    "KM ACUMULADO",
    "MARCA AIRE ACONDICIONADO",
    "MODELO AIRE ACONDICIONADO",
    "TIPO RUTERO",
    "IDENTIFICACION NEUMATICOS",
    "INICIO OPERACION",
    "INSTALACION EQUIPO SONDA",
    "TIPO EQUIPAMIENTO",
    "TIPOLOGIA BUS",
    "DIFERENCIAL",
    "LARGO",
    "PESO",
    "TIPO TORNIQUETE",
    "MARCA TORNIQUETE",
    "MODELO TORNIQUETE",
    "NUMERO PUERTAS COSTADO DERECHO",
    "NUMERO PUERTAS COSTADO IZQUIERDO",
    "MARCA SISTEMA ASISTENCIA CONDUCTOR",
    "MODELO SISTEMA ASISTENCIA CONDUCTOR",
    "MARCA PANTALLA INFORMACION INTERIOR",
    "MODELO PANTALLA INFORMACION INTERIOR",
    "NUMERO ASISTENTOS PASAJEROS",
  ]);
  for (const bus of buses_arr.value) {
    content.push([
      bus[19],
      bus[18],
      bus[0],
      bus[1],
      bus[2],
      bus[3],
      bus[4],
      bus[5],
      bus[6],
      bus[7],
      bus[8],
      bus[9],
      bus[10],
      bus[11],
      bus[12],
      bus[13],
      bus[14],
      bus[15],
      bus[16],
      bus[17],
      bus[20],
      bus[21],
      bus[22],
      bus[24],
      bus[25],
      bus[26],
      bus[27],
      bus[28],
      bus[29],
      bus[30],
      bus[31],
      bus[32],
      bus[33],
      bus[34],
      bus[36],
      bus[37],
      bus[38],
      bus[39],
      bus[40],
      bus[41],
      bus[42],
      bus[43],
      bus[44],
      bus[45],
      bus[46],
      bus[47],
      bus[48],
      bus[49],
    ]);
  }
  const data = stringify(content, {
    delimiter: ";",
    quoted_string: true,
    bom: true,
  });
  const status = exportFile("buses.csv", data, "text/csv");
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
const onDownload = async (row) => {
  downloading.value[row] = true;
  const url = await getDownloadURL(
    fref(getStorage(), `hoja_vida/${row[0]}.xlsx`)
  );
  window.location.href = url;
  downloading.value[row] = false;
};
</script>
