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
            :options="['PROGRAMA', 'CUMPLIMIENTO']"
            dense
            :rules="[(val) => (val && val.length > 0) || 'Este campo es obligatorio.']"
            :readonly="submited"
          >
            <template v-slot:before>
              <q-icon name="tune" />
            </template>
          </q-select>

          <q-file v-model="file" label="Archivo" accept=".csv" @rejected="onRejected" :rules="[(val) => val || 'Este campo es obligatorio.']">
            <template v-slot:before>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Cargar" type="submit" color="primary" :loading="submited" />
        </q-card-actions>
      </q-form>
    </q-card>
  </div>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref } from "vue";
import { useMprevStore } from "@/store/mprevStore";
import { useUserStore } from "@/store/userStore";
import { unidad_negocio } from "@/client";
import Papa from "papaparse";
import { useDateFormat } from "@vueuse/core";
import { useRouter } from "vue-router";

const tipo_carga = ref(null);
const { bset, bupdate } = useMprevStore();
const { notify } = useQuasar();
const { name, uid } = useUserStore();
const submited = ref(false);
const file = ref(null);
const router = useRouter();

const onSubmit = () => {
  if (tipo_carga.value === "PROGRAMA") {
    //submited.value = true;
    Papa.parse(file.value, {
      header: true,
      encoding: "ISO-8859-1",
      skipEmptyLines: true,
      complete: async (results) => {
        //Verificamos que el header este correcto
        const fields = [
          "PATENTE",
          "TIPO_SERVICIO",
          "PAUTA_PROYECTADA",
          "SISTEMA_COMPONENTE",
          "CAUSA_ORIGEN",
          "KM_PROYECTADO",
          "FRECUENCIA",
          "TOLERANCIA",
          "FECHA_PROYECTADA",
        ];
        const result = fields.every((field) => results.meta["fields"].includes(field));
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
          const fecha_proyectada = result.FECHA_PROYECTADA.replace(/-/g, "/");
          const [day, month, year] = fecha_proyectada.split("/");
          if (isNaN(day) || isNaN(month) || isNaN(year)) continue;
          const fecha_proyectada_date = new Date(`${year}-${month}-${day}`);
          documentos.set(
            `${result.PATENTE.trim().toUpperCase()}_${result.PAUTA_PROYECTADA.trim().toUpperCase()}_${parseInt(
              result.KM_PROYECTADO.replace(".", "")
            )}`,
            {
              placa_patente: result.PATENTE.trim().toUpperCase(),
              tipo_servicio: result.TIPO_SERVICIO.trim().toUpperCase(),
              pauta_proyectada: result.PAUTA_PROYECTADA.trim().toUpperCase(),
              sistema_componente: result.SISTEMA_COMPONENTE.trim().toUpperCase(),
              causa_origen: result.CAUSA_ORIGEN.trim().toUpperCase(),
              km_proyectado: parseInt(result.KM_PROYECTADO.replace(".", "")),
              frecuencia: parseInt(result.FRECUENCIA.replace(".", "")),
              tolerancia: parseInt(result.TOLERANCIA.replace(".", "")),
              fecha_proyectada: fecha_proyectada,
              fecha_proyectada_timestamp: fecha_proyectada_date.getTime() / 1000,
              user_uid: uid,
              user_name: name,
              unidad_negocio: unidad_negocio,
              fecha_creacion_timestamp: Date.now() / 1000,
              fecha_creacion: new Date().toLocaleDateString("en-GB", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              }),
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
        setTimeout(
          () =>
            router.push({
              name: "revdoc_listp",
            }),
          2500
        );
      },
    });
  } else if (tipo_carga.value === "CUMPLIMIENTO") {
    //submited.value = true;
    Papa.parse(file.value, {
      header: true,
      encoding: "ISO-8859-1",
      skipEmptyLines: true,
      complete: async (results) => {
        //Verificamos que el header este correcto
        const fields = [
          "ID",
          "OT_NUMERO",
          "OT_APERTURA_FECHA",
          "OT_APERTURA_HORA",
          "OT_CIERRE_FECHA",
          "OT_CIERRE_HORA",
          "TALLER_PLANTA",
          "KM_EJECUCION",
          "PAUTA_EJECUTADA",
          "REPUESTO_CODIGO",
          "REPUESTO_TIPO",
          "REPUESTO_MARCA",
          "REPUESTO_DESCRIPCION",
          "REPUESTO_CANTIDAD",
          "INSUMO_CODIGO",
          "INSUMO_DESCRIPCION",
          "INSUMO_CANTIDAD",
          "OBSERVACION",
        ];
        const result = fields.every((field) => results.meta["fields"].includes(field));
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
          const ot_apertura_fecha = result.OT_APERTURA_FECHA.replace(/-/g, "/");
          const ot_cierre_fecha = result.OT_CIERRE_FECHA.replace(/-/g, "/");
          const [day_a, month_a, year_a] = ot_apertura_fecha.split("/");
          const [day_c, month_c, year_c] = ot_cierre_fecha.split("/");
          if (isNaN(day_a) || isNaN(month_a) || isNaN(year_a)) continue;
          if (isNaN(day_c) || isNaN(month_c) || isNaN(year_c)) continue;
          const ot_apertura_date = new Date(`${year_a}-${month_a}-${day_a} ${result.OT_APERTURA_HORA}`);
          const ot_cierre_date = new Date(`${year_c}-${month_c}-${day_c} ${result.OT_CIERRE_HORA}`);
          //Ingreso de repuestos
          let curr_repuestos = [];
          if (documentos.has(result.ID)) curr_repuestos = documentos.get(result.ID).repuestos;
          if (result.REPUESTO_CODIGO !== "")
            curr_repuestos.push({
              repuesto_codigo: result.REPUESTO_CODIGO.trim().toUpperCase(),
              repuesto_tipo: result.REPUESTO_TIPO.trim().toUpperCase(),
              repuesto_marca: result.REPUESTO_MARCA.trim().toUpperCase(),
              repuesto_descripcion: result.REPUESTO_DESCRIPCION.trim().toUpperCase(),
              repuesto_cantidad: parseInt(result.REPUESTO_CANTIDAD.replace(".", "")) || 0,
            });
          //Ingreso de insumos
          let curr_insumos = [];
          if (documentos.has(result.ID)) curr_insumos = documentos.get(result.ID).insumos;
          if (result.INSUMO_CODIGO !== "")
            curr_insumos.push({
              insumo_codigo: result.INSUMO_CODIGO.trim().toUpperCase(),
              insumo_descripcion: result.INSUMO_DESCRIPCION.trim().toUpperCase(),
              insumo_cantidad: parseInt(result.INSUMO_CANTIDAD.replace(".", "")) || "",
            });
          documentos.set(result.ID, {
            uuid: result.ID,
            ot_numero: parseInt(result.OT_NUMERO.replace(".", "")),
            ot_apertura_fecha: useDateFormat(ot_apertura_date, "DD/MM/YYYY").value,
            ot_apertura_hora: useDateFormat(ot_apertura_date, "HH:mm:ss").value,
            ot_apertura_timestamp: ot_apertura_date.getTime() / 1000,
            ot_cierre_fecha: useDateFormat(ot_cierre_date, "DD/MM/YYYY").value,
            ot_cierre_hora: useDateFormat(ot_cierre_date, "HH:mm:ss").value,
            ot_cierre_timestamp: ot_cierre_date.getTime() / 1000,
            taller_planta: result.TALLER_PLANTA.trim().toUpperCase(),
            km_ejecucion: parseInt(result.KM_EJECUCION.replace(".", "")),
            pauta_ejecutada: result.PAUTA_EJECUTADA.trim().toUpperCase(),
            observacion: result.OBSERVACION.trim().toUpperCase(),
            user_uid_actualizacion: uid,
            user_name_actualizacion: name,
            fecha_actualizacion_timestamp: Date.now() / 1000,
            fecha_actualizacion: useDateFormat(new Date(), "DD/MM/YYYY").value,
            hora_actualizacion: useDateFormat(new Date(), "HH:mm:ss").value,
            repuestos: curr_repuestos,
            insumos: curr_insumos,
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
        setTimeout(
          () =>
            router.push({
              name: "revdoc_listp",
            }),
          2500
        );
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
