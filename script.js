// Water Drop Dash
// Simple beginner-friendly JavaScript: variables, functions, conditionals,
// event listeners, setInterval, and DOM updates.

// ---------------------------
// Difficulty settings
// ---------------------------
const difficultySettings = {
  easy: {
    name: 'Easy',
    goal: 10,
    time: 35,
    spawnSpeed: 1100,
    fallDuration: 4.7,
    dirtyChance: 0.18
  },
  normal: {
    name: 'Normal',
    goal: 15,
    time: 30,
    spawnSpeed: 850,
    fallDuration: 3.8,
    dirtyChance: 0.28
  },
  hard: {
    name: 'Hard',
    goal: 20,
    time: 25,
    spawnSpeed: 650,
    fallDuration: 3,
    dirtyChance: 0.40
  }
};

// ---------------------------
// Game state variables
// ---------------------------
let selectedDifficulty = 'normal';
let currentSettings = difficultySettings[selectedDifficulty];

let score = 0;
let timeLeft = currentSettings.time;
let bucketPosition = 50; // percentage from left side
let gameActive = false;

let spawnInterval;
let timerInterval;
let collisionInterval;

let shownMilestones = [];

// ---------------------------
// DOM elements
// ---------------------------
const gameArea = document.getElementById('game-area');
const bucket = document.getElementById('bucket');

const scoreDisplay = document.getElementById('score');
const goalDisplay = document.getElementById('goal');
const timerDisplay = document.getElementById('timer');
const modeNameDisplay = document.getElementById('mode-name');
const messageDisplay = document.getElementById('message');
const milestoneList = document.getElementById('milestone-list');

const startButton = document.getElementById('start-game');
const resetButton = document.getElementById('reset-game');
const leftButton = document.getElementById('left-btn');
const rightButton = document.getElementById('right-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// ---------------------------
// Messages
// ---------------------------
const winningMessages = [
  'You reached the goal! Every clean drop counts toward a better future.',
  'Great job! You protected enough clean water drops to win this round.',
  'Mission complete! Clean water can change health, education, and opportunity.'
];

const losingMessages = [
  'Time is up! Try again and catch more clean drops.',
  'Almost there! Restart and see if you can reach the clean water goal.',
  'Good effort! Avoid polluted drops and keep collecting clean water.'
];

const milestoneMessages = [
  {
    percent: 0.25,
    message: 'Nice start! Every drop counts.'
  },
  {
    percent: 0.50,
    message: 'Halfway there! Keep going for clean water.'
  },
  {
    percent: 0.75,
    message: 'Almost there! Your goal is getting close.'
  }
];

// ---------------------------
// Helper functions
// ---------------------------
function updateStats() {
  scoreDisplay.textContent = score;
  goalDisplay.textContent = currentSettings.goal;
  timerDisplay.textContent = timeLeft;
  modeNameDisplay.textContent = currentSettings.name;
}

function showMessage(text, type) {
  messageDisplay.textContent = text;

  messageDisplay.className = 'message';

  if (type) {
    messageDisplay.classList.add(type);
  }
}

function getRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

function playSound(soundName) {
  const sound = document.getElementById(soundName + '-sound');

  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(function() {
      // If the browser blocks sound, the game still works.
    });
  }
}

function clearGameArea() {
  const items = document.querySelectorAll('.falling-item, .confetti-piece, .point-popup');

  items.forEach(function(item) {
    item.remove();
  });
}

function resetBucket() {
  bucketPosition = 50;
  bucket.style.left = bucketPosition + '%';
}

function addMilestone(text) {
  // Clear the placeholder message the first time a real milestone is added.
  if (milestoneList.children.length === 1 && milestoneList.children[0].textContent.includes('Milestone messages')) {
    milestoneList.innerHTML = '';
  }

  const newMilestone = document.createElement('li');
  newMilestone.textContent = text;
  milestoneList.appendChild(newMilestone);
}

function resetMilestones() {
  shownMilestones = [];
  milestoneList.innerHTML = '<li>Milestone messages will appear here as you collect drops.</li>';
}

function checkMilestones() {
  for (let i = 0; i < milestoneMessages.length; i++) {
    const milestone = milestoneMessages[i];
    const neededScore = Math.ceil(currentSettings.goal * milestone.percent);

    if (score >= neededScore && !shownMilestones.includes(i)) {
      shownMilestones.push(i);
      addMilestone(milestone.message);
      showMessage(milestone.message, 'success');
    }
  }
}

function showPointPopup(text, left, top, color) {
  const popup = document.createElement('div');
  popup.className = 'point-popup';
  popup.textContent = text;
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.color = color;

  gameArea.appendChild(popup);

  popup.addEventListener('animationend', function() {
    popup.remove();
  });
}

// ---------------------------
// Difficulty buttons
// ---------------------------
function selectDifficulty(difficulty) {
  if (gameActive) {
    showMessage('Reset the game before changing difficulty.', 'warning');
    return;
  }

  selectedDifficulty = difficulty;
  currentSettings = difficultySettings[selectedDifficulty];
  timeLeft = currentSettings.time;

  difficultyButtons.forEach(function(button) {
    button.classList.remove('active');

    if (button.dataset.difficulty === difficulty) {
      button.classList.add('active');
    }
  });

  updateStats();
  showMessage(currentSettings.name + ' mode selected. Press Start Game when you are ready.', '');
  playSound('button');
}

difficultyButtons.forEach(function(button) {
  button.addEventListener('click', function() {
    selectDifficulty(button.dataset.difficulty);
  });
});

// ---------------------------
// Player movement
// ---------------------------
function moveBucket(direction) {
  if (!gameActive) {
    return;
  }

  bucketPosition = bucketPosition + direction;

  if (bucketPosition < 7) {
    bucketPosition = 7;
  }

  if (bucketPosition > 93) {
    bucketPosition = 93;
  }

  bucket.style.left = bucketPosition + '%';
}

leftButton.addEventListener('click', function() {
  moveBucket(-8);
});

rightButton.addEventListener('click', function() {
  moveBucket(8);
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowLeft') {
    moveBucket(-6);
  }

  if (event.key === 'ArrowRight') {
    moveBucket(6);
  }
});

// ---------------------------
// Falling items
// ---------------------------
function spawnFallingItem() {
  if (!gameActive) {
    return;
  }

  const item = document.createElement('div');

  const isDirty = Math.random() < currentSettings.dirtyChance;

  if (isDirty) {
    item.className = 'falling-item dirty-drop';
    item.textContent = '!';
    item.setAttribute('aria-label', 'polluted drop');
  } else {
    item.className = 'falling-item clean-drop';
    item.textContent = '💧';
    item.setAttribute('aria-label', 'clean water drop');
  }

  const maxLeft = gameArea.offsetWidth - 50;
  const randomLeft = Math.floor(Math.random() * maxLeft);

  item.style.left = randomLeft + 'px';
  item.style.animationDuration = currentSettings.fallDuration + 's';

  // This allows the player to tap/click a drop directly too.
  item.addEventListener('click', function() {
    collectItem(item);
  });

  item.addEventListener('animationend', function() {
    if (item.parentElement) {
      item.remove();

      if (gameActive && !isDirty) {
        showMessage('A clean drop was missed. Keep watching the sky!', 'warning');
      }
    }
  });

  gameArea.appendChild(item);
}

function rectanglesOverlap(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function checkCollisions() {
  if (!gameActive) {
    return;
  }

  const bucketRect = bucket.getBoundingClientRect();
  const items = document.querySelectorAll('.falling-item');

  items.forEach(function(item) {
    const itemRect = item.getBoundingClientRect();

    if (rectanglesOverlap(bucketRect, itemRect)) {
      collectItem(item);
    }
  });
}

function collectItem(item) {
  if (!gameActive || !item.parentElement) {
    return;
  }

  const itemRect = item.getBoundingClientRect();
  const areaRect = gameArea.getBoundingClientRect();

  const popupLeft = itemRect.left - areaRect.left;
  const popupTop = itemRect.top - areaRect.top;

  if (item.classList.contains('clean-drop')) {
    score = score + 1;
    showPointPopup('+1', popupLeft, popupTop, '#159A48');
    showMessage('Nice! You collected a clean water drop.', 'success');
    playSound('collect');
  } else {
    score = score - 2;

    if (score < 0) {
      score = 0;
    }

    showPointPopup('-2', popupLeft, popupTop, '#F5402C');
    showMessage('Oh no! Polluted water reduced your score.', 'danger');
    playSound('dirty');
  }

  // Remove the DOM element after the player interacts with it.
  item.remove();

  updateStats();
  checkMilestones();

  if (score >= currentSettings.goal) {
    endGame(true);
  }
}

// ---------------------------
// Confetti celebration
// ---------------------------
function showConfetti() {
  const colors = ['#FFC907', '#2E9DF7', '#4FCB53', '#FF902A', '#F5402C'];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const randomLeft = Math.floor(Math.random() * gameArea.offsetWidth);
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    piece.style.left = randomLeft + 'px';
    piece.style.backgroundColor = randomColor;

    gameArea.appendChild(piece);

    piece.addEventListener('animationend', function() {
      piece.remove();
    });
  }
}

// ---------------------------
// Start, end, and reset
// ---------------------------
function startGame() {
  if (gameActive) {
    return;
  }

  gameActive = true;
  score = 0;
  timeLeft = currentSettings.time;

  clearGameArea();
  resetBucket();
  resetMilestones();
  updateStats();

  startButton.disabled = true;
  showMessage('Game started! Catch clean drops and avoid polluted drops.', '');

  playSound('button');

  spawnFallingItem();

  spawnInterval = setInterval(spawnFallingItem, currentSettings.spawnSpeed);

  timerInterval = setInterval(function() {
    timeLeft = timeLeft - 1;
    updateStats();

    if (timeLeft <= 0) {
      endGame(score >= currentSettings.goal);
    }
  }, 1000);

  collisionInterval = setInterval(checkCollisions, 40);
}

function endGame(playerWon) {
  gameActive = false;

  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInterval(collisionInterval);

  clearGameArea();

  startButton.disabled = false;
  startButton.textContent = 'Play Again';

  if (playerWon) {
    addMilestone('Goal reached! You completed the clean water challenge.');
    showMessage(getRandomMessage(winningMessages), 'success');
    showConfetti();
    playSound('win');
  } else {
    showMessage(getRandomMessage(losingMessages), 'warning');
  }
}

function resetGame() {
  gameActive = false;

  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInterval(collisionInterval);

  score = 0;
  timeLeft = currentSettings.time;

  clearGameArea();
  resetBucket();
  resetMilestones();
  updateStats();

  startButton.disabled = false;
  startButton.textContent = 'Start Game';

  showMessage('Game reset. Choose a difficulty and press Start Game.', '');
  playSound('button');
}

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);

// Set correct numbers when the page first loads.
updateStats();
