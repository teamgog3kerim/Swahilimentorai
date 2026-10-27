export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          console.log('SW registered:', registration);
          // The worker updates its caches in the background. Keep this page
          // intact: new app code loads on the learner's next refresh or visit.
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });

    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
