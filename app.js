// Apex app: toggle switches + profile edit modal (Settings & Profile page)

const STORAGE_KEY = "apex_profile";

document.addEventListener("DOMContentLoaded", () => {
  initToggles();
  initDarkMode();
  initBlockerButtons();
  initProfileModal();
  loadSavedProfile();
  initSessionButtons();
  initSignOut();
  initTargetModal();
});

function initSignOut() {
  const btn = document.getElementById("signOutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("apex_show_preloader");
    window.location.href = "login.html";
  });
}

function initToggles() {
  // Plain decorative toggles (Focus Mode Notifications, Data Sync, etc.)
  // Dark Mode is handled separately in initDarkMode() since it needs to
  // actually change the theme and persist across pages.
  document.querySelectorAll(".toggle").forEach((toggle) => {
    if (toggle.id === "darkModeToggle") return;
    toggle.addEventListener("click", () => toggle.classList.toggle("on"));
  });
}

const DARK_MODE_KEY = "apex_dark_mode";

function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;

  // Reflect whatever theme is already applied (set by the inline
  // script at the top of <body> so there's no flash on page load).
  const isDark = document.body.classList.contains("dark-mode");
  toggle.classList.toggle("on", isDark);

  toggle.addEventListener("click", () => {
    const nowDark = document.body.classList.toggle("dark-mode");
    toggle.classList.toggle("on", nowDark);
    try {
      localStorage.setItem(DARK_MODE_KEY, nowDark ? "true" : "false");
    } catch (err) {
      // localStorage may be unavailable in some contexts
    }
  });
}

const TARGET_KEY = "apex_weekly_target";

function initTargetModal() {
  const btn = document.getElementById("setTargetBtn");
  const modal = document.getElementById("targetModal");
  const text = document.getElementById("deepWorkText");
  if (!btn || !modal) return;

  const input = document.getElementById("targetHoursInput");
  const cancelBtn = document.getElementById("targetCancel");
  const saveBtn = document.getElementById("targetSave");

  const savedTarget = localStorage.getItem(TARGET_KEY);
  if (savedTarget && text) {
    text.textContent = `You are trending toward a ${savedTarget}-hour deep work week. Stay consistent to unlock the "Focus Legend" status.`;
  }

  btn.addEventListener("click", () => {
    input.value = savedTarget || "";
    modal.classList.add("visible");
    input.focus();
  });

  cancelBtn.addEventListener("click", () => modal.classList.remove("visible"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("visible"); });

  saveBtn.addEventListener("click", () => {
    const hours = Math.round(Number(input.value));
    if (!hours || hours < 1) return;
    try { localStorage.setItem(TARGET_KEY, String(hours)); } catch (err) {}
    if (text) {
      text.textContent = `You are trending toward a ${hours}-hour deep work week. Stay consistent to unlock the "Focus Legend" status.`;
    }
    modal.classList.remove("visible");
    showToast("Weekly target set to " + hours + "h");
  });
}

function initProfileModal() {
  const trigger = document.getElementById("editProfileTrigger");
  const modal = document.getElementById("profileModal");
  if (!trigger || !modal) return;

  const cancelBtn = document.getElementById("modalCancel");
  const saveBtn = document.getElementById("modalSave");
  const avatarUploadTrigger = document.getElementById("avatarUploadTrigger");
  const avatarFileInput = document.getElementById("avatarFileInput");
  const modalAvatarPreview = document.getElementById("modalAvatarPreview");
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");

  trigger.addEventListener("click", () => {
    nameInput.value = document.getElementById("profileName").textContent.trim();
    emailInput.value = document.getElementById("profileEmail").textContent.trim();
    modalAvatarPreview.src = document.getElementById("profileAvatar").src;
    modal.classList.add("visible");
  });

  cancelBtn.addEventListener("click", () => modal.classList.remove("visible"));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("visible");
  });

  avatarUploadTrigger.addEventListener("click", () => avatarFileInput.click());

  avatarFileInput.addEventListener("change", () => {
    const file = avatarFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { modalAvatarPreview.src = e.target.result; };
    reader.readAsDataURL(file);
  });

  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim() || "Alex Sterling";
    const email = emailInput.value.trim() || "alex@example.com";
    const avatarSrc = modalAvatarPreview.src;

    document.getElementById("profileName").textContent = name;
    document.getElementById("profileEmail").textContent = email;
    document.getElementById("profileAvatar").src = avatarSrc;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email, avatar: avatarSrc }));
    } catch (err) {
      // localStorage may be unavailable in some contexts
    }

    modal.classList.remove("visible");
    showToast("Profile updated");
  });
}

function loadSavedProfile() {
  const nameEl = document.getElementById("profileName");
  const emailEl = document.getElementById("profileEmail");
  const avatarEl = document.getElementById("profileAvatar");
  if (!nameEl && !avatarEl) return;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      if (saved.name && nameEl) nameEl.textContent = saved.name;
      if (saved.email && emailEl) emailEl.textContent = saved.email;
      if (saved.avatar && avatarEl) avatarEl.src = saved.avatar;
    }
  } catch (err) {
    // no saved profile yet
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("visible"), 2000);
}

const BLOCKED_APPS_KEY = "apex_blocked_apps";
const DEFAULT_BLOCKED_APPS = [
  { name: "Instagram", icon: "pics/instagram.png", blocked: true },
  { name: "Twitter", icon: "pics/twitter.png", blocked: true },
  { name: "Youtube", icon: "pics/youtube.png", blocked: false }
];

function loadBlockedApps() {
  try {
    const saved = JSON.parse(localStorage.getItem(BLOCKED_APPS_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (err) {
    // fall through to defaults
  }
  return DEFAULT_BLOCKED_APPS.slice();
}

function saveBlockedApps(apps) {
  try {
    localStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(apps));
  } catch (err) {
    // localStorage may be unavailable in some contexts
  }
}

function renderAppList(apps) {
  const list = document.getElementById("appList");
  if (!list) return;

  if (!apps.length) {
    list.innerHTML = '<p class="empty-note">No apps added yet. Add one below to start blocking it during focus sessions.</p>';
    return;
  }

  list.innerHTML = apps.map((app, i) => {
    const iconHtml = app.icon
      ? `<img class="app-icon-img" src="${app.icon}" alt="">`
      : `<span class="app-icon-img" style="display:flex;align-items:center;justify-content:center;background:var(--blue);color:#fff;font-weight:800;font-size:14px;">${(app.name[0] || "?").toUpperCase()}</span>`;
    return `
      <div class="app-row" data-index="${i}">
        <div class="row-left">
          ${iconHtml}
          <div><h4>${escapeHtml(app.name)}</h4><p>${app.blocked ? "Blocked during focus sessions" : "Allowed"}</p></div>
        </div>
        <div style="display:flex;align-items:center;">
          <button class="remove-app-btn" type="button" data-action="remove" aria-label="Remove app">&times;</button>
          <button class="toggle${app.blocked ? " on" : ""}" type="button" data-action="toggle"></button>
        </div>
      </div>`;
  }).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function initBlockerButtons() {
  const list = document.getElementById("appList");
  if (!list) return; // not on the Blocker page

  let apps = loadBlockedApps();
  renderAppList(apps);

  list.addEventListener("click", (e) => {
    const row = e.target.closest(".app-row");
    if (!row) return;
    const index = Number(row.dataset.index);
    const action = e.target.dataset.action;

    if (action === "toggle") {
      apps[index].blocked = !apps[index].blocked;
      saveBlockedApps(apps);
      renderAppList(apps);
    } else if (action === "remove") {
      const removed = apps[index].name;
      apps.splice(index, 1);
      saveBlockedApps(apps);
      renderAppList(apps);
      showToast(removed + " removed");
    }
  });

  const blockAllBtn = document.getElementById("blockAllBtn");
  if (blockAllBtn) {
    blockAllBtn.addEventListener("click", () => {
      const shouldBlockAll = apps.some((app) => !app.blocked);
      apps = apps.map((app) => ({ ...app, blocked: shouldBlockAll }));
      saveBlockedApps(apps);
      renderAppList(apps);
      showToast(shouldBlockAll ? "All apps blocked" : "All apps allowed");
    });
  }

  const addBtn = document.getElementById("addAppBtn");
  const modal = document.getElementById("addAppModal");
  if (addBtn && modal) {
    const nameInput = document.getElementById("appNameInput");
    const cancelBtn = document.getElementById("addAppCancel");
    const saveBtn = document.getElementById("addAppSave");

    addBtn.addEventListener("click", () => {
      nameInput.value = "";
      modal.classList.add("visible");
      nameInput.focus();
    });

    cancelBtn.addEventListener("click", () => modal.classList.remove("visible"));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("visible"); });

    const addApp = () => {
      const name = nameInput.value.trim();
      if (!name) return;
      apps.push({ name, icon: null, blocked: true });
      saveBlockedApps(apps);
      renderAppList(apps);
      modal.classList.remove("visible");
      showToast(name + " added to blocklist");
    };

    saveBtn.addEventListener("click", addApp);
    nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addApp(); });
  }

  // Legacy hooks some pages still have (tabs / mode switch rows).
  document.querySelectorAll(".tabs .tab").forEach((tab, _, tabs) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  document.querySelectorAll(".mode-row").forEach((button, _, buttons) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

const MAX_SESSION_FILES = 5;
let sessionFiles = [];
let sessionTimerId = null;

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function renderFileList() {
  const container = document.getElementById("fileList");
  if (!container) return;
  container.innerHTML = sessionFiles.map((file, i) => `
    <div class="file-row" data-index="${i}">
      <div class="file-num">${i + 1}</div>
      <div class="file-info">
        <p class="file-name">${escapeHtml(file.name)}</p>
        <p class="file-meta">File ${i + 1} of ${sessionFiles.length} · ${formatFileSize(file.size)}</p>
      </div>
      <button class="remove-file-btn" type="button" aria-label="Remove file">&times;</button>
    </div>`).join("");

  container.querySelectorAll(".remove-file-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = Number(e.target.closest(".file-row").dataset.index);
      sessionFiles.splice(index, 1);
      renderFileList();
    });
  });
}

function initSessionButtons() {

  // MULTI-FILE UPLOAD (up to MAX_SESSION_FILES)
  const uploadButton = document.getElementById("uploadBox");

  if (uploadButton) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf,.doc,.docx,image/*";
    fileInput.multiple = true;
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    uploadButton.addEventListener("click", () => {
      if (sessionFiles.length >= MAX_SESSION_FILES) {
        showToast(`You can add up to ${MAX_SESSION_FILES} files`);
        return;
      }
      fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      const room = MAX_SESSION_FILES - sessionFiles.length;
      const picked = Array.from(fileInput.files).slice(0, room);
      sessionFiles = sessionFiles.concat(picked);
      renderFileList();
      if (fileInput.files.length > room) {
        showToast(`Only added ${room} file(s) — 5 file limit reached`);
      }
      fileInput.value = "";
    });
  }

  // BEGIN SESSION -> choose hours -> countdown
  const beginButton = document.getElementById("beginSessionBtn");
  const hoursModal = document.getElementById("hoursModal");
  const hoursInput = document.getElementById("hoursInput");
  const hoursCancel = document.getElementById("hoursCancel");
  const hoursConfirm = document.getElementById("hoursConfirm");
  const configScreen = document.getElementById("sessionConfig");
  const activeScreen = document.getElementById("sessionActive");
  const countdownTime = document.getElementById("countdownTime");
  const countdownSub = document.getElementById("countdownSub");
  const endSessionBtn = document.getElementById("endSessionBtn");

  if (beginButton && hoursModal) {
    beginButton.addEventListener("click", () => {
      hoursInput.value = "1";
      hoursModal.classList.add("visible");
      hoursInput.focus();
    });

    hoursCancel.addEventListener("click", () => hoursModal.classList.remove("visible"));
    hoursModal.addEventListener("click", (e) => { if (e.target === hoursModal) hoursModal.classList.remove("visible"); });

    hoursConfirm.addEventListener("click", () => {
      const hours = Number(hoursInput.value);
      if (!hours || hours <= 0) return;
      hoursModal.classList.remove("visible");
      startSessionCountdown(hours);
    });
  }

  function startSessionCountdown(hours) {
    let remainingSeconds = Math.round(hours * 3600);
    configScreen.style.display = "none";
    activeScreen.style.display = "flex";
    countdownSub.textContent = "Focus mode is on. Stay locked in.";
    showToast("Session began");

    const tick = () => {
      const h = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(remainingSeconds % 60).padStart(2, "0");
      countdownTime.textContent = `${h}:${m}:${s}`;

      if (remainingSeconds <= 0) {
        clearInterval(sessionTimerId);
        sessionTimerId = null;
        countdownSub.textContent = "Session complete! Great work.";
        showToast("Session complete");
        return;
      }
      remainingSeconds -= 1;
    };

    tick();
    clearInterval(sessionTimerId);
    sessionTimerId = setInterval(tick, 1000);
  }

  if (endSessionBtn) {
    endSessionBtn.addEventListener("click", () => {
      clearInterval(sessionTimerId);
      sessionTimerId = null;
      activeScreen.style.display = "none";
      configScreen.style.display = "flex";
      showToast("Session ended");
    });
  }
}