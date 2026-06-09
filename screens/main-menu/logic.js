// ==========================================
// 🤖 MÔ-ĐUN LOGIC TÁCH BIỆT: SẢNH CHÍNH & XÁC THỰC (MAIN-MENU)
// ==========================================

function initMainMenuLogic() {
    // 🕵️ KIỂM TRA NGẦM: Vừa nạp Sảnh là check Local Storage của máy liền
    let keys = Object.keys(localStorage);
    let foundUserKey = keys.find(k => k.startsWith('pkm_catch_'));

    if (foundUserKey) {
        let savedData = localStorage.getItem(foundUserKey);
        try {
            let parsed = JSON.parse(savedData);
            if (parsed.username && parsed.gender) {
                // Trường hợp 1: Máy đã có tài khoản + đã chọn tướng -> Bỏ qua mọi popup, bung sảnh chơi luôn!
                gameState.username = parsed.username;
                gameState.gender = parsed.gender;
                gameState.coins = parsed.coins || 0;
                gameState.captured = parsed.captured || {};
                
                enterMainMenuDirectly();
                return;
            }
        } catch (e) { console.error("Lỗi đọc bộ nhớ máy, kích hoạt Đăng nhập mới:", e); }
    }

    // Trường hợp 2: Máy trắng thông tin -> Bật Popup bắt nhập Tên + Mật Khẩu
    openLoginCredentialsPopup();
}

// 🔓 HÀM 1: ĐI THẲNG VÀO SẢNH (Dành cho user cũ đã lưu trên máy)
function enterMainMenuDirectly() {
    const menuControls = document.getElementById('menu-controls');
    const charZone = document.querySelector('.menu-right-char-zone');
    const avatarDisplay = document.getElementById('menu-avatar-display');
    const nameText = document.getElementById('player-name-text');

    // Nạp phôi ảnh tướng 500px lùi cấp và ghi tên lên bệ Nametag_lv5
    if (avatarDisplay) avatarDisplay.style.backgroundImage = `url('../../assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Main.png')`;
    if (nameText) nameText.innerText = gameState.username;

    // Kích hoạt hiển thị cụm nút Start/Collection và nhân vật lên màn hình
    if (menuControls) menuControls.style.display = "flex";
    if (charZone) charZone.style.display = "flex";
}

// 🔏 HÀM 2: MỞ FORM NHẬP ACCOUNT (Tự động biến đổi giao diện popup sang ô điền Pass)
function openLoginCredentialsPopup() {
    const loginPopup = document.getElementById('login-popup');
    const popupContent = document.querySelector('.login-popup-content');
    
    if (!loginPopup || !popupContent) return;

    // Tái cấu trúc ruột của Popup thành form nhập Tên + Mật khẩu chuẩn theo yêu cầu
    popupContent.innerHTML = `
        <h3>MON ENGLISH - USER LOGIN</h3>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; margin: 25px 0;">
            <div class="input-center-zone">
                <input type="text" id="login-input-username" placeholder="Enter Username..." maxlength="15" style="width: 260px;">
            </div>
            <div class="input-center-zone">
                <input type="password" id="login-input-password" placeholder="Enter Password..." maxlength="15" style="width: 260px; border-color: #ca8a04;">
            </div>
        </div>
        <button class="btn-confirm-login" onclick="handleAccountAuthentication()">LOGIN</button>
    `;
    
    loginPopup.style.display = "flex";
}

// 🔐 HÀM 3: XỬ LÝ XÁC THỰC (Check Account ảo Kyuu / Hoặc Acc Local Storage cũ)
function handleAccountAuthentication() {
    const nameInput = document.getElementById('login-input-username');
    const passInput = document.getElementById('login-input-password');
    
    const username = nameInput ? nameInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";

    if (!username || !password) { alert("Please fill in both Name and Password!"); return; }

    // 🕵️ CHỖ KIỂM TRA TÀI KHOẢN HỜ (FAKE ACCOUNT THEO Ý FEN)
    if (username === "Kyuu" && password === "123") {
        alert("🔑 Fake Account Kyuu Connected! (Flow test gender activation)");
        gameState.username = "Kyuu";
        openGenderSelectionStage(); // Tài khoản hờ chưa có tướng -> Bật màn hình chọn Boy/Girl để fen check flow
        return;
    }

    // Kiểm tra xem cái Tên này đã từng có dữ liệu lưu trữ trên hệ thống Local Storage của máy chưa
    let localSaved = localStorage.getItem(`pkm_catch_${username}`);
    
    if (localSaved) {
        // Tài khoản cũ quay lại đổi máy (hoặc nhập lại thông tin) -> Đăng nhập vào thẳng game luôn!
        try {
            let parsed = JSON.parse(localSaved);
            gameState.username = username;
            gameState.gender = parsed.gender || "male"; // Cứ lấy giới tính cũ đã lưu
            gameState.coins = parsed.coins || 0;
            gameState.captured = parsed.captured || {};
            
            document.getElementById('login-popup').style.display = "none";
            enterMainMenuDirectly();
            saveGameLocal();
            return;
        } catch (e) { console.error(e); }
    }

    // Nếu là một cái Tên mới tinh chưa từng xuất hiện trên máy -> Khởi tạo làm tài khoản mới
    gameState.username = username;
    openGenderSelectionStage(); // Bật màn hình chọn 2 nhân vật Boy/Girl
}

// 🧍 HÀM 4: BẬT GIAO DIỆN CHỌN NHÂN VẬT (GENDER SELECTION BOX)
function openGenderSelectionStage() {
    const popupContent = document.querySelector('.login-popup-content');
    if (!popupContent) return;

    // Trả lại nguyên bản cụm chọn tướng Andil / Alice cho fen check flow chọn nhân vật
    popupContent.innerHTML = `
        <h3>CHOOSE YOUR CHARACTER</h3>
        <div class="character-select-row">
            <div id="char-card-male" class="char-select-card" onclick="pickGender('male')">
                <img src="../../assets/Player_Male_Main.png" alt="Male">
                <p>ANDIL</p>
            </div>
            
            <div style="font-family: 'MyFredoka'; font-weight: bold; color: #854d0e; font-size: 1.2rem;">VS</div>

            <div id="char-card-female" class="char-select-card" onclick="pickGender('female')">
                <img src="../../assets/Player_Female_Main.png" alt="Female">
                <p>ALICE</p>
            </div>
        </div>
        <button class="btn-confirm-login" onclick="finalizeNewPlayerSetup()">CONFIRM CHARACTER</button>
    `;
    selectedGenderTemp = ""; // Reset biến tạm giới tính
}

// Chọn giới tính bật viền sáng xanh
function pickGender(g) {
    selectedGenderTemp = g;
    const cardMale = document.getElementById('char-card-male');
    const cardFemale = document.getElementById('char-card-female');
    
    if (cardMale) cardMale.classList.remove('selected');
    if (cardFemale) cardFemale.classList.remove('selected');
    
    if (g === 'male' && cardMale) cardMale.classList.add('selected');
    if (g === 'female' && cardFemale) cardFemale.classList.add('selected');
}

// 🏁 HÀM 5: CHÍNH THỨC CHỐT NHÂN VẬT & LƯU LOCAL STORAGE MÁY
function finalizeNewPlayerSetup() {
    if (!selectedGenderTemp) { alert("Please click to choose either Andil or Alice!"); return; }

    gameState.gender = selectedGenderTemp;
    
    // Nếu không phải là account hờ Kyuu thì mới cấp phôi rác rỗng để lưu trữ
    if (gameState.username !== "Kyuu") {
        gameState.coins = 0;
        gameState.captured = {};
        globalMobList.forEach(m => { if (m.ID) gameState.captured[m.ID] = 0; });
        saveGameLocal(); // Lưu chặt vào Local Storage để lần sau mở máy tắt luôn popup login
    } else {
        // Acc hờ Kyuu thì chỉ để test flow chọn tướng, gán tạm để hiện hình chứ cấm lưu rác vào máy
        gameState.coins = 999;
        gameState.captured = {};
    }

    // Tắt phắt popup, giải phóng sảnh chính hiện nút và tướng 500px lên chào đón
    document.getElementById('login-popup').style.display = "none";
    enterMainMenuDirectly();
}
