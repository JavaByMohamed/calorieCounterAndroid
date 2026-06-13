function loadHeader() {
  fetch("header.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load header.html (status ${response.status})`);
      }
      return response.text();
    })
    .then((data) => {
      document.querySelector("header").innerHTML = data;
      initHeaderLogout();
      return ensureAppUpdaterLoaded();
    })
    .then(() => {
      if (window.AppUpdater && typeof window.AppUpdater.init === "function") {
        window.AppUpdater.init();
      }
    })
    .catch((error) => console.error("Error loading header:", error));
}

function ensureAppUpdaterLoaded() {
  if (window.AppUpdater) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector("script[data-app-updater='1']");
  if (existingScript) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "script/appUpdater.js";
    script.dataset.appUpdater = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load app updater script."));
    document.body.appendChild(script);
  });
}

function getHeaderCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : "";
}

function initHeaderLogout() {
  const activeUser = getHeaderCookie("activeUser");
  const logoutBtn = document.getElementById("headerLogoutBtn");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

  if (activeUser) {
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = "block";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      performLogout();
    });
  }
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      performLogout();
    });
  }
}

function performLogout() {
  // Delete the activeUser cookie
  document.cookie = "activeUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  // Redirect to home page
  window.location.href = "index.html";
}

// Call the function to load the header
loadHeader();