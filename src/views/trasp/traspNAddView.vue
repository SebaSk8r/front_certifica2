<template>
  <q-card bordered class="q-ma-md">
    <q-card-section class="bg-primary text-white">
      <div class="text-h6">General</div>
    </q-card-section>
    <q-form @submit="onSubmit">
      <q-card-section>
        <q-input
          v-model="representante_op"
          label="REPRESENTANTE OPERADOR"
          :rules="[(val) => (val && val.length > 0) || 'Este campo es obligatorio.']"
          dense
          input-class="text-uppercase"
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="person" />
          </template>
        </q-input>
        <q-input
          v-model="placa_patente"
          label="PLACA PATENTE"
          :rules="[(val) => (val && validPpu.has(val.toUpperCase())) || 'Por favor, escribe una placa patente válida.']"
          dense
          mask="XXXXXX"
          debounce="500"
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="directions_bus" />
          </template>
        </q-input>
        <q-input
          v-model="kilometraje"
          label="KILOMETRAJE"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            (val) =>
              parseInt(val) >= Math.round(kilometraje_acum * 0.7) || `Kilometraje menor a 70% acumulado (${Math.round(kilometraje_acum * 0.7)}).`,
          ]"
          dense
          mask="#"
          reverse-fill-mask
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="linear_scale" />
          </template>
        </q-input>

        <q-select
          v-model="lugar_inspeccion"
          label="LUGAR INSPECCIÓN"
          :options="terminales"
          dense
          :rules="[(val) => (val && val.length > 0) || 'Este campo es obligatorio.']"
          :readonly="submited"
        >
          <template v-slot:before>
            <q-icon name="place" />
          </template>
        </q-select>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Iniciar" type="submit" color="primary" :loading="submited" />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref, computed } from "vue";
import buses from "@/assets/json/buses.json";
import { customAlphabet } from "nanoid";
import { alphanumeric } from "nanoid-dictionary";
import { useTraspStore } from "@/store/traspStore";
import { useUserStore } from "@/store/userStore";
import { terminales, traspaso_version, traspaso_xtipo, unidad_negocio } from "@/client";
import { useDateFormat } from "@vueuse/core";
import { useRouter } from "vue-router";

const representante_op = ref(null);
const placa_patente = ref(null);
const kilometraje = ref(null);
const lugar_inspeccion = ref(null);
const validPpu = new Set(Object.keys(buses));
const { add } = useTraspStore();
const { notify } = useQuasar();
const { name, uid } = useUserStore();
const submited = ref(false);

const kilometraje_acum = computed(() => {
  if (!validPpu.has(placa_patente.value?.toUpperCase())) return 0;
  else return parseInt(buses[placa_patente.value.toUpperCase()][26]) || 0;
});
const router = useRouter();

const onSubmit = () => {
  submited.value = true;
  const nanoid = customAlphabet(alphanumeric, 20);
  const payload = {
    uuid: nanoid(),
    user_uid: uid,
    user_name: name,
    fecha_inicio: useDateFormat(new Date(), "DD/MM/YYYY").value,
    hora_inicio: useDateFormat(new Date(), "HH:mm:ss").value,
    fecha_inicio_timestamp: Date.now() / 1000,
    representante_op: representante_op.value.toUpperCase(),
    placa_patente: placa_patente.value.toUpperCase(),
    kilometraje: parseInt(kilometraje.value),
    lugar_inspeccion: lugar_inspeccion.value,
    estado: 0,
    group: [],
    groupv: {},
    filenames_ori: [],
    filenames: [],
    obs_inspeccion: null,
    resultado: [],
    fecha_reins: null,
    hora_reins: null,
    fecha_reins_timestamp: null,
    unidad_servicio: buses[placa_patente.value.toUpperCase()][17],
    unidad_negocio: buses[placa_patente.value.toUpperCase()][18],
    version:
      "U" + unidad_negocio + (traspaso_xtipo === true ? buses[placa_patente.value.toUpperCase()][13].charAt(0).toUpperCase() : "") + traspaso_version, //D=> DIESEL, E=> ELECTRICO
    no_atributos: buses[placa_patente.value.toUpperCase()][51] || [],
  };
  add(payload);
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Inspección iniciada",
    timeout: 1000,
  });
  setTimeout(
    () =>
      router.push({
        name: "traspn_det",
        params: { uuid: payload.uuid },
      }),
    2500
  );
};
</script>
