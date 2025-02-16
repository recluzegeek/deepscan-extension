import { ref, h } from "../lib/vue.runtime.esm-browser.js";
import * as api from "../utils/api.js";
import { CONFIG } from "../config/config.js";

const formatError = (error) => {
  if (error.message.includes("fetch")) {
    return "Unable to connect to server. Please check your internet connection.";
  }
  if (error.message.includes("invalid")) {
    return "Invalid credentials. Please try again.";
  }
  return error.message || "An unexpected error occurred";
};

export default {
  name: "LoginView",
  emits: ["login-success"],
  setup(props, { emit }) {
    const email = ref("");
    const password = ref("");
    const error = ref(null);
    const loading = ref(false);
    const showPassword = ref(false);

    const handleLogin = async () => {
      try {
        loading.value = true;
        error.value = null;
        await api.login(email.value, password.value);
        emit("login-success");
      } catch (err) {
        error.value = formatError(err);
        chrome.runtime.sendMessage({
          type: "log",
          data: { message: err.message, context: "login" },
        });
      } finally {
        loading.value = false;
      }
    };

    return () =>
      h("div", { class: "login-container" }, [
        // Centered logo and branding
        h("div", { class: "login-header" }, [
          h("img", {
            src: "../../assets/icons/icon128.png",
            alt: "DeepScan Logo",
            class: "login-logo",
          }),
          h("h1", { class: "brand-name" }, "DeepScan"),
          h("p", { class: "brand-tagline" }, "AI-Powered Deepfake Detection"),
        ]),

        h(
          "form",
          {
            class: "login-form",
            onSubmit: (e) => {
              e.preventDefault();
              handleLogin();
            },
          },
          [
            h("div", { class: "input-group" }, [
              h("i", { class: "fas fa-envelope" }),
              h("input", {
                type: "email",
                placeholder: "Email",
                value: email.value,
                onInput: (e) => (email.value = e.target.value),
                required: true,
                disabled: loading.value,
                class: "login-input",
              }),
            ]),

            h("div", { class: "input-group" }, [
              h("i", { class: "fas fa-lock" }),
              h("input", {
                type: showPassword.value ? "text" : "password",
                placeholder: "Password",
                value: password.value,
                onInput: (e) => (password.value = e.target.value),
                required: true,
                disabled: loading.value,
                class: "login-input",
              }),
              h("i", {
                class: `fas ${showPassword.value ? "fa-eye-slash" : "fa-eye"} password-toggle`,
                onClick: () => (showPassword.value = !showPassword.value),
              }),
            ]),

            error.value &&
              h("div", { class: "error-message" }, [h("i", { class: "fas fa-exclamation-circle" }), error.value]),

            h(
              "button",
              {
                type: "submit",
                class: "login-btn",
                disabled: loading.value,
              },
              [
                loading.value
                  ? h("div", { class: "loading-spinner" })
                  : [h("i", { class: "fas fa-sign-in-alt" }), "Sign In"],
              ]
            ),
          ]
        ),

        h("div", { class: "login-footer" }, [
          h(
            "a",
            {
              href: `${CONFIG.WEB_URL}/register`,
              target: "_blank",
              class: "footer-link",
            },
            "Create Account"
          ),
          h("span", { class: "divider" }, "•"),
          h(
            "a",
            {
              href: `${CONFIG.WEB_URL}/password/reset`,
              target: "_blank",
              class: "footer-link",
            },
            "Forgot Password?"
          ),
        ]),
      ]);
  },
};
