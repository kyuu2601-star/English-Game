// ==========================================================================
// 🛠️ SERVICE WORKER (SW.JS) - ĐÃ ĐỒNG BỘ VERSION CONTROL VÀ DỌN RÁC
// ==========================================================================

// 🎯 ĐỒNG BỘ TUYỆT ĐỐI: Đã lên v4 khớp hoàn toàn với index và core-engine!
const CACHE_NAME = 'mon-english-v8';

// Cài đặt phôi khởi tạo ban đầu (chỉ nạp trang index)
self.addEventListener('install', (e) => {
  self.skipWaiting();
  console.log(`📥 [SW] Đã cài đặt phiên bản bộ nhớ: ${CACHE_NAME}`);
});

// 🎯 THUẬT TOÁN HỦY DIỆT KHO CŨ KHI LÊN VERSION
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Nếu cái tên kho trên máy học sinh khác với CACHE_NAME v4 hiện tại -> XÓA SẠCH!
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ [SW] Đã phát hiện và xóa sổ kho cache cũ: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// CHIẾN THUẬT FETCH: Chơi game bốc từ cache siêu tốc, nhưng cho phép ép tải mới từ file logic
self.addEventListener('fetch', (e) => {
  // 🛑 ĐÃ THÊM CHỐT CHẶN: Bỏ qua tất cả các request POST (như API đồng bộ App Script)
  if (e.request.method !== 'GET') {
      return; 
  }

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
