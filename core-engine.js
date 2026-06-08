// ==========================================
// 🔗 CONFIG CÁC ĐƯỜNG LINK GOOGLE SHEETS (ĐÃ CHUYỂN ĐUÔI CSV CHUẨN)
// ==========================================
const MOBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=0&single=true&output=csv";
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=991631725&single=true&output=csv";

// ==========================================
// 📦 GAME STATE MANAGEMENT (QUẢN LÝ TRẠNG THÁI)
// ==========================================
let globalMobList = [];      
let globalQuestionList = []; 

let gameState = {
    username: "",
    coins: 0,
    gender: "", // 'male' hoặc 'female'
    captured: {} 
};

let currentMob = null;
let currentQuestion = null;
let currentBookPage = 0; 
let selectedGenderTemp = ""; // Lưu tạm lúc click popup
let shinyRainInterval = null; // Quản lý bộ đếm thời gian thả mưa sao Shiny ngẫu nhiên

// ==========================================
// ⚙️ HÀM CỐT LÕI: NẠP ĐỘNG UI TỪ THƯ MỤC RIÊNG
// ==========================================
async function loadScreen(screenName, callback) {
    const viewport = document.getElementById('game-viewport');
    
    try {
        // 1. Tải file HTML của màn hình đó
        const htmlResponse = await fetch(`screens/${screenName}/ui.html`);
        const htmlText = await htmlResponse.text();
        
        // 2. Xóa màn hình cũ, đập màn hình mới vào viewport
        viewport.innerHTML = htmlText;
        
        // 3. Kiểm tra xem đã nạp CSS của màn hình này chưa, nếu chưa thì nạp vào <head>
        const cssId = `css-${screenName}`;
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `screens/${screenName}/style.css`;
            document.head.appendChild(link);
        }
        
        // 4. Chạy hàm thiết lập riêng của màn hình đó (nếu có)
        if (callback) callback();
        
    } catch (error) {
        console.error(`Không thể nạp màn hình: ${screenName}`, error);
    }
}

// Helper dịch CSV thành Object
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

// KHỞI CHẠY KHUNG ENGINE khi vừa mở Web
window.onload = function() {
    loadScreen('loading-menu', initGameEngine);
};

// Hàm kích hoạt nạp data từ Sheet sau khi màn hình loading đã sẵn sàng
async function initGameEngine() {
    triggerDataFetching();
}

function saveGameLocal() {
    localStorage.setItem(`pkm_catch_${gameState.username}`, JSON.stringify(gameState));
}

// ==========================================
// 🚀 LUỒNG PRELOAD TẢI TRƯỚC TẤT CẢ ASSET RỒI MỚI VÀO GAME
// ==========================================
async function triggerDataFetching() {
    const fill = document.getElementById('loading-bar-fill');
    const txt = document.getElementById('loading-text');
    
    if (fill) fill.style.width = "10%";
    if (txt) txt.innerText = "Connecting to Google Sheets...";
    
    try {
        // 1. Kéo dữ liệu thực từ link Google Sheets của fen công khai dạng CSV
        const [mobsResponse, questionsResponse] = await Promise.all([
            fetch(MOBS_CSV_URL).then(res => res.text()),
            fetch(QUESTIONS_CSV_URL).then(res => res.text())
        ]);

        globalMobList = parseCSV(mobsResponse);
        globalQuestionList = parseCSV(questionsResponse);

        if (fill) fill.style.width = "30%";
        if (txt) txt.innerText = "Analyzing game data...";

        // 2. DANH SÁCH FILE ẢNH ĐỒNG BỘ THEO TÊN THỰC TẾ TRÊN GITHUB CỦA FEN
        let assetsToPreload = [
            '../../assets/Btn_Start.png',
            '../../assets/Btn_Start_Pressed.png',
            '../../assets/Btn_Collection.png',
            '../../assets/Btn_Collection_Pressed.png',
            '../../assets/UI_Answer_Box.png',
            '../../assets/UI_Answer_Box_Pressed.png',
            '../../assets/UI_Question_Box.png',
            '../../assets/Btn_Back.png',
            '../../assets/Btn_Back_Pressed.png',
            '../../assets/Btn_Collection_Icon.png',
            '../../assets/Btn_Collection_Icon_Pressed.png',
            '../../assets/Btn_Backpack_Icon.png',
            '../../assets/Btn_Backpack_Icon_Pressed.png',
            '../../assets/Btn_Setting_Icon.png',
            '../../assets/Btn_Setting_Icon_Pressed.png',
            '../../assets/Collection_Page_Btn.png',
            '../../assets/Collection_Page_Btn_Pressed1.png',
            '../../assets/Collection_Page_Btn_Pressed2.png',
            '../../assets/Tag_Icon.png',
            '../../assets/VFX_Smoke.png',
            '../../assets/VFX_Ball_Open.png',
            '../../assets/VFX_Ball_Close.png',
            '../../assets/VFX_Star_Shiny.png',
            '../../assets/Player_Male_Main.png',
            '../../assets/Player_Female_Main.png',
            '../../assets/Player_Male_Back.png',
            '../../assets/Player_Female_Back.png',
            '../../assets/Nametag_lv1.png',
            '../../assets/Nametag_lv2.png',
            '../../assets/Nametag_lv3.png',
            '../../assets/Nametag_lv4.png',
            '../../assets/Nametag_lv5.png',
            '../../assets/BG_Desert.png',
            '../../assets/BG_Forest.png',
            '../../assets/BG_Snow.png',
            '../../assets/BG_Volcano.png'
        ];

        // Tự động quét và gom thêm toàn bộ link ảnh Quái vật lấy từ Google Sheet
        globalMobList.forEach(mob => {
            if (mob.Image && mob.Image.trim() !== "") {
                assetsToPreload.push(mob.Image);
            }
            // Gom luôn phôi thẻ bài theo cấp sao của quái trong Collection Book
            assetsToPreload.push(`../../assets/Card_lv${mob.Stars}.png`);
            assetsToPreload.push(`../../assets/Card_lv${mob.Stars}_S.png`);
        });

        // Lọc trùng danh sách cho nhẹ máy
        assetsToPreload = [...new Set(assetsToPreload)];

        // 3. TIẾN HÀNH BƠM ĐẨY TẢI NGẦM TẤT CẢ ẢNH VÀO BỘ NHỚ ĐỆM TRÌNH DUYỆT
        let loadedCount = 0;
        const totalAssets = assetsToPreload.length;

        if (totalAssets === 0) {
            if (fill) fill.style.width = "100%";
            proceedToLogin();
            return;
        }

        function assetLoaded() {
            loadedCount++;
            let progress = 30 + Math.floor((loadedCount / totalAssets) * 70);
            if (fill) fill.style.width = `${progress}%`;
            if (txt) txt.innerText = `Loading Assets: ${loadedCount}/${totalAssets} (Please wait...)`;

            if (loadedCount === totalAssets) {
                if (txt) txt.innerText = "All assets successfully loaded! Ready to Play.";
                setTimeout(proceedToLogin, 600);
            }
        }

        // Kích hoạt vòng lặp nạp ảnh ngầm
        assetsToPreload.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = assetLoaded;
            img.onerror = assetLoaded; 
        });

    } catch (error) {
        if (txt) txt.innerText = "Error connecting to Google Sheets! Check your link public.";
        console.error(error);
    }
}

// Hàm phụ trợ chuyển tiếp sang Popup Login sau khi nạp xong xuôi asset
function proceedToLogin() {
    const bar = document.getElementById('loading-bar-container');
    const popup = document.getElementById('login-popup');
    if (bar) bar.style.display = "none";
    if (popup) popup.style.display = "flex";
}

// Hàm chuyển đổi màn hình động bằng cách gọi lại loadScreen
function changeScreen(scrId) {
    if (scrId === 'menu') {
        loadScreen('loading-menu', () => {
            document.getElementById('loading-bar-container').style.display = "none";
            document.getElementById('login-popup').style.display = "none";
            document.getElementById('menu-controls').style.display = "flex";
            document.getElementById('menu-avatar-display').style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Main.png')`;
            document.getElementById('user-coins').innerText = gameState.coins;
        });
    }
    if (scrId === 'battle') {
        loadScreen('battle-stage', () => {
            document.getElementById('user-coins').innerText = gameState.coins;
            nextBattleTurn(); 
        });
    }
    if (scrId === 'collection') {
        loadScreen('collection-book', () => {
            currentBookPage = 0;
            renderCollectionBook(); 
        });
    }
}

// ==========================================
// 🕹️ CÁC LOGIC CHƠI VÀ ĐỔ XÚX XẮC KHÔNG ĐỔI
// ==========================================

// Chọn giới tính trên Popup (Bật class sáng viền)
function pickGender(g) {
    selectedGenderTemp = g;
    const cardMale = document.getElementById('char-card-male');
    const cardFemale = document.getElementById('char-card-female');
    
    if (cardMale) cardMale.classList.remove('selected');
    if (cardFemale) cardFemale.classList.remove('selected');
    
    if (g === 'male' && cardMale) cardMale.classList.add('selected');
    if (g === 'female' && cardFemale) cardFemale.classList.add('selected');
}

// Xác nhận Login và kiểm tra lịch sử lưu game
function confirmLogin() {
    const nameInput = document.getElementById('input-username');
    const name = nameInput ? nameInput.value.trim() : "";
    
    if (!name) { alert("Please enter your name in the center box!"); return; }
    if (!selectedGenderTemp) { alert("Please click to choose either Boy or Girl character!"); return; }

    gameState.username = name;
    gameState.gender = selectedGenderTemp;

    let saved = localStorage.getItem(`pkm_catch_${gameState.username}`);
    if (saved) {
        let parsed = JSON.parse(saved);
        gameState.coins = parsed.coins;
        gameState.gender = parsed.gender; 
        gameState.captured = Object.assign({}, parsed.captured);
    } else {
        gameState.coins = 0;
        gameState.captured = {};
        globalMobList.forEach(m => gameState.captured[m.ID] = 0);
    }

    const menuControls = document.getElementById('menu-controls');
    const avatarDisplay = document.getElementById('menu-avatar-display');
    const loginPopup = document.getElementById('login-popup');
    
    if (avatarDisplay) avatarDisplay.style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Main.png')`;
    if (loginPopup) loginPopup.style.display = "none";
    if (menuControls) menuControls.style.display = "flex";
    
    saveGameLocal();
}

// Đổ xúc xắc quái hiếm & bốc câu hỏi từ Sheet thật
function nextBattleTurn() {
    const mobSprite = document.getElementById('mob-sprite');
    if (!mobSprite) return;

    // 🌧️ DỌN DẸP SẠCH SẼ: Tự động xóa bộ đếm mưa sao rơi của turn cũ để tránh lỗi chồng dồn hạt
    if (shinyRainInterval) {
        clearInterval(shinyRainInterval);
        shinyRainInterval = null;
    }

    mobSprite.style.display = "block";
    mobSprite.style.opacity = "1";
    mobSprite.style.transform = "scale(1) translateX(0)";
    document.getElementById('smoke-vfx').className = "vfx-smoke-effect";
    document.getElementById('ball-vfx').style.display = "none";
    
    const container = document.getElementById('shiny-particles');
    if (container) container.innerHTML = "";

    // Tỉ lệ sao: 1 sao (40%), 2 sao (30%), 3 sao (18%), 4 sao (9%), 5 sao (3%)
    let randStar = Math.random() * 100;
    let stars = 1;
    if (randStar < 40) stars = 1;
    else if (randStar < 70) stars = 2;
    else if (randStar < 88) stars = 3;
    else if (randStar < 97) stars = 4;
    else stars = 5;

    let isShinyRoll = Math.random() < 0.01; // 1% Shiny

    let pool = globalMobList.filter(m => parseInt(m.Stars) === stars);
    if (pool.length === 0) pool = globalMobList;

    let shinyPool = pool.filter(m => /[a-zA-Z]$/.test(m.ID));
    let normalPool = pool.filter(m => /^\d+\.\d+$/.test(m.ID));

    if (isShinyRoll && shinyPool.length > 0) {
        currentMob = shinyPool[Math.floor(Math.random() * shinyPool.length)];
        triggerShinyVFX(); // Gọi cơn mưa sao rơi lùi nền ngầm
    } else {
        currentMob = normalPool.length > 0 ? normalPool[Math.floor(Math.random() * normalPool.length)] : pool[Math.floor(Math.random() * pool.length)];
    }

    // Đổi cảnh nền map ngẫu nhiên theo đúng bảng chữ hoa chữ thường tài sản thật
    const maps = ['Desert', 'Forest', 'Snow', 'Volcano'];
    let randMap = maps[Math.floor(Math.random() * maps.length)];
    document.getElementById('battle-field').style.backgroundImage = `url('assets/BG_${randMap}.png')`;
    
    mobSprite.style.backgroundImage = `url('${currentMob.Image}')`;
    document.getElementById('mob-nametag').style.backgroundImage = `url('assets/Nametag_lv${stars}.png')`;
    document.getElementById('mob-name-text').innerText = currentMob.Name;
    document.getElementById('player-sprite').style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Back.png')`;

    // Lọc câu hỏi cùng cấp sao
    let qPool = globalQuestionList.filter(q => parseInt(q.Question_Stars) === stars);
    if (qPool.length === 0) qPool = globalQuestionList;
    currentQuestion = qPool[Math.floor(Math.random() * qPool.length)];

    document.getElementById('question-text').innerText = currentQuestion.Question;
    document.getElementById('ans-A').innerText = currentQuestion.Option_A;
    document.getElementById('ans-B').innerText = currentQuestion.Option_B;
    document.getElementById('ans-C').innerText = currentQuestion.Option_C;
}

// NÂNG CẤP: HỆ THỐNG MƯA SAO RƠI NGẪU NHIÊN XUYÊN SUỐT TRẬN ĐẤU CỦA QUÁI SHINY
function triggerShinyVFX() {
    const container = document.getElementById('shiny-particles');
    if (!container) return;
    
    if (shinyRainInterval) clearInterval(shinyRainInterval);

    // 🌧️ ĐÚNG 1 GIÂY (1000ms) TỰ ĐỘNG THẢ 1 HẠT SAO RƠI TỪ TRÊN TRỜI XUỐNG
    shinyRainInterval = setInterval(() => {
        // Biện pháp an toàn: Nếu chuyển màn hình (container bay màu khỏi UI), tự hủy đếm ngầm liền
        if (!document.getElementById('shiny-particles')) {
            clearInterval(shinyRainInterval);
            return;
        }

        let star = document.createElement('div');
        star.className = "shiny-star";
        
        // Tọa độ nằm ngang X chạy ngẫu nhiên từ trái qua phải (0% -> 95%) dọc màn hình map
        let randomX = Math.random() * 95; 
        star.style.left = `${randomX}%`;
        
        // Tốc độ rơi ngẫu nhiên từ 2.5s đến 4s để các hạt rơi so le, tự nhiên hơn
        let duration = 2.5 + Math.random() * 1.5;
        star.style.setProperty('--fall-duration', `${duration}s`);
        
        container.appendChild(star);
        
        // Hạt rơi tuột khỏi màn hình -> Tự hủy thẻ div để giải phóng RAM cho trình duyệt mượt mà
        setTimeout(() => { star.remove(); }, duration * 1000);
    }, 1000);
}

// Diễn hoạt animation bắt dính quái (Đúng) / chạy thoát (Sai)
function submitAnswer(chosen) {
    if (chosen === currentQuestion.Correct_Answer) {
        let ball = document.getElementById('ball-vfx');
        let mob = document.getElementById('mob-sprite');
        
        if (ball) {
            ball.style.backgroundImage = "url('assets/VFX_Ball_Open.png')";
            ball.style.display = "block";
        }
        if (mob) {
            mob.style.transition = "all 0.4s ease-in";
            mob.style.transform = "scale(0)";
            mob.style.opacity = "0";
        }
        
        setTimeout(() => {
            if (ball) ball.style.backgroundImage = "url('assets/VFX_Ball_Close.png')";
            alert("✨ CAPTURED! Successfully caught: " + currentMob.Name);
            
            let isFirstTime = gameState.captured[currentMob.ID] === 0;
            gameState.captured[currentMob.ID] += 1;

            if (!isFirstTime) {
                gameState.coins += (parseInt(currentMob.Stars) * 10);
                document.getElementById('user-coins').innerText = gameState.coins;
            }
            saveGameLocal(); 
            nextBattleTurn();
        }, 500);
    } else {
        const smoke = document.getElementById('smoke-vfx');
        const mob = document.getElementById('mob-sprite');
        
        if (smoke) smoke.classList.add('play-smoke');
        
        if (mob) {
            mob.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s";
            mob.style.transform = "translateX(-800px) scale(0.6)"; 
            mob.style.opacity = "0";
        }
        
        setTimeout(() => {
            alert(`😢 Oh no! ${currentMob.Name} ran away! The correct answer was: ${currentQuestion.Correct_Answer}`);
            nextBattleTurn();
        }, 500);
    }
}

// Xếp thẻ quái thật lên trang sách bộ sưu tập (Layout 2x2 mỗi trang)
function renderCollectionBook() {
    const leftGrid = document.getElementById('grid-page-left');
    const rightGrid = document.getElementById('grid-page-right');
    if (!leftGrid || !rightGrid) return;
    
    leftGrid.innerHTML = ""; rightGrid.innerHTML = "";

    let startIdx = currentBookPage * 8;
    let pageItems = globalMobList.slice(startIdx, startIdx + 8);

    pageItems.forEach((mob, index) => {
        let isShiny = /[a-zA-Z]$/.test(mob.ID);
        let count = gameState.captured[mob.ID] || 0;
        
        let card = document.createElement('div');
        card.className = `card-item ${count > 0 ? 'unlocked' : ''}`;
        
        let imgName = isShiny ? `Card_lv${mob.Stars}_S.png` : `Card_lv${mob.Stars}.png`;
        card.style.backgroundImage = `url('assets/${imgName}')`;

        card.innerHTML = `
            <img src="${mob.Image}" class="mob-thumb">
            <div class="card-title">${count > 0 ? mob.Name : '???'}</div>
            <div class="card-tag">${count > 0 ? 'x' + count : '0'}</div>
        `;

        if (index < 4) leftGrid.appendChild(card);
        else rightGrid.appendChild(card);
    });
}

function prevBookPage() {
    if (currentBookPage > 0) currentBookPage--;
    renderCollectionBook();
}

function nextBookPage() {
    if ((currentBookPage + 1) * 8 < globalMobList.length) currentBookPage++;
    renderCollectionBook();
}
