// Quote Categories Database
const QUOTE_CATEGORIES = {
    mixed: [
        "The only way to do great work is to love what you do.",
        "Life is what happens when you're busy making other plans.",
        "The future belongs to those who believe in the beauty of their dreams.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "Innovation distinguishes between a leader and a follower."
    ],
    technology: [
        "The advance of technology is based on making it fit in so that you don't really even notice it.",
        "Technology is best when it brings people together.",
        "It has become appallingly obvious that our technology has exceeded our humanity.",
        "The Web as I envisaged it, we have not seen it yet. The future is still so much bigger than the past.",
        "Artificial intelligence will reach human levels by around 2029."
    ],
    motivational: [
        "Believe you can and you're halfway there.",
        "The only limit to our realization of tomorrow will be our doubts of today.",
        "Don't watch the clock; do what it does. Keep going.",
        "The secret of getting ahead is getting started.",
        "Your time is limited, don't waste it living someone else's life."
    ],
    programming: [
        "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
        "First, solve the problem. Then, write the code.",
        "Experience is the name everyone gives to their mistakes.",
        "Java is to JavaScript what car is to carpet.",
        "The function of good software is to make the complex appear to be simple."
    ],
    science: [
        "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
        "Science is a way of thinking much more than it is a body of knowledge.",
        "The good thing about science is that it's true whether or not you believe in it.",
        "Equipped with his five senses, man explores the universe around him and calls the adventure Science.",
        "Somewhere, something incredible is waiting to be known."
    ],
    literature: [
        "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        "It was the best of times, it was the worst of times.",
        "Call me Ishmael.",
        "Happy families are all alike; every unhappy family is unhappy in its own way.",
        "All animals are equal, but some animals are more equal than others."
    ],
    philosophy: [
        "I think, therefore I am.",
        "The unexamined life is not worth living.",
        "One cannot step twice in the same river.",
        "The happiness of your life depends upon the quality of your thoughts.",
        "It does not matter how slowly you go as long as you do not stop."
    ]
};

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: {
        timeMultiplier: 1.2,
        textLength: 'short',
        allowBackspace: true,
        showHints: true
    },
    medium: {
        timeMultiplier: 1,
        textLength: 'medium',
        allowBackspace: true,
        showHints: false
    },
    hard: {
        timeMultiplier: 0.8,
        textLength: 'long',
        allowBackspace: false,
        showHints: false
    }
};

// DOM Elements
const quoteDisplayElement = document.querySelector("#quoteDisplay");
const quoteInputElement = document.querySelector("#quoteInput");
const timerElement = document.querySelector("#timer");
const wpmElement = document.querySelector("#wpm");
const accuracyElement = document.querySelector("#accuracy");
const categorySelect = document.querySelector("#category");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");
const newQuoteBtn = document.querySelector("#newQuoteBtn");
const resetBtn = document.querySelector("#resetBtn");
const typedCountElement = document.querySelector("#typedCount");
const totalCharsElement = document.querySelector("#totalChars");
const resultsModal = document.querySelector("#resultsModal");
const tryAgainBtn = document.querySelector("#tryAgainBtn");
const resultTime = document.querySelector("#resultTime");
const resultWPM = document.querySelector("#resultWPM");
const resultAccuracy = document.querySelector("#resultAccuracy");
const resultChars = document.querySelector("#resultChars");

// Game State
let currentDifficulty = "easy";
let currentCategory = "mixed";
let startTime = null;
let timerInterval = null;
let gameActive = false;
let totalErrors = 0;
let totalTyped = 0;
let currentQuote = "";

// Initialize the game
function init() {
    setupEventListeners();
    getNewQuote();
}

// Event Listeners
function setupEventListeners() {
    // Input event for typing
    quoteInputElement.addEventListener("input", handleTyping);
    
    // Category change
    categorySelect.addEventListener("change", (e) => {
        currentCategory = e.target.value;
        getNewQuote();
    });
    
    // Difficulty buttons
    difficultyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            difficultyButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentDifficulty = btn.dataset.difficulty;
            resetGame();
        });
    });
    
    // New quote button
    newQuoteBtn.addEventListener("click", getNewQuote);
    
    // Reset button
    resetBtn.addEventListener("click", resetGame);
    
    // Try again button (modal)
    tryAgainBtn.addEventListener("click", () => {
        resultsModal.classList.remove("show");
        getNewQuote();
    });
    
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            resetGame();
        } else if (e.key === "Tab") {
            e.preventDefault();
            quoteInputElement.focus();
        }
    });
}

// Get a new quote based on category and difficulty
function getNewQuote() {
    // Get quotes from selected category
    let quotes = QUOTE_CATEGORIES[currentCategory] || QUOTE_CATEGORIES.mixed;
    
    // Filter based on difficulty
    const difficulty = DIFFICULTY_SETTINGS[currentDifficulty];
    quotes = quotes.filter(q => {
        const wordCount = q.split(" ").length;
        if (difficulty.textLength === "short") return wordCount <= 8;
        if (difficulty.textLength === "medium") return wordCount > 8 && wordCount <= 15;
        return wordCount > 15;
    });
    
    // If no quotes match, use all quotes from category
    if (quotes.length === 0) {
        quotes = QUOTE_CATEGORIES[currentCategory] || QUOTE_CATEGORIES.mixed;
    }
    
    // Select random quote
    currentQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    // Display quote
    displayQuote(currentQuote);
    
    // Reset game state
    resetGame();
}

// Display quote with character spans
function displayQuote(quote) {
    quoteDisplayElement.innerHTML = "";
    quote.split("").forEach((char) => {
        const span = document.createElement("span");
        span.textContent = char;
        quoteDisplayElement.appendChild(span);
    });
    
    // Update total characters
    totalCharsElement.textContent = quote.length;
}

// Handle typing input
function handleTyping() {
    if (!gameActive && quoteInputElement.value.length > 0) {
        startGame();
    }
    
    if (!gameActive) return;
    
    const quoteSpans = quoteDisplayElement.querySelectorAll("span");
    const inputValue = quoteInputElement.value;
    const inputChars = inputValue.split("");
    
    let correct = true;
    let correctCount = 0;
    let errorCount = 0;
    
    // Check each character
    quoteSpans.forEach((charSpan, index) => {
        const inputChar = inputChars[index];
        
        if (inputChar == null) {
            // Character not typed yet
            charSpan.classList.remove("right", "wrong");
        } else if (inputChar === charSpan.textContent) {
            // Correct character
            charSpan.classList.add("right");
            charSpan.classList.remove("wrong");
            correctCount++;
        } else {
            // Wrong character
            charSpan.classList.add("wrong");
            charSpan.classList.remove("right");
            errorCount++;
            correct = false;
            
            // Shake effect on error
            if (!DIFFICULTY_SETTINGS[currentDifficulty].allowBackspace) {
                quoteInputElement.classList.add("shake");
                setTimeout(() => quoteInputElement.classList.remove("shake"), 300);
            }
        }
    });
    
    // Update counts
    totalTyped = correctCount + errorCount;
    totalErrors = errorCount;
    
    // Update progress
    typedCountElement.textContent = totalTyped;
    
    // Calculate and update WPM and accuracy
    updateStats();
    
    // Check if quote is completed
    if (correct && totalTyped === currentQuote.length) {
        finishGame();
    }
    
    // Handle backspace restriction for hard mode
    if (!DIFFICULTY_SETTINGS[currentDifficulty].allowBackspace) {
        if (inputValue.length < totalTyped) {
            // User tried to backspace
            quoteInputElement.value = currentQuote.substring(0, inputValue.length);
        }
    }
}

// Start the game timer
function startGame() {
    gameActive = true;
    startTime = new Date();
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!gameActive) return;
        
        const currentTime = getElapsedTime();
        timerElement.textContent = `${currentTime}s`;
        
        // Update WPM in real-time
        updateStats();
    }, 100);
}

// Get elapsed time in seconds
function getElapsedTime() {
    if (!startTime) return 0;
    return Math.floor((new Date() - startTime) / 1000);
}

// Update WPM and accuracy stats
function updateStats() {
    if (!gameActive || totalTyped === 0) return;
    
    const time = getElapsedTime();
    if (time === 0) return;
    
    // Calculate WPM (words per minute)
    // Standard: 5 characters = 1 word
    const words = totalTyped / 5;
    const minutes = time / 60;
    const wpm = Math.round(words / minutes) || 0;
    
    // Calculate accuracy
    const accuracy = totalTyped > 0 
        ? Math.round(((totalTyped - totalErrors) / totalTyped) * 100)
        : 100;
    
    // Update display
    wpmElement.textContent = wpm;
    accuracyElement.textContent = `${accuracy}%`;
}

// Finish the game and show results
function finishGame() {
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    
    const time = getElapsedTime();
    const wpm = parseInt(wpmElement.textContent);
    const accuracy = accuracyElement.textContent;
    const correctChars = totalTyped - totalErrors;
    
    // Update modal with results
    resultTime.textContent = `${time}s`;
    resultWPM.textContent = wpm;
    resultAccuracy.textContent = accuracy;
    resultChars.textContent = `${correctChars}/${currentQuote.length}`;
    
    // Show modal
    resultsModal.classList.add("show");
}

// Reset the game
function resetGame() {
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    
    // Reset state
    startTime = null;
    totalErrors = 0;
    totalTyped = 0;
    
    // Reset displays
    timerElement.textContent = "0s";
    wpmElement.textContent = "0";
    accuracyElement.textContent = "100%";
    typedCountElement.textContent = "0";
    quoteInputElement.value = "";
    
    // Remove all highlighting from quote
    const quoteSpans = quoteDisplayElement.querySelectorAll("span");
    quoteSpans.forEach(span => {
        span.classList.remove("right", "wrong");
    });
    
    // Hide modal if visible
    resultsModal.classList.remove("show");
}

// Helper function to format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Start the game
init();