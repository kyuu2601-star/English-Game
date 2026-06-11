// ==========================================================================
// 🏡 MÔ-ĐUN LOGIC HOÀN CHỈNH: KHU VƯỜN QUÁI VẬT (MON-GARDEN SYSTEM)
// ==========================================================================

// Quản lý các bộ đếm thời gian và vòng lặp Game Loop toàn cục của màn hình
let gardenAnimationFrameId = null;
let gardenIntervalTimers = [];

// Trạng thái Nhân vật chính (Player State)
let gardenPlayerState = {
    x: 2000, // Xuất phát ngay chính giữa map 4000x4000px
    y: 2000,
    width: 66,
    height: 100,
    speed: 6.5,
    facingX: 1,      // 1: Phải, -1: Trái
    viewDirection: 'down', // 'down' hoặc 'up' (để đổi Sprite Main/Back)
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
let activeGardenMonsInstances = []; // Chứa danh sách Object cấu trúc runtime của từng con Mon
let selectedVanguardSlotsArray = [null, null, null, null, null]; // Chứa ID của 5 con vệ sĩ bám đuôi

// Trạng thái Whistle Cooldown & Duration (Vòng tua hồi còi)
let whistleSystemState = {
    isActiveActive: false,
    isCooldownPhase: false,
    durationTimer: null,
    cooldownTimer: null
};

// Trạng thái phân trang của Bảng chọn Mon Grid 6x6 Popup
let selectorPopupCurrentPage = 0;
const SELECTOR_GRID_ITEMS_PER_PAGE = 36; // Lưới 6x6

// ==========================================================================
// 🚀 HÀM KHỞI CHẠY CHÍNH (KHI MÀN HÌNH ĐƯỢC LOAD)
// ==========================================================================
function initGardenLogic() {
    // 1. Dọn dẹp sạch sẽ rác cũ chống đứng hình tràn RAM
    cleanUpGardenEngineLeaks();

    const playerEl = document.getElementById('garden-player');
    const viewportEl = document.getElementById('garden-viewport');
    if (!playerEl || !viewportEl) return;

    // 2. Thiết lập ảnh nhân vật ban đầu dựa theo giới tính từ Core gameState
    updatePlayerSpriteAsset();

    // 3. Đặt tâm camera ban đầu bám khít vào người chơi ở giữa rốn bản đồ
    viewportEl.scrollLeft = gardenPlayerState.x - 1920 / 2 + gardenPlayerState.width / 2;
    viewportEl.scrollTop = gardenPlayerState.y - 1080 / 2 + gardenPlayerState.height / 2;

    // 4. KÍCH HOẠT HỆ THỐNG ĐIỀU KHIỂN CẦN GẠT (JOYSTICK ENGINE)
    activateVirtualJoystickEngine();

    // 5. KÍCH HOẠT SỰ KIỆN NÚT CÒI WHISTLE
    activateWhistleButtonCore();

    // 6. THẢ QUÁI VẬT RA VƯỜN DỰA TRÊN DATA CỦA USER TRÊN SHEET
    spawnAllMonsFromUserSheet();

    // 7. KHỞI CHẠY KHUNG HÌNH CHỦ GAME TICK LOOP (60FPS)
    runGardenGameTickLoop();
}

// ==========================================================================
// 🕹️ THUẬT TOÁN ĐIỀU KHIỂN CẦN GẠT JOYSTICK & ĐỊNH VỊ GÓC NHÌN NHÂN VẬT
// ==========================================================================
function activateVirtualJoystickEngine() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    if (!base || !stick) return;

    const startGrab = (e) => {
        if (document.getElementById('garden-mon-selector').style.display === "flex") return;
        gardenJoystickState.isHolding = true;
        const pageX = e.pageX || e.touches[0].pageX;
        const pageY = e.pageY || e.touches[0].pageY;
        const rect = base.getBoundingClientRect();
        gardenJoystickState.startX = rect.left + rect.width / 2;
        gardenJoystickState.startY = rect.top + rect.height / 2;
        processDrag(e);
    };

    const processDrag = (e) => {
        if (!gardenJoystickState.isHolding) return;
        const pageX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
        const pageY = e.pageY || (e.touches ? e.touches[0].pageY : 0);

        let dx = pageX - gardenJoystickState.startX;
        let dy = pageY - gardenJoystickState.startY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);

        if (dist > 50) dist = 50; // Giới hạn biên độ trượt 50px

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
    
    // Nạp chính xác tên file ảnh từ danh sách asset của fen
    playerEl.style.backgroundImage = `url('assets/Player_${genderTag}_${directionTag}.png')`;
}

// ==========================================================================
// 🧬 ENGINE THẢ QUÁI VÀ QUẢN LÝ HÀNH VI 25% IDLE / 75% MOVE + MÃ P
// ==========================================================================
function spawnAllMonsFromUserSheet() {
    const mapContainer = document.getElementById('garden-map');
    if (!mapContainer) return;

    // Xóa sạch bóng dáng quái cũ (giữ lại player)
    const existingMons = mapContainer.querySelectorAll('.garden-mon-pet');
    existingMons.forEach(m => m.remove());
    activeGardenMonsInstances = [];

    if (!globalMobList || globalMobList.length === 0) return;

    globalMobList.forEach(mob => {
        const catchCount = gameState.captured[mob.ID] || 0;
        if (catchCount <= 0) return; // Không bắt được thì không cho xuất hiện

        // 📐 CÔNG THỨC SIZE VÀNG: Bắt 1 con = 50px, mỗi con tiếp theo +1px, chặn trần 200px
        let calculatedSize = 50 + (catchCount - 1);
        if (calculatedSize > 200) calculatedSize = 200;

        // Định dạng kiểm tra xem có phải Siêu thú cổ định "Mã P" hay không
        let isSpecialCodeP = mob.ID.toString().toUpperCase().includes('P');

        // Tạo thẻ bọc Mon vật lý ngoài
        const petEl = document.createElement('div');
        petEl.className = "garden-mon-pet";
        petEl.id = `garden-pet-id-${mob.ID}`;
        petEl.style.width = `${calculatedSize}px`;
        petEl.style.height = `${calculatedSize}px`;

        // Tạo bệ đồ họa hoạt ảnh bên trong
        const graphicCore = document.createElement('div');
        graphicCore.className = "mon-graphic-core";
        graphicCore.style.backgroundImage = `url('${mob.Image}')`;

        // Thiết lập hoạt ảnh ban đầu
        if (isSpecialCodeP) {
            graphicCore.classList.add('mon-p-stable');
        } else {
            graphicCore.classList.add('mon-moving-tilt');
        }

        petEl.appendChild(graphicCore);

        // 🎯 VỊ TRÍ XUẤT PHÁT: Thả ngẫu nhiên bó gọn đằng trong lòng 2 ô đất chính giữa (1000px đến 3000px)
        let spawnX = 1100 + Math.random() * 1800;
        let spawnY = 1100 + Math.random() * 1800;
        petEl.style.left = `${spawnX}px`;
        petEl.style.top = `${spawnY}px`;

        mapContainer.appendChild(petEl);

        // Đóng gói Object quản trị runtime của con Mon
        let monObject = {
            id: mob.ID.toString(),
            element: petEl,
            graphicElement: graphicCore,
            size: calculatedSize,
            isCodeP: isSpecialCodeP,
            currentX: spawnX,
            currentY: spawnY,
            isBehavingIdle: false,
            isFollowerMode: false,
            followerIndex: -1
        };

        activeGardenMonsInstances.push(monObject);
    });

    // KÍCH HOẠT TIMỆR ĐỊNH KỲ 5 GIÂY ĐỂ ĐỔ XÚC XẮC THAY ĐỔI HÀNH VI MON
    const monBehaviorInterval = setInterval(() => {
        activeGardenMonsInstances.forEach(mon => {
            if (mon.isCodeP || mon.isFollowerMode) return; // Mã P và Vệ sĩ miễn nhiễm lệnh này

            let diceRoll = Math.random() * 100;

            if (diceRoll < 25) {
                // 💤 TRÚNG 25% ANIM IDLE: Đứng khựng lại, nổ Bong bóng Emoji
                mon.isBehavingIdle = true;
                mon.element.style.transition = "none"; // Khóa di chuyển ngay lập tức
                mon.graphicElement.classList.remove('mon-moving-tilt'); // Tắt nghiêng lắc dạo mát

                // Kiểm tra gỡ bóng cũ nếu có
                const oldBubble = mon.element.querySelector('.garden-emoji-bubble');
                if (oldBubble) oldBubble.remove();

                // Tạo bong bóng chat 25px chứa emoji bất kỳ
                const emojiPool = ['❤️', '😊', '✨', '💤', '🎵', '⭐', '💡', '🔥'];
                const randomEmoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];

                const bubbleEl = document.createElement('div');
                bubbleEl.className = "garden-emoji-bubble";
                bubbleEl.innerText = randomEmoji;
                mon.element.appendChild(bubbleEl);

                // Sau 2 giây tự động dọn dẹp biến mất bong bóng chat
                setTimeout(() => {
                    if (bubbleEl.parentNode) bubbleEl.remove();
                }, 2000);

            } else {
                // 🏃 TRÚNG 75% DI CHUYỂN BÌNH THƯỜNG
                mon.isBehavingIdle = false;
                mon.element.style.transition = "left 4s ease-in-out, top 4s ease-in-out";
                mon.graphicElement.classList.add('mon-moving-tilt');

                // Chọn tọa độ dạo chơi tự do mới rộng khắp giang sơn 4000px
                let targetX = 100 + Math.random() * 3800;
                let targetY = 100 + Math.random() * 3800;

                // Lật mặt quái theo vector di chuyển ngang trục X
                let directionSign = targetX > mon.currentX ? 1 : -1;
                mon.graphicElement.style.transform = `scaleX(${directionSign})`;

                // Đẩy CSS lệnh cho trình duyệt tự lướt đi dạo mát
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
// ⏰ GAME TICK ENGINE (60FPS FRAME LOOP) - DI CHUYỂN & CAMERA FOLLOW CENTERING
// ==========================================================================
function runGardenGameTickLoop() {
    const playerEl = document.getElementById('garden-player');
    const viewportEl = document.getElementById('garden-viewport');

    function executeTickFrame() {
        if (!document.getElementById('garden-player')) return; // Ngắt đứng vòng lặp nếu thoát screen

        let rightNow = Date.now();

        // --- PHẦN 1: DI CHUYỂN NHÂN VẬT CHÍNH (JOYSTICK MATH) ---
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

            // Xử lý góc nhìn Sprite (Trước/Sau)
            // Đẩy cần gạt lên phía trên (Góc từ -0.25pi đến -0.75pi) -> Đổi góc sau lưng
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

            // Xử lý lật mặt ngang trục X dựa theo hướng đi
            if (vx > 0.2) gardenPlayerState.facingX = 1;
            else if (vx < -0.2) gardenPlayerState.facingX = -1;

            // Thiết lập chốt chặn kiên cố không cho nhân vật chạy lọt rãnh map 4000px
            if (gardenPlayerState.x < 50) gardenPlayerState.x = 50;
            if (gardenPlayerState.x > 3950 - gardenPlayerState.width) gardenPlayerState.x = 3950 - gardenPlayerState.width;
            if (gardenPlayerState.y < 50) gardenPlayerState.y = 50;
            if (gardenPlayerState.y > 3950 - gardenPlayerState.height) gardenPlayerState.y = 3950 - gardenPlayerState.height;

            // Áp trực tiếp tọa độ vào CSS vẽ nhân vật
            playerEl.style.left = `${gardenPlayerState.x}px`;
            playerEl.style.top = `${gardenPlayerState.y}px`;
            playerEl.style.transform = `scaleX(${gardenPlayerState.facingX})`;

        } else {
            // Trạng thái Đứng yên
            gardenPlayerState.isMoving = false;
            playerEl.classList.remove('player-walking');

            // Cứ đứng yên đủ 5 giây thì tự động kích hoạt nhịp thở Idle Breath
            if (rightNow - gardenPlayerState.lastMoveTime > 5000) {
                playerEl.classList.add('player-idle-breath');
            }
        }

        // --- PHẦN 2: LƯU VẾT "DẤU CHÂN" CHO ĐOÀN VỆ SĨ ---
        // Liên tục ghi nhận tọa độ tâm đứng hiện tại của nhân vật chính vào hàng đợi Queue
        playerMovementTrailQueue.push({
            x: gardenPlayerState.x + gardenPlayerState.width / 2,
            y: gardenPlayerState.y + gardenPlayerState.height / 2,
            facingX: gardenPlayerState.facingX
        });

        // Giới hạn độ dài mảng lưu vết vừa đủ cho 5 con vệ sĩ bám đuôi (Tối đa 100 khung hình quá khứ)
        if (playerMovementTrailQueue.length > 120) {
            playerMovementTrailQueue.shift();
        }

        // --- PHẦN 3: ĐIỀU PHỐI ĐOÀN VỆ SĨ CHẠY THEO HÀNG DỌC (SNAKE QUEUE FOLLOW) ---
        if (whistleSystemState.isActiveActive) {
            selectedVanguardSlotsArray.forEach((monId, index) => {
                if (!monId) return;
                const targetMon = activeGardenMonsInstances.find(m => m.id === monId.toString());
                if (!targetMon) return;

                // Tính toán độ trễ khung hình lùi về quá khứ cho từng con: Con số 1 trễ 16 frame, con số 2 trễ 32 frame...
                let trailDelayIndex = playerMovementTrailQueue.length - 1 - ((index + 1) * 16);
                if (trailDelayIndex < 0) trailDelayIndex = 0; // Phòng hờ lúc mới mở còi chưa đủ vết chân

                let historicStamp = playerMovementTrailQueue[trailDelayIndex];
                if (historicStamp) {
                    targetMon.element.style.transition = "none"; // Ngắt giải phóng hoàn toàn transition dạo mát
                    targetMon.graphicElement.classList.add('mon-moving-tilt'); // Ép nghiêng lắc chạy bộ

                    // Canh chỉnh tọa độ Mon bám sát gót theo tâm điểm quá khứ (Trừ đi tâm div để tránh lệch tâm)
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

        // --- PHẦN 4: CAMERA KHÓA TÂM THEO CHÂN NHÂN VẬT ---
        viewportEl.scrollLeft = gardenPlayerState.x - 1920 / 2 + gardenPlayerState.width / 2;
        viewportEl.scrollTop = gardenPlayerState.y - 1080 / 2 + gardenPlayerState.height / 2;

        gardenAnimationFrameId = requestAnimationFrame(executeTickFrame);
    }
    gardenAnimationFrameId = requestAnimationFrame(executeTickFrame);
}

// ==========================================================================
// 🎺 HỆ THỐNG ĐIỀU HÀNH NÚT CÒI (WHISTLE MATRIX CONTROL)
// ==========================================================================
function activateWhistleButtonCore() {
    const whistleBtn = document.getElementById('btn-whistle-trigger');
    if (!whistleBtn) return;

    whistleBtn.onclick = () => {
        if (whistleSystemState.isActiveActive || whistleSystemState.isCooldownPhase) return;
        // Bấm phát một -> Kích hoạt mở ngay Popup Form chọn Đội hình vệ sĩ
        openWhistleSelectorModalPopup();
    };
}

// Hàm kích nổ luồng xoay tua còi sau khi bấm nút Xác nhận đập từ Form xuống
function triggerWhistleVanguardSummon() {
    whistleSystemState.isActiveActive = true;
    
    const whistleBtn = document.getElementById('btn-whistle-trigger');
    const progressBar = document.getElementById('cooldown-progress-bar');
    const zoneBox = document.getElementById('btn-whistle-zone');

    if (whistleBtn) whistleBtn.disabled = true;
    if (zoneBox) zoneBox.classList.remove('on-cooldown');

    // Khóa trạng thái hoạt động AI tự do của 5 con Mon được chọn làm vệ sĩ hộ tống
    selectedVanguardSlotsArray.forEach((monId, idx) => {
        if (!monId) return;
        const targetMon = activeGardenMonsInstances.find(m => m.id === monId.toString());
        if (targetMon) {
            targetMon.isFollowerMode = true;
            targetMon.followerIndex = idx;
            
            // Gỡ sạch bong bóng chat cũ nếu tụi nó đang dở dang ăn idle idle
            const oldBubble = targetMon.element.querySelector('.garden-emoji-bubble');
            if (oldBubble) oldBubble.remove();
        }
    });

    // ⏱️ GIAI ĐOẠN 1: CHẠY HỘ TỐNG HÀNG DỌC TRONG ĐÚNG 10 GIÂY
    let durationSecondsElapsed = 0;
    const durationTotalMs = 10000;
    const tickMs = 100;

    whistleSystemState.durationTimer = setInterval(() => {
        durationSecondsElapsed += tickMs;
        let percentageLeft = 1 - (durationSecondsElapsed / durationTotalMs);
        if (percentageLeft < 0) percentageLeft = 0;

        // Đẩy thông số tính toán chu vi đường ống CSS SVG Circle (Stroke-dashoffset)
        if (progressBar) {
            progressBar.style.strokeDashoffset = `${377 * (1 - percentageLeft)}`;
        }

        if (durationSecondsElapsed >= durationTotalMs) {
            clearInterval(whistleSystemState.durationTimer);
            // Hết 10 giây -> Chuyển giao lập tức sang giai đoạn Hồi Chiêu (Cooldown)
            triggerWhistleCooldownPhase();
        }
    }, tickMs);
}

function triggerWhistleCooldownPhase() {
    whistleSystemState.isActiveActive = false;
    whistleSystemState.isCooldownPhase = true;

    const progressBar = document.getElementById('cooldown-progress-bar');
    const zoneBox = document.getElementById('btn-whistle-zone');

    if (zoneBox) zoneBox.classList.add('on-cooldown'); // Đổi vòng tròn SVG sang màu đỏ báo hồi chiêu

    // Trả tự do dứt điểm cho 5 con vệ sĩ quay trở lại chế độ dạo mát tự do bằng CSS Transition
    activeGardenMonsInstances.forEach(mon => {
        if (mon.isFollowerMode) {
            mon.isFollowerMode = false;
            mon.followerIndex = -1;
            mon.element.style.transition = "left 4s ease-in-out, top 4s ease-in-out";
        }
    });

    // ⏱️ GIAI ĐOẠN 2: HỒI CHIÊU PHẠM VI 2 GIÂY TIẾP THEO
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
            
            // HOÀN TẤT VÒNG XOAY TUA: Giải phóng nút bấm sáng đèn trở lại bình thường
            whistleSystemState.isCooldownPhase = false;
            
            const whistleBtn = document.getElementById('btn-whistle-trigger');
            if (whistleBtn) whistleBtn.disabled = false;
            if (zoneBox) zoneBox.classList.remove('on-cooldown');
            if (progressBar) progressBar.style.strokeDashoffset = "0";
        }
    }, tickMs);
}

// ==========================================================================
// 📋 LOGIC ĐIỀU PHỐI POPUP BAN BÈ: PHÂN TRANG GRID 6x6 VÀ HOÁN ĐỔI Ô CHỨA
// ==========================================================================
function openWhistleSelectorModalPopup() {
    const modal = document.getElementById('garden-mon-selector');
    if (!modal) return;

    // Reset sạch sẽ 5 ô Slot trống bệ dưới trước khi nạp view
    selectedVanguardSlotsArray = [null, null, null, null, null];
    selectorPopupCurrentPage = 0;

    renderWhistleGridAndSlots();
    modal.style.display = "flex";
}

function renderWhistleGridAndSlots() {
    const gridContainer = document.getElementById('garden-selector-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = "";

    // Lọc tìm trích xuất danh sách tất cả những loài quái học sinh ĐÃ BẮT ĐƯỢC từ Sheet
    let capturedListFilter = globalMobList.filter(mob => (gameState.captured[mob.ID] || 0) > 0);

    // Thuật toán lọc những con Chưa bị bốc xuống nằm ở 5 ô chứa bệ dưới
    let availableMonsForGrid = capturedListFilter.filter(mob => !selectedVanguardSlotsArray.includes(mob.ID.toString()));

    // Tính toán phân trang ma trận mốc Lưới 6x6 (36 ô)
    let startIdx = selectorPopupCurrentPage * SELECTOR_GRID_ITEMS_PER_PAGE;
    let endIdx = startIdx + SELECTOR_GRID_ITEMS_PER_PAGE;
    let pageItems = availableMonsForGrid.slice(startIdx, endIdx);

    // Ép tạo đủ cấu trúc Grid cứng khớp 36 ô (Nếu thiếu ảnh thì bù ô trống rỗng để giữ khung hình 6x6)
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
            
            // Bấm vào Mon trên lưới Grid -> Đẩy trực tiếp xuống ô trống bệ dưới
            cellBox.onclick = () => {
                selectMonToVanguardSlot(currentMobData.ID.toString());
            };
        } else {
            // Ô rỗng bọc lót giữ khung hình tăm tắp
            cellBox.style.background = "rgba(0,0,0,0.03)";
            cellBox.style.borderColor = "rgba(0,0,0,0.1)";
            cellBox.style.cursor = "default";
        }
        gridContainer.appendChild(cellBox);
    }

    // --- CẬP NHẬT TRẠNG THÁI HIỂN THỊ 5 Ô TRỐNG BỆ DƯỚI ---
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

    // Kiểm tra ẩn/hiện độ mờ của 2 nút Mũi tên điều hướng lật trang
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
    // Tìm tìm kiếm ô Slot trống đầu tiên từ trái qua phải ở bệ dưới
    let emptySlotIndex = selectedVanguardSlotsArray.findIndex(slot => slot === null);
    
    if (emptySlotIndex === -1) {
        alert("Chỉ được mang theo tối đa 5 con vệ sĩ đi theo sau đuôi thôi nha học sinh!");
        return;
    }

    // Điền mã quái vào Slot
    selectedVanguardSlotsArray[emptySlotIndex] = monIdString.toString();
    
    // Tái nạp thiết lập đồ họa giao diện
    renderWhistleGridAndSlots();
}

function deselectMonFromSlot(slotIndex) {
    if (selectedVanguardSlotsArray[slotIndex] === null) return;

    // Giải phóng xóa mã khỏi ô bệ dưới -> Tự động nạp trả ngược lên Grid trên
    selectedVanguardSlotsArray[slotIndex] = null;
    
    renderWhistleGridAndSlots();
}

function confirmWhistleSelection() {
    // Kiểm tra xem học sinh đã bốc ít nhất 1 con Vệ sĩ nào xuống bệ dưới chưa
    let totalSelected = selectedVanguardSlotsArray.filter(slot => slot !== null).length;
    
    if (totalSelected === 0) {
        alert("Hãy chọn ít nhất 1 con quái vật từ lưới Grid để thổi còi gọi tụi nó theo nha!");
        return;
    }

    // Đóng Popup Form
    document.getElementById('garden-mon-selector').style.display = "none";

    // Phóng lệnh còi hú tập hợp đoàn quân vệ sĩ
    triggerWhistleVanguardSummon();
}

function closeMonSelectorModal() {
    document.getElementById('garden-mon-selector').style.display = "none";
}

// ==========================================================================
// 🗑️ DỌN DẸP BỘ NHỚ KHI CHUYỂN MÀN HÌNH CHỐNG CHỒNG LUỒNG TIMER RUNTIME
// ==========================================================================
function cleanUpGardenEngineLeaks() {
    if (gardenAnimationFrameId) {
        cancelAnimationFrame(gardenAnimationFrameId);
        gardenAnimationFrameId = null;
    }
    gardenIntervalTimers.forEach(clearInterval);
    gardenIntervalTimers.forEach(clearTimeout);
    gardenIntervalTimers = [];

    if (whistleSystemState.durationTimer) clearInterval(whistleSystemState.durationTimer);
    if (whistleSystemState.cooldownTimer) clearInterval(whistleSystemState.cooldownTimer);

    whistleSystemState.isActiveActive = false;
    whistleSystemState.isCooldownPhase = false;
    playerMovementTrailQueue = [];
}

// Trói chặt lệnh tự dọn rác nếu học sinh tắt tab đột ngột
window.removeEventListener('beforeunload', cleanUpGardenEngineLeaks);
window.addEventListener('beforeunload', cleanUpGardenEngineLeaks);
