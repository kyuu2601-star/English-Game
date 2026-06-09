const CACHE_NAME = 'mon-english-dynamic-cache';

// Cài đặt phôi khởi tạo ban đầu (chỉ nạp trang index)
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// CHIẾN THUẬT FETCH: Chơi game bốc từ cache siêu tốc, nhưng cho phép ép tải mới từ file logic
self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Nếu có trong cache thì bốc ra xài luôn (Turn trận đấu, BG sẽ không bị load lại)
      if (cachedResponse) return cachedResponse; 

      // Nếu chưa có thì lên mạng tải rồi lưu vào kho
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
