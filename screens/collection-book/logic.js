// ==========================================
// 🤖 MÔ-ĐUN LOGIC TÁCH BIỆT: CUỐN SÁCH BỘ SƯU TẬP (COLLECTION-BOOK)
// ==========================================

function renderCollectionBook() {
    // 🎯 ĐÃ ĐỔI: Nhắm thẳng vào thằng cha bọc ngoài cùng của cuốn sách
    const bookContainer = document.querySelector('.book-container');
    const paginationControls = document.getElementById('book-pagination-controls');
    
    if (!bookContainer || !paginationControls) return;
    
    // 🧹 DỌN SẠCH CŨ: Xóa toàn bộ các thẻ bài cũ đang găm trên sách trước khi vẽ trang mới
    // Sử dụng vòng lặp xóa để giữ lại cấu trúc nếu fen có lỡ để thẻ khác trong này
    const oldCards = bookContainer.querySelectorAll('.card-item');
    oldCards.forEach(card => card.remove());

    // 🎯 THUẬT TOÁN LỌC: Chỉ lấy những con Mob mà người chơi ĐÃ BẮT ĐƯỢC (count > 0)
    const caughtMobList = globalMobList.filter(mob => {
        if (!mob.ID) return false;
        const count = gameState.captured[mob.ID] || 0;
        return count > 0;
    });

    // 🛡️ BẪY SÁCH TRỐNG: Nếu chưa bắt được con nào -> Giấu nút lật trang, hiện thông báo ngay tâm sách
    if (caughtMobList.length === 0) {
        paginationControls.style.display = "none";
        
        // Tạo một thông báo tạm thời nằm giữa cuốn sách
        const emptyNotice = document.createElement('div');
        emptyNotice.className = 'card-item'; // Mượn class để ăn z-index
        emptyNotice.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-family:'MyFredoka'; color:#64748b; font-size:1.2rem; text-align:center; width:100%; max-width:none; max-height:none; background:none;";
        emptyNotice.innerHTML = "Your Collection Book is empty.<br>Go catch some Mobs first!";
        bookContainer.appendChild(emptyNotice);
        return;
    }

    // Nếu đã có quái vật bắt được -> Kích hoạt hiển thị cụm nút chuyển trang lên lại
    paginationControls.style.display = "flex";

    // Phân trang thuật toán: Mỗi trang đôi chứa đúng 8 thẻ vị trí từ slot-1 đến slot-8
    let startIdx = currentBookPage * 8;
    let pageItems = caughtMobList.slice(startIdx, startIdx + 8);

    pageItems.forEach((mob, index) => {
        let isShiny = /[a-zA-Z]$/.test(mob.ID);
        let count = gameState.captured[mob.ID] || 0;
        
        let card = document.createElement('div');
        
        // 🎯 BÍ KÍP ĐỊNH VỊ: Gài chính xác class 'slot-1' đến 'slot-8' dựa vào chỉ số index (+1)
        card.className = `card-item unlocked slot-${index + 1}`;
        
        // BẪY SẠCH RÁC KHOẢNG TRẮNG CỘT STARS CỦA FEN
        let starLevel = mob.Stars ? mob.Stars.trim() : "";
        if (starLevel === "" || isNaN(starLevel)) {
            starLevel = "1";
        }
        
        let imgName = isShiny ? `Card_lv${starLevel}_S.png` : `Card_lv${starLevel}.png`;
        card.style.backgroundImage = `url('assets/${imgName}')`;

        // Bơm đẩy cấu trúc HTML của tấm thẻ
        card.innerHTML = `
            <img src="${mob.Image}" class="mob-thumb">
            <div class="card-title">${mob.Name}</div>
            <div class="card-tag">x${count}</div>
        `;

        // 🎯 THẢ THẲNG VÀO KHUNG SÁCH: CSS tự động bốc class slot-x để đóng đinh vị trí
        bookContainer.appendChild(card);
    });
}

// Hàm lùi trang sách cổ (Ăn theo danh sách quái đã bắt)
function prevBookPage() {
    if (currentBookPage > 0) {
        currentBookPage--;
        renderCollectionBook();
    }
}

// Hàm tiến trang sách cổ (Tính toán giới hạn chuẩn theo caughtMobList)
function nextBookPage() {
    const caughtMobCount = globalMobList.filter(mob => mob.ID && (gameState.captured[mob.ID] || 0) > 0).length;

    if ((currentBookPage + 1) * 8 < caughtMobCount) {
        currentBookPage++;
        renderCollectionBook();
    }
}
