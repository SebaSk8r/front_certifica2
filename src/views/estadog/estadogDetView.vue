<template>
  <q-form @submit="onSubmit()">
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Criterios</div>
      </q-card-section>
      <q-card-section>
        <q-option-group
          :options="options_list"
          type="checkbox"
          v-model="group"
          @update:model-value="onUpdate()"
          :disable="view"
        />
        <q-separator color="transparent" />
      </q-card-section>
      <q-separator color="transparent" />
    </q-card>
    <q-separator color="transparent" />
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Registro Fotografico</div>
      </q-card-section>
      <q-card-section>
        <div class="q-gutter-md">
          <q-file
            v-model="files"
            @click="files = null"
            label="Seleccionar fotos"
            counter
            multiple
            clearable
            accept=".jpg, image/*"
            :readonly="isUploading"
          >
            <template v-slot:before>
              <q-icon name="photo_camera" />
            </template>
            <template v-slot:after v-if="canUpload">
              <q-btn
                color="primary"
                dense
                icon="cloud_upload"
                round
                @click="onUpload"
                :disable="!canUpload"
                :loading="isUploading"
              />
            </template>
          </q-file>
        </div>
      </q-card-section>
      <q-card-section>
        <q-scroll-area
          v-if="filenames.length > 0"
          style="height: 135px"
          visible
        >
          <div class="row justify-center q-gutter-sm">
            <q-img
              v-for="(filename, index) in filenames"
              :key="filename"
              :src="
                filenames_new
                  ? preurl + 'thumb_' + remExt(filename.name) + '.webp'
                  : preurl + 'thumb_' + filename
              "
              basic
              spinner-color="primary"
              style="max-height: 200px; max-width: 200px"
              class="rounded-borders shadow-5"
            >
              <div class="absolute-bottom row">
                <q-btn
                  v-if="!view"
                  color="white"
                  icon="delete"
                  flat
                  dense
                  @click="deleteImage(index)"
                />
                <q-space />
                <q-btn
                  color="white"
                  icon="fullscreen"
                  flat
                  dense
                  @click="largeImage(filename)"
                />
              </div>
            </q-img>
          </div>
        </q-scroll-area>
        <q-separator color="transparent" />
      </q-card-section>
    </q-card>
    <q-separator color="transparent" />
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Resultado</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="obs_inspeccion"
          label="OBSERVACIONES"
          dense
          input-class="text-uppercase"
          :readonly="view"
          debounce="2000"
          @update:model-value="onUpdate()"
          autogrow
        >
          <template v-slot:before>
            <q-icon name="person" />
          </template>
        </q-input>
      </q-card-section>
      <q-card-section>
        <q-markup-table>
          <thead>
            <tr>
              <th></th>
              <th>BAJA</th>
              <th>MEDIA</th>
              <th>ALTA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-left">CUMPLE</td>
              <td class="text-center">{{ curr_lows }}</td>
              <td class="text-center">{{ curr_mediums }}</td>
              <td class="text-center">{{ curr_highs }}</td>
            </tr>
            <tr>
              <td class="text-left">NO CUMPLE</td>
              <td class="text-center">
                {{ options_low.size - curr_lows }}
              </td>
              <td class="text-center">
                {{ options_medium.size - curr_mediums }}
              </td>
              <td class="text-center">
                {{ options_high.size - curr_highs }}
              </td>
            </tr>
            <tr>
              <td class="text-left">TOTAL</td>
              <td class="text-center">{{ options_low.size }}</td>
              <td class="text-center">{{ options_medium.size }}</td>
              <td class="text-center">{{ options_high.size }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          label="Guardar"
          @click="onGuardar()"
          color="secondary"
          :disable="view"
        />
        <q-btn
          label="Finalizar"
          type="submit"
          @click="reprog = false"
          color="primary"
          :loading="submited"
          :disable="view"
        />
        <q-btn
          v-if="!dtpm"
          label="Reprog"
          type="submit"
          @click="reprog = true"
          color="dark"
          :loading="submited"
          :disable="view"
        />
      </q-card-actions>
    </q-card>
  </q-form>
  <q-dialog
    v-model="dialog"
    transition-show="scale"
    transition-hide="scale"
    persistent
  >
    <q-card bordered class="q-ma-md">
      <q-card-section>
        <div class="text-h6">Confirmación</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        La inspección sera finalizada con estado "{{ estado_desc }}". <br />Por
        favor confirmar estado.
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Cancelar" color="secondary" v-close-popup />
        <q-btn
          label="Confirmar"
          color="primary"
          :loading="progress"
          @click="
            progress = true;
            onConfirm();
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { openURL, useQuasar } from "quasar";
import estado_general from "@/assets/json/estado_general.json";
import { useEstadogStore } from "@/store/estadogStore";
import { useUserStore } from "@/store/userStore";
import { useEstadogpStore } from "@/store/estadogpStore";

import { storeToRefs } from "pinia";
import { ref, computed, shallowRef, watch } from "vue";
import { getStorage, ref as refStorage, uploadBytes } from "firebase/storage";
import { customAlphabet } from "nanoid";
import { alphanumeric } from "nanoid-dictionary";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@vueuse/core";
import { client } from "@/client";

const { notify } = useQuasar();
const { update, getbyid, removep } = useEstadogStore();
const { getppu } = useEstadogpStore();

const { m_estado_generald_change } = storeToRefs(useEstadogStore());
const { dtpm } = useUserStore();
const files = ref(null);
const isUploading = ref(false);
const group = ref([]);
const filenames = ref([]);
const filenames_ori = ref(new Set());
let filenames_new = false;
let placa_patente = null;
let fecha_caduca_timestamp = (Date.now() + 3600 * 1000 * 24 * 7) / 1000; //No restringe por defecto.

const preurl =
  "https://storage.googleapis.com/slared.appspot.com/estado_general/";
const curr_lows = ref(0);
const curr_mediums = ref(0);
const curr_highs = ref(0);
const obs_inspeccion = ref(null);
const submited = ref(false);
const progress = ref(false);
const curr_estado = ref(0);
const estado = ref(1);
const estado_desc = ref(null);
const curr_resultado = ref([]);
const fecha_reins = ref(null);
const hora_reins = ref(null);
const fecha_reins_timestamp = ref(null);
const view = ref(false);
const version = ref(null);
const options_list = shallowRef([]);
const no_atributos = ref([]);
const options_low = computed(() => {
  if (!version.value) return new Set([]);
  else
    return new Set(
      estado_general[version.value].options_low.filter(
        (i) => !no_atributos.value.includes(i)
      )
    );
});
const options_medium = computed(() => {
  if (!version.value) return new Set([]);
  else
    return new Set(
      estado_general[version.value].options_medium.filter(
        (i) => !no_atributos.value.includes(i)
      )
    );
});
const options_high = computed(() => {
  if (!version.value) return new Set([]);
  else
    return new Set(
      estado_general[version.value].options_high.filter(
        (i) => !no_atributos.value.includes(i)
      )
    );
});
//let charged = false;
//let file_charged = 0;
const certifica = ref(null);
const canUpload = computed(() => files.value !== null);
const dialog = ref(false);
const reprog = ref(false);
const router = useRouter();
const route = useRoute();
const remExt = (fname) => fname.substring(0, fname.lastIndexOf("."));

const onUpdate = () => {
  //Establecemos cumplimiento
  let lows = 0;
  let mediums = 0;
  let highs = 0;
  for (const option of group.value) {
    if (options_low.value.has(option)) lows++;
    if (options_medium.value.has(option)) mediums++;
    if (options_high.value.has(option)) highs++;
  }
  curr_lows.value = lows;
  curr_mediums.value = mediums;
  curr_highs.value = highs;
  const options_all = [
    ...Array.from(options_low.value),
    ...Array.from(options_medium.value),
    ...Array.from(options_high.value),
  ];
  const defectos = options_all.filter((value) => !group.value.includes(value));
  const payload = {
    uuid: route.params.uuid,
    group: group.value,
    obs_inspeccion: obs_inspeccion.value,
    defectos: defectos,
    total_lows: options_low.value.size,
    total_mediums: options_medium.value.size,
    total_highs: options_high.value.size,
    curr_lows: curr_lows.value,
    curr_mediums: curr_mediums.value,
    curr_highs: curr_highs.value,
  };
  update(payload);
};
const onSubmit = () => {
  if (filenames.value.length < 2) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "cloud_done",
      message: `Minimo 2 fotos a registrar`,
      timeout: 1000,
    });
    return;
  }
  //No se puede reprogramar si quedan menos de 4 dias para caducar
  if (
    reprog.value &&
    fecha_caduca_timestamp <= (Date.now() + 3600 * 1000 * 24 * 4) / 1000
  ) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "cloud_done",
      message: `No se puede Reprogramar. Caduca < 4 dias`,
      timeout: 1000,
    });
    return;
  }
  //No se puede reprogramar si inspección en estado reinspección
  if (reprog.value && curr_estado.value === 2) {
    notify({
      color: "red-6",
      textColor: "white",
      icon: "cloud_done",
      message: `No se puede Reprogramar. En Reinspección`,
      timeout: 1000,
    });
    return;
  }
  //submited.value = true;

  //Establecemos cumplimiento
  let lows = 0;
  let mediums = 0;
  let highs = 0;
  estado.value = 1;
  certifica.value = null;
  for (const option of group.value) {
    if (options_low.value.has(option)) lows++;
    if (options_medium.value.has(option)) mediums++;
    if (options_high.value.has(option)) highs++;
  }
  curr_lows.value = lows;
  curr_mediums.value = mediums;
  curr_highs.value = highs;

  //Resultado: Alta>0 =>No certifica. Otros => Pendiente
  if (
    options_high.value.size - curr_highs.value > 0 ||
    (curr_estado.value === 2 &&
      (options_medium.value.size - curr_mediums.value > 0 ||
        options_low.value.size - curr_lows.value > 0))
  ) {
    certifica.value = false;
  } else if (
    options_medium.value.size - curr_mediums.value > 0 &&
    curr_estado.value === 0
  ) {
    estado.value = 2;
    fecha_reins.value = new Date(
      Date.now() + 3600 * 1000 * 24 * 3
    ).toLocaleDateString("en-GB", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    hora_reins.value = new Date(
      Date.now() + 3600 * 1000 * 24 * 3
    ).toLocaleTimeString("en-GB", { hour12: false });
    fecha_reins_timestamp.value = (Date.now() + 3600 * 1000 * 24 * 3) / 1000;
  } else if (
    options_low.value.size - curr_lows.value > 0 &&
    curr_estado.value === 0
  ) {
    estado.value = 2;
    fecha_reins.value = new Date(
      Date.now() + 3600 * 1000 * 24 * 5
    ).toLocaleDateString("en-GB", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    hora_reins.value = new Date(
      Date.now() + 3600 * 1000 * 24 * 5
    ).toLocaleTimeString("en-GB", { hour12: false });
    fecha_reins_timestamp.value = (Date.now() + 3600 * 1000 * 24 * 5) / 1000;
  } else certifica.value = true;

  if (reprog.value) {
    estado.value = 4;
    certifica.value = null;
  }

  estado_desc.value =
    estado.value === 4
      ? "Reprogramar"
      : estado.value === 1 && certifica.value === true
      ? "Aprobado"
      : estado.value === 1 && certifica.value === false
      ? "No Aprobado"
      : "Reinspección";

  //Mostramos dialog
  dialog.value = true;
};
const onConfirm = () => {
  //Identificamos incumplimientos.
  const options_all = [
    ...Array.from(options_low.value),
    ...Array.from(options_medium.value),
    ...Array.from(options_high.value),
  ];
  const defectos = options_all.filter((value) => !group.value.includes(value));
  const resultado = curr_resultado.value;
  resultado.push({
    certifica: certifica.value,
    total_lows: options_low.value.size,
    total_mediums: options_medium.value.size,
    total_highs: options_high.value.size,
    curr_lows: curr_lows.value,
    curr_mediums: curr_mediums.value,
    curr_highs: curr_highs.value,
    fecha: new Date().toLocaleDateString("en-GB", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
    hora: new Date().toLocaleTimeString([], { hour12: false }),
    fecha_timestamp: Date.now() / 1000,
    defectos: defectos,
  });

  const payload = {
    uuid: route.params.uuid,
    group: group.value,
    estado: estado.value,
    obs_inspeccion: obs_inspeccion.value,
    fecha_reins: fecha_reins.value,
    hora_reins: hora_reins.value,
    fecha_reins_timestamp: fecha_reins_timestamp.value,
    resultado: resultado,
    fecha_termino:
      estado.value === 1
        ? new Date().toLocaleDateString("en-GB", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })
        : "",
    hora_termino:
      estado.value === 1
        ? new Date().toLocaleTimeString([], { hour12: false })
        : "",
    fecha_termino_timestamp: estado.value === 1 ? Date.now() / 1000 : "",
  };
  update(payload);
  //Si queda no aprobado, o es reprograma liberamos creacion de nueva medicion
  if (certifica.value === false || reprog.value)
    removep({
      uuid: `estados_${client}`,
      values: placa_patente,
    });

  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Inspección registrada",
    timeout: 1000,
  });
  setTimeout(
    () =>
      router.push({
        name: "estadog_list",
      }),
    2500
  );
};
const largeImage = (filename) => {
  if (filename.name) openURL(preurl + filename.name);
  else openURL(preurl + filename);
};
const deleteImage = (index) => {
  filenames.value.splice(index, 1);
  const payload = {
    uuid: route.params.uuid,
    filenames: filenames.value,
  };
  update(payload);
};
const onUpload = () => {
  isUploading.value = true;
  const filePromises = [];
  const storage = getStorage();
  for (const file of files.value) {
    //Solo se sube una vez el archivo. Se filtra por el nombre
    //if (filenames_ori.has(file.name)) continue;
    const nanoid = customAlphabet(alphanumeric, 20);
    const file_name_ori = file.name;
    const file_name = `${nanoid()}.${file.name.split(".").pop()}`;
    const storageRef = refStorage(storage, `estado_general/${file_name}`);
    const uploadTask = uploadBytes(storageRef, file, {
      customMetadata: {
        uuid: route.params.uuid,
        filename: file_name_ori,
        collection: "estado_general",
      },
    });
    filePromises.push(uploadTask);
  }
  Promise.all(filePromises)
    .then(() => {
      //file_charged = filePromises.length;
      notify({
        color: "green-6",
        textColor: "white",
        icon: "cloud_done",
        message: "Fotos Subidas",
        timeout: 1000,
      });
      isUploading.value = false;
    })
    .catch((error) => {
      notify({
        color: "red-6",
        textColor: "white",
        icon: "cloud_done",
        message: `Error al subir: ${error.code}`,
        timeout: 1000,
      });
      isUploading.value = false;
    });
};
const onGuardar = () => {
  notify({
    color: "green-6",
    textColor: "white",
    icon: "cloud_done",
    message: "Inspección guardada",
    timeout: 1000,
  });
  setTimeout(
    () =>
      router.push({
        name: "estadog_list",
      }),
    2500
  );
};
//Llamada que se gatilla al ingresar o refrescar pagina, una vez se hayan cargado los datos.
invoke(async () => {
  const estadog = await getbyid(route.params.uuid);
  if (estadog) {
    const no_wifi = estadog["wifi"] === "NOWIFI" ? "5-8" : ""; //Necesario para registros antiguos
    version.value = estadog["version"] || "0";
    const no_atributosg = estadog["no_atributos"] || [];
    no_atributos.value = no_atributosg.concat([no_wifi]);
    options_list.value = estado_general[version.value].options_list.filter(
      (i) => !no_atributos.value.includes(i.value)
    );
    group.value = estadog["group"];
    obs_inspeccion.value = estadog["obs_inspeccion"];
    curr_estado.value = estadog["estado"];
    curr_resultado.value = estadog["resultado"];
    fecha_reins.value = estadog["fecha_reins"];
    hora_reins.value = estadog["hora_reins"] || null;
    fecha_reins_timestamp.value = estadog["fecha_reins_timestamp"] || null;
    placa_patente = estadog["placa_patente"];

    //Obtenemos timestamp caduca para ppu
    const prog = await getppu(estadog["placa_patente"]);
    if (prog) fecha_caduca_timestamp = prog.fecha_caduca_timestamp;

    //Establecemos cumplimiento
    let lows = 0;
    let mediums = 0;
    let highs = 0;
    for (const option of estadog["group"]) {
      if (options_low.value.has(option)) lows++;
      if (options_medium.value.has(option)) mediums++;
      if (options_high.value.has(option)) highs++;
    }
    curr_lows.value = lows;
    curr_mediums.value = mediums;
    curr_highs.value = highs;

    // 7 de Agosto 00:00:00 GMT-4 - Debe hacerse antes de actualizar filenames.
    if (estadog["fecha_inicio_timestamp"] > 1691380800) filenames_new = true;
    filenames.value = estadog["filenames"];
    filenames_ori.value = new Set(estadog["filenames_ori"]);

    if (route.params.view === "true") {
      view.value = true;
      notify({
        color: "red-6",
        textColor: "white",
        icon: "warning",
        message: `Acceso en modo de solo lectura`,
        timeout: 5000,
      });
    }
  }
});
watch(
  () => m_estado_generald_change.value,
  async () => {
    const estadog = await getbyid(route.params.uuid);
    if (estadog && estadog["filenames"].length !== filenames.value.length)
      filenames.value = estadog["filenames"];
  }
);
</script>
<style scoped>
.q-option-group :deep(.q-checkbox__bg) {
  top: 0%;
}
.q-option-group :deep(.q-checkbox) {
  align-items: unset;
}
.q-option-group :deep(.q-checkbox.disabled) {
  opacity: unset !important;
}
.q-option-group :deep(.q-checkbox__inner--falsy) {
  color: var(--q-negative);
}
</style>
