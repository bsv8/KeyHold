import DefaultTheme from "vitepress/theme";
import KeyHoldHome from "./KeyHoldHome.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("KeyHoldHome", KeyHoldHome);
  }
};
