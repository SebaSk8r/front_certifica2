xdw
<template>
  <q-form @submit="onSubmit">
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">General</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="co_numero"
          label="NUMERO COTIZACIÓN"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
          ]"
          dense
          mask="#"
          reverse-fill-mask
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="tag" />
          </template>
        </q-input>
        <q-input
          v-model="oc_numero"
          label="NUMERO OC"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
          ]"
          dense
          mask="#"
          reverse-fill-mask
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="tag" />
          </template>
        </q-input>
        <q-select
          v-model="terminal"
          label="TERMINAL"
          :options="terminales"
          dense
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
          ]"
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="place" />
          </template>
        </q-select>

        <q-select
          v-model="dominio"
          label="DOMINIO"
          :options="dominio_options"
          dense
          :rules="[(val) => !!val || 'Este campo es obligatorio.']"
          :readonly="repuestos.length > 0"
        >
          <template v-slot:before>
            <q-icon name="chevron_right" />
          </template>
        </q-select>

        <q-select
          v-model="tipo_bus"
          label="TIPO DE BUS"
          :options="['A2', 'B2', 'C2']"
          dense
          :rules="[(val) => !!val || 'Este campo es obligatorio.']"
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="chevron_right" />
          </template>
        </q-select>
      </q-card-section>
    </q-card>
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Repuestos</div>
      </q-card-section>
      <q-card-section>
        <q-btn
          round
          color="dark"
          icon="add"
          class="q-mb-sm"
          :disable="!dominio"
          @click="repuesto_dialog = true"
        />
        <q-markup-table>
          <thead>
            <tr>
              <th class="text-center">CODIGO</th>
              <th class="text-center">SISTEMA / COMPONENTE</th>
              <th class="text-center">DESCRIPCIÓN</th>
              <th class="text-center">CANTIDAD</th>
              <th class="text-center">MEDIDA</th>
              <th class="text-center">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(repuesto, index) in repuestos" :key="index">
              <td class="text-center">{{ repuesto.codigo }}</td>
              <td class="text-center">{{ repuesto.sistema_componente }}</td>
              <td class="text-center">{{ repuesto.descripcion }}</td>
              <td class="text-center">{{ repuesto.cantidad }}</td>
              <td class="text-center">{{ repuesto.medida }}</td>
              <td class="text-center">
                <q-btn
                  flat
                  rounded
                  color="purple"
                  icon="delete"
                  @click="repuesto_remove(index)"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Entrega</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="fecha_entrega_solicitada"
          label="FECHA ENTREGA SOLICITADA"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
          ]"
          dense
          readonly
        >
          <q-popup-proxy transition-show="scale" transition-hide="scale">
            <q-date
              v-model="fecha_entrega_solicitada"
              mask="DD/MM/YYYY"
              :options="optionsFn"
            >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Cerrar" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
          <template v-slot:before>
            <q-icon name="event" />
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          label="Registrar"
          type="submit"
          color="primary"
          :loading="submited"
        />
      </q-card-actions>
    </q-card>
  </q-form>
  <q-dialog v-model="repuesto_dialog">
    <q-card style="min-width: 350px">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Repuesto</div>
      </q-card-section>
      <q-form @submit="onSubmit_repuesto">
        <q-card-section>
          <q-input
            v-model="repuesto_codigo"
            label="CODIGO"
            :rules="[
              (val) =>
                repuesto_valid(val) ||
                'Por favor, escribe un codigo de repuesto valido.',
            ]"
            @update:model-value="repuesto_cantidad = null"
            dense
            input-class="text-uppercase"
            debounce="500"
            :readonly="submited"
          >
            <template v-slot:before>
              <q-icon name="miscellaneous_services" />
            </template>
          </q-input>
          <q-input
            v-model="repuesto_sistemacom"
            label="SISTEMA / COMPONENTE"
            dense
            disable
            class="q-field--with-bottom"
          >
            <template v-slot:before>
              <q-icon name="square_foot" />
            </template>
          </q-input>
          <q-input
            v-model="repuesto_descripcion"
            label="DESCRIPCIÓN"
            dense
            disable
            class="q-field--with-bottom"
          >
            <template v-slot:before>
              <q-icon name="square_foot" />
            </template>
          </q-input>
          <q-input
            v-model="repuesto_cantidad"
            label="CANTIDAD"
            :disable="!repuesto_descripcion"
            :rules="[
              (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
              (val) =>
                parseInt(val) <= cantidad_posible ||
                'Cantidad ingresada supera valor permitido.',
            ]"
            dense
            mask="#"
            reverse-fill-mask
            :readonly="submited"
          >
            <template v-slot:before>
              <q-icon name="tag" />
            </template>
          </q-input>

          <q-input
            v-model="repuesto_medida"
            label="MEDIDA"
            dense
            disable
            class="q-field--with-bottom"
          >
            <template v-slot:before>
              <q-icon name="square_foot" />
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="Agregar"
            type="submit"
            color="primary"
            :loading="submited"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref, computed } from "vue";
import { useSrepuStore } from "@/store/srepuStore";
import { useUserStore } from "@/store/userStore";
import { terminales, terminales_map, unidad_map } from "@/client";
import { repuestos_map } from "repuestos";
import { useDateFormat } from "@vueuse/core";
import { useRouter } from "vue-router";

const { bset } = useSrepuStore();
const { notify } = useQuasar();
const { name, uid } = useUserStore();
const submited = ref(false);
const terminal = ref(null);
const co_numero = ref(null);
const oc_numero = ref(null);
const dominio = ref(null);
const tipo_bus = ref(null);
const repuesto_cantidad = ref(null);
const router = useRouter();

const repuestos = ref([]);
const repuesto_dialog = ref(false);
const repuesto_codigo = ref(null);
const repuesto_valid = (val) =>
  repuestos_map[dominio.value.value].has(val?.toUpperCase());
const repuesto_descripcion = computed(
  () =>
    repuestos_map[dominio.value.value].get(
      repuesto_codigo.value?.toUpperCase()
    )?.[0]
);
const repuesto_medida = computed(
  () =>
    repuestos_map[dominio.value.value].get(
      repuesto_codigo.value?.toUpperCase()
    )?.[1]
);
const repuesto_sistemacom = computed(
  () =>
    repuestos_map[dominio.value.value].get(
      repuesto_codigo.value?.toUpperCase()
    )?.[4]
);

const fecha_entrega_solicitada = ref(null);
const dominio_options = [
  {
    label: "CARROCERIA",
    value: "0",
  },
  {
    label: "CHASIS",
    value: "1",
  },
];

/*
//Funcion que suma dias laborales a una fecha dada
const addWorkDays = (date, days) => {
  while (days)
    ![6, 0].includes(date.getUTCDay(date.setUTCDate(date.getUTCDate() + 1))) &&
      days--;
  return date;
};
*/

const fecha_entrega_min = computed(() => {
  //Si la solicitud se crea despues de las 18:00 se suma 1 dia al tiempo de entrega.
  const add_day0 = new Date().getHours() >= 18 ? 1 : 0;
  //Si la solicitud se crea un dia viernes se suma 2 dias al tiempo de entrega
  const add_day1 = new Date().getUTCDay() == 5 ? 2 : 0;
  const result = new Date();
  return result.setDate(
    result.getDate() -
      1 +
      //repuestos_map.get(repuesto_codigo.value?.toUpperCase())?.[2] +
      2 +
      add_day0 +
      add_day1
  );
});

const optionsFn = (date) => {
  const dated = new Date(date);
  if (dated.getDay() == 6 || dated.getDay() == 0) return false;
  if (dated < fecha_entrega_min.value) return false;
  else return true;
};

const cantidad_posible = computed(() => {
  if (!repuesto_descripcion.value) return null;
  return repuestos_map[dominio.value.value].get(
    repuesto_codigo.value?.toUpperCase()
  )?.[3];
});

const onSubmit = async () => {
  if (repuestos.value.length === 0)
    return notify({
      color: "red-6",
      textColor: "white",
      icon: "error",
      message: "Minimo 1 repuesto para Registrar",
      timeout: 1000,
    });

  submited.value = true;
  const [day, month, year] = fecha_entrega_solicitada.value.split("/");
  const fecha_entrega_solicitada_date = new Date(
    `${year}-${month}-${day} 00:00:00`
  );
  const terminalm = terminales_map.get(terminal.value);
  const unidad_servicio = unidad_map.get(terminalm[0]);
  const documentos = new Map();
  for (const [index, repuesto] of repuestos.value.entries()) {
    documentos.set(index, {
      unidad_negocio: terminalm[0],
      unidad_servicio: unidad_servicio,
      sistema_componente: repuesto.sistema_componente,
      repuesto_tipo: repuesto.tipo,
      repuesto_marca: repuesto.marca,
      repuesto_codigo: repuesto.codigo,
      repuesto_descripcion: repuesto.descripcion,
      repuesto_medida: repuesto.medida,
      repuesto_cantidad: repuesto.cantidad,
      oc_numero: parseInt(oc_numero.value),
      co_numero: parseInt(co_numero.value),
      oc_taller_planta: terminal.value,
      tipo_solicitud: "REPUESTO",
      oc_solicitud_fecha: useDateFormat(new Date(), "DD/MM/YYYY").value,
      oc_solicitud_hora: useDateFormat(new Date(), "HH:mm:ss").value,
      oc_solicitud_timestamp: Date.now() / 1000,
      oc_solicitud_name: name,
      oc_entrega_solicitada_fecha: useDateFormat(
        fecha_entrega_solicitada_date,
        "DD/MM/YYYY"
      ).value,
      oc_entrega_solicitada_timestamp:
        fecha_entrega_solicitada_date.getTime() / 1000,
      oc_entrega_concretada_fecha: null,
      oc_entrega_concretada_timestamp: null,
      resultado: null,
      user_uid: uid,
      user_name: name,
      fecha_creacion_timestamp: Date.now() / 1000,
      fecha_creacion: useDateFormat(new Date(), "DD/MM/YYYY").value,
      estado: 0,
      dominio: dominio.value.value,
      tipo_bus: tipo_bus.value,
    });
  }
  await bset(documentos);
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Solicitud Registrada",
    timeout: 1000,
  });
  setTimeout(
    () =>
      router.push({
        name: "soploc_listru",
      }),
    2500
  );
};
const onSubmit_repuesto = () => {
  repuestos.value.push({
    sistema_componente: repuesto_sistemacom.value,
    tipo: "ORIGINAL",
    marca: "VOLVO",
    codigo: repuesto_codigo.value.toUpperCase(),
    descripcion: repuesto_descripcion.value,
    cantidad: parseInt(repuesto_cantidad.value),
    medida: repuesto_medida.value,
  });
  //Reseteamos variables
  repuesto_codigo.value = null;
  repuesto_cantidad.value = null;
  repuesto_dialog.value = false;
};
const repuesto_remove = (index) => {
  repuestos.value.splice(index, 1);
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Repuesto eliminado",
    timeout: 1000,
  });
};
</script>
