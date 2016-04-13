var gameLogic;
(function (gameLogic) {
    var justInitiallized = false;
    /** Returns the initial TicTacToe board, which is a ROWSxCOLS matrix containing ''. */
    function getInitialBoard() {
        var stock = [];
        for (var i = 0; i < 136; i++) {
            stock[i] = i;
        }
        stock[136] = 0;
        for (var i = 135; i >= 0; i--) {
            var j = Math.floor(Math.random() * i);
            var temp = stock[i];
            stock[i] = stock[j];
            stock[j] = temp;
        }
        var p1 = { hand: [], open: [] };
        var p2 = { hand: [], open: [] };
        var move = [0, 0, 0, 0, 0, 1, 0];
        var board = { stock: stock, px: p1, po: p2, legalMove: move, out: [], turn: -1 };
        for (var i = 0; i < 6; i++) {
            if (i % 2 == 0) {
                fetchPai(board.stock, 4, board.px);
            }
            else {
                fetchPai(board.stock, 4, board.po);
            }
        }
        fetchPai(board.stock, 1, board.px);
        fetchPai(board.stock, 1, board.po);
        board.px.hand.sort(compareNumbers);
        board.po.hand.sort(compareNumbers);
        justInitiallized = true;
        return board;
    }
    function fetchPai(stock, count, player) {
        for (var i = 0; i < count; i++) {
            var temp = stock[stock[136]] / 4;
            player.hand.push(Math.floor(temp));
            stock[136]++;
        }
    }
    function compareNumbers(a, b) {
        return a - b;
    }
    function formatConvert(list) {
        /*
        example:
        input:
        [8,8,8,8,7,6,5,4,3,2,1,0,0,0]
        output:
        [[14, 3, 1, 1, 1, 1, 1, 1, 1, 4], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
        */
        var cardsList = [];
        var w = [];
        var t = [];
        var s = [];
        var z = [];
        for (var k = 0; k < 9; k++) {
            w.push(list.reduce(function (total, x) {
                return x == k ? total + 1 : total;
            }, 0));
        }
        for (var k = 9; k < 18; k++) {
            t.push(list.reduce(function (total, x) {
                return x == k ? total + 1 : total;
            }, 0));
        }
        for (var k = 18; k < 27; k++) {
            s.push(list.reduce(function (total, x) {
                return x == k ? total + 1 : total;
            }, 0));
        }
        for (var k = 27; k < 34; k++) {
            z.push(list.reduce(function (total, x) {
                return x == k ? total + 1 : total;
            }, 0));
        }
        w.unshift(w.reduce(function (a, b) { return a + b; }));
        t.unshift(t.reduce(function (a, b) { return a + b; }));
        s.unshift(s.reduce(function (a, b) { return a + b; }));
        z.unshift(z.reduce(function (a, b) { return a + b; }));
        cardsList.push(w);
        cardsList.push(t);
        cardsList.push(s);
        cardsList.push(z);
        return cardsList;
    }
    function isLegal(list, flag) {
        /*
        Check if a list is legal
        To be legal, the list should be able to remove three identical cards or to
        remove three consecutive cards until the list is empty.
        */
        if (list[0] === 0) {
            return true;
        }
        var index = 0;
        for (var j = 1; j < list.length; j++) {
            if (list[j] !== 0) {
                index = j;
                break;
            }
        }
        var result = false;
        if (list[index] >= 3) {
            list[index] -= 3;
            list[0] -= 3;
            result = isLegal(list, flag);
            list[index] += 3;
            list[0] += 3;
            return result;
        }
        if (!flag && index < 8 && list[index + 1] > 0 && list[index + 2] > 0) {
            list[index] = list[index] - 1;
            list[index + 1] = list[index + 1] - 1;
            list[index + 2] = list[index + 2] - 1;
            list[0] = list[0] - 3;
            result = isLegal(list, flag);
            list[index] = list[index] + 1;
            list[index + 1] = list[index + 1] + 1;
            list[index + 2] = list[index + 2] + 1;
            list[0] = list[0] + 3;
            return result;
        }
        return false;
    }
    function ifHu(cards, pai) {
        /*
        input:  arr of integer (range [0-34]) presenting current hand,
                the possible lengths are 5, 8, 11, 14
                0-8 represent Char 1~9
                9-17 represent Circle 1~9
                18-26 represent Bamboo 1~9
                27-34 represent Special Char
                example input: [8,8,8,8,7,6,5,4,3,2,1,0,0,0]
        return: bool, true if this hand could win, false if not
        */
        var newcards = angular.copy(cards);
        newcards.push(pai);
        if ([5, 8, 11, 14].indexOf(newcards.length) == -1) {
            console.log("Hu length of arr is illegal.");
            throw "Hu number of cards is illegal";
        }
        var cardsNewFormat = formatConvert(newcards);
        var kingPos = -1;
        var kingExist = false;
        for (var j = 0; j < 4; j++) {
            var additionalCards = cardsNewFormat[j][0] % 3;
            if (additionalCards == 1) {
                return false;
            }
            if (additionalCards == 2) {
                if (kingExist) {
                    return false;
                }
                kingPos = j;
                kingExist = true;
            }
        }
        if (!kingExist) {
            return false;
        }
        for (var j = 0; j < 4; j++) {
            if (kingPos == j) {
                continue;
            }
            else {
                if (!isLegal(cardsNewFormat[j], j == 3)) {
                    return false;
                }
            }
        }
        var kingList = cardsNewFormat[kingPos];
        for (var j = 1; j < kingList.length; j++) {
            if (kingList[j] >= 2) {
                kingList[j] -= 2;
                kingList[0] -= 2;
                if (isLegal(kingList, kingPos == 3)) {
                    return true;
                }
                else {
                    kingList[j] += 2;
                    kingList[0] += 2;
                }
            }
        }
        return false;
    }
    function ifChi(hand, target) {
        if ([4, 7, 10, 13].indexOf(hand.length) == -1) {
            console.log("Chi length of arr is illegal.");
            throw "Chi number of cards is illegal";
        }
        // convert to [[14, 3, 1, 1, 1, 1, 1, 1, 1, 4], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
        var cardsNewFormat = formatConvert(hand);
        var stackIndex = Math.floor(target / 9);
        var index = target % 9;
        if (stackIndex == 3) {
            return [0, 0, 0];
        }
        var targetList = cardsNewFormat[stackIndex];
        var left = 0;
        var middle = 0;
        var right = 0;
        // The index 0 in targetList is the total count. 
        if (index >= 2) {
            if (targetList[index] >= 1 && targetList[index - 1] >= 1) {
                right = 1;
            }
        }
        if (index >= 1 && index <= 7) {
            if (targetList[index] >= 1 && targetList[index + 2] >= 1) {
                middle = 1;
            }
        }
        if (index <= 6) {
            if (targetList[index + 2] >= 1 && targetList[index + 3] >= 1) {
                left = 1;
            }
        }
        return [left, middle, right];
    }
    function ifPeng(hand, target) {
        // input:
        // [8,8,8,8,7,6,5,4,3,2,1,0,0]
        if ([4, 7, 10, 13].indexOf(hand.length) == -1) {
            console.log("Peng length of arr is illegal.");
            throw "Peng number of cards is illegal";
        }
        return hand.reduce(function (total, x) {
            return x == target ? total + 1 : total;
        }, 0) >= 2;
    }
    function getInitialState() {
        return { board: getInitialBoard(), delta: null };
    }
    gameLogic.getInitialState = getInitialState;
    function isTie(board) {
        return board.stock[136] >= 136 && board.legalMove[5] === 0;
    }
    function getWinner(board) {
        return '';
    }
    /**
     * Returns the move that should be performed when player
     * with index turnIndexBeforeMove makes a move.
     */
    function createMove(stateBeforeMove, movetype, pai, turnIndexBeforeMove) {
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }
        var board = stateBeforeMove.board;
        var boardAfterMove = angular.copy(board);
        var currenntPlayer = (boardAfterMove.turn === 1 || boardAfterMove.turn === 2) ? 'O' : 'X';
        var endMatchScores;
        var turnIndexAfterMove = turnIndexBeforeMove;
        if (movetype === 4) {
            turnIndexAfterMove = -1;
            boardAfterMove.turn = -1;
            endMatchScores = currenntPlayer === 'X' ? [1, 0] : [0, 1];
        }
        else if (movetype === 5 && isTie(board)) {
            boardAfterMove.turn = -1;
            turnIndexAfterMove = -1;
            endMatchScores = [0, 0];
        }
        else {
            boardAfterMove.turn = (boardAfterMove.turn + 1) % 4;
            endMatchScores = null;
        }
        var playerToUpdate = currenntPlayer === "X" ? boardAfterMove.px : boardAfterMove.po;
        var theOtherPlayer = currenntPlayer === "X" ? boardAfterMove.po : boardAfterMove.px;
        /** current move is CHI- Left*/
        if (movetype === 0) {
            var pais = [pai + 1, pai + 2, pai];
            movePaitoOpen(playerToUpdate, pais);
        }
        /** current move is CHI-  Middle*/
        if (movetype === 1) {
            var pais = [pai - 1, pai + 1, pai];
            movePaitoOpen(playerToUpdate, pais);
        }
        /** current move is CHI- Right*/
        if (movetype === 2) {
            var pais = [pai - 1, pai - 2, pai];
            movePaitoOpen(playerToUpdate, pais);
        }
        /** current move is Peng*/
        if (movetype === 3) {
            var pais = [pai, pai, pai];
            movePaitoOpen(playerToUpdate, pais);
        }
        if (movetype <= 3) {
            boardAfterMove.out.pop();
        }
        /** current move is Zhua*/
        if (movetype === 5) {
            fetchPai(boardAfterMove.stock, 1, playerToUpdate);
            pai = playerToUpdate.hand[playerToUpdate.hand.length - 1];
        }
        /** current move is Da*/
        if (movetype === 6) {
            var index = playerToUpdate.hand.indexOf(pai);
            if (index === -1) {
                throw new Error("This pai does not belong to player x");
            }
            playerToUpdate.hand.splice(index, 1);
            playerToUpdate.hand.sort(compareNumbers);
            boardAfterMove.out.push(pai);
            turnIndexAfterMove = (turnIndexBeforeMove + 1) % 2;
        }
        var checkhand = turnIndexAfterMove === 0 ? angular.copy(boardAfterMove.px.hand) : angular.copy(boardAfterMove.po.hand);
        var npai = movetype === 5 ? checkhand.pop() : pai;
        boardAfterMove.legalMove = checkLegalMove(checkhand, npai, movetype, boardAfterMove.turn % 2);
        // Sort current hand
        var currenthand = angular.copy(playerToUpdate.hand);
        if (movetype === 5) {
            var ZhuaPai = currenthand.pop();
            playerToUpdate.hand = currenthand.sort(compareNumbers);
            playerToUpdate.hand.push(ZhuaPai);
        }
        else {
            playerToUpdate.hand = currenthand.sort(compareNumbers);
        }
        var delta = { pai: pai, movetype: movetype };
        var stateAfterMove = { delta: delta, board: boardAfterMove };
        return { endMatchScores: endMatchScores, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove };
    }
    gameLogic.createMove = createMove;
    function movePaitoOpen(player, pai) {
        for (var i = 0; i < 2; i++) {
            player.open.push(pai[i]);
            var index = player.hand.indexOf(pai[i]);
            if (index === -1) {
                throw new Error("MovePaitoOPEN is illegal" + player.hand);
            }
            player.hand.splice(index, 1);
        }
        player.open.push(pai[2]);
        player.open.sort(compareNumbers);
    }
    function checkLegalMove(hand, pai, movetype, turn) {
        var legal = [];
        if (turn === 1) {
            legal = ifChi(hand, pai);
            if (ifPeng(hand, pai)) {
                legal.push(1);
            }
            else {
                legal.push(0);
            }
            if (ifHu(hand, pai)) {
                legal.push(1);
            }
            else {
                legal.push(0);
            }
            legal.push(1);
            legal.push(0);
        }
        else {
            legal = [0, 0, 0, 0];
            if ((movetype === 5 || movetype === 6) && ifHu(hand, pai)) {
                legal.push(1);
            }
            else {
                legal.push(0);
            }
            legal.push(0);
            legal.push(1);
        }
        return legal;
    }
    function checkMoveOk(stateTransition) {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        /*
        if (justInitiallized) {
          justInitiallized = false;
          return;
        }
        */
        var turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        var stateBeforeMove = stateTransition.stateBeforeMove;
        // Don't need to check if the game is just initiallized. 
        if (!stateBeforeMove) {
            return;
        }
        var move = stateTransition.move;
        var deltaValue = stateTransition.move.stateAfterMove.delta;
        var pai = deltaValue.pai;
        var movetype = deltaValue.movetype;
        var expectedMove = createMove(stateBeforeMove, movetype, pai, turnIndexBeforeMove);
        if (!angular.equals(move, expectedMove)) {
            throw new Error("Expected move=" + angular.toJson(expectedMove, true) +
                ", but got stateTransition=" + angular.toJson(stateTransition.move, true));
        }
    }
    gameLogic.checkMoveOk = checkMoveOk;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map