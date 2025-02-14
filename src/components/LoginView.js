import { ref, h } from "../lib/vue.runtime.esm-browser.js";
import * as api from "../utils/api.js";

const formatError = (error) => {
  if (error.message.includes("fetch")) {
    return "Unable to connect to server. Please check your internet connection.";
  }
  if (error.message.includes("invalid")) {
    return "Server error. Please try again later.";
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
        // Send error to background script for logging
        chrome.runtime.sendMessage({
          type: "error",
          error: {
            message: err.message,
            stack: err.stack,
            context: "login",
          },
        });
      } finally {
        loading.value = false;
      }
    };

    return () =>
      h("div", { class: "login-container", style: "padding: 20px;" }, [
        h("h2", { style: "margin-bottom: 16px;" }, "Welcome Back!"),
        h(
          "p",
          {
            class: "login-subtitle",
            style: "margin-bottom: 24px; color: #666;",
          },
          "Login to detect deepfake videos"
        ),

        h(
          "form",
          {
            style: "display: flex; flex-direction: column; gap: 16px;",
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
              }),
              h("i", {
                class: `fas ${showPassword.value ? "fa-eye-slash" : "fa-eye"}`,
                style: "cursor: pointer;",
                onClick: () => (showPassword.value = !showPassword.value),
              }),
            ]),
            h(
              "button",
              {
                type: "submit",
                class: "login-btn",
                disabled: loading.value,
                style: "margin-top: 8px;",
              },
              [
                h(
                  "span",
                  {
                    style: {
                      display: loading.value ? "none" : "inline",
                    },
                  },
                  "Login"
                ),
                h("span", {
                  class: "loading-spinner",
                  style: {
                    display: loading.value ? "inline" : "none",
                  },
                }),
              ]
            ),
          ]
        ),

        // Only show error message if there is an error
        error.value &&
          h(
            "div",
            {
              class: "error-message",
              style: "margin-top: 16px;",
            },
            [h("i", { class: "fas fa-exclamation-circle" }), h("span", { style: "margin-left: 8px;" }, error.value)]
          ),

        h(
          "div",
          {
            class: "login-footer",
            style: "margin-top: 24px; display: flex; gap: 16px; justify-content: center;",
          },
          [
            h(
              "a",
              {
                href: "http://localhost:8000/register",
                target: "_blank",
                style: "color: #666; text-decoration: none;",
              },
              "Create Account"
            ),
            h("span", { style: "color: #666;" }, "|"),
            h(
              "a",
              {
                href: "http://localhost:8000/password/reset",
                target: "_blank",
                style: "color: #666; text-decoration: none;",
              },
              "Forgot Password?"
            ),
          ]
        ),
      ]);
  },
};
