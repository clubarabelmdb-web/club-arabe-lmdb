importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

fetch("/api/firebase-config")
  .then((res) => res.json())
  .then((config) => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const titre = payload.notification?.title || "Club Arabe";
      const options = {
        body: payload.notification?.body || "",
        icon: "/images/logo.png",
      };
      self.registration.showNotification(titre, options);
    });
  })
  .catch((err) => console.error("Erreur config Firebase (service worker) :", err));