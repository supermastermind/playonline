
// ***************************************
// ********** GameSolver script **********
// ***************************************

"use strict";

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

let initialNbPossibleCodes = -1;
let colorsFoundCode = -1;
let minNbColorsTable;
let maxNbColorsTable;

// ********************************
// Handle messages from main thread
// ********************************

self.addEventListener('message', function(e) {
  
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
    
    minNbColorsTable = new Array(nbColors+1);
    maxNbColorsTable = new Array(nbColors+1);        
    
    initialNbPossibleCodes = Math.round(Math.pow(nbColors,nbColumns));

    init_done = true;
    
    // XXX FOR TEST ONLY:    
    self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': initialNbPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': 1, 'game_id': game_id});
    
  }
  
  // ***********
  // New attempt
  // ***********
  
  else if (init_done && (data.req_type == 'NEW_ATTEMPT')) {
    // TBC
  }
  
  // **********
  // Error case
  // **********
  
  else {
    throw new Error("unexpected req_type: " + data.req_type);
  }  
  
}, false);