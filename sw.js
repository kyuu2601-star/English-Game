// ==========================================================================
// 🤖 SERVICE WORKER (PWA): ƯU TIÊN CACHE KHI CHƠI - ĐỒNG BỘ MỚI KHI LOAD TRANG
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

// 🚀 3. CHIẾN THUẬT FETCH THÔNG MINH: ĐÚNG Ý FEN - F5 LÀ UPDATE, CHƠI LÀ ƯU TIÊN CACHE
self.addEventListener('fetch', (e) => {
  // Bỏ qua các request không phải http/https (như chrome-extension) để tránh lỗi crash console
  if (!e.request.url.startsWith('http')) return;

  const url = new URL(e.request.url);

  // 🎯 TẦNG 1: Nếu người dùng LOAD LẠI TRANG CHÍNH (index.html hoặc link gốc '/')
  // Ép buộc hệ thống phải lên mạng lấy bản mới, đồng thời chạy ngầm cập nhật lại toàn bộ kho cache ASSETS_TO_CACHE
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          // Khởi động tiến trình chạy ngầm làm mới đè hoàn toàn danh sách file code/giao diện mới
          caches.open(CACHE_NAME).then((cache) => {
            cache.addAll(ASSETS_TO_CACHE);
            console.log('🔄 [PWA] Phát hiện load trang! Đã làm mới 100% danh sách cache code và asset.');
          });
        }
        return networkResponse;
      }).catch(() => {
        // Cứu cánh khi mất mạng hoàn toàn lúc đang load lại trang
        return caches.match(e.request);
      })
    );
    return; // Thoát ra, không chạy xuống tầng 2 nữa
  }

  // 🎯 TẦNG 2: Các tài nguyên nạp khi đang chơi game (Đổi turn, nạp BG, Code màn hình, font...)
  // Ưu tiên bốc từ Ổ cứng (Cache) ra trước để siêu mượt, không bị giật khựng hay nháy trắng background!
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Tìm thấy file trong bộ nhớ đệm là trả về ngay lập tức
      }

      // Nếu là tài nguyên mới hoàn toàn (như ảnh quái vật mới kéo về từ Google Sheets) -> Lên mạng lấy rồi lưu vào kho
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
