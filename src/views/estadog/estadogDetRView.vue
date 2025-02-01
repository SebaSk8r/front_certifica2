<template>
  <q-form>
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Criterios</div>
      </q-card-section>
      <q-card-section>
        <q-option-group
          :options="options_list"
          type="checkbox"
          v-model="group"
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
        <q-scroll-area
          v-if="filenames.length > 0"
          style="height: 135px"
          visible
        >
          <div class="row justify-center q-gutter-sm">
            <q-img
              v-for="filename in filenames"
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
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
  </q-form>
</template>

<script setup>
import { openURL, useQuasar } from "quasar";
import estado_general from "@/assets/json/estado_general.json";
import { useEstadogStore } from "@/store/estadogStore";
import { storeToRefs } from "pinia";
import { ref, computed, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import { invoke } from "@vueuse/core";

const { notify } = useQuasar();
const { getbyid } = useEstadogStore();
const { m_estado_generald_change } = storeToRefs(useEstadogStore());
const group = ref([]);
const filenames = ref([]);
const filenames_ori = ref(new Set());
let filenames_new = false;

const preurl =
  "https://storage.googleapis.com/slared.appspot.com/estado_general/";
const curr_lows = ref(0);
const curr_mediums = ref(0);
const curr_highs = ref(0);
const obs_inspeccion = ref(null);
const curr_estado = ref(0);
const curr_resultado = ref([]);
const fecha_reins = ref(null);
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
const route = useRoute();
const remExt = (fname) => fname.substring(0, fname.lastIndexOf("."));

const largeImage = (filename) => {
  if (filename.name) openURL(preurl + filename.name);
  else openURL(preurl + filename);
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
      (i) => !estadog["group"].includes(i.value)
    );
    group.value = estadog["group"];
    obs_inspeccion.value = estadog["obs_inspeccion"];
    curr_estado.value = estadog["estado"];
    curr_resultado.value = estadog["resultado"];
    fecha_reins.value = estadog["fecha_reins"];

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
