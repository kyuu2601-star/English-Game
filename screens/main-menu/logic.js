// ==========================================
// 🤖 MÔ-ĐUN LOGIC TÁCH BIỆT: SẢNH CHÍNH & XÁC THỰC (MAIN-MENU)
// ==========================================

// ⏳ MÔ-ĐUN POPUP AUTO-LOGIN LOADING THÊM VÀO ĐỂ TỐI ƯU UX
function showAutoLoginPopup() {
    let popup = document.getElementById('auto-login-loading-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'auto-login-loading-popup';
        popup.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; justify-content: center; align-items: center; flex-direction: column;">
                <div style="width: 50px; height: 50px; border: 5px solid rgba(255, 255, 255, 0.3); border-top-color: #FFD700; border-radius: 50%; animation: spin-loading 1s linear infinite;"></div>
                <h2 style="color: white; font-family: 'Fredoka', 'PatrickHand', sans-serif; margin-top: 20px; font-weight: normal; letter-spacing: 1px;">Đang kết nối dữ liệu...</h2>
                <style>@keyframes spin-loading { 100% { transform: rotate(360deg); } }</style>
            </div>
        `;
        document.body.appendChild(popup);
    }
    popup.style.display = 'flex';
}

function hideAutoLoginPopup() {
    const popup = document.getElementById('auto-login-loading-popup');
    if (popup) {
        popup.style.transition = "opacity 0.3s";
        popup.style.opacity = "0";
        setTimeout(() => popup.remove(), 300);
    }
}

async function initMainMenuLogic() {
    // 🕵️ KIỂM TRA NGẦM: Vừa nạp Sảnh là check Local Storage của máy liền
    let keys = Object.keys(localStorage);
    let foundUserKey = keys.find(k => k.startsWith('pkm_catch_'));

    if (foundUserKey) {
        let savedData = localStorage.getItem(foundUserKey);
        try {
            let parsed = JSON.parse(savedData);
            
            // 🎯 ĐÃ SỬA: Kiểm tra nếu máy có lưu cả Username lẫn Mật khẩu để Sync Ngầm
            if (parsed.username && parsed.password) {
                console.log("🔄 Phát hiện tài khoản cũ, đang tự động đồng bộ dữ liệu mới nhất từ Google Sheet...");
                
                // 🔴 BẬT POPUP LOADING LÊN TRƯỚC KHI KẾT NỐI SERVER
                showAutoLoginPopup();

                // Chạy lệnh đăng nhập ngầm lên Cloud để bốc data mới nhất (xu, năng lượng)
                let isSyncSuccess = await loginGame(parsed.username, parsed.password);
                
                // 🟢 ĐĂNG NHẬP (THÀNH CÔNG HAY THẤT BẠI ĐỀU) TẮT POPUP ĐI
                hideAutoLoginPopup();

                if (isSyncSuccess) {
                    // 👉 HƯỚNG 1 (ONLINE): Có mạng và sync thành công -> Data mới nhất đã nạp thẳng vào gameState
                    enterMainMenuDirectly();
                    return;
                } else {
                    // 👉 HƯỚNG 2 (OFFLINE): Nếu rớt mạng hoặc lỗi server -> Kích hoạt chế độ Offline Backup
                    console.warn("⚠️ Không thể kết nối tới Google Sheet. Kích hoạt chế độ Offline Backup!");
                    gameState.username = parsed.username;
                    gameState.password = parsed.password;
                    gameState.gender = parsed.gender;
                    gameState.coins = parsed.coins || 0;
                    gameState.captured = parsed.captured || {};
                    gameState.energy = parsed.energy || 0;
                    
                    enterMainMenuDirectly();
                    return;
                }
            } else if (parsed.username && parsed.gender) {
                // 👉 LƯỚI BẢO VỆ CHO TÀI KHOẢN ĐỜI CŨ (Chưa được cấp password vào máy)
                console.warn("⚠️ Tài khoản cũ chưa có Mật khẩu. Dùng tạm dữ liệu Offline.");
                gameState.username = parsed.username;
                gameState.gender = parsed.gender;
                gameState.coins = parsed.coins || 0;
                gameState.captured = parsed.captured || {};
                gameState.energy = parsed.energy || 0;
                
                enterMainMenuDirectly();
                return;
            }
        } catch (e) { console.error("Lỗi đọc bộ nhớ máy, kích hoạt Đăng nhập mới:", e); }
    }

    // Trường hợp máy trắng thông tin -> Bật Popup bắt nhập Tên + Mật Khẩu từ đầu
    openLoginCredentialsPopup();
}

// 🔓 HÀM 1: ĐI THẲNG VÀO SẢNH (Dành cho user cũ đã lưu trên máy hoặc đăng nhập thành công)
function enterMainMenuDirectly() {
    const menuControls = document.getElementById('menu-controls');
    const charZone = document.querySelector('.menu-right-char-zone');
    const avatarDisplay = document.getElementById('menu-avatar-display');
    const nameText = document.getElementById('player-name-text');

    if (avatarDisplay) avatarDisplay.style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Main.png')`;
    if (nameText) nameText.innerText = gameState.username;

    // Kích hoạt hiển thị cụm nút Start/Collection và nhân vật lên màn hình
    if (menuControls) menuControls.style.display = "flex";
    if (charZone) charZone.style.display = "flex";
}

// 🔏 HÀM 2: MỞ FORM NHẬP ACCOUNT
function openLoginCredentialsPopup() {
    const loginPopup = document.getElementById('login-popup');
    const popupContent = document.querySelector('.login-popup-content');
    
    if (!loginPopup || !popupContent) return;

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

    if (errorText) errorText.style.display = "none";

    if (!username || !password) { 
        if (errorText) {
            errorText.innerText = "Vui lòng nhập đủ Name và Password!";
            errorText.style.display = "block";
        }
        return; 
    }

    if (loginBtn) {
        loginBtn.innerText = "LOADING...";
        loginBtn.disabled = true;
    }

    const isLoginSuccess = await loginGame(username, password);

    if (isLoginSuccess) {
        if (gameState.gender === "" || !gameState.gender) {
            openGenderSelectionStage();
        } else {
            document.getElementById('login-popup').style.display = "none";
            enterMainMenuDirectly();
        }
    } else {
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
    selectedGenderTemp = ""; 
}

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
    if (!selectedGenderTemp) { 
        alert("Please click to choose either Andil or Alice!"); 
        return; 
    }

    gameState.gender = selectedGenderTemp;
    gameState.coins = gameState.coins || 0; 
    gameState.captured = (Object.keys(gameState.captured).length > 0) ? gameState.captured : {};
    
    saveGameLocal();

    if (typeof saveGameToSheet === 'function') {
        saveGameToSheet();
    }

    document.getElementById('login-popup').style.display = "none";
    enterMainMenuDirectly();
}
