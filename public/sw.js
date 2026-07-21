// Minimal service worker — prevents 500 errors from mermaid's SW registration
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {});
