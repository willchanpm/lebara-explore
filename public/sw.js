// Minimal Service Worker for PWA installability
// This satisfies Chrome's requirements for PWA installation

const CACHE_NAME = 'lebara-explorer-v1';

// Install event - runs when SW is first installed
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  // Don't skip waiting - let the page finish loading first
  // This prevents the flickering/reloading issue
});

// Activate event - runs when SW becomes active
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  // Don't claim clients immediately - let them finish their current work
  // This prevents the page from flickering or reloading
});

// Fetch event - no-op handler to satisfy Chrome's requirements
self.addEventListener('fetch', (event) => {
  // Pass through all requests to the network
  // This is a minimal implementation for installability
  event.respondWith(fetch(event.request));
});
