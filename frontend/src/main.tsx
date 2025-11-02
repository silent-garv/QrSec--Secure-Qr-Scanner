// Ensure PWA install prompt is always captured and available globally
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // ...existing code...
    }).catch((err) => {
      // ...existing code...
    });
  });
}

// Listen for beforeinstallprompt globally and store the event
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  (window as any).__deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("Root element not found");
}

// Register service worker for PWA support (production / supported browsers)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // console.info('Service worker registered:', reg);
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
