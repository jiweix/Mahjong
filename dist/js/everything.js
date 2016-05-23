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
    function ifSevenDouble(cards) {
        var newcards = angular.copy(cards);
        if (newcards.length != 14) {
            return false;
        }
        var sevendouble = true;
        newcards.sort(compareNumbers);
        for (var i = 0; i < 7; i++) {
            if (newcards[i * 2] != newcards[i * 2 + 1]) {
                sevendouble = false;
                break;
            }
        }
        return sevendouble;
    }
    gameLogic.ifSevenDouble = ifSevenDouble;
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
        if (ifSevenDouble(newcards)) {
            return true;
        }
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
            if (board.turn === 1 || board.turn === 3) {
                currenntPlayer === 'X' ? boardAfterMove.px.hand.push(pai) : boardAfterMove.po.hand.push(pai);
            }
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
        if (movetype <= 3 || (movetype === 4 && (board.turn === 1 || board.turn === 3))) {
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
            var index = player.hand.indexOf(pai[i]);
            if (index === -1) {
                throw new Error("MovePaitoOPEN is illegal" + player.hand);
            }
            player.hand.splice(index, 1);
        }
        pai.sort(compareNumbers);
        for (var i = 0; i < 3; i++) {
            player.open.push(pai[i]);
        }
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
;
;
var game;
(function (game) {
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console:
    // game.state
    game.animationEnded = false;
    game.canMakeMove = false;
    game.isComputerTurn = false;
    game.move = null;
    game.isHelpModalShown = false;
    /** added for Mahjong */
    game.paiSelected = null;
    game.cpai = null;
    game.chand = null;
    game.ohand = null;
    game.handindex = null;
    game.opphandindex = null;
    game.openindex = null;
    game.oppopenindex = null;
    game.playerHandLength = null;
    game.opponentHandLength = null;
    game.playerOpenLength = null;
    game.opponentOpenLength = null;
    game.outLength = null;
    game.outindex = null;
    game.player = null;
    game.opp = null;
    game.selectedIndex = -1;
    game.ifEnd = false;
    game.paiLeft = null;
    game.canSelectPai = false;
    game.zhuaTurn = true;
    //export let playerIndexCounter : number = -1;
    //let yourPlayerIndexAddjust : number = 0;
    game.MOVE = ["LCHI", "MCHI", "RCHI", "PENG", "HU", "ZHUA", "DA"];
    function init() {
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        log.log("Translation of 'RULES_OF_MAHJONG' is " + translate('RULES_OF_MAHJONG'));
        resizeGameAreaService.setWidthToHeight(1.5);
        moveService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            checkMoveOk: gameLogic.checkMoveOk,
            updateUI: updateUI
        });
        // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
        document.addEventListener("animationend", animationEndedCallback, false); // standard
        document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
        document.addEventListener("oanimationend", animationEndedCallback, false); // Opera
        var w = window;
        if (w["HTMLInspector"]) {
            setInterval(function () {
                w["HTMLInspector"].inspect({
                    excludeRules: ["unused-classes", "script-placement"],
                });
            }, 3000);
        }
    }
    game.init = init;
    function getTranslations() {
        return {
            RULES_OF_MAHJONG: {
                en: "Rules of Mahjong",
                ch: "麻将规则",
            },
            RULES_SLIDE1: {
                en: "Try to match you tiles to a pattern that can HU by moves including CHI, PONG, ZHUA, DA",
                ch: "通过不断抓、打、吃、碰达到和牌的目的。",
            },
            RULES_SLIDE2: {
                en: "Your tiles should include ONE pair, and the rest match XXX or XYZ pattern.",
                ch: "和牌需要有一对将牌，其余的满足三个相同牌或者三个连续牌。",
            },
            CLOSE: {
                en: "Close",
                ch: "关闭",
            },
        };
    }
    function animationEndedCallback() {
        $rootScope.$apply(function () {
            log.info("Animation ended");
            game.animationEnded = true;
            sendComputerMove();
        });
    }
    function sendComputerMove() {
        if (!game.isComputerTurn) {
            return;
        }
        game.isComputerTurn = false; // to make sure the computer can only move once.
        moveService.makeMove(aiService.findComputerMove(game.move));
    }
    function getRange(index) {
        var arr = [];
        for (var j = 0; j < index; j++) {
            arr.push(j);
        }
        return arr;
    }
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.animationEnded = false;
        game.move = params.move;
        game.state = game.move.stateAfterMove;
        if (!game.state) {
            game.state = gameLogic.getInitialState();
        }
        game.ifEnd = params.move.turnIndexAfterMove == -1;
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
        if (game.canMakeMove) {
            game.canSelectPai = game.state.board.turn % 2 === 0;
        }
        if (params.stateBeforeMove) {
            if (game.state.delta.movetype === 5) {
                game.zhuaTurn = true;
            }
            else {
                game.zhuaTurn = false;
            }
        }
        // Initiallize the pai for next move  
        // need to consider option 4
        game.cpai = game.state.board.out[game.state.board.out.length - 1];
        game.paiLeft = 136 - game.state.board.stock[136];
        game.player = params.yourPlayerIndex === 0 ? game.state.board.px : game.state.board.po;
        game.opp = params.yourPlayerIndex === 0 ? game.state.board.po : game.state.board.px;
        game.chand = game.player.hand;
        game.ohand = game.opp.hand;
        game.playerHandLength = game.chand.length;
        game.opponentHandLength = game.opp.hand.length;
        game.playerOpenLength = game.player.open.length;
        game.opponentOpenLength = game.opp.open.length;
        game.outLength = game.state.board.out.length;
        game.handindex = getRange(game.chand.length);
        game.opphandindex = getRange(game.opp.hand.length);
        game.openindex = getRange(game.player.open.length);
        game.oppopenindex = getRange(game.opp.open.length);
        game.outindex = getRange(game.outLength);
        // Is it the computer's turn?
        game.isComputerTurn = game.canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        if (game.isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            game.canMakeMove = false;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            if (!game.state.delta) {
                // This is the first move in the match, so
                // there is not going to be an animation, so
                // call sendComputerMove() now (can happen in ?onlyAIs mode)
                sendComputerMove();
            }
        }
    }
    function paiClicked(index) {
        if (game.canSelectPai) {
            game.paiSelected = game.chand[index];
            game.selectedIndex = index;
        }
    }
    game.paiClicked = paiClicked;
    function zhuaPai(index) {
        /**
          if (!canMakeMove || !zhuaTurn) {
              return false;
          } else {
              return index === chand.length -1 ;
          }
        */
        return [2, 5, 8, 11, 14].indexOf(game.chand.length) != -1
            && index === game.chand.length - 1
            && game.zhuaTurn;
    }
    game.zhuaPai = zhuaPai;
    function optionClicked(option) {
        if (option === 6) {
            if (game.paiSelected === null) {
                log.info("You need to select a Pai Before DA");
                return;
            }
            else {
                game.cpai = game.paiSelected;
            }
        }
        else if (option === 5) {
            game.cpai = null;
        }
        log.info("Making move ", game.MOVE[option]);
        if (!game.canMakeMove) {
            return;
        }
        try {
            var nextMove = gameLogic.createMove(game.state, option, game.cpai, game.move.turnIndexAfterMove);
            game.canMakeMove = false; // to prevent making another move
            moveService.makeMove(nextMove);
        }
        catch (e) {
            log.info(["something funny is happenning ...", option, game.cpai]);
            return;
        }
    }
    game.optionClicked = optionClicked;
    function ifLegalMove(index) {
        if (!game.canMakeMove) {
            return false;
        }
        else {
            return game.state.board.legalMove[index] === 1;
        }
    }
    game.ifLegalMove = ifLegalMove;
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isHelpModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map
;
var aiService;
(function (aiService) {
    /** Returns the move that the computer player should do for the given state in move. */
    function findComputerMove(move) {
        return createComputerMove(move, 
        // at most 1 second for the AI to choose a move (but might be much quicker)
        { millisecondsLimit: 1000 });
    }
    aiService.findComputerMove = findComputerMove;
    /**
     * Returns all the possible moves for the given state and turnIndexBeforeMove.
     * Returns an empty array if the game is over.
     */
    function getPossibleMoves(state, turnIndexBeforeMove) {
        var possibleMoves = [];
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                try {
                    possibleMoves.push(gameLogic.createMove(state, i, j, turnIndexBeforeMove));
                }
                catch (e) {
                }
            }
        }
        return possibleMoves;
    }
    aiService.getPossibleMoves = getPossibleMoves;
    /**
     * Returns the move that the computer player should do for the given state.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(move, alphaBetaLimits) {
        // We use alpha-beta search, where the search states are TicTacToe moves.
        return alphaBetaService.alphaBetaDecision(move, move.turnIndexAfterMove, getNextStates, getStateScoreForIndex0, null, alphaBetaLimits);
    }
    aiService.createComputerMove = createComputerMove;
    function getStateScoreForIndex0(move, playerIndex) {
        var endMatchScores = move.endMatchScores;
        if (endMatchScores) {
            return endMatchScores[0] > endMatchScores[1] ? Number.POSITIVE_INFINITY
                : endMatchScores[0] < endMatchScores[1] ? Number.NEGATIVE_INFINITY
                    : 0;
        }
        return 0;
    }
    function getNextStates(move, playerIndex) {
        return getPossibleMoves(move.stateAfterMove, playerIndex);
    }
})(aiService || (aiService = {}));
//# sourceMappingURL=aiService.js.map