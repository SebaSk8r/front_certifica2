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
          v-model="fecha_inicio"
          label="FECHA INICIO"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            (val) => validar_rango() || 'Rango de presencia invalido.',
          ]"
          dense
          readonly
          reactive-rules
        >
          <q-popup-proxy transition-show="scale" transition-hide="scale">
            <q-date v-model="fecha_inicio" mask="DD/MM/YYYY">
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Cerrar" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
          <template v-slot:before>
            <q-icon name="event" />
          </template>
        </q-input>
        <q-input
          v-model="hora_inicio"
          label="HORA INICIO"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            (val) => validar_rango() || 'Rango de presencia invalido.',
          ]"
          dense
          readonly
          reactive-rules
        >
          <q-popup-proxy transition-show="scale" transition-hide="scale">
            <q-time v-model="hora_inicio" mask="HH:mm" format24h>
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Cerrar" color="primary" flat />
              </div>
            </q-time>
          </q-popup-proxy>
          <template v-slot:before>
            <q-icon name="access_time" />
          </template>
        </q-input>

        <q-input
          v-model="fecha_termino"
          label="FECHA TERMINO"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            (val) => validar_rango() || 'Rango de presencia invalido.',
          ]"
          dense
          readonly
          reactive-rules
        >
          <q-popup-proxy transition-show="scale" transition-hide="scale">
            <q-date v-model="fecha_termino" mask="DD/MM/YYYY">
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Cerrar" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
          <template v-slot:before>
            <q-icon name="event" />
          </template>
        </q-input>
        <q-input
          v-model="hora_termino"
          label="HORA TERMINO"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            (val) => validar_rango() || 'Rango de presencia invalido.',
          ]"
          dense
          readonly
          reactive-rules
        >
          <q-popup-proxy transition-show="scale" transition-hide="scale">
            <q-time v-model="hora_termino" mask="HH:mm" format24h>
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Cerrar" color="primary" flat />
              </div>
            </q-time>
          </q-popup-proxy>
          <template v-slot:before>
            <q-icon name="access_time" />
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
    </q-form>
  </q-card>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref } from "vue";
import { customAlphabet } from "nanoid";
import { alphanumeric } from "nanoid-dictionary";
import { useRepresStore } from "@/store/represStore";
import { useUserStore } from "@/store/userStore";
import { terminales, terminales_map, unidad_map } from "@/client";
import { useDateFormat } from "@vueuse/core";
import { useRouter } from "vue-router";

const { add } = useRepresStore();
const { notify } = useQuasar();
const { name, uid } = useUserStore();
const submited = ref(false);
const now_date = new Date();
const before_date = new Date();
before_date.setMinutes(before_date.getMinutes() - 30);
const fecha_inicio = ref(useDateFormat(before_date, "DD/MM/YYYY").value);
const hora_inicio = ref(useDateFormat(before_date, "HH:mm").value);
const fecha_termino = ref(useDateFormat(now_date, "DD/MM/YYYY").value);
const hora_termino = ref(useDateFormat(now_date, "HH:mm").value);
const representante_op = ref(null);
const lugar_inspeccion = ref(null);

const router = useRouter();
const validar_rango = () => {
  const [day_i, month_i, year_i] = fecha_inicio.value.split("/");
  const fecha_inicio_date = new Date(
    `${year_i}-${month_i}-${day_i} ${hora_inicio.value}`
  );
  const [day_t, month_t, year_t] = fecha_termino.value.split("/");
  const fecha_termino_date = new Date(
    `${year_t}-${month_t}-${day_t} ${hora_termino.value}`
  );
  //Validamos
  if (fecha_termino_date > new Date()) return false;
  if (fecha_inicio_date >= fecha_termino_date) return false;
  if ((fecha_termino_date - fecha_inicio_date) / 3600000 > 10) return false;
  if ((fecha_termino_date - fecha_inicio_date) / 3600000 < 0.5) return false;
  return true;
};

const onSubmit = () => {
  submited.value = true;
  const nanoid = customAlphabet(alphanumeric, 20);
  const [day_i, month_i, year_i] = fecha_inicio.value.split("/");
  const fecha_inicio_date = new Date(
    `${year_i}-${month_i}-${day_i} ${hora_inicio.value}`
  );
  const [day_t, month_t, year_t] = fecha_termino.value.split("/");
  const fecha_termino_date = new Date(
    `${year_t}-${month_t}-${day_t} ${hora_termino.value}`
  );
  const terminal = terminales_map.get(lugar_inspeccion.value);
  const payload = {
    uuid: nanoid(),
    user_uid: uid,
    user_name: name,
    fecha_inicio: useDateFormat(fecha_inicio_date, "DD/MM/YYYY").value,
    hora_inicio: useDateFormat(fecha_inicio_date, "HH:mm:ss").value,
    fecha_inicio_timestamp: fecha_inicio_date / 1000,
    fecha_termino: useDateFormat(fecha_termino_date, "DD/MM/YYYY").value,
    hora_termino: useDateFormat(fecha_termino_date, "HH:mm:ss").value,
    fecha_termino_timestamp: fecha_termino_date / 1000,
    representante_op: representante_op.value.toUpperCase(),
    lugar_inspeccion: lugar_inspeccion.value,
    estado: 1,
    unidad_servicio: unidad_map.get(terminal[0]),
    unidad_negocio: terminal[0],
  };
  add(payload);
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Presencia registrada",
    timeout: 1000,
  });
  setTimeout(
    () =>
      router.push({
        name: "repres_list",
      }),
    2500
  );
};
</script>
