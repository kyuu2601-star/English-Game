// ==========================================
// 🔗 CONFIG CÁC ĐƯỜNG LINK GOOGLE SHEETS (CSV)
// ==========================================
const MOBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pubhtml?gid=0&single=true";
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pubhtml?gid=991631725&single=true"; // Link quest tạm của tui

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

// KHỞI CHẠY KHUNG ENGINEkhi vừa mở Web
window.onload = function() {
    // Đầu tiên là bắt buộc nạp màn hình loading-menu trước
    loadScreen('loading-menu', initGameEngine);
};

// Hàm kích hoạt nạp data từ Sheet sau khi màn hình loading đã sẵn sàng
async function initGameEngine() {
    // Các logic điều khiển thanh loading và fetch dữ liệu từ Sheet thật
    // Sẽ được gọi trực tiếp bằng các hàm trong file này để thao tác lên UI vừa nạp
    triggerDataFetching();
}

function saveGameLocal() {
    localStorage.setItem(`pkm_catch_${gameState.username}`, JSON.stringify(gameState));
}
