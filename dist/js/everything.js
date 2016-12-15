"use strict"; var emulatorServicesCompilationDate = "Wed Nov 23 09:50:44 EST 2016";

;
var gamingPlatform;
(function (gamingPlatform) {
    var log;
    (function (log_1) {
        var ILogLevel = (function () {
            function ILogLevel() {
            }
            ILogLevel.ALWAYS = 'ALWAYS';
            ILogLevel.LOG = 'LOG';
            ILogLevel.INFO = 'INFO';
            ILogLevel.DEBUG = 'DEBUG';
            ILogLevel.WARN = 'WARN';
            ILogLevel.ERROR = 'ERROR';
            return ILogLevel;
        })();
        var alwaysLogs = [];
        var lastLogs = [];
        var startTime = getCurrentTime();
        function getCurrentTime() {
            return window.performance ? window.performance.now() : new Date().getTime();
        }
        log_1.getCurrentTime = getCurrentTime;
        function getLogEntry(args, logLevel, consoleFunc) {
            var millisecondsFromStart = getCurrentTime() - startTime;
            // Note that if the first argument to console.log is a string,
            // then it's supposed to be a format string, see:
            // https://developer.mozilla.org/en-US/docs/Web/API/Console/log
            // However, the output looks better on chrome if I pass a string as the first argument,
            // and I hope then it doesn't break anything anywhere else...
            var secondsFromStart = Math.round(millisecondsFromStart) / 1000;
            var consoleArgs = ['', secondsFromStart, ' seconds:'].concat(args);
            consoleFunc.apply(console, consoleArgs);
            return { millisecondsFromStart: millisecondsFromStart, args: args, logLevel: logLevel };
        }
        function storeLog(args, logLevel, consoleFunc) {
            if (lastLogs.length > 100) {
                lastLogs.shift();
            }
            lastLogs.push(getLogEntry(args, logLevel, consoleFunc));
        }
        function getLogs() {
            return lastLogs.concat(alwaysLogs);
        }
        log_1.getLogs = getLogs;
        function alwaysLog() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            alwaysLogs.push(getLogEntry(args, ILogLevel.ALWAYS, console.log));
        }
        log_1.alwaysLog = alwaysLog;
        function info() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            storeLog(args, ILogLevel.INFO, console.log); // Not console.info on purpose: info is considered a warning in protractor.
        }
        log_1.info = info;
        function debug() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            storeLog(args, ILogLevel.DEBUG, console.debug);
        }
        log_1.debug = debug;
        function warn() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            storeLog(args, ILogLevel.WARN, console.warn);
        }
        log_1.warn = warn;
        function error() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            storeLog(args, ILogLevel.ERROR, console.error);
        }
        log_1.error = error;
        function log() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            storeLog(args, ILogLevel.LOG, console.log);
        }
        log_1.log = log;
    })(log = gamingPlatform.log || (gamingPlatform.log = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=log.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    var stateService;
    (function (stateService) {
        var game;
        var currentState;
        var lastState;
        var currentVisibleTo;
        var lastVisibleTo;
        var lastMove;
        var turnIndexBeforeMove;
        var turnIndex = 0; // turn after the move (-1 when the game ends)
        var endMatchScores = null;
        var setTurnOrEndMatchCount = 0;
        var playersInfo;
        var playMode = "passAndPlay"; // Default play mode
        var randomSeed;
        var moveNumber;
        var simulateServerDelayMilliseconds = 10;
        function setSimulateServerDelayMilliseconds(_simulateServerDelayMilliseconds) {
            simulateServerDelayMilliseconds = _simulateServerDelayMilliseconds;
        }
        stateService.setSimulateServerDelayMilliseconds = setSimulateServerDelayMilliseconds;
        function setPlayMode(_playMode) {
            playMode = _playMode;
        }
        stateService.setPlayMode = setPlayMode;
        function setRandomSeed(_randomSeed) {
            randomSeed = _randomSeed;
        }
        stateService.setRandomSeed = setRandomSeed;
        function setPlayers(_playersInfo) {
            playersInfo = _playersInfo;
        }
        stateService.setPlayers = setPlayers;
        function initNewMatch() {
            if (!game) {
                throwError("You must call setGame before any other method.");
            }
            currentState = {};
            lastState = null;
            currentVisibleTo = {};
            lastVisibleTo = null;
            lastMove = [];
            turnIndexBeforeMove = 0;
            turnIndex = 0; // can be -1 in the last updateUI after the game ended.
            endMatchScores = null;
            moveNumber = 0;
        }
        stateService.initNewMatch = initNewMatch;
        //Function to get the keys from a JSON object
        function getKeys(object) {
            if (Object && Object.keys) {
                return Object.keys(object);
            }
            var keys = [];
            for (var key in object) {
                keys.push(key);
            }
            return keys;
        }
        function clone(obj) {
            return angular.copy(obj);
        }
        function isNull(obj) {
            return obj === undefined || obj === null;
        }
        function throwError() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            gamingPlatform.log.error("Throwing an error with these arguments=", args);
            var msg = args.join(", ");
            throw new Error(msg);
        }
        function getMoveForPlayerIndex(playerIndex, move) {
            var moveForPlayer = [];
            for (var _i = 0; _i < move.length; _i++) {
                var operation = move[_i];
                if (!isNull(operation.set) &&
                    !isNull(operation.set.visibleToPlayerIndexes) &&
                    operation.set.visibleToPlayerIndexes.indexOf(playerIndex) === -1) {
                    moveForPlayer.push({
                        set: {
                            key: operation.set.key,
                            value: null,
                            visibleToPlayerIndexes: operation.set.visibleToPlayerIndexes
                        }
                    });
                }
                else {
                    moveForPlayer.push(operation);
                }
            }
            return moveForPlayer;
        }
        function getStateForPlayerIndex(playerIndex, gameState, visibleTo) {
            if (gameState === null) {
                return null;
            }
            var result = {};
            var keys = getKeys(gameState);
            for (var _i = 0; _i < keys.length; _i++) {
                var key = keys[_i];
                var visibleToPlayerIndexes = visibleTo[key];
                var value = null;
                if (isNull(visibleToPlayerIndexes) || visibleToPlayerIndexes.indexOf(playerIndex) > -1) {
                    value = gameState[key];
                }
                result[key] = value;
            }
            return result;
        }
        function shuffle(keys) {
            var keysCopy = keys.slice(0);
            var result = [];
            while (keysCopy.length >= 1) {
                var index = randomFromTo(0, keysCopy.length);
                var removed = keysCopy.splice(index, 1)[0];
                result.push(removed);
            }
            return result;
        }
        function randomFromTo(from, to) {
            if (isNull(from) || isNull(to) || from >= to) {
                throw new Error("In randomFromTo(from,to), you must have from<to, but from=" + from + " to=" + to);
            }
            return Math.floor(Math.random() * (to - from) + from);
        }
        stateService.randomFromTo = randomFromTo;
        function processApiOperation(operation) {
            //Check for all types of Operations
            var key;
            var visibleToPlayerIndexes;
            if (!isNull(operation.set)) {
                var opSet = operation.set;
                key = opSet.key;
                visibleToPlayerIndexes = opSet.visibleToPlayerIndexes;
                var value = opSet.value;
                if (isNull(key) || isNull(value)) {
                    throwError("Fields key and value in Set operation must be non null. operation=" + angular.toJson(operation, true));
                }
                currentState[key] = value;
                if (visibleToPlayerIndexes) {
                    currentVisibleTo[key] = visibleToPlayerIndexes;
                }
                else {
                    delete currentVisibleTo[key];
                }
            }
            else if (!isNull(operation.setTurn)) {
                var setTurn = operation.setTurn;
                turnIndex = setTurn.turnIndex;
                setTurnOrEndMatchCount++;
            }
            else if (!isNull(operation.setRandomInteger)) {
                var setRandomInteger = operation.setRandomInteger;
                key = setRandomInteger.key;
                var from = setRandomInteger.from;
                var to = setRandomInteger.to;
                if (isNull(key) || isNull(from) || isNull(to)) {
                    throwError("Fields key, from, and to, in SetRandomInteger operation must be non null. operation=" + angular.toJson(operation, true));
                }
                var randomValue = randomFromTo(from, to);
                currentState[key] = randomValue;
                delete currentVisibleTo[key];
            }
            else if (!isNull(operation.setVisibility)) {
                var setVisibility = operation.setVisibility;
                key = setVisibility.key;
                visibleToPlayerIndexes = setVisibility.visibleToPlayerIndexes;
                if (isNull(key)) {
                    throwError("Fields key in SetVisibility operation must be non null. operation=" + angular.toJson(operation, true));
                }
                if (visibleToPlayerIndexes) {
                    currentVisibleTo[key] = visibleToPlayerIndexes;
                }
                else {
                    delete currentVisibleTo[key];
                }
            }
            else if (!isNull(operation['delete'])) {
                var opDelete = operation['delete'];
                key = opDelete.key;
                if (isNull(key)) {
                    throwError("Field key in Delete operation must be non null. operation=" + angular.toJson(operation, true));
                }
                delete currentState[key];
                delete currentVisibleTo[key];
            }
            else if (!isNull(operation.shuffle)) {
                var opShuffle = operation.shuffle;
                var keys = opShuffle.keys;
                if (isNull(keys) || keys.length === 0) {
                    throwError("Field keys in Shuffle operation must be a non empty array. operation=" + angular.toJson(operation, true));
                }
                var shuffledKeys = shuffle(keys);
                var oldGameState = clone(currentState);
                var oldVisibleTo = clone(currentVisibleTo);
                for (var j = 0; j < shuffledKeys.length; j++) {
                    var fromKey = keys[j];
                    var toKey = shuffledKeys[j];
                    currentState[toKey] = oldGameState[fromKey];
                    currentVisibleTo[toKey] = oldVisibleTo[fromKey];
                }
            }
            else if (!isNull(operation.endMatch)) {
                var endMatch = operation.endMatch;
                setTurnOrEndMatchCount++;
                var scores = endMatch.endMatchScores;
                if (isNull(scores) || scores.length !== playersInfo.length) {
                    throwError("Field scores in EndMatch operation must be an array of the same length as the number of players. operation=" + angular.toJson(operation, true));
                }
                endMatchScores = scores;
                if (playMode === "onlyAIs") {
                    gamingPlatform.$timeout(function () { initNewMatch(); }, 1000); // start a new match in 1 second.
                }
            }
            else {
                throwError("Illegal operation, it must contain either set, setRandomInteger, setVisibility, delete, shuffle, or endMatch: " + angular.toJson(operation, true));
            }
        }
        function getYourPlayerIndex() {
            return playMode === "playWhite" ? 0 :
                playMode === "playBlack" ? 1 :
                    playMode === "playViewer" ? -2 :
                        playMode === "playAgainstTheComputer" || playMode === "onlyAIs" ||
                            playMode === "multiplayer" ||
                            playMode === "passAndPlay" ? turnIndex :
                            Number(playMode);
        }
        function getMatchState() {
            return {
                turnIndexBeforeMove: turnIndexBeforeMove,
                turnIndex: turnIndex,
                endMatchScores: endMatchScores,
                moveNumber: moveNumber,
                randomSeed: randomSeed,
                lastMove: lastMove,
                lastState: lastState,
                currentState: currentState,
                lastVisibleTo: lastVisibleTo,
                currentVisibleTo: currentVisibleTo
            };
        }
        stateService.getMatchState = getMatchState;
        // endMatchScores can be null or undefined (and in the first move in auto-match, it's first null and then undefined, 
        // so we used to send the same updateUI twice).
        // Now, if anything is undefined, then I set it to null.
        function getNullIfUndefined(obj) {
            return obj === undefined ? null : obj;
        }
        function setMatchState(data) {
            turnIndexBeforeMove = getNullIfUndefined(data.turnIndexBeforeMove);
            turnIndex = getNullIfUndefined(data.turnIndex);
            endMatchScores = getNullIfUndefined(data.endMatchScores);
            moveNumber = data.moveNumber ? data.moveNumber : 0;
            randomSeed = getNullIfUndefined(data.randomSeed);
            lastMove = getNullIfUndefined(data.lastMove);
            lastState = getNullIfUndefined(data.lastState);
            currentState = getNullIfUndefined(data.currentState);
            lastVisibleTo = getNullIfUndefined(data.lastVisibleTo);
            currentVisibleTo = getNullIfUndefined(data.currentVisibleTo);
        }
        stateService.setMatchState = setMatchState;
        var lastSentUpdateUI = null; // to prevent sending the same updateUI twice.
        function delayedSendUpdateUi() {
            var yourPlayerIndex = getYourPlayerIndex();
            var moveForIndex = getMoveForPlayerIndex(yourPlayerIndex, lastMove);
            var stateBeforeMove = getStateForPlayerIndex(yourPlayerIndex, lastState, lastVisibleTo);
            var stateAfterMove = getStateForPlayerIndex(yourPlayerIndex, currentState, currentVisibleTo);
            var nextUpdateUI = {
                move: moveForIndex,
                turnIndexBeforeMove: turnIndexBeforeMove,
                turnIndexAfterMove: turnIndex,
                stateBeforeMove: stateBeforeMove,
                stateAfterMove: stateAfterMove,
                numberOfPlayers: playersInfo.length,
                playersInfo: playersInfo,
                yourPlayerIndex: yourPlayerIndex,
                playMode: playMode === "multiplayer" ? yourPlayerIndex : playMode,
                moveNumber: moveNumber,
                randomSeed: randomSeed,
                endMatchScores: endMatchScores
            };
            // Not sending the same updateUI twice.
            if (angular.equals(lastSentUpdateUI, nextUpdateUI))
                return;
            lastSentUpdateUI = nextUpdateUI;
            if (lastMove.length > 0 && game.isMoveOk({
                move: moveForIndex,
                turnIndexBeforeMove: turnIndexBeforeMove,
                turnIndexAfterMove: turnIndex,
                stateBeforeMove: stateBeforeMove,
                stateAfterMove: stateAfterMove,
                numberOfPlayers: playersInfo.length
            }) !== true) {
                throwError("You declared a hacker for a legal move! move=" + moveForIndex);
            }
            game.updateUI(nextUpdateUI);
        }
        function sendUpdateUi() {
            if (simulateServerDelayMilliseconds === 0) {
                delayedSendUpdateUi();
            }
            else {
                gamingPlatform.$timeout(function () { delayedSendUpdateUi(); }, simulateServerDelayMilliseconds);
            }
        }
        stateService.sendUpdateUi = sendUpdateUi;
        function makeMove(operations) {
            if (!game) {
                throwError("You must call setGame before any other method.");
            }
            if (!operations) {
                throwError("operations must be an array");
            }
            // Making sure only turnIndex can make the move
            if (turnIndex === -1) {
                throwError("You cannot send a move after the game ended!");
            }
            if (getYourPlayerIndex() !== turnIndex) {
                throwError("Expected a move from turnIndex=" + turnIndex + " but got the move from index=" + getYourPlayerIndex());
            }
            lastState = clone(currentState);
            lastVisibleTo = clone(currentVisibleTo);
            turnIndexBeforeMove = turnIndex;
            turnIndex = -1;
            lastMove = operations;
            moveNumber++;
            if (randomSeed && Math.seedrandom) {
                Math.seedrandom(randomSeed + moveNumber); // Math.random is used only in processApiOperation
            }
            setTurnOrEndMatchCount = 0;
            for (var _i = 0; _i < operations.length; _i++) {
                var operation = operations[_i];
                processApiOperation(operation);
            }
            // We must have either SetTurn or EndMatch
            if (setTurnOrEndMatchCount !== 1) {
                throwError("We must have either SetTurn or EndMatch, but not both: setTurnOrEndMatchCount=" + setTurnOrEndMatchCount);
            }
            // if (moveNumber > 1 &&
            //     turnIndex == turnIndexBeforeMove) {
            //     throwError("turnIndex must be different from turnIndexBeforeMove, but both are equal to " + turnIndex);
            // }
            if (!(turnIndex >= -1 && turnIndex < playersInfo.length)) {
                throwError("turnIndex must be between -1 and " + playersInfo.length + ", but it was " + turnIndex + ".");
            }
            sendUpdateUi();
        }
        stateService.makeMove = makeMove;
        function setGame(_game) {
            if (game !== undefined) {
                throwError("You can call setGame only once");
            }
            game = _game;
        }
        stateService.setGame = setGame;
        function getEndMatchScores() {
            return endMatchScores;
        }
        stateService.getEndMatchScores = getEndMatchScores;
    })(stateService = gamingPlatform.stateService || (gamingPlatform.stateService = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=stateService.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    var messageService;
    (function (messageService) {
        var gameUrl = location.toString();
        function sendMessage(message) {
            gamingPlatform.log.info("Game sent message", message);
            message.gameUrl = gameUrl;
            window.parent.postMessage(message, "*");
        }
        messageService.sendMessage = sendMessage;
        ;
        function addMessageListener(listener) {
            window.addEventListener("message", function (event) {
                var source = event.source;
                if (source !== window.parent) {
                    return;
                }
                var message = event.data;
                gamingPlatform.log.info("Game got message", message);
                gamingPlatform.$rootScope.$apply(function () {
                    listener(message);
                });
            }, false);
        }
        messageService.addMessageListener = addMessageListener;
        ;
    })(messageService = gamingPlatform.messageService || (gamingPlatform.messageService = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=messageService.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    var gameService;
    (function (gameService) {
        var isLocalTesting = window.parent === window ||
            window.location.search === "?test";
        var isLocalTestCommunity = location.search.indexOf("community") !== -1;
        gameService.playMode = location.search.indexOf("onlyAIs") !== -1 ? "onlyAIs"
            : location.search.indexOf("playAgainstTheComputer") !== -1 ? "playAgainstTheComputer"
                : location.search.indexOf("multiplayer") !== -1 ? "multiplayer"
                    : location.search.indexOf("?playMode=") === 0 ? location.search.substr("?playMode=".length)
                        : "passAndPlay"; // Default play mode
        // We verify that you call makeMove at most once for every updateUI (and only when it's your turn)
        var lastUpdateUI = null;
        var game;
        var lastCommunityUI = null;
        function communityUI(communityUI) {
            lastCommunityUI = angular.copy(communityUI);
            game.communityUI(communityUI);
        }
        gameService.communityUI = communityUI;
        function communityMove(proposal, move) {
            if (!lastCommunityUI) {
                throw new Error("Don't call communityMove before getting communityUI.");
            }
            if (move) {
                gamingPlatform.moveService.checkMove(move);
            }
            var wasYourTurn = lastCommunityUI.move.turnIndexAfterMove >= 0 &&
                lastCommunityUI.yourPlayerIndex === lastCommunityUI.move.turnIndexAfterMove; // it's my turn
            if (!wasYourTurn) {
                throw new Error("Called communityMove when it wasn't your turn: yourPlayerIndex=" + lastCommunityUI.yourPlayerIndex + " turnIndexAfterMove=" + lastCommunityUI.move.turnIndexAfterMove);
            }
            var oldProposal = lastCommunityUI.playerIdToProposal[lastCommunityUI.yourPlayerInfo.playerId];
            if (oldProposal) {
                throw new Error("Called communityMove when yourPlayerId already made a proposal, see: " + angular.toJson(oldProposal, true));
            }
            if (isLocalTesting) {
                // I'm using $timeout so it will be more like production (where we use postMessage),
                // so the communityUI response is not sent immediately).
                var nextCommunityUI = lastCommunityUI;
                if (move) {
                    nextCommunityUI.turnIndexBeforeMove = nextCommunityUI.move.turnIndexAfterMove;
                    nextCommunityUI.stateBeforeMove = nextCommunityUI.move.stateAfterMove;
                    nextCommunityUI.playerIdToProposal = {};
                    nextCommunityUI.yourPlayerIndex = move.turnIndexAfterMove;
                    nextCommunityUI.move = move;
                }
                else {
                    nextCommunityUI.playerIdToProposal[nextCommunityUI.yourPlayerInfo.playerId] = proposal;
                }
                nextCommunityUI.yourPlayerInfo.playerId = 'playerId' + Math.random();
                gamingPlatform.$timeout(function () {
                    communityUI(nextCommunityUI);
                }, 10);
            }
            else {
                gamingPlatform.messageService.sendMessage({ communityMove: { proposal: proposal, move: move, lastCommunityUI: lastCommunityUI } });
            }
            lastCommunityUI = null;
        }
        gameService.communityMove = communityMove;
        function updateUI(params) {
            lastUpdateUI = angular.copy(params);
            game.updateUI(params);
        }
        gameService.updateUI = updateUI;
        function makeMove(move) {
            if (!lastUpdateUI) {
                throw new Error("Game called makeMove before getting updateUI or it called makeMove more than once for a single updateUI.");
            }
            var wasYourTurn = lastUpdateUI.turnIndexAfterMove >= 0 &&
                lastUpdateUI.yourPlayerIndex === lastUpdateUI.turnIndexAfterMove; // it's my turn
            if (!wasYourTurn) {
                throw new Error("Game called makeMove when it wasn't your turn: yourPlayerIndex=" + lastUpdateUI.yourPlayerIndex + " turnIndexAfterMove=" + lastUpdateUI.turnIndexAfterMove);
            }
            if (!move || !move.length) {
                throw new Error("Game called makeMove with an empty move=" + move);
            }
            if (isLocalTesting) {
                // I'm using $timeout so it will be more like production (where we use postMessage),
                // so the updateUI response is not sent immediately).
                gamingPlatform.$timeout(function () {
                    gamingPlatform.stateService.makeMove(move);
                }, 10);
            }
            else {
                gamingPlatform.messageService.sendMessage({ makeMove: move, lastUpdateUI: lastUpdateUI });
            }
            lastUpdateUI = null; // to make sure you don't call makeMove until you get the next updateUI.
        }
        gameService.makeMove = makeMove;
        function getNumberOfPlayers() {
            return gamingPlatform.stateService.randomFromTo(game.minNumberOfPlayers, game.maxNumberOfPlayers + 1);
            ;
        }
        function getPlayers() {
            var playersInfo = [];
            var actualNumberOfPlayers = getNumberOfPlayers();
            for (var i = 0; i < actualNumberOfPlayers; i++) {
                var playerId = gameService.playMode === "onlyAIs" ||
                    i !== 0 && gameService.playMode === "playAgainstTheComputer" ?
                    "" :
                    "" + (i + 42);
                playersInfo.push({ playerId: playerId, avatarImageUrl: null, displayName: null });
            }
            return playersInfo;
        }
        var didCallSetGame = false;
        var w = window;
        function setGame(_game) {
            game = _game;
            if (didCallSetGame) {
                throw new Error("You can call setGame exactly once!");
            }
            didCallSetGame = true;
            var playersInfo = getPlayers();
            if (isLocalTesting) {
                if (w.game) {
                    w.game.isHelpModalShown = true;
                }
                if (isLocalTestCommunity) {
                    gamingPlatform.$timeout(function () { return communityUI({
                        yourPlayerIndex: 0,
                        yourPlayerInfo: {
                            avatarImageUrl: "",
                            displayName: "",
                            playerId: "playerId" + Math.random(),
                        },
                        playerIdToProposal: {},
                        numberOfPlayers: getNumberOfPlayers(),
                        stateBeforeMove: null,
                        turnIndexBeforeMove: 0,
                        move: {
                            endMatchScores: null,
                            turnIndexAfterMove: 0,
                            stateAfterMove: null,
                        }
                    }); }, 200);
                }
                else {
                    gamingPlatform.stateService.setGame({ updateUI: updateUI, isMoveOk: game.isMoveOk });
                    gamingPlatform.stateService.initNewMatch();
                    gamingPlatform.stateService.setPlayMode(gameService.playMode);
                    gamingPlatform.stateService.setPlayers(playersInfo);
                    gamingPlatform.stateService.sendUpdateUi();
                }
            }
            else {
                gamingPlatform.messageService.addMessageListener(function (message) {
                    if (message.isMoveOk) {
                        var isMoveOkResult = game.isMoveOk(message.isMoveOk);
                        if (isMoveOkResult !== true) {
                            isMoveOkResult = { result: isMoveOkResult, isMoveOk: message.isMoveOk };
                        }
                        gamingPlatform.messageService.sendMessage({ isMoveOkResult: isMoveOkResult });
                    }
                    else if (message.communityUI) {
                        communityUI(message.communityUI);
                    }
                    else if (message.updateUI) {
                        updateUI(message.updateUI);
                    }
                    else if (message.setLanguage) {
                        gamingPlatform.translate.setLanguage(message.setLanguage.language, message.setLanguage.codeToL10N);
                        // we need to ack this message to the platform so the platform will make the game-iframe visible
                        // (The platform waited until the game got the l10n.)
                        // Using setTimeout to give time for angular to refresh it's UI (the default was in English)
                        setTimeout(function () {
                            gamingPlatform.messageService.sendMessage({ setLanguageResult: true });
                        });
                    }
                    else if (message.getGameLogs) {
                        // To make sure students don't get:
                        // Error: Uncaught DataCloneError: Failed to execute 'postMessage' on 'Window': An object could not be cloned.
                        // I serialize to string and back.
                        var plainPojoLogs = angular.fromJson(angular.toJson(gamingPlatform.log.getLogs()));
                        setTimeout(function () {
                            gamingPlatform.messageService.sendMessage({ getGameLogsResult: plainPojoLogs });
                        });
                    }
                    else if (message.getStateForOgImage) {
                        gamingPlatform.messageService.sendMessage({ sendStateForOgImage: game.getStateForOgImage() });
                    }
                    else if (message.passMessageToGame) {
                        var msgFromPlatform = message.passMessageToGame;
                        if (msgFromPlatform.SHOW_GAME_INSTRUCTIONS && w.game) {
                            w.game.isHelpModalShown = !w.game.isHelpModalShown;
                        }
                        if (game.gotMessageFromPlatform)
                            game.gotMessageFromPlatform(msgFromPlatform);
                    }
                });
                // I wanted to delay sending gameReady until window.innerWidth and height are not 0,
                // but they will stay 0 (on ios) until we send gameReady (because platform will hide the iframe)
                gamingPlatform.messageService.sendMessage({ gameReady: {} });
            }
            // Show an empty board to a viewer (so you can't perform moves).
            gamingPlatform.log.info("Passing a 'fake' updateUI message in order to show an empty board to a viewer (so you can NOT perform moves)");
            updateUI({
                move: [],
                turnIndexBeforeMove: 0,
                turnIndexAfterMove: 0,
                stateBeforeMove: null,
                stateAfterMove: {},
                yourPlayerIndex: -2,
                playersInfo: playersInfo,
                playMode: "passAndPlay",
                endMatchScores: null,
                moveNumber: 0, randomSeed: "",
                numberOfPlayers: playersInfo.length
            });
        }
        gameService.setGame = setGame;
    })(gameService = gamingPlatform.gameService || (gamingPlatform.gameService = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=gameService.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    var moveService;
    (function (moveService) {
        var STATE_KEY = "state";
        function convertOldState(state) {
            return state ? state[STATE_KEY] : null;
        }
        function convertIsMoveOk(params) {
            return {
                turnIndexBeforeMove: params.turnIndexBeforeMove,
                numberOfPlayers: params.numberOfPlayers,
                stateBeforeMove: convertOldState(params.stateBeforeMove),
                move: convertOldMove(params.move)
            };
        }
        function convertUpdate(params) {
            return {
                playersInfo: params.playersInfo,
                yourPlayerIndex: params.yourPlayerIndex,
                playMode: params.playMode,
                turnIndexBeforeMove: params.turnIndexBeforeMove,
                numberOfPlayers: params.numberOfPlayers,
                stateBeforeMove: convertOldState(params.stateBeforeMove),
                // Not using convertOldMove, because one of the players might have
                // dismissed the match, so turnIndexAfterMove might be -1 (even though the move sets to another player index)
                move: {
                    endMatchScores: params.endMatchScores,
                    turnIndexAfterMove: params.turnIndexAfterMove,
                    stateAfterMove: convertOldState(params.stateAfterMove),
                },
            };
        }
        function convertOldMove(move) {
            if (!move || move.length === 0) {
                return {
                    endMatchScores: null,
                    turnIndexAfterMove: 0,
                    stateAfterMove: null,
                };
            }
            if (move.length !== 2 || !(move[0].setTurn || move[0].endMatch) || !move[1].set) {
                throw new Error("Internal error: old move should be an array with 2 operations! old move=" +
                    angular.toJson(move, true));
            }
            return {
                endMatchScores: move[0].endMatch ? move[0].endMatch.endMatchScores : null,
                turnIndexAfterMove: move[0].setTurn ? move[0].setTurn.turnIndex : -1,
                stateAfterMove: move[1].set.value,
            };
        }
        function checkMove(move) {
            // Do some checks: turnIndexAfterMove is -1 iff endMatchScores is not null.
            var noTurnIndexAfterMove = move.turnIndexAfterMove === -1;
            var hasEndMatchScores = !!move.endMatchScores;
            if (noTurnIndexAfterMove && !hasEndMatchScores) {
                throw new Error("Illegal move: turnIndexAfterMove was -1 but you forgot to set endMatchScores. Move=" +
                    angular.toJson(move, true));
            }
            if (hasEndMatchScores && !noTurnIndexAfterMove) {
                throw new Error("Illegal move: you set endMatchScores but you didn't set turnIndexAfterMove to -1. Move=" +
                    angular.toJson(move, true));
            }
        }
        moveService.checkMove = checkMove;
        function convertNewMove(move) {
            checkMove(move);
            return [
                move.endMatchScores ? { endMatch: { endMatchScores: move.endMatchScores } } : { setTurn: { turnIndex: move.turnIndexAfterMove } },
                { set: { key: STATE_KEY, value: move.stateAfterMove } }
            ];
        }
        function setGame(game) {
            var oldGame = {
                minNumberOfPlayers: game.minNumberOfPlayers,
                maxNumberOfPlayers: game.maxNumberOfPlayers,
                isMoveOk: function (params) {
                    var move = convertIsMoveOk(params);
                    gamingPlatform.log.info("Calling game.checkMoveOk:", move);
                    game.checkMoveOk(move);
                    return true;
                },
                updateUI: function (params) {
                    var newParams = convertUpdate(params);
                    gamingPlatform.log.info("Calling game.updateUI:", newParams);
                    game.updateUI(newParams);
                },
                communityUI: game.communityUI,
                gotMessageFromPlatform: game.gotMessageFromPlatform,
                getStateForOgImage: game.getStateForOgImage,
            };
            gamingPlatform.gameService.setGame(oldGame);
        }
        moveService.setGame = setGame;
        function makeMove(move) {
            gamingPlatform.log.info("Making move:", move);
            gamingPlatform.gameService.makeMove(convertNewMove(move));
        }
        moveService.makeMove = makeMove;
        function communityMove(proposal, move) {
            gamingPlatform.log.info("Making communityMove: proposal=", proposal, " move=", move);
            gamingPlatform.gameService.communityMove(proposal, move);
        }
        moveService.communityMove = communityMove;
    })(moveService = gamingPlatform.moveService || (gamingPlatform.moveService = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=moveService.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    function resizeMapArea(params) {
        var imageId = params.imageId;
        var mapId = params.mapId;
        var originalWidth = params.originalWidth;
        var originalHeight = params.originalHeight;
        function rescale() {
            var image = document.getElementById(imageId);
            var map = document.getElementById(mapId);
            var widthScale = image.width / originalWidth;
            var heightScale = image.height / originalHeight;
            //console.log("widthScale=", widthScale, "heightScale=", heightScale);
            var areaElements = map.getElementsByTagName("area");
            for (var areaIndex = 0; areaIndex < areaElements.length; areaIndex++) {
                var areaElement = areaElements[areaIndex];
                var originalCoords = areaElement.getAttribute("data-original-coords");
                if (!originalCoords) {
                    areaElement.setAttribute("data-original-coords", areaElement.getAttribute("coords"));
                }
                var coords = areaElement.getAttribute("data-original-coords").split(',');
                var coordsPercent = [];
                for (var i = 0; i < coords.length; ++i) {
                    var coordNum = Number(coords[i]);
                    if (i % 2 === 0) {
                        coordsPercent[i] = Math.round(coordNum * widthScale);
                    }
                    else {
                        coordsPercent[i] = Math.round(coordNum * heightScale);
                    }
                }
                //console.log("before=", coords, "after=", coordsPercent);
                areaElement.setAttribute("coords", coordsPercent.toString());
            }
        }
        document.addEventListener("onresize", rescale);
        document.addEventListener("orientationchange", rescale);
        setInterval(rescale, 1000);
    }
    gamingPlatform.resizeMapArea = resizeMapArea;
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=resizeMapArea.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    var alphaBetaService;
    (function (alphaBetaService) {
        /**
         * Does alpha-beta search, starting from startingState,
         * where the first move is done by playerIndex (playerIndex is either 0 or 1),
         * then the next move is done by 1-playerIndex, etc.
         *
         * getNextStates(state, playerIndex) should return an array of the following states
         * and if state is a terminal state it should return an empty array.
         *
         * getStateScoreForIndex0(state, playerIndex) should return a score for
         * the state as viewed by player index 0, i.e.,
         * if player index 0 is probably winning then the score should be high.
         * Return Number.POSITIVE_INFINITY is player index 0 is definitely winning,
         * and Number.NEGATIVE_INFINITY if player index 0 is definitely losing.
         *
         * getDebugStateToString can either be null (and then there is no output to console)
         * or it can be a function, where getDebugStateToString(state) should return
         * a string representation of the state (which is used in calls to console.log).
         *
         * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
         * and it has either a millisecondsLimit or maxDepth field:
         * millisecondsLimit is a time limit, and maxDepth is a depth limit.
         */
        function alphaBetaDecision(startingState, playerIndex, getNextStates, getStateScoreForIndex0, 
            // If you want to see debugging output in the console, then surf to game.html?debug
            getDebugStateToString, alphaBetaLimits) {
            var move = alphaBetaDecisionMayReturnNull(startingState, playerIndex, getNextStates, getStateScoreForIndex0, getDebugStateToString, alphaBetaLimits);
            if (move) {
                return move;
            }
            // We run out of time, but we have to return a non-null move (no matter what).
            return getNextStates(startingState, playerIndex)[0];
        }
        alphaBetaService.alphaBetaDecision = alphaBetaDecision;
        function alphaBetaDecisionMayReturnNull(startingState, playerIndex, getNextStates, getStateScoreForIndex0, 
            // If you want to see debugging output in the console, then surf to game.html?debug
            getDebugStateToString, alphaBetaLimits) {
            // Checking input
            if (!startingState || !getNextStates || !getStateScoreForIndex0) {
                throw new Error("startingState or getNextStates or getStateScoreForIndex0 is null/undefined");
            }
            if (playerIndex !== 0 && playerIndex !== 1) {
                throw new Error("playerIndex must be either 0 or 1");
            }
            if (!alphaBetaLimits.millisecondsLimit && !alphaBetaLimits.maxDepth) {
                throw new Error("alphaBetaLimits must have either millisecondsLimit or maxDepth");
            }
            if (alphaBetaLimits.millisecondsLimit) {
                // 400 milliseconds is the max time (otherwise the app feels unresponsive).
                alphaBetaLimits.millisecondsLimit = Math.min(400, alphaBetaLimits.millisecondsLimit);
            }
            var startTime = new Date().getTime(); // used for the time limit
            if (alphaBetaLimits.maxDepth) {
                return getScoreForIndex0(startingState, playerIndex, getNextStates, getStateScoreForIndex0, getDebugStateToString, alphaBetaLimits, startTime, 0, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY).bestState;
            }
            // For time limits (without maxDepth), we do iterative deepening (A* search).
            if (getDebugStateToString != null) {
                console.log("Doing iterative-deepeninh (A*) until we run out of time or find a certain win/lose move.");
            }
            var maxDepth = 1;
            var bestState;
            while (true) {
                if (getDebugStateToString != null) {
                    console.log("Alpha-beta search until maxDepth=" + maxDepth);
                }
                var nextBestStateAndScore = getScoreForIndex0(startingState, playerIndex, getNextStates, getStateScoreForIndex0, getDebugStateToString, { maxDepth: maxDepth, millisecondsLimit: alphaBetaLimits.millisecondsLimit }, startTime, 0, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
                var nextBestScore = nextBestStateAndScore.bestScore;
                var nextBestState = nextBestStateAndScore.bestState;
                if (nextBestScore === Number.POSITIVE_INFINITY ||
                    nextBestScore === Number.NEGATIVE_INFINITY) {
                    var isWin = nextBestScore ===
                        (playerIndex === 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
                    console.log("Discovered that AI is going to " +
                        (isWin ? "win" : "lose") + " with maxDepth=" + maxDepth);
                    if (getDebugStateToString != null) {
                        console.log("Best state is " + getDebugStateToString(nextBestState));
                    }
                    return nextBestState;
                }
                var isHalfTimePassed = isTimeout({ millisecondsLimit: alphaBetaLimits.millisecondsLimit / 2 }, startTime);
                var isAllTimePassed = isTimeout(alphaBetaLimits, startTime);
                if (isHalfTimePassed || isAllTimePassed) {
                    // If we run out of half the time, then no point of starting a new search that
                    // will most likely take more time than all previous searches.
                    // It's more accurate to return the best state for the previous alpha-beta search
                    // if we run out of time, because we finished traversing all
                    // immediate children of the starting state.
                    var result = !isAllTimePassed || maxDepth === 1 ? nextBestState : bestState;
                    if (isAllTimePassed) {
                        console.log("Run out of time when maxDepth=" + maxDepth +
                            ", so returning the best state for maxDepth=" +
                            (maxDepth === 1 ? 1 : maxDepth - 1));
                    }
                    else {
                        console.log("Run out of half the time when maxDepth=" + maxDepth +
                            ", so no point of exploring the next depth.");
                    }
                    if (getDebugStateToString != null) {
                        console.log("Best state is " + getDebugStateToString(result));
                    }
                    return result;
                }
                bestState = nextBestState;
                maxDepth++;
            }
        }
        function isTimeout(alphaBetaLimits, startTime) {
            return alphaBetaLimits.millisecondsLimit &&
                new Date().getTime() - startTime > alphaBetaLimits.millisecondsLimit;
        }
        function getScoreForIndex0(startingState, playerIndex, getNextStates, getStateScoreForIndex0, 
            // If you want to see debugging output in the console, then surf to game.html?debug
            getDebugStateToString, alphaBetaLimits, startTime, depth, alpha, beta) {
            var bestScore = null;
            var bestState = null;
            if (isTimeout(alphaBetaLimits, startTime)) {
                if (getDebugStateToString != null) {
                    console.log("Run out of time, just quitting from this traversal.");
                }
                return { bestScore: 0, bestState: null }; // This traversal is "ruined" anyway because we ran out of time.
            }
            if (depth === alphaBetaLimits.maxDepth) {
                bestScore = getStateScoreForIndex0(startingState, playerIndex);
                if (getDebugStateToString != null) {
                    console.log("Max depth reached, score is " + bestScore);
                }
                return { bestScore: bestScore, bestState: null };
            }
            var states = getNextStates(startingState, playerIndex);
            if (getDebugStateToString != null) {
                console.log(getDebugStateToString(startingState) + " has " + states.length + " next states");
            }
            if (states.length === 0) {
                bestScore = getStateScoreForIndex0(startingState, playerIndex);
                if (getDebugStateToString != null) {
                    console.log("Terminal state, score is " + bestScore);
                }
                return { bestScore: bestScore, bestState: null };
            }
            for (var i = 0; i < states.length; i++) {
                var state = states[i];
                var scoreForIndex0 = getScoreForIndex0(state, 1 - playerIndex, getNextStates, getStateScoreForIndex0, getDebugStateToString, alphaBetaLimits, startTime, depth + 1, alpha, beta).bestScore;
                if (getDebugStateToString != null) {
                    console.log("Score of " + getDebugStateToString(state) + " is " + scoreForIndex0);
                }
                if (bestScore === null ||
                    playerIndex === 0 && scoreForIndex0 > bestScore ||
                    playerIndex === 1 && scoreForIndex0 < bestScore) {
                    bestScore = scoreForIndex0;
                    bestState = state;
                }
                if (playerIndex === 0) {
                    if (bestScore >= beta) {
                        return { bestScore: bestScore, bestState: bestState };
                    }
                    alpha = Math.max(alpha, bestScore);
                }
                else {
                    if (bestScore <= alpha) {
                        return { bestScore: bestScore, bestState: bestState };
                    }
                    beta = Math.min(beta, bestScore);
                }
            }
            if (getDebugStateToString != null) {
                console.log("Best next state for playerIndex " + playerIndex + " is " + getDebugStateToString(bestState) + " with score of " + bestScore);
            }
            return { bestScore: bestScore, bestState: bestState };
        }
    })(alphaBetaService = gamingPlatform.alphaBetaService || (gamingPlatform.alphaBetaService = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=alphaBetaService.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    var resizeGameAreaService;
    (function (resizeGameAreaService) {
        var widthToHeight = null;
        var dimensionsChanged = null;
        var oldSizes = null;
        var doc = window.document;
        var gameArea;
        function setWidthToHeight(_widthToHeight, _dimensionsChanged) {
            gamingPlatform.log.info("setWidthToHeight to ", _widthToHeight);
            widthToHeight = _widthToHeight;
            dimensionsChanged = _dimensionsChanged;
            gameArea = doc.getElementById('gameArea');
            if (!gameArea) {
                throw new Error("You forgot to add to your <body> this div: <div id='gameArea'>...</div>");
            }
            oldSizes = null;
            rescale();
            // on iOS there was a bug, if you clicked on a ycheckers notification (when app was killed)
            // then you would miss the animation (because width&height are initially 0, so it took a second to be shown).
            // So I added these timeouts.
            // we usually call setWidthToHeight and gameService.setGame (which sends gameReady) together,
            // so the iframe will be visilble very soon...
            setTimeout(rescale, 10);
            setTimeout(rescale, 100);
        }
        resizeGameAreaService.setWidthToHeight = setWidthToHeight;
        function round2(num) {
            return Math.round(num * 100) / 100;
        }
        function rescale() {
            if (widthToHeight === null) {
                return;
            }
            var originalWindowWidth = window.innerWidth; // doc.body.clientWidth
            var originalWindowHeight = window.innerHeight; // I saw cases where doc.body.clientHeight was 0.
            var windowWidth = originalWindowWidth;
            var windowHeight = originalWindowHeight;
            if (oldSizes !== null) {
                if (oldSizes.windowWidth === windowWidth &&
                    oldSizes.windowHeight === windowHeight) {
                    return; // nothing changed, so no need to change the transformations.
                }
            }
            oldSizes = {
                windowWidth: windowWidth,
                windowHeight: windowHeight
            };
            if (windowWidth === 0 || windowHeight === 0) {
                gamingPlatform.log.info("Window width/height is 0 so hiding gameArea div.");
                gameArea.style.display = "none";
                return;
            }
            gameArea.style.display = "block";
            gamingPlatform.$rootScope.$apply(function () {
                var newWidthToHeight = windowWidth / windowHeight;
                if (newWidthToHeight > widthToHeight) {
                    windowWidth = round2(windowHeight * widthToHeight);
                }
                else {
                    windowHeight = round2(windowWidth / widthToHeight);
                }
                gamingPlatform.log.info("Window size is " + oldSizes.windowWidth + "x" + oldSizes.windowHeight +
                    " so setting gameArea size to " + windowWidth + "x" + windowHeight +
                    " because widthToHeight=" + widthToHeight);
                // Take 5% margin (so the game won't touch the end of the screen)
                var keepMargin = 0.95;
                windowWidth *= keepMargin;
                windowHeight *= keepMargin;
                gameArea.style.width = windowWidth + 'px';
                gameArea.style.height = windowHeight + 'px';
                gameArea.style.position = "absolute";
                gameArea.style.left = ((originalWindowWidth - windowWidth) / 2) + 'px';
                gameArea.style.top = ((originalWindowHeight - windowHeight) / 2) + 'px';
                if (dimensionsChanged)
                    dimensionsChanged(windowWidth, windowHeight);
                setTimeout(rescale, 10); // sometimes it takes a tiny bit for innerWidth&height to update.
            });
        }
        doc.addEventListener("onresize", rescale);
        doc.addEventListener("orientationchange", rescale);
        if (window.matchMedia)
            window.matchMedia('(orientation: portrait)').addListener(rescale);
        setInterval(rescale, 300);
    })(resizeGameAreaService = gamingPlatform.resizeGameAreaService || (gamingPlatform.resizeGameAreaService = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=resizeGameAreaService.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    // This can't be a module, because we use it like:  translate(...) and not like translate.foobar(...)
    function createTranslateService() {
        var language;
        // codeToL10N is deprecated (I keep it for older games that used the platform for i18n)
        // New games should use setTranslations (which sets idToLanguageToL10n).
        var codeToL10N = null;
        var idToLanguageToL10n = null;
        function translate(translationId, interpolateParams, languageCode) {
            if (!languageCode)
                languageCode = language;
            var translation = null;
            if (idToLanguageToL10n && idToLanguageToL10n[translationId]) {
                var languageToL10n = idToLanguageToL10n[translationId];
                translation = languageToL10n[languageCode];
                if (!translation)
                    translation = languageToL10n['en'];
            }
            else if (codeToL10N) {
                translation = codeToL10N[translationId];
            }
            if (!translation) {
                translation = "[" + translationId + "]";
                gamingPlatform.log.error("Couldn't find translationId=" + translationId + " in language=" + languageCode);
            }
            var result = gamingPlatform.$interpolate(translation)(interpolateParams || {});
            if (result.indexOf('{{') !== -1) {
                gamingPlatform.log.error("You forgot to pass a translation parameter (interpolateParams) for translationId=" + translationId + " in language=" + languageCode + " which resulted in '" + result + "' (note that you forgot to pass some {{XXX}})");
            }
            return result;
        }
        var translateService;
        translateService = translate;
        translateService.getLanguage = function () { return language; };
        translateService.setTranslations = function (_idToLanguageToL10n) {
            idToLanguageToL10n = _idToLanguageToL10n;
        };
        translateService.setLanguage = function (_language, _codeToL10N) {
            language = _language;
            codeToL10N = _codeToL10N;
        };
        return translateService;
    }
    gamingPlatform.translate = createTranslateService();
    gamingPlatform.defaultTranslateInterpolateParams = {};
    angular.module('translate', [])
        .filter('translate', ['$parse', function ($parse) {
            var translateFilter = function (translationId, interpolateParams) {
                if (!angular.isObject(interpolateParams)) {
                    interpolateParams = $parse(interpolateParams)(this);
                }
                if (!interpolateParams)
                    interpolateParams = gamingPlatform.defaultTranslateInterpolateParams;
                return gamingPlatform.translate(translationId, interpolateParams);
            };
            translateFilter.$stateful = true;
            return translateFilter;
        }]);
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=angular-translate.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    // You use dragAndDropService like this:
    // dragAndDropService.addDragListener(touchElementId, function handleDragEvent(type, clientX, clientY, event) {...});
    // touchElementId can be "gameArea" (or any other element id).
    // type is either: "touchstart", "touchmove", "touchend", "touchcancel", "touchleave"
    var dragAndDropService;
    (function (dragAndDropService) {
        function addDragListener(touchElementId, handleDragEvent) {
            if (!touchElementId || !handleDragEvent) {
                throw new Error("When calling addDragListener(touchElementId, handleDragEvent), you must pass two parameters");
            }
            var isMouseDown = false;
            function touchHandler(event) {
                var touch = event.changedTouches[0];
                handleEvent(event, event.type, touch.clientX, touch.clientY);
            }
            function mouseDownHandler(event) {
                isMouseDown = true;
                handleEvent(event, "touchstart", event.clientX, event.clientY);
            }
            function mouseMoveHandler(event) {
                if (isMouseDown) {
                    handleEvent(event, "touchmove", event.clientX, event.clientY);
                }
            }
            function mouseUpHandler(event) {
                isMouseDown = false;
                handleEvent(event, "touchend", event.clientX, event.clientY);
            }
            function handleEvent(event, type, clientX, clientY) {
                // http://stackoverflow.com/questions/3413683/disabling-the-context-menu-on-long-taps-on-android
                // I also have:  touch-callout:none and user-select:none in main.css
                if (event.preventDefault) {
                    event.preventDefault(); // Also prevents generating mouse events for touch.
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                event.cancelBubble = true;
                event.returnValue = false;
                console.log("handleDragEvent:", type, clientX, clientY);
                handleDragEvent(type, clientX, clientY, event);
            }
            var gameArea = document.getElementById(touchElementId);
            if (!gameArea) {
                throw new Error("You must have <div id='" + touchElementId + "'>...</div>");
            }
            gameArea.addEventListener("touchstart", touchHandler, true);
            gameArea.addEventListener("touchmove", touchHandler, true);
            gameArea.addEventListener("touchend", touchHandler, true);
            gameArea.addEventListener("touchcancel", touchHandler, true);
            gameArea.addEventListener("touchleave", touchHandler, true);
            gameArea.addEventListener("mousedown", mouseDownHandler, true);
            gameArea.addEventListener("mousemove", mouseMoveHandler, true);
            gameArea.addEventListener("mouseup", mouseUpHandler, true);
        }
        dragAndDropService.addDragListener = addDragListener;
    })(dragAndDropService = gamingPlatform.dragAndDropService || (gamingPlatform.dragAndDropService = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=dragAndDropService.js.map
;
var gamingPlatform;
(function (gamingPlatform) {
    // Copy everything on gamingPlatform to window,
    // for backward compatability with games that don't use the gamingPlatform namespace.
    function copyNamespaceToWindow() {
        var w = window;
        var g = gamingPlatform;
        for (var key in g) {
            w[key] = g[key];
        }
    }
    copyNamespaceToWindow();
    setTimeout(copyNamespaceToWindow, 0);
    // Preventing context menu on long taps: http://stackoverflow.com/questions/3413683/disabling-the-context-menu-on-long-taps-on-android
    window.oncontextmenu = function (event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    };
    angular.module('gameServices', ['translate'])
        .config(['$provide', function ($provide) {
            // angular-material has a ton of
            // Error: [$rootScope:inprog] http://errors.angularjs.org/1.5.5/$rootScope/inprog?p0=%24digest
            // see: https://github.com/angular/material/issues/8245
            // And I even got it once in yCheckers:
            // Error: [$rootScope:inprog] $digest already in progress http://errors.angularjs.org/1.5.5/$rootScope/inprog?p0=%24digest
            $provide.decorator('$rootScope', [
                '$delegate', function ($delegate) {
                    $delegate.unsafeOldApply = $delegate.$apply;
                    $delegate.$apply = function (fn) {
                        var phase = $delegate.$$phase;
                        if (phase === "$apply" || phase === "$digest") {
                            if (fn && typeof fn === 'function') {
                                fn();
                            }
                        }
                        else {
                            $delegate.unsafeOldApply(fn);
                        }
                    };
                    return $delegate;
                }
            ]);
        }])
        .run(['$location', '$rootScope', '$timeout', '$interval', '$interpolate',
        function (_location, _rootScope, _timeout, _interval, _interpolate) {
            gamingPlatform.$location = _location;
            gamingPlatform.$rootScope = _rootScope;
            gamingPlatform.$timeout = _timeout;
            gamingPlatform.$interval = _interval;
            gamingPlatform.$interpolate = _interpolate;
            copyNamespaceToWindow();
            gamingPlatform.log.alwaysLog("Finished init of gameServices module; emulatorServicesCompilationDate=", emulatorServicesCompilationDate);
        }])
        .factory('$exceptionHandler', function () {
        function angularErrorHandler(exception, cause) {
            var errMsg = {
                gameUrl: '' + window.location,
                exception: "" + exception,
                stack: "" + (exception ? exception.stack : "no stack"),
                cause: cause,
                gameLogs: gamingPlatform.log.getLogs()
            };
            console.error("Game had an exception:\n", exception, " Full error message with logs: ", errMsg);
            window.alert("Game had an unexpected error. If you know JavaScript, you can look at the console and try to debug it :)");
            // To make sure students don't get:
            // Error: Uncaught DataCloneError: Failed to execute 'postMessage' on 'Window': An object could not be cloned.
            // I serialize to string and back.
            var plainPojoErr = angular.fromJson(angular.toJson(errMsg));
            window.parent.postMessage({ emailJavaScriptError: plainPojoErr }, "*");
        }
        window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
            angularErrorHandler(errorObj, 'Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber +
                ' Column: ' + column);
        };
        return angularErrorHandler;
    });
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=angularExceptionHandler.js.map
;
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