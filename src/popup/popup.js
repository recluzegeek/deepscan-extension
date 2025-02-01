const { createApp } = Vue;

createApp({
  data() {
    return {
      isLoggedIn: false,
      email: '',
      password: '',
      videos: [],
      error: null,
      analyzing: false,
    };
  },
  
  computed: {
    hasSelectedVideos() {
      return this.videos.some(video => video.selected);
    }
  },

  async mounted() {
    // Check if user is logged in
    const token = await api.getToken();
    this.isLoggedIn = !!token;

    if (this.isLoggedIn) {
      this.loadVideos();
    }
  },

  methods: {
    async handleLogin() {
      try {
        await api.login(this.email, this.password);
        this.isLoggedIn = true;
        this.loadVideos();
      } catch (error) {
        this.error = error.message;
      }
    },

    async loadVideos() {
      // Get videos from the current tab via content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'getVideos' }, (response) => {
        this.videos = response.videos.map(video => ({
          ...video,
          selected: false
        }));
      });
    },

    async sendSelectedVideos() {
      const selectedVideos = this.videos.filter(video => video.selected);
      try {
        this.analyzing = true;
        this.error = null;
        const result = await api.sendVideosForAnalysis(selectedVideos);
        this.analyzing = false;
        // Clear selections after successful submission
        this.videos = this.videos.map(video => ({
          ...video,
          selected: false
        }));
        alert('Videos sent for deepfake analysis. Check the web platform for results.');
      } catch (error) {
        this.analyzing = false;
        this.error = 'Failed to send videos for analysis. Please try again.';
      }
    }
  }
}).mount('#app'); 