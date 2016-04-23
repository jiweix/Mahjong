interface SupportedLanguages { en: string, ch: string};
interface Translations {
  [index: string]: SupportedLanguages;
}

module game {
  // I export all variables to make it easy to debug in the browser by
  // simply typing in the console:
  // game.state
  export let animationEnded = false;
  export let canMakeMove = false;
  export let isComputerTurn = false;
  export let move: IMove = null;
  export let state: IState;
  export let isHelpModalShown: boolean = false;
  /** added for Mahjong */
  export let paiSelected : number = null;
  export let cpai : number = null;
  export let chand: number[] = null;
  export let handindex : number[] = null;
  export let opphandindex : number[] = null;
  export let openindex : number[] = null;
  export let oppopenindex : number[] = null;
  export let playerHandLength : number = null;
  export let opponentHandLength : number = null;
  export let playerOpenLength : number = null;
  export let opponentOpenLength : number = null;
  export let outLength : number = null;
  export let outindex : number[] = null;
  export let player : Player = null;
  export let opp : Player = null;
  //export let playerIndexCounter : number = -1;
  //let yourPlayerIndexAddjust : number = 0;
  
  export let MOVE = ["LCHI", "MCHI", "RCHI", "PENG", "HU", "ZHUA", "DA"];

  export function init() {
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

    let w: any = window;
    if (w["HTMLInspector"]) {
      setInterval(function () {
        w["HTMLInspector"].inspect({
          excludeRules: ["unused-classes", "script-placement"],
        });
      }, 3000);
    }
  }

  function getTranslations(): Translations {
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
      CLOSE:  {
        en: "Close",
        ch: "关闭",
      },
    };
  }

  function animationEndedCallback() {
    $rootScope.$apply(function () {
      log.info("Animation ended");
      animationEnded = true;
      sendComputerMove();
    });
  }

  function sendComputerMove() {
    if (!isComputerTurn) {
      return;
    }
    isComputerTurn = false; // to make sure the computer can only move once.
    moveService.makeMove(aiService.findComputerMove(move));
  }
  
  function getRange(index: number) :number[] {
    let arr : number[] = [];
    for (let j = 0; j < index; j++){
      arr.push(j);
    }
    return arr;
  }

  function updateUI(params: IUpdateUI): void {
    log.info("Game got updateUI:", params);
    animationEnded = false;
    move = params.move;
    state = move.stateAfterMove;

    if (!state) {
      state = gameLogic.getInitialState();
    }

    
    canMakeMove = move.turnIndexAfterMove >= 0 && // game is ongoing
      params.yourPlayerIndex === move.turnIndexAfterMove; // it's my turn
    
    // Initiallize the pai for next move  
    // need to consider option 4
    cpai = state.board.out[state.board.out.length - 1];
    
    player = params.yourPlayerIndex === 0? state.board.px: state.board.po;
    opp = params.yourPlayerIndex === 0? state.board.po: state.board.px;
       
    chand = player.hand;
    
    playerHandLength = chand.length;
    opponentHandLength = opp.hand.length;
    playerOpenLength = player.open.length;
    opponentOpenLength = opp.open.length;
    outLength = state.board.out.length;
    
    handindex = getRange(chand.length);
    opphandindex = getRange(opp.hand.length);
    openindex = getRange(player.open.length);
    oppopenindex = getRange(opp.open.length);
    outindex = getRange(outLength);

    // Is it the computer's turn?
    isComputerTurn = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';
    if (isComputerTurn) {
      // To make sure the player won't click something and send a move instead of the computer sending a move.
      canMakeMove = false;
      // We calculate the AI move only after the animation finishes,
      // because if we call aiService now
      // then the animation will be paused until the javascript finishes.
      if (!state.delta) {
        // This is the first move in the match, so
        // there is not going to be an animation, so
        // call sendComputerMove() now (can happen in ?onlyAIs mode)
        sendComputerMove();
      }
    }
  }

  export function paiClicked(index : number): void {
    paiSelected = chand[index];
  }
  
  export function optionClicked(option : number):void {
    if (option === 6) {
      if (paiSelected === null){
        log.info("You need to select a Pai Before DA");
        return;
      } else {
        cpai = paiSelected;
      }     
    }else if (option === 5) {
      cpai = null;
    }
    
    log.info("Making move ", MOVE[option]);
    if (!canMakeMove) {
      return;
    }
    try {
      let nextMove = gameLogic.createMove(
          state, option, cpai, move.turnIndexAfterMove);
      canMakeMove = false; // to prevent making another move
      moveService.makeMove(nextMove);
    } catch (e) {
      log.info(["something funny is happenning ...", option, cpai]);
      return;
    } 
  }
  
  export function ifLegalMove(index: number): boolean{
    if (!canMakeMove) {
      return false; 
    } else {
      return state.board.legalMove[index] === 1;
    }
  }

  export function getPaiImage(row:number, col: number): string {
    return '';
  }
  
  export function clickedOnModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      isHelpModalShown = false;
    }
    return true;
  }
}

angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    game.init();
  });
