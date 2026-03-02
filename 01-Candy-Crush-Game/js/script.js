class CandyCrushGame {
  constructor() {
    this.initializeDOMElements();
    this.initializeGameState();
    this.attachEventListeners();
  }

  initializeDOMElements() {
    this.grid = document.querySelector(".grid");
    this.scoreDisplay = document.getElementById("score");
    this.timerDisplay = document.getElementById("timer");
    this.timerContainer = document.getElementById("timerContainer");
    this.modeSelection = document.getElementById("modeSelection");
    this.gameContainer = document.querySelector(".game-container");
    this.endlessButton = document.getElementById("endlessMode");
    this.timedButton = document.getElementById("timedMode");
    this.changeModeButton = document.getElementById("changeMode");
  }

  initializeGameState() {
    this.width = 8;
    this.squares = [];
    this.score = 0;
    this.currentMode = null;
    this.timeLeft = 0;
    this.gameInterval = null;
    this.timerInterval = null;
    this.colorBeingDragged = null;
    this.colorBeingReplaced = null;
    this.squareIdBeingDragged = null;
    this.squareIdBeingReplaced = null;

    this.candyColors = [
      "url('https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/red-candy.png')",
      "url('https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/blue-candy.png')",
      "url('https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/green-candy.png')",
      "url('https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/yellow-candy.png')",
      "url('https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/orange-candy.png')",
      "url('https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/purple-candy.png')"
    ];
  }

  attachEventListeners() {
    this.endlessButton.addEventListener("click", () => this.startGame("endless"));
    this.timedButton.addEventListener("click", () => this.startGame("timed"));
    this.changeModeButton.addEventListener("click", () => this.changeMode());
  }

  createBoard() {
    this.grid.innerHTML = "";
    this.squares = [];
    
    for (let i = 0; i < this.width * this.width; i++) {
      const square = document.createElement("div");
      square.setAttribute("draggable", true);
      square.setAttribute("id", i);
      
      const randomColor = Math.floor(Math.random() * this.candyColors.length);
      square.style.backgroundImage = this.candyColors[randomColor];
      
      square.addEventListener("dragstart", (e) => this.dragStart(e));
      square.addEventListener("dragend", (e) => this.dragEnd(e));
      square.addEventListener("dragover", (e) => this.dragOver(e));
      square.addEventListener("dragenter", (e) => this.dragEnter(e));
      square.addEventListener("dragleave", (e) => this.dragLeave(e));
      square.addEventListener("drop", (e) => this.dragDrop(e));
      
      this.grid.appendChild(square);
      this.squares.push(square);
    }
  }

  dragStart(e) {
    this.colorBeingDragged = e.target.style.backgroundImage;
    this.squareIdBeingDragged = parseInt(e.target.id);
  }

  dragOver(e) {
    e.preventDefault();
  }

  dragEnter(e) {
    e.preventDefault();
  }

  dragLeave() {}

  dragDrop(e) {
    this.colorBeingReplaced = e.target.style.backgroundImage;
    this.squareIdBeingReplaced = parseInt(e.target.id);
    
    e.target.style.backgroundImage = this.colorBeingDragged;
    this.squares[this.squareIdBeingDragged].style.backgroundImage = this.colorBeingReplaced;
  }

  dragEnd() {
    const validMoves = [
      this.squareIdBeingDragged - 1,
      this.squareIdBeingDragged - this.width,
      this.squareIdBeingDragged + 1,
      this.squareIdBeingDragged + this.width
    ];
    
    const validMove = validMoves.includes(this.squareIdBeingReplaced);

    if (this.squareIdBeingReplaced && validMove) {
      this.squareIdBeingReplaced = null;
    } else if (this.squareIdBeingReplaced && !validMove) {
      this.squares[this.squareIdBeingReplaced].style.backgroundImage = this.colorBeingReplaced;
      this.squares[this.squareIdBeingDragged].style.backgroundImage = this.colorBeingDragged;
    } else {
      this.squares[this.squareIdBeingDragged].style.backgroundImage = this.colorBeingDragged;
    }
  }

  moveIntoSquareBelow() {
    for (let i = 0; i < this.width; i++) {
      if (this.squares[i].style.backgroundImage === "") {
        const randomColor = Math.floor(Math.random() * this.candyColors.length);
        this.squares[i].style.backgroundImage = this.candyColors[randomColor];
      }
    }
    
    for (let i = 0; i < this.width * (this.width - 1); i++) {
      if (this.squares[i + this.width].style.backgroundImage === "") {
        this.squares[i + this.width].style.backgroundImage = this.squares[i].style.backgroundImage;
        this.squares[i].style.backgroundImage = "";
      }
    }
  }

  checkRowForFour() {
    for (let i = 0; i < 60; i++) {
      if (i % this.width >= this.width - 3) continue;
      
      const rowOfFour = [i, i + 1, i + 2, i + 3];
      const decidedColor = this.squares[i].style.backgroundImage;
      const isBlank = this.squares[i].style.backgroundImage === "";
      
      if (rowOfFour.every(index => this.squares[index].style.backgroundImage === decidedColor && !isBlank)) {
        this.score += 4;
        this.scoreDisplay.innerHTML = this.score;
        rowOfFour.forEach(index => this.squares[index].style.backgroundImage = "");
      }
    }
  }

  checkColumnForFour() {
    for (let i = 0; i < 40; i++) {
      const columnOfFour = [i, i + this.width, i + 2 * this.width, i + 3 * this.width];
      const decidedColor = this.squares[i].style.backgroundImage;
      const isBlank = this.squares[i].style.backgroundImage === "";
      
      if (columnOfFour.every(index => this.squares[index].style.backgroundImage === decidedColor && !isBlank)) {
        this.score += 4;
        this.scoreDisplay.innerHTML = this.score;
        columnOfFour.forEach(index => this.squares[index].style.backgroundImage = "");
      }
    }
  }

  checkRowForThree() {
    for (let i = 0; i < 62; i++) {
      if (i % this.width >= this.width - 2) continue;
      
      const rowOfThree = [i, i + 1, i + 2];
      const decidedColor = this.squares[i].style.backgroundImage;
      const isBlank = this.squares[i].style.backgroundImage === "";
      
      if (rowOfThree.every(index => this.squares[index].style.backgroundImage === decidedColor && !isBlank)) {
        this.score += 3;
        this.scoreDisplay.innerHTML = this.score;
        rowOfThree.forEach(index => this.squares[index].style.backgroundImage = "");
      }
    }
  }

  checkColumnForThree() {
    for (let i = 0; i < 48; i++) {
      const columnOfThree = [i, i + this.width, i + 2 * this.width];
      const decidedColor = this.squares[i].style.backgroundImage;
      const isBlank = this.squares[i].style.backgroundImage === "";
      
      if (columnOfThree.every(index => this.squares[index].style.backgroundImage === decidedColor && !isBlank)) {
        this.score += 3;
        this.scoreDisplay.innerHTML = this.score;
        columnOfThree.forEach(index => this.squares[index].style.backgroundImage = "");
      }
    }
  }

  gameLoop() {
    this.checkRowForFour();
    this.checkColumnForFour();
    this.checkRowForThree();
    this.checkColumnForThree();
    this.moveIntoSquareBelow();
  }

  updateTimerDisplay() {
    if (this.currentMode === "timed") {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      this.timerDisplay.innerHTML = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  endGame() {
    clearInterval(this.gameInterval);
    this.squares.forEach(square => square.setAttribute("draggable", false));
    
    setTimeout(() => {
      alert(`Time's Up! Your final score is ${this.score}`);
    }, 100);
  }

  startGame(mode) {
    this.currentMode = mode;
    this.modeSelection.style.display = "none";
    this.gameContainer.style.display = "block";
    
    this.createBoard();
    this.score = 0;
    this.scoreDisplay.innerHTML = this.score;
    
    this.gameInterval = setInterval(() => this.gameLoop(), 100);

    if (mode === "timed") {
      this.timeLeft = 120;
      this.timerContainer.style.display = "flex";
      this.updateTimerDisplay();
      
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        this.updateTimerDisplay();
        
        if (this.timeLeft <= 0) {
          clearInterval(this.timerInterval);
          this.endGame();
        }
      }, 1000);
    } else {
      this.timerContainer.style.display = "none";
    }
  }

  changeMode() {
    clearInterval(this.gameInterval);
    if (this.currentMode === "timed") {
      clearInterval(this.timerInterval);
    }
    
    this.gameContainer.style.display = "none";
    this.modeSelection.style.display = "flex";
    
    this.squares = [];
    this.score = 0;
    this.currentMode = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CandyCrushGame();
});