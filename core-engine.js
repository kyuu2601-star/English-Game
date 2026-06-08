// ==========================================
// 🚀 LUỒNG ĐIỀU KHIỂN HOẠT ĐỘNG SAU KHI NẠP UI
// ==========================================

// Hàm này tự động chạy ngay khi màn hình Loading vừa hiện ra
async function triggerDataFetching() {
    const fill = document.getElementById('loading-bar-fill');
    if(fill) fill.style.width = "30%";
    
    try {
        // Kéo data thật từ link Google Sheets của fen
        const mobsResponse = await fetch(MOBS_CSV_URL).then(res => res.text());
        if(fill) fill.style.width = "70%";
        
        globalMobList = parseCSV(mobsResponse);
        
        // Tạo kho câu hỏi mặc định (Fen có thể thay bằng link fetch quest thật tùy ý)
        globalQuestionList = [
            {Q_ID:"Q1", Question:"What color is an apple?", Option_A:"Red", Option_B:"Blue", Option_C:"Green", Correct_Answer:"A", Question_Stars:"1"},
            {Q_ID:"Q2", Question:"What animal says 'Meow'?", Option_A:"Dog", Option_B:"Cat", Option_C:"Duck", Correct_Answer:"B", Question_Stars:"1"},
            {Q_ID:"Q3", Question:"An elephant has a long...", Option_A:"Tail", Option_B:"Trunk", Option_C:"Hand", Correct_Answer:"B", Question_Stars:"3"}
        ];

        if(fill) fill.style.width = "100%";
        
        // Nạp xong xuôi thì ẩn thanh Loading và kích hoạt bật Popup Login lên liền
        setTimeout(() => {
            const bar = document.getElementById('loading-bar-container');
            const popup = document.getElementById('login-popup');
            if(bar) bar.style.display = "none";
            if(popup) popup.style.display = "flex";
        }, 600);

    } catch (error) {
        const txt = document.getElementById('loading-text');
        if(txt) txt.innerText = "Error connecting to Google Sheets! Check your link public.";
    }
}

// Hàm chuyển đổi màn hình động bằng cách gọi lại loadScreen
function changeScreen(scrId) {
    if (scrId === 'menu') {
        loadScreen('loading-menu', () => {
            // Khi quay lại menu thì chui thẳng vào giao diện nút bấm luôn, bỏ qua bước login
            document.getElementById('loading-bar-container').style.display = "none";
            document.getElementById('login-popup').style.display = "none";
            document.getElementById('menu-controls').style.display = "flex";
            document.getElementById('menu-avatar-display').style.backgroundImage = `url('assets/Player_${gameState.gender === 'male' ? 'Male' : 'Female'}_Main.png')`;
            document.getElementById('user-coins').innerText = gameState.coins;
        });
    }
    if (scrId === 'battle') {
        loadScreen('battle-stage', () => {
            document.getElementById('user-coins').innerText = gameState.coins;
            nextBattleTurn(); // Kích hoạt đổ xúc xắc ra quái trận đầu
        });
    }
    if (scrId === 'collection') {
        loadScreen('collection-book', () => {
            currentBookPage = 0;
            renderCollectionBook(); // Kích hoạt xếp bài lên trang sách
        });
    }
}
