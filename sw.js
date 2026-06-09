const CACHE_NAME = 'mon-english-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './global.css',
  './core-engine.js',
  './manifest.json',
  './assets/Fredoka.ttf',
  './assets/PatrickHand.ttf',
  './assets/Game_Logo.png',
  './assets/Background_Loading.png',
  
  // Cache cứng bộ khung giao diện UI và CSS của các màn hình
  './screens/loading-menu/ui.html',
  './screens/loading-menu/style.css',
  './screens/loading-menu/logic.js',
  
  './screens/main-menu/ui.html',
  './screens/main-menu/style.css',
  './screens/main-menu/logic.js',
  './screens/main-menu/assets/Btn_Start.png',
  './screens/main-menu/assets/Btn_Start_Pressed.png',
  './screens/main-menu/assets/Btn_Collection.png',
  './screens/main-menu/assets/Btn_Collection_Pressed.png',
  './screens/main-menu/assets/Btn_Backpack_Icon.png',
  './screens/main-menu/assets/Btn_Backpack_Icon_Pressed.png',
  './screens/main-menu/assets/Btn_Setting_Icon.png',
  './screens/main-menu/assets/Btn_Setting_Icon_Pressed.png',
  './screens/main-menu/assets/Nametag_lv5.png',
  './screens/main-menu/assets/UI_Answer_Box.png',
  './screens/main-menu/assets/UI_Answer_Box_Pressed.png',
  
  './screens/battle-stage/ui.html',
  './screens/battle-stage/style.css',
  './screens/battle-stage/logic.js',
  './screens/battle-stage/assets/BG_Desert.png',
  './screens/battle-stage/assets/BG_Forest.png',
  './screens/battle-stage/assets/BG_Snow.png',
  './screens/battle-stage/assets/BG_Volcano.png',
  './screens/battle-stage/assets/UI_Question_Box.png',
  './screens/battle-stage/assets/UI_Answer_Box.png',
  './screens/battle-stage/assets/UI_Answer_Box_Pressed.png',
  './screens/battle-stage/assets/VFX_Ball_Open.png',
  './screens/battle-stage/assets/VFX_Ball_Close.png',
  './screens/battle-stage/assets/VFX_Smoke.png',
  './screens/battle-stage/assets/VFX_Star_Shiny.png',
  './screens/battle-stage/assets/Popup_Captured.png',
  './screens/battle-stage/assets/Popup_Missed.png',
  
  './screens/collection-book/ui.html',
  './screens/collection-book/assets/Background_Collection.png',
  './screens/collection-book/style.css',
  './screens/collection-book/logic.js',
  './screens/collection-book/assets/Tag_Icon.png',
  './screens/collection-book/assets/Btn_Back.png',
  './screens/collection-book/assets/Btn_Back_Pressed.png',
  './screens/collection-book/assets/Btn_Battle_Icon.png',
  './screens/collection-book/assets/Btn_Battle_Icon_Pressed.png'
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
