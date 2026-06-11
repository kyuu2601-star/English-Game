// ==========================================================================
// 🏡 MÔ-ĐUN LOGIC HOÀN CHỈNH: KHU VƯỜN QUÁI VẬT (MON-GARDEN SYSTEM)
// ==========================================================================

// Quản lý các bộ đếm thời gian và vòng lặp Game Loop toàn cục của màn hình
let gardenAnimationFrameId = null;
let gardenIntervalTimers = [];

// 🎯 TRẠNG THÁI SCALE MÀN HÌNH (Rất quan trọng để UI thu phóng vừa màn hình)
let currentGardenScale = 1;

// Trạng thái Nhân vật chính (Player State)
let gardenPlayerState = {
    x: 2000, 
    y: 2000,
    width: 132, 
    height: 200, 
    speed: 6.5,  
    facingX: 1,      
    viewDirection: 'down', 
    isMoving: false,
    lastMoveTime: Date.now()
};

// Trạng thái Cần gạt ảo (Virtual Joystick State)
let gardenJoystickState = {
    isHolding: false,
    startX: 0,
    startY: 0,
    angle: 0,
    distance: 0
};

// Quản lý mảng lưu vết "Dấu Chân Quá Khứ" để chạy hàng dọc rồng rắn
let playerMovementTrailQueue = [];

// Quản lý bộ dữ liệu Quái vật chạy trong vườn
let activeGardenMonsInstances = []; 
let selectedVanguardSlotsArray = [null, null, null, null, null]; 

// Trạng thái Whistle Cooldown & Duration (🎯 ĐÃ SỬA CÚ PHÁP ĐÚNG CHUẨN OBJECT)
let whistleSystemState = {
    isActiveActive: false,
    isCooldownPhase: false,
    durationTimer: null,
    cooldownTimer: null
};

// Trạng thái phân trang của Bảng chọn Mon Grid 6x6 Popup
let selectorPopupCurrentPage = 0;
const SELECTOR_GRID_ITEMS_PER_PAGE = 36; 

// ==========================================================================
// 🎯 TRẠNG THÁI "XÁCH QUÁI" (DRAG & DROP ENGINE)
// ==========================================================================
let currentHeldMonInstance = null; 
let holdPointerOffset = { x: 0, y: 0 }; 

// ==========================================================================
// 🚀 HÀM KHỞI CHẠY CHÍNH (KHI MÀN HÌNH ĐƯỢC LOAD)
// ==========================================================================
function initGardenLogic() {
    cleanUpGardenEngineLeaks();

    const playerEl = document.getElementById('garden-player');
    const viewportEl = document.getElementById('garden-viewport');
    if (!playerEl || !viewportEl) return;

    playerEl.style.width = `${gardenPlayerState.width}px`;
    playerEl.style.height = `${gardenPlayerState.height}px`;
    
    updatePlayerSpriteAsset();

    // 🎯 GỌI HÀM CÂN BẰNG TỶ LỆ MÀN HÌNH VÀ GẮN SỰ KIỆN KHI RESIZE
    fitGardenToScreen();
    window.addEventListener('resize', fitGardenToScreen);

    viewportEl.scrollLeft = gardenPlayerState.x - 1920 / 2 + gardenPlayerState.width / 2;
    viewportEl.scrollTop = gardenPlayerState.y - 1080 / 2 + gardenPlayerState.height / 2;

    activateVirtualJoystickEngine();
    activateWhistleButtonCore();
    setupScreenLevelDragDropEngine(); 
    spawnAllMonsFromUserSheet();
    runGardenGameTickLoop();
}

// HÀM TỰ ĐỘNG THU PHÓNG KHUNG GAME ĐỂ VỪA KHÍT MỌI THIẾT BỊ
function fitGardenToScreen() {
    const container = document.querySelector('.garden-container-1080p');
    if (!container) return;
    
    currentGardenScale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    container.style.transform = `translate(-50%, -50%) scale(${currentGardenScale})`;
}

// ==========================================================================
// 🕹️ THUẬT TOÁN ĐIỀU KHIỂN CẦN GẠT JOYSTICK (ĐÃ CHUẨN HÓA TỌA ĐỘ SCALE)
// ==========================================================================
function activateVirtualJoystickEngine() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    if (!base || !stick) return;

    const startGrab = (e) => {
        if (document.getElementById('garden-mon-selector').style.display === "flex") return;
        gardenJoystickState.isHolding = true;
        const rect = base.getBoundingClientRect();
        gardenJoystickState.startX = rect.left + rect.width / 2;
        gardenJoystickState.startY = rect.top + rect.height / 2;
        processDrag(e);
    };

    const processDrag = (e) => {
        if (!gardenJoystickState.isHolding) return;
        const pageX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
        const pageY = e.pageY || (e.touches ? e.touches[0].pageY : 0);

        let dx = (pageX - gardenJoystickState.startX) / currentGardenScale;
        let dy = (pageY - gardenJoystickState.startY) / currentGardenScale;
        
        let dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);

        if (dist > 50) dist = 50; 

        gardenJoystickState.angle = angle;
        gardenJoystickState.distance = dist;

        stick.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
    };

    const releaseStick = () => {
        gardenJoystickState.isHolding = false;
        gardenJoystickState.distance = 0;
        stick.style.transform = "translate(0px, 0px)";
    };

    base.addEventListener('mousedown', startGrab);
    window.addEventListener('mousemove', processDrag);
    window.addEventListener('mouseup', releaseStick);

    base.addEventListener('touchstart', startGrab, { passive: true });
    window.addEventListener('touchmove', processDrag, { passive: false });
    window.addEventListener('touchend', releaseStick, { passive: true });
}

function updatePlayerSpriteAsset() {
    const playerEl = document.getElementById('garden-player');
    if (!playerEl) return;

    let genderTag = (gameState.gender === 'female') ? 'Female' : 'Male';
    let directionTag = (gardenPlayerState.viewDirection === 'up') ? 'Back' : 'Main';
    
    playerEl.style.backgroundImage = `url('assets/Player_${genderTag}_${directionTag}.png')`;
}

// ==========================================================================
// 🧬 ENGINE THẢ QUÁI VÀ QUẢN LÝ HÀNH VI (ĐI CỰC CHẬM 10PX/S + FIXED ĐẶC BIỆT CHỮ E)
// ==========================================================================
function spawnAllMonsFromUserSheet() {
    const mapContainer = document.getElementById('garden-map');
    if (!mapContainer) return;

    const existingMons = mapContainer.querySelectorAll('.garden-mon-pet');
    existingMons.forEach(m => m.remove());
    activeGardenMonsInstances = [];

    if (!globalMobList || globalMobList.length === 0) return;

    globalMobList.forEach(mob => {
        const catchCount = gameState.captured[mob.ID] || 0;
        if (catchCount <= 0) return; 

        let calculatedSize = 150 + (catchCount - 1) * 5;
        if (calculatedSize > 350) calculatedSize = 350;

        let isSpecialCodeE = mob.ID.toString().toUpperCase().startsWith('E');

        const petEl = document.createElement('div');
        petEl.className = "garden-mon-pet";
        petEl.id = `garden-pet-id-${mob.ID}`;
        petEl.style.width = `${calculatedSize}px`;
        petEl.style.height = `${calculatedSize}px`;

        const graphicCore = document.createElement('div');
        graphicCore.className = "mon-graphic-core";
        graphicCore.style.backgroundImage = `url('${mob.Image}')`;

        if (isSpecialCodeE) {
            graphicCore.classList.add('mon-p-stable');
        } else {
            graphicCore.classList.add('mon-moving-tilt');
        }

        petEl.appendChild(graphicCore);

        let spawnX, spawnY;
        if (isSpecialCodeE) {
            spawnX = 1850 + Math.random() * 300;
            spawnY = 1850 + Math.random() * 300;
        } else {
            spawnX = 1100 + Math.random() * 1800;
            spawnY = 1100 + Math.random() * 1800;
        }
        
        petEl.style.left = `${spawnX}px`;
        petEl.style.top = `${spawnY}px`;

        mapContainer.appendChild(petEl);

        let monObject = {
            id: mob.ID.toString(),
            element: petEl,
            graphicElement: graphicCore,
            size: calculatedSize,
            isCodeE: isSpecialCodeE,
            currentX: spawnX,
            currentY: spawnY,
            isBehavingIdle: false,
            isFollowerMode: false,
            followerIndex: -1
        };

        petEl.addEventListener('mousedown', (e) => startHoldingMonRoutine(e, monObject));
        petEl.addEventListener('touchstart', (e) => startHoldingMonRoutine(e, monObject), { passive: false });

        activeGardenMonsInstances.push(monObject);
    });

    const monBehaviorInterval = setInterval(() => {
        activeGardenMonsInstances.forEach(mon => {
            if (mon.isCodeE || mon.isFollowerMode || mon.element.dataset.heldMode === "true") return;

            let diceRoll = Math.random() * 100;

            if (diceRoll < 25) {
                mon.isBehavingIdle = true;
                mon.element.style.transition = "none"; 
                mon.graphicElement.classList.remove('mon-moving-tilt'); 

                const oldBubble = mon.element.querySelector('.garden-emoji-bubble');
                if (oldBubble) oldBubble.remove();

                const emojiPool = ['❤️', '😊', '✨', '💤', '🎵', '⭐', '💡', '🔥'];
                const randomEmoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];

                const bubbleEl = document.createElement('div');
                bubbleEl.className = "garden-emoji-bubble";
                bubbleEl.innerText = randomEmoji;
                
                bubbleEl.style.position = "absolute";
                bubbleEl.style.width = "50px";   
                bubbleEl.style.height = "50px";  
                bubbleEl.style.fontSize = "18px"; 
                bubbleEl.style.transform = "scale(1) !important"; 
                bubbleEl.style.transformOrigin = "bottom center";

                // 🎯 CĂN GIỮA TUYỆT ĐỐI NGAY TRÊN ĐẦU QUÁI VẬT
                bubbleEl.style.top = "-60px"; // Đẩy hẳn lên trên đầu quái một khoảng vừa vặn
                bubbleEl.style.left = "50%";  // Đẩy góc trái bong bóng ra chính giữa tâm con quái
                bubbleEl.style.transform = "translateX(-50%) scale(1) !important"; // Thêm translateX(-50%) để giật ngược cái bong bóng lại chính giữa rốn quái
                bubbleEl.style.right = "auto";

                mon.element.appendChild(bubbleEl);

                setTimeout(() => {
                    if (bubbleEl.parentNode) bubbleEl.remove();
                }, 2000);

            } else {
                mon.isBehavingIdle = false;
                mon.element.style.transition = "left 5s linear, top 5s linear";
                mon.graphicElement.classList.add('mon-moving-tilt');

                let randomRadius = Math.random() * 50; 
                let randomAngle = Math.random() * Math.PI * 2;
                
                let targetX = mon.currentX + Math.cos(randomAngle) * randomRadius;
                let targetY = mon.currentY + Math.sin(randomAngle) * randomRadius;

                if(targetX < 100) targetX = 100;
                if(targetX > 3900) targetX = 3900;
                if(targetY < 100) targetY = 100;
                if(targetY > 3900) targetY = 3900;

                let directionSign = targetX > mon.currentX ? 1 : -1;
                mon.graphicElement.style.transform = `scaleX(${directionSign})`;

                mon.element.style.left = `${targetX}px`;
                mon.element.style.top = `${targetY}px`;

                mon.currentX = targetX;
                mon.currentY = targetY;
            }
        });
    }, 5000);

    gardenIntervalTimers.push(monBehaviorInterval);
}

// ==========================================================================
// ✋ ENGINE: SCREEN-LEVEL DRAG & DROP (ĐÃ ĐƯỢC CHUẨN HÓA THEO SCALE)
// ==========================================================================
function startHoldingMonRoutine(e, monObj) {
    if (currentHeldMonInstance || monObj.isFollowerMode) return; 
    e.preventDefault(); 
    
    currentHeldMonInstance = monObj;
    monObj.element.dataset.heldMode = "true";

    const petRect = monObj.element.getBoundingClientRect();
    const pageX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    const pageY = e.pageY || (e.touches ? e.touches[0].pageY : 0);

    holdPointerOffset.x = (pageX - petRect.left) / currentGardenScale;
    holdPointerOffset.y = (pageY - petRect.top) / currentGardenScale;

    const originX = (holdPointerOffset.x / (petRect.width / currentGardenScale)) * 100;
    const originY = (holdPointerOffset.y / (petRect.height / currentGardenScale)) * 100;

    monObj.graphicElement.style.transformOrigin = `${originX}% ${originY}%`;
    monObj.element.classList.add('is-being-held');
    gardenJoystickState.isHolding = false;
}

function setupScreenLevelDragDropEngine() {
    const viewport = document.getElementById('garden-viewport');
    const container = document.querySelector('.garden-container-1080p');
    
    function onGlobalMouseMoveRoutine(e) {
        if (!currentHeldMonInstance || !document.getElementById('garden-player')) return;
        e.preventDefault();

        const pageX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
        const pageY = e.pageY || (e.touches ? e.touches[0].pageY : 0);

        const containerRect = container.getBoundingClientRect();

        let logicalPointerX = (pageX - containerRect.left) / currentGardenScale;
        let logicalPointerY = (pageY - containerRect.top) / currentGardenScale;

        let newMapX = logicalPointerX + viewport.scrollLeft - holdPointerOffset.x;
        let newMapY = logicalPointerY + viewport.scrollTop - holdPointerOffset.y;

        if (newMapX < 50) newMapX = 50;
        if (newMapX > 3950) newMapX = 3950;
        if (newMapY < 50) newMapY = 50;
        if (newMapY > 3950) newMapY = 3950;

        currentHeldMonInstance.element.style.left = `${newMapX}px`;
        currentHeldMonInstance.element.style.top = `${newMapY}px`;
        currentHeldMonInstance.currentX = newMapX;
        currentHeldMonInstance.currentY = newMapY;
    }

    function onGlobalMouseUpRoutine(e) {
        if (!currentHeldMonInstance || !document.getElementById('garden-player')) return;
        e.preventDefault();
        
        currentHeldMonInstance.element.classList.remove('is-being-held');
        currentHeldMonInstance.element.dataset.heldMode = "false";
        currentHeldMonInstance = null;
    }

    window.removeEventListener('mousemove', onGlobalMouseMoveRoutine);
    window.removeEventListener('mouseup', onGlobalMouseUpRoutine);
    window.removeEventListener('touchmove', onGlobalMouseMoveRoutine);
    window.removeEventListener('touchend', onGlobalMouseUpRoutine);

    window.addEventListener('mousemove', onGlobalMouseMoveRoutine);
    window.addEventListener('mouseup', onGlobalMouseUpRoutine);
    window.addEventListener('touchmove', onGlobalMouseMoveRoutine, { passive: false });
    window.addEventListener('touchend', onGlobalMouseUpRoutine, { passive: false });
    
    window._gardenMouseDragRef = onGlobalMouseMoveRoutine;
    window._gardenMouseDropRef = onGlobalMouseUpRoutine;
}

// ==========================================================================
// ⏰ GAME TICK ENGINE (60FPS FRAME LOOP)
// ==========================================================================
function runGardenGameTickLoop() {
    const playerEl = document.getElementById('garden-player');
    const viewportEl = document.getElementById('garden-viewport');

    function executeTickFrame() {
        if (!document.getElementById('garden-player')) return; 

        let rightNow = Date.now();

        if (gardenJoystickState.isHolding && gardenJoystickState.distance > 0) {
            gardenPlayerState.isMoving = true;
            gardenPlayerState.lastMoveTime = rightNow;

            playerEl.classList.remove('player-idle-breath');
            playerEl.classList.add('player-walking');

            let intensity = Math.min(gardenJoystickState.distance / 50, 1);
            let vx = Math.cos(gardenJoystickState.angle) * gardenPlayerState.speed * intensity;
            let vy = Math.sin(gardenJoystickState.angle) * gardenPlayerState.speed * intensity;

            gardenPlayerState.x += vx;
            gardenPlayerState.y += vy;

            if (gardenJoystickState.angle < -Math.PI / 4 && gardenJoystickState.angle > -3 * Math.PI / 4) {
                if (gardenPlayerState.viewDirection !== 'up') {
                    gardenPlayerState.viewDirection = 'up';
                    updatePlayerSpriteAsset();
                }
            } else {
                if (gardenPlayerState.viewDirection !== 'down') {
                    gardenPlayerState.viewDirection = 'down';
                    updatePlayerSpriteAsset();
                }
            }

            if (vx > 0.2) gardenPlayerState.facingX = 1;
            else if (vx < -0.2) gardenPlayerState.facingX = -1;

            if (gardenPlayerState.x < 50) gardenPlayerState.x = 50;
            if (gardenPlayerState.x > 3950 - gardenPlayerState.width) gardenPlayerState.x = 3950 - gardenPlayerState.width;
            if (gardenPlayerState.y < 50) gardenPlayerState.y = 50;
            if (gardenPlayerState.y > 3950 - gardenPlayerState.height) gardenPlayerState.y = 3950 - gardenPlayerState.height;

            playerEl.style.left = `${gardenPlayerState.x}px`;
            playerEl.style.top = `${gardenPlayerState.y}px`;
            playerEl.style.transform = `scaleX(${gardenPlayerState.facingX})`;

        } else {
            gardenPlayerState.isMoving = false;
            playerEl.classList.remove('player-walking');

            if (rightNow - gardenPlayerState.lastMoveTime > 5000) {
                playerEl.classList.add('player-idle-breath');
            }
        }

        playerMovementTrailQueue.push({
            x: gardenPlayerState.x + gardenPlayerState.width / 2,
            y: gardenPlayerState.y + gardenPlayerState.height / 2,
            facingX: gardenPlayerState.facingX
        });

        if (playerMovementTrailQueue.length > 120) {
            playerMovementTrailQueue.shift();
        }

        if (whistleSystemState.isActiveActive) {
            selectedVanguardSlotsArray.forEach((monId, index) => {
                if (!monId) return;
                const targetMon = activeGardenMonsInstances.find(m => m.id === monId.toString());
                if (!targetMon) return;

                let trailDelayIndex = playerMovementTrailQueue.length - 1 - ((index + 1) * 16);
                if (trailDelayIndex < 0) trailDelayIndex = 0; 

                let historicStamp = playerMovementTrailQueue[trailDelayIndex];
                if (historicStamp) {
                    targetMon.element.style.transition = "none"; 
                    targetMon.graphicElement.classList.add('mon-moving-tilt'); 

                    let nextX = historicStamp.x - targetMon.size / 2;
                    let nextY = historicStamp.y - targetMon.size / 2;

                    targetMon.element.style.left = `${nextX}px`;
                    targetMon.element.style.top = `${nextY}px`;
                    targetMon.graphicElement.style.transform = `scaleX(${historicStamp.facingX})`;
                    
                    targetMon.currentX = nextX;
                    targetMon.currentY = nextY;
                }
            });
        }

        viewportEl.scrollLeft = gardenPlayerState.x - 1920 / 2 + gardenPlayerState.width / 2;
        viewportEl.scrollTop = gardenPlayerState.y - 1080 / 2 + gardenPlayerState.height / 2;

        gardenAnimationFrameId = requestAnimationFrame(executeTickFrame);
    }
    gardenAnimationFrameId = requestAnimationFrame(executeTickFrame);
}

// ==========================================================================
// 🎺 HỆ THỐNG ĐIỀU HÀNH NÚT CÒI
// ==========================================================================
function activateWhistleButtonCore() {
    const whistleBtn = document.getElementById('btn-whistle-trigger');
    if (!whistleBtn) return;

    whistleBtn.onclick = () => {
        if (whistleSystemState.isActiveActive || whistleSystemState.isCooldownPhase) return;
        openWhistleSelectorModalPopup();
    };
}

function triggerWhistleVanguardSummon() {
    whistleSystemState.isActiveActive = true;
    
    const whistleBtn = document.getElementById('btn-whistle-trigger');
    const progressBar = document.getElementById('cooldown-progress-bar');
    const zoneBox = document.getElementById('btn-whistle-zone');

    if (whistleBtn) whistleBtn.disabled = true;
    if (zoneBox) zoneBox.classList.remove('on-cooldown');

    selectedVanguardSlotsArray.forEach((monId, idx) => {
        if (!monId) return;
        const targetMon = activeGardenMonsInstances.find(m => m.id === monId.toString());
        if (targetMon) {
            targetMon.isFollowerMode = true;
            targetMon.followerIndex = idx;
            
            const oldBubble = targetMon.element.querySelector('.garden-emoji-bubble');
            if (oldBubble) oldBubble.remove();
        }
    });

    let durationSecondsElapsed = 0;
    const durationTotalMs = 10000;
    const tickMs = 100;

    whistleSystemState.durationTimer = setInterval(() => {
        durationSecondsElapsed += tickMs;
        let percentageLeft = 1 - (durationSecondsElapsed / durationTotalMs);
        if (percentageLeft < 0) percentageLeft = 0;

        if (progressBar) {
            progressBar.style.strokeDashoffset = `${377 * (1 - percentageLeft)}`;
        }

        if (durationSecondsElapsed >= durationTotalMs) {
            clearInterval(whistleSystemState.durationTimer);
            triggerWhistleCooldownPhase();
        }
    }, tickMs);
}

function triggerWhistleCooldownPhase() {
    whistleSystemState.isActiveActive = false;
    whistleSystemState.isCooldownPhase = true;

    const progressBar = document.getElementById('cooldown-progress-bar');
    const zoneBox = document.getElementById('btn-whistle-zone');

    if (zoneBox) zoneBox.classList.add('on-cooldown'); 

    activeGardenMonsInstances.forEach(mon => {
        if (mon.isFollowerMode) {
            mon.isFollowerMode = false;
            mon.followerIndex = -1;
            mon.element.style.transition = "left 5s linear, top 5s linear";
        }
    });

    let cooldownSecondsElapsed = 0;
    const cooldownTotalMs = 2000;
    const tickMs = 100;

    whistleSystemState.cooldownTimer = setInterval(() => {
        cooldownSecondsElapsed += tickMs;
        let percentageCharged = cooldownSecondsElapsed / cooldownTotalMs;
        if (percentageCharged > 1) percentageCharged = 1;

        if (progressBar) {
            progressBar.style.strokeDashoffset = `${377 * percentageCharged}`;
        }

        if (cooldownSecondsElapsed >= cooldownTotalMs) {
            clearInterval(whistleSystemState.cooldownTimer);
            
            whistleSystemState.isCooldownPhase = false;
            
            const whistleBtn = document.getElementById('btn-whistle-trigger');
            if (whistleBtn) whistleBtn.disabled = false;
            if (zoneBox) zoneBox.classList.remove('on-cooldown');
            if (progressBar) progressBar.style.strokeDashoffset = "0";
        }
    }, tickMs);
}

// ==========================================================================
// 📋 LOGIC ĐIỀU PHỐI POPUP BAN BÈ (🎯 ĐÃ THÊM TƯƠNG TÁC ĐÓNG POPUP)
// ==========================================================================
function openWhistleSelectorModalPopup() {
    const modal = document.getElementById('garden-mon-selector');
    if (!modal) return;

    selectedVanguardSlotsArray = [null, null, null, null, null];
    selectorPopupCurrentPage = 0;

    renderWhistleGridAndSlots();
    modal.style.display = "flex";

    // 🎯 THÊM: Click ra vùng trống bên ngoài nền mờ để tự tắt bảng chọn
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeMonSelectorModal();
        }
    };
}

function renderWhistleGridAndSlots() {
    const gridContainer = document.getElementById('garden-selector-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = "";

    let capturedListFilter = globalMobList.filter(mob => (gameState.captured[mob.ID] || 0) > 0);
    let availableMonsForGrid = capturedListFilter.filter(mob => !selectedVanguardSlotsArray.includes(mob.ID.toString()));

    let startIdx = selectorPopupCurrentPage * SELECTOR_GRID_ITEMS_PER_PAGE;
    let endIdx = startIdx + SELECTOR_GRID_ITEMS_PER_PAGE;
    let pageItems = availableMonsForGrid.slice(startIdx, endIdx);

    for (let i = 0; i < SELECTOR_GRID_ITEMS_PER_PAGE; i++) {
        const cellBox = document.createElement('div');
        cellBox.className = "garden-grid-cell-item";

        if (pageItems[i]) {
            let currentMobData = pageItems[i];
            let countTotal = gameState.captured[currentMobData.ID] || 0;

            cellBox.innerHTML = `
                <img src="${currentMobData.Image}">
                <span class="mon-count-badge">x${countTotal}</span>
            `;
            
            cellBox.onclick = () => {
                selectMonToVanguardSlot(currentMobData.ID.toString());
            };
        } else {
            cellBox.style.background = "rgba(0,0,0,0.03)";
            cellBox.style.borderColor = "rgba(0,0,0,0.1)";
            cellBox.style.cursor = "default";
        }
        gridContainer.appendChild(cellBox);
    }

    for (let s = 0; s < 5; s++) {
        const slotBox = document.getElementById(`slot-${s}`);
        if (!slotBox) continue;

        slotBox.innerHTML = "";
        slotBox.classList.remove('has-mon');

        let activeSlotMonId = selectedVanguardSlotsArray[s];
        if (activeSlotMonId) {
            let mobData = globalMobList.find(m => m.ID.toString() === activeSlotMonId.toString());
            if (mobData) {
                slotBox.classList.add('has-mon');
                slotBox.innerHTML = `<img src="${mobData.Image}">`;
            }
        }
    }

    document.getElementById('btn-selector-prev').style.opacity = (selectorPopupCurrentPage === 0) ? "0.3" : "1";
    let totalNeededPages = Math.ceil(availableMonsForGrid.length / SELECTOR_GRID_ITEMS_PER_PAGE);
    document.getElementById('btn-selector-next').style.opacity = (selectorPopupCurrentPage >= totalNeededPages - 1 || totalNeededPages <= 1) ? "0.3" : "1";
}

function changeSelectorPage(directionSign) {
    let capturedListFilter = globalMobList.filter(mob => (gameState.captured[mob.ID] || 0) > 0);
    let availableMonsForGrid = capturedListFilter.filter(mob => !selectedVanguardSlotsArray.includes(mob.ID.toString()));
    let totalNeededPages = Math.ceil(availableMonsForGrid.length / SELECTOR_GRID_ITEMS_PER_PAGE);

    let targetPage = selectorPopupCurrentPage + directionSign;
    if (targetPage >= 0 && targetPage < totalNeededPages) {
        selectorPopupCurrentPage = targetPage;
        renderWhistleGridAndSlots();
    }
}

function selectMonToVanguardSlot(monIdString) {
    let emptySlotIndex = selectedVanguardSlotsArray.findIndex(slot => slot === null);
    
    if (emptySlotIndex === -1) {
        alert("Chỉ được mang theo tối đa 5 con vệ sĩ đi theo sau đuôi thôi nha học sinh!");
        return;
    }

    selectedVanguardSlotsArray[emptySlotIndex] = monIdString.toString();
    renderWhistleGridAndSlots();
}

function deselectMonFromSlot(slotIndex) {
    if (selectedVanguardSlotsArray[slotIndex] === null) return;
    selectedVanguardSlotsArray[slotIndex] = null;
    renderWhistleGridAndSlots();
}

function confirmWhistleSelection() {
    let totalSelected = selectedVanguardSlotsArray.filter(slot => slot !== null).length;
    
    if (totalSelected === 0) {
        alert("Hãy chọn ít nhất 1 con quái vật từ lưới Grid để thổi còi gọi tụi nó theo nha!");
        return;
    }

    document.getElementById('garden-mon-selector').style.display = "none";
    triggerWhistleVanguardSummon();
}

// 🎯 THÊM: Hàm xử lý đóng ẩn thẻ div Modal Popup
function closeMonSelectorModal() {
    const modal = document.getElementById('garden-mon-selector');
    if (modal) modal.style.display = "none";
}

// ==========================================================================
// 🗑️ DỌN DẸP BỘ NHỚ KHI CHUYỂN MÀN HÌNH
// ==========================================================================
function cleanUpGardenEngineLeaks() {
    window.removeEventListener('resize', fitGardenToScreen); 
    
    if (gardenAnimationFrameId) {
        cancelAnimationFrame(gardenAnimationFrameId);
        gardenAnimationFrameId = null;
    }
    gardenIntervalTimers.forEach(clearInterval);
    gardenIntervalTimers.forEach(clearTimeout);
    gardenIntervalTimers = [];

    if (whistleSystemState.durationTimer) clearInterval(whistleSystemState.durationTimer);
    if (whistleSystemState.cooldownTimer) clearInterval(whistleSystemState.cooldownTimer);

    if (window._gardenMouseDragRef) {
        window.removeEventListener('mousemove', window._gardenMouseDragRef);
        window.removeEventListener('touchmove', window._gardenMouseDragRef);
    }
    if (window._gardenMouseDropRef) {
        window.removeEventListener('mouseup', window._gardenMouseDropRef);
        window.removeEventListener('touchmove', window._gardenMouseDropRef);
    }

    currentHeldMonInstance = null;
    whistleSystemState.isActiveActive = false;
    whistleSystemState.isCooldownPhase = false;
    playerMovementTrailQueue = [];
}

window.removeEventListener('beforeunload', cleanUpGardenEngineLeaks);
window.addEventListener('beforeunload', cleanUpGardenEngineLeaks);
