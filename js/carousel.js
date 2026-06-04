const IFRAME_LOAD_TIMEOUT = 8000;
const DEFAULT_LANG = "en";

const params = new URLSearchParams(window.location.search);

const startIndexParam = params.has("start")
  ? Number.parseInt(params.get("start"), 10)
  : null;

const startId = params.get("startId") || null;
const mode = params.get("mode") || "select";
const isAutoplay = mode === "all";

const currentLang =
  localStorage.getItem("siteLanguage") || DEFAULT_LANG;

import { videoData as importedVideoData } from "./data.js";

const chooseLang = (obj) =>
  (obj && obj[currentLang])
    ? obj[currentLang]
    : (obj && obj[DEFAULT_LANG]) || "";

const createEl = (
  tag,
  attrs = {},
  children = []
) => {
  const el = document.createElement(tag);

  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null) return;

    if (k === "class") {
      el.className = v;
    } else if (k === "text") {
      el.textContent = v;
    } else {
      el.setAttribute(k, v);
    }
  });

  children.forEach(child => el.appendChild(child));

  return el;
};

class Carousel {
  constructor({
    rootSelector = "#carousel",
    navSelector = ".chapter-nav"
  } = {}) {

    this.rootSelector = rootSelector;
    this.navSelector = navSelector;

    this.root = null;
    this.nav = null;

    this.videoData = importedVideoData || [];
    this.carouselVideos = [];

    this.activePlayerIndex = null;
    this.resolvedStartIndex = 0;
  }

  async init() {

    this.root = document.querySelector(this.rootSelector);
    this.nav = document.querySelector(this.navSelector);

    if (!this.root) return;

    this.filterVideos();
    this.buildSections();
    this.setupScrollActivation();
    this.resolveStartIndexAndActivate();
    this.handleUnload();
  }

  filterVideos() {

    const reelParam = params.get("reel");
    const normalizedMode = String(mode || "").toLowerCase();

    const wantReel =
      normalizedMode === "reel" ||
      ["1", "true"].includes(reelParam);

    const wantAll = normalizedMode === "all";

    if (wantReel) {
      this.carouselVideos =
      this.videoData.filter(v => Boolean(v.reel) === true);

    } else if (wantAll) {
      this.carouselVideos =
      this.videoData.filter(v => !v.reel);

    } else {
      this.carouselVideos =
      this.videoData.filter(v => !v.reel);
    }
  }

  buildSections() {

    this.root.innerHTML = "";

    this.carouselVideos.forEach((video, index) => {

      const section = createEl("section", {
        class: "carousel-section",
        "data-index": String(index)
      });

      const videoContainer = createEl("div", {
        class: "video-container",
        id: `video-${index}`
      });

      videoContainer.appendChild(
        createEl("div", {
          class: "loader",
          text: "Loading..."
        })
      );

      const meta = createEl("div", { class: "video-meta" });

      const titleEl = createEl("h2", {
        class: "video-title",
        text: video.title
      });

      const categoryEl = createEl("span", {
        class: "video-category",
        text: video.category
      });

      const descEl = createEl("p", {
        class: "video-description",
        text: video.description
      });

      meta.append(titleEl, categoryEl, descEl);

      section.append(videoContainer, meta);

      this.root.appendChild(section);
    });

  }

  scrollToIndex(index) {
    const section =
      this.root.querySelector(
        `.carousel-section[data-index="${index}"]`
      );

    if (section) {
      section.scrollIntoView({ behavior: "auto" });
    }
  }

  activateVideo(index) {

    if (this.activePlayerIndex === index) return;

    const video = this.carouselVideos[index];
    if (!video) return;
        console.log("Activating video:", index, video.id);
    const container = document.getElementById(`video-${index}`);
    if (!container) return;

    container.innerHTML = "";

    container.appendChild(
      createEl("div", {
        class: "loader",
        text: "Loading..."
      })
    );

    const iframe = document.createElement("iframe");

    iframe.className = "video-frame";

    const autoplay = isAutoplay ? 1 : 0;
    const encodedId = encodeURIComponent(String(video.id));

    iframe.src =
      `https://iframe.mediadelivery.net/embed/661516/${encodedId}?autoplay=${autoplay}&muted=true&playsinline=true&responsive=true`;

    iframe.allow = "autoplay; fullscreen";
    iframe.allowFullscreen = true;
    iframe.title = `Video: ${video.title || "Embedded video"}`;
    iframe.loading = "eager";

    requestAnimationFrame(() => {
    iframe.style.opacity = "1";
    iframe.style.visibility = "visible";
    iframe.style.filter = "none";
    iframe.style.transform = "none";
    });

    const loadTimeout = setTimeout(() => {
      const loaderEl = container.querySelector(".loader");
      if (loaderEl) loaderEl.textContent = "Unable to load video";
    }, IFRAME_LOAD_TIMEOUT);

    iframe.onload = () => {
      clearTimeout(loadTimeout);
      container.querySelector(".loader")?.remove();
      this.activePlayerIndex = index;
    };

    iframe.onerror = () => {
      clearTimeout(loadTimeout);
      const loaderEl = container.querySelector(".loader");
      if (loaderEl) loaderEl.textContent = "Unable to load video";
    };

    container.appendChild(iframe);
  }

  resolveStartIndexAndActivate() {

    let resolved = 0;

    if (startId) {
      const found =
        this.carouselVideos.findIndex(
          v => String(v.id) === startId
        );
      if (found >= 0) resolved = found;

    } else if (
      startIndexParam !== null &&
      Number.isFinite(startIndexParam)
    ) {
      const originalItem =
        this.videoData[startIndexParam];

      if (originalItem) {
        const mapped =
          this.carouselVideos.findIndex(
            v => v.id === originalItem.id
          );
        if (mapped >= 0) resolved = mapped;
      }
    }

    resolved = Math.max(
      0,
      Math.min(resolved, this.carouselVideos.length - 1)
    );

    this.resolvedStartIndex = resolved;

    requestAnimationFrame(() => {
      this.scrollToIndex(resolved);
      this.activateVideo(resolved);
    });
  }

  handleUnload() {
    window.addEventListener("beforeunload", () => {
      this.observer?.disconnect();
    });
  }

  setupScrollActivation() {

  const scrollHint =
  document.querySelector(".scroll-hint");

  this.root.addEventListener("scroll", () => {

    /*if (scrollHint) {
      scrollHint.style.opacity = "0";
    }*/

    const sections =
      this.root.querySelectorAll(".carousel-section[data-index]");

    const viewportCenter = window.innerHeight / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    sections.forEach((section, index) => {

      const rect = section.getBoundingClientRect();

      const center =
        rect.top + rect.height / 2;

      const distance =
        Math.abs(viewportCenter - center);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    this.activateVideo(closestIndex);

    if (scrollHint) {
      const isLastProject =
        closestIndex === this.carouselVideos.length - 1;

      scrollHint.style.opacity =
        isLastProject ? "0" : "0.65";
    }

    });
  }
}

export default Carousel;