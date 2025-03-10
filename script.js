// src/script.js

// Inisialisasi
let minutes = 11; // menit
let seconds = 59; // detik
let question_page = 1;
const question_last_page = 50; // Sesuaikan dengan jumlah total pertanyaan
let timerInterval;
let questions = []; // Array untuk menyimpan pertanyaan
let currentQuestionIndex = 0;
let jawaban = ""; // Variabel untuk menyimpan jawaban saat ini
let listJawaban = []; // Array untuk menyimpan semua jawaban
let isExpired = false;
const baseUrl = 'http://localhost:8080'; // Ganti dengan URL API Anda

// DOM Elements
const loadingElement = document.getElementById('loading');
const questionContainerElement = document.getElementById('question-container');
const questionTextElement = document.getElementById('question-text');
const jawabanElement = document.getElementById('jawaban');
const nextButtonElement = document.getElementById('next-button');
const questionNumberElement = document.getElementById('question-number');

questionContainerElement.style.display = "none"; // Hidden question form

// Fungsi untuk mengambil pertanyaan dari API
async function getQuestions() {
    try {
        loadingElement.style.display = "flex"; // Show loading
        questionContainerElement.style.display = "none"; // Hidden question form
        
        const response = await fetch(`${baseUrl}/questions`);
        
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        // Cek apakah respons berhasil
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Cek tipe konten
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Expected JSON but received: " + contentType);
        }

        // Ambil data
        const data = await response.json();
        console.log("Data:", data); // Tambahkan log untuk melihat data

        if (data && data.length > 0) {
            questions = data;
            displayQuestion(currentQuestionIndex);
            document.getElementById("question-number").innerText = `Pertanyaan ${question_page} dari ${question_last_page}`;
            loadingElement.style.display = "none"; // Hidden loading
            questionContainerElement.style.display = "block"; // Show question form
        } else {
            throw new Error("No questions found");
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Gagal Memuat Pertanyaan",
            text: error.message, // Tampilkan pesan error
            confirmButtonText: "OK",
        });
    }
}

function displayQuestion(index) {
    const question = questions[index];
    const questionContent = document.getElementById('question-text');

    if (question) {
        // Menampilkan teks pertanyaan menggunakan innerHTML
        questionContent.innerHTML = question.Question;
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
    // Dapatkan jawaban dari textarea
    jawaban = document.getElementById("jawaban").value;

    // Tampilkan SweetAlert untuk konfirmasi
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
            // Simpan jawaban ke dalam array
            listJawaban.push(jawaban);

            if (question_page < question_last_page) {
                question_page++; // Naikkan nomor halaman
            }

            currentQuestionIndex++;
            if (currentQuestionIndex >= questions.length) {
                currentQuestionIndex = 0; // Reset ke awal jika sudah di akhir
            }

            displayQuestion(currentQuestionIndex); // Tampilkan pertanyaan baru
            document.getElementById("jawaban").value = ""; // Reset textarea
            document.getElementById("question-number").innerText = `Pertanyaan ${question_page} dari ${question_last_page}`;
        }
    });
}

async function submitJawaban() {
    try {
        const data = new FormData();
        data.append('answers', JSON.stringify(listJawaban));

        console.log(`siap disubmit jawaban`, listJawaban);
        const response = await fetch(`${baseUrl}/submit-answers`, {
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
            // Lakukan tindakan setelah jawaban dikirim (misalnya, refresh halaman)
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
    getQuestions(); // Muat pertanyaan pertama
    startTimer(); // Mulai timer
    updateTimerDisplay();
};