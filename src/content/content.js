chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideos") {
    const videos = [];

    // Find HTML5 video elements more thoroughly
    const videoElements = Array.from(document.getElementsByTagName("video"));
    videoElements.forEach((video, index) => {
      // Only include videos that are actually visible and playable
      if (isVideoPlayable(video)) {
        const videoData = extractVideoData(video, index);
        if (videoData) videos.push(videoData);
      }
    });

    // Enhanced YouTube detection
    if (window.location.hostname.includes("youtube.com")) {
      collectYouTubeVideos(videos);
    }

    // Find embedded videos more thoroughly
    collectEmbeddedVideos(videos);

    sendResponse({ videos: removeDuplicates(videos) });
  }
  return true;
});

function isVideoPlayable(video) {
  const style = window.getComputedStyle(video);
  const rect = video.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0 &&
    (video.src || video.querySelector("source"))
  );
}

function extractVideoData(video, index) {
  let videoUrl = video.src;
  if (!videoUrl && video.querySelector("source")) {
    videoUrl = video.querySelector("source").src;
  }

  if (!videoUrl) return null;

  // Get more accurate video title
  const videoTitle = findVideoTitle(video) || `Video ${index + 1}`;

  return {
    url: videoUrl,
    title: videoTitle,
    type: "html5",
    thumbnail: video.poster || generateThumbnail(video),
    duration: video.duration || null,
    dimensions: {
      width: video.videoWidth,
      height: video.videoHeight,
    },
  };
}

function findVideoTitle(video) {
  // Try multiple ways to find video title
  return (
    video.title ||
    video.getAttribute("aria-label") ||
    video.getAttribute("data-title") ||
    video.closest("[aria-label]")?.getAttribute("aria-label") ||
    video.closest('div[class*="title" i]')?.textContent?.trim() ||
    null
  );
}

// Helper function to get YouTube video ID
function getYouTubeVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v");
    } else if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    } else if (url.includes("embed/")) {
      return url.split("embed/")[1].split("/")[0].split("?")[0];
    }
  } catch (e) {
    console.error("Error parsing URL:", e);
  }
  return null;
}

// Helper function to convert YouTube duration text to seconds
function getDurationFromText(text) {
  if (!text) return null;
  const parts = text.trim().split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

// Helper function to remove duplicate videos
function removeDuplicates(videos) {
  const seen = new Set();
  return videos.filter((video) => {
    const key = `${video.url}|${video.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
