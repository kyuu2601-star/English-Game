// ==========================================================================
// 🤖 SERVICE WORKER (PWA): CHIẾN THUẬT NETWORK-FIRST - KHẮC PHỤC TRIỆT ĐỂ LỖI CACHE
// ==========================================================================

const CACHE_NAME = 'mon-english-v1'; // 💡 Mẹo: Sau này nếu sửa nhiều, fen chỉ cần đổi v1 thành v2, v3 là máy user tự dọn sạch kho cũ
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

// 📦 1. CÀI ĐẶT SW: Ép nạp phôi static ban đầu
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [PWA] Pre-caching static assets successfully!');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 🗑️ 2. KÍCH HOẠT SW: Dọn dẹp triệt để các kho cache cũ rác rưởi
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

// 🚀 3. CHIẾN THUẬT FETCH MỚI: LUÔN LÊN MẠNG QUÉT FILE MỚI, CHỈ DÙNG CACHE KHI MẤT MẠNG
self.addEventListener('fetch', (e) => {
  // Bỏ qua các request không phải http/https (như chrome-extension) để tránh lỗi crash console
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    // 🔥 Ép lao thẳng lên mạng lấy file mới nhất về trước
    fetch(e.request)
      .then((networkResponse) => {
        // Nếu lấy file từ mạng thành công (status 200), tiến hành cập nhật đè bản mới này vào kho cache
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 🛡️ CỨU CÁNH CHÍ MẠNG: Chỉ khi nào rớt mạng hoàn toàn (offline), mới lôi file từ ổ cứng ra xài
        console.log('🔌 [PWA] Bạn đang offline! Đang bốc file cứu cánh từ Cache Storage cho:', e.request.url);
        return caches.match(e.request);
      })
  );
});
