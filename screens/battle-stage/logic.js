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
        // Hết năng lượng -> Tắt hoàn toàn quái vật và hiển thị cảnh báo
        mobSprite.style.display = "none";
        mobTag.style.display = "none";
        document.getElementById('question-text').innerText = "You're out of energy! Please wait for admin refill or come back tomorrow to rest!";
        document.querySelector('.answers-zone').style.display = "none"; // Khóa mồm 3 nút đáp án
        return; // Ép dừng toàn bộ hàm, không gen quái hay câu hỏi mới nữa
    }

    // Nếu còn năng lượng -> Mở lại 3 nút đáp án (lỡ như trước đó bị khóa)
    document.querySelector('.answers-zone').style.display = "flex";

    // Tiếp tục đổ xúc xắc quái vật
    let randStar = Math.random() * 100;
    let stars = 1;
    if (randStar < 40) stars = 1;
    else if (randStar < 70) stars = 2;
    else if (randStar < 88) stars = 3;
    else if (randStar < 97) stars = 4;
    else stars = 5;

    let isShinyRoll = Math.random() < 0.01; 

    let pool = globalMobList.filter(m => parseInt(m.Stars) === stars);
    if (pool.length === 0) pool = globalMobList;

    let shinyPool = pool.filter(m => /[a-zA-Z]$/.test(m.ID));
    let normalPool = pool.filter(m => /^\d+\.\d+$/.test(m.ID));

    if (isShinyRoll && shinyPool.length > 0) {
        currentMob = shinyPool[Math.floor(Math.random() * shinyPool.length)];
        triggerShinyVFX(); 
    } else {
        currentMob = normalPool.length > 0 ? normalPool[Math.floor(Math.random() * normalPool.length)] : pool[Math.floor(Math.random() * pool.length)];
    }

    mobSprite.style.backgroundImage = `url('${currentMob.Image}')`;
    mobTag.style.backgroundImage = `url('assets/Nametag_lv${stars}.png')`;
    document.getElementById('mob-name-text').innerText = currentMob.Name;
    document.getElementById('player-sprite').style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Back.png')`;

    let qPool = globalQuestionList.filter(q => parseInt(q.Question_Stars) === stars);
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
    // 🎯 ĐÃ THÊM: Ngăn chặn click bậy bạ nếu hết năng lượng
    if (gameState.energy <= 0) return;

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
        
        // 🎯 GỌI HÀM TRỪ NĂNG LƯỢNG NGAY KHI VỪA ĐÁP TRÚNG (+ Tự auto Save)
        consumeEnergy();

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
                let isFirstTime = gameState.captured[currentMob.ID] === 0;
                gameState.captured[currentMob.ID] += 1;
                
                // Trả xu (+ Save ngầm nếu có thay đổi)
                if (!isFirstTime) {
                    gameState.coins += (parseInt(currentMob.Stars) * 10);
                    const coinDisplay = document.getElementById('user-coins');
                    if (coinDisplay) coinDisplay.innerText = gameState.coins;
                    saveGameToSheet(); // Trúng quái trùng thì up xu lên mây
                }

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
            // 🎯 LƯU DỰ PHÒNG: Dù xịt không bắt được nhưng cũng ráng đẩy cái túi đồ lên Cloud lưu giữ hiện trường
            if (typeof saveGameToSheet === 'function') { saveGameToSheet(); }
            nextBattleTurn();
        }, 1500);
    }
}
