
// ***************************************
// ********** GameSolver script **********
// ***************************************

"use strict";

// *************************************************************************
// *************************************************************************
// Global variables
// *************************************************************************
// *************************************************************************

let emptyColor = 0; // (0 is also the Java default table init value)
let nbMinColors = 6;
let nbMaxColors = 10;
let nbMinColumns = 3;
let nbMaxColumns = 7;
let overallNbMinAttempts = 4;
let overallNbMaxAttempts = 12;

let init_done = false;
let nbColumns = -1;
let nbColors = -1;
let nbMaxAttempts = -1;
let nbMaxPossibleCodesShown = -1;
let secretCodeForDebugOnly = -1;
let game_id = -1;

let codesPlayed;
let marks;

let codeHandler;

let initialNbPossibleCodes = -1;
let colorsFoundCode = -1;
let minNbColorsTable;
let maxNbColorsTable;

let currentAttemptNumber = 0;
let nbMaxAttemptsForEndOfGame = -1;
let message_processing_ongoing = false;

// *************************************************************************
// *************************************************************************
// Classes
// *************************************************************************
// *************************************************************************

// *************************************************************************
// Code handler class
// *************************************************************************

class CodeHandler { // NOTE: the code of this class is partially duplicated in SuperMasterMind.js script

  constructor(nbColumns_p, nbColors_p, nbMinColumns_p, nbMaxColumns_p, emptyColor_p) {
    if ( (nbColumns_p < Math.max(nbMinColumns_p,3)) || (nbColumns_p > Math.min(nbMaxColumns_p,7)) /* 3 and 7 is hardcoded in some methods of this class for better performances */ ) {
      throw new Error("CodeHandler: invalid nb of columns (" + nbColumns_p + ", " + nbMinColumns_p + "," + nbMaxColumns_p + ")");
    }
    if (nbColors_p < 0) {
      throw new Error("CodeHandler: invalid nb of colors: (" + nbColors_p + ")");
    }
    this.nbColumns = nbColumns_p;
    this.nbColors = nbColors_p;
    this.emptyColor = emptyColor_p;

    this.code1_colors = new Array(nbMaxColumns_p);
    this.code2_colors = new Array(nbMaxColumns_p);
    this.colors_int = new Array(nbMaxColumns_p);
  }

  getNbColumns() {
    return this.nbColumns;
  }

  getColor(code, column) {
    switch (column) {
      case 1:
        return (code & 0x0000000F);
      case 2:
        return ((code >> 4) & 0x0000000F);
      case 3:
        return ((code >> 8) & 0x0000000F);
      case 4:
        return ((code >> 12) & 0x0000000F);
      case 5:
        return ((code >> 16) & 0x0000000F);
      case 6:
        return ((code >> 20) & 0x0000000F);
      case 7:
        return ((code >> 24) & 0x0000000F);
      default:
        throw new Error("CodeHandler: getColor (" + column + ")");
    }
  }

  setColor(code, color, column)  {
    switch (column) {
      case 1:
        return ((code & 0xFFFFFFF0) | color);
      case 2:
        return ((code & 0xFFFFFF0F) | (color << 4));
      case 3:
        return ((code & 0xFFFFF0FF) | (color << 8));
      case 4:
        return ((code & 0xFFFF0FFF) | (color << 12));
      case 5:
        return ((code & 0xFFF0FFFF) | (color << 16));
      case 6:
        return ((code & 0xFF0FFFFF) | (color << 20));
      case 7:
        return ((code & 0xF0FFFFFF) | (color << 24));
      default:
        throw new Error("CodeHandler: setColor (" + column + ")");
    }
  }

  setAllColors(color1, color2, color3, color4, color5, color6, color7) {
    return color1
           | (color2 << 4)
           | (color3 << 8)
           | (color4 << 12)
           | (color5 << 16)
           | (color6 << 20)
           | (color7 << 24);
  }

  setAllColorsIdentical(color) {
    let res_code = 0;
    for (let col = 0; col < this.nbColumns; col++) {
      res_code = this.setColor(res_code, color, col+1);
    }
    return res_code;
  }

  codeToString(code) {
    let res = "[ ";
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      res = res + color + " ";
    }
    res = res + "]";
    return res;
  }

  createRandomCode() {
    let code = 0;
    for (let col = 0; col < this.nbColumns; col++) {
      code = this.setColor(code, Math.floor((Math.random() * this.nbColors) + 1), col+1);
    }
    return code;
  }

  isValid(code) {
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      if ( ((color < 1) || (color > this.nbColors))
           && (color != this.emptyColor) ) {
        return false;
      }
    }
    return true;
  }

  isFullAndValid(code) {
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      if ( (color < 1) || (color > this.nbColors)
           || (color == this.emptyColor) ) {
        return false;
      }
    }
    return true;
  }

  nbEmptyColors(code) {
    let cnt = 0;
    for (let col = 0; col < this.nbColumns; col++) {
      if (this.getColor(code, col+1) == this.emptyColor) {
        cnt++;
      }
    }
    return cnt;
  }

  isEmpty(code) {
    return (code == 0); // only emptyColor in the code
  }

  replaceEmptyColor(code, emptyColorIdx, code2) {
    let cnt = 0;
    for (let col = 0; col < this.nbColumns; col++) {
      if (this.getColor(code, col+1) == this.emptyColor) {
        if (cnt == emptyColorIdx) {
          return this.setColor(code, this.getColor(code2, col+1), col+1);
        }
        cnt++;
      }
    }
    return code;
  }

  // Get a mark between 2 codes
  getMark(code1, code2) {
    let mark = {nbBlacks:0, nbWhites:0};
    this.fillMark(code1, code2, mark);
    return mark;
  }

  // Fill a mark between 2 codes in a fast way
  fillMark(code1, code2, mark) {

    let nbBlacks = 0;
    let nbWhites = 0;
    let col1, col2;

    // The below operations are unrolled for better performances
    this.colors_int[0] = true;
    this.colors_int[1] = true;
    this.colors_int[2] = true;
    this.colors_int[3] = true;
    this.colors_int[4] = true;
    this.colors_int[5] = true;
    this.colors_int[6] = true;
    this.code1_colors[0] = (code1 & 0x0000000F);
    this.code1_colors[1] = ((code1 >> 4) & 0x0000000F);
    this.code1_colors[2] = ((code1 >> 8) & 0x0000000F);
    this.code1_colors[3] = ((code1 >> 12) & 0x0000000F);
    this.code1_colors[4] = ((code1 >> 16) & 0x0000000F);
    this.code1_colors[5] = ((code1 >> 20) & 0x0000000F);
    this.code1_colors[6] = ((code1 >> 24) & 0x0000000F);
    this.code2_colors[0] = (code2 & 0x0000000F);
    this.code2_colors[1] = ((code2 >> 4) & 0x0000000F);
    this.code2_colors[2] = ((code2 >> 8) & 0x0000000F);
    this.code2_colors[3] = ((code2 >> 12) & 0x0000000F);
    this.code2_colors[4] = ((code2 >> 16) & 0x0000000F);
    this.code2_colors[5] = ((code2 >> 20) & 0x0000000F);
    this.code2_colors[6] = ((code2 >> 24) & 0x0000000F);

    for (col1 = 0; col1 < this.nbColumns; col1++) {
      if (this.code1_colors[col1] == this.code2_colors[col1]) {
        nbBlacks++;
      }
      else {
        for (col2 = 0; col2 < this.nbColumns; col2++) {
          if ((this.code1_colors[col1] == this.code2_colors[col2]) && (this.code1_colors[col2] != this.code2_colors[col2]) && this.colors_int[col2]) {
            this.colors_int[col2] = false;
            nbWhites++;
            break;
          }
        }
      }
    }

    mark.nbBlacks = nbBlacks;
    mark.nbWhites = nbWhites;

  }  
  
  marksEqual(mark1, mark2) {
    return ( (mark1.nbBlacks == mark2.nbBlacks) && (mark1.nbWhites == mark2.nbWhites) );
  }

  isMarkValid(mark) {
    let sum = mark.nbBlacks + mark.nbWhites;
    if ( (sum >= 0) && (sum <= this.nbColumns)
         && !((mark.nbBlacks == this.nbColumns - 1) && (mark.nbWhites == 1)) ) {
      return true;
    }
    return false;
  }  
  
  markToString(mark) {
    return mark.nbBlacks + "B" + mark.nbWhites + "W";
  }

}

// *************************************************************************
// *************************************************************************
// Functions
// *************************************************************************
// *************************************************************************

// ********************************
// Handle messages from main thread
// ********************************

self.addEventListener('message', function(e) {
  
  if (message_processing_ongoing) {
    throw new Error("GameSolver event handling error (message_processing_ongoing is true)");
  }
  message_processing_ongoing = true;
  
  if (e.data == undefined) {
    throw new Error("data is undefined");
  }
  let data = e.data;
  
  if (data.req_type == undefined) {
    throw new Error("req_type is undefined");
  }
  
  // **************
  // Initialization
  // **************
  
  if (data.req_type == 'INIT') {
  
    if (init_done) {
      throw new Error("INIT phase / double initialization");
    }
  
    if (data.nbColumns == undefined) {
      throw new Error("INIT phase / nbColumns is undefined");
    }
    nbColumns = Number(data.nbColumns);
    if ( isNaN(nbColumns) || (nbColumns < nbMinColumns) || (nbColumns > nbMaxColumns) ) {
      throw new Error("INIT phase / invalid nbColumns: " + nbColumns);
    }    

    if (data.nbColors == undefined) {
      throw new Error("INIT phase / nbColors is undefined");
    }
    nbColors = Number(data.nbColors);
    if ( isNaN(nbColors) || (nbColors < nbMinColors) || (nbColors > nbMaxColors) ) {
      throw new Error("INIT phase / invalid nbColors: " + nbColors);
    }

    if (data.nbMaxAttempts == undefined) {
      throw new Error("INIT phase / nbMaxAttempts is undefined");
    }
    nbMaxAttempts = Number(data.nbMaxAttempts);
    if ( isNaN(nbMaxAttempts) || (nbMaxAttempts < overallNbMinAttempts) || (nbMaxAttempts > overallNbMaxAttempts) ) {
      throw new Error("INIT phase / invalid nbMaxAttempts: " + nbMaxAttempts);
    }

    if (data.nbMaxPossibleCodesShown == undefined) {
      throw new Error("INIT phase / nbMaxPossibleCodesShown is undefined");
    }
    nbMaxPossibleCodesShown = Number(data.nbMaxPossibleCodesShown);
    if ( isNaN(nbMaxPossibleCodesShown) || (nbMaxPossibleCodesShown < 5) || (nbMaxPossibleCodesShown > 100) ) {
      throw new Error("INIT phase / invalid nbMaxPossibleCodesShown: " + nbMaxPossibleCodesShown);
    }

    if (data.secretCode == undefined) {
      throw new Error("INIT phase / secretCode is undefined");
    }
    secretCodeForDebugOnly = data.secretCode;

    if (data.game_id == undefined) {
      throw new Error("INIT phase / game_id is undefined");
    }
    game_id = Number(data.game_id);
    if ( isNaN(game_id) || (game_id < 0) ) {
      throw new Error("INIT phase / invalid game_id: " + game_id);
    }

    codesPlayed = new Array(nbMaxAttempts);
    for (let i = 0; i < nbMaxAttempts; i++) {
      codesPlayed[i] = 0;
    }
    marks = new Array(nbMaxAttempts);
    for (let i = 0; i < nbMaxAttempts; i++) {
      marks[i] = {nbBlacks:0, nbWhites:0};
    }    
    
    codeHandler = new CodeHandler(nbColumns, nbColors, nbMinColumns, nbMaxColumns, emptyColor)   
    
    initialNbPossibleCodes = Math.round(Math.pow(nbColors,nbColumns));    
    minNbColorsTable = new Array(nbColors+1);
    maxNbColorsTable = new Array(nbColors+1);        
    
    init_done = true;
    
    // XXX FOR TEST ONLY:    
    self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': initialNbPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': 1, 'game_id': game_id});
    
  }
  
  // ***********
  // New attempt
  // ***********
  
  else if (init_done && (data.req_type == 'NEW_ATTEMPT')) {

    if (data.currentAttemptNumber == undefined) {
      throw new Error("NEW_ATTEMPT phase / currentAttemptNumber is undefined");
    }
    let currentAttemptNumber_tmp = Number(data.currentAttemptNumber);
    if ( isNaN(currentAttemptNumber_tmp) || (currentAttemptNumber_tmp < 0) || (currentAttemptNumber_tmp > nbMaxAttempts) ) {
      throw new Error("NEW_ATTEMPT phase / invalid currentAttemptNumber: " + currentAttemptNumber_tmp);
    }    
    if (currentAttemptNumber_tmp != currentAttemptNumber+1) { // attempt numbers shall be consecutive
      throw new Error("NEW_ATTEMPT phase / non consecutive currentAttemptNumber values: " + currentAttemptNumber + ", " + currentAttemptNumber_tmp);
    }
    currentAttemptNumber = currentAttemptNumber_tmp;

    if (data.nbMaxAttemptsForEndOfGame == undefined) {
      throw new Error("NEW_ATTEMPT phase / nbMaxAttemptsForEndOfGame is undefined");
    }
    nbMaxAttemptsForEndOfGame = Number(data.nbMaxAttemptsForEndOfGame);
    if ( isNaN(nbMaxAttemptsForEndOfGame) || (nbMaxAttemptsForEndOfGame < 0) || (nbMaxAttemptsForEndOfGame > nbMaxAttempts) || (nbMaxAttemptsForEndOfGame < currentAttemptNumber) ) {
      throw new Error("NEW_ATTEMPT phase / invalid nbMaxAttemptsForEndOfGame: " + nbMaxAttemptsForEndOfGame + ", " + currentAttemptNumber);
    }    
    
    if (data.code == undefined) {
      throw new Error("NEW_ATTEMPT phase / code is undefined");
    }
    codesPlayed[currentAttemptNumber-1] = Number(data.code);
    if ( isNaN(codesPlayed[currentAttemptNumber-1]) || !codeHandler.isFullAndValid(codesPlayed[currentAttemptNumber-1])  ) {
      throw new Error("NEW_ATTEMPT phase / invalid code: " + code);
    }        

    if (data.mark_nbBlacks == undefined) {
      throw new Error("NEW_ATTEMPT phase / mark_nbBlacks is undefined");
    }
    let mark_nbBlacks = Number(data.mark_nbBlacks);
    if ( isNaN(mark_nbBlacks) || (mark_nbBlacks < 0) || (mark_nbBlacks > nbColumns) ) {
      throw new Error("NEW_ATTEMPT phase / invalid mark_nbBlacks: " + mark_nbBlacks + ", " + nbColumns);
    }    
    if (data.mark_nbWhites == undefined) {
      throw new Error("NEW_ATTEMPT phase / mark_nbWhites is undefined");
    }
    let mark_nbWhites = Number(data.mark_nbWhites);
    if ( isNaN(mark_nbWhites) || (mark_nbWhites < 0) || (mark_nbWhites > nbColumns) ) {
      throw new Error("NEW_ATTEMPT phase / invalid mark_nbWhites: " + mark_nbWhites + ", " + nbColumns);
    } 
    marks[currentAttemptNumber-1] = {nbBlacks:mark_nbBlacks, nbWhites:mark_nbWhites};        
    if (!codeHandler.isMarkValid(marks[currentAttemptNumber-1])) {
      throw new Error("NEW_ATTEMPT phase / invalid mark: " + mark_nbBlacks + "B, " + mark_nbWhites + "W, " + nbColumns);
    }
    
    if (data.game_id == undefined) {
      throw new Error("NEW_ATTEMPT phase / game_id is undefined");
    }
    let attempt_game_id = Number(data.game_id);
    if ( isNaN(attempt_game_id) || (attempt_game_id < 0) || (attempt_game_id != game_id) ) {
      throw new Error("NEW_ATTEMPT phase / invalid game_id: " + attempt_game_id + " (" + game_id + ")");
    }

    console.log(String(currentAttemptNumber) + ": " + codeHandler.markToString(marks[currentAttemptNumber-1]) + " " + codeHandler.codeToString(codesPlayed[currentAttemptNumber-1]));
    
  }
  
  // **********
  // Error case
  // **********
  
  else {
    throw new Error("unexpected req_type: " + data.req_type);
  }  

  message_processing_ongoing = false;
  
}, false);
