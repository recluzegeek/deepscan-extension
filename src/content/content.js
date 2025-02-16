// Keep track of videos during browser session
let sessionVideos = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideos") {
    // Get current videos and merge with stored videos
    chrome.storage.local.get(['sessionVideos'], async (result) => {
      const storedVideos = result.sessionVideos || [];
      const newVideos = findVideos();
      const mergedVideos = mergeVideos(storedVideos, newVideos);
      
      // Store merged videos back
      await chrome.storage.local.set({ sessionVideos: mergedVideos });
      sendResponse({ videos: mergedVideos });
    });
    return true;
  }
});

function findVideos() {
  const videos = [];
  const youtubeUrls = new Set(); // Track YouTube URLs to avoid duplicates
  
  try {
    // 1. Check for YouTube main video first
    if (window.location.hostname.includes('youtube.com') && 
        window.location.pathname.includes('/watch')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      if (videoId) {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        youtubeUrls.add(youtubeUrl);
        videos.push({
          url: youtubeUrl,
          title: document.title.replace('- YouTube', '').trim(),
          type: 'youtube',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          pageTitle: document.title,
          timestamp: new Date().toISOString() // Add timestamp for sorting
        });
      }
    }

    // 2. Check for embedded YouTube videos
    document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(iframe => {
      const videoId = iframe.src.match(/\/embed\/([^/?]+)/)?.[1];
      if (videoId) {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        if (!youtubeUrls.has(youtubeUrl)) {
          youtubeUrls.add(youtubeUrl);
          videos.push({
            url: youtubeUrl,
            title: iframe.title || 'Embedded YouTube Video',
            type: 'youtube',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            pageTitle: document.title,
            timestamp: new Date().toISOString() // Add timestamp for sorting
          });
        }
      }
    });

    // 3. Check for HTML5 video elements (skip if they're YouTube videos)
    document.querySelectorAll('video').forEach(video => {
      const videoUrl = video.src || video.querySelector('source')?.src;
      if (videoUrl && !videoUrl.includes('youtube.com') && !isYouTubeVideo(video)) {
        const rect = video.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          videos.push({
            url: videoUrl,
            title: video.title || findVideoTitle(video) || document.title,
            type: 'html5',
            duration: Math.round(video.duration) || null,
            pageTitle: document.title,
            timestamp: new Date().toISOString() // Add timestamp for sorting
          });
        }
      }
    });

  } catch (error) {
    console.error('Error finding videos:', error);
  }

  return videos;
}

function isYouTubeVideo(video) {
  // Check if video is part of YouTube player
  return (
    video.closest('.html5-video-player') !== null || // YouTube main player
    video.closest('[class*="youtube"]') !== null || // Common YouTube class patterns
    video.closest('iframe[src*="youtube"]') !== null // YouTube iframe
  );
}

function findVideoTitle(video) {
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
  
  // Sort by timestamp, newest first
  return merged.sort((a, b) => {
    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
  });
}
