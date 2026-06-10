/* ==========================================================================
   🎯 TRANSITION SCREEN: MÀN HÌNH CHUYỂN CẢNH CINEMATIC FULL SCREEN
   ========================================================================== */
.transition-screen-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    
    /* 🖼️ NẠP TẤM NỀN CHUYỂN CẢNH MỚI CỦA FEN */
    background: url('assets/Transition_Background.png') no-repeat center/cover;
    
    display: flex;
    justify-content: center;
    align-items: center;
    
    /* Đẩy z-index lên tuyệt đối để đè chặt mọi lớp giao diện khác */
    z-index: 99999; 
    box-sizing: border-box;
}

/* Khung bọc tâm điểm chứa Logo */
.transition-logo-zone {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

/* 🔄 ANIMATION NHÚN NHẢY CHO LOGO GAME (CỰC MƯỢT) */
.transition-bounce-logo {
    height: 30vh !important; /* Scale độ to theo 30% chiều cao màn hình dọc */
    max-height: 400px;
    object-fit: contain;
    animation: transitionLogoBounce 1.2s infinite ease-in-out;
}

/* Trục hoạt ảnh nhún nhịp nhàng lên xuống */
@keyframes transitionLogoBounce {
    0%, 100% {
        transform: translateY(0) scale(1);
    }
    50% {
        transform: translateY(-25px) scale(1.02); /* Nhấc lên và nở nhẹ góc nhìn */
    }
}
