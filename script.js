document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  const video = document.getElementById('preloader-video');

  let revealed = false;

  // Fade out and remove the preloader, revealing the home screen underneath
  function revealApp() {
    if (revealed) return;
    revealed = true;
    preloader.classList.add('loaded');
    // Remove it from the layout entirely once the fade-out transition finishes
    preloader.addEventListener('transitionend', () => {
      preloader.remove();
    }, { once: true });
  }

  // Reveal as soon as the video finishes playing
  video.addEventListener('ended', revealApp);

  // Safety net: some mobile browsers can block/stall autoplay, so make sure
  // the app still appears after ~3s (the video's own length) even if the
  // 'ended' event never fires.
  setTimeout(revealApp, 3200);
});