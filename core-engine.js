// ==========================================================================
// 🔗 CONFIG CÁC ĐƯỜNG LINK GOOGLE SHEETS CỐT LÕI
// ==========================================================================
const MOBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=0&single=true&output=csv";
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=991631725&single=true&output=csv";
const LOGIN_API_URL = "https://script.google.com/macros/s/AKfycbyFl879XdrjbTesSwsQPxt9RyQPjZqd4EW32wJEKvEgMhAhHFPQKfsfzElZNRXxz9s/exec";
const CACHE_NAME = 'mon-english-v1'; 

// 🎯 TẤT CẢ CHỈ SỐ ĐỂ TRỐNG/SỐ 0 ĐỂ GOOGLE SHEET NẠP XUỐNG
let globalMobList = [];      
let globalQuestionList = []; 
let gameState = { 
    username: "", 
    coins: 0, 
    gender: "", 
    captured: {},
    energy: 0 
};
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

    const coreCodes = [
        './global.css',
        './core-engine.js',
        './manifest.json',
        './screens/loading-menu/ui.html', './screens/loading-menu/style.css', './screens/loading-menu/logic.js',
        './screens/main-menu/ui.html', './screens/main-menu/style.css', './screens/main-menu/logic.js',
        './screens/battle-stage/ui.html', './screens/battle-stage/style.css', './screens/battle-stage/logic.js',
        './screens/collection-book/ui.html', './screens/collection-book/style.css', './screens/collection-book/logic.js'
    ];

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

    if (globalMobList && globalMobList.length > 0) {
        globalMobList.forEach(mob => {
            if (mob.Image && !staticAssets.includes(mob.Image)) {
                staticAssets.push(mob.Image);
            }
        });
    }

    let totalTasks = coreCodes.length; 
    let completedTasks = 0;

    function updateProgress() {
        completedTasks++;
        let percent = Math.floor((completedTasks / totalTasks) * 100);
        console.log(`⏳ [Loading Progress] Đang tải tài nguyên: ${percent}%`);
        
        const progressText = document.getElementById('loading-progress-text');
        if (progressText) {
            progressText.innerText = `Loading... ${percent}%`;
        }
    }

    const codePromises = coreCodes.map(async (url) => {
        try {
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

    await Promise.all(codePromises);

    const assetsToDownload = [];
    for (const url of staticAssets) {
        const hasCache = await cache.match(url);
        if (!hasCache) {
            assetsToDownload.push(url); 
        }
    }

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

        await Promise.all(assetPromises);
    }

    console.log("🌟 [Pre-load] HOÀN THÀNH 100%! Game đã sẵn sàng khởi chạy.");
    changeScreen('menu');
}

// ==========================================
// 🏗️ HÀM KHỞI CHẠY LÕI HỆ THỐNG
// ==========================================
async function initGameEngine() {
    try {
        console.log("📥 [Engine] Fetching data from Google Sheets...");
        
        const [mobsResponse, questionsResponse] = await Promise.all([
            fetch(MOBS_CSV_URL),
            fetch(QUESTIONS_CSV_URL)
        ]);

        const mobsText = await mobsResponse.text();
        const questionsText = await questionsResponse.text();

        globalMobList = parseCSV(mobsText);
        globalQuestionList = parseCSV(questionsText);

        console.log(`✅ Loaded ${globalMobList.length} Mobs and ${globalQuestionList.length} Questions.`);

        await handleGamePreloadAndVersionControl();

    } catch (error) {
        console.error("🚨 Lỗi chí mạng khi khởi chạy Game Engine:", error);
        changeScreen('menu');
    }
}

// ==========================================
// ⚙️ BỘ NẠP ĐỘNG & ĐIỀU HƯỚNG ROUTE
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

function changeScreen(scrId) {
    if (shinyRainInterval) {
        clearInterval(shinyRainInterval);
        shinyRainInterval = null;
    }

    if (scrId === 'menu') {
        loadScreen('main-menu', () => {
            if (typeof initMainMenuLogic === 'function') {
                initMainMenuLogic();
            }
        });
    }
    if (scrId === 'battle') {
        loadScreen('battle-stage', () => {
            const coinText = document.getElementById('user-coins');
            const energyText = document.getElementById('user-energy');
            
            if (coinText) coinText.innerText = gameState.coins;
            // Nạp UI Energy linh hoạt không dính cứng /20
            if (energyText) energyText.innerText = gameState.energy; 
            
            if (typeof nextBattleTurn === 'function') {
                nextBattleTurn();
            }
        });
    }
    if (scrId === 'collection') {
        loadScreen('collection-book', () => {
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

// 🎯 HÀM TRỪ NĂNG LƯỢNG (Chỉ hoạt động khi Energy > 0)
function consumeEnergy() {
    if (gameState.energy > 0) {
        gameState.energy -= 1;
        
        const energyText = document.getElementById('user-energy');
        if (energyText) energyText.innerText = gameState.energy; // Linh hoạt hiển thị số hiện tại
        
        saveGameLocal();
        return true; 
    }
    return false; 
}

// ==========================================================================
// 🔐 HỆ THỐNG ĐĂNG NHẬP & XỬ LÝ DỮ LIỆU TỪ SHEET (API FETCH)
// ==========================================================================
async function loginGame(inputUsername, inputPassword) {
    try {
        console.log("🔄 Đang kết nối tới máy chủ Google Sheets...");

        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                username: inputUsername,
                password: inputPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            let userData = result.data;

            gameState.username = userData.username;
            gameState.coins = parseInt(userData.coins) || 0;

            let genderChar = userData.gender ? userData.gender.toString().toUpperCase().trim() : "";
            if (genderChar === 'M' || genderChar === 'MALE') {
                gameState.gender = 'male'; 
            } else if (genderChar === 'F' || genderChar === 'FEMALE') {
                gameState.gender = 'female'; 
            } else {
                gameState.gender = ''; 
            }

            try {
                let rawJSON = userData.captured ? userData.captured.toString().trim() : "{}";
                if (rawJSON === "") rawJSON = "{}";
                gameState.captured = JSON.parse(rawJSON);
            } catch (e) {
                console.warn("⚠️ Cột Captured_List sai định dạng JSON. Reset túi đồ về 0.");
                gameState.captured = {};
            }

            // 🎯 Lấy trực tiếp năng lượng từ Sheet. Nếu admin để trống thì mặc định là 0 (hoặc số fen tự set trên Sheet)
            gameState.energy = parseInt(userData.energy) || 0;

            console.log("✅ ĐĂNG NHẬP THÀNH CÔNG! Dữ liệu hiện tại:", gameState);

            if (gameState.gender !== '') {
                saveGameLocal(); 
            }

            return true; 
        } else {
            console.warn("Đăng nhập thất bại:", result.message);
            return false;
        }
    } catch (error) {
        console.error("🚨 Lỗi Network:", error);
        return false;
    }
}

// ==========================================
// 🚀 BOOTSTRAP: KHỞI ĐỘNG GAME 
// ==========================================
window.onload = function() {
    loadScreen('loading-menu', () => {
        if (typeof initGameEngine === 'function') {
            initGameEngine();
        }
    });
};
