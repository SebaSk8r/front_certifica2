<template>
  <div class="q-pa-md">
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">General</div>
      </q-card-section>
      <q-form @submit="onSubmit">
        <q-card-section>
          <q-input
            v-model="representante_op"
            label="REPRESENTANTE OPERADOR"
            :rules="[
              (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            ]"
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
            @update:model-value="onUpdate()"
            label="PLACA PATENTE"
            :rules="[
              (val) =>
                (val && validPpu.has(val.toUpperCase())) ||
                'Por favor, escribe una placa patente válida.',
            ]"
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
                parseInt(val) >= Math.round(kilometraje_acum * 0.7) ||
                `Kilometraje menor a 70% acumulado (${Math.round(
                  kilometraje_acum * 0.7
                )}).`,
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
            :rules="[
              (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            ]"
            :readonly="submited"
          >
            <template v-slot:before>
              <q-icon name="place" />
            </template>
          </q-select>

          <q-input
            v-model="ot_numero"
            label="NUMERO OT"
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
            v-model="sistema_componentev"
            label="SISTEMA / COMPONENTE"
            :options="sistema_componente"
            dense
            :rules="[
              (val) =>
                (val && val.value.length > 0) || 'Este campo es obligatorio.',
            ]"
            :readonly="submited"
          >
            <template v-slot:before>
              <q-icon name="tune" />
            </template>
          </q-select>
          <q-select
            v-model="frecuencia"
            label="FRECUENCIA"
            :options="[
              '5.000',
              '10.000',
              '20.000',
              '30.000',
              '40.000',
              '50.000',
              '60.000',
              '70.000',
              '80.000',
              '90.000',
              '100.000',
              '0',
            ]"
            dense
            :rules="[
              (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            ]"
            :readonly="submited"
          >
            <template v-slot:before>
              <q-icon name="tune" />
            </template>
          </q-select>
          <q-select
            v-model="pauta_ejecutada"
            label="PAUTA EJECUTADA"
            :options="inspeccion_pautas"
            dense
            :rules="[
              (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            ]"
            :readonly="submited"
          >
            <template v-slot:before>
              <q-icon name="tune" />
            </template>
          </q-select>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="Iniciar"
            type="submit"
            color="primary"
            :loading="submited"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </div>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref, computed } from "vue";
import buses from "@/assets/json/buses.json";
import { customAlphabet } from "nanoid";
import { alphanumeric } from "nanoid-dictionary";
import { useInspecStore } from "@/store/inspecStore";
import { useEstadogpStore } from "@/store/estadogpStore";
import { useUserStore } from "@/store/userStore";
import inspeccion_tecnica from "@/assets/json/inspeccion_tecnica.json";
import { terminales, inspeccion_pautas } from "@/client";
import { useRouter } from "vue-router";
import { useDateFormat } from "@vueuse/core";

const representante_op = ref(null);
const placa_patente = ref(null);
const kilometraje = ref(null);
const lugar_inspeccion = ref(null);
const validPpu = new Set(Object.keys(buses));
const { add } = useInspecStore();
const { getppu } = useEstadogpStore();

const { notify } = useQuasar();
const { name, uid } = useUserStore();
const submited = ref(false);
const sistema_componente = inspeccion_tecnica.sistema_componente;
const sistema_componentev = ref(null);
const ot_numero = ref(null);
const frecuencia = ref(null);
const pauta_ejecutada = ref(null);
const kilometraje_acum = computed(() => {
  if (!validPpu.has(placa_patente.value?.toUpperCase())) return 0;
  else return parseInt(buses[placa_patente.value.toUpperCase()][26]) || 0;
});
const router = useRouter();

//Verificamos cuanto falta para que caduque inspeccion tecnica
const onUpdate = async () => {
  const ppu_prog = await getppu(placa_patente.value);
  if (!ppu_prog) return;
  const date = new Date();
  const dias_restantes =
    ppu_prog.fecha_caduca_timestamp > date.getTime() / 1000
      ? Math.trunc(
          (ppu_prog.fecha_caduca_timestamp - date.getTime() / 1000) /
            (3600 * 24)
        )
      : 0;
  let color = "green-6";
  let icon = "check_circle";
  if (dias_restantes < 10) {
    color = "red-6";
    icon = "error";
  }
  if (dias_restantes >= 10 && dias_restantes < 20) {
    color = "orange-6";
    icon = "warning";
  }
  notify({
    color: color,
    textColor: "white",
    icon: icon,
    message: "Dias Restantes para Estado General: " + dias_restantes,
    timeout: 2000,
  });
};

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
    filenames_ori: [],
    filenames: [],
    obs_inspeccion: null,
    resultado: [],
    fecha_reins: null,
    frecuencia: parseInt(frecuencia.value.replace(".", "")),
    sistema_componente: sistema_componentev.value.value,
    pauta_ejecutada: pauta_ejecutada.value,
    materiales: [],
    unidad_servicio: buses[placa_patente.value.toUpperCase()][17],
    unidad_negocio: buses[placa_patente.value.toUpperCase()][18],
    ot_numero: parseInt(ot_numero.value),
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
        name: "inspec_det",
        params: { uuid: payload.uuid },
      }),
    2500
  );
};
</script>
