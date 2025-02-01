<template>
  <div class="q-pa-md">
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">General</div>
      </q-card-section>
      <q-form @submit="onSubmit">
        <q-card-section>
          <q-select
            v-model="tipo_carga"
            label="TIPO CARGA"
            :options="['APERTURA', 'CIERRE']"
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

          <q-file
            v-model="file"
            label="Archivo"
            accept=".csv"
            @rejected="onRejected"
            :rules="[(val) => val || 'Este campo es obligatorio.']"
          >
            <template v-slot:before>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="Cargar"
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
import { ref } from "vue";
import { useIncideStore } from "@/store/incideStore";
import { useUserStore } from "@/store/userStore";
import Papa from "papaparse";
import { useDateFormat } from "@vueuse/core";
import { useRouter } from "vue-router";
const removeAccents = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const tipo_carga = ref(null);
const { bset, bupdate } = useIncideStore();
const { notify } = useQuasar();
const { name, uid } = useUserStore();
const submited = ref(false);
const file = ref(null);
const router = useRouter();

const onSubmit = async () => {
  if (tipo_carga.value === "APERTURA") {
    //submited = true;
    Papa.parse(file.value, {
      header: true,
      encoding: "ISO-8859-1",
      skipEmptyLines: true,
      complete: async (results) => {
        //Verificamos que el header este correcto
        const fields = [
          "UNIDAD_NEGOCIO",
          "UNIDAD_SERVICIO",
          "PATENTE",
          "INC_APERTURA_FECHA",
          "INC_APERTURA_HORA",
          "INC_TALLER_PLANTA",
          "KM_EJECUCION",
          "SISTEMA_COMPONENTE",
          "CAUSA_ORIGEN",
        ];
        const result = fields.every((field) =>
          results.meta["fields"].includes(field)
        );
        if (!result) {
          notify({
            color: "red-6",
            textColor: "white",
            icon: "error",
            message: "Archivo CSV sin el formato requerido",
            timeout: 1000,
          });
          return;
        }
        const documentos = new Map();
        for (const result of results.data) {
          if (result.PATENTE === "") continue;
          const inc_apertura_fecha = result.INC_APERTURA_FECHA.replace(
            /-/g,
            "/"
          );
          const [day, month, year] = inc_apertura_fecha.split("/");
          if (isNaN(day) || isNaN(month) || isNaN(year)) continue;
          const inc_apertura_date = new Date(
            `${year}-${month}-${day} ${result.INC_APERTURA_HORA}`
          );
          documentos.set(
            `${result.PATENTE.trim().toUpperCase()}_${inc_apertura_date.getTime()}`,
            {
              unidad_negocio: result.UNIDAD_NEGOCIO.trim()
                .toUpperCase()
                .replace("U", ""),
              unidad_servicio: result.UNIDAD_SERVICIO.trim().toUpperCase(),
              placa_patente: result.PATENTE.trim().toUpperCase(),
              tipo_servicio: "INCIDENTE",
              inc_apertura_fecha: useDateFormat(inc_apertura_date, "DD/MM/YYYY")
                .value,
              inc_apertura_hora: useDateFormat(inc_apertura_date, "HH:mm:ss")
                .value,
              inc_apertura_timestamp: inc_apertura_date.getTime() / 1000,
              inc_taller_planta: removeAccents(result.INC_TALLER_PLANTA)
                .trim()
                .toUpperCase(),
              km_ejecucion: parseInt(result.KM_EJECUCION.replace(".", "")) || 0,
              sistema_componente: removeAccents(result.SISTEMA_COMPONENTE)
                .trim()
                .toUpperCase(),
              causa_origen: removeAccents(result.CAUSA_ORIGEN)
                .trim()
                .toUpperCase(),
              fecha_creacion_timestamp: Date.now() / 1000,
              fecha_creacion: useDateFormat(new Date(), "DD/MM/YYYY").value,
              hora_creacion: useDateFormat(new Date(), "HH:mm:ss").value,
              user_uid: uid,
              user_name: name,
              estado: 0,
            }
          );
        }
        bset(documentos);
        notify({
          color: "green-6",
          textColor: "white",
          icon: "cloud_done",
          message: "Registros Almacenados",
          timeout: 1000,
        });
        setTimeout(() => router.push({ name: "revdoc_listi" }), 2500);
      },
    });
  } else if (tipo_carga.value === "CIERRE") {
    //submited = true;
    Papa.parse(file.value, {
      header: true,
      encoding: "ISO-8859-1",
      skipEmptyLines: true,
      complete: async (results) => {
        //Verificamos que el header este correcto
        const fields = [
          "ID",
          "INC_CIERRE_FECHA",
          "INC_CIERRE_HORA",
          "ID_ESTADO_GENERAL",
        ];
        const result = fields.every((field) =>
          results.meta["fields"].includes(field)
        );
        if (!result) {
          notify({
            color: "red-6",
            textColor: "white",
            icon: "error",
            message: "Archivo CSV sin el formato requerido",
            timeout: 1000,
          });
          return;
        }
        const documentos = new Map();
        for (const result of results.data) {
          if (result.ID === "") continue;
          const inc_cierre_fecha = result.INC_CIERRE_FECHA.replace(/-/g, "/");
          const [day, month, year] = inc_cierre_fecha.split("/");
          if (isNaN(day) || isNaN(month) || isNaN(year)) continue;
          const inc_cierre_date = new Date(
            `${year}-${month}-${day} ${result.INC_CIERRE_HORA}`
          );
          documentos.set(result.ID, {
            inc_cierre_fecha: useDateFormat(inc_cierre_date, "DD/MM/YYYY")
              .value,
            inc_cierre_hora: useDateFormat(inc_cierre_date, "HH:mm:ss").value,
            inc_cierre_timestamp: inc_cierre_date.getTime() / 1000,
            uuid_estado_general: result.ID_ESTADO_GENERAL.trim(),
            user_uid_actualizacion: uid,
            user_name_actualizacion: name,
            fecha_actualizacion_timestamp: Date.now() / 1000,
            fecha_actualizacion: useDateFormat(new Date(), "DD/MM/YYYY").value,
            hora_actualizacion: useDateFormat(new Date(), "HH:mm:ss").value,
            estado: 1,
          });
        }
        bupdate(documentos);
        notify({
          color: "green-6",
          textColor: "white",
          icon: "cloud_done",
          message: "Registros Almacenados",
          timeout: 1000,
        });
        setTimeout(() => router.push({ name: "revdoc_listi" }), 2500);
      },
    });
  }
};
const onRejected = () => {
  notify({
    color: "red-6",
    textColor: "white",
    icon: "error",
    message: "Tipo de Archivo invalido.",
    timeout: 1000,
  });
};
</script>
