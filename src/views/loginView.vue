<template>
  <div class="bg text-center">
    <q-btn
      class="q-ma-md"
      color="black"
      label="Iniciar con Google"
      @click="login"
    />
    <q-btn
      class="q-ma-md"
      color="purple"
      label="Iniciar con Email"
      @click="dialog = true"
    />
  </div>
  <q-dialog v-model="dialog" transition-show="scale" transition-hide="scale">
    <q-card bordered class="q-ma-md">
      <q-form @submit="login_email" autocomplete="off">
        <q-card-section>
          <q-input
            v-model="email"
            label="EMAIL"
            type="email"
            :rules="[
              (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
              (val) =>
                /.+@SLARED.CL$/.test(val.toUpperCase()) || 'Email invalido',
            ]"
            dense
            input-class="text-uppercase"
            :readonly="submited"
            lazy-rules
          >
            <template v-slot:before>
              <q-icon name="person" />
            </template>
          </q-input>
          <q-input
            v-model="password"
            label="PASSWORD"
            :rules="[
              (val) => (val && val.length > 0) || 'Este campo es obligatorio.',
            ]"
            :type="isPwd ? 'password' : 'text'"
            dense
            input-class="text-uppercase"
            :readonly="submited"
            lazy-rules
          >
            <template v-slot:before>
              <q-icon name="key" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="Iniciar"
            type="submit"
            color="black"
            :loading="submited"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { useUserStore } from "@/store/userStore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { ref } from "vue";
import { useQuasar } from "quasar";
import { client } from "@/client";
import { useRouter } from "vue-router";
import { auth } from "@/firebase";
const { setuser } = useUserStore();
const { notify } = useQuasar();
const dialog = ref(false);
const email = ref(null);
const password = ref(null);
const submited = ref(false);
const isPwd = ref(true);
const router = useRouter();

const login = () => {
  signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver)
    .then((authResult) => {
      authResult.user.getIdTokenResult().then((tokenResult) => {
        tokenResult.claims.allow_access;
        if (tokenResult.claims.allow_access) {
          setuser({
            uid: authResult.user.uid,
            name: authResult.user.displayName,
            only_view: false,
            admin: tokenResult.claims.allow_admin ? true : false,
          });
          router.push({ name: "home" });
        } else router.push({ name: "noaccess" });
      });
    })
    .catch((error) => {
      console.log(error);
    });
};
const login_email = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then((authResult) => {
      authResult.user.getIdTokenResult().then((tokenResult) => {
        if (tokenResult.claims[client] || tokenResult.claims.dtpm) {
          setuser({
            uid: authResult.user.uid,
            name: email.value,
            only_view: true,
            admin: false,
            dtpm: tokenResult.claims.dtpm ? true : false,
            sumi: tokenResult.claims.sumi ? true : false,
            srepu: tokenResult.claims.srepu ? true : false,
            srepa: tokenResult.claims.srepa ? true : false,
            sdiag: tokenResult.claims.sdiag ? true : false,
            carro: tokenResult.claims.carro ? true : false,
          });
          if (tokenResult.claims.carro) router.push({ name: "soploc_listru" });
          else router.push({ name: "home" });
        } else router.push({ name: "noaccess" });
      });
    })
    .catch(() => {
      notify({
        color: "red-6",
        textColor: "white",
        icon: "error",
        message: "Usuario o Password invalido.",
        timeout: 5000,
      });
    });
};
</script>
<style lang="scss" scoped>
.bg {
  background: url("/images/lock.webp") no-repeat fixed center bottom;
  background-size: cover;
  height: 100vh;
}
</style>
