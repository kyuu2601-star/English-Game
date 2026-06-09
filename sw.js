const CACHE_NAME = 'mon-english-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './global.css',
  './core-engine.js',
  './manifest.json',
  
  // Cache cứng font chữ và các asset nền tảng nằm ở folder assets gốc
  './assets/Fredoka.ttf',
  './assets/PatrickHand.ttf',
  './assets/Game_Logo.png',
  './assets/Background_Loading.png',
  
  // Cache các file code chạy module của các màn hình
  './screens/loading-menu/ui.html',
  './screens/loading-menu/style.css',
  './screens/loading-menu/logic.js',
  
  './screens/main-menu/ui.html',
  './screens/main-menu/style.css',
  './screens/main-menu/logic.js',
  
  './screens/battle-stage/ui.html',
  './screens/battle-stage/style.css',
  './screens/battle-stage/logic.js',
  
  './screens/collection-book/ui.html',
  './screens/collection-book/style.css',
  './screens/collection-book/logic.js'
];

// Cài đặt Service Worker và ép nạp toàn bộ danh sách asset tĩnh vào Cache Storage
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [PWA] Pre-caching static assets successfully!');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Kích hoạt SW và dọn dẹp các cache cũ nếu fen có cập nhật phiên bản game sau này
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ [PWA] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// CHIẾN THUẬT FETCH: Đánh chặn request mạng, ưu tiên bốc từ Ổ cứng (Cache) ra trước, 
// nếu không có (như ảnh quái vật mới từ Google Sheets) thì mới lên mạng tải và tự động lưu tiếp vào cache.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse; // Trả ảnh từ ổ cứng về ngay lập tức, siêu tốc 0.5s!

      return fetch(e.request).then((networkResponse) => {
          // Bẫy lưu động: Nếu là ảnh quái vật (.png) tải từ bên ngoài về, tự lưu vào kho luôn
          if (e.request.url.includes('.png') || e.request.url.includes('.ttf')) {
              return caches.open(CACHE_NAME).then((cache) => {
                  cache.put(e.request, networkResponse.clone());
                  return networkResponse;
              });
          }
          return networkResponse;
      });
    })
  );
});
