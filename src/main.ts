import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";
import FloatingVue from "floating-vue";

import "vue-skeletor/dist/vue-skeletor.css";

const app = createApp(App);

app.use(FloatingVue, {
  themes: {
    "ui-popper-dropdown": {
      $resetCss: true,
      triggers: ["click"],
      autoHide: true,
      placement: "bottom",
    },
  },
});

app.mount("#app");
