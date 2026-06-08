// ==========================================
// 🚀 LUỒNG PRELOAD BẢO VỆ CHỐNG KẸT 404 KHI SAI DẤU GẠCH DƯỚI
// ==========================================
async function triggerDataFetching() {
    const fill = document.getElementById('loading-bar-fill');
    const txt = document.getElementById('loading-text');
    
    if (fill) fill.style.width = "10%";
    if (txt) txt.innerText = "Connecting to Google Sheets...";
    
    try {
        const [mobsResponse, questionsResponse] = await Promise.all([
            fetch(MOBS_CSV_URL).then(res => res.text()),
            fetch(QUESTIONS_CSV_URL).then(res => res.text())
        ]);

        globalMobList = parseCSV(mobsResponse);
        globalQuestionList = parseCSV(questionsResponse);

        if (fill) fill.style.width = "30%";
        if (txt) txt.innerText = "Analyzing game data...";

        // Danh sách asset cốt lõi cố định
        let assetsToPreload = [
            '../../assets/Btn_Start.png',
            '../../assets/Btn_Start_Pressed.png',
            '../../assets/Btn_Collection.png',
            '../../assets/Btn_Collection_Pressed.png',
            '../../assets/UI_Answer_Box.png',
            '../../assets/UI_Answer_Box_Pressed.png',
            '../../assets/UI_Question_Box.png',
            '../../assets/Btn_Back.png',
            '../../assets/Btn_Back_Pressed.png',
            '../../assets/Btn_Collection_Icon.png',
            '../../assets/Btn_Collection_Icon_Pressed.png',
            '../../assets/Btn_Backpack_Icon.png',
            '../../assets/Btn_Backpack_Icon_Pressed.png',
            '../../assets/Btn_Setting_Icon.png',
            '../../assets/Btn_Setting_Icon_Pressed.png',
            '../../assets/Collection_Page_Btn.png',
            '../../assets/Collection_Page_Btn_Pressed1.png',
            '../../assets/Collection_Page_Btn_Pressed2.png',
            '../../assets/Tag_Icon.png',
            '../../assets/VFX_Smoke.png',
            '../../assets/VFX_Ball_Open.png',
            '../../assets/VFX_Ball_Close.png',
            '../../assets/VFX_Star_Shiny.png',
            '../../assets/Player_Male_Main.png',
            '../../assets/Player_Female_Main.png',
            '../../assets/Player_Male_Back.png',
            '../../assets/Player_Female_Back.png',
            '../../assets/Nametag_lv1.png',
            '../../assets/Nametag_lv2.png',
            '../../assets/Nametag_lv3.png',
            '../../assets/Nametag_lv4.png',
            '../../assets/Nametag_lv5.png',
            '../../assets/BG_Desert.png',
            '../../assets/BG_Forest.png',
            '../../assets/BG_Snow.png',
            '../../assets/BG_Volcano.png'
        ];

        globalMobList.forEach(mob => {
            if (mob.Image && mob.Image.trim() !== "") {
                assetsToPreload.push(mob.Image);
            }
            assetsToPreload.push(`../../assets/Card_lv${mob.Stars}.png`);
            assetsToPreload.push(`../../assets/Card_lv${mob.Stars}_S.png`);
        });

        // 🛠️ SỬA ĐỔI CHÍ MẠNG: Tự động lùng tìm dấu cách rỗng ' ' và ép thay bằng dấu gạch dưới '_' cho đúng asset thật
        assetsToPreload = assetsToPreload.map(url => {
            // Chỉ thay thế phần tên file phía sau, giữ nguyên link gốc nếu là link ảnh quái vật dạng URL
            if (!url.startsWith('http')) {
                return url.replace(/\s+/g, '_'); 
            }
            return url;
        });

        assetsToPreload = [...new Set(assetsToPreload)];

        let loadedCount = 0;
        const totalAssets = assetsToPreload.length;

        // 🛡️ BẢO VỆ TUYỆT ĐỐI: Nếu không có ảnh hoặc lỗi, bấm nhảy thẳng vào game, cấm kẹt cứng màn hình
        if (totalAssets === 0) {
            if (fill) fill.style.width = "100%";
            proceedToLogin();
            return;
        }

        function assetLoaded() {
            loadedCount++;
            let progress = 30 + Math.floor((loadedCount / totalAssets) * 70);
            if (fill) fill.style.width = `${progress}%`;
            if (txt) txt.innerText = `Loading Assets: ${loadedCount}/${totalAssets} (Please wait...)`;

            if (loadedCount === totalAssets) {
                if (txt) txt.innerText = "All assets successfully loaded! Ready to Play.";
                setTimeout(proceedToLogin, 600);
            }
        }

        // Kích hoạt vòng lặp nạp ảnh ngầm
        assetsToPreload.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = assetLoaded;
            // 🚀 CHỮA CHÁY KHẨN CẤP: Nếu file ảnh đó có bị sập link hoặc lỗi 404, game VẪN ĐẾM TIẾP để cho bé vào chơi chứ KHÔNG ĐƯỢC KẸT CỨNG MÀN HÌNH LOADING!
            img.onerror = () => {
                console.warn("Bỏ qua file ảnh lỗi: " + url);
                assetLoaded(); 
            }; 
        });

    } catch (error) {
        // Đề phòng sập mạng Sheet, vẫn mở cửa cho vào game test
        console.error(error);
        proceedToLogin();
    }
}
