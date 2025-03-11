// Inisialisasi
let minutes = 11;
let seconds = 59;
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
console.log(questionTextElement); // Harusnya tidak null
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

    console.log("Menampilkan soal:", question);

    // Pisahkan soal dan pilihan jawaban
    const questionParts = question.question.split("<br>");
    const soalUtama = questionParts.shift().trim();
    const pilihanJawaban = questionParts.map(option => option.trim()).filter(option => option !== "");

    // Tampilkan soal utama
    questionTextElement.innerHTML = htmlDecode(soalUtama);

    // Tampilkan gambar jika tersedia
    if (question.image && question.image.trim() !== "") {
        questionImageContainer.innerHTML = `<img src="${question.image}" alt="Gambar Soal" style="max-width:100%; display:block;">`;
    } else {
        questionImageContainer.innerHTML = "";
    }

    // Hapus jawaban lama sebelum menampilkan yang baru
    jawabanContainer.innerHTML = "";

    if (pilihanJawaban.length > 0) {
        let optionsHTML = "<ul>";
        pilihanJawaban.forEach(option => {
            optionsHTML += `
                <li>
                    <label>
                        <input type="radio" name="jawaban" value="${option}">
                        ${option}
                    </label>
                </li>
            `;
        });
        optionsHTML += "</ul>";
        jawabanContainer.innerHTML = optionsHTML;
    } else {
        jawabanContainer.innerHTML = `<textarea id="jawaban-input" placeholder="Masukkan jawaban di sini..."></textarea>`;
    }
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
async function initNextQuestion() {
    const selectedAnswer = document.querySelector('input[name="jawaban"]:checked') 
                            ? document.querySelector('input[name="jawaban"]:checked').value 
                            : document.getElementById("jawaban-input") 
                            ? document.getElementById("jawaban-input").value.trim() 
                            : "";

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
    currentQuestionId = String(parseInt(currentQuestionId) + 1); 

    if (question_page > question_last_page) {
        submitJawaban();
        return;
    }

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
        const response = await fetch(`${API_URL}/submit-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: listJawaban }),
        });
        const responseData = await response.json();
        Swal.fire({
            icon: 'success',
            title: 'Jawaban Dikirim',
            text: responseData.message,
            confirmButtonText: "OK",
        }).then(() => location.reload());
    } catch (error) {
        console.error("Error submitting answers:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Terjadi kesalahan saat mengirim jawaban.',
            confirmButtonText: "OK",
        });
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