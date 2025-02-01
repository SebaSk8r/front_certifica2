<template>
  <div
    class="bg window-height window-width row justify-center items-center text-white text-h3 text-weight-medium"
  >
    No encontrado
  </div>
</template>
<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
onMounted(() => {
  setTimeout(() => router.push({ name: "home" }), 4000);
});
</script>
<style lang="scss" scoped>
.bg {
  background: url("/images/lock.webp") no-repeat fixed center bottom;
  background-size: cover;
  height: 100vh;
}
</style>
