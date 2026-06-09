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

    // 🎯 THUẬT TOÁN MỚI TỐI ƯU: Chỉ lọc ra những con Mob mà người chơi ĐÃ BẮT ĐƯỢC (count > 0)
    // Cứ bắt được con nào là tự động xếp hàng từ trái sang phải, không theo id trống cũ
    const caughtMobList = globalMobList.filter(mob => {
        if (!mob.ID) return false;
        const count = gameState.captured[mob.ID] || 0;
        return count > 0; // Chỉ giữ lại quái đã thu phục
    });

    // 🛡️ BẪY SÁCH TRỐNG: Nếu mảng lọc xong trống trơn -> Giấu nút chuyển trang, thông báo và dừng lại
    if (caughtMobList.length === 0) {
        paginationControls.style.display = "none"; // 📌 ẨN HOÀN TOÀN 2 BTN PREVIOUS VÀ NEXT
        leftGrid.innerHTML = `<div style="grid-column: span 2; grid-row: span 2; display:flex; align-items:center; justify-content:center; font-family:'MyFredoka'; color:#64748b; font-size:1.2rem; text-align:center; width: 100%;">Your Collection Book is empty.<br>Go catch some Mobs first!</div>`;
        return;
    }

    // Nếu đã có quái vật bắt được -> Kích hoạt hiển thị cụm nút chuyển trang lên lại
    paginationControls.style.display = "flex";

    // Phân trang thuật toán dựa trên danh sách quái ĐÃ BẮT: Mỗi trang sách đôi chứa đúng 8 thẻ (Trái 4 - Phải 4)
    let startIdx = currentBookPage * 8;
    let pageItems = caughtMobList.slice(startIdx, startIdx + 8);

    pageItems.forEach((mob, index) => {
        let isShiny = /[a-zA-Z]$/.test(mob.ID);
        let count = gameState.captured[mob.ID] || 0;
        
        let card = document.createElement('div');
        // Vì list này 100% là quái đã bắt nên luôn luôn có class 'unlocked' sáng bừng
        card.className = "card-item unlocked";
        
        // 🎯 GIỮ NGUYÊN BẪY SẠCH RÁC KHOẢNG TRẮNG CỘT STARS CỦA FEN
        let starLevel = mob.Stars ? mob.Stars.trim() : "";
        if (starLevel === "" || isNaN(starLevel)) {
            starLevel = "1"; // Ép về phôi Card_lv1 mặc định nếu lỗi dữ liệu
        }
        
        let imgName = isShiny ? `Card_lv${starLevel}_S.png` : `Card_lv${starLevel}.png`;
        
        // 🎯 GIỮ NGUYÊN ĐƯỜNG DẪN GỐC ĐANG CHẠY TỐT CỦA FEN
        card.style.backgroundImage = `url('assets/${imgName}')`;

        // Bơm đẩy cấu trúc HTML của tấm thẻ (Vì đã bắt được nên hiện rõ Tên và Số lượng)
        card.innerHTML = `
            <img src="${mob.Image}" class="mob-thumb">
            <div class="card-title">${mob.Name}</div>
            <div class="card-tag">x${count}</div>
        `;

        // 4 thẻ đầu nhét vào trang trái, 4 thẻ sau nhét vào trang phải (Cố định layout 2x2 vuông vắn)
        if (index < 4) {
            leftGrid.appendChild(card);
        } else {
            rightGrid.appendChild(card);
        }
    });
}

// Hàm lùi trang sách cổ (Ăn theo danh sách quái đã bắt)
function prevBookPage() {
    if (currentBookPage > 0) {
        currentBookPage--;
        renderCollectionBook();
    }
}

// Hàm tiến trang sách cổ (ĐÃ CẬP NHẬT: Tính toán giới hạn trang dựa trên caughtMobList.length ngầm)
function nextBookPage() {
    // Tạo mảng tạm ngầm để tính toán bước nhảy trang chính xác cho nút NEXT
    const caughtMobCount = globalMobList.filter(mob => mob.ID && (gameState.captured[mob.ID] || 0) > 0).length;

    if ((currentBookPage + 1) * 8 < caughtMobCount) {
        currentBookPage++;
        renderCollectionBook();
    }
}
