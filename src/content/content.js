// Keep track of videos during browser session
let sessionVideos = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideos") {
    // Do fresh scan and combine with session videos
    const newVideos = findVideos();
    sessionVideos = mergeVideos(sessionVideos, newVideos);
    sendResponse({ videos: sessionVideos });
    return true;
  }
});

function findVideos() {
  const videos = [];
  
  try {
    // 1. Check for YouTube main video
    if (window.location.hostname.includes('youtube.com') && 
        window.location.pathname.includes('/watch')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      if (videoId) {
        videos.push({
          url: window.location.href,
          title: document.title.replace('- YouTube', '').trim(),
          type: 'youtube',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          pageTitle: document.title
        });
      }
    }

    // 2. Check for HTML5 video elements
    document.querySelectorAll('video').forEach(video => {
      if (video.src || video.querySelector('source')) {
        const rect = video.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          videos.push({
            url: video.src || video.querySelector('source').src,
            title: video.title || findVideoTitle(video) || document.title,
            type: 'html5',
            duration: Math.round(video.duration) || null,
            pageTitle: document.title
          });
        }
      }
    });

    // 3. Check for embedded YouTube videos
    document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(iframe => {
      const videoId = iframe.src.match(/\/embed\/([^/?]+)/)?.[1];
      if (videoId) {
        videos.push({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: iframe.title || 'Embedded YouTube Video',
          type: 'youtube',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          pageTitle: document.title
        });
      }
    });

  } catch (error) {
    console.error('Error finding videos:', error);
  }

  return videos;
}

function findVideoTitle(video) {
  // Try to find the best title for the video
  const container = video.closest('div, article, section');
  return (
    video.title ||
    video.getAttribute('aria-label') ||
    video.getAttribute('data-title') ||
    container?.querySelector('h1, h2, h3')?.textContent?.trim() ||
    null
  );
}

function mergeVideos(oldVideos, newVideos) {
  const merged = [...oldVideos];
  const seen = new Set(oldVideos.map(v => v.url));
  
  newVideos.forEach(video => {
    if (!seen.has(video.url)) {
      merged.push(video);
      seen.add(video.url);
    }
  });
  
  return merged;
}
