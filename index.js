import { getCookie } from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";

async function verifyLogin() {
    let token = getCookie("login");

    if (!token) {
        console.warn("❌ Token tidak ditemukan! Redirect ke halaman login...");
        window.location.href = "do.my.id/signin";
        return;
    }

    console.log("✅ Token ditemukan:", token);
}

// Panggil fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", verifyLogin);
