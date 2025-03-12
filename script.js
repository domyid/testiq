// Inisialisasi
let minutes = 1;
let seconds = 0;
let question_page = 1;
const question_last_page = 50;
let timerInterval;
let currentQuestionId = "1";
let question = null;
let listJawaban = {}; // Pakai object agar key bisa dimulai dari 1
let isExpired = false;

// API Endpoint
const API_URL = "https://asia-southeast2-awangga.cloudfunctions.net/domyid";

// DOM Elements
const loadingElement = document.getElementById('loading');
const questionContainerElement = document.getElementById('question-container');
const questionTextElement = document.getElementById('question-text');
const questionImageContainer = document.getElementById('question-image-container');
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

    // Tampilkan teks soal
    questionTextElement.innerHTML = htmlDecode(question.question.trim());

    // Tampilkan gambar jika ada
    if (question.image && question.image.trim() !== "") {
        questionImageContainer.innerHTML = `<img src="${question.image}" alt="Gambar Soal" style="max-width:100%; display:block;">`;
    } else {
        questionImageContainer.innerHTML = "";
    }

    // Ganti dengan input text untuk jawaban
    jawabanContainer.innerHTML = `
        <input type="text" id="text-answer" class="text-answer-input" 
               placeholder="Ketik jawaban Anda di sini..." 
               style="width:100%; padding:10px; font-size:16px;">
    `;
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
    timerInterval = setInterval(() => {
        if (minutes === 0 && seconds === 0) {
            clearInterval(timerInterval);
            isExpired = true;
            Swal.fire({
                icon: 'success',
                title: 'Waktu habis.',
                text: 'Terimakasih sudah melakukan tes, hasil IQ kamu akan keluar segera.',
                confirmButtonText: "OK",
            }).then(() => submitJawaban());
            return;
        }
        if (seconds === 0) {
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        updateTimerDisplay();
    }, 1000);
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
            icon: 'warning',
            title: 'Jawaban Kosong!',
            text: 'Silakan isi jawaban sebelum lanjut.',
            confirmButtonText: "OK",
        });
        return;
    }

    // Simpan jawaban ke object, dengan key = question_page
    listJawaban[question_page] = selectedAnswer;

    question_page++;

    // Jika sudah melebihi jumlah soal, kirim jawaban
    if (question_page > question_last_page) {
        submitJawaban();
        return;
    }

    nextButtonElement.disabled = true;
    currentQuestionId = String(parseInt(currentQuestionId) + 1);

    try {
        await getQuestionById(currentQuestionId);
        questionNumberElement.innerText = `Pertanyaan ${question_page} dari ${question_last_page}`;
    } catch (error) {
        console.error("Gagal memuat soal berikutnya:", error);
    } finally {
        nextButtonElement.disabled = false;
    }
}

// Fungsi untuk mengirim jawaban ke backend
function submitJawaban() {
    // Debugging: tampilkan jawaban dengan index 1-based
    console.log("✅ Jawaban yang dikumpulkan (1-based index):");
    for (let qNum in listJawaban) {
        console.log(`${qNum}: ${listJawaban[qNum]}`);
    }

    // Kirim ke backend
    fetch(`${API_URL}/api/iq/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: listJawaban })
    })
    .then(response => response.json())
    .then(data => {
        console.log("🟢 Response dari server:", data);
        Swal.fire({
            icon: 'success',
            title: 'Tes Selesai!',
            text: 'Hasil tes IQ Anda akan segera tersedia.',
            confirmButtonText: "OK",
        });
    })
    .catch(error => console.error("❌ Error submitting answers:", error));
}

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
