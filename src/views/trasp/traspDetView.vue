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
              :src="preurl + 'thumb_' + remExt(filename.name) + '.webp'"
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
          v-model="registro_soh"
          label="REGISTRO DE SOH (STATE OF CHARGE)"
          :rules="[
            (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
          ]"
          dense
          mask="##"
          :readonly="view"
          debounce="500"
          @update:model-value="onUpdate()"
        >
          <template v-slot:before>
            <q-icon name="percent" />
          </template>
        </q-input>

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
          color="primary"
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
import traspaso from "@/assets/json/traspaso.json";
import { useTraspStore } from "@/store/traspStore";
import { storeToRefs } from "pinia";
import { ref, computed, shallowRef, watch } from "vue";
import { getStorage, ref as refStorage, uploadBytes } from "firebase/storage";
import { customAlphabet } from "nanoid";
import { alphanumeric } from "nanoid-dictionary";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@vueuse/core";

const { notify } = useQuasar();
const { update, getbyid } = useTraspStore();

const { regd_change } = storeToRefs(useTraspStore());
const files = ref(null);
const isUploading = ref(false);
const group = ref([]);
const filenames = ref([]);
const filenames_ori = ref(new Set());

const preurl = "https://storage.googleapis.com/slared.appspot.com/traspaso/";
const curr_lows = ref(0);
const curr_mediums = ref(0);
const curr_highs = ref(0);
const obs_inspeccion = ref(null);

const registro_soh = ref(null);

const submited = ref(false);
const progress = ref(false);
const estado_desc = ref(null);

const view = ref(false);
const version = ref(null);
const options_list = shallowRef([]);
const no_atributos = ref([]);
const options_low = computed(() => {
  if (!version.value) return new Set([]);
  else
    return new Set(
      traspaso[version.value].options_low.filter(
        (i) => !no_atributos.value.includes(i)
      )
    );
});
const options_medium = computed(() => {
  if (!version.value) return new Set([]);
  else
    return new Set(
      traspaso[version.value].options_medium.filter(
        (i) => !no_atributos.value.includes(i)
      )
    );
});
const options_high = computed(() => {
  if (!version.value) return new Set([]);
  else
    return new Set(
      traspaso[version.value].options_high.filter(
        (i) => !no_atributos.value.includes(i)
      )
    );
});
//let charged = false;
//let file_charged = 0;
const certifica = ref(null);
const canUpload = computed(() => files.value !== null);
const dialog = ref(false);
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
    registro_soh: registro_soh.value,
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
  if (options_high.value.size - curr_highs.value > 0) {
    certifica.value = false;
  } else if (options_medium.value.size - curr_mediums.value > 0)
    certifica.value = null;
  else {
    certifica.value = true;
  }
  estado_desc.value =
    certifica.value === true
      ? "Cumple"
      : certifica.value === false
      ? "No Cumple"
      : "Condicional";

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
  const resultado = [];
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
    estado: 1,
    resultado: resultado,
    fecha_termino: new Date().toLocaleDateString("en-GB", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
    hora_termino: new Date().toLocaleTimeString([], { hour12: false }),
    fecha_termino_timestamp: Date.now() / 1000,
  };
  update(payload);
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
        name: "trasp_list",
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
    const storageRef = refStorage(storage, `traspaso/${file_name}`);
    const uploadTask = uploadBytes(storageRef, file, {
      customMetadata: {
        uuid: route.params.uuid,
        filename: file_name_ori,
        collection: "traspaso",
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
      files.value = null;
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
        name: "trasp_list",
      }),
    2500
  );
};
//Llamada que se gatilla al ingresar o refrescar pagina, una vez se hayan cargado los datos.
invoke(async () => {
  const registro = await getbyid(route.params.uuid);
  if (registro) {
    version.value = registro["version"];
    no_atributos.value = registro["no_atributos"];
    options_list.value = traspaso[version.value].options_list.filter(
      (i) => !no_atributos.value.includes(i.value)
    );
    group.value = registro["group"];
    obs_inspeccion.value = registro["obs_inspeccion"];
    registro_soh.value = registro["registro_soh"];

    //Establecemos cumplimiento
    let lows = 0;
    let mediums = 0;
    let highs = 0;
    for (const option of registro["group"]) {
      if (options_low.value.has(option)) lows++;
      if (options_medium.value.has(option)) mediums++;
      if (options_high.value.has(option)) highs++;
    }
    curr_lows.value = lows;
    curr_mediums.value = mediums;
    curr_highs.value = highs;

    filenames.value = registro["filenames"];
    filenames_ori.value = new Set(registro["filenames_ori"]);

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
  () => regd_change.value,
  async () => {
    const registro = await getbyid(route.params.uuid);
    if (registro && registro["filenames"].length !== filenames.value.length)
      filenames.value = registro["filenames"];
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
