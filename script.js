 // --- DOM Elements ---
 const wordsContainer = document.getElementById('words-container');
 const textInput = document.getElementById('text-input');
 const caret = document.getElementById('caret');
 const statsContainer = document.getElementById('stats-container');
 const timerDisplay = document.getElementById('timer');
 const wpmDisplay = document.getElementById('wpm');
 const accuracyDisplay = document.getElementById('accuracy');
 const resetButton = document.getElementById('reset-button');
 const typingArea = document.getElementById('typing-area');
 const focusHint = document.getElementById('focus-hint');
 const resultPopup = document.getElementById('result-popup');
 const resultMode = document.getElementById('result-mode');
 const resultWpm = document.getElementById('result-wpm');
 const resultAccuracy = document.getElementById('result-accuracy');
 const resultTime = document.getElementById('result-time');
 const resultChars = document.getElementById('result-chars');
 const restartButton = document.getElementById('restart-button');
 const modeSelector = document.getElementById('mode-selector');
 const modeButtons = modeSelector.querySelectorAll('.mode-button');

 // --- State Variables ---
 let currentMode = 'random'; // 'random', 'short', 'long', 'quote'
 let wordCount = 40; // Default word count
 let words = [];
 let letterSpans = [];
 let currentLetterIndex = 0;
 let startTime = null;
 let timerInterval = null;
 let testActive = false;
 let testCompleted = false;
 let totalTypedChars = 0;
 let correctTypedChars = 0;
 let incorrectTypedChars = 0;

 // --- Word & Quote Lists ---
 const commonWords = [ // Expanded list slightly
     "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "is", "are", "was", "were", "has", "had", "been", "said", "were", "go", "goes", "went", "gone", "write", "wrote", "written", "read", "reading", "find", "found", "study", "learn", "live", "call", "called", "world", "school", "still", "through", "between", "keep", "kept", "never", "start", "started", "city", "earth", "light", "thought", "head", "under", "story", "left", "few", "while", "along", "might", "close", "something", "seem", "next", "hard", "open", "example", "begin", "life", "always", "those", "both", "paper", "together", "got", "group", "often", "run", "important", "until", "children", "side", "feet", "car", "mile", "night", "walk", "white", "sea", "began", "grow", "took", "river", "four", "carry", "state", "once", "book", "hear", "stop", "without", "second", "late", "miss", "idea", "enough", "eat", "face", "watch", "far", "indian", "real", "almost", "let", "above", "girl", "sometimes", "mountains", "cut", "young", "talk", "soon", "list", "song", "being", "leave", "family", "body", "music", "color"
 ];

 const quotes = [ // Simple quotes, lowercase, basic punctuation
     "the quick brown fox jumps over the lazy dog.",
     "to be or not to be that is the question.",
     "all that glitters is not gold.",
     "ask not what your country can do for you ask what you can do for your country.",
     "elementary my dear watson.",
     "imagination is more important than knowledge.",
     "a journey of a thousand miles begins with a single step.",
     "that which does not kill us makes us stronger.",
     "practice makes perfect.",
     "where there is love there is life."
 ];

 // --- Functions ---

 /** Shuffles array in place. */
 function shuffle(a) {
     for (let i = a.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [a[i], a[j]] = [a[j], a[i]];
     }
     return a;
 }

 /** Generates text based on the current mode. */
 function generateText() {
     wordsContainer.innerHTML = ''; // Clear previous text
     letterSpans = []; // Reset letter spans

     let textToDisplay = "";

     if (currentMode === 'quote') {
         textToDisplay = quotes[Math.floor(Math.random() * quotes.length)];
     } else { // 'random', 'short', 'long'
         textToDisplay = shuffle([...commonWords]).slice(0, wordCount).join(' ');
     }

     // Create spans for each letter/space
     textToDisplay.split('').forEach((char) => {
         const letterSpan = document.createElement('letter');
         if (char === ' ') {
             letterSpan.innerHTML = '&nbsp;'; // Render space correctly
             letterSpan.dataset.char = ' '; // Store actual space for logic
         } else {
             letterSpan.textContent = char;
         }
         wordsContainer.appendChild(letterSpan);
         letterSpans.push(letterSpan);
     });

     // Initial caret position
     positionCaret(0);
 }

 /** Positions the caret */
 function positionCaret(index) {
      index = Math.max(0, Math.min(index, letterSpans.length));

      let targetLetter;
      if (index === letterSpans.length) {
          targetLetter = letterSpans[index - 1];
          if (targetLetter) {
              caret.style.left = `${targetLetter.offsetLeft + targetLetter.offsetWidth}px`;
              caret.style.top = `${targetLetter.offsetTop}px`;
          } else {
              caret.style.left = '0px';
              caret.style.top = '0px';
          }
      } else {
          targetLetter = letterSpans[index];
          if (targetLetter) {
              caret.style.left = `${targetLetter.offsetLeft}px`;
              caret.style.top = `${targetLetter.offsetTop}px`;
          }
      }

     if (targetLetter) {
         const lineHeight = parseFloat(getComputedStyle(wordsContainer).lineHeight);
         const containerHeight = wordsContainer.clientHeight;
         const currentScrollTop = wordsContainer.scrollTop;
         const caretTopRelativeToContainer = targetLetter.offsetTop - currentScrollTop;

         if (caretTopRelativeToContainer + lineHeight > containerHeight) {
              wordsContainer.scrollTop += lineHeight;
         }
         else if (caretTopRelativeToContainer < 0) {
              wordsContainer.scrollTop = targetLetter.offsetTop;
         }
     }
 }

 /** Updates timer and stats display */
 function updateTimer() {
     if (!startTime) return;
     const now = Date.now();
     const elapsedTime = Math.floor((now - startTime) / 1000);
     timerDisplay.textContent = `${elapsedTime}s`;

     if (elapsedTime > 0 && testActive) {
         const timeMinutes = elapsedTime / 60;
         const currentCorrectChars = Array.from(wordsContainer.querySelectorAll('letter.correct')).length;
         const wpm = Math.floor((currentCorrectChars / 5) / timeMinutes);
         wpmDisplay.textContent = `${wpm} WPM`;

         const currentTotalTyped = currentLetterIndex;
         const accuracy = currentTotalTyped === 0 ? 100 : Math.max(0, Math.floor((currentCorrectChars / currentTotalTyped) * 100));
         accuracyDisplay.textContent = `${accuracy}%`;
     } else if (!testActive && !testCompleted) {
          wpmDisplay.textContent = `0 WPM`;
          accuracyDisplay.textContent = `100%`;
     }
 }

 /** Starts the test */
 function startTest() {
     if (testActive || testCompleted) return;

     testActive = true;
     startTime = Date.now();
     statsContainer.style.opacity = '1';

     if (timerInterval) clearInterval(timerInterval);
     timerInterval = setInterval(updateTimer, 500);
     updateTimer();
 }

 /** Ends the test */
 function endTest() {
     if (!testActive) return;

     testActive = false;
     testCompleted = true;
     clearInterval(timerInterval);
     updateTimer(); // Final update

     const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
     const timeMinutes = elapsedTime / 60;

     const finalWpm = timeMinutes > 0 ? Math.floor((correctTypedChars / 5) / timeMinutes) : 0;
     const finalAccuracy = totalTypedChars === 0 ? 100 : Math.max(0, Math.floor((correctTypedChars / totalTypedChars) * 100));

     resultMode.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
     resultWpm.textContent = finalWpm;
     resultAccuracy.textContent = `${finalAccuracy}%`;
     resultTime.textContent = `${elapsedTime}s`;
     resultChars.textContent = `${correctTypedChars}/${incorrectTypedChars}/${totalTypedChars}`;
     resultPopup.classList.remove('hidden');
     caret.style.display = 'none';
     wordsContainer.classList.add('blurred');
 }

 /** Resets the test to initial state for the current mode */
 function resetTest() {
     testActive = false;
     testCompleted = false;
     startTime = null;
     currentLetterIndex = 0;
     totalTypedChars = 0;
     correctTypedChars = 0;
     incorrectTypedChars = 0;

     clearInterval(timerInterval);
     timerInterval = null;
     timerDisplay.textContent = '0s';
     wpmDisplay.textContent = '0 WPM';
     accuracyDisplay.textContent = '100%';
     statsContainer.style.opacity = '0';

     textInput.value = '';

     generateText();
     wordsContainer.scrollTop = 0;
     wordsContainer.classList.remove('blurred');
     caret.style.display = 'block';
     positionCaret(0);

     resultPopup.classList.add('hidden');

     textInput.focus();
 }

 /** Handles user input */
 function handleInput(event) {
     if (testCompleted) return;

     if (!testActive && event.inputType !== 'deleteContentBackward' && event.data) {
         startTest();
     }

     const typedValue = textInput.value;

     // --- Backspace ---
     if (event.inputType === 'deleteContentBackward') {
         if (currentLetterIndex > 0) {
             currentLetterIndex--;
             const letterToReset = letterSpans[currentLetterIndex];
             // Remove animation class on backspace
             letterToReset.classList.remove('typed');
             if (letterToReset.classList.contains('correct')) correctTypedChars--;
             if (letterToReset.classList.contains('incorrect')) incorrectTypedChars--;
             letterToReset.classList.remove('correct', 'incorrect', 'incorrect-space');
         }
     }
     // --- Character Input ---
     else if (event.data && currentLetterIndex < letterSpans.length) {
         const typedChar = event.data[event.data.length - 1];
         const targetLetterSpan = letterSpans[currentLetterIndex];
         const targetChar = targetLetterSpan.dataset.char || targetLetterSpan.textContent;

         // Remove previous animation class to allow re-triggering if needed
         targetLetterSpan.classList.remove('typed');
          // Force reflow to ensure animation restarts if the same class is added again quickly
         void targetLetterSpan.offsetWidth; // Reading offsetWidth forces reflow

         if (typedChar === targetChar) {
             targetLetterSpan.classList.add('correct');
             targetLetterSpan.classList.remove('incorrect', 'incorrect-space');
             correctTypedChars++;
         } else {
             targetLetterSpan.classList.add('incorrect');
             targetLetterSpan.classList.remove('correct');
             incorrectTypedChars++;
             if (targetChar === ' ') {
                 targetLetterSpan.classList.add('incorrect-space');
             }
         }
          // Add the animation class AFTER setting correct/incorrect
         targetLetterSpan.classList.add('typed');
         currentLetterIndex++;
     }

      totalTypedChars = correctTypedChars + incorrectTypedChars;

     positionCaret(currentLetterIndex);

     // Check for test completion
     if (currentLetterIndex === letterSpans.length) {
          const allMarked = letterSpans.every(span => span.classList.contains('correct') || span.classList.contains('incorrect'));
          if(allMarked) {
             const lastSpan = letterSpans[letterSpans.length - 1];
             if (lastSpan && lastSpan.classList.contains('correct')) {
                  endTest();
             }
          }
     } else if (currentLetterIndex > letterSpans.length) {
          textInput.value = textInput.value.slice(0, letterSpans.length);
          currentLetterIndex = letterSpans.length;
          positionCaret(currentLetterIndex);
     }


     if(testActive) {
         updateTimer();
     }
 }

 /** Handles mode selection */
 function selectMode(button) {
     modeButtons.forEach(btn => btn.classList.remove('active'));
     button.classList.add('active');
     currentMode = button.dataset.mode;
     wordCount = parseInt(button.dataset.words) || 40;
     resetTest();
 }

 // --- Event Listeners ---
 textInput.addEventListener('input', handleInput);

 textInput.addEventListener('focus', () => {
     typingArea.classList.add('border-yellow-500');
     wordsContainer.classList.remove('blurred');
     focusHint.classList.add('hidden');
     if (!testCompleted) caret.style.display = 'block';
 });

 textInput.addEventListener('blur', () => {
     typingArea.classList.remove('border-yellow-500');
     if (!testActive && !testCompleted) {
         wordsContainer.classList.add('blurred');
         focusHint.classList.remove('hidden');
     }
     caret.style.display = 'none';
 });

 resetButton.addEventListener('click', resetTest);
 restartButton.addEventListener('click', resetTest);

 modeButtons.forEach(button => {
     button.addEventListener('click', () => selectMode(button));
 });

 document.addEventListener('keydown', (e) => {
     if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
         e.preventDefault();
         resetTest();
     }
     if (e.key === 'Tab') {
        // Allow default tab behavior
     }
 });

 // --- Initialization ---
 lucide.createIcons();
 selectMode(modeSelector.querySelector('[data-mode="random"]'));
 resetTest(); // Initial setup
