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
        
        // 🎯 ĐÃ THÊM: Hàm nén số siêu gọn (Dưới 1000 hiện số thường, từ 1000 trở lên hiện 1k, 1.2k...)
 // 🎯 Rút gọn số lượng & set class bóp chữ
        let displayCount = count;
        if (count >= 1000) {
            displayCount = (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        let shrinkClass = count > 99 ? "shrink-text" : "";
        
        // 1️⃣ BƯỚC 1: XÂY CÁI KHUNG THẺ TRƯỚC (createElement)
        let card = document.createElement('div');
        card.className = `card-item unlocked slot-${index + 1}`;
        
        // 2️⃣ BƯỚC 2: TÌM ẢNH NỀN PHÙ HỢP CHO THẺ
        let starLevel = mob.Stars ? mob.Stars.toString().trim() : "";
        if (starLevel === "" || isNaN(starLevel)) {
            starLevel = "1";
        }
        
        let isRankE = mob.ID.toString().toUpperCase().startsWith('E');
        let imgName = "";

        if (isRankE) {
            imgName = isShiny ? "Card_lvE_S.png" : "Card_lvE.png";
        } else {
            imgName = isShiny ? `Card_lv${starLevel}_S.png` : `Card_lv${starLevel}.png`;
        }

        // 3️⃣ BƯỚC 3: LẮP RÁP NỘI THẤT VÀO THẺ
        card.style.backgroundImage = `url('assets/${imgName}')`;
        card.innerHTML = `
            <img src="${mob.Image}" class="mob-thumb">
            <div class="card-title">${mob.Name}</div>
            <div class="card-tag"><span class="tag-text ${shrinkClass}">${displayCount}</span></div>
        `;
        // ===================================================================

        card.style.backgroundImage = `url('assets/${imgName}')`;

        // 🎯 ĐÃ SỬA: Vứt bỏ chữ x cũ rích, chỉ truyền displayCount vào thôi
        card.innerHTML = `
            <img src="${mob.Image}" class="mob-thumb">
            <div class="card-title">${mob.Name}</div>
            <div class="card-tag"><span class="tag-text">${displayCount}</span></div>
        `;

        // ===================================================================
        // 🎯 TỰ FIX: CLICK VÀO THẺ HIỆN HÌNH MON FULL MÀN HÌNH 1000PX + OVERLAY TỐI
        // ===================================================================
        card.onclick = () => {
            // 1. Tạo lớp nền tối bao phủ toàn bộ màn hình
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(0, 0, 0, 0.85);
                z-index: 9999999;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.25s ease-out;
            `;

            // 2. Tạo thẻ chứa hình ảnh con Mon phóng to 1000px
            const bigMonImg = document.createElement('img');
            bigMonImg.src = mob.Image;
            bigMonImg.style.cssText = `
                width: 300px;
                height: 300px;
                object-fit: contain;
                pointer-events: none; 
                transform: scale(0.8);
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;

            overlay.appendChild(bigMonImg);
            document.body.appendChild(overlay);

            // Kích hoạt hiệu ứng chuyển động mượt mà
            requestAnimationFrame(() => {
                overlay.style.opacity = "1";
                bigMonImg.style.transform = "scale(1)";
            });

            // 3. Bấm vào lớp overlay nền đen thì tự dọn dẹp biến mất
            overlay.onclick = () => {
                overlay.style.opacity = "0";
                bigMonImg.style.transform = "scale(0.8)";
                setTimeout(() => {
                    overlay.remove();
                }, 250);
            };
        };
        // ===================================================================

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
