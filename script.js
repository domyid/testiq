// src/script.js

// Inisialisasi
let minutes = 11;
let seconds = 59;
let question_page = 1;
const question_last_page = 50;
let timerInterval;
let questions = [];
let currentQuestionIndex = 0;
let jawaban = "";
let listJawaban = [];
let isExpired = false;

// DOM Elements
const loadingElement = document.getElementById('loading');
const questionContainerElement = document.getElementById('question-container');
const questionTextElement = document.getElementById('question-text');
const jawabanElement = document.getElementById('jawaban');
const nextButtonElement = document.getElementById('next-button');
const questionNumberElement = document.getElementById('question-number');

questionContainerElement.style.display = "none";

const API_URL = "https://asia-southeast2-awangga.cloudfunctions.net/domyid";

function getElement(id) {
    return document.getElementById(id);
}

// Fungsi untuk menampilkan soal
function displayQuestion(index) {
    const question = questions[index];
    const questionContent = document.getElementById('question-text');

    if (question) {
        questionContent.innerHTML = question.Question;

        if (question.Image) {
            questionContent.innerHTML += `<br><img src="${question.Image}" alt="Gambar Soal">`;
        }
    }
}

// Fungsi untuk mengambil soal berdasarkan ID
async function getQuestionById(id) {
    try {
        loadingElement.style.display = "flex";
        questionContainerElement.style.display = "none";

        const response = await fetch(`${API_URL}/data/iq/questions/${id}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Expected JSON but received: " + contentType);
        }

        const data = await response.json();
        console.log("Question data by ID:", data);

        loadingElement.style.display = "none";
        questionContainerElement.style.display = "block";

        // Lakukan sesuatu dengan soal yang diambil berdasarkan ID, misalnya menampilkannya
        displayQuestion([data]); // Menampilkan soal
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

// Fungsi untuk mengambil semua soal
async function getQuestions() {
    try {
        loadingElement.style.display = "flex";
        questionContainerElement.style.display = "none";

        const response = await fetch(`${API_URL}/data/iq/questions`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Expected JSON but received: " + contentType);
        }

        const data = await response.json();
        console.log("All Questions Data:", data);

        if (data && data.length > 0) {
            questions = data;
            displayQuestion(currentQuestionIndex);
            document.getElementById("question-number").innerText = `Pertanyaan ${question_page} dari ${question_last_page}`;
            loadingElement.style.display = "none";
            questionContainerElement.style.display = "block";
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Tidak ada soal',
                text: data.message || 'Tidak ada soal IQ yang tersedia.',
                confirmButtonText: 'OK'
            });
            throw new Error(data.message || "No questions found");
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Gagal Memuat Pertanyaan",
            text: error.message,
            confirmButtonText: "OK",
        });
    }
}

function updateTimerDisplay() {
    document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
    document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (minutes === 0 && seconds === 0) {
            clearInterval(timerInterval);
            isExpired = true;
            Swal.fire({
                icon: 'success',
                title: 'Waktu habis.',
                text: 'Terimakasih sudah melakukan test, hasil IQ kamu akan keluar segera.',
                confirmButtonText: "OK",
            }).then((result) => {
                if (result.isConfirmed) {
                    submitJawaban();
                }
            });
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

async function initNextQuestion() {
    jawaban = document.getElementById("jawaban").value;

    Swal.fire({
        icon: 'question',
        title: 'Pindah ke soal selanjutnya?',
        text: jawaban !== '' ? 'Sudah yakin dengan jawabanmu?.' : 'Jawaban belum diisi, yakin untuk pindah soal?.',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonColor: "#0b40f4",
        confirmButtonText: "Ya, yakin",
        cancelButtonColor: "#3b3f5c",
        cancelButtonText: "Batal",
    }).then(async (result) => {
        if (result.isConfirmed) {
            listJawaban.push(jawaban);

            if (question_page < question_last_page) {
                question_page++;
            }

            currentQuestionIndex++;
            if (currentQuestionIndex >= questions.length) {
                currentQuestionIndex = 0;
            }

            displayQuestion(currentQuestionIndex);
            document.getElementById("jawaban").value = "";
            document.getElementById("question-number").innerText = `Pertanyaan ${question_page} dari ${question_last_page}`;
        }
    });
}

async function submitJawaban() {
    try {
        const data = new FormData();
        data.append('answers', JSON.stringify(listJawaban));

        console.log(`siap disubmit jawaban`, listJawaban);
        const response = await fetch(`${API_URL}/submit-answers`, {
            method: 'POST',
            body: data,
        });
        const responseData = await response.json();

        Swal.fire({
            icon: 'success',
            title: 'Jawaban Dikirim',
            text: responseData.message,
            confirmButtonText: "OK",
        }).then(() => {
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error Terjadi',
            text: 'Error saat mengirim data jawaban',
            confirmButtonText: "OK",
        });
    }
}

// Attach event listener ke tombol "Selanjutnya"
document.getElementById("next-button").addEventListener("click", () => {
    initNextQuestion();
});

// Mencegah form submit saat menekan Enter di textarea
document.getElementById("jawaban").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        initNextQuestion();
    }
});

// Inisialisasi saat halaman dimuat
window.onload = () => {
    getQuestions(); // Muat daftar soal
    startTimer(); // Mulai timer
    updateTimerDisplay();
};
