// ==========================================
// 🤖 MÔ-ĐUN LOGIC TÁCH BIỆT: MÀN HÌNH CHIẾN ĐẤU (BATTLE-STAGE)
// ==========================================

function nextBattleTurn() {
    const mobSprite = document.getElementById('mob-sprite');
    const mobTag = document.getElementById('mob-nametag');
    const popupBanner = document.getElementById('result-popup-banner');

    const topNav = document.querySelector('.menu-top-right-nav');
    if (topNav) topNav.style.display = "flex"; 
    
    if (!mobSprite || !mobTag) return;

    // Reset trạng thái hiển thị
    mobSprite.style.display = "block";
    mobSprite.style.opacity = "1";
    mobSprite.style.transform = "scale(1) translateX(0)";
    mobTag.style.display = "flex";
    mobTag.style.opacity = "1";
    mobTag.style.zIndex = "700"; 
    
    if (popupBanner) { 
        popupBanner.style.display = "none"; 
        popupBanner.style.transform = "translate(-50%, -50%) scale(0)"; 
    }
    
    const smokeVfx = document.getElementById('smoke-vfx');
    if (smokeVfx) {
        smokeVfx.className = "";
        smokeVfx.style.display = "none";
    }
    
    const ballVfx = document.getElementById('ball-vfx');
    if (ballVfx) ballVfx.style.display = "none";
    
    if (shinyRainInterval) { 
        clearInterval(shinyRainInterval); 
        shinyRainInterval = null; 
    }
    
    const container = document.getElementById('shiny-particles');
    if (container) container.innerHTML = "";

    // Đổi map nền ngẫu nhiên
    const maps = ['Desert', 'Forest', 'Snow', 'Volcano'];
    let randMap = maps[Math.floor(Math.random() * maps.length)];
    document.getElementById('battle-field').style.backgroundImage = `url('assets/BG_${randMap}.png')`;

    // 🎯 ĐÃ THÊM LÕI CHỐT CHẶN: KIỂM TRA THỂ LỰC (ENERGY)
    if (gameState.energy <= 0) {
        mobSprite.style.display = "none";
        mobTag.style.display = "none";
        document.getElementById('question-text').innerText = "You're out of energy! Please wait for admin refill or come back tomorrow to rest!";
        document.querySelector('.answers-zone').style.display = "none"; 
        return; 
    }

    document.querySelector('.answers-zone').style.display = "flex";

    // ------------------------------------------------------------------
    // 🎡 TẦNG 1: ĐỔ XÚC XẮC CHỌN MỐC BUCKET % (CHỐNG PHA LOÃNG)
    // ------------------------------------------------------------------
    // 🎯 RỔ CẤU HÌNH % CỐ ĐỊNH: Tổng các con số này bắt buộc phải bằng 100.
    // Sau này muốn thêm nhóm "Event" hay mốc "6", fen cứ phẩy rồi nhét thêm 1 dòng vào đây là xong.
    const STAR_PERCENTAGES = {
        "1": 40,
        "2": 30,
        "3": 18,
        "4": 9,
        "5": 3
    };

    let randStar = Math.random() * 100;
    let stars = "1"; // Giá trị mặc định phòng hờ

    for (let key in STAR_PERCENTAGES) {
        if (randStar < STAR_PERCENTAGES[key]) {
            stars = key;
            break;
        }
        randStar -= STAR_PERCENTAGES[key];
    }

    // ------------------------------------------------------------------
    // 🎰 TẦNG 2: LỌC BUCKET & XOAY THEO TRỌNG SỐ (WEIGHT - CỘT RATE TRÊN SHEET)
    // ------------------------------------------------------------------
    // Gom toàn bộ quái vật thuộc mốc Stars vừa trúng giải ở Tầng 1
    let pool = globalMobList.filter(m => {
        let mobStarStr = m.Stars ? m.Stars.toString().trim() : "";
        return mobStarStr === stars.toString().trim();
    });
    if (pool.length === 0) pool = globalMobList;

    // Phân tách nhánh Shiny và Normal dựa theo đuôi ID để chạy cơ chế Shiny Roll của fen
    let isShinyRoll = Math.random() < 0.01; 
    let shinyPool = pool.filter(m => /[a-zA-Z]$/.test(m.ID));
    let normalPool = pool.filter(m => /^\d+\.\d+$/.test(m.ID));

    // Chọn rổ quái mục tiêu theo tỷ lệ Shiny trúng thưởng
    let targetPool = pool;
    if (isShinyRoll && shinyPool.length > 0) {
        targetPool = shinyPool;
        triggerShinyVFX(); 
    } else if (normalPool.length > 0) {
        targetPool = normalPool;
    }

    // Tiến hành lọc bỏ những con quái có Rate = 0 (Đã bị tắt/khóa trên Google Sheet) trong rổ mục tiêu
    let activePool = targetPool.filter(mob => {
        let rate = parseInt(mob.Rate);
        if (isNaN(rate)) rate = 10; // Nếu để trống cột Rate trên Sheet thì mặc định trọng số là 10
        return rate > 0;
    });

    // Bẫy cứu hộ: Nếu lỡ tay tắt sạch Rate về 0, lôi lại pool gốc ra chơi đỡ tránh sập giao diện
    if (activePool.length === 0) activePool = targetPool;

    // Tính tổng trọng số Rate của mớ quái đang kích hoạt
    let totalGroupWeight = 0;
    activePool.forEach(mob => {
        let rate = parseInt(mob.Rate);
        if (isNaN(rate)) rate = 10;
        totalGroupWeight += rate;
    });

    // Quay số lọt lòng tìm con quái trúng thưởng cuối cùng theo Weight
    let groupRoll = Math.random() * totalGroupWeight;
    currentMob = activePool[activePool.length - 1]; // Dự phòng con cuối

    for (let i = 0; i < activePool.length; i++) {
        let mob = activePool[i];
        let rate = parseInt(mob.Rate);
        if (isNaN(rate)) rate = 10;

        if (groupRoll < rate) {
            currentMob = mob;
            break;
        }
        groupRoll -= rate;
    }

    // ------------------------------------------------------------------
    // ĐỔ DỮ LIỆU LÊN GIAO DIỆN HIỂN THỊ (GIỮ NGUYÊN GỐC)
    // ------------------------------------------------------------------
    mobSprite.style.backgroundImage = `url('${currentMob.Image}')`;
    mobTag.style.backgroundImage = `url('assets/Nametag_lv${stars}.png')`;
    document.getElementById('mob-name-text').innerText = currentMob.Name;
    document.getElementById('player-sprite').style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Back.png')`;

    // Câu hỏi lọc theo mốc Stars tương ứng như cũ
    let qPool = globalQuestionList.filter(q => parseInt(q.Question_Stars) === parseInt(stars));
    if (qPool.length === 0) qPool = globalQuestionList;
    currentQuestion = qPool[Math.floor(Math.random() * qPool.length)];

    document.getElementById('question-text').innerText = currentQuestion.Question;
    document.getElementById('ans-A').innerText = currentQuestion.Option_A;
    document.getElementById('ans-B').innerText = currentQuestion.Option_B;
    document.getElementById('ans-C').innerText = currentQuestion.Option_C;
}

function triggerShinyVFX() {
    const container = document.getElementById('shiny-particles');
    if (!container) return;
    
    shinyRainInterval = setInterval(() => {
        if (!document.getElementById('shiny-particles')) { clearInterval(shinyRainInterval); return; }

        let star = document.createElement('div');
        star.className = "shiny-star";
        star.style.left = `${Math.random() * 95}%`;
        
        let duration = 2.5 + Math.random() * 1.5;
        star.style.setProperty('--fall-duration', `${duration}s`);
        
        container.appendChild(star);
        setTimeout(() => { star.remove(); }, duration * 1000);
    }, 400); 
}

function submitAnswer(chosen) {
    if (gameState.energy <= 0) return;

    const popupBanner = document.getElementById('result-popup-banner');
    const ball = document.getElementById('ball-vfx');
    const mob = document.getElementById('mob-sprite');
    const tag = document.getElementById('mob-nametag');
    const smoke = document.getElementById('smoke-vfx');

    if (!popupBanner || !mob || !tag) return;

    consumeEnergy();

    if (chosen === currentQuestion.Correct_Answer) {
        // ==========================================
        // 🟢 TRƯỜNG HỢP ĐÚNG: CAPTURED FLOW
        // ==========================================
        popupBanner.style.backgroundImage = "url('assets/Popup_Captured.png')";
        popupBanner.style.display = "block";
        popupBanner.style.transform = "translate(-50%, -50%) scale(1)";
        popupBanner.style.zIndex = "999";

        if (ball) {
            ball.style.backgroundImage = "url('assets/VFX_Ball_Open.png')";
            ball.style.display = "block";
            ball.style.zIndex = "850";
        }

        tag.style.zIndex = "700";
        tag.style.opacity = "0"; 
        mob.style.zIndex = "600";
        mob.style.opacity = "0";
        mob.style.transform = "scale(0)";

        setTimeout(() => {
            if (ball) {
                ball.style.backgroundImage = "url('assets/VFX_Ball_Close.png')";
                ball.style.zIndex = "840";
            }
            
            setTimeout(() => {
                let isFirstTime = !gameState.captured[currentMob.ID]; 
                
                gameState.captured[currentMob.ID] = (gameState.captured[currentMob.ID] || 0) + 1;
                
                if (!isFirstTime) {
                    gameState.coins += (parseInt(currentMob.Stars) * 10);
                    const coinDisplay = document.getElementById('user-coins');
                    if (coinDisplay) coinDisplay.innerText = gameState.coins;
                }

                if (typeof saveGameToSheet === 'function') { saveGameToSheet(); }
                
                saveGameLocal(); 
                nextBattleTurn();
            }, 1200);
        }, 200);

    } else {
        // ==========================================
        // 🔴 TRƯỜNG HỢP SAI: MISSED FLOW
        // ==========================================
        popupBanner.style.backgroundImage = "url('assets/Popup_Missed.png')";
        popupBanner.style.display = "block";
        popupBanner.style.transform = "translate(-50%, -50%) scale(1)";
        popupBanner.style.zIndex = "999";

        if (smoke) {
            smoke.style.display = "block";
            smoke.classList.add('play-smoke');
        }

        tag.style.zIndex = "700";
        tag.style.opacity = "0";

        mob.style.zIndex = "600";
        mob.style.transform = "translateX(-1200px) scale(0.5)";
        mob.style.opacity = "0";

        setTimeout(() => {
            if (typeof saveGameToSheet === 'function') { saveGameToSheet(); }
            
            saveGameLocal();
            nextBattleTurn();
        }, 1500);
    }
}
