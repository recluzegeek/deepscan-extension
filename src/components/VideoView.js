import { ref, h } from "../lib/vue.runtime.esm-browser.js";
import * as api from "../utils/api.js";

export default {
  name: "VideoView",
  props: {
    videos: {
      type: Array,
      required: true,
    },
  },
  emits: ["logout"],
  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);
    const selectedVideos = ref([]);
    const uploadProgress = ref(0);

    const toggleVideoSelection = (video) => {
      const index = selectedVideos.value.findIndex((v) => v.url === video.url);
      if (index === -1) {
        if (selectedVideos.value.length >= 4) {
          error.value = "Maximum 4 videos can be selected at once";
          return;
        }
        selectedVideos.value.push(video);
      } else {
        selectedVideos.value.splice(index, 1);
      }
      error.value = null;
    };

    const handleAnalyze = async () => {
      if (selectedVideos.value.length === 0) {
        error.value = "Please select at least one video";
        return;
      }

      try {
        loading.value = true;
        error.value = null;

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += 10;
          }
        }, 500);

        await api.sendVideosForAnalysis(selectedVideos.value);
        uploadProgress.value = 100;

        setTimeout(() => {
          selectedVideos.value = [];
          uploadProgress.value = 0;
          loading.value = false;
          alert("Videos sent for analysis. Check the web platform for results.");
        }, 500);

        clearInterval(progressInterval);
      } catch (err) {
        error.value = err.message;
        loading.value = false;
        uploadProgress.value = 0;
      }
    };

    const handleLogout = async () => {
      try {
        await api.logout();
        emit("logout");
      } catch (err) {
        error.value = err.message;
      }
    };

    const formatDuration = (seconds) => {
      if (!seconds) return "";
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return () =>
      h("div", { class: "video-container" }, [
        h("div", { class: "video-header" }, [
          h("div", { class: "header-left" }, [h("span", { class: "video-count" }, `${selectedVideos.value.length}/4`)]),
          h(
            "button",
            {
              class: "icon-button",
              onClick: handleLogout,
              title: "Logout",
            },
            [h("i", { class: "fas fa-sign-out-alt" })]
          ),
        ]),

        props.videos.length === 0
          ? h("div", { class: "empty-state" }, [
              h("i", { class: "fas fa-film" }),
              h("p", {}, "No videos found on this page"),
            ])
          : h(
              "div",
              { class: "video-grid" },
              props.videos.map((video) =>
                h(
                  "div",
                  {
                    class: `video-card ${selectedVideos.value.some((v) => v.url === video.url) ? "selected" : ""}`,
                    onClick: () => toggleVideoSelection(video),
                  },
                  [
                    h("div", { class: "thumbnail-container" }, [
                      h("img", {
                        src: video.thumbnail,
                        alt: video.title,
                        loading: "lazy",
                      }),
                      h("div", { class: "duration-badge" }, formatDuration(video.duration)),
                      h("div", { class: "selection-overlay" }, [
                        h("i", {
                          class: `fas fa-${
                            selectedVideos.value.some((v) => v.url === video.url) ? "check-circle" : "circle"
                          }`,
                        }),
                      ]),
                    ]),
                    h("div", { class: "video-info" }, [
                      h("h3", { class: "video-title" }, video.title),
                      h("span", { class: "video-type" }, [
                        h("i", {
                          class: `fas fa-${video.type === "youtube" ? "youtube" : "video"}`,
                        }),
                      ]),
                    ]),
                  ]
                )
              )
            ),

        selectedVideos.value.length > 0 &&
          h(
            "button",
            {
              class: "analyze-fab",
              disabled: loading.value,
              onClick: handleAnalyze,
            },
            [loading.value ? h("div", { class: "loading-spinner" }) : h("i", { class: "fas fa-search" })]
          ),
      ]);
  },
};
