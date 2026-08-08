// Apex app: toggle switches + profile edit modal (Settings & Profile page)

const STORAGE_KEY = "apex_profile";

document.addEventListener("DOMContentLoaded", () => {
  initToggles();
  initProfileModal();
  loadSavedProfile();
});

function initToggles() {
  document.querySelectorAll(".toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => toggle.classList.toggle("on"));
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