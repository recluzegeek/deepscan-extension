import { ref, h } from "../lib/vue.runtime.esm-browser.js";

export default {
  name: "VideoView",
  props: {
    videos: Array,
    error: String,
  },
  emits: ["logout"],
  setup(props, { emit }) {
    const selectedVideos = ref(new Set());

    const toggleVideoSelection = (video) => {
      if (selectedVideos.value.has(video.url)) {
        selectedVideos.value.delete(video.url);
      } else {
        selectedVideos.value.add(video.url);
      }
    };

    return () =>
      h("div", { class: "video-container" }, [
        // Header with logout
        h("div", { class: "video-header" }, [
          h("div", { class: "header-content" }, [
            h("h2", null, "Videos"),
            h("span", { class: "video-count" }, 
              `${selectedVideos.value.size} selected`
            ),
          ]),
          h(
            "button",
            {
              class: "logout-btn",
              onClick: () => emit("logout"),
            },
            [h("i", { class: "fas fa-sign-out-alt" }), "Logout"]
          ),
        ]),

        // Videos list
        props.videos.length > 0
          ? h("div", { class: "video-list" }, [
              ...props.videos.map((video) =>
                h("div", {
                  class: [
                    "video-item",
                    { selected: selectedVideos.value.has(video.url) },
                  ],
                  onClick: () => toggleVideoSelection(video),
                }, [
                  // Thumbnail or video type icon
                  h("div", { class: "video-thumbnail" }, [
                    video.thumbnail 
                      ? h("img", { src: video.thumbnail })
                      : h("i", { class: "fas fa-video" }),
                    video.duration && h("span", { class: "video-duration" }, 
                      formatDuration(video.duration)
                    ),
                  ]),
                  // Video info
                  h("div", { class: "video-info" }, [
                    h("div", { class: "video-title" }, video.title),
                    h("div", { class: "video-type" }, [
                      h("i", { 
                        class: video.type === 'youtube' 
                          ? 'fab fa-youtube' 
                          : 'fas fa-play-circle'
                      }),
                      video.type === 'youtube' ? 'YouTube' : 'HTML5 Video',
                    ]),
                    h("div", { class: "video-page" }, video.pageTitle),
                  ]),
                ])
              ),
            ])
          : h("div", { class: "no-videos" }, [
              h("i", { class: "fas fa-video-slash" }),
              h("p", null, "No videos found"),
            ]),

        // Error message if any
        props.error && h("div", { class: "error-message" }, [
          h("i", { class: "fas fa-exclamation-circle" }),
          props.error,
        ]),

        // Analyze button
        selectedVideos.value.size > 0 &&
          h(
            "button",
            {
              class: "analyze-btn",
              onClick: () => {
                // Handle analysis here
              },
            },
            [h("i", { class: "fas fa-play" }), "Analyze Selected"]
          ),
      ]);
  },
};

function formatDuration(seconds) {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
