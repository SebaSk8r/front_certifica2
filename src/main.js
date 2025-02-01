import { createApp } from "vue";
import { createPinia } from "pinia";
import { Quasar, Notify } from "quasar";
import quasarLang from "quasar/lang/es";

// Import icon libraries
import "@quasar/extras/roboto-font/roboto-font.css";
import "@quasar/extras/material-icons/material-icons.css";

// Import Quasar css
import "quasar/dist/quasar.css";

//App css
import "./styles/app.sass";

import App from "./App.vue";
import router from "./router";
import "./firebase";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.use(Quasar, {
  plugins: { Notify }, // import Quasar plugins and add here
  lang: quasarLang,
  config: {
    brand: {
      primary: "#1a237e",
    },
  },
});

app.mount("#app");
