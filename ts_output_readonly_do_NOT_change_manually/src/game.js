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