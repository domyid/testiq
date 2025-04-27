import {getCookie} from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";

// Inisialisasi
let minutes = 12;
let seconds = 0;
let question_page = 1;
const question_last_page = 50;
let timerInterval;
let currentQuestionId = "1";
let question = null;
let listJawaban = [];
let isExpired = false;
let endTime;

// API Endpoint
const API_URL = "https://asia-southeast2-awangga.cloudfunctions.net/domyid";

// DOM Elements
const loadingElement = document.getElementById('loading');
const questionContainerElement = document.getElementById('question-container');
const questionTextElement = document.getElementById('question-text');
let questionImageContainer = document.getElementById('question-image-container');
const jawabanContainer = document.getElementById('jawaban-container');
const questionNumberElement = document.getElementById('question-number');
const minutesElement = document.getElementById("minutes");
const secondsElement = document.getElementById("seconds");
const nextButtonElement = document.getElementById('next-button');

// Fungsi decode HTML entities
function htmlDecode(input) {
    let e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

// Fungsi untuk menampilkan soal
function displayQuestion() {
    if (!question || !question.question) {
        console.error("Soal tidak ditemukan!", question);
        questionTextElement.innerHTML = "<strong>Soal tidak tersedia.</strong>";
        return;
    }

    // Menampilkan teks soal
    questionTextElement.innerHTML = (question.question);

    // Menampilkan soal gambar
    if (question.image && question.image.trim() !== "") {
        questionImageContainer.innerHTML = `<img src="${question.image}" alt="Gambar Soal" style="max-width:100%; display:block;">`;
    } else {
        questionImageContainer.innerHTML = "";
    }

    // Menggunakan input text untuk jawaban
    jawabanContainer.innerHTML = `
        <input type="text" id="text-answer" class="text-answer-input"
               placeholder="Ketik jawaban Anda di sini..."
               style="width:100%; padding:10px; font-size:16px;">
    `;
    focusInput();
}

// Fungsi untuk mengambil soal berdasarkan ID
async function getQuestionById(id) {
    try {
        loadingElement.style.display = "flex";
        questionContainerElement.style.display = "none";

        const response = await fetch(`${API_URL}/api/iq/question/${id}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        question = data;

        loadingElement.style.display = "none";
        questionContainerElement.style.display = "block";
        displayQuestion();
    } catch (error) {
        console.error("Error fetching question by ID:", error);
        Swal.fire({
            icon: "error",
            title: "Gagal Memuat Soal",
            text: error.message,
            confirmButtonText: "OK",
        });
    }
}

// Fungsi untuk memperbarui tampilan timer
function updateTimerDisplay() {
    minutesElement.innerText = String(minutes).padStart(2, '0');
    secondsElement.innerText = String(seconds).padStart(2, '0');
}

// Fungsi untuk memulai timer
function startTimer() {
    const totalSeconds = 12 * 60; // 12 menit = 720 detik

    // Cek apakah endTime sudah ada di localStorage
    if (localStorage.getItem('endTime')) {
        endTime = parseInt(localStorage.getItem('endTime'));
    } else {
        endTime = Date.now() + totalSeconds * 1000;
        localStorage.setItem('endTime', endTime);
    }

    timerInterval = setInterval(() => {
        const now = Date.now();
        const distance = endTime - now;

        if (distance <= 0) {
            clearInterval(timerInterval);
            localStorage.removeItem('endTime'); // Bersihkan endTime setelah selesai
            minutes = 0;
            seconds = 0;
            updateTimerDisplay();
            isExpired = true;
            Swal.fire({
                icon: 'success',
                title: 'Waktu habis.',
                text: 'Terimakasih sudah melakukan tes IQ, hasil IQ kamu akan segera keluar.',
                confirmButtonText: "OK",
            }).then(() => {
                processResults();
            });
            return;
        }

        minutes = Math.floor((distance / 1000) / 60);
        seconds = Math.floor((distance / 1000) % 60);

        updateTimerDisplay();
    }, 1000);
}

// [NEW] Fungsi untuk memproses hasil setelah submit
async function processResults() {
    console.log("📌 Mengirim jawaban pengguna:", listJawaban);

    let token = getCookie("login");

    if (!token) {
        console.warn("❌ Token tidak ditemukan! Login lalu menuju URL https://do.my.id/testiq");
        window.location.href = "https://do.my.id/signin/";
        return;
    }

    try {
        // Ambil nama pengguna dari backend (bukan dari backend)
        let userResponse = await fetch(`${API_URL}/api/iq/new`, {
            method: "GET",
            headers: { "login": token }
        });

        let userData = await userResponse.json();
        if (!userResponse.ok) throw new Error(`Gagal mendapatkan data user! ${userData.error}`);

        let userName = userData.name || "Anonim"; // Gunakan nama dari token, default ke 'Anonim'

        // Mengirim jawaban ke backend
        let response = await fetch(`${API_URL}/api/iq/answer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "login": token
            },
            body: JSON.stringify({ name: userName, answers: listJawaban }) // Gunakan nama dari backend
        });

        let data = await response.json();
        if (!response.ok) throw new Error(`Gagal menyimpan hasil tes! ${data.error}`);

        console.log("✅ Jawaban berhasil dikirim:", data);
        window.location.href = "hasiltestiq.html";

    } catch (error) {
        console.error("❌ Error saat mengirim jawaban:", error);
        Swal.fire({
            icon: "error",
            title: "Gagal Menyimpan Jawaban",
            text: error.message,
            confirmButtonText: "OK",
        });
    }
}


// Fungsi untuk ke soal berikutnya
async function initNextQuestion() {
    let selectedAnswer = "";
    const textAnswer = document.getElementById("text-answer");

    if (textAnswer) {
        selectedAnswer = textAnswer.value.trim();
    }

    if (!selectedAnswer) {
        Swal.fire({
            icon: "warning",
            title: "Jawaban Kosong!",
            text: "Silakan isi jawaban sebelum lanjut.",
            confirmButtonText: "OK",
        });
        return;
    }

    
    console.log("User answer:", selectedAnswer);
    listJawaban.push(selectedAnswer);

    if (question_page >= question_last_page) {
        // Jika sudah sampai soal terakhir, ubah tombol menjadi "Selesai"
        nextButtonElement.innerText = "Selesai";
        nextButtonElement.removeEventListener("click", initNextQuestion);
        nextButtonElement.addEventListener("click", processResults);
        return;
    }

    question_page++;
    currentQuestionId = String(parseInt(currentQuestionId) + 1);

    try {
        await getQuestionById(currentQuestionId);
        questionNumberElement.innerText = `Pertanyaan ${question_page} dari ${question_last_page}`;

        // Jika ini pertanyaan terakhir (50), ubah tombol menjadi "Selesai"
        if (question_page == question_last_page) {
            nextButtonElement.innerText = "Selesai";
            nextButtonElement.removeEventListener("click", initNextQuestion);
            nextButtonElement.addEventListener("click", processResults);
        }
    } catch (error) {
        console.error("Gagal memuat soal berikutnya:", error);
    }
}

function focusInput() {
    const input = document.getElementById("text-answer");
    if (input) {
        input.focus();
    }
}

// Saat tombol enter ditekan, trigger tombol Selanjutnya
document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        nextButtonElement.click();
    }
});


// Saat dokumen siap
document.addEventListener("DOMContentLoaded", function() {
    if (!nextButtonElement) {
        console.error("❌ Error: Tombol 'Selanjutnya' tidak ditemukan di DOM!");
        return;
    }
    nextButtonElement.addEventListener("click", initNextQuestion);


    getQuestionById(currentQuestionId);
    startTimer();
    updateTimerDisplay();
});
