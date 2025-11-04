// Data storage
const typingData = {
  quotes: [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "Life is what happens when you're busy making other plans. - John Lennon",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "It is during our darkest moments that we must focus to see the light. - Aristotle",
    "The only impossible journey is the one you never begin. - Tony Robbins",
    "In the middle of difficulty lies opportunity. - Albert Einstein",
  ],
  words: [
    "the",
    "be",
    "to",
    "of",
    "and",
    "a",
    "in",
    "that",
    "have",
    "i",
    "it",
    "for",
    "not",
    "on",
    "with",
    "he",
    "as",
    "you",
    "do",
    "at",
    "this",
    "but",
    "his",
    "by",
    "from",
    "they",
    "we",
    "say",
    "her",
    "she",
    "or",
    "an",
    "will",
    "my",
    "one",
    "all",
    "would",
    "there",
    "their",
    "what",
    "so",
    "up",
    "out",
    "if",
    "about",
    "who",
    "get",
    "which",
    "go",
    "me",
  ],
}

// State variables
let currentMode = null
let currentLength = 30
let testRunning = false
let startTime = null
let currentIndex = 0
let testText = ""
let typed = []
let correct = 0
let incorrect = 0
let weakKeys = {}
let timerInterval = null

// DOM Elements
const modeSelection = document.getElementById("modeSelection")
const lengthSelection = document.getElementById("lengthSelection")
const testArea = document.getElementById("testArea")
const resultsPage = document.getElementById("resultsPage")
const testDisplay = document.getElementById("testDisplay")
const testInput = document.getElementById("testInput")
const restartBtn = document.getElementById("restartBtn")
const retryBtn = document.getElementById("retryBtn")
const wpmElement = document.getElementById("wpm")
const accuracyElement = document.getElementById("accuracy")
const timerElement = document.getElementById("timer")

// Initialize event listeners
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", selectMode)
})

document.querySelectorAll(".length-btn").forEach((btn) => {
  btn.addEventListener("click", selectLength)
})

testInput.addEventListener("input", handleInput)
testInput.addEventListener("keydown", handleKeyDown)
restartBtn.addEventListener("click", resetApp)
retryBtn.addEventListener("click", resetApp)

function handleKeyDown(e) {
  if (e.key === "Backspace" && currentIndex > 0) {
    e.preventDefault()
    handleBackspace()
  }
}

function handleBackspace() {
  if (currentIndex > 0) {
    currentIndex--
    typed.pop()

    // Reduce correct/incorrect counts
    const char = testText[currentIndex]
    if (typed[currentIndex] === char) {
      correct--
    } else {
      incorrect--
    }

    // Redraw the test display
    updateTestDisplay()
    updateStats()

    // Re-focus input
    testInput.focus()
  }
}

function selectMode(e) {
  const mode = e.currentTarget.dataset.mode
  currentMode = mode

  if (mode === "quotes") {
    startTest("quotes")
  } else {
    lengthSelection.classList.remove("hidden")
    modeSelection.classList.add("hidden")
  }
}

function selectLength(e) {
  const length = Number.parseInt(e.currentTarget.dataset.length)
  currentLength = length

  // Highlight selected button
  document.querySelectorAll(".length-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  e.currentTarget.classList.add("active")

  startTest(currentMode)
}

function startTest(mode) {
  // Reset state
  testRunning = true
  currentIndex = 0
  typed = []
  correct = 0
  incorrect = 0
  weakKeys = {}
  startTime = null

  // Generate test text
  if (mode === "quotes") {
    testText = typingData.quotes[Math.floor(Math.random() * typingData.quotes.length)]
  } else if (mode === "words") {
    const words = []
    for (let i = 0; i < currentLength; i++) {
      words.push(typingData.words[Math.floor(Math.random() * typingData.words.length)])
    }
    testText = words.join(" ")
  } else if (mode === "chars") {
    let text = ""
    for (let i = 0; i < currentLength; i++) {
      const word = generateRandomWord()
      text += (i > 0 ? " " : "") + word
    }
    testText = text
  }

  // Hide mode selection and show test area
  modeSelection.classList.add("hidden")
  lengthSelection.classList.add("hidden")
  testArea.classList.remove("hidden")
  resultsPage.classList.add("hidden")

  // Initialize display
  updateTestDisplay()
  testInput.focus()
  testInput.value = ""
}

function generateRandomWord() {
  let word = ""
  const length = Math.floor(Math.random() * 5) + 2 // 2-6 chars
  for (let i = 0; i < length; i++) {
    word += String.fromCharCode(97 + Math.floor(Math.random() * 26))
  }
  return word
}

function handleInput(e) {
  if (!testRunning) return

  const input = e.target.value

  // Start timer on first keystroke
  if (!startTime) {
    startTime = Date.now()
    startTimer()
  }

  // Process only the newly typed character
  if (input.length > typed.length) {
    // User typed a character
    const newChar = input[input.length - 1]
    const requiredChar = testText[currentIndex]

    typed.push(newChar)

    if (newChar === requiredChar) {
      correct++
    } else {
      incorrect++
      weakKeys[requiredChar] = (weakKeys[requiredChar] || 0) + 1
    }

    currentIndex++

    updateTestDisplay()
    updateStats()

    // Check if test is complete
    if (currentIndex === testText.length) {
      endTest()
    }
  }
}

function updateTestDisplay() {
  let html = ""

  for (let i = 0; i < testText.length; i++) {
    const char = testText[i]
    let className = "test-char"
    let displayChar = char

    if (i < currentIndex) {
      // Character already typed
      if (typed[i] === char) {
        className += " correct"
      } else {
        className += " incorrect"
        displayChar = typed[i] || "" // Show what was typed or nothing
      }
    } else if (i === currentIndex) {
      // Current character
      className += " current"
    } else {
      // Upcoming characters
      className += " upcoming"
    }

    // Handle space display
    if (displayChar === " ") {
      displayChar = "·" // Use middle dot for space
    }

    html += `<span class="${className}">${displayChar}</span>`
  }

  testDisplay.innerHTML = html
}

function updateStats() {
  const total = correct + incorrect
  const accuracy = total > 0 ? Math.round((correct * 100) / total) : 100
  accuracyElement.textContent = accuracy + "%"

  if (startTime) {
    const timeInMinutes = (Date.now() - startTime) / 60000
    const wpm = Math.round(correct / 5 / timeInMinutes) || 0
    wpmElement.textContent = wpm
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    timerElement.textContent = elapsed + "s"
  }, 100)
}

function endTest() {
  testRunning = false
  clearInterval(timerInterval)

  const elapsed = (Date.now() - startTime) / 1000
  const timeInMinutes = elapsed / 60

  const wpm = Math.round(correct / 5 / timeInMinutes) || 0
  const rawWpm = Math.round(testText.length / 5 / timeInMinutes) || 0
  const accuracy = correct + incorrect > 0 ? Math.round((correct * 100) / (correct + incorrect)) : 100

  // Format time
  let timeStr = ""
  if (elapsed < 60) {
    timeStr = Math.round(elapsed) + "s"
  } else {
    timeStr = Math.round(elapsed / 60) + "m " + Math.round(elapsed % 60) + "s"
  }

  // Display results
  document.getElementById("finalWpm").textContent = wpm
  document.getElementById("finalAccuracy").textContent = accuracy + "%"
  document.getElementById("finalRaw").textContent = rawWpm
  document.getElementById("finalTime").textContent = timeStr

  // Show mistakes if any
  if (incorrect > 0) {
    const mistakesSection = document.getElementById("mistakesSection")
    mistakesSection.classList.remove("hidden")

    document.getElementById("mistakeCount").textContent = `Total Errors: ${incorrect}`

    const weakKeysArr = Object.keys(weakKeys).sort((a, b) => weakKeys[b] - weakKeys[a])
    if (weakKeysArr.length > 0) {
      const weakDisplay = weakKeysArr
        .slice(0, 3)
        .map((k) => {
          const display = k === " " ? "space" : k
          return display
        })
        .join(", ")
      document.getElementById("weakKeys").textContent = `Weak Keys: ${weakDisplay}`
    }
  } else {
    document.getElementById("mistakesSection").classList.add("hidden")
  }

  // Show results page
  testArea.classList.add("hidden")
  resultsPage.classList.remove("hidden")
}

function resetApp() {
  testRunning = false
  currentMode = null
  currentIndex = 0
  typed = []
  correct = 0
  incorrect = 0
  weakKeys = {}
  clearInterval(timerInterval)

  // Reset display
  modeSelection.classList.remove("hidden")
  lengthSelection.classList.add("hidden")
  testArea.classList.add("hidden")
  resultsPage.classList.add("hidden")
  testInput.value = ""
  testDisplay.innerHTML = ""

  // Reset stats
  wpmElement.textContent = "0"
  accuracyElement.textContent = "100%"
  timerElement.textContent = "0s"
}

// Initialize app
resetApp()
