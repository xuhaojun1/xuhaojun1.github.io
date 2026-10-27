/* No analytics, no remote scripts, no video transformations. */
(() => {
  "use strict";
  const cases = window.DIRECT_FORCING_GALLERY || [];
  const gallery = document.getElementById("video-gallery");
  const dialog = document.getElementById("video-dialog");
  const modalVideo = document.getElementById("dialog-video");
  const autoplayButton = document.getElementById("autoplay-toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let autoplay = !reducedMotion.matches;
  let currentIndex = 0, restoreFocus = null;
  const visibleCases = [...cases];
  const visibility = new Map();
  const manuallyPaused = new Set();
  const cardMap = new Map();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ensureVideo = video => {
    if (!video.getAttribute("src") && video.dataset.src) {
      video.src = video.dataset.src;
      video.load();
    }
  };
  const safelyPlay = video => {
    ensureVideo(video);
    const promise = video.play();
    if (promise) promise.catch(() => {}); // User gesture may be required by browser policy.
  };
  const syncPreviews = () => {
    for (const [id, card] of cardMap) {
      const video = card.querySelector("video");
      if (autoplay && !dialog.open && !document.hidden && !card.hidden && visibility.get(id) && !manuallyPaused.has(id)) {
        safelyPlay(video);
      } else video.pause();
    }
    autoplayButton.setAttribute("aria-pressed", String(autoplay));
    autoplayButton.innerHTML = autoplay ? '<span aria-hidden="true">Ⅱ</span> Pause previews' : '<span aria-hidden="true">▷</span> Play previews';
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) visibility.set(entry.target.dataset.id, entry.isIntersecting && entry.intersectionRatio >= .25);
    syncPreviews();
  }, {threshold:[0, .25, .6]});
  const updateDialog = () => {
    const item = visibleCases[currentIndex];
    if (!item) return;
    modalVideo.pause();
    modalVideo.poster = item.poster;
    modalVideo.src = item.video;
    modalVideo.load();
    document.getElementById("dialog-title").textContent = item.title;
    document.getElementById("dialog-short-prompt").textContent = item.prompt;
    document.getElementById("dialog-full-prompt").textContent = item.expanded_prompt;
    document.getElementById("dialog-prompt-details").open = false;
    document.getElementById("dialog-position").textContent = `${currentIndex+1} / ${visibleCases.length}`;
    modalVideo.setAttribute("aria-label", item.title);
    if (!reducedMotion.matches) safelyPlay(modalVideo);
  };
  const openCase = id => {
    const index = visibleCases.findIndex(item => item.id === id);
    if (index < 0) return;
    currentIndex = index;
    restoreFocus = document.activeElement;
    for (const card of cardMap.values()) card.querySelector("video").pause();
    document.body.classList.add("dialog-open");
    dialog.showModal();
    updateDialog();
    document.getElementById("dialog-close").focus();
  };
  const closeDialog = () => dialog.close();
  const moveDialog = delta => {
    currentIndex = (currentIndex + delta + visibleCases.length) % visibleCases.length;
    updateDialog();
  };
  for (const item of cases) {
    const card = document.createElement("article");
    card.className = "video-card";
    card.id = `case-${item.id}`;
    card.dataset.id = item.id;
    card.innerHTML = `<div class="video-frame"><video data-src="${escape(item.video)}" poster="${escape(item.poster)}" muted loop playsinline preload="none" aria-label="${escape(item.title)}"></video><div class="frame-actions"><button class="frame-button playback-button" aria-label="Pause ${escape(item.title)}">Ⅱ</button><button class="frame-button expand-button" aria-label="Expand ${escape(item.title)}">⤢</button></div></div><div class="card-caption"><h3>${escape(item.title)}</h3><button class="prompt-button" aria-label="Read prompt for ${escape(item.title)}">Prompt ↗</button></div>`;
    const video = card.querySelector("video");
    video.muted = true;
    const playButton = card.querySelector(".playback-button");
    const refreshPlayButton = () => {
      playButton.textContent = video.paused ? "▷" : "Ⅱ";
      playButton.setAttribute("aria-label", `${video.paused ? "Play" : "Pause"} ${item.title}`);
    };
    video.addEventListener("play", refreshPlayButton);
    video.addEventListener("pause", refreshPlayButton);
    refreshPlayButton();
    playButton.addEventListener("click", () => {
      if (video.paused) {manuallyPaused.delete(item.id); safelyPlay(video);}
      else {manuallyPaused.add(item.id); video.pause();}
    });
    card.querySelector(".expand-button").addEventListener("click", () => openCase(item.id));
    card.querySelector(".prompt-button").addEventListener("click", () => openCase(item.id));
    video.addEventListener("click", () => openCase(item.id));
    video.addEventListener("error", () => {
      card.dataset.mediaError = "true";
      if (!card.querySelector(".media-error")) {
        const error = document.createElement("p");
        error.className = "media-error";
        error.setAttribute("role", "status");
        error.textContent = "Video could not load";
        card.append(error);
      }
    });
    gallery.append(card);
    cardMap.set(item.id, card);
    observer.observe(card);
  }
  // Reuse four gallery clips, including reviewed motion-active examples.
  const heroOrders = [1, 2, 8, 4];
  for (const order of heroOrders) {
    const item = cases.find(item => item.order === order);
    if (!item) continue;
    const preview = document.createElement("a");
    preview.className = "hero-preview";
    preview.href = `#case-${item.id}`;
    preview.setAttribute("aria-label", `Watch ${item.title}`);
    preview.innerHTML = `<img src="${escape(item.poster)}" width="832" height="480" alt="${escape(item.title)}"><span class="preview-play" aria-hidden="true">▶</span><span class="preview-caption">${escape(item.title)}</span>`;
    preview.addEventListener("click", event => {
      event.preventDefault();
      openCase(item.id);
    });
    document.getElementById("hero-strip").append(preview);
  }
  autoplayButton.addEventListener("click", () => {autoplay = !autoplay; manuallyPaused.clear(); syncPreviews();});
  document.addEventListener("visibilitychange", syncPreviews);
  document.getElementById("dialog-close").addEventListener("click", closeDialog);
  document.getElementById("dialog-prev").addEventListener("click", () => moveDialog(-1));
  document.getElementById("dialog-next").addEventListener("click", () => moveDialog(1));
  dialog.addEventListener("close", () => {
    modalVideo.pause(); modalVideo.removeAttribute("src"); modalVideo.load();
    document.body.classList.remove("dialog-open");
    if (restoreFocus instanceof HTMLElement) restoreFocus.focus({preventScroll:true});
    syncPreviews();
  });
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)) closeDialog();
  });
  dialog.addEventListener("keydown", event => {
    if (event.target === modalVideo) return;
    if (event.key === "ArrowLeft") {event.preventDefault();moveDialog(-1);}
    if (event.key === "ArrowRight") {event.preventDefault();moveDialog(1);}
  });
  document.getElementById("copy-citation").addEventListener("click", async () => {
    const button = document.getElementById("copy-citation");
    try {
      await navigator.clipboard.writeText(document.getElementById("bibtex").textContent);
      button.textContent = "Copied ✓";
      document.getElementById("copy-status").textContent = "BibTeX copied to clipboard.";
      setTimeout(() => {button.textContent = "Copy BibTeX";}, 2200);
    } catch (_) {
      button.textContent = "Select text to copy";
      document.getElementById("copy-status").textContent = "Clipboard access unavailable. Please select the BibTeX text and copy it manually.";
    }
  });
  // The gallery is inserted after HTML parsing. Restore deep links only once
  // its height exists, otherwise a narrow layout can land above the target.
  const sectionIds = new Set(['top', 'main', 'samples', 'method', 'results', 'citation']);
  if (sectionIds.has(location.hash.slice(1))) history.scrollRestoration = 'manual';
  const jumpToSection = hash => {
    if (!sectionIds.has(hash.slice(1))) return false;
    const target = document.getElementById(hash.slice(1));
    if (!target) return false;
    target.scrollIntoView({behavior:'instant', block:'start'});
    return true;
  };
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (!sectionIds.has(link.hash.slice(1))) return;
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (jumpToSection(link.hash) && location.hash !== link.hash) history.pushState(null, '', link.hash);
    });
  });
  requestAnimationFrame(() => jumpToSection(location.hash));
  // Browser reload restoration can run after the first render; pageshow is
  // the final opportunity to honor a section deep link on the new document.
  window.addEventListener('pageshow', () => requestAnimationFrame(() => jumpToSection(location.hash)), {once:true});
  window.addEventListener('popstate', () => jumpToSection(location.hash));
  syncPreviews();
})();
