<template>
  <div
    class="bg window-height window-width row justify-center items-center text-white text-h3 text-weight-medium"
  >
    Desautorizado
  </div>
</template>
<script setup>
import { useUserStore } from "@/store/userStore";
import { onMounted } from "vue";
const { clearuser } = useUserStore();

onMounted(() => {
  clearuser();
});
</script>
<style lang="scss" scoped>
.bg {
  background: url("/images/lock.webp") no-repeat fixed center bottom;
  background-size: cover;
  height: 100vh;
}
</style>
