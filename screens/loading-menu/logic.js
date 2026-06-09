// ==========================================
// 🤖 MÔ-ĐUN LOGIC TÁCH BIỆT: MÀN HÌNH LOADING
// ==========================================

function initGameEngine() {
    // Kích hoạt tiến trình nạp tài nguyên bảo vệ ngay khi màn hình loading xuất hiện
    triggerDataFetching();
}

async function triggerDataFetching() {
    const fill = document.getElementById('loading-bar-fill');
    const txt = document.getElementById('loading-text');
    
    if (fill) fill.style.width = "10%";
    if (txt) txt.innerText = "Connecting to Google Sheets... (10%)";
    
    try {
        // 1. Kéo dữ liệu CSV thực tế để lùng sục danh sách ảnh quái vật, ảnh card vinh danh
        const [mobsResponse, questionsResponse] = await Promise.all([
            fetch(MOBS_CSV_URL).then(res => res.text()),
            fetch(QUESTIONS_CSV_URL).then(res => res.text())
        ]);

        globalMobList = parseCSV(mobsResponse);
        globalQuestionList = parseCSV(questionsResponse);

        if (fill) fill.style.width = "25%";
        if (txt) txt.innerText = "Scanning device storage... (25%)";

        // Tập hợp toàn bộ asset cốt lõi của hệ thống sảnh, trận đấu và nút bấm
        let fullAssetsList = [
            '../../assets/Btn_Start.png', '../../assets/Btn_Start_Pressed.png',
            '../../assets/Btn_Collection.png', '../../assets/Btn_Collection_Pressed.png',
            '../../assets/UI_Answer_Box.png', '../../assets/UI_Answer_Box_Pressed.png',
            '../../assets/UI_Question_Box.png', '../../assets/Btn_Back.png',
            '../../assets/Btn_Back_Pressed.png', '../../assets/Btn_Collection_Icon.png',
            '../../assets/Btn_Collection_Icon_Pressed.png', '../../assets/Btn_Backpack_Icon.png',
            '../../assets/Btn_Backpack_Icon_Pressed.png', '../../assets/Btn_Setting_Icon.png',
            '../../assets/Btn_Setting_Icon_Pressed.png', '../../assets/Collection_Page_Btn.png',
            '../../assets/Collection_Page_Btn_Pressed1.png', '../../assets/Collection_Page_Btn_Pressed2.png',
            '../../assets/Tag_Icon.png', '../../assets/VFX_Smoke.png',
            '../../assets/VFX_Ball_Open.png', '../../assets/VFX_Ball_Close.png',
            '../../assets/VFX_Star_Shiny.png', '../../assets/Player_Male_Main.png',
            '../../assets/Player_Female_Main.png', '../../assets/Player_Male_Back.png',
            '../../assets/Player_Female_Back.png', '../../assets/Nametag_lv1.png',
            '../../assets/Nametag_lv2.png', '../../assets/Nametag_lv3.png',
            '../../assets/Nametag_lv4.png', '../../assets/Nametag_lv5.png',
            '../../assets/BG_Desert.png', '../../assets/BG_Forest.png',
            '../../assets/BG_Snow.png', '../../assets/BG_Volcano.png'
        ];

        // 🎯 QUÉT SẠCH QUÁI VÀ CARD: Gom link ảnh quái, phôi card lv từ Sheet theo đúng feedback
        globalMobList.forEach(mob => {
            if (mob.Image && mob.Image.trim() !== "") {
                fullAssetsList.push(mob.Image);
            }
            fullAssetsList.push(`../../assets/Card_lv${mob.Stars}.png`);
            fullAssetsList.push(`../../assets/Card_lv${mob.Stars}_S.png`);
        });

        // Tự động quét sạch dấu cách trống gớm ghiếc thay bằng dấu gạch dưới _
        fullAssetsList = fullAssetsList.map(url => !url.startsWith('http') ? url.replace(/\s+/g, '_') : url);
        fullAssetsList = [...new Set(fullAssetsList)];

        // 🛠️ BỘ KIỂM TRA THÔNG MINH: Đối chiếu xem những file nào đã lưu ở ổ cứng máy (Cache) rồi
        let assetsToPreload = [];
        let gameCacheStore = null;

        if ('caches' in window) {
            gameCacheStore = await caches.open(CACHE_NAME);
            for (let url of fullAssetsList) {
                const hasCache = await gameCacheStore.match(url);
                if (!hasCache) {
                    assetsToPreload.push(url); // Chưa có thì mới nhét vào hàng đợi tải
                }
            }
        } else {
            assetsToPreload = fullAssetsList;
        }

        let loadedCount = 0;
        const totalAssets = assetsToPreload.length;

        // 🔥 NẾU ĐÃ CÓ SẴN TRÊN MÁY (THEO Ý FEN): Đẩy vèo cây loading lên 100%, sập rèm, mở sảnh liền!
        if (totalAssets === 0) {
            if (fill) fill.style.width = "100%";
            if (txt) txt.innerText = "Smart Storage Matched! Loading 100%";
            setTimeout(proceedToCloseLoadingGate, 400);
            return;
        }

        // LUỒNG TẢI DỰ PHÒNG: Chỉ tải những file thực sự còn thiếu từ internet về
        function assetLoaded(url, success) {
            loadedCount++;
            // Tính toán phần trăm lũy tiến thực tế bắt đầu từ mốc 25% sau khi đọc xong Sheet
            let progress = 25 + Math.floor((loadedCount / totalAssets) * 75);
            
            if (fill) fill.style.width = `${progress}%`;
            if (txt) txt.innerText = `Downloading missing files: ${loadedCount}/${totalAssets} (${progress}%)`;

            if (success && gameCacheStore && !url.startsWith('http')) {
                gameCacheStore.add(url).catch(() => {});
            }

            if (loadedCount === totalAssets) {
                if (txt) txt.innerText = "All assets successfully synchronized! (100%)";
                setTimeout(proceedToCloseLoadingGate, 500);
            }
        }

        assetsToPreload.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = () => assetLoaded(url, true);
            img.onerror = () => assetLoaded(url, false); // File lỗi vẫn cho qua để tránh treo cứng game
        });

    } catch (error) {
        console.error(error);
        proceedToCloseLoadingGate();
    }
}

// Tải xong sạch bóng quân thù -> Hạ mờ dần lớp phủ Loading, nhường sân khấu gọi Main Menu lên
function proceedToCloseLoadingGate() {
    const loadingContainer = document.getElementById('loading-bar-container');
    if (loadingContainer) {
        loadingContainer.style.opacity = "0"; 
        setTimeout(() => {
            loadingContainer.style.display = "none";
            
            // 🚀 CHUYỂN GIAO NHIỆM VỤ: Gọi lệnh mở toang màn hình Sảnh chính (main-menu)
            loadScreen('main-menu', initMainMenuLogic);
        }, 800);
    }
}
