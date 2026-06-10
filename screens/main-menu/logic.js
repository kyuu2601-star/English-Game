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

// 🔓 HÀM 1: ĐI THẲNG VÀO SẢNH (Dành cho user cũ đã lưu trên máy hoặc đăng nhập thành công)
function enterMainMenuDirectly() {
    const menuControls = document.getElementById('menu-controls');
    const charZone = document.querySelector('.menu-right-char-zone');
    const avatarDisplay = document.getElementById('menu-avatar-display');
    const nameText = document.getElementById('player-name-text');

    // 🎯 ĐÃ SỬA: Đưa về đường dẫn gốc 'assets/' để chống lỗi trắng ảnh tướng trên GitHub Pages
    if (avatarDisplay) avatarDisplay.style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Main.png')`;
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
    // 🎯 ĐÃ SỬA: Thêm dòng text "Liên hệ Admin" ẩn sẵn ngay dưới nút LOGIN
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
        <button id="btn-login-submit" class="btn-confirm-login" onclick="handleAccountAuthentication()">LOGIN</button>
        <p id="login-error-text" style="color: #ef4444; font-family: 'MyFredoka', sans-serif; font-size: 1.2rem; font-weight: bold; margin-top: 5px; display: none; text-shadow: 1px 1px 0 #fff;">Sai thông tin. Vui lòng liên hệ Admin!</p>
    `;
    
    loginPopup.style.display = "flex";
}

// 🔐 HÀM 3: XỬ LÝ XÁC THỰC KẾT HỢP API GOOGLE SHEETS
async function handleAccountAuthentication() {
    const nameInput = document.getElementById('login-input-username');
    const passInput = document.getElementById('login-input-password');
    const loginBtn = document.getElementById('btn-login-submit');
    const errorText = document.getElementById('login-error-text');
    
    const username = nameInput ? nameInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";

    // Ẩn text lỗi đi mỗi khi bắt đầu bấm nút lại
    if (errorText) errorText.style.display = "none";

    if (!username || !password) { 
        if (errorText) {
            errorText.innerText = "Vui lòng nhập đủ Name và Password!";
            errorText.style.display = "block";
        }
        return; 
    }

    // Đổi trạng thái nút bấm tránh spam click
    if (loginBtn) {
        loginBtn.innerText = "LOADING...";
        loginBtn.disabled = true;
    }

    // 🎯 GỌI HÀM FETCH API GOOGLE SHEETS TỪ CORE ENGINE
    const isLoginSuccess = await loginGame(username, password);

    if (isLoginSuccess) {
        // Kiểm tra xem giới tính (Gender) lấy về từ Sheet có bị trống hay không
        if (gameState.gender === "" || !gameState.gender) {
            // 👉 TH1: TÀI KHOẢN MỚI TINH (Gender trống) -> Chuyển sang bước chọn nhân vật Nam/Nữ
            openGenderSelectionStage();
        } else {
            // 👉 TH2: TÀI KHOẢN CŨ ĐÃ CHƠI (Có sẵn Gender) -> Đóng popup, vào thẳng sảnh chơi
            document.getElementById('login-popup').style.display = "none";
            enterMainMenuDirectly();
        }
    } else {
        // Nếu API báo sai Pass/User -> Mở lại nút để nhập lại và hiện cảnh báo đỏ
        if (loginBtn) {
            loginBtn.innerText = "LOGIN";
            loginBtn.disabled = false;
        }
        if (errorText) {
            errorText.innerText = "Sai thông tin. Vui lòng liên hệ Admin!";
            errorText.style.display = "block";
        }
    }
}

// 🧍 HÀM 4: BẬT GIAO DIỆN CHỌN NHÂN VẬT (GENDER SELECTION BOX)
function openGenderSelectionStage() {
    const popupContent = document.querySelector('.login-popup-content');
    if (!popupContent) return;

    popupContent.innerHTML = `
        <h3>CHOOSE YOUR CHARACTER</h3>
        <div class="character-select-row">
            <div id="char-card-male" class="char-select-card" onclick="pickGender('male')">
                <img src="assets/Player_Male_Main.png" alt="Male">
                <p>ANDIL</p>
            </div>
            
            <div style="font-family: 'MyFredoka'; font-weight: bold; color: #854d0e; font-size: 3rem;">OR</div>

            <div id="char-card-female" class="char-select-card" onclick="pickGender('female')">
                <img src="assets/Player_Female_Main.png" alt="Female">
                <p>ALICE</p>
            </div>
        </div>
        <button class="btn-confirm-login" onclick="finalizeNewPlayerSetup()">CONFIRM</button>
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

// 🏁 HÀM 5: CHÍNH THỨC CHỐT NHÂN VẬT & LƯU LẠI
function finalizeNewPlayerSetup() {
    if (!selectedGenderTemp) { alert("Please click to choose either Andil or Alice!"); return; }

    gameState.gender = selectedGenderTemp;
    
    // Tạo sẵn phôi dữ liệu quái vật rỗng để hệ thống đọc/ghi không bị crash
    let freshCaptured = {};
    if (globalMobList && globalMobList.length > 0) {
        globalMobList.forEach(m => { if (m.ID) freshCaptured[m.ID] = 0; });
    }

    // Thiết lập thông số ban đầu cho tài khoản mới tinh
    gameState.coins = gameState.coins || 0; // Nếu trên sheet có sẵn tiền thì giữ, không thì bằng 0
    gameState.captured = (Object.keys(gameState.captured).length > 0) ? gameState.captured : freshCaptured;
    
    // Lưu chặt vào bộ nhớ máy để lần sau mở trình duyệt là tự vào thẳng sảnh không hiện popup
    saveGameLocal();

    // 🎯 ĐÃ THÊM: Bắn lệnh đồng bộ ngay lập tức lên Google Sheet
    if (typeof saveGameToSheet === 'function') {
        saveGameToSheet();
    }

    // Tắt popup, giải phóng sảnh chính hiện nút và tướng lên chào đón
    document.getElementById('login-popup').style.display = "none";
    enterMainMenuDirectly();
}
