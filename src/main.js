import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

if (
  localStorage.getItem("color-theme") === "dark" ||
  (!("color-theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const app = createApp(App);

app.use(router);

app.mount("#app");
