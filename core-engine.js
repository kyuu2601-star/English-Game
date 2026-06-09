// ==========================================
// 🔗 CONFIG CÁC ĐƯỜNG LINK GOOGLE SHEETS CỐT LÕI
// ==========================================
const MOBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=0&single=true&output=csv";
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-EFZn4iPTyVHW35NtYDWCwVH5mt6Vuw9kbAFNMm8CkLXzu31QdoK7vW18NdlKLXKKgZIH9YYFKqoh/pub?gid=991631725&single=true&output=csv";
const CACHE_NAME = 'mon-english-v1';

// Trạng thái lưu trữ dùng chung xuyên suốt các file JS mô-đun
let globalMobList = [];      
let globalQuestionList = []; 
let gameState = { username: "", coins: 0, gender: "", captured: {} };
let currentMob = null;
let currentQuestion = null;
let currentBookPage = 0; 
let selectedGenderTemp = ""; 
let shinyRainInterval = null; 

// Bộ nạp động tự nhúng file logic.js riêng của từng màn hình vào hệ thống
async function loadScreen(screenName, callback) {
    const viewport = document.getElementById('game-viewport');
    try {
        const htmlResponse = await fetch(`screens/${screenName}/ui.html`);
        const htmlText = await htmlResponse.text();
        viewport.innerHTML = htmlText;
        
        const cssId = `css-${screenName}`;
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId; link.rel = 'stylesheet';
            link.href = `screens/${screenName}/style.css`;
            document.head.appendChild(link);
        }
        
        const oldScript = document.getElementById('screen-runtime-logic');
        if (oldScript) oldScript.remove();
        
        const script = document.createElement('script');
        script.id = 'screen-runtime-logic';
        script.src = `screens/${screenName}/logic.js`;
        script.onload = () => { if (callback) callback(); };
        document.body.appendChild(script);
        
    } catch (error) {
        console.error(`Không thể nạp màn hình: ${screenName}`, error);
    }
}

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

function saveGameLocal() {
    localStorage.setItem(`pkm_catch_${gameState.username}`, JSON.stringify(gameState));
}

// Vừa mở Web là gọi màn hình Loading bọc rèm lên đầu tiên
window.onload = function() {
    loadScreen('loading-menu', initGameEngine);
};
