<template>
  <div class="q-pa-md">
    <q-card bordered class="q-ma-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">General</div>
      </q-card-section>
      <q-form @submit="onSubmit">
        <q-card-section>
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
import { useRevtecStore } from "@/store/revtecStore";
import { useUserStore } from "@/store/userStore";
import Papa from "papaparse";
import { useDateFormat } from "@vueuse/core";
import { useRouter } from "vue-router";

const { bset } = useRevtecStore();
const { notify } = useQuasar();
const { name, uid } = useUserStore();
const submited = ref(false);
const file = ref(null);
const router = useRouter();

const onSubmit = async () => {
  //submited.value = true;
  Papa.parse(file.value, {
    header: true,
    encoding: "ISO-8859-1",
    skipEmptyLines: true,
    complete: async (results) => {
      //Verificamos que el header este correcto
      const fields = [
        "PATENTE",
        "UNIDAD_NEGOCIO",
        "UNIDAD_SERVICIO",
        "TIPO_SERVICIO",
        "SISTEMA_COMPONENTE",
        "CRT_NUM_CERTIFICADO",
        "CRT_APERTURA_FECHA",
        "CRT_APERTURA_HORA",
        "CRT_CIERRE_FECHA",
        "CRT_CIERRE_HORA",
        "CRT_TALLER_PLANTA",
        "KM_EJECUCION",
        "CRT_RESULTADO",
        "CRT_VENCIMIENTO_FECHA",
        "CRT_RESULTADO_GASESG",
        "CRT_RESULTADO_IDENTIFICACION",
        "CRT_RESULTADO_VISUAL",
        "CRT_RESULTADO_LUCES",
        "CRT_RESULTADO_ALINEACION",
        "CRT_RESULTADO_FRENOS",
        "CRT_RESULTADO_HOLGURAS",
        "CRT_RESULTADO_GASES",
        "CRT_RESULTADO_OPACIDAD",
        "CRT_RESULTADO_ANGULO_GIRO",
        "CRT_RESULTADO_RUIDOS",
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
        const crt_apertura_fecha = result.CRT_APERTURA_FECHA.replace(/-/g, "/");
        const crt_cierre_fecha = result.CRT_CIERRE_FECHA.replace(/-/g, "/");
        const crt_vencimiento_fecha = result.CRT_VENCIMIENTO_FECHA.replace(
          /-/g,
          "/"
        );

        const [day_a, month_a, year_a] = crt_apertura_fecha.split("/");
        const [day_c, month_c, year_c] = crt_cierre_fecha.split("/");
        const [day_v, month_v, year_v] = crt_vencimiento_fecha.split("/");
        if (isNaN(day_a) || isNaN(month_a) || isNaN(year_a)) continue;
        if (isNaN(day_c) || isNaN(month_c) || isNaN(year_c)) continue;
        if (isNaN(day_v) || isNaN(month_v) || isNaN(year_v)) continue;
        const crt_apertura_date = new Date(
          `${year_a}-${month_a}-${day_a} ${result.CRT_APERTURA_HORA}`
        );
        const crt_cierre_date = new Date(
          `${year_c}-${month_c}-${day_c} ${result.CRT_CIERRE_HORA}`
        );
        const crt_vencimiento_date = new Date(
          `${year_v}-${month_v}-${day_v} 23:59:59`
        );

        const group = [];
        const defectos = [];

        if (result.CRT_RESULTADO_GASESG.trim().toUpperCase() === "A")
          group.push("R-1");
        else defectos.push("R-1");
        if (result.CRT_RESULTADO_IDENTIFICACION.trim().toUpperCase() === "A")
          group.push("R-2");
        else defectos.push("R-2");
        if (result.CRT_RESULTADO_VISUAL.trim().toUpperCase() === "A")
          group.push("R-3");
        else defectos.push("R-3");
        if (result.CRT_RESULTADO_LUCES.trim().toUpperCase() === "A")
          group.push("R-4");
        else defectos.push("R-4");
        if (result.CRT_RESULTADO_ALINEACION.trim().toUpperCase() === "A")
          group.push("R-5");
        else defectos.push("R-5");
        if (result.CRT_RESULTADO_FRENOS.trim().toUpperCase() === "A")
          group.push("R-6");
        else defectos.push("R-6");
        if (result.CRT_RESULTADO_HOLGURAS.trim().toUpperCase() === "A")
          group.push("R-7");
        else defectos.push("R-7");
        if (result.CRT_RESULTADO_GASES.trim().toUpperCase() === "A")
          group.push("R-8");
        else defectos.push("R-8");
        if (result.CRT_RESULTADO_OPACIDAD.trim().toUpperCase() === "A")
          group.push("R-9");
        else defectos.push("R-9");
        if (result.CRT_RESULTADO_ANGULO_GIRO.trim().toUpperCase() === "A")
          group.push("R-10");
        else defectos.push("R-10");
        if (result.CRT_RESULTADO_RUIDOS.trim().toUpperCase() === "A")
          group.push("R-11");
        else defectos.push("R-11");

        documentos.set(result.CRT_NUM_CERTIFICADO.trim().toUpperCase(), {
          placa_patente: result.PATENTE.trim().toUpperCase(),
          unidad_negocio: result.UNIDAD_NEGOCIO.trim()
            .toUpperCase()
            .replace("U", ""),
          unidad_servicio: result.UNIDAD_SERVICIO.trim().toUpperCase(),
          tipo_servicio: "TECNICA",
          sistema_componente: result.SISTEMA_COMPONENTE.trim().toUpperCase(),
          crt_num_certificado: result.CRT_NUM_CERTIFICADO.trim().toUpperCase(),
          crt_apertura_fecha: useDateFormat(crt_apertura_date, "DD/MM/YYYY")
            .value,
          crt_apertura_hora: useDateFormat(crt_apertura_date, "HH:mm:ss").value,
          crt_apertura_timestamp: crt_apertura_date.getTime() / 1000,
          crt_cierre_fecha: useDateFormat(crt_cierre_date, "DD/MM/YYYY").value,
          crt_cierre_hora: useDateFormat(crt_cierre_date, "HH:mm:ss").value,
          crt_cierre_timestamp: crt_cierre_date.getTime() / 1000,

          crt_vencimiento_fecha: useDateFormat(
            crt_vencimiento_date,
            "DD/MM/YYYY"
          ).value,
          crt_vencimiento_hora: useDateFormat(crt_vencimiento_date, "HH:mm:ss")
            .value,
          crt_vencimiento_timestamp: crt_vencimiento_date.getTime() / 1000,
          crt_taller_planta: result.CRT_TALLER_PLANTA.trim().toUpperCase(),
          km_ejecucion: parseInt(result.KM_EJECUCION.replace(".", "")),
          group: group,
          defectos: defectos,
          user_uid: uid,
          user_name: name,
          fecha_creacion_timestamp: Date.now() / 1000,
          fecha_creacion: useDateFormat(new Date(), "DD/MM/YYYY").value,
          hora_creacion: useDateFormat(new Date(), "HH:mm:ss").value,
          certifica:
            result.CRT_RESULTADO.trim().toUpperCase() === "A" ? true : false,
        });
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
            name: "revdoc_listt",
          }),
        2500
      );
    },
  });
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
