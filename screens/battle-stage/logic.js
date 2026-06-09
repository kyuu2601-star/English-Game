// ==========================================
// 🤖 MÔ-ĐUN LOGIC TÁCH BIỆT: MÀN HÌNH CHIẾN ĐẤU (BATTLE-STAGE)
// ==========================================

function nextBattleTurn() {
    const mobSprite = document.getElementById('mob-sprite');
    const mobTag = document.getElementById('mob-nametag');
    const popupBanner = document.getElementById('result-popup-banner');

    const topNav = document.querySelector('.menu-top-right-nav'); // Hoặc id/class của cụm nút góc phải bên battle
    if (topNav) {
        topNav.style.display = "flex"; // Ép cụm nút bung ra dạng flex để hiện lên góc phải
    }
    
    if (!mobSprite || !mobTag) return;
    
    if (!mobSprite || !mobTag) return;

    // Reset trạng thái hiển thị mặc định của quái và thẻ tên ở đầu lượt
    mobSprite.style.display = "block";
    mobSprite.style.opacity = "1";
    mobSprite.style.transform = "scale(1) translateX(0)";
    mobTag.style.display = "flex";
    mobTag.style.opacity = "1";
    mobTag.style.zIndex = "700"; // Trả về z-layer ưu tiên 2 mặc định
    
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
    if (ballVfx) {
        ballVfx.style.display = "none";
    }
    
    if (shinyRainInterval) { 
        clearInterval(shinyRainInterval); 
        shinyRainInterval = null; 
    }
    
    const container = document.getElementById('shiny-particles');
    if (container) container.innerHTML = "";

    // Đổ xúc xắc cấp sao quái vật
    let randStar = Math.random() * 100;
    let stars = 1;
    if (randStar < 40) stars = 1;
    else if (randStar < 70) stars = 2;
    else if (randStar < 88) stars = 3;
    else if (randStar < 97) stars = 4;
    else stars = 5;

    let isShinyRoll = Math.random() < 0.01; // Tỉ lệ 1% xuất hiện quái Shiny

    let pool = globalMobList.filter(m => parseInt(m.Stars) === stars);
    if (pool.length === 0) pool = globalMobList;

    let shinyPool = pool.filter(m => /[a-zA-Z]$/.test(m.ID));
    let normalPool = pool.filter(m => /^\d+\.\d+$/.test(m.ID));

    if (isShinyRoll && shinyPool.length > 0) {
        currentMob = shinyPool[Math.floor(Math.random() * shinyPool.length)];
        triggerShinyVFX(); // Kích hoạt mưa sao rơi ưu tiên 2.5
    } else {
        currentMob = normalPool.length > 0 ? normalPool[Math.floor(Math.random() * normalPool.length)] : pool[Math.floor(Math.random() * pool.length)];
    }

    // Đổi map nền ngẫu nhiên
    const maps = ['Desert', 'Forest', 'Snow', 'Volcano'];
    let randMap = maps[Math.floor(Math.random() * maps.length)];
    
    // 🎯 ĐÃ FIX: Đưa về đường dẫn gốc 'assets/'
    document.getElementById('battle-field').style.backgroundImage = `url('assets/BG_${randMap}.png')`;
    
    // Đổ phôi dữ liệu lên giao diện
    mobSprite.style.backgroundImage = `url('${currentMob.Image}')`;
    
    // 🎯 ĐÃ FIX: Đưa về đường dẫn gốc 'assets/' cho thẻ tên quái và ảnh nhân vật quay lưng
    mobTag.style.backgroundImage = `url('assets/Nametag_lv${stars}.png')`;
    document.getElementById('mob-name-text').innerText = currentMob.Name;
    document.getElementById('player-sprite').style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Back.png')`;

    // Trích xuất câu hỏi đồng cấp sao
    let qPool = globalQuestionList.filter(q => parseInt(q.Question_Stars) === stars);
    if (qPool.length === 0) qPool = globalQuestionList;
    currentQuestion = qPool[Math.floor(Math.random() * qPool.length)];

    document.getElementById('question-text').innerText = currentQuestion.Question;
    document.getElementById('ans-A').innerText = currentQuestion.Option_A;
    document.getElementById('ans-B').innerText = currentQuestion.Option_B;
    document.getElementById('ans-C').innerText = currentQuestion.Option_C;
}

// 🌧️ CƠN MƯA SAO RƠI SHINY PHÂN TẦNG ƯU TIÊN 2.5
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
    }, 400); // Tăng mật độ hạt rơi cho dày và đẹp mắt hơn
}

// ⚔️ XỬ LÝ ĐÁP ÁN: DIỄN HOẠT PHÂN TẦNG Z-LAYER TUYỆT ĐỐI THEO FEEDBACK
function submitAnswer(chosen) {
    const popupBanner = document.getElementById('result-popup-banner');
    const ball = document.getElementById('ball-vfx');
    const mob = document.getElementById('mob-sprite');
    const tag = document.getElementById('mob-nametag');
    const smoke = document.getElementById('smoke-vfx');

    if (!popupBanner || !mob || !tag) return;

    if (chosen === currentQuestion.Correct_Answer) {
        // ==========================================
        // 🟢 TRƯỜNG HỢP ĐÚNG: CAPTURED FLOW
        // ==========================================
        // 1. Hiện popup Captured (Ưu tiên 1 - z-index 999)
        // 🎯 ĐÃ FIX: Đưa về đường dẫn gốc 'assets/'
        popupBanner.style.backgroundImage = "url('assets/Popup_Captured.png')";
        popupBanner.style.display = "block";
        popupBanner.style.transform = "translate(-50%, -50%) scale(1)";
        popupBanner.style.zIndex = "999";

        // 2. Xuất hiện quả cầu Ball Open (Ưu tiên 2 - z-index 850)
        if (ball) {
            // 🎯 ĐÃ FIX: Đưa về đường dẫn gốc 'assets/'
            ball.style.backgroundImage = "url('assets/VFX_Ball_Open.png')";
            ball.style.display = "block";
            ball.style.zIndex = "850";
        }

        // 3. Ngay khi Ball Open xuất hiện -> Tiến hành Fade out thẻ tên (Ưu tiên 4 - z-700) và quái (Ưu tiên 5 - z-600)
        tag.style.zIndex = "700";
        tag.style.opacity = "0"; 
        mob.style.zIndex = "600";
        mob.style.opacity = "0";
        mob.style.transform = "scale(0)";

        // 4. Đúng 0.2s (200ms) sau, tắt quả cầu Open đi, hiển thị quả cầu Close (Ưu tiên 3 - z-index 840)
        setTimeout(() => {
            if (ball) {
                // 🎯 ĐÃ FIX: Đưa về đường dẫn gốc 'assets/'
                ball.style.backgroundImage = "url('assets/VFX_Ball_Close.png')";
                ball.style.zIndex = "840";
            }
            
            // Chờ người chơi ngắm nghía chiến công rồi sang turn mới
            setTimeout(() => {
                let isFirstTime = gameState.captured[currentMob.ID] === 0;
                gameState.captured[currentMob.ID] += 1;
                if (!isFirstTime) {
                    gameState.coins += (parseInt(currentMob.Stars) * 10);
                    const coinDisplay = document.getElementById('user-coins');
                    if (coinDisplay) coinDisplay.innerText = gameState.coins;
                }
                saveGameLocal(); 
                nextBattleTurn();
            }, 1200);
        }, 200);

    } else {
        // ==========================================
        // 🔴 TRƯỜNG HỢP SAI: MISSED FLOW
        // ==========================================
        // 1. Hiện popup Missed (Ưu tiên 1 - z-index 999)
        // 🎯 ĐÃ FIX: Đưa về đường dẫn gốc 'assets/'
        popupBanner.style.backgroundImage = "url('assets/Popup_Missed.png')";
        popupBanner.style.display = "block";
        popupBanner.style.transform = "translate(-50%, -50%) scale(1)";
        popupBanner.style.zIndex = "999";

        // 2. Xuất hiện anim fbf vfx_smoke (Ưu tiên 2 - z-index 750)
        if (smoke) {
            smoke.style.display = "block";
            smoke.classList.add('play-smoke');
        }

        // 3. Thẻ tên Fade out mất dạng (Ưu tiên 3 - z-index 700)
        tag.style.zIndex = "700";
        tag.style.opacity = "0";

        // 4. Pokemon diễn cảnh chạy bay thẳng ra cạnh trái màn hình (Ưu tiên 4 - z-index 600)
        mob.style.zIndex = "600";
        mob.style.transform = "translateX(-1200px) scale(0.5)";
        mob.style.opacity = "0";

        // Chờ diễn hoạt chạy trốn kết thúc rồi đổi turn
        setTimeout(() => {
            nextBattleTurn();
        }, 1500);
    }
}
