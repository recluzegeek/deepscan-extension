chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideos') {
    const videos = [];
    
    // Find HTML5 video elements
    document.querySelectorAll('video').forEach(video => {
      videos.push({
        url: video.src || video.querySelector('source')?.src,
        title: video.title || 'Video ' + (videos.length + 1),
        type: 'html5'
      });
    });

    // Find YouTube iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      if (iframe.src.includes('youtube.com/embed/')) {
        videos.push({
          url: iframe.src,
          title: 'YouTube Video ' + (videos.length + 1),
          type: 'youtube'
        });
      }
    });

    sendResponse({ videos });
  }
  return true;
}); 