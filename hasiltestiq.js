import { getCookie } from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";

// API Endpoint
const API_URL = "https://asia-southeast2-awangga.cloudfunctions.net/domyid";

// DOM Elements
const resultContainer = document.getElementById("result-container");
const userNameElement = document.getElementById("user-name");
const scoreElement = document.getElementById("score");
const iqElement = document.getElementById("iq");
const datetimeElement = document.getElementById("datetime");

// Fungsi untuk mengambil hasil tes IQ
async function getIqTestResult() {
    console.log("📌 Mengambil hasil tes IQ...");

    let token = getCookie("login");

    if (!token) {
        console.warn("❌ Token tidak ditemukan! Harap login terlebih dahulu.");
        window.location.href = "do.my.id"; // Redirect ke halaman login
        return;
    }

    try {
        let response = await fetch(`${API_URL}/api/iq/user`, {
            method: "GET",
            headers: { "login": token }
        });

        let data = await response.json();

        if (!response.ok) {
            throw new Error(`Gagal mengambil hasil tes! ${data.error}`);
        }

        console.log("✅ Hasil tes berhasil diambil:", data);

        // Tampilkan data hasil tes di halaman
        userNameElement.textContent = data.name;
        scoreElement.textContent = data.score;
        iqElement.textContent = data.iq;
        datetimeElement.textContent = data.datetime;

        resultContainer.style.display = "block";

    } catch (error) {
        console.error("❌ Error saat mengambil hasil tes:", error);
        alert("Terjadi kesalahan saat mengambil hasil tes. Silakan coba lagi.");
    }
}

// Saat dokumen siap, ambil hasil tes
document.addEventListener("DOMContentLoaded", function() {
    getIqTestResult();
});
