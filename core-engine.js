// ==========================================================================
// 🔗 CONFIG CÁC ĐƯỜNG LINK GOOGLE SHEETS CỐT LÕI
// ==========================================================================
const MOBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=0&single=true&output=csv";
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=991631725&single=true&output=csv";
const LOGIN_API_URL = "https://script.google.com/macros/s/AKfycbxKUEwFeIimX4oa0Rfsng7cOAXwoq17OOpMkd985y7tJl93fJOFAFJg6krFpq0fCZo/exec";
const CACHE_NAME = 'mon-english-v1'; // 🎯 ĐỒNG BỘ CHUẨN KHO CACHE CỦA FEN

// Trạng thái lưu trữ dùng chung xuyên suốt các file JS mô-đun
let globalMobList = [];      
let globalQuestionList = []; 
let gameState = { username: "", coins: 0, gender: "", captured: {} };
let currentMob = null;
let currentQuestion = null;
let currentBookPage = 0; 
let selectedGenderTemp = ""; 
let shinyRainInterval = null; 

// ==========================================================================
// 🚀 THUẬT TOÁN KIỂM TRA, CÀO BÙ ASSET VÀ ÉP TẢI MỚI CODE/CSS (KHÓA LOADING)
// ==========================================================================
async function handleGamePreloadAndVersionControl() {
    if (!('caches' in window)) {
        console.warn("⚠️ Trình duyệt không hỗ trợ Cache Storage, bỏ qua preload.");
        changeScreen('menu');
        return;
    }

    console.log("🚀 [Loading Engine] Bắt đầu tiến trình kiểm tra và tải nạp tài nguyên thực tế...");
    const cache = await caches.open(CACHE_NAME);

    // 🎯 TẦNG 1: DANH SÁCH FILE CODE TĨNH (ÉP BUỘC TẢI MỚI 100% TỪ GITHUB MỖI LẦN LOAD GAME)
    const coreCodes = [
        './global.css',
        './core-engine.js',
        './manifest.json',
        './screens/loading-menu/ui.html', './screens/loading-menu/style.css', './screens/loading-menu/logic.js',
        './screens/main-menu/ui.html', './screens/main-menu/style.css', './screens/main-menu/logic.js',
        './screens/battle-stage/ui.html', './screens/battle-stage/style.css', './screens/battle-stage/logic.js',
        './screens/collection-book/ui.html', './screens/collection-book/style.css', './screens/collection-book/logic.js'
    ];

    // 🎯 TẦNG 2: DANH SÁCH ASSET HÌNH ẢNH/FONT (Hệ quy chiếu: Quét so sánh, thiếu mới tải bù)
    const staticAssets = [
        './assets/Fredoka.ttf', './assets/PatrickHand.ttf', './assets/Game_Logo.png', './assets/Background_Loading.png',
        './assets/BG_Desert.png', './assets/BG_Forest.png', './assets/BG_Snow.png', './assets/BG_Volcano.png',
        './assets/UI_Question_Box.png', './assets/UI_Answer_Box.png', './assets/UI_Answer_Box_Pressed.png',
        './assets/Collection_Book.png', './assets/Collection_Next_Btn.png', './assets/Collection_Next_Btn_Pressed.png',
        './assets/Collection_Previous_Btn.png', './assets/Collection_Previous_Btn_Pressed.png',
        './assets/Btn_Back.png', './assets/Btn_Back_Pressed.png', './assets/Btn_Collection.png', './assets/Btn_Collection_Pressed.png',
        './assets/Btn_Backpack_Icon.png', './assets/Btn_Backpack_Icon_Pressed.png', './assets/Btn_Setting_Icon.png', './assets/Btn_Setting_Icon_Pressed.png',
        './assets/Btn_Battle_Icon.png', './assets/Btn_Battle_Icon_Pressed.png', './assets/Tag_Icon.png',
        './assets/Nametag_lv1.png', './assets/Nametag_lv2.png', './assets/Nametag_lv3.png', './assets/Nametag_lv4.png', './assets/Nametag_lv5.png',
        './assets/Popup_Captured.png', './assets/Popup_Missed.png', './assets/VFX_Ball_Open.png', './assets/VFX_Ball_Close.png', './assets/VFX_Smoke.png', './assets/VFX_Star_Shiny.png'
    ];

    // Tự động gộp toàn bộ link ảnh quái vật thực tế vừa fetch được từ file Sheets vào mảng Asset
    if (globalMobList && globalMobList.length > 0) {
        globalMobList.forEach(mob => {
            if (mob.Image && !staticAssets.includes(mob.Image)) {
                staticAssets.push(mob.Image);
            }
        });
    }

    // 🚀 TIẾN TRÌNH KHÓA CHẶT TRANG LOADING ĐỂ TẢI ĐỒNG LOẠT
    let totalTasks = coreCodes.length; 
    let completedTasks = 0;

    // Hàm cập nhật tiến độ, tính % thực tế dựa trên số lượng file nạp
    function updateProgress() {
        completedTasks++;
        let percent = Math.floor((completedTasks / totalTasks) * 100);
        console.log(`⏳ [Loading Progress] Đang tải tài nguyên: ${percent}%`);
        
        // Găm nẹp cập nhật text hiển thị % lên UI nếu file ui.html của loading-menu có thẻ này
        const progressText = document.getElementById('loading-progress-text');
        if (progressText) {
            progressText.innerText = `Loading... ${percent}%`;
        }
    }

    // 1. Thực thi Tầng 1: Cưỡng bức tải mới 100% đống Code/CSS từ mạng về đè thẳng vào cache
    const codePromises = coreCodes.map(async (url) => {
        try {
            // Sử dụng cờ { cache: 'reload' } để ép trình duyệt bỏ qua cache, lấy bản mới nhất trên GitHub về
            const response = await fetch(url, { cache: 'reload' });
            if (response.status === 200) {
                await cache.put(url, response);
            }
        } catch (err) {
            console.warn(`⚠️ Lỗi nạp mới file code tĩnh: ${url}`, err);
        } finally {
            updateProgress(); 
        }
    });

    // Đợi đống Code/CSS nạp xong xuôi rồi mới tính toán số lượng Asset thực tế cần nạp bù
    await Promise.all(codePromises);

    // 2. Thực thi Tầng 2: So sánh xem Asset nào chưa có trong máy thì mới ném vào hàng chờ tải bù
    const assetsToDownload = [];
    for (const url of staticAssets) {
        const hasCache = await cache.match(url);
        if (!hasCache) {
            assetsToDownload.push(url); // File này máy user chưa có -> Bắt buộc tải
        }
    }

    // Cập nhật lại tổng số task bằng cách cộng dồn số asset thiếu thực tế vào
    if (assetsToDownload.length > 0) {
        totalTasks += assetsToDownload.length;

        const assetPromises = assetsToDownload.map(async (url) => {
            try {
                await cache.add(url);
            } catch (err) {
                console.warn(`⚠️ Không thể tải bù asset: ${url}`);
            } finally {
                updateProgress(); 
            }
        });

        // Khóa chặt màn hình Loading, đợi bằng được đống asset tải bù này chạy xong hoàn toàn
        await Promise.all(assetPromises);
    }

    // 🎉 HOÀN THÀNH TẤT CẢ: Bộ đếm đạt 100%, tất cả code mới và asset thiếu đã nằm im trong ổ cứng
    console.log("🌟 [Pre-load] HOÀN THÀNH 100%! Game đã sẵn sàng khởi chạy.");
    
    // ĐỦ ĐIỀU KIỆN TỐI CAO -> Tắt rèm Loading, cho phép bước thẳng vào sảnh chính!
    changeScreen('menu');
}

// ==========================================
// 🏗️ HÀM KHỞI CHẠY LÕI HỆ THỐNG (GAME ENGINE INIT)
// ==========================================
async function initGameEngine() {
    try {
        console.log("📥 [Engine] Fetching data from Google Sheets...");
        
        // Fetch song song cả 2 link CSV từ Google Sheets về cùng một lúc cho nhanh
        const [mobsResponse, questionsResponse] = await Promise.all([
            fetch(MOBS_CSV_URL),
            fetch(QUESTIONS_CSV_URL)
        ]);

        const mobsText = await mobsResponse.text();
        const questionsText = await questionsResponse.text();

        // Parse dữ liệu chữ thành mảng Object JavaScript dùng chung
        globalMobList = parseCSV(mobsText);
        globalQuestionList = parseCSV(questionsText);

        console.log(`✅ Loaded ${globalMobList.length} Mobs and ${globalQuestionList.length} Questions.`);

        // 🎯 KÍCH HOẠT HÀM KIỂM SOÁT TÀI NGUYÊN TỰ ĐỘNG SO SÁNH TRƯỚC KHI VÀO GAME
        await handleGamePreloadAndVersionControl();

    } catch (error) {
        console.error("🚨 Lỗi chí mạng khi khởi chạy Game Engine:", error);
        // Nếu sập mạng không fetch được Sheets thì vẫn cố cứu cánh cho vào thẳng menu để xài cache offline
        changeScreen('menu');
    }
}

// ==========================================
// ⚙️ BỘ NẠP ĐỘNG: TỰ ĐỘNG NHÚNG FILE LOGIC.JS RIÊNG BIỆT
// ==========================================
async function loadScreen(screenName, callback) {
    const viewport = document.getElementById('game-viewport');
    try {
        const htmlResponse = await fetch(`screens/${screenName}/ui.html`);
        const htmlText = await htmlResponse.text();
        viewport.innerHTML = htmlText;
        
        const cssId = `css-${screenName}`;
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId; link.rel = 'stylesheet';
            link.href = `screens/${screenName}/style.css`;
            document.head.appendChild(link);
        }
        
        const oldScript = document.getElementById('screen-runtime-logic');
        if (oldScript) oldScript.remove();
        
        const script = document.createElement('script');
        script.id = 'screen-runtime-logic';
        script.src = `screens/${screenName}/logic.js`;
        script.onload = () => { 
            console.log(`🤖 Loaded Runtime Logic for: [${screenName}]`);
            if (callback) callback(); 
        };
        document.body.appendChild(script);
        
    } catch (error) {
        console.error(`Không thể nạp màn hình: ${screenName}`, error);
    }
}

// ==========================================
// 🧭 BỘ ĐIỀU HƯỚNG TỔNG (ROUTE MANAGER)
// ==========================================
function changeScreen(scrId) {
    // Tự động dọn sạch vòng lặp mưa sao rơi của quái Shiny khi rời trận đấu
    if (shinyRainInterval) {
        clearInterval(shinyRainInterval);
        shinyRainInterval = null;
    }

    if (scrId === 'menu') {
        loadScreen('main-menu', () => {
            // Gọi lại hàm khởi tạo sảnh chính có trong screens/main-menu/logic.js
            if (typeof initMainMenuLogic === 'function') {
                initMainMenuLogic();
            }
        });
    }
    if (scrId === 'battle') {
        loadScreen('battle-stage', () => {
            // Nạp tiền lên UI và kích hoạt lượt đấu mới trong screens/battle-stage/logic.js
            const coinText = document.getElementById('user-coins');
            if (coinText) coinText.innerText = gameState.coins;
            if (typeof nextBattleTurn === 'function') {
                nextBattleTurn();
            }
        });
    }
    if (scrId === 'collection') {
        loadScreen('collection-book', () => {
            // Reset trang sách về 0 và vẽ lưới thẻ trong screens/collection-book/logic.js
            currentBookPage = 0;
            if (typeof renderCollectionBook === 'function') {
                renderCollectionBook();
            }
        });
    }
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((h, i) => {
            let val = values[i] ? values[i].trim() : "";
            obj[h] = val.replace(/^"|"$/g, "");
        });
        return obj;
    });
}

function saveGameLocal() {
    localStorage.setItem(`pkm_catch_${gameState.username}`, JSON.stringify(gameState));
}

// ==========================================================================
// 🔐 HỆ THỐNG ĐĂNG NHẬP & XỬ LÝ DỮ LIỆU TỪ SHEET (API FETCH)
// ==========================================================================
async function loginGame(inputUsername, inputPassword) {
    try {
        console.log("🔄 Đang kết nối tới máy chủ Google Sheets...");

        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            // 🎯 BÍ KÍP: Bắt buộc dùng text/plain để lách luật kiểm duyệt CORS của trình duyệt
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                username: inputUsername,
                password: inputPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            let userData = result.data;

            // 1. Nạp data cơ bản
            gameState.username = userData.username;
            gameState.coins = parseInt(userData.coins) || 0;

            // 2. Dịch Gender (M/F) thành ID nhân vật game
            let genderChar = userData.gender ? userData.gender.toString().toUpperCase().trim() : "";
            if (genderChar === 'M') {
                gameState.gender = 'andil'; 
            } else if (genderChar === 'F') {
                gameState.gender = 'alice'; 
            } else {
                gameState.gender = 'andil'; // Mặc định
            }

            // 3. Nạp túi quái vật (Dạng JSON)
            try {
                let rawJSON = userData.captured ? userData.captured.toString().trim() : "{}";
                if (rawJSON === "") rawJSON = "{}";
                gameState.captured = JSON.parse(rawJSON);
            } catch (e) {
                console.warn("⚠️ Cột Captured_List sai định dạng JSON. Reset túi đồ về 0.");
                gameState.captured = {};
            }

            console.log("✅ ĐĂNG NHẬP THÀNH CÔNG! Dữ liệu hiện tại:", gameState);
            
            // Tự động lưu cache Local luôn cho chắc cốp
            saveGameLocal();

            return true; // Trả về true để hàm UI biết mà đóng Popup
        } else {
            alert("❌ Đăng nhập thất bại: " + result.message);
            return false;
        }
    } catch (error) {
        console.error("🚨 Lỗi Network:", error);
        alert("Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng!");
        return false;
    }
}

// ==========================================
// 🚀 BOOTSTRAP: KHỞI ĐỘNG GAME TRỰC TIẾP TỪ LOADING MENU
// ==========================================
window.onload = function() {
    loadScreen('loading-menu', () => {
        if (typeof initGameEngine === 'function') {
            initGameEngine();
        }
    });
};
