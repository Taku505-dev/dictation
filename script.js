let words = [];
let currentWordIndex = 0;
let difficulty = 1;
let score = 0;
let currentWord = '';
let maskedIndices = [];

function generateURL() {
    let wordList = document.getElementById('wordList').value;
    difficulty = parseInt(document.getElementById('difficulty').value);
    
    if (wordList.trim() === "") {
        alert("単語を入力してください。");
        return;
    }

    let encodedWords = encodeURIComponent(wordList);
    let url = `${window.location.href}?words=${encodedWords}&difficulty=${difficulty}`;
    
    document.getElementById('generatedURL').innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
}

function startPractice() {
    let urlParams = new URLSearchParams(window.location.search);
    let encodedWords = urlParams.get('words');
    difficulty = parseInt(urlParams.get('difficulty')) || 1;

    if (encodedWords) {
        words = decodeURIComponent(encodedWords).split('\n').map(word => word.trim()).filter(word => word !== "");
        document.getElementById('teacherSection').style.display = 'none';
        document.getElementById('studentSection').style.display = 'block';
        currentWordIndex = 0;
        score = 0;
        updateProgressBar();
        showNextWord();
    }
}

function showNextWord() {
    if (currentWordIndex < words.length) {
        currentWord = words[currentWordIndex];
        let maskedWord = maskWord(currentWord, difficulty);
        document.getElementById('maskedWord').innerHTML = maskedWord;
        document.getElementById('result').textContent = '';
        updateProgressBar();
    } else {
        showFinalScore();
    }
}

function maskWord(word, level) {
    let masked = word.split('');
    let numToMask = Math.min(level, word.length);
    
    let lowercaseIndices = [];
    for (let i = 0; i < word.length; i++) {
        if (word[i] === word[i].toLowerCase() && word[i] !== word[i].toUpperCase()) {
            lowercaseIndices.push(i);
        }
    }
    
    maskedIndices = [];
    while (maskedIndices.length < numToMask && lowercaseIndices.length > 0) {
        maskedIndices.push(lowercaseIndices.shift());
    }
    
    if (maskedIndices.length < numToMask) {
        let remainingIndices = Array.from({length: word.length}, (_, i) => i)
            .filter(i => !maskedIndices.includes(i));
        while (maskedIndices.length < numToMask && remainingIndices.length > 0) {
            let randomIndex = Math.floor(Math.random() * remainingIndices.length);
            maskedIndices.push(remainingIndices[randomIndex]);
            remainingIndices.splice(randomIndex, 1);
        }
    }
    
    maskedIndices.sort((a, b) => a - b);
    
    let result = '';
    for (let i = 0; i < word.length; i++) {
        if (maskedIndices.includes(i)) {
            result += `<input type="text" class="letter-input" maxlength="1" data-index="${i}">`;
        } else {
            result += word[i];
        }
    }
    
    return result;
}

function playWord() {
    let utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

function checkAnswer() {
    let inputs = document.querySelectorAll('.letter-input');
    let resultElement = document.getElementById('result');
    let allCorrect = true;
    let feedback = '';

    inputs.forEach((input, index) => {
        let studentAnswer = input.value.toLowerCase();
        let correctAnswer = currentWord[maskedIndices[index]].toLowerCase();
        
        if (studentAnswer === correctAnswer) {
            input.style.backgroundColor = '#90EE90';  // Light green for correct
            feedback += `${index + 1}文字目: 正解, `;
        } else {
            input.style.backgroundColor = '#FFB6C1';  // Light red for incorrect
            allCorrect = false;
            feedback += `${index + 1}文字目: 不正解 (正解は "${correctAnswer}"), `;
        }
    });

    if (allCorrect) {
        resultElement.textContent = "全て正解です！";
        resultElement.className = 'correct';
        score++;
        document.getElementById('maskedWord').classList.add('celebrate');
        setTimeout(() => {
            document.getElementById('maskedWord').classList.remove('celebrate');
        }, 500);
    } else {
        resultElement.textContent = feedback.slice(0, -2) + '。';  // Remove last ", " and add period
        resultElement.className = 'incorrect';
    }

    setTimeout(() => {
        currentWordIndex++;
        showNextWord();
    }, 3000);
}

function showFinalScore() {
    document.getElementById('studentSection').style.display = 'none';
    document.getElementById('scoreSection').style.display = 'block';
    document.getElementById('finalScore').textContent = `スコア: ${score}/${words.length}`;
    if (score === words.length) {
        document.getElementById('finalScore').classList.add('celebrate');
    }
}

function resetPractice() {
    window.location.href = window.location.pathname;
}

function updateProgressBar() {
    let progress = (currentWordIndex / words.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

window.onload = startPractice;

// 入力欄の自動フォーカス機能
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('letter-input')) {
        let index = parseInt(e.target.dataset.index);
        if (e.target.value && index < maskedIndices.length - 1) {
            document.querySelector(`.letter-input[data-index="${maskedIndices[maskedIndices.indexOf(index) + 1]}"]`).focus();
        }
    }
});

document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('letter-input')) {
        let index = parseInt(e.target.dataset.index);
        if (e.key === 'Backspace' && !e.target.value && maskedIndices.indexOf(index) > 0) {
            document.querySelector(`.letter-input[data-index="${maskedIndices[maskedIndices.indexOf(index) - 1]}"]`).focus();
        }
    }
});