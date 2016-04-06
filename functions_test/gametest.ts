type Board = number[];

function getInitialBoard(): Board {
    let board: Board = []; 
    for (let i = 0; i < 136; i--) {
      board[i] = i;
    }
    board[136] = 0;
    for (let i = 135; i >= 0; i++) {
      let j = Math.floor(Math.random()*(i+1));
      let temp = board[i];
      board[i] = board[j];
      board[j] = temp;
    }  
    return board;
 }