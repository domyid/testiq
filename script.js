// Inisialisasi
let minutes = 1;
let seconds = 0;
let question_page = 1;
const question_last_page = 50;
let timerInterval;
let currentQuestionId = "1";
let question = null;
let jawaban = "";
let listJawaban = [];
let isExpired = false;

// DOM Elements
const loadingElement = document.getElementById('loading');
const questionContainerElement = document.getElementById('question-container');
const questionTextElement = document.getElementById('question-text');
const questionImageContainer = document.getElementById('question-image-container');
const jawabanContainer = document.getElementById('jawaban-container');
const nextButtonElement = document.getElementById('next-button');
const questionNumberElement = document.getElementById('question-number');
const minutesElement = document.getElementById("minutes");
const secondsElement = document.getElementById("seconds");

questionContainerElement.style.display = "none";

const API_URL = "https://asia-southeast2-awangga.cloudfunctions.net/domyid";

// Fungsi untuk decode HTML entities
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

    let soalUtama = question.question.trim();
    questionTextElement.innerHTML = htmlDecode(soalUtama);

    if (question.image && question.image.trim() !== "") {
        questionImageContainer.innerHTML = `<img src="${question.image}" alt="Gambar Soal" style="max-width:100%; display:block;">`;
    } else {
        questionImageContainer.innerHTML = "";
    }

    jawabanContainer.innerHTML = `
        <input type="text" id="text-answer" class="text-answer-input" placeholder="Ketik jawaban Anda di sini..." style="width:100%; padding:10px; font-size:16px;">
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
                text: 'Terimakasih sudah melakukan test, hasil IQ kamu akan keluar segera.',
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
// Fungsi untuk ke soal berikutnya
async function initNextQuestion() {
    let selectedAnswer = "";
    
    // Periksa apakah ini soal dengan jawaban teks
    const textAnswer = document.getElementById("text-answer");
    if (textAnswer) {
        selectedAnswer = textAnswer.value.trim();
    } 
    // Jika bukan jawaban teks, periksa radio/checkbox
    else {
        // Periksa apakah ini soal dengan jawaban ganda (multiple answer)
        const checkedBoxes = document.querySelectorAll('input[name="jawaban"]:checked');
        
        // Jika minimal satu pilihan dipilih
        if (checkedBoxes.length > 0) {
            // Cek apakah ini soal butuh jawaban ganda (checkbox)
            let isMultipleAnswer = false;
            if (question && question.question) {
                isMultipleAnswer = /\d+\s*dan\s*\d+/i.test(question.question);
            }
            
            if (isMultipleAnswer) {
                // Untuk soal jawaban ganda, minimal harus 2 pilihan (jika tersedia)
                if (checkedBoxes.length < 2) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Pilih 2 Jawaban',
                        text: 'Soal ini membutuhkan 2 jawaban. Silakan pilih 2 jawaban.',
                        confirmButtonText: "OK",
                    });
                    return;
                }
                
                // Kumpulkan semua jawaban yang dipilih dan gabungkan
                const answers = Array.from(checkedBoxes).map(cb => cb.value);
                selectedAnswer = answers.join(" dan ");
            } else {
                // Untuk soal jawaban tunggal, ambil nilai dari elemen yang dipilih
                selectedAnswer = checkedBoxes[0].value;
            }
        }
    }

    if (!selectedAnswer) {
        Swal.fire({
            icon: 'warning',
            title: 'Jawaban Kosong!',
            text: 'Silakan pilih atau isi jawaban sebelum lanjut.',
            confirmButtonText: "OK",
        });
        return;
    }

    nextButtonElement.disabled = true;
    listJawaban.push(selectedAnswer);

    question_page++;
    
    // Cek apakah sudah mencapai soal terakhir
    if (question_page > question_last_page) {
        submitJawaban(); // Panggil fungsi submit untuk menampilkan alert sukses
        return;
    }

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

// Fungsi untuk mengirim jawaban
async function submitJawaban() {
    try {
        loadingElement.style.display = "flex";
        questionContainerElement.style.display = "none";
        
        const response = await fetch(`${API_URL}/api/iq/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: listJawaban }),
        });
        
        const textData = await response.text(); // Ambil data sebagai teks dulu

try {
    const jsonData = JSON.parse(textData); // Coba parsing sebagai JSON
    Swal.fire({
        icon: 'success',
        title: 'Jawaban Dikirim',
        text: `Skor Anda: ${jsonData.score}`,
        confirmButtonText: "OK"
    });
} catch (error) {
    console.error("Error parsing response:", textData); // Tampilkan jika ada error parsing
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan dalam mengambil skor.',
        confirmButtonText: "OK"
    });
}

        const responseData = await response.json();
        const scoreResponse = await fetch(`${API_URL}/api/iqscoring`);
        const scoreData = await scoreResponse.json();

        loadingElement.style.display = "none";
        Swal.fire({
            icon: 'success',
            title: 'Jawaban Dikirim',
            text: `Skor Anda: ${scoreData.score}`,
            confirmButtonText: "OK"
        }).then(() => {
            window.location.href = "/hasiltest.html";
        });
    } catch (error) {
        console.error("Error submitting answers:", error);
    }
}

nextButtonElement.addEventListener("click", initNextQuestion);
window.onload = () => {
    getQuestionById(currentQuestionId);
    startTimer();
    updateTimerDisplay();
};

document.addEventListener("DOMContentLoaded", function () {
    const questionTextElement = document.getElementById('question-text');
    if (!questionTextElement) {
        console.error("Elemen question-text tidak ditemukan!");
        return;
    }
});