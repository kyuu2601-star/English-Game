// ==========================================
// 🤖 MÔ-ĐUN LOGIC TÁCH BIỆT: CUỐN SÁCH BỘ SƯU TẬP (COLLECTION-BOOK)
// ==========================================

function renderCollectionBook() {
    const leftGrid = document.getElementById('grid-page-left');
    const rightGrid = document.getElementById('grid-page-right');
    const paginationControls = document.getElementById('book-pagination-controls');
    
    if (!leftGrid || !rightGrid || !paginationControls) return;
    
    leftGrid.innerHTML = ""; 
    rightGrid.innerHTML = "";

    // 🕵️ THUẬT TOÁN ĐẾM QUÁI: Kiểm tra xem người chơi đã từng bắt được bất kỳ con nào chưa
    let totalCaughtCount = 0;
    if (gameState.captured) {
        Object.keys(gameState.captured).forEach(id => {
            totalCaughtCount += (gameState.captured[id] || 0);
        });
    }

    // 🛡️ BẪY TÍNH NĂNG THEO Ý FEN: Nếu sách trống trơn -> Giấu cụm nút điều hướng, xóa sạch trang sách và dừng lại
    if (totalCaughtCount === 0) {
        paginationControls.style.display = "none"; // 📌 ẨN HOÀN TOÀN 2 BTN PREVIOUS VÀ NEXT
        leftGrid.innerHTML = `<div style="grid-column: span 2; grid-row: span 2; display:flex; align-items:center; justify-content:center; font-family:'MyFredoka'; color:#64748b; font-size:1.2rem; text-align:center; width: 100%;">Your Collection Book is empty.<br>Go catch some Mobs first!</div>`;
        return;
    }

    // Nếu đã có quái vật bắt được -> Kích hoạt hiển thị cụm nút chuyển trang lên lại
    paginationControls.style.display = "flex";

    // Phân trang thuật toán: Mỗi trang sách đôi chứa đúng 8 thẻ (Trái 4 - Phải 4)
    let startIdx = currentBookPage * 8;
    let pageItems = globalMobList.slice(startIdx, startIdx + 8);

    pageItems.forEach((mob, index) => {
        if (!mob.ID) return; // Bảo vệ 1: Bỏ qua các dòng rác nếu lỡ gõ dư trên Google Sheets

        let isShiny = /[a-zA-Z]$/.test(mob.ID);
        let count = gameState.captured[mob.ID] || 0;
        
        let card = document.createElement('div');
        // Nếu đã bắt được (count > 0) thì kích hoạt class 'unlocked' để sáng bừng lên
        card.className = `card-item ${count > 0 ? 'unlocked' : ''}`;
        
        // 🎯 GIỮ NGUYÊN HOÀN TOÀN LOGIC CŨ + THÊM BẪY SẠCH RÁC KHOẢNG TRẮNG CỘT STARS
        let starLevel = mob.Stars ? mob.Stars.trim() : "";
        if (starLevel === "" || isNaN(starLevel)) {
            starLevel = "1"; // Nếu rỗng hoặc lỗi khoảng trắng, ép về phôi Card_lv1 mặc định để tránh sập 404
        }
        
        let imgName = isShiny ? `Card_lv${starLevel}_S.png` : `Card_lv${starLevel}.png`;
        
        // 🎯 GIỮ NGUYÊN ĐƯỜNG DẪN GỐC ĐANG CHẠY TỐT CỦA FEN
        card.style.backgroundImage = `url('assets/${imgName}')`;

        // Bơm đẩy cấu trúc HTML của tấm thẻ
        card.innerHTML = `
            <img src="${mob.Image}" class="mob-thumb">
            <div class="card-title">${count > 0 ? mob.Name : '???'}</div>
            <div class="card-tag">${count > 0 ? 'x' + count : '0'}</div>
        `;

        // 4 thẻ đầu nhét vào trang trái, 4 thẻ sau nhét vào trang phải (Cố định layout 2x2 vuông vắn)
        if (index < 4) {
            leftGrid.appendChild(card);
        } else {
            rightGrid.appendChild(card);
        }
    });
}

// Hàm lùi trang sách cổ
function prevBookPage() {
    if (currentBookPage > 0) {
        currentBookPage--;
        renderCollectionBook();
    }
}

// Hàm tiến trang sách cổ
function nextBookPage() {
    if ((currentBookPage + 1) * 8 < globalMobList.length) {
        currentBookPage++;
        renderCollectionBook();
    }
}
