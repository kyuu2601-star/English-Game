// ==========================================================================
// 🔗 CONFIG CÁC ĐƯỜNG LINK GOOGLE SHEETS CỐT LÕI
// ==========================================================================
const MOBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=0&single=true&output=csv";
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=991631725&single=true&output=csv";

// 🎯 ĐÃ CẬP NHẬT: LINK DEPLOY MỚI NHẤT
const LOGIN_API_URL = "https://script.google.com/macros/s/AKfycbxh9a9wHqhsTlXglcdUaMFcl57MC5CyLZYttRvSAvCnY1kznmQJMlQd7QKQ6lAEF48/exec";

// 🎯 ĐÃ NÂNG CẤP: LÊN VERSION V4 CHUẨN CHỈ
const CACHE_NAME = 'mon-english-v7'; 

// 🎯 TẤT CẢ CHỈ SỐ ĐỂ TRỐNG/SỐ 0 ĐỂ GOOGLE SHEET NẠP XUỐNG
let globalMobList = [];      
let globalQuestionList = []; 
let gameState = { 
    username: "", 
    password: "", // Chuẩn bị ổ chứa password cho sync ngầm
    coins: 0, 
    gender: "", 
    captured: {},
    energy: 0,
    avatar: ""
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

    // Quét toàn bộ kho Cache trên máy, cái nào khác tên với CACHE_NAME hiện tại thì xóa sạch
    const cacheKeys = await caches.keys();
    for (const key of cacheKeys) {
        if (key !== CACHE_NAME) {
            console.log(`🗑️ Dọn dẹp phiên bản cũ: ${key}`);
            await caches.delete(key);
        }
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
        './screens/collection-book/ui.html', './screens/collection-book/style.css', './screens/collection-book/logic.js',
        // 🎯 ĐÃ THÊM MỚI: Nạp trước 3 file của Khu Vườn (mon-garden)
        './screens/mon-garden/ui.html', './screens/mon-garden/style.css', './screens/mon-garden/logic.js'
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
        './assets/Popup_Captured.png', './assets/Popup_Missed.png', './assets/VFX_Ball_Open.png', './assets/VFX_Ball_Close.png', './assets/VFX_Smoke.png', './assets/VFX_Star_Shiny.png',
        
        // 🎯 ĐÃ BỔ SUNG: DÀN ASSET CỦA KHU VƯỜN (NẰM CHUNG THƯ MỤC GỐC)
        './assets/Bubble_Chat.png', './assets/Btn_Whistle.png', './assets/Btn_Whistle_Pressed.png',
        './assets/tile_0_0.png', './assets/tile_0_1.png', './assets/tile_0_2.png', './assets/tile_0_3.png',
        './assets/tile_1_0.png', './assets/tile_1_1.png', './assets/tile_1_2.png', './assets/tile_1_3.png',
        './assets/tile_2_0.png', './assets/tile_2_1.png', './assets/tile_2_2.png', './assets/tile_2_3.png',
        './assets/tile_3_0.png', './assets/tile_3_1.png', './assets/tile_3_2.png', './assets/tile_3_3.png',
        // (Nếu fen có các file Player_Male_Main.png, Player_Female_Back.png thì nó cũng sẽ load từ đây luôn)
        './assets/Nametag_lvE.png', './assets/Card_LvE.png', './assets/Card_LvE_S.png'
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
    const noCacheStamp = new Date().getTime();

    try {
        let transitionOverlay = document.getElementById('global-transition-overlay');
        if (!transitionOverlay) {
            transitionOverlay = document.createElement('div');
            transitionOverlay.id = 'global-transition-overlay';
            document.body.appendChild(transitionOverlay);
        }

        const transHtmlRes = await fetch(`screens/transition/ui.html?v=${noCacheStamp}`, { cache: 'no-store' });
        transitionOverlay.innerHTML = await transHtmlRes.text();

        let transCss = document.getElementById('css-transition');
        if (!transCss) {
            transCss = document.createElement('link');
            transCss.id = 'css-transition'; transCss.rel = 'stylesheet';
            document.head.appendChild(transCss);
        }
        transCss.href = `screens/transition/style.css?v=${noCacheStamp}`;

        const htmlResponse = await fetch(`screens/${screenName}/ui.html?v=${noCacheStamp}`, { cache: 'no-store' });
        const htmlText = await htmlResponse.text();
        viewport.innerHTML = htmlText;
        
        const cssId = `css-${screenName}`;
        let link = document.getElementById(cssId);
        if (!link) {
            link = document.createElement('link');
            link.id = cssId; link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = `screens/${screenName}/style.css?v=${noCacheStamp}`;
        
        const oldScript = document.getElementById('screen-runtime-logic');
        if (oldScript) oldScript.remove();
        
        const script = document.createElement('script');
        script.id = 'screen-runtime-logic';
        script.src = `screens/${screenName}/logic.js?v=${noCacheStamp}`;
        script.onload = () => { 
            console.log(`🤖 Loaded Runtime Logic for: [${screenName}] (Cache Bypassed)`);
            
            setTimeout(() => {
                if (transitionOverlay) {
                    transitionOverlay.remove();
                }
                if (callback) callback();
            }, 2000);
        };
        document.body.appendChild(script);
        
    } catch (error) {
        console.error(`Không thể nạp màn hình: ${screenName}`, error);
        const transitionOverlay = document.getElementById('global-transition-overlay');
        if (transitionOverlay) transitionOverlay.remove();
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
    // 🎯 ĐÃ THÊM MỚI: Chuyển hướng cho Khu Vườn
    if (scrId === 'garden') {
        if (typeof cleanUpGardenEngineLeaks === 'function') {
            cleanUpGardenEngineLeaks();
        }
        loadScreen('mon-garden', () => {
            if (typeof initGardenLogic === 'function') {
                initGardenLogic();
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

function consumeEnergy() {
    if (gameState.energy > 0) {
        gameState.energy -= 1;
        
        const energyText = document.getElementById('user-energy');
        if (energyText) energyText.innerText = gameState.energy; 
        
        saveGameLocal();
        return true; 
    }
    return false; 
}

// ==========================================================================
// 🔐 HỆ THỐNG ĐĂNG NHẬP & XỬ LÝ DỮ LIỆU TỪ SHEET (API FETCH)
// ==========================================================================

// 🔓 1. HÀM ĐĂNG NHẬP
async function loginGame(inputUsername, inputPassword) {
    try {
        console.log("🔄 Đang kết nối tới máy chủ Google Sheets (Login)...");

        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: "login", 
                username: inputUsername,
                password: inputPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            let userData = result.data;

            gameState.username = userData.username;
            gameState.password = inputPassword; 
            gameState.coins = parseInt(userData.coins) || 0;
            gameState.avatar = userData.avatar ? userData.avatar.trim() : "";

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
        console.error("🚨 Lỗi Network Login:", error);
        return false;
    }
}

// 💾 2. HÀM LƯU DỮ LIỆU (ĐÃ GẮN DÂY TÍN HIỆU ID CÂU HỎI)
async function saveGameToSheet() {
    if (!gameState.username || gameState.username === "") return;

    try {
        let sheetGender = "";
        if (gameState.gender === 'male') sheetGender = "M";
        else if (gameState.gender === 'female') sheetGender = "F";

        // 🎯 LÔI ID CÂU HỎI HIỆN TẠI RA ĐỂ BẮN LÊN API
        const qID = (window.currentQuestion && window.currentQuestion.Q_ID) ? window.currentQuestion.Q_ID : "";

        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: "save", 
                username: gameState.username,
                coins: gameState.coins,
                gender: sheetGender,
                captured: JSON.stringify(gameState.captured),
                energy: gameState.energy,
                questionId: qID // 🎯 Bắn mảng này lên để Server tự cộng Count
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log("☁️ Đã sao lưu Cloud và cập nhật Count câu hỏi thành công!");
        } else {
            console.warn("☁️ Lỗi sao lưu Cloud:", result.message);
        }
    } catch (error) {
        console.error("🚨 Lỗi Network Save:", error);
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
