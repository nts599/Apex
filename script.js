document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  const video = document.getElementById('preloader-video');

  // This block only applies to Home.html — login.html and index.html
  // (which also load this script) don't have a preloader at all.
  if (!preloader || !video) return;

  // Only play the preloader video right after a fresh login (login.html
  // sets this flag). Every other time Home.html loads — switching tabs,
  // refreshing, coming back from Blocker/Sessions/Reports — skip straight
  // to the app with no video, until the next login sets the flag again.
  const justLoggedIn = localStorage.getItem('apex_show_preloader') === '1';

  if (!justLoggedIn) {
    video.pause();
    preloader.remove();
    return;
  }

  localStorage.removeItem('apex_show_preloader');

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

    // Create the account in the database, then send the user to log in
    // with the same email + password they just chose.
    // Guarded because script.js is also loaded by login.html and Home.html,
    // neither of which has a signupForm — without this check, the missing
    // element would throw and silently kill the rest of this script there.
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
    const formError = document.getElementById('formError');

    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      formError.style.display = 'none';

      if (!this.checkValidity()) {
        this.reportValidity();
        return;
      }

      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      const submitBtn = this.querySelector('.primary-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account…';

      try {
        const res = await fetch('auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', username, email, password })
        });
        const result = await res.json();

        if (result.success) {
          // Pass the email along so login.html can pre-fill it —
          // the user still has to type the password themselves.
          window.location.href = 'login.html?email=' + encodeURIComponent(email);
        } else {
          formError.textContent = result.error || 'Could not create account.';
          formError.style.display = 'block';
        }
      } catch (err) {
        formError.textContent = 'Could not reach the server. Is WAMP running?';
        formError.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
    }