<template>
  <div class="row justify-center">
    <q-card bordered class="my-card q-ma-md text-center">
      <q-card-section>
        <q-inner-loading
          :showing="loading"
          label="Cargando..."
          label-class="text-primary"
          label-style="font-size: 0.9em"
          color="primary"
        />
        <div class="text-h6">Estado General</div>
        <q-scroll-area style="height: 300px; max-width: 600px">
          <canvas style="min-width: 560px" id="eg"></canvas>
        </q-scroll-area>
      </q-card-section>
    </q-card>
    <q-card bordered class="my-card q-ma-md text-center">
      <q-card-section>
        <q-inner-loading
          :showing="loading"
          label="Cargando..."
          label-class="text-primary"
          label-style="font-size: 0.9em"
          color="primary"
        />
        <div class="text-h6">Inspección Técnica</div>
        <q-scroll-area style="height: 300px; max-width: 600px">
          <canvas style="min-width: 560px" id="it"></canvas>
        </q-scroll-area>
      </q-card-section>
    </q-card>
    <q-card bordered class="my-card q-ma-md text-center">
      <q-card-section>
        <q-inner-loading
          :showing="loading"
          label="Cargando..."
          label-class="text-primary"
          label-style="font-size: 0.9em"
          color="primary"
        />
        <div class="text-h6">Mantenimiento Preventivo</div>
        <q-scroll-area style="height: 300px; max-width: 600px">
          <canvas style="min-width: 560px" id="mp"></canvas>
        </q-scroll-area>
      </q-card-section>
    </q-card>
  </div>
</template>
<script setup>
import { useIndicadorStore } from "@/store/indicaStore";
import { client } from "@/client";
import { onMounted, ref } from "vue";
import Chart from "chart.js/auto";

const { getindicador } = useIndicadorStore();
const loading = ref(true);

onMounted(async () => {
  const indicadores = await getindicador({
    uuid: `indicadores_${client}`,
  });
  loading.value = false;
  new Chart(document.getElementById("eg"), {
    data: {
      datasets: [
        {
          type: "bar",
          label: "Total",
          data: indicadores.eg_total,
        },
        {
          type: "line",
          label: "No Aprobado",
          data: indicadores.eg_noaprobado,
        },
      ],
      labels: indicadores.meses,
    },
  });
  new Chart(document.getElementById("it"), {
    data: {
      datasets: [
        {
          type: "bar",
          label: "Total",
          data: indicadores.it_total,
        },
        {
          type: "line",
          label: "No Aprobado",
          data: indicadores.it_noaprobado,
        },
      ],
      labels: indicadores.meses,
    },
  });
  new Chart(document.getElementById("mp"), {
    data: {
      datasets: [
        {
          type: "bar",
          label: "Total",
          data: indicadores.mp_total,
        },
        {
          type: "line",
          label: "No Aprobado",
          data: indicadores.mp_noaprobado,
        },
      ],
      labels: indicadores.meses,
    },
  });
});
</script>
<style lang="scss" scoped>
.my-card {
  width: 100%;
  max-width: 600px;
}
</style>
