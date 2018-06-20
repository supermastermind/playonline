
// ***************************************************
// ********** Main Super Master Mind script **********
// ***************************************************

"use strict";

console.log("Running SuperMasterMind.js...");

// *************************************************************************
// *************************************************************************
// Global variables
// *************************************************************************
// *************************************************************************

// Main game variables
// *******************

let version = "v0.9";

let emptyColor = 0; // (0 is also the Java default table init value)
let nbMinColors = 6;
let nbMaxColors = 10;
let nbMinColumns = 3;
let nbMaxColumns = 7;
let overallNbMinAttempts = 4;
let overallNbMaxAttempts = 15;

let nominalGameNbColumns = 5; // classical Super Master Mind game
let nominalGameNbColors = 8; // classical Super Master Mind game
let nominalGameNbMaxAttempts = 12; // classical Super Master Mind game

let defaultNbColumns = 5;

let nbColumns = -1; // N.A.
let nbColors = -1; // N.A.
let nbMaxAttempts = -1; // N.A.

let simpleCodeHandler = null;

let showPossibleCodesMode = false;
let showPossibleCodesOffsetMode = false;
let nbMinPossibleCodesShown = -1; // N.A.
let nbMaxPossibleCodesShown = -1; // N.A.
let nbPossibleCodesShown = -1; // N.A. (only valid if showPossibleCodesMode is true)
let currentPossibleCodeShown = -1; // N.A. (only valid if showPossibleCodesMode is true)
let disableMouseMoveEffects = false;
let currentPossibleCodeShownBeforeMouseMove = -1; // N.A. (only valid if showPossibleCodesMode is true)
let lastidxBeforeMouseMove = -1;

let currentCode = -1;
let codesPlayed;
let marks;
let nbOfPossibleCodes;
let colorsFoundCodes;
let minNbColorsTables;
let maxNbColorsTables;
let relative_performances_of_codes_played;
let global_best_performances;
let relativePerformancesEvaluationDone;
let performancesDisplayed;
let possibleCodesLists;
let possibleCodesListsSizes;
let globalPerformancesList; // (same size as possibleCodesLists)
let PerformanceLOW = -0.25;
let PerformanceVERYLOW = -0.50;
let PerformanceNA = -3.00; // (duplicated in GameSolver.js)
let PerformanceUNKNOWN = -2.00; // (duplicated in GameSolver.js)
let nbOfStatsFilled_NbPossibleCodes = 0;
let nbOfStatsFilled_ListsOfPossibleCodes = 0;
let nbOfStatsFilled_Perfs = 0;
let currentAttemptNumber = 1;

let gameWon = false;
let timeStr = ""; // (only valid if game over)
let score = -1.0;  // (only valid if game over)
let sumPerfs = 0.00;  // (only valid if game over and all performances filled)
let nbUnknownPerfs = 0;  // (only valid if game over and all performances filled)

let sCode = -1;
let sCodeRevealed = -1;
let game_cnt = 0;
let loadTime = (new Date()).getTime(); // time in milliseconds
let startTime = -1; // N.A.
let stopTime = -1; // N.A.
let newGameEvent = true;
let nbNewGameEventsCancelled = 0;
let playerWasHelped = false;

let errorStr = "";
let errorCnt = 0;

let nb_random_codes_played = 0;
let at_least_one_useless_code_played = false;

let gameSolver = undefined;

// GUI variables
// *************

let newGameButtonIniName = document.getElementById("newGameButton").value;
let nbColumnsRadioObjectIniNames = new Array(nbMaxColumns-nbMinColumns+1);
for (let i = nbMinColumns; i <= nbMaxColumns; i++) {
  nbColumnsRadioObjectIniNames[i-nbMinColumns] = document.getElementById("columnslabel_" + i).innerHTML;
}
let resetCurrentCodeButtonIniName = document.getElementById("resetCurrentCodeButton").value;
let playRandomCodeButtonIniName = document.getElementById("playRandomCodeButton").value;
let revealSecretColorButtonIniName = document.getElementById("revealSecretColorButton").value;
let showPossibleCodesButtonIniName = document.getElementById("showPossibleCodesButton").value;
let showPossibleCodesButtonCompressedName = "\u2606";
let showPossibleCodesButtonBackToGameName = "Back to game";
let showPossibleCodesButtonBackToGameCompressedName = "\u25c0";

let tableIniWidth = document.getElementById("my_table").style.width;
let tableIniLeft = document.getElementById("my_table").style.left;
let tableIniHeight = document.getElementById("my_table").style.height;
let tableIniTop = document.getElementById("my_table").style.top;
let tableIniBorder = document.getElementById("my_table").style.border;
let tableIniBorderRadius = document.getElementById("my_table").style["border-radius"];
let myCanvasIniWidth = document.getElementById("my_canvas").style.width;
let myCanvasIniHeight = document.getElementById("my_canvas").style.height;

let CompressedDisplayMode = false;
let CompressedDisplayMode_compressWidth = 577;
let CompressedDisplayMode_uncompressWidth = 1044;

// Widths and heights
// ******************

let left_border_margin_x = -1.0;   // N.A. - Left border margin for x axis in %
let right_border_margin_x = -1.0;  // N.A. - Right border margin for x axis in %
let bottom_border_margin_y = -1.0; // N.A. - Bottom border margin for y axis in %
let top_border_margin_y = -1.0;    // N.A. - Top border margin for y axis in %

let current_width = -1; // N.A.
let width_shift;
let reduced_width;
let current_height = -1; // N.A.
let height_shift;
let reduced_height;
let x_axis_height;

let x_min = 0.0;
let x_max = 100.0;
let y_min = 0.0;
let y_max = 100.0;

let x_step = 1.0; // N.A.
let y_step = 1.0; // N.A.

let attempt_nb_width = 2;
let nb_possible_codes_width = 5;
let optimal_width = 4;
let tick_width = 3;
let transition_height = 1;
let scode_height = 1;
let nb_attempts_not_displayed = 0;

// Colors
// ******

let greenColor = "#008200"; // Green
let orangeColor = "#FF7700"; // Orange
let redColor = "#F00000"; // Red
let backgroundColorTable =
    [
    "#0000A8",   // Blue
    greenColor,  // Green
    redColor,    // Red
    orangeColor, // Orange
    "#954400",   // Brown
    "#000000",   // Black
    "#F0F0F0",   // White (gray)
    "#EAEA00",   // Yellow
    "#C900A1",   // Purple
    "#2DB7E5"    // Cyan
    ];
let foregroundColorTable =
    [ "white",
      "white",
      "white",
      "white",
      "white",
      "white",
      "black",
      "black",
      "white",
      "white"
    ];

let backgroundColor_2 = document.getElementById("my_table").style.backgroundColor; // (may be modified later on)
let backgroundColor_3 = "#D0D0D0"; // (may be modified later on)
let lightGray = "#909090"; // (shall be significantly darker than backgroundColor_2)
let darkGray = "#000000"; // (shall be significantly darker than lightGray)
let highlightColor = "#FFFF00"; // Yellow

// Fonts
// *****

let fontFamily = "Verdana";
let defaultFont = "10px " + fontFamily;
let min_font_size = 7;
let max_font_size = 40;
let basic_font = defaultFont;
let basic_bold_font = defaultFont;
let basic_bold_italic_font = defaultFont;
let small_basic_font = defaultFont;
let small_bold_font = defaultFont;
let small_italic_font = defaultFont;
let very_small_italic_font = defaultFont;
let medium_basic_font = defaultFont;
let medium_bold_font = defaultFont;
let medium2_bold_font = defaultFont;
let medium_bold_italic_font = defaultFont;
let stats_font = defaultFont;
let error_font = defaultFont;
let font_size = min_font_size;

// Other variables
// ****************

let main_graph_update_needed = true;
let color_selection_code = 0;
let color_cnt = 0;

let tickChar = "\u2714"; /* (check mark/tick) */
let crossChar = "\u2716"; /* (cross) */

let firefoxMode = (navigator.userAgent.toUpperCase().search("FIREFOX") != -1);
console.log("navigator's user agent: " + navigator.userAgent);

// *************************************************************************
// *************************************************************************
// New methods
// *************************************************************************
// *************************************************************************

// String.replaceAll() method definition
String.prototype.replaceAll = function(search, replacement) {
  let target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

// *************************************************************************
// *************************************************************************
// Classes
// *************************************************************************
// *************************************************************************

// *************************************************************************
// "Simple" Code handler class
// *************************************************************************

class SimpleCodeHandler { // NOTE: the code of this class is partially duplicated in GameSolver.js script

  constructor(nbColumns_p, nbColors_p, nbMinColumns_p, nbMaxColumns_p, emptyColor_p) {
    if ( (nbColumns_p < Math.max(nbMinColumns_p,3)) || (nbColumns_p > Math.min(nbMaxColumns_p,7)) /* 3 and 7 is hardcoded in some methods of this class for better performances */ ) {
      throw new Error("SimpleCodeHandler: invalid nb of columns (" + nbColumns_p + ", " + nbMinColumns_p + "," + nbMaxColumns_p + ")");
    }
    if (nbColors_p < 0) {
      throw new Error("SimpleCodeHandler: invalid nb of colors: (" + nbColors_p + ")");
    }
    this.nbColumns = nbColumns_p;
    this.nbColors = nbColors_p;
    this.nbMaxColumns = nbMaxColumns_p;
    this.emptyColor = emptyColor_p;

    this.code1_colors = new Array(this.nbMaxColumns);
    this.code2_colors = new Array(this.nbMaxColumns);
    this.colors_int = new Array(this.nbMaxColumns);
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
        throw new Error("SimpleCodeHandler: getColor (" + column + ")");
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
        throw new Error("SimpleCodeHandler: setColor (" + column + ")");
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

  createRandomCode(codeRevealed = 0 /* (empty code) */) {
    let code = 0;
    for (let col = 0; col < this.nbColumns; col++) {
      let colorRevealed = this.getColor(codeRevealed, col+1);
      if ( (colorRevealed >= 1) && (colorRevealed <= this.nbColors)
           && (colorRevealed != this.emptyColor) ) {
        code = this.setColor(code, colorRevealed, col+1);
      }
      else {
        code = this.setColor(code, Math.floor((Math.random() * this.nbColors) + 1), col+1);
      }
    }

    // XXX TMP - begin
    /*
    code = this.setColor(code, 4, 1);
    code = this.setColor(code, 2, 2);
    code = this.setColor(code, 4, 3);
    code = this.setColor(code, 3, 4);
    code = this.setColor(code, 4, 5);
    code = this.setColor(code, 5, 6);
    code = this.setColor(code, 4, 7);
    for (let col = this.nbColumns+1; col <= this.nbMaxColumns; col++) {
      code = this.setColor(code, this.emptyColor, col);
    }
    */
    // XXX TMP - end

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
    for (let col = this.nbColumns+1; col <= this.nbMaxColumns; col++) {
      let color = this.getColor(code, col);
      if (color != this.emptyColor) {
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
    for (let col = this.nbColumns+1; col <= this.nbMaxColumns; col++) {
      let color = this.getColor(code, col);
      if (color != this.emptyColor) {
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

  markToString(mark) {
    return mark.nbBlacks + "B" + mark.nbWhites + "W";
  }

  convert(code) {
    return ~code;
  }

}

// *************************************************************************
// *************************************************************************
// Functions
// *************************************************************************
// *************************************************************************

// ***************************
// GameSolver worker functions
// ***************************

// Function called on gameSolver worker's message reception
function onGameSolverMsg(e) {

  if (e.data == undefined) {
    displayGUIError("gameSolver msg error: data is undefined", new Error().stack);
    return;
  }
  let data = e.data;

  if (data.rsp_type == undefined) {
    displayGUIError("gameSolver msg error: rsp_type is undefined", new Error().stack);
    return;
  }

  // ************************
  // Number of possible codes
  // ************************

  if (data.rsp_type == 'NB_POSSIBLE_CODES') {

    if (data.nbOfPossibleCodes_p == undefined) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: nbOfPossibleCodes_p is undefined", new Error().stack);
    }
    let nbOfPossibleCodes_p = Number(data.nbOfPossibleCodes_p);
    if ( isNaN(nbOfPossibleCodes_p) || (nbOfPossibleCodes_p < 0) ) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: invalid nbOfPossibleCodes_p: " + nbOfPossibleCodes_p, new Error().stack);
    }

    if (data.colorsFoundCode_p == undefined) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: colorsFoundCode_p is undefined", new Error().stack);
    }
    let colorsFoundCode_p = Number(data.colorsFoundCode_p);
    if (isNaN(colorsFoundCode_p)) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: invalid colorsFoundCode_p: " + colorsFoundCode_p, new Error().stack);
    }

    if (data.minNbColorsTable_p == undefined) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: minNbColorsTable_p is undefined", new Error().stack);
    }
    let minNbColorsTable_p = (data.minNbColorsTable_p).split(",");
    if (minNbColorsTable_p.length != nbColors+1) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: invalid minNbColorsTable_p: " + data.minNbColorsTable_p + ", length is " + minNbColorsTable_p.length, new Error().stack);
    }

    if (data.maxNbColorsTable_p == undefined) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: maxNbColorsTable_p is undefined", new Error().stack);
    }
    let maxNbColorsTable_p = (data.maxNbColorsTable_p).split(",");
    if (maxNbColorsTable_p.length != nbColors+1) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: invalid maxNbColorsTable_p: " + data.maxNbColorsTable_p + ", length is " + maxNbColorsTable_p.length, new Error().stack);
    }

    if (data.attempt_nb == undefined) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: attempt_nb is undefined", new Error().stack);
    }
    let attempt_nb = Number(data.attempt_nb);
    if ( isNaN(attempt_nb) || (attempt_nb <= 0) ) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: invalid attempt_nb: " + attempt_nb, new Error().stack);
    }

    if (data.game_id == undefined) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: game_id is undefined", new Error().stack);
    }
    let game_id = Number(data.game_id);
    if ( isNaN(game_id) || (game_id < 0) ) {
      displayGUIError("NB_POSSIBLE_CODES / gameSolver msg error: invalid game_id: " + game_id, new Error().stack);
    }

    writeNbOfPossibleCodes(nbOfPossibleCodes_p, colorsFoundCode_p, minNbColorsTable_p, maxNbColorsTable_p, attempt_nb, game_id);

  }

  // **********************
  // List of possible codes
  // **********************

  else if (data.rsp_type == 'LIST_OF_POSSIBLE_CODES') {

    if (data.possibleCodesList_p == undefined) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: possibleCodesList_p is undefined", new Error().stack);
    }
    let possibleCodesList_p = (data.possibleCodesList_p).split(",");
    if ( (possibleCodesList_p.length <= 0) || (possibleCodesList_p.length > nbMaxPossibleCodesShown) ) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: invalid possibleCodesList_p: " + data.possibleCodesList_p + ", length is " + possibleCodesList_p.length, new Error().stack);
    }

    if (data.nb_possible_codes_listed == undefined) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: nb_possible_codes_listed is undefined", new Error().stack);
    }
    let nb_possible_codes_listed = Number(data.nb_possible_codes_listed);
    if ( isNaN(nb_possible_codes_listed) || (nb_possible_codes_listed <= 0) || (nb_possible_codes_listed > nbMaxPossibleCodesShown) ) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: invalid nb_possible_codes_listed: " + nb_possible_codes_listed, new Error().stack);
    }

    if (data.globalPerformancesList_p == undefined) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: globalPerformancesList_p is undefined", new Error().stack);
    }
    let globalPerformancesList_p = (data.globalPerformancesList_p).split(",");
    if ( (globalPerformancesList_p.length <= 0) || (globalPerformancesList_p.length > nbMaxPossibleCodesShown) ) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: invalid globalPerformancesList_p: " + data.globalPerformancesList_p + ", length is " + globalPerformancesList_p.length, new Error().stack);
    }

    if (data.attempt_nb == undefined) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: attempt_nb is undefined", new Error().stack);
    }
    let attempt_nb = Number(data.attempt_nb);
    if ( isNaN(attempt_nb) || (attempt_nb <= 0) ) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: invalid attempt_nb: " + attempt_nb, new Error().stack);
    }

    if (data.game_id == undefined) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: game_id is undefined", new Error().stack);
    }
    let game_id = Number(data.game_id);
    if ( isNaN(game_id) || (game_id < 0) ) {
      displayGUIError("LIST_OF_POSSIBLE_CODES / gameSolver msg error: invalid game_id: " + game_id, new Error().stack);
    }

    writePossibleCodes(possibleCodesList_p, nb_possible_codes_listed, globalPerformancesList_p, attempt_nb, game_id);

  }

  // **************************
  // Performance of code played
  // **************************

  else if (data.rsp_type == 'CODE_PLAYED_PERFORMANCE') {

    if (data.relative_perf_p == undefined) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: relative_perf_p is undefined", new Error().stack);
    }
    let relative_perf_p = Number(data.relative_perf_p);

    if (data.best_global_performance_p == undefined) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: best_global_performance_p is undefined", new Error().stack);
    }
    let best_global_performance_p = Number(data.best_global_performance_p);

    if (data.relative_perf_evaluation_done_p == undefined) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: relative_perf_evaluation_done_p is undefined", new Error().stack);
    }
    let relative_perf_evaluation_done_p = Boolean(data.relative_perf_evaluation_done_p);

    if (data.code_p == undefined) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: code_p is undefined", new Error().stack);
    }
    let code_p = Number(data.code_p);

    if (data.attempt_nb == undefined) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: attempt_nb is undefined", new Error().stack);
    }
    let attempt_nb = Number(data.attempt_nb);
    if ( isNaN(attempt_nb) || (attempt_nb <= 0) ) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: invalid attempt_nb: " + attempt_nb, new Error().stack);
    }

    if (data.game_id == undefined) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: game_id is undefined", new Error().stack);
    }
    let game_id = Number(data.game_id);
    if ( isNaN(game_id) || (game_id < 0) ) {
      displayGUIError("CODE_PLAYED_PERFORMANCE / gameSolver msg error: invalid game_id: " + game_id, new Error().stack);
    }

    writePerformanceOfCodePlayed(relative_perf_p, relative_perf_evaluation_done_p, best_global_performance_p, code_p, attempt_nb, game_id);

  }

  // **********
  // Error case
  // **********

  else {
    displayGUIError("gameSolver error: unexpected rsp_type: " + data.rsp_type, new Error().stack);
    return;
  }

}

// Function called on gameSolver worker's error
function onGameSolverError(e) {
  displayGUIError("gameSolver error:" + e.message + " at line " + e.lineno + " in " + e.filename, new Error().stack);
}

// ***********************
// Event-related functions
// ***********************

function newGameButtonClick(nbColumns) {
  if (!document.getElementById("newGameButton").disabled) {
    if ( (nbColumns == 0) // ("NEW GAME" button event)
         || (currentAttemptNumber <= 1) ) { // (radio buttons events)

      if (gameOnGoing() && (currentAttemptNumber > 1)) {

        if (nbNewGameEventsCancelled <= 2) { // Avoid repetitive or endless (in Firefox for example) cancellations
          var rsp = confirm("Do you really want to abort and lose current game?"); // (code duplicated)
          if (!rsp) {
            nbNewGameEventsCancelled++;
            return; // Cancel or "x" (close) button
          }
        }

        // Transition effect 1/2
        try {
          $(".game_aborted").fadeIn(3500);
        }
        catch (exc) {
        }

        // Transition effect 2/2
        try {
          $(".game_aborted").fadeOut(3500);
        }
        catch (exc) {
        }
      }

      // Transition effect 1/2
      try {
        $(".page_transition").fadeIn("fast");
      }
      catch (exc) {
      }

      newGameEvent = true;
      draw_graphic();

      // Transition effect 2/2
      try {
        $(".page_transition").fadeOut("fast");
      }
      catch (exc) {
      }

    }
  }
}

function resetCurrentCodeButtonClick() {
  if (!document.getElementById("resetCurrentCodeButton").disabled) {
    currentCode = sCodeRevealed;
    draw_graphic(false);
  }
}

function playRandomCodeButtonClick() {
  if (!document.getElementById("playRandomCodeButton").disabled) {
    nb_random_codes_played++;
    currentCode = simpleCodeHandler.createRandomCode(sCodeRevealed);
    draw_graphic(false);
  }
}

function revealSecretColorButtonClick() {
  if ( (!document.getElementById("revealSecretColorButton").disabled)
       && gameOnGoing()
       && (sCode != -1) && (sCodeRevealed != -1) ) {
    let nbEmptyColors = simpleCodeHandler.nbEmptyColors(sCodeRevealed);
    if (nbEmptyColors <= 1) {
      displayGUIError("too many revealed colors", new Error().stack);
    }
    else if ((nbColumns-nbEmptyColors+1) < (nbColumns+1)/2) {
      playerWasHelped = true;
      let revealedColorIdx = Math.floor(Math.random() * nbEmptyColors);
      sCodeRevealed = simpleCodeHandler.replaceEmptyColor(sCodeRevealed, revealedColorIdx, simpleCodeHandler.convert(sCode));
      currentCode = sCodeRevealed;
      main_graph_update_needed = true;
      draw_graphic(false);
    }
  }
}

function showPossibleCodesButtonClick(invertMode = true, newPossibleCodeShown = -1, showModeForced = false, transientMode = false) {
  if (!document.getElementById("showPossibleCodesButton").disabled) {

    if (showModeForced && showPossibleCodesMode) { // (showPossibleCodesMode is already true)
      return;
    }

    // Transition effect 1/2
    if (invertMode || showModeForced) {
      try {
        $(".page_transition").fadeIn("fast");
      }
      catch (exc) {
      }
    }

    if (showModeForced) {
      showPossibleCodesMode = true;
    }
    else if (invertMode) {
      showPossibleCodesMode = !showPossibleCodesMode;
      disableMouseMoveEffects = false;
    }
    if (!showPossibleCodesMode) {
      nbPossibleCodesShown = -1;
      currentPossibleCodeShown = -1;
    }
    else {
      nbPossibleCodesShown = Math.max(nbMinPossibleCodesShown, Math.min(nbMaxPossibleCodesShown/2 /* (half display) */, 20 + (nbMaxAttempts+1 - currentAttemptNumber)));
      let interesting_attempt_idx = 0;
      let cnt = 0;
      if (!gameWon) {
        cnt = 1;
      }
      let previous_nb = -1;
      for (let i = currentAttemptNumber-2; i >= 0; i--) {
        if ((nbOfPossibleCodes[i] > 1) && (relative_performances_of_codes_played[i] != -1.00) /* not a useless code */) {
          interesting_attempt_idx = i;
          cnt++;
          if (nbOfPossibleCodes[i] >= 3)  {
            break;
          }
          if ((cnt > 1) && (nbOfPossibleCodes[i] != previous_nb)) {
            break;
          }
          previous_nb = nbOfPossibleCodes[i];
        }
      }
      if (newPossibleCodeShown == -1) {
        currentPossibleCodeShown = interesting_attempt_idx+1;
      }
      else {
        currentPossibleCodeShown = newPossibleCodeShown;
      }
    }
    if (!transientMode) {
      currentPossibleCodeShownBeforeMouseMove = currentPossibleCodeShown;
    }
    updateGameSizes();
    draw_graphic(!transientMode);

    // Transition effect 2/2
    if (invertMode || showModeForced) {
      try {
        $(".page_transition").fadeOut("fast");
      }
      catch (exc) {
      }
    }

  }
}

function mouseClick(e) {

  let event_x_min, event_x_max, event_y_min, event_y_max;
  let rect = canvas.getBoundingClientRect();
  let mouse_x = e.clientX - rect.left - 2.0 /* (correction) */;
  let mouse_y = e.clientY - rect.top - 2.0 /* (correction) */;

  // ***************
  // Color selection
  // ***************

  if (gameOnGoing()) {

    event_x_min = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
    event_x_max = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2));
    event_y_min = get_y_pixel(y_min+y_step*(nbMaxAttempts-nb_attempts_not_displayed+transition_height+scode_height+transition_height+nbColors));
    event_y_max = get_y_pixel(y_min+y_step*(currentAttemptNumber-1));

    if ( (mouse_x > event_x_min) && (mouse_x < event_x_max)
         && (mouse_y > event_y_min) && (mouse_y < event_y_max) ) {

      try {
        for (let column = 0; column < nbColumns; column++) {
          let x_0, y_0, x_1, y_1;
          x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+column*2));
          x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+(column+1)*2));
          if ((mouse_x > x_0) && (mouse_x < x_1)) {
            let colorSelected = false;
            for (let color = 0; color < nbColors; color++) {
              y_0 = get_y_pixel(y_min+y_step*(nbMaxAttempts-nb_attempts_not_displayed+transition_height+scode_height+transition_height+(color+1)));
              y_1 = get_y_pixel(y_min+y_step*(nbMaxAttempts-nb_attempts_not_displayed+transition_height+scode_height+transition_height+color));
              if ((mouse_y > y_0) && (mouse_y < y_1)) {
                colorSelected = true;
                playAColor(color+1, column+1);
                break;
              }
            }
            if (!colorSelected) {
              playAColor(emptyColor, column+1);
            }
            break;
          }
        }
      }
      catch (exc) {
        displayGUIError("mouseReleased: " + exc, exc.stack);
      }

    }

  }

  // *****************
  // Attempt selection
  // *****************

  else if ((!gameOnGoing()) && allPossibleCodesFilled()) { // (condition duplicated)

    if (!showPossibleCodesMode) {
      event_y_min = get_y_pixel(y_min+y_step*(nbMaxAttempts-nb_attempts_not_displayed));
    }
    else {
      event_y_min = get_y_pixel(y_min+y_step*(currentAttemptNumber-1));
    }
    event_y_max = get_y_pixel(y_min+y_step*0);

    if ( (mouse_y > event_y_min) && (mouse_y < event_y_max) ) { // (below code duplicated)
      lastidxBeforeMouseMove = -1;
      for (let idx = 0; idx < currentAttemptNumber-1; idx++) {
        let y_0 = get_y_pixel(y_min+y_step*(idx+1));
        let y_1 = get_y_pixel(y_min+y_step*(idx));
        if ((mouse_y > y_0) && (mouse_y < y_1)) {
          showPossibleCodesOffsetMode = false;
          disableMouseMoveEffects = true;
          showPossibleCodesButtonClick(!showPossibleCodesMode, idx+1);
          break;
        }
      }
    }
    else {
      if (showPossibleCodesMode) {
        disableMouseMoveEffects = false;
        let x_0_half_display = get_x_pixel(x_min);
        let x_1_half_display = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
        let y_0_half_display = get_y_pixel(y_min+y_step*(currentAttemptNumber-1+transition_height+1+0.75/* (margin) */))
        let y_1_half_display = get_y_pixel(y_min+y_step*(currentAttemptNumber-1+transition_height/2/* (margin) */));
        if ( (mouse_x > x_0_half_display) && (mouse_x < x_1_half_display)
             && (mouse_y > y_0_half_display) && (mouse_y < y_1_half_display) ) { // (half display - always tested to simplify)
          showPossibleCodesOffsetMode = !showPossibleCodesOffsetMode;
          main_graph_update_needed = true;
          draw_graphic(false);
        }
        else { // (other zones)
          showPossibleCodesOffsetMode = false;
          lastidxBeforeMouseMove = -1;
          showPossibleCodesButtonClick();
        }
      }
      else {
        lastidxBeforeMouseMove = -1;
      }
    }

  }

}

function mouseMove(e) {
  if (!showPossibleCodesMode) {
    return;
  }
  else if ((!gameOnGoing()) && allPossibleCodesFilled()) { // (condition duplicated)

    let event_x_min, event_x_max, event_y_min, event_y_max;
    let rect = canvas.getBoundingClientRect();
    let mouse_x = e.clientX - rect.left - 2.0 /* (correction) */;
    let mouse_y = e.clientY - rect.top - 2.0 /* (correction) */;

    event_x_min = get_x_pixel(x_min);
    event_x_max = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width+tick_width));
    event_y_min = get_y_pixel(y_min+y_step*(currentAttemptNumber-1));
    event_y_max = get_y_pixel(y_min+y_step*0);

    if (mouse_y < event_y_min) {
      disableMouseMoveEffects = false;
    }

    if (disableMouseMoveEffects) {
      return;
    }

    if ( (mouse_x > event_x_min) && (mouse_x < event_x_max)
          && (mouse_y > event_y_min) && (mouse_y < event_y_max) ) { // (below code duplicated)
      for (let idx = 0; idx < currentAttemptNumber-1; idx++) {
        let y_0 = get_y_pixel(y_min+y_step*(idx+1));
        let y_1 = get_y_pixel(y_min+y_step*(idx));
        if ((mouse_y > y_0) && (mouse_y < y_1)) {
          if (lastidxBeforeMouseMove != idx+1) {
            showPossibleCodesOffsetMode = false;
            showPossibleCodesButtonClick(false, idx+1, false, true);
            lastidxBeforeMouseMove = idx+1;
          }
          break;
        }
      }
    }
    else { // (other zones)
      if (lastidxBeforeMouseMove != currentPossibleCodeShownBeforeMouseMove) {
        showPossibleCodesOffsetMode = false;
        showPossibleCodesButtonClick(false, currentPossibleCodeShownBeforeMouseMove, false, true);
        lastidxBeforeMouseMove = currentPossibleCodeShownBeforeMouseMove;
      }
    }

  }
}

function playAColor(color, column) {
  if (gameOnGoing()) {
    currentCode = simpleCodeHandler.setColor(currentCode, color, column);
    draw_graphic(false);
  }
}

let previousNbColumns = -1;
function getNbColumnsSelected() {
  // Check if a radio button is checked
  let nbColumnsRadioObject = document.getElementsByName("nbColumnsSelection");
  for (let i = 0; i < nbColumnsRadioObject.length; i++) {
    if (nbColumnsRadioObject[i].checked) {
     previousNbColumns = parseInt(nbColumnsRadioObject[i].value);
     return previousNbColumns;
    }
  }
  // No radio button checked
  if (previousNbColumns == -1) { // First default setting
    nbColumnsRadioObject[defaultNbColumns-nbMinColumns].checked = "checked";
    previousNbColumns = parseInt(nbColumnsRadioObject[defaultNbColumns-nbMinColumns].value);
    return previousNbColumns;
  }
  else { // Keep current setting
    nbColumnsRadioObject[previousNbColumns-nbMinColumns].checked = "checked";
    return previousNbColumns;
  }
}

// *****************
// General functions
// *****************

function updateGameSizes() {

  main_graph_update_needed = true;

  if (!CompressedDisplayMode) {
    attempt_nb_width = 2;
    nb_possible_codes_width = ((nbColumns>=7)?5:4);
    optimal_width = 4;
    tick_width = 3;

    transition_height = 1;
    scode_height = 1;
  }
  else {
    attempt_nb_width = 0;
    nb_possible_codes_width = ((nbColumns>=7)?4.2:((nbColumns==6)?3.7:3.2));
    optimal_width = (((!gameOnGoing())||showPossibleCodesMode)?2.25:0);
    tick_width = (((nbColumns<=4)||(!gameOnGoing())||showPossibleCodesMode)?1.35:0);

    if (!gameOnGoing()) {
      transition_height = 0.4;
      scode_height = 1;
    }
    else {
      transition_height = 0.15;
      scode_height = 0;
    }
  }

  x_step = (x_max - x_min) / (attempt_nb_width // attempt number
                              +(90*(nbColumns+1))/100 // mark
                              +nbColumns*2 // code
                              +nb_possible_codes_width // number of possible codes
                              +optimal_width // optimal
                              +tick_width); // OK/NOK

  if (!showPossibleCodesMode) {
    if (nbColumns <= 3) {
      nb_attempts_not_displayed = 0;
    }
    else {
      nb_attempts_not_displayed = Math.max(0, nbMaxAttempts - currentAttemptNumber - 1);
      if (nbMaxAttempts-nb_attempts_not_displayed < nbColors) { // Color selection shall not be wider than game
        nb_attempts_not_displayed = Math.max(0, nbMaxAttempts - nbColors);
      }
      if (nbColumns == 4) {
        nb_attempts_not_displayed = Math.min(1, nb_attempts_not_displayed);
      }
      else if (nbColumns == 5) {
        nb_attempts_not_displayed = Math.min(3, nb_attempts_not_displayed);
      }
      else if (nbColumns == 6) {
        nb_attempts_not_displayed = Math.min(4, nb_attempts_not_displayed);
      }
      else if (nbColumns == 7) {
        nb_attempts_not_displayed = Math.min(5, nb_attempts_not_displayed);
      }
    }
    y_step = (y_max - y_min) / (nbMaxAttempts-nb_attempts_not_displayed // number of attempts displayed
                                +transition_height // margin
                                +scode_height // secret code
                                +transition_height // margin
                                +nbColors); // color selection
  }
  else {
    nb_attempts_not_displayed = 0;
    if ( !((!gameOnGoing()) && allPossibleCodesFilled()) || (currentAttemptNumber <= 0) ) {
      displayGUIError("invalid context for updateGameSizes(): " + gameOnGoing() + ", " + allPossibleCodesFilled(), new Error().stack);
    }
    y_step = (y_max - y_min) / (currentAttemptNumber-1 // number of attempts reached at end of game
                                +transition_height // margin
                                +nbPossibleCodesShown // possible codes
                                +1); // tick display
  }

}

function resetGameAttributes(nbColumnsSelected) {

  let i;
  let first_session_game;

  // Clear gameSolver worker if necessary
  if (gameSolver !== undefined) {
    gameSolver.terminate();
    gameSolver = undefined;
  }

  if ((new Date()).getTime() - loadTime >= 8*3600*1000) { // (reload the page from server every 8 hours at next game start: not too short to allow game.html's "last_data_used" benefits, not too long to allow fast application of changes)
    loadTime = (new Date()).getTime(); // time in milliseconds (this line should be useless)
    location.reload(true);
  }

  main_graph_update_needed = true;
  simpleCodeHandler = null;

  nbColumns = nbColumnsSelected;
  switch (nbColumns) {
    case 3:
      nbColors = Math.max(nbMinColors, nominalGameNbColors - 2);
      nbMaxAttempts = nominalGameNbMaxAttempts - 4;
      document.title = "Very easy";
      break;
    case 4:
      nbColors = Math.max(nbMinColors, nominalGameNbColors - 1);
      nbMaxAttempts = nominalGameNbMaxAttempts - 2;
      document.title = "Master Mind";
      break;
    case 5: // nominalGameNbColumns
      nbColors = nominalGameNbColors;
      nbMaxAttempts = nominalGameNbMaxAttempts;
      document.title = "Super Master Mind";
      break;
    case 6:
      nbColors = Math.min(nbMaxColors, nominalGameNbColors + 1);
      nbMaxAttempts = nominalGameNbMaxAttempts + 2;
      document.title = "Advanced Master Mind";
      break;
    case 7:
      nbColors = Math.min(nbMaxColors, nominalGameNbColors + 2);
      nbMaxAttempts = nominalGameNbMaxAttempts + 3;
      document.title = "Ultra Master Mind";
      break;
    default:
      throw new Error("invalid selection of number of columns: " + nbColumns + " (#1)");
  }
  if ( (nbMaxAttempts < overallNbMinAttempts) || (nbMaxAttempts > overallNbMaxAttempts) ) {
    throw new Error("invalid nbMaxAttempts: " + nbMaxAttempts);
  }

  simpleCodeHandler = new SimpleCodeHandler(nbColumns, nbColors, nbMinColumns, nbMaxColumns, emptyColor);

  showPossibleCodesMode = false;
  showPossibleCodesOffsetMode = false;
  nbMinPossibleCodesShown = nbColumns+nbColors+4;
  nbMaxPossibleCodesShown = 60;
  nbPossibleCodesShown = -1;
  currentPossibleCodeShown = -1;
  disableMouseMoveEffects = false;

  currentCode = 0;
  codesPlayed = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    codesPlayed[i] = 0;
  }
  marks = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    marks[i] = {nbBlacks:0, nbWhites:0};
  }
  nbOfPossibleCodes = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    nbOfPossibleCodes[i] = 0;
  }
  colorsFoundCodes = new Array(nbMaxAttempts);
  minNbColorsTables = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    minNbColorsTables[i] = new Array(nbColors+1);
  }
  maxNbColorsTables = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    maxNbColorsTables[i] = new Array(nbColors+1);
  }
  relative_performances_of_codes_played = new Array(nbMaxAttempts);
  global_best_performances = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    relative_performances_of_codes_played[i] = PerformanceNA;
    global_best_performances[i] = PerformanceNA;
  }
  relativePerformancesEvaluationDone = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    relativePerformancesEvaluationDone[i] = false;
  }
  performancesDisplayed = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    performancesDisplayed[i] = false;
  }

  possibleCodesLists = new Array(nbMaxAttempts);
  possibleCodesListsSizes = new Array(nbMaxAttempts);
  globalPerformancesList = new Array(nbMaxAttempts); // (same size as possibleCodesLists)
  for (i = 0; i < nbMaxAttempts; i++) {
    possibleCodesLists[i] = new Array(nbMaxPossibleCodesShown);
    possibleCodesListsSizes[i] = 0;
    globalPerformancesList[i] = new Array(nbMaxPossibleCodesShown);
  }

  nbOfStatsFilled_NbPossibleCodes = 0;
  nbOfStatsFilled_ListsOfPossibleCodes = 0;
  nbOfStatsFilled_Perfs = 0;
  currentAttemptNumber = 1;

  gameWon = false;
  timeStr = "";
  score = -1.0;
  sumPerfs = 0.00;
  nbUnknownPerfs = 0;

  sCode = ~(simpleCodeHandler.createRandomCode());
  sCodeRevealed = 0;

  game_cnt++;
  if (game_cnt > 1000000) {
    game_cnt = 0;
  }

  newGameEvent = false;
  playerWasHelped = false;

  errorStr = "";
  errorCnt = 0;

  nb_random_codes_played = 0;
  at_least_one_useless_code_played = false;

  updateGameSizes();

  // Create a new worker for gameSolver
  gameSolver = new Worker("Game" + "Solver.js");
  gameSolver.addEventListener('message', onGameSolverMsg, false);
  gameSolver.addEventListener('error', onGameSolverError, false);
  // Send a message to the gameSolver worker to initialize it
  if ( (typeof(Storage) !== 'undefined') && (!sessionStorage.first_session_game) ) {
    sessionStorage.first_session_game = 1;
    first_session_game = true;
  }
  else {
    first_session_game = false;
  }
  gameSolver.postMessage({'req_type': 'INIT', 'nbColumns': nbColumns, 'nbColors': nbColors, 'nbMaxAttempts': nbMaxAttempts, 'nbMaxPossibleCodesShown': nbMaxPossibleCodesShown, 'first_session_game': first_session_game, 'game_id': game_cnt});
}

function checkArraySizes() {
  if (codesPlayed.length > nbMaxAttempts) {displayGUIError("array is wider than expected #1", new Error().stack);}
  if (marks.length > nbMaxAttempts) {displayGUIError("array is wider than expected #2", new Error().stack);}
  if (nbOfPossibleCodes.length > nbMaxAttempts){displayGUIError("array is wider than expected #3", new Error().stack);}
  if (colorsFoundCodes.length > nbMaxAttempts){displayGUIError("array is wider than expected #4", new Error().stack);}
  if (minNbColorsTables.length > nbMaxAttempts){displayGUIError("array is wider than expected #5", new Error().stack);}
  for (let i = 0; i < nbMaxAttempts; i++) {
    if (minNbColorsTables[i].length > nbColors+1) {displayGUIError("array is wider than expected #6", new Error().stack);}
  }
  if (maxNbColorsTables.length > nbMaxAttempts){displayGUIError("array is wider than expected #7", new Error().stack);}
  for (let i = 0; i < nbMaxAttempts; i++) {
    if (maxNbColorsTables[i].length > nbColors+1){displayGUIError("array is wider than expected #8", new Error().stack);}
  }
  if (relative_performances_of_codes_played.length > nbMaxAttempts){displayGUIError("array is wider than expected #9", new Error().stack);}
  if (global_best_performances.length > nbMaxAttempts){displayGUIError("array is wider than expected #10", new Error().stack);}
  if (relativePerformancesEvaluationDone.length > nbMaxAttempts){displayGUIError("array is wider than expected #11", new Error().stack);}
  if (performancesDisplayed.length > nbMaxAttempts){displayGUIError("array is wider than expected #12", new Error().stack);}
  if (possibleCodesLists.length > nbMaxAttempts){displayGUIError("array is wider than expected #13", new Error().stack);}
  if (globalPerformancesList.length > nbMaxAttempts){displayGUIError("array is wider than expected #14", new Error().stack);}
  if (possibleCodesListsSizes.length > nbMaxAttempts){displayGUIError("array is wider than expected #15", new Error().stack);}
  for (let i = 0; i < nbMaxAttempts; i++) {
    if (possibleCodesLists[i].length > nbMaxPossibleCodesShown){displayGUIError("array is wider than expected #16", new Error().stack);}
    if (globalPerformancesList[i].length > nbMaxPossibleCodesShown){displayGUIError("array is wider than expected #17", new Error().stack);}
  }
}

function gameOnGoing() {
  return ((!gameWon) && (currentAttemptNumber <= nbMaxAttempts));
}

function allPerformancesFilled() {
  return ((!gameOnGoing()) && (currentAttemptNumber-1 == nbOfStatsFilled_Perfs) && (nbOfStatsFilled_Perfs >= 1) && (relative_performances_of_codes_played[nbOfStatsFilled_Perfs-1] != PerformanceNA));
}

function allPossibleCodesFilled() {
  return ( // game on-going and all stats filled
            (gameOnGoing() && (currentAttemptNumber == nbOfStatsFilled_NbPossibleCodes) && (nbOfStatsFilled_NbPossibleCodes >= 1) && (possibleCodesListsSizes[nbOfStatsFilled_NbPossibleCodes-1] > 0))
            ||
            // game over and all stats filled
            ((!gameOnGoing()) && (currentAttemptNumber-1 == nbOfStatsFilled_NbPossibleCodes) && (nbOfStatsFilled_NbPossibleCodes >= 1) && (possibleCodesListsSizes[nbOfStatsFilled_NbPossibleCodes-1] > 0)) );
}

// Check if a code played is possible
function isAttemptPossible(attempt_nb) { // (returns 0 if the attempt_nb th code is possible, returns the first attempt number with which there is a contradiction otherwise)
  if ( (attempt_nb <= 0) || (attempt_nb >= currentAttemptNumber) ) {
    displayGUIError("invalid attempt nb (" + attempt_nb + ")", new Error().stack);
    return 1;
  }
  let mark_tmp = {nbBlacks:0, nbWhites:0};
  for (let i = 1; i <= attempt_nb-1; i++) { // go through all codes previously played
    simpleCodeHandler.fillMark(codesPlayed[attempt_nb-1], codesPlayed[i-1], mark_tmp);
    if (!simpleCodeHandler.marksEqual(mark_tmp, marks[i-1])) {
      return i;
    }
  }
  return 0;
}

// ****************************
// Statistics related functions
// ****************************

// Number of possible codes
function writeNbOfPossibleCodes(nbOfPossibleCodes_p, colorsFoundCode_p, minNbColorsTable_p, maxNbColorsTable_p, attempt_nb, game_id) {
  if (game_id != game_cnt) { // ignore other threads
    console.log("writeNbOfPossibleCodes() call ignored: " + game_id + ", " + game_cnt);
    return false;
  }
  if ( (nbOfPossibleCodes_p <= 0)
       || (attempt_nb != nbOfStatsFilled_NbPossibleCodes + 1) // stats shall be filled consecutively
       || (attempt_nb <= 0) || (attempt_nb > nbMaxAttempts)
       || (nbOfPossibleCodes[attempt_nb-1] != 0 /* initial value */)
       || (!simpleCodeHandler.isValid(colorsFoundCode_p)) ) {
    displayGUIError("invalid stats (" + nbOfPossibleCodes_p + ", " + attempt_nb + ", " + nbOfStatsFilled_NbPossibleCodes + ", " + nbOfPossibleCodes[attempt_nb-1] + ") (#1)", new Error().stack);
    return false;
  }
  nbOfPossibleCodes[attempt_nb-1] = nbOfPossibleCodes_p;
  colorsFoundCodes[attempt_nb-1] = colorsFoundCode_p;
  let sum_max = 0;
  for (let color = 1; color <= nbColors; color++) {
    minNbColorsTables[attempt_nb-1][color] = minNbColorsTable_p[color];
    maxNbColorsTables[attempt_nb-1][color] = maxNbColorsTable_p[color];
    sum_max += maxNbColorsTables[attempt_nb-1][color];
  }
  if (sum_max < nbColumns) {
    displayGUIError("invalid stats (sum_max=" + sum_max + ") (#2)", new Error().stack);
    return false;
  }
  nbOfStatsFilled_NbPossibleCodes = attempt_nb; // Assumption: the number of possible codes is assumed to be the first stat to be written among all stats

  main_graph_update_needed = true;
  draw_graphic(false);
  return true;
}

// Code performances
function writePerformanceOfCodePlayed(relative_perf_p, relative_perf_evaluation_done_p, best_global_performance_p, code_p, attempt_nb, game_id) {
  if (game_id != game_cnt) { // ignore other threads
    console.log("writePerformanceOfCodePlayed() call ignored: " + game_id + ", " + game_cnt);
    return false;
  }
  if ( ((relative_perf_p < -1.00) && (relative_perf_p != PerformanceUNKNOWN)) || (relative_perf_p >= 1.00) /* possible range of relative performances */
       || (relative_perf_p == PerformanceNA)
       || (relative_perf_evaluation_done_p && (relative_perf_p == PerformanceUNKNOWN))
       || ((relative_perf_p == -1.00) /* useless code */ && (!relative_perf_evaluation_done_p))
       || ((best_global_performance_p <= 0.01) && (best_global_performance_p != PerformanceUNKNOWN))
       || (best_global_performance_p == PerformanceNA)
       || (code_p != codesPlayed[attempt_nb-1])
       || (attempt_nb != nbOfStatsFilled_Perfs + 1) // perfs shall be filled consecutively
       || (attempt_nb > nbOfStatsFilled_NbPossibleCodes) // performances shall be filled after numbers of possible codes
       || (attempt_nb <= 0) || (attempt_nb > nbMaxAttempts)
       || (relative_performances_of_codes_played[attempt_nb-1] != PerformanceNA /* initial value */)
       || (global_best_performances[attempt_nb-1] != PerformanceNA /* initial value */)
       || (relativePerformancesEvaluationDone[attempt_nb-1] /* initial value */) ) {
    displayGUIError("invalid perfs (" + attempt_nb + ", " + nbOfStatsFilled_Perfs + ", " + nbOfStatsFilled_NbPossibleCodes + ", " + relative_perf_p + ", " + best_global_performance_p + ", " + relative_perf_evaluation_done_p + ", " + code_p + ", " + attempt_nb + ")", new Error().stack);
    return false;
  }
  relative_performances_of_codes_played[attempt_nb-1] = relative_perf_p;
  global_best_performances[attempt_nb-1] = best_global_performance_p; // may be PerformanceUNKNOWN

  if (relative_perf_p == PerformanceUNKNOWN) {
    nbUnknownPerfs++;
  }
  else {
    sumPerfs = sumPerfs + relative_perf_p;
  }
  if (relative_perf_p == -1.00) { // useless code
    at_least_one_useless_code_played = true;
  }
  relativePerformancesEvaluationDone[attempt_nb-1] = relative_perf_evaluation_done_p;
  nbOfStatsFilled_Perfs = attempt_nb;

  main_graph_update_needed = true;
  draw_graphic(false);

  // ***************************************
  // Store player's info distantly if needed
  // ***************************************

  if (gameWon && allPerformancesFilled()) {
    if ((timeStr.length == 0) || (score < 0.0)) {
      displayGUIError("internal error at store_player_info call: " + timeStr.length + ", " + score, new Error().stack);
    }
    else { // (score > 0.0 because game won)
      let nbColorsRevealed = (nbColumns-simpleCodeHandler.nbEmptyColors(sCodeRevealed));

      let strGame = "";
      for (let i = 1; i < Math.min(4, currentAttemptNumber); i++) {
        strGame = strGame + simpleCodeHandler.markToString(marks[i-1]) + " " + simpleCodeHandler.codeToString(codesPlayed[i-1]) + " ";
      }
      strGame = strGame.trim();

      store_player_info(game_cnt, nbColumns, score, currentAttemptNumber-1, timeStr, Math.round(sumPerfs * 100.0) / 100.0 /* 0.01 precision */, nbUnknownPerfs, (((nbColorsRevealed > 0) || (nb_random_codes_played == 0)) ? nbColorsRevealed + 'x' : Math.min(nb_random_codes_played,9) + 'ra'), strGame);
    }
  }

  return true;
}

// List of possible codes
function writePossibleCodes(possibleCodesList_p, nb_possible_codes_listed, globalPerformancesList_p, attempt_nb, game_id) {
  if (game_id != game_cnt) { // ignore other threads
    console.log("writePossibleCodes() call ignored: " + game_id + ", " + game_cnt);
    return false;
  }
  if ( (nb_possible_codes_listed <= 0) || (possibleCodesList_p.length < nb_possible_codes_listed) || (globalPerformancesList_p.length < nb_possible_codes_listed)
        || (attempt_nb != nbOfStatsFilled_ListsOfPossibleCodes + 1) // lists of possible codes shall be filled consecutively
        || (attempt_nb > nbOfStatsFilled_NbPossibleCodes) // lists of possible codes shall be filled after numbers of possible codes
        || (attempt_nb <= 0) || (attempt_nb > nbMaxAttempts)
        || (possibleCodesListsSizes[attempt_nb-1] != 0 /* initial value */)
        || ((nbOfPossibleCodes[attempt_nb-1] <= nbMaxPossibleCodesShown) && (nb_possible_codes_listed != nbOfPossibleCodes[attempt_nb-1])) // (cf. above assumption on stats writing)
        || ((nbOfPossibleCodes[attempt_nb-1] > nbMaxPossibleCodesShown) && (nb_possible_codes_listed != nbMaxPossibleCodesShown)) ) { // (cf. above assumption on stats writing)
    displayGUIError("invalid stats (" + attempt_nb + ", " + nbOfStatsFilled_NbPossibleCodes + ", " + nbOfPossibleCodes[attempt_nb-1] + ", " + nb_possible_codes_listed + ") (#3)", new Error().stack);
    return false;
  }
  for (let i = 0; i < nb_possible_codes_listed; i++) {
    let code = possibleCodesList_p[i];
    let global_perf = globalPerformancesList_p[i];
    if (!simpleCodeHandler.isFullAndValid(code)) {
      displayGUIError("invalid stats (" + attempt_nb + ", " + nbOfStatsFilled_NbPossibleCodes + ", " + code + ") (#4)", new Error().stack);
      return false;
    }
   if ( ((global_perf <= 0.01) && (global_perf != PerformanceUNKNOWN))
        || (global_perf == PerformanceNA) ) {
      displayGUIError("invalid stats (unknown code performance(s) after evaluation) (#5)", new Error().stack);
      return false;
    }
    possibleCodesLists[attempt_nb-1][i] = code;
    globalPerformancesList[attempt_nb-1][i] = global_perf; // may be PerformanceUNKNOWN
  }
  possibleCodesListsSizes[attempt_nb-1] = nb_possible_codes_listed;
  nbOfStatsFilled_ListsOfPossibleCodes = attempt_nb;

  main_graph_update_needed = true;
  draw_graphic(false);
  return true;
}

// ****************
// Storage function
// ****************

function updateAndStoreNbGamesStarted(offset) {

  try {
    if (typeof(Storage) !== 'undefined') {
      switch (nbColumns) {
        case 3:
          if (localStorage.nbgamesstarted3) {
            localStorage.nbgamesstarted3 = Number(localStorage.nbgamesstarted3) + offset;
          }
          break;
        case 4:
          if (localStorage.nbgamesstarted4) {
            localStorage.nbgamesstarted4 = Number(localStorage.nbgamesstarted4) + offset;
          }
          break;
        case 5:
          if (localStorage.nbgamesstarted5) {
            localStorage.nbgamesstarted5 = Number(localStorage.nbgamesstarted5) + offset;
          }
          break;
        case 6:
          if (localStorage.nbgamesstarted6) {
            localStorage.nbgamesstarted6 = Number(localStorage.nbgamesstarted6) + offset;
          }
          break;
        case 7:
          if (localStorage.nbgamesstarted7) {
            localStorage.nbgamesstarted7 = Number(localStorage.nbgamesstarted7) + offset;
          }
          break;
        default:
          throw new Error("updateAndStoreNbGamesStarted(): invalid number of columns: " + nbColumns);
      }
    }
    else {
      console.log("nbgamesstarted cannot be stored (no storage support)");
    }
  }
  catch (err) {
    displayGUIError("error while storing nbgamesstarted: " + err, new Error().stack);
  }


}

// **************************************
// Translate coordinates from/into pixels
// **************************************

function updateAttributesWidthAndHeightValues(width, height) {

  main_graph_update_needed = true;

  current_width = Math.max(width, 1);
  current_height = Math.max(height, 1);
  width_shift = Math.floor((current_width * left_border_margin_x) / 100.0);
  reduced_width = Math.floor((current_width * (100.0 - left_border_margin_x - right_border_margin_x)) / 100.0);
  height_shift = Math.floor((current_height * top_border_margin_y) / 100.0);
  x_axis_height = 0; // Fixed x axis height
  reduced_height = Math.floor((current_height * (100.0 - top_border_margin_y - bottom_border_margin_y)) / 100.0) - x_axis_height;

}

function get_x_pixel(x) {
  if ( (x < x_min - 0.0000001) || (x > x_max + 0.0000001) ) {
    displayGUIError("out of range x value: " + x, new Error().stack);
    if (x < x_min) x = x_min;
    if (x > x_max) x = x_max;
  }
  return Math.round(width_shift + ((x - x_min) * reduced_width) / (x_max - x_min));
}

function get_x_coordinate(x_pixel) {
  let res;
  if ( (x_pixel < 0) || (x_pixel > current_width) ) {
    displayGUIError("out of range x pixel value: " + x_pixel, new Error().stack);
    if (x_pixel < 0) x_pixel = 0;
    if (x_pixel > current_width) x_pixel = current_width;
  }
  x_pixel_bis = x_pixel;
  if (x_pixel < width_shift) x_pixel_bis = width_shift;
  res = x_min + (((x_pixel_bis - width_shift) * (x_max - x_min)) / reduced_width);
  if (res < x_min) res = x_min;
  if (res > x_max) res = x_max;
  return res;
}

function get_y_pixel(y, ignoreRanges = false) {
  if ( (!ignoreRanges) && ((y < y_min - 0.0000001) || (y > y_max + 0.0000001)) ) {
    displayGUIError("out of range y value: " + y, new Error().stack);
    if (y < y_min) y = y_min;
    if (y > y_max) y = y_max;
  }
  /* if (y < y_min + 1.0) { // x axis height
    return height_shift + reduced_height + x_axis_height - Math.ceil(((y - y_min) * x_axis_height) / 1.0);
  }
  else { */
  return height_shift + reduced_height - Math.ceil(((y - (y_min + 1.0)) * reduced_height) / (y_max - (y_min + 1.0))); // (Math.ceil() is better than Math.floor() to address y grid's rounding issues)
  /* } */
}

function get_y_coordinate(y_pixel) {
  let res;
  if ( (y_pixel < 0) || (y_pixel > current_height) ) {
    displayGUIError("out of range y pixel value: " + y_pixel, new Error().stack);
    if (y_pixel < 0) y_pixel = 0;
    if (y_pixel > current_height) y_pixel = current_height;
  }
  if (y_pixel > height_shift + reduced_height + x_axis_height) {
    res = y_min;
  }
  else if (y_pixel < height_shift) {
    res = y_max;
  }
  /* else if ( (y_pixel > height_shift + reduced_height) && (y_pixel <= height_shift + reduced_height + x_axis_height) ) { // x axis height
    res = y_min + (height_shift + reduced_height + x_axis_height - y_pixel) / x_axis_height;
  } */
  else {
    res = (y_min + 1.0) + ((height_shift + reduced_height - y_pixel) * (y_max - (y_min + 1.0))) / reduced_height;
  }
  if (res < y_min) res = y_min;
  if (res > y_max) res = y_max;
  return res;
}

// ************
// Draw graphic
// ************

// Draw horizontal or vertical lines
function drawLine(ctx, x_0, y_0, x_1, y_1, linewidth = 1) {
  if (x_0 == x_1) {
    ctx.fillRect(x_0,y_0,linewidth,y_1-y_0);
  }
  else {
    ctx.fillRect(x_0,y_0,x_1-x_0,linewidth);
  }
}

/* More general functions to draw lines, but non-integer linewidth is not supported by Chrome) */
function newDrawLinePath(ctx, color, linewidth = 1) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = linewidth;
}
function drawLineWithPath(ctx, x_0, y_0, x_1, y_1) {
  ctx.beginPath();
  ctx.moveTo(x_0+0.5,y_0+0.5);
  ctx.lineTo(x_1+0.5,y_1+0.5);
  ctx.stroke();
}

function draw_graphic(fullMode = true) {
  let gameOnGoingIni = gameOnGoing();
  let currentAttemptNumberIni = currentAttemptNumber;
  draw_graphic_bis();
  if ( (gameOnGoingIni != gameOnGoing()) || (currentAttemptNumber != currentAttemptNumberIni) ) {
   updateGameSizes();
   draw_graphic_bis();
  }
  if (fullMode) {
    draw_graphic_bis(); // sometimes improves the display  - not perfect but best solution found
  }
}

function draw_graphic_bis() {

  let canvas = document.getElementById("my_canvas");
  let ctx = canvas.getContext("2d");

  let res;
  let draw_exception = false;

  let nbColorsRevealed = 0;

  let last_attempt_event = false;

  try {

    ctx.imageSmoothingEnabled = false;
    // ctx.mozImageSmoothingEnabled = false; // (obsolete)
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.oImageSmoothingEnabled = false;
    ctx.globalAlpha = 1;

    let resize_detected = false;
    let resize_cnt = 0;
    do {

      resize_detected = false;
      let width;
      let height;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      // (Alternate sizes:
      //  width = canvas.offsetWidth - 2*2; // 2*2px (canvas' border = 2px) (2nd best solution - not perfect)
      //  height = canvas.offsetHeight - 2*2; // 2*2px (canvas' border = 2px) (2nd best solution - not perfect)
      //  width = canvas.scrollWidth; // (3rd best solution found)
      //  height = canvas.scrollHeight; // (3rd best solution found)
      //  width = canvas.offsetWidth;
      //  height = canvas.offsetHeight;
      //  let positionInfo = canvas.getBoundingClientRect();
      //  height = positionInfo.height;
      //  width = positionInfo.width;

      if ( (current_width != width) || (current_height != height) ) {

        resize_detected = true;
        resize_cnt++;

        if (CompressedDisplayMode) {
          if (width >= CompressedDisplayMode_uncompressWidth) {
            CompressedDisplayMode = false; // (transition)
            updateGameSizes();
          }
        }
        else if (width <= CompressedDisplayMode_compressWidth) {
          CompressedDisplayMode = true; // (transition)
          updateGameSizes();
        }
        mobileMode = false;
        androidMode = false;
        if ( (/Mobi/i.test(navigator.userAgent)) || (/Android/i.test(navigator.userAgent)) // (mobile device check 1/2)
             || (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i.test(navigator.userAgent)) ) { // (mobile device check 2/2)
          if (!CompressedDisplayMode) {
            CompressedDisplayMode = true; // (transition)
            updateGameSizes();
          }
          mobileMode = true;
          backgroundColor_2 = "#FFFFFF";
          backgroundColor_3 = "#EEEEEE";
          if (/Android/i.test(navigator.userAgent)) {
            androidMode = true;
          }
        }
        if (mobileMode && androidMode) {  // It is not possible to change the \u2714 and \u2716 character color on Android/Chrome
          tickChar = "\u2713"; /* (check mark/tick) */
          crossChar = "\u2715"; /* (cross) */
        }
        else {
          tickChar = "\u2714"; /* (check mark/tick) */
          crossChar = "\u2716"; /* (cross) */
        }
        if (CompressedDisplayMode) {

          document.getElementById("newGameButton").value = "N";
          for (let i = nbMinColumns; i <= nbMaxColumns; i++) {
            document.getElementById("columnslabel_" + i).innerHTML = nbColumnsRadioObjectIniNames[i-nbMinColumns].replace(" " + i + " columns", i);
          }
          document.getElementById("resetCurrentCodeButton").value = "\u2718";
          document.getElementById("playRandomCodeButton").value = "\u266C";
          document.getElementById("revealSecretColorButton").value = "?";
          document.getElementById("showPossibleCodesButton").value = showPossibleCodesButtonCompressedName;
          document.getElementById("my_table").style.width = "100%";
          document.getElementById("my_table").style.left = "0%";
          document.getElementById("my_table").style.height = "100%";
          document.getElementById("my_table").style.top = "0%";
          document.getElementById("my_table").style.border = "none";
          document.getElementById("my_table").style["border-radius"] = "0%";
          document.getElementById("my_canvas").style.width = myCanvasIniWidth;
          if (firefoxMode) {
            document.getElementById("my_canvas").style.height = "95%";
          }
          else {
            document.getElementById("my_canvas").style.height = "98%"; // (does not work with Firefox)
          }

          try { // (try/catch because optional pictures)
            document.getElementById("img_1").style.display='none';
            document.getElementById("img_2").style.display='none';
          }
          catch (err) {}

          left_border_margin_x = 1.0;   // Left border margin for x axis in %
          right_border_margin_x = 1.0;  // Right border margin for x axis in %
          bottom_border_margin_y = 1.5; // Bottom border margin for y axis in %
          top_border_margin_y = 1.0;    // Top border margin for y axis in %

        }
        else {

          document.getElementById("newGameButton").value = newGameButtonIniName;
          for (let i = nbMinColumns; i <= nbMaxColumns; i++) {
            document.getElementById("columnslabel_" + i).innerHTML = nbColumnsRadioObjectIniNames[i-nbMinColumns];
          }
          document.getElementById("resetCurrentCodeButton").value = resetCurrentCodeButtonIniName;
          document.getElementById("playRandomCodeButton").value = playRandomCodeButtonIniName;
          document.getElementById("revealSecretColorButton").value = revealSecretColorButtonIniName;
          document.getElementById("showPossibleCodesButton").value = showPossibleCodesButtonIniName;
          document.getElementById("my_table").style.width = tableIniWidth;
          document.getElementById("my_table").style.left = tableIniLeft;
          document.getElementById("my_table").style.height = tableIniHeight;
          document.getElementById("my_table").style.top = tableIniTop;
          document.getElementById("my_table").style.border = tableIniBorder;
          document.getElementById("my_table").style["border-radius"] = tableIniBorderRadius;
          document.getElementById("my_canvas").style.width = myCanvasIniWidth;
          document.getElementById("my_canvas").style.height = myCanvasIniHeight;

          try { // (try/catch because optional pictures)
            document.getElementById("img_1").style.display='inline';
            document.getElementById("img_2").style.display='inline';
          }
          catch (err) {}

          left_border_margin_x = 5.0;   // Left border margin for x axis in %
          right_border_margin_x = 5.0;  // Right border margin for x axis in %
          bottom_border_margin_y = 5.0; // Bottom border margin for y axis in %
          top_border_margin_y = 5.0;    // Top border margin for y axis in %

        }

        let allButtons = document.getElementsByClassName("button");
        let allRadioButtons = document.getElementsByClassName("radio");
        if (height < 400) {
          for (let i = 0; i < allButtons.length; i ++) {
            allButtons[i].style.fontSize = "10px";
          }
          for (let i = 0; i < allRadioButtons.length; i ++) {
            allRadioButtons[i].style.fontSize = "10px";
          }
        }
        else if (height >= 1800) {
          for (let i = 0; i < allButtons.length; i ++) {
            allButtons[i].style.fontSize = "28px";
          }
          for (let i = 0; i < allRadioButtons.length; i ++) {
            allRadioButtons[i].style.fontSize = "28px";
          }
        }
        else if (height >= 1000) {
          for (let i = 0; i < allButtons.length; i ++) {
            allButtons[i].style.fontSize = "23px";
          }
          for (let i = 0; i < allRadioButtons.length; i ++) {
            allRadioButtons[i].style.fontSize = "23px";
          }
        }
        else {
          for (let i = 0; i < allButtons.length; i ++) {
            allButtons[i].style.fontSize = "15px";
          }
          for (let i = 0; i < allRadioButtons.length; i ++) {
            allRadioButtons[i].style.fontSize = "13px";
          }
        }

        canvas.width = width; /* (necessary as canvas may have been expanded to fill its container) */
        canvas.height = height; /* (necessary as canvas may have been expanded to fill its container) */
        ctx.setTransform(1,0,0,1,0,0); // resets the canvas current transform to the identity matrix
        updateAttributesWidthAndHeightValues(width, height);

      }

    } while (resize_detected && (resize_cnt <= 44)); // several iterative calls are necessary to redraw the canvas with proper width and height on window resize

    let nbColumnsSelected = getNbColumnsSelected();
    if ( (nbColumnsSelected < 0) || (nbColumnsSelected > nbMaxColumns) ) { // (error case)
      displayGUIError("inconsistent number of columns selected: " + nbColumnsSelected, new Error().stack);
      nbColumnsSelected = defaultNbColumns;
    }
    if ( newGameEvent
         || (nbColumns != nbColumnsSelected) ) { // Check event "column number change"
      resetGameAttributes(nbColumnsSelected);
    }
    if (simpleCodeHandler.getNbColumns() != nbColumns) {
      throw new Error("invalid nbColumns handling");
    }

    if ((currentAttemptNumber <= 0) || (currentAttemptNumber > nbMaxAttempts+1)) { // Defensive check that currentAttemptNumber is valid
      displayGUIError("inconsistent currentAttemptNumber value: " + currentAttemptNumber, new Error().stack);
    }
    else {
      if ( gameOnGoing() // playing phase
           && simpleCodeHandler.isFullAndValid(currentCode) ) { // New code submitted

        nbCodesPlayed++;

        if (1 == currentAttemptNumber) {
          startTime = (new Date()).getTime(); // time in milliseconds
          stopTime = startTime;
          updateAndStoreNbGamesStarted(+1);
        }
        codesPlayed[currentAttemptNumber-1] = currentCode;
        simpleCodeHandler.fillMark(simpleCodeHandler.convert(sCode), currentCode, marks[currentAttemptNumber-1]);
        if (marks[currentAttemptNumber-1].nbBlacks == nbColumns) { // game over (game won)
          stopTime = (new Date()).getTime(); // time in milliseconds
          currentAttemptNumber++;
          currentCode = -1;
          gameWon = true;
          nbGamesPlayed++;
          nbGamesPlayedAndWon++;
        }
        else {
          currentAttemptNumber++;
          if (currentAttemptNumber == nbMaxAttempts+1) { // game over (game lost)
            currentCode = -1;
            stopTime = (new Date()).getTime(); // time in milliseconds
            nbGamesPlayed++;
          }
          else {
            last_attempt_event = (currentAttemptNumber == nbMaxAttempts) /* (last attempt) */
            currentCode = sCodeRevealed;
          }
        }
        main_graph_update_needed = true;

        // Send a message to the gameSolver worker for the new code submitted
        let nbMaxAttemptsForEndOfGame;
        if (gameWon) {
          nbMaxAttemptsForEndOfGame = currentAttemptNumber-1;
        }
        else {
          nbMaxAttemptsForEndOfGame = nbMaxAttempts;
        }
        gameSolver.postMessage({'req_type': 'NEW_ATTEMPT', 'currentAttemptNumber': currentAttemptNumber-1, 'nbMaxAttemptsForEndOfGame': nbMaxAttemptsForEndOfGame, 'code': codesPlayed[currentAttemptNumber-2], 'mark_nbBlacks': marks[currentAttemptNumber-2].nbBlacks, 'mark_nbWhites': marks[currentAttemptNumber-2].nbWhites, 'game_id': game_cnt});

      }
    }

    // ***************
    // Full repainting
    // ***************

    let nbMaxAttemptsToDisplay = ((!showPossibleCodesMode) ? nbMaxAttempts-nb_attempts_not_displayed : currentAttemptNumber-1);

    if (main_graph_update_needed) { // Note: no double buffering is needed in javascript (canvas contents do not need to be refilled as during Java's repaint())

      let x_0, y_0, x_1, y_1;

      ctx.fillStyle = backgroundColor_2;
      ctx.fillRect(0,0,current_width,current_height);

      // ***************
      // Adapt font size
      // ***************

      font_size = min_font_size;
      let last_valid_font_size = font_size;
      let x_cell_delta = get_x_pixel(x_min+x_step) - get_x_pixel(x_min);
      let y_cell_delta = get_y_pixel(y_min) - get_y_pixel(y_min+y_step);
      let font_tmp = "bold " + font_size + "px " + fontFamily;
      ctx.font = font_tmp;
      let font_width_1char = ctx.measureText("X").width;
      let font_height = font_size;
      while ((font_height <= y_cell_delta-4) && (font_size <= max_font_size) && (font_width_1char <= x_cell_delta-3)) {
        last_valid_font_size = font_size;
        font_size = font_size + 1;
        font_tmp = "bold " + font_size + "px " + fontFamily;
        ctx.font = font_tmp;
        font_width_1char = ctx.measureText("X").width;
        font_height = font_size;
      }
      font_size = last_valid_font_size;

      basic_font = font_size + "px " + fontFamily;
      basic_bold_font = "bold " + font_size + "px " + fontFamily;
      basic_bold_italic_font = "bold italic " + font_size + "px " + fontFamily;

      small_basic_font = Math.max(Math.floor(font_size/1.7), min_font_size) + "px " + fontFamily;
      small_bold_font = "bold " + Math.max(Math.floor(font_size/1.7), min_font_size) + "px " + fontFamily;
      small_italic_font = "italic " + Math.max(Math.floor(font_size/1.7), min_font_size) + "px " + fontFamily;
      very_small_italic_font = "italic " + Math.max(Math.floor(font_size/2.2), min_font_size) + "px " + fontFamily;

      medium_basic_font = Math.max(Math.floor(font_size/1.5), min_font_size) + "px " + fontFamily;
      medium_bold_font = "bold " + Math.max(Math.floor(font_size/1.5), min_font_size) + "px " + fontFamily;
      medium2_bold_font = "bold " + Math.min(Math.max(Math.floor(font_size/1.5)+2, min_font_size), font_size) + "px " + fontFamily;
      medium_bold_italic_font = "bold italic " + Math.max(Math.floor(font_size/1.5), min_font_size) + "px " + fontFamily;

      stats_font = medium_bold_font;
      error_font = font_size + "px " + fontFamily;

      // Draw main game table
      // ********************

      x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
      y_0 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2));
      y_1 = get_y_pixel(y_min);
      ctx.fillStyle = backgroundColor_3;
      ctx.fillRect(x_0, y_0, x_1-x_0, y_1-y_0);

      ctx.font = basic_bold_font;
      for (let attempt = 0; attempt <= nbMaxAttemptsToDisplay; attempt++) {
        x_0 = get_x_pixel(x_min);
        y_0 = get_y_pixel(y_min+attempt*y_step);
        x_1 = get_x_pixel(x_max);
        y_1 = get_y_pixel(y_min+attempt*y_step);
        ctx.fillStyle = darkGray;
        drawLine(ctx, x_0, y_0, x_1+1, y_1);
        if (attempt < nbMaxAttemptsToDisplay) {
          let backgroundColor = backgroundColor_2;
          if (attempt+1 == currentPossibleCodeShown) {
            backgroundColor = highlightColor;
          }
          let str_width;
          if (attempt_nb_width == 0) {
            if (attempt+1 <= currentAttemptNumber-1) { // a mark will be displayed at this place
              continue;
            }
            str_width = (90*(nbColumns+1))/100;
          }
          else {
            str_width = attempt_nb_width;
          }
          let attempt_nb_str_to_display = "";
          if ((!showPossibleCodesMode) && (nb_attempts_not_displayed > 0) && (attempt+1 == nbMaxAttemptsToDisplay)) {
            attempt_nb_str_to_display = String(nbMaxAttempts);
          }
          else {
            attempt_nb_str_to_display = String(attempt+1);
          }
          if (gameWon) {
            if (attempt+1 == currentAttemptNumber-1) {
              displayString(attempt_nb_str_to_display, 0, attempt, str_width,
                            darkGray, backgroundColor, ctx, true, 0, true, 0);
            }
            else {
              displayString(attempt_nb_str_to_display, 0, attempt, str_width,
                            lightGray, backgroundColor, ctx, true, 0, true, 0);
            }
          }
          else if (attempt+1 == currentAttemptNumber) {
            if (attempt+1 == nbMaxAttempts) {
              displayString(attempt_nb_str_to_display, 0, attempt, str_width,
                            redColor, backgroundColor, ctx, true, 0, true, 0);
            }
            else if ( (attempt+2 == nbMaxAttempts)
                      || ((attempt+3 == nbMaxAttempts) && (nbColumns >= 6)) ) {
              displayString(attempt_nb_str_to_display, 0, attempt, str_width,
                            orangeColor, backgroundColor, ctx, true, 0, true, 0);
            }
            else {
              displayString(attempt_nb_str_to_display, 0, attempt, str_width,
                            darkGray, backgroundColor, ctx, true, 0, true, 0);
            }
          }
          else {
            displayString(attempt_nb_str_to_display, 0, attempt, str_width,
                          lightGray, backgroundColor, ctx, true, 0, true, 0);
          }
        }
      }

      ctx.fillStyle = darkGray;
      x_0 = get_x_pixel(x_min);
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min);
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      x_0 = get_x_pixel(x_min+x_step*attempt_nb_width);
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*attempt_nb_width);
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      for (let col = 0; col <= nbColumns; col++) {
        x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
        y_0 = get_y_pixel(y_min);
        x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
        y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
        drawLine(ctx, x_0, y_0, x_1, y_1);
      }

      x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width));
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width));
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width));
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width));
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width+tick_width));
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width+tick_width));
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      // Draw codes played and associated marks
      // **************************************

      ctx.font = basic_bold_font;
      for (let i = 1; i < currentAttemptNumber; i++) {

        displayCode(codesPlayed[i-1], i-1, ctx);

        let backgroundColor = backgroundColor_2;
        if (i == currentPossibleCodeShown) {
          backgroundColor = highlightColor;
        }
        displayMark(marks[i-1], i-1, backgroundColor, ctx);

      }

      // Draw stats
      // **********

      ctx.font = stats_font;
      let nbMaxHintsDisplayed = 2;

      for (let i = 0; i < nbMaxAttempts; i++) {
        performancesDisplayed[i] = false;
      }

      for (let i = 1 ; i <= nbOfStatsFilled_Perfs; i++) {
        let backgroundColor = backgroundColor_2;
        if (i == currentPossibleCodeShown) {
          backgroundColor = highlightColor;
        }

        if (i < currentAttemptNumber) {
          // Performance displayed is wished
          if ( (!gameOnGoing()) || (i <= nbMaxHintsDisplayed)
               || relativePerformancesEvaluationDone[i-1]
               || (nbColumns < nominalGameNbColumns) // easy games
               || (relative_performances_of_codes_played[i-1] == -1.00) ) { // useless code
            displayPerf(relative_performances_of_codes_played[i-1], i-1, backgroundColor, isAttemptPossible(i), showPossibleCodesMode, false, PerformanceNA, ctx);
            if ( (relativePerformancesEvaluationDone[i-1])
                 && (relative_performances_of_codes_played[i-1] != PerformanceUNKNOWN)
                 && (relative_performances_of_codes_played[i-1] <= PerformanceLOW) ) {
              performancesDisplayed[i-1] = true;
            } // else: allow overwriting
          }
          // Performance shall be hidden
          else {
            if (optimal_width > 0) {
              displayString("\u2234" /* (performance temporarily hidden or unknown) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width, i-1, optimal_width,
                            lightGray, backgroundColor, ctx);
            } // else: nothing is displayed, as it will be overwritten below by the nb of possible codes <-> perf switch
          }
        }
      }

      for (let i = 1 ; i <= nbOfStatsFilled_NbPossibleCodes; i++) {
        let backgroundColor = backgroundColor_2;
        if (i == currentPossibleCodeShown) {
          backgroundColor = highlightColor;
        }

        if ((optimal_width > 0) || (i == currentAttemptNumber) || (!performancesDisplayed[i-1]) /* (nb of possible codes <-> perf switch) */) {
          let statsColor;
          if ((i == currentAttemptNumber) || (gameWon && (i == currentAttemptNumber-1))) {
            statsColor = darkGray;
          }
          else {
            statsColor = lightGray;
          }
          if (!displayString("\u2009" /* (thin space) */ + nbOfPossibleCodes[i-1] + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, i-1, nb_possible_codes_width,
                             statsColor, backgroundColor, ctx, true, 0, true, 0)) {
            displayString(String(nbOfPossibleCodes[i-1].toExponential(1)).replace("e+","e"), attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, i-1, nb_possible_codes_width,
                                       statsColor, backgroundColor, ctx);
          }
        }
      }

      // Draw whether codes are possible or not
      // **************************************

      if (tick_width > 0) {
        ctx.font = basic_bold_font;
        for (let i = 1 ; i < currentAttemptNumber; i++) {

          let backgroundColor = backgroundColor_2;
          if (i == currentPossibleCodeShown) {
            backgroundColor = highlightColor;
          }

          let isPossible = isAttemptPossible(i);
          if ( gameOnGoing() && (i > nbMaxHintsDisplayed)
               && (relative_performances_of_codes_played[i-1] != -1.00) // useless code
               && (nbColumns >= nominalGameNbColumns) ) { // not easy games
            ctx.font = stats_font;
            displayString("\u2234" /* tick hidden */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, i-1, tick_width,
                          lightGray, backgroundColor, ctx);
            ctx.font = basic_bold_font;
          }
          else if (0 == isPossible) { // code is possible
            if (relative_performances_of_codes_played[i-1] == -1.00) { // useless code
              displayGUIError("useless code inconsistency", new Error().stack);
            }
            displayString(tickChar, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, i-1, tick_width,
                          greenColor, backgroundColor, ctx);
          }
          else { // code is not possible
            if (i <= 2) {
              displayString(crossChar, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, i-1, tick_width,
                            redColor, backgroundColor, ctx);
            }
            else {
              if (!displayString("\u2009" /* (thin space) */ + crossChar + "\u2009" /* (thin space) */ + isPossible + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, i-1, tick_width,
                                 redColor, backgroundColor, ctx, true, 0, true, 0)) {
                if (!displayString(isPossible, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, i-1, tick_width,
                                   redColor, backgroundColor, ctx, true, 0, true, 0)) {
                  displayString(crossChar, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, i-1, tick_width,
                                redColor, backgroundColor, ctx);
                }
              }
            }
          }

        }
      }

      let HintsThreshold = 5;
      if (!showPossibleCodesMode) {

        // Display game version
        // ********************

        if ((!CompressedDisplayMode) && (optimal_width > 0) && (tick_width > 0)) {
          ctx.font = very_small_italic_font;
          displayString(version, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width+tick_width-5, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors, 5,
                        lightGray, backgroundColor_2, ctx, true, 2, true, 1, true /* (ignoreRanges) */);
        }

        // Display column headers
        // **********************

        // Note: when showPossibleCodesMode is true, this line is used for displayGUIError()
        ctx.font = medium_bold_font;
        if ((!gameOnGoing()) && allPerformancesFilled()) {
          let str1, str1bis, str2;
          let sum_rounded = Math.round(sumPerfs * 100.0) / 100.0;
          str1 = ":";
          str1bis = "";
          /* if (nbUnknownPerfs == 0) {
            str1 = ":";
            str1bis = "";
          }
          else {
            str1 = "";
            str1bis = "\u2248 ";
          } */
          if (sum_rounded > 0.0) {
            str2 = "+" + sum_rounded.toFixed(2) + "!"; // 2 decimal figures
          }
          else {
            str2 = sum_rounded.toFixed(2); // 2 decimal figures
          }
          let res_header1 = false;
          let res_header2 = false;
          if (!display2Strings("number", "   " + "of codes" + "   ", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay, nb_possible_codes_width,
                               lightGray, backgroundColor_2, ctx, 0, true)) {
            if (displayString("\u2009" /* (thin space) */ + "#codes" + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay, nb_possible_codes_width,
                              lightGray, backgroundColor_2, ctx, true, 0, true, 1)) {
              res_header1 = true;
            }
          }
          else {
            res_header1 = true;
          }
          if (res_header1 && (optimal_width > 0)) {
            if (!display2Strings("total" + str1, str1bis + str2, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width, nbMaxAttemptsToDisplay, optimal_width,
                                 lightGray, backgroundColor_2, ctx, 0, true)) {
              if (display2Strings("\u03A3" /* (capital sigma) */ + str1, str1bis + str2, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width, nbMaxAttemptsToDisplay, optimal_width,
                                  lightGray, backgroundColor_2, ctx, 0, true)) {
                res_header2 = true;
              }
            }
            else {
              res_header2 = true;
            }
          }
          if (res_header1 && (res_header2 || (optimal_width <= 0)) && (tick_width > 0)) {
            if (!displayString("\u2009" /* (thin space) */ + tickChar + "\u2009" /* (thin space) */ + "/" + "\u2009" /* (thin space) */ + crossChar + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, nbMaxAttemptsToDisplay, tick_width,
                               lightGray, backgroundColor_2, ctx, true, 0, true, 1)) {
              displayString(tickChar, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, nbMaxAttemptsToDisplay, tick_width,
                            lightGray, backgroundColor_2, ctx, true, 0, true, 1);
            }
          }
        }
        else {
          let res_header1 = false;
          let res_header2 = false;
          if (!display2Strings("number", "   " + "of codes" + "   ", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay, nb_possible_codes_width,
                               lightGray, backgroundColor_2, ctx, 0, true)) {
            if (displayString("\u2009" /* (thin space) */ + "#codes" + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay, nb_possible_codes_width,
                              lightGray, backgroundColor_2, ctx, true, 0, true, 1)) {
              res_header1 = true;
            }
          }
          else {
            res_header1 = true;
          }
          if (res_header1 && (optimal_width > 0)) {
            if (!display2Strings("0: optimal", "-1: useless", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width, nbMaxAttemptsToDisplay, optimal_width,
                                 lightGray, backgroundColor_2, ctx, 0, true)) {
              if (displayString("perf", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width, nbMaxAttemptsToDisplay, optimal_width,
                                lightGray, backgroundColor_2, ctx, true, 0, true, 1)) {
                res_header2 = true;
              }
            }
            else {
              res_header2 = true;
            }
          }
          if (res_header1 && (res_header2 || (optimal_width <= 0)) && (tick_width > 0)) {
            if (!displayString("\u2009" /* (thin space) */ + tickChar + "\u2009" /* (thin space) */ + "/" + "\u2009" /* (thin space) */ + crossChar + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, nbMaxAttemptsToDisplay, tick_width,
                               lightGray, backgroundColor_2, ctx, true, 0, true, 1)) {
              displayString(tickChar, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width+optimal_width, nbMaxAttemptsToDisplay, tick_width,
                            lightGray, backgroundColor_2, ctx, true, 0, true, 1);
            }
          }
        }

        // Draw secret code
        // ****************

        ctx.fillStyle = darkGray;
        if (scode_height > 0) {
          for (let col = 0; col <= nbColumns; col++) {
            x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
            y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height));
            x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
            y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+scode_height));
            drawLine(ctx, x_0, y_0, x_1, y_1);
          }

          x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height));
          x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height));
          drawLine(ctx, x_0, y_0, x_1+1, y_1);

          x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+scode_height));
          x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+scode_height));
          drawLine(ctx, x_0, y_0, x_1, y_1);

          ctx.font = basic_bold_font;
          displayString("Secret code " + "\u2009" /* (thin space) */, 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                        darkGray, backgroundColor_2, ctx, true, 2, true, 0);
          if (gameOnGoing()) {
            displayCode(sCodeRevealed, nbMaxAttemptsToDisplay+transition_height, ctx, true);
          }
          else { // game over
            displayCode(simpleCodeHandler.convert(sCode), nbMaxAttemptsToDisplay+transition_height, ctx);
          }
        }

        // Display game over status
        // ************************

        if (!gameOnGoing()) {

          let totalTimeInSeconds = Math.floor((stopTime - startTime)/1000);
          let timeInMilliSeconds = (stopTime - startTime) % 1000;

          let timeInHours = Math.floor(totalTimeInSeconds/3600);
          let timeInSecondsWithinHour = (totalTimeInSeconds - timeInHours*3600); // (range: [0;3599]
          let timeInMinutes = Math.floor(timeInSecondsWithinHour/60);
          let timeInSeconds = timeInSecondsWithinHour - timeInMinutes*60; // (range: [0;59])

          if (timeInHours >= 24) {
            timeStr = "> 1 day";
          }
          else if (timeInHours >= 3) {
            timeStr = "> " + timeInHours + "h";
          }
          else if (timeInHours > 0) {
            if (timeInMinutes > 0) {
              if (timeInMinutes < 10) {
                timeStr = timeInHours + "h 0" + timeInMinutes;
              }
              else {
                timeStr = timeInHours + "h " + timeInMinutes;
              }
            }
            else {
              timeStr = timeInHours + "h";
            }
          }
          else if (timeInMinutes != 0) {
            timeInSeconds = Math.floor(timeInSeconds/10.0)*10;
            if (timeInMinutes >= 10) {
              timeStr = timeInMinutes + " min";
            }
            else if (timeInSeconds != 0) {
              timeStr = timeInMinutes + " min " + timeInSeconds + " s";
            }
            else {
              timeStr = timeInMinutes + " min";
            }
          }
          else {
            timeStr = timeInSeconds + " s";
          }

          if (gameWon) { // game won
            let victoryStr;
            let victoryStr2;
            let nb_attempts_for_max_score;
            let time_in_seconds_corresponding_to_one_attempt_in_score;
            let multiply_factor;
            switch (nbColumns) {
              case 3:
                nb_attempts_for_max_score = 3; // (estimate: ~16% of scores, below 3 would not be relevant)
                time_in_seconds_corresponding_to_one_attempt_in_score = 60.0; // (time corresponding to 2 attempts: 2 min)
                multiply_factor = 0.50;
                break;
              case 4:
                nb_attempts_for_max_score = 3; // (estimate: ~5% of scores)
                time_in_seconds_corresponding_to_one_attempt_in_score = 300.0; // (time corresponding to 2 attempts: 10 min)
                multiply_factor = 0.75;
                break;
              case 5:
                nb_attempts_for_max_score = 4; // (estimate: ~5% of scores)
                time_in_seconds_corresponding_to_one_attempt_in_score = 450.0; // (time corresponding to 2 attempts: 15 min) // See (*)
                multiply_factor = 1.0;
                break;
              case 6:
                nb_attempts_for_max_score = 6; // (estimate: ~15% of scores)
                time_in_seconds_corresponding_to_one_attempt_in_score = 750.0;  // (time corresponding to 2 attempts: 25 min) // See (*)
                multiply_factor = 1.5;
                break;
              case 7:
                nb_attempts_for_max_score = 7; // (estimate: ~7% of scores)
                time_in_seconds_corresponding_to_one_attempt_in_score = 1000.0;  // (time corresponding to 2 attempts: 33.3 min) // See (*)
                multiply_factor = 2.0;
                break;
              default:
                throw new Error("invalid number of columns in score calculation: " + nbColumns);
            }
            let max_score = 100.0;
            let min_score = 1.4 - Math.min(totalTimeInSeconds/1000000, 0.4);
            let score_from_nb_attempts;
            if (currentAttemptNumber-1 /* number of attempts */ <= nb_attempts_for_max_score) { // (all the very low numbers of attempts ("lucky games") are handled the same way)
              score_from_nb_attempts = max_score;
            }
            else {
              score_from_nb_attempts = max_score - ((currentAttemptNumber-1) /* number of attempts */ - nb_attempts_for_max_score)*10.0;
            }
            let time_in_seconds_short_games = (2.0*time_in_seconds_corresponding_to_one_attempt_in_score)/3.0;
            let time_delta_score;
            if (totalTimeInSeconds <= time_in_seconds_short_games) { // scoring rule useful to distinguish good players
              time_delta_score = (totalTimeInSeconds*10.0)/time_in_seconds_short_games;
            }
            else { // scoring rule for other players
              // "good player's slope / 2"
              time_delta_score = 10.0 + (10.0 * (totalTimeInSeconds - time_in_seconds_short_games)) / (2*time_in_seconds_corresponding_to_one_attempt_in_score - time_in_seconds_short_games);
            }
            let max_time_delta_score = 2*10.0; // the time spent will tend not to cost more than 2 attempts in the score
            if ( (time_delta_score <= max_time_delta_score)
                 || (currentAttemptNumber-1 /* number of attempts */ >= nbMaxAttempts) /* at last attempt, score will tend towards zero "more quickly" as time goes on */ ) {
              score = multiply_factor * (score_from_nb_attempts - time_delta_score) + 0.499 - timeInMilliSeconds/10000000;
            }
            else {
              score = multiply_factor * (score_from_nb_attempts - max_time_delta_score
                                         - (time_delta_score - max_time_delta_score)/1.5) + 0.499 - timeInMilliSeconds/10000000; // "good player's slope / 3"
            }
            if (score < min_score) {
              score = min_score; /* (score will never be zero in case the game was won) */
            }

            // Check if the player was helped
            if (playerWasHelped) {
              victoryStr = "You won with help!";
              victoryStr2 = "You won /?"
              nbColorsRevealed = (nbColumns-simpleCodeHandler.nbEmptyColors(sCodeRevealed));
              if (nbColorsRevealed == 1) { // 1 color revealed
                score = Math.max(score / 3.0, min_score);
              }
              else if (nbColorsRevealed == 2) { // 2 colors revealed
                score = Math.max(score / (3.0*3.0), min_score);
              }
              else if (nbColorsRevealed > 2) { // > 2 colors revealed
                score = Math.max(score / (3.0*3.0*3.0), min_score);
              }
              else {
                score = 0.0;
                displayGUIError("internal error: nbColorsRevealed = " + nbColorsRevealed, new Error().stack);
              }
            }
            else {
              victoryStr = "You won!!!";
              victoryStr2 = "You won!"
            }

            if (!displayString(victoryStr, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2, nb_possible_codes_width+optimal_width+tick_width,
                          greenColor, backgroundColor_2, ctx, true, 0, true, 0)) {
              displayString(victoryStr2, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2, nb_possible_codes_width+optimal_width+tick_width,
                            greenColor, backgroundColor_2, ctx, true, 0, false, 0);
            }
            if (!displayString("\u2009" /* (thin space) */ + "Time: " + timeStr + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2-1, nb_possible_codes_width+optimal_width+tick_width,
                               greenColor, backgroundColor_2, ctx, true, 0, true, 0)) {
              displayString(timeStr, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2-1, nb_possible_codes_width+optimal_width+tick_width,
                            greenColor, backgroundColor_2, ctx, true, 0, false, 0);
            }
            // if (score > 0.0) {
            let rounded_score = Math.round(score);
            displayString("Score: " + rounded_score, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2-2, nb_possible_codes_width+optimal_width+tick_width,
                          greenColor, backgroundColor_2, ctx, true, 0, false, 0);
            // }

          }
          else if (currentAttemptNumber == nbMaxAttemptsToDisplay+1) { // game lost

            score = 0.0;
            displayString("You lost!", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2, nb_possible_codes_width+optimal_width+tick_width,
                          redColor, backgroundColor_2, ctx, true, 0, false, 0);
            if (!displayString("\u2009" /* (thin space) */ + "Time: " + timeStr + "\u2009" /* (thin space) */, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2-1, nb_possible_codes_width+optimal_width+tick_width,
                               redColor, backgroundColor_2, ctx, true, 0, true, 0)) {
              displayString(timeStr, attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2-1, nb_possible_codes_width+optimal_width+tick_width,
                            redColor, backgroundColor_2, ctx, true, 0, false, 0);
            }
            displayString("Score: 0", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors/2-2, nb_possible_codes_width+optimal_width+tick_width,
                          redColor, backgroundColor_2, ctx, true, 0, false, 0);

          }
          else {
            displayGUIError("game over inconsistency", new Error().stack);
          }

        }

        // Draw color selection
        // ********************

        if (font_size != min_font_size) {
          ctx.fillStyle = darkGray;
        }
        else {
          ctx.fillStyle = backgroundColor_2;
        }
        for (let color = 0; color <= nbColors; color++) {
          x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+color));
          x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+color));
          drawLine(ctx, x_0, y_0, x_1+1, y_1);
        }

        for (let col = 0; col <= nbColumns; col++) {
          x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height));
          x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+nbColors));
          drawLine(ctx, x_0, y_0, x_1, y_1);
        }

        ctx.font = basic_bold_font;
        for (let color = 0; color < nbColors; color++) {
          for (let col = 0; col < nbColumns; col++) {
            color_selection_code = simpleCodeHandler.setColor(color_selection_code, color+1, col+1);
          }
          displayCode(color_selection_code, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+color, ctx);
        }

        ctx.fillStyle = darkGray;

        try {
          ctx.font = medium2_bold_font;
          if ((nbGamesPlayedAndWon == 0) && gameOnGoing() && (currentAttemptNumber <= 3)) {
            let x_delta = 0.75;
            if (!displayString("Select colors here!", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+1.35*x_delta, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+Math.floor(nbColors/2)-0.5, +nb_possible_codes_width+optimal_width+tick_width-2.70*x_delta,
                               darkGray, backgroundColor_2, ctx, true, 1, true, 0, false, true, true /* bottom-right bubble */)) {
              if (!displayString("Select colors!", attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+1.35*x_delta, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+Math.floor(nbColors/2)-0.5, +nb_possible_codes_width+optimal_width+tick_width-2.70*x_delta,
                                 darkGray, backgroundColor_2, ctx, true, 1, true, 0, false, true, true /* bottom-right bubble */)) {
                // ctx.font = medium_bold_font;
                if (!displayString("Select colors!", x_delta*0.90, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+Math.floor(nbColors/2)-0.5, attempt_nb_width+(90*(nbColumns+1))/100-2.22*x_delta,
                                   darkGray, backgroundColor_2, ctx, true, 2, true, 0, false, true, false /* bottom-left bubble */)) {
                  // if (font_size >= 27) { // (very big font cases)
                  //  ctx.font = medium_bold_font;
                  // }
                  displayString("Select me!", x_delta*0.80, nbMaxAttemptsToDisplay+transition_height+scode_height+transition_height+Math.floor(nbColors/2)-0.5, attempt_nb_width+(90*(nbColumns+1))/100-2.22*x_delta,
                                darkGray, backgroundColor_2, ctx, true, 2, true, 0, false, true, false /* bottom-left bubble */);
                }
              }
            }
          }
        }
        catch (err_help) {}

      }

      else { // showPossibleCodesMode is true

        // Display text related to possible codes
        // **************************************

        let nbOfCodes = nbOfPossibleCodes[currentPossibleCodeShown-1];
        let nbOfCodesListed;
        let code_list_offset;
        if ((!showPossibleCodesOffsetMode) || (nbOfCodes <= nbPossibleCodesShown)) { // (first half display)
          nbOfCodesListed = Math.min(nbOfCodes,nbPossibleCodesShown);
          code_list_offset = 0;
        }
        else { // (second half display)
          nbOfCodesListed = Math.min(nbOfCodes-nbPossibleCodesShown,nbPossibleCodesShown);
          code_list_offset = nbPossibleCodesShown;
        }
        if ( (currentPossibleCodeShown >= 1) && (currentPossibleCodeShown <= nbMaxAttempts) && (nbOfCodes>=1) ) {

          ctx.font = basic_bold_font;
          if (nbOfCodes == 1) {
            res = displayString("1 possible code ", 0, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-1, attempt_nb_width+(90*(nbColumns+1))/100,
                                darkGray, backgroundColor_2, ctx, true, 0, true, 0);
            if (!res) {
              res = displayString("1\u2009code ", 0, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-1, attempt_nb_width+(90*(nbColumns+1))/100,
                                  darkGray, backgroundColor_2, ctx, true, 0, true, 0);
              if (!res) {
                res = displayString("1", 0, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-1, attempt_nb_width+(90*(nbColumns+1))/100,
                                    darkGray, backgroundColor_2, ctx, true, 0, true, 0);
              }
            }
          }
          else {
            res = displayString(nbOfCodes + " possible codes ", 0, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-1, attempt_nb_width+(90*(nbColumns+1))/100,
                                darkGray, backgroundColor_2, ctx, true, 0, true, 0);
            if (!res) {
              res = displayString(nbOfCodes + "\u2009codes ", 0, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-1, attempt_nb_width+(90*(nbColumns+1))/100,
                                  darkGray, backgroundColor_2, ctx, true, 0, true, 0);
              if (!res) {
                res = displayString(String(nbOfCodes), 0, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-1, attempt_nb_width+(90*(nbColumns+1))/100,
                                    darkGray, backgroundColor_2, ctx, true, 0, true, 0);
              }
            }
          }
          let currentPossibleCodeShownStr;
          switch (currentPossibleCodeShown) {
            case 1:
              currentPossibleCodeShownStr = "1st";
              break;
            case 2:
              currentPossibleCodeShownStr = "2nd";
              break;
            case 3:
              currentPossibleCodeShownStr = "3rd";
              break;
            default:
              currentPossibleCodeShownStr = currentPossibleCodeShown + "th";
          }
          if (res) {
            displayString("at " + currentPossibleCodeShownStr + " attempt  ", 0, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-2, attempt_nb_width+(90*(nbColumns+1))/100,
                          darkGray, backgroundColor_2, ctx, true, 0, true, 0);
            if (nbOfCodesListed < nbOfCodes) {
              ctx.font = basic_bold_font;
              let offset_str;
              if (!showPossibleCodesOffsetMode) {
                offset_str = "\u25bc";
              }
              else {
                offset_str = "\u25b2";
              }
              if (nbOfCodes-nbOfCodesListed == 1) {
                if (!displayString("+ 1 other code\u2009" + offset_str + " ", 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                   darkGray, backgroundColor_2, ctx, true, 0, true, 0)) {
                  if (!displayString("+\u2009" + "1" + "\u2009code\u2009" + offset_str + "\u2009", 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                     darkGray, backgroundColor_2, ctx, true, 0, true, 0)) {
                    if (!displayString("+\u2009" + "1" + "\u2009" + offset_str + "\u2009", 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                       darkGray, backgroundColor_2, ctx, true, 0, true, 0)) {
                      displayString("+\u2009" + "1", 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                    darkGray, backgroundColor_2, ctx, true, 0, true, 0);
                    }
                  }
                }
              }
              else {
                if(!displayString("+ " + (nbOfCodes-nbOfCodesListed) + " other codes\u2009" + offset_str + " ", 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                  darkGray, backgroundColor_2, ctx, true, 0, true, 0)) {
                  if (!displayString("+\u2009" + (nbOfCodes-nbOfCodesListed) + "\u2009codes\u2009" + offset_str + "\u2009", 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                     darkGray, backgroundColor_2, ctx, true, 0, true, 0)) {
                    if (!displayString("+\u2009" + (nbOfCodes-nbOfCodesListed) + "\u2009" + offset_str + "\u2009", 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                       darkGray, backgroundColor_2, ctx, true, 0, true, 0)) {
                      displayString("+\u2009" + (nbOfCodes-nbOfCodesListed), 0, nbMaxAttemptsToDisplay+transition_height, attempt_nb_width+(90*(nbColumns+1))/100,
                                    darkGray, backgroundColor_2, ctx, true, 0, true, 0);
                    }
                  }
                }
              }
            }
          }

        }
        else {
          displayGUIError("invalid currentPossibleCodeShown: " + currentPossibleCodeShown, new Error().stack);
        }

        // Draw always present and impossible colors
        // *****************************************

        ctx.font = basic_bold_font;
        for (let col = 0; col < nbColumns; col++) {
          if (simpleCodeHandler.getColor(colorsFoundCodes[currentPossibleCodeShown-1], col+1) != emptyColor) {
            displayString(tickChar, attempt_nb_width+(90*(nbColumns+1))/100+col*2, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown, 2,
                          greenColor, backgroundColor_2, ctx, true, 0, true, 1, true /* (ignoreRanges) */);
          }
        }

        ctx.font = basic_bold_font;
        let colors_cnt = 0;
        for (let color = 1; color <= nbColors; color++) {
          if (minNbColorsTables[currentPossibleCodeShown-1][color] > 0) { // always present color
            for (let i = 0; i < minNbColorsTables[currentPossibleCodeShown-1][color]; i++) {
              displayColor(color, attempt_nb_width+(90*(nbColumns+1))/100-3, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-4-colors_cnt, ctx, false, true);
              colors_cnt++;
            }
          }
        }
        if (colors_cnt > 0) {
          colors_cnt++;
        }
        for (let color = 1; color <= nbColors; color++) {
          if (maxNbColorsTables[currentPossibleCodeShown-1][color] == 0) { // impossible color
            displayColor(color, attempt_nb_width+(90*(nbColumns+1))/100-3, nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-4-colors_cnt, ctx, false, false);
            colors_cnt++;
          }
        }

        // Draw possible codes & their stats
        // *********************************

        ctx.fillStyle = darkGray;
        for (let codeidx = 0; codeidx <= nbPossibleCodesShown; codeidx++) {
          x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+codeidx));
          x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+codeidx));
          drawLine(ctx, x_0, y_0, x_1+1, y_1);
        }

        for (let col = 0; col <= nbColumns; col++) {
          x_0 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height));
          x_1 = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100+col*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown));
          drawLine(ctx, x_0, y_0, x_1, y_1);
        }

        let best_global_perf = global_best_performances[currentPossibleCodeShown-1];
        let valid_best_global_perf = ((best_global_perf != PerformanceUNKNOWN) && (best_global_perf > 0.01)); // valid global_best_performances value
        for (let codeidx = 0; codeidx < nbOfCodesListed; codeidx++) {

          // Display code
          let code = possibleCodesLists[currentPossibleCodeShown-1][codeidx+code_list_offset];
          let y_cell = nbMaxAttemptsToDisplay+transition_height+nbPossibleCodesShown-1-codeidx;
          ctx.font = basic_bold_font;
          displayCode(code, y_cell, ctx);

          // Display performances
          let global_perf = PerformanceUNKNOWN;
          let relative_perf = PerformanceUNKNOWN;
          if ( valid_best_global_perf
               && (globalPerformancesList[currentPossibleCodeShown-1][codeidx+code_list_offset] != PerformanceUNKNOWN) && (globalPerformancesList[currentPossibleCodeShown-1][codeidx+code_list_offset] > 0.01) ) { // valid globalPerformancesList value
            global_perf = globalPerformancesList[currentPossibleCodeShown-1][codeidx+code_list_offset];
            relative_perf = best_global_perf - global_perf;
          }
          ctx.font = stats_font;
          let backgroundColor = backgroundColor_2;
          displayPerf(relative_perf, y_cell, backgroundColor, global_perf, true, valid_best_global_perf && (currentPossibleCodeShown <= 2), best_global_perf, ctx);

        }

      }

      // Enable or disable GUI controls
      // ******************************

      document.getElementById("newGameButton").disabled = (gameWon && !allPerformancesFilled());
      if (document.getElementById("newGameButton").disabled) {
        document.getElementById("newGameButton").className  = "button disabled";
      }
      else {
        document.getElementById("newGameButton").className  = "button";
      }

      if (currentAttemptNumber > 1) {
        document.getElementById("columnslabel_3b").disabled = true;
        document.getElementById("columnslabel_4b").disabled = true;
        document.getElementById("columnslabel_5b").disabled = true;
        document.getElementById("columnslabel_6b").disabled = true;
        document.getElementById("columnslabel_7b").disabled = true;
        document.getElementById("columnslabel_3").className = "radio disabled";
        document.getElementById("columnslabel_4").className = "radio disabled";
        document.getElementById("columnslabel_5").className = "radio disabled";
        document.getElementById("columnslabel_6").className = "radio disabled";
        document.getElementById("columnslabel_7").className = "radio disabled";
      }
      else {
        document.getElementById("columnslabel_3b").disabled = false;
        document.getElementById("columnslabel_4b").disabled = false;
        document.getElementById("columnslabel_5b").disabled = false;
        document.getElementById("columnslabel_6b").disabled = false;
        document.getElementById("columnslabel_7b").disabled = false;
        document.getElementById("columnslabel_3").className = "radio";
        document.getElementById("columnslabel_4").className = "radio";
        document.getElementById("columnslabel_5").className = "radio";
        document.getElementById("columnslabel_6").className = "radio";
        document.getElementById("columnslabel_7").className = "radio";
      }

      document.getElementById("playRandomCodeButton").disabled = (!gameOnGoing() || (currentAttemptNumber >= nbMaxAttempts - ((nbColumns >= 6) ? 2 : 1)));
      if (document.getElementById("playRandomCodeButton").disabled) {
        document.getElementById("playRandomCodeButton").className = "button disabled";
      }
      else {
        document.getElementById("playRandomCodeButton").className = "button";
      }

      document.getElementById("revealSecretColorButton").disabled = !(gameOnGoing() && (nbColumns-simpleCodeHandler.nbEmptyColors(sCodeRevealed)+1) < (nbColumns+1)/2);
      if ( gameOnGoing() && (currentAttemptNumber > 1) // (Note: full condition duplicated at several places in this file)
           && !(document.getElementById("revealSecretColorButton").disabled)
           && (sCodeRevealed == 0)
           && ( (((new Date()).getTime() - startTime)/1000 > ((nbColumns <= 5) ? 1500 /* 25 min */ : 1800 /* 30 min */))  // See also (*)
                || (currentAttemptNumber == nbMaxAttempts-1) /* (last but one attempt) */
                || at_least_one_useless_code_played ) ) { /* (number of useless attempts) */
        document.getElementById("revealSecretColorButton").className = (androidMode ? "button fast_blinking" : "button blinking");
      }
      else if (document.getElementById("revealSecretColorButton").disabled) {
        document.getElementById("revealSecretColorButton").className = "button disabled";
      }
      else {
        document.getElementById("revealSecretColorButton").className = "button";
      }
      document.getElementById("showPossibleCodesButton").disabled = !((!gameOnGoing()) && allPossibleCodesFilled());
      if (document.getElementById("showPossibleCodesButton").disabled) {
        document.getElementById("showPossibleCodesButton").className = "button disabled";
      }
      else {
        document.getElementById("showPossibleCodesButton").className = (mobileMode ? "button" /* ("button fast_blinking" generates display issues) */ : "button blinking");
      }

      if (CompressedDisplayMode) {
        if (showPossibleCodesMode) {
          document.getElementById("showPossibleCodesButton").value = showPossibleCodesButtonBackToGameCompressedName;
        }
        else {
          document.getElementById("showPossibleCodesButton").value = showPossibleCodesButtonCompressedName;
        }
      }
      else {
        if (showPossibleCodesMode) {
          document.getElementById("showPossibleCodesButton").value = showPossibleCodesButtonBackToGameName;
        }
        else {
          document.getElementById("showPossibleCodesButton").value = showPossibleCodesButtonIniName;
        }
      }

      checkArraySizes();

      main_graph_update_needed = false;

    }

    // ******************
    // Partial repainting
    // ******************

    // Display current code
    if (gameOnGoing()) { // playing phase
      ctx.font = basic_bold_font;
      displayCode(currentCode, currentAttemptNumber-1, ctx);

      // Useful to trigger button blinking due to time only
      if ( gameOnGoing() && (currentAttemptNumber > 1) // (Note: full condition duplicated at several places in this file)
           && !(document.getElementById("revealSecretColorButton").disabled)
           && (sCodeRevealed == 0)
           && ( (((new Date()).getTime() - startTime)/1000 > ((nbColumns <= 5) ? 1500 /* 25 min */ : 1800 /* 30 min */))  // See also (*)
                || (currentAttemptNumber == nbMaxAttempts-1) /* (last but one attempt) */ ) ) {
          if (document.getElementById("revealSecretColorButton").className.indexOf('blinking') == -1) {
            document.getElementById("revealSecretColorButton").className = document.getElementById("revealSecretColorButton").className + (androidMode ? " fast_blinking" : " blinking");
          }
      }
    }

    document.getElementById("resetCurrentCodeButton").disabled  = !(gameOnGoing() && (currentCode != sCodeRevealed));
    if (document.getElementById("resetCurrentCodeButton").disabled) {
      document.getElementById("resetCurrentCodeButton").className = "button disabled";
    }
    else {
      document.getElementById("resetCurrentCodeButton").className = "button";
    }

    if ( last_attempt_event
         && (nbGamesPlayedAndWon == 0)
         && (gameOnGoing())
         && !(document.getElementById("revealSecretColorButton").disabled)
         && (sCodeRevealed == 0) ) {
      if (!CompressedDisplayMode) {
        alert("Need some help? Click on the \"" + document.getElementById("revealSecretColorButton").value + "\" button!" );
      }
      else {
        alert("Need some help? Click on the \"" + document.getElementById("revealSecretColorButton").value + "\" button to reveal a secret color!" );
      }
    }

  }
  catch (err) {
    draw_exception = true;
    displayGUIError("draw error: " + err, err.stack);
  }

}

function displayString(str, x_cell, y_cell, x_cell_width,
                       foregroundColor, backgroundColor,
                       ctx,
                       displayColorMode = true, // true = nominal display, false = strikethrough mode
                       justify = 0 /* 0 = centered, 1 = left, 2 = right */,
                       displayIfEnoughRoom = false,
                       halfLine = 0 /* 0 = full line, 1 = bottom half line, 2 = top half line */,
                       ignoreRanges = false,
                       drawInBubble = false, bottomRightBubble = true) {

  let x_0 = get_x_pixel(x_min+x_step*x_cell);
  let x_0_for_drawBubble;
  let x_0_next = get_x_pixel(x_min+x_step*(x_cell+x_cell_width));
  let y_0;
  let y_0_next;
  let y_offset = 0; // (works with Chrome)
  if (firefoxMode) {
    y_offset = 1; // (works with Firefox)
  }

  let str_width = ctx.measureText(str).width;
  let str_height = parseInt(ctx.font.match(/\d+/)[0]); // only get numbers => this is the font height

  if (0 == halfLine) {
    y_0 = get_y_pixel(y_min+y_step*y_cell);
    y_0_next = get_y_pixel(y_min+y_step*(y_cell+1), ignoreRanges);
  }
  else if (1 == halfLine) { // bottom half line
    y_0 = get_y_pixel(y_min+y_step*y_cell) - Math.round(str_height/4);
    y_0_next = y_0 - str_height;
  }
  else { // top half line
    y_0 = get_y_pixel(y_min+y_step*y_cell) - str_height - Math.round(str_height/4) - 2;
    y_0_next = y_0 - str_height;
  }

  if ( (!displayIfEnoughRoom) || (x_0_next - x_0 - str_width >= 0) ) {
    if (!ignoreRanges) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(x_0 + 1, y_0_next + 1, x_0_next - x_0 - 1, y_0 - y_0_next - 1);
    }
    if (justify == 0) { // centered
      if (!displayColorMode) { // To simplify, strikethrough mode is only handled in the centered case
        let redC = parseInt(backgroundColor.substring(1,3), 16);
        let greenC = parseInt(backgroundColor.substring(3,5), 16);
        let blueC = parseInt(backgroundColor.substring(5,7), 16);
        if (Math.max(Math.max(redC, greenC), blueC) < 50) {
          ctx.strokeStyle = "white";
        }
        else {
          ctx.strokeStyle = "black";
        }
        ctx.beginPath();
        let lineWidthIni = ctx.lineWidth;
        ctx.lineWidth = 2;
        ctx.moveTo(x_0 + 2, y_0 - 2);
        ctx.lineTo(x_0_next - 2, y_0_next + 2);
        ctx.moveTo(x_0 + 2, y_0_next + 2);
        ctx.lineTo(x_0_next - 2, y_0 - 2);
        ctx.stroke();  // Draw it
        ctx.lineWidth = lineWidthIni;

        ctx.fillStyle = backgroundColor;
        let half_hidding_rect_width = Math.min(16*(x_0_next - x_0)/100, str_width/2+2);
        ctx.fillRect(x_0 + (x_0_next - x_0)/2 - half_hidding_rect_width, y_0_next + 1, 2*half_hidding_rect_width+2, y_0 - y_0_next - 1);
      }
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "center"; // horizontal alignment
      ctx.textBaseline = "middle"; // vertical alignment
      ctx.fillText(str, (x_0 + x_0_next)/2, (y_0 + y_0_next)/2 + y_offset);
      x_0_for_drawBubble = Math.max((x_0 + x_0_next)/2 - str_width/2, 0);
      // subPixelText(ctx, str, (x_0 + x_0_next)/2, y_0, 25);
    }
    else if (justify == 2) { // right
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "end"; // horizontal alignment
      ctx.textBaseline = "middle"; // vertical alignment
      ctx.fillText(str, x_0_next, (y_0 + y_0_next)/2 + y_offset);
      x_0_for_drawBubble = Math.max(x_0_next - str_width, 0);
    }
    else { // left
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "start"; // horizontal alignment
      ctx.textBaseline = "middle"; // vertical alignment
      ctx.fillText(str, x_0, (y_0 + y_0_next)/2 + y_offset);
      x_0_for_drawBubble = x_0;
    }

    if (drawInBubble) {
      let delta_x = 10;
      let delta_y = 3;
      drawBubble(ctx, x_0_for_drawBubble - delta_x, y_0_next - delta_y, str_width + 2*delta_x, y_0 - y_0_next + 2*delta_y, Math.floor(str_height/2), foregroundColor, 1, bottomRightBubble);
    }

    return true;
  }
  return false;

}

function display2Strings(str1, str2, x_cell, y_cell, x_cell_width,
                        foregroundColor, backgroundColor, ctx,
                        justify /* 0 = centered, 1 = left, 2 = right */, displayIfEnoughRoom) {
  let res;
  if (ctx.measureText(str1).width <= ctx.measureText(str2).width) {
    res = displayString(str2, x_cell, y_cell, x_cell_width,
                        foregroundColor, backgroundColor, ctx, true, justify, displayIfEnoughRoom, 1);
    if (res) {
      displayString(str1, x_cell, y_cell, x_cell_width,
                    foregroundColor, backgroundColor, ctx, true, justify, displayIfEnoughRoom, 2);
    }
  }
  else {
    res = displayString(str1, x_cell, y_cell, x_cell_width,
                        foregroundColor, backgroundColor, ctx, true, justify, displayIfEnoughRoom, 2);
    if (res) {
      displayString(str2, x_cell, y_cell, x_cell_width,
                      foregroundColor, backgroundColor, ctx, true, justify, displayIfEnoughRoom, 1);
    }
  }
  return res;
}

function displayColor(color, x_cell, y_cell, ctx, secretCodeCase, displayColorMode) {
  if (color != emptyColor) {
    if (color < 10) {
      displayString(color, x_cell, y_cell, 2,
                    foregroundColorTable[color-1], backgroundColorTable[color-1], ctx, displayColorMode, 0, false, 0);
    }
    else {
      let res = displayString(color, x_cell, y_cell, 2,
                              foregroundColorTable[color-1], backgroundColorTable[color-1], ctx, displayColorMode, 0, true, 0);
      if (!res) {
        displayString(color-10, x_cell, y_cell, 2,
                      foregroundColorTable[color-1], backgroundColorTable[color-1], ctx, displayColorMode, 0, false, 0);
      }
    }
  }
  else {
    if (secretCodeCase) {
      let bckg_color = darkGray;
      if (currentAttemptNumber <= 1) { // a little fun
        if (color_cnt >= nbColors) {
          color_cnt = 0;
        }
        bckg_color = backgroundColorTable[color_cnt];
        color_cnt++;
        if (color_cnt == 5) {
          color_cnt = 7;
        }
      }
      displayString("?", x_cell, y_cell, 2,
                    bckg_color, backgroundColor_2, ctx, displayColorMode, 0, false, 0);
    }
    else {
      displayString("", x_cell, y_cell, 2,
                    darkGray, backgroundColor_3, ctx, displayColorMode, 0, false, 0);
    }
  }
}

function displayCode(code, y_cell, ctx, secretCodeCase = false) {
  for (let col = 0; col < nbColumns; col++) {
    let color = simpleCodeHandler.getColor(code, col+1);
    displayColor(color, attempt_nb_width+(90*(nbColumns+1))/100+col*2, y_cell, ctx, secretCodeCase, true);
  }
}


function displayMark(mark, y_cell, backgroundColor, ctx) {

  let x_0 = get_x_pixel(x_min+x_step*attempt_nb_width);
  let x_0_next = get_x_pixel(x_min+x_step*(attempt_nb_width+(90*(nbColumns+1))/100));
  let circle_width = (2.0*(x_0_next - x_0 - 2)) / (3.0 * nbColumns + 1);
  let circle_width_applied = Math.floor(circle_width);
  if ((circle_width_applied % 2) == 1) circle_width_applied++; // makes marks larger and even values avoid Java displaying issues when drawOval is run
  let y_0 = get_y_pixel(y_min+y_step*y_cell);
  let y_0_next = get_y_pixel(y_min+y_step*(y_cell+1));
  let constant_y_cell_delta = get_y_pixel(y_min) - get_y_pixel(y_min+y_step);
  while (circle_width_applied > Math.floor((55*constant_y_cell_delta)/100)) {
    circle_width_applied = circle_width_applied - 2; // (keeps even)
  }
  if (circle_width_applied < 2) {
    circle_width_applied = 2;
  }

  // Space between marks whose circle's diameter is circle_width_applied
  let space_btw_marks = ((x_0_next - x_0 - 2.0) - (nbColumns*(circle_width_applied+1.0))) / (nbColumns+1.0);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(x_0 + 1, y_0_next + 1, x_0_next - x_0 - 1, y_0 - y_0_next - 1);

  ctx.fillStyle = "black";

  let x_0_pos;
  let left_space = 1 + Math.floor(space_btw_marks);
  let right_space = Math.floor(Math.max(0, (x_0_next - x_0) - (1 + Math.floor(space_btw_marks) + (nbColumns-1.0)*(circle_width_applied+1.0+Math.floor(space_btw_marks)) + circle_width_applied)));
  let x_0_pos_offset = Math.max(0, Math.floor((left_space + right_space)/2) - left_space);

  let circleBorderWidth = 1.25;
  let whiteBckg = "#FCFCFC";
  let radius = Math.floor(circle_width_applied/2);
  if (radius <= 3) { // radius
    circleBorderWidth = 0.6;
    whiteBckg = "#FFFFFF";
  }

  for (let i = 0; i < mark.nbBlacks; i++) {
    x_0_pos = Math.round(x_0 + 1.0 + Math.floor(space_btw_marks) + i*(circle_width_applied+1.0+Math.floor(space_btw_marks))); // Math.floor(space_btw_marks) instead of space_btw_marks to have constant spacing between all circles


    ctx.beginPath();
    ctx.arc(x_0_pos + x_0_pos_offset + radius, // center x
            Math.floor((y_0 + y_0_next + 1)/2), // center y
            radius, // radius
            0, 2 * Math.PI, false); // starting and ending angles + clockwise
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.lineWidth = circleBorderWidth;
    ctx.strokeStyle = "black";
    ctx.stroke();

  }

  for (let i = mark.nbBlacks; i < mark.nbBlacks + mark.nbWhites; i++) {
    x_0_pos = Math.round(x_0 + 1.0 + Math.floor(space_btw_marks) + i*(circle_width_applied+1.0+Math.floor(space_btw_marks))); // (int)space_btw_marks instead of space_btw_marks to have constant spacing between all circles

    ctx.beginPath();
    ctx.arc(x_0_pos + x_0_pos_offset + radius, // center x
            Math.floor((y_0 + y_0_next + 1)/2), // center y
            radius, // radius
            0, 2 * Math.PI, false); // starting and ending angles + clockwise
    ctx.fillStyle = whiteBckg;
    ctx.fill();
    ctx.lineWidth = circleBorderWidth;
    ctx.strokeStyle = "black";
    ctx.stroke();

  }

}

function drawBubble(ctx, x, y, w, h, radius, foregroundColor, lineWidth, bottomRightBubble)
{
  let r = x + w;
  let b = y + h;
  if (bottomRightBubble) { // bottom-right bubble
    ctx.beginPath();
    ctx.strokeStyle = foregroundColor;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(x+radius, y);
    ctx.lineTo(x+radius/2, y-10);
    ctx.lineTo(x+radius*2, y);
    ctx.lineTo(r-radius, y);
    ctx.quadraticCurveTo(r, y, r, y+radius);
    ctx.lineTo(r, y+h-radius);
    ctx.quadraticCurveTo(r, b, r-radius, b);
    ctx.lineTo(x+radius, b);
    ctx.quadraticCurveTo(x, b, x, b-radius);
    ctx.lineTo(x, y+radius);
    ctx.quadraticCurveTo(x, y, x+radius, y);
    ctx.stroke();
  }
  else { // bottom-left bubble
    ctx.beginPath();
    ctx.strokeStyle = foregroundColor;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(r-radius*2, y);
    ctx.lineTo(r-radius/2, y-10);
    ctx.lineTo(r-radius, y);
    ctx.quadraticCurveTo(r, y, r, y+radius);
    ctx.lineTo(r, y+h-radius);
    ctx.quadraticCurveTo(r, b, r-radius, b);
    ctx.lineTo(x+radius, b);
    ctx.quadraticCurveTo(x, b, x, b-radius);
    ctx.lineTo(x, y+radius);
    ctx.quadraticCurveTo(x, y, x+radius, y);
    ctx.lineTo(r-radius*2, y);
    ctx.stroke();
  }
}

function displayPerf(perf, y_cell, backgroundColor, isPossible, starDisplayIfOptimal, globalPerfDisplayIfOptimal, optimalGlobalPerf, ctx) {

  let performance = Math.round(perf * 100.0) / 100.0; // 0.01 precision
  let optimalglobalperformance = Math.round(optimalGlobalPerf * 100.0) / 100.0; // 0.01 precision

  let x_cell;
  let cell_width;
  if (optimal_width > 0) {
    x_cell = attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2+nb_possible_codes_width;
    cell_width = optimal_width;
  }
  else { /* (nb of possible codes <-> perf switch) */
    x_cell = attempt_nb_width+(90*(nbColumns+1))/100+nbColumns*2;
    cell_width = nb_possible_codes_width;
  }

  let isPossible_str;
  if (tick_width > 0) {
    isPossible_str = "";
  }
  else {
    if (0 == isPossible) { // code is possible
      isPossible_str = "";
    }
    else { // code is not possible
      isPossible_str = "\u2009(" + isPossible + ")";
    }
  }

  if (performance == PerformanceUNKNOWN) {
    displayString("\u2234", x_cell, y_cell, cell_width,
                  lightGray, backgroundColor, ctx);
  }
  else if (performance != PerformanceNA) {
    if (performance == -1.00) { // useless code
      if (!displayString("  useless" + isPossible_str + "  ", x_cell, y_cell, cell_width,
                         redColor, backgroundColor, ctx, true, 0, true, 0)) {
        if (!displayString(" " + performance.toFixed(2).replaceAll(",",".") + isPossible_str + " ", x_cell, y_cell, cell_width,
                           redColor, backgroundColor, ctx, true, 0, true, 0)) {
          if (!displayString(performance.toFixed(1).replaceAll(",",".") + isPossible_str, x_cell, y_cell, cell_width,
                             redColor, backgroundColor, ctx, true, 0, true, 0)) {
            if (!displayString("  useless  ", x_cell, y_cell, cell_width,
                               redColor, backgroundColor, ctx, true, 0, true, 0)) {
              if (!displayString("\u2009" + performance.toFixed(2).replaceAll(",",".") + "\u2009", x_cell, y_cell, cell_width,
                                 redColor, backgroundColor, ctx, true, 0, true, 0)) {
                displayString(performance.toFixed(1).replaceAll(",","."), x_cell, y_cell, cell_width,
                              redColor, backgroundColor, ctx);
              }
            }
          }
        }
      }
    }
    else if (performance <= PerformanceVERYLOW) {
      if (!displayString("\u2009" + performance.toFixed(2).replaceAll(",",".") + "\u2009", x_cell, y_cell, cell_width,
                         redColor, backgroundColor, ctx, true, 0, true, 0)) {
        displayString(performance.toFixed(1).replaceAll(",","."), x_cell, y_cell, cell_width,
                      redColor, backgroundColor, ctx);
      }
    }
    else if (performance <= PerformanceLOW) {
      if (!displayString("\u2009" + performance.toFixed(2).replaceAll(",",".") + "\u2009", x_cell, y_cell, cell_width,
                         orangeColor, backgroundColor, ctx, true, 0, true, 0)) {
        displayString(performance.toFixed(1).replaceAll(",","."), x_cell, y_cell, cell_width,
                      orangeColor, backgroundColor, ctx);
      }
    }
    else if (performance < 0.00) {
      if (!displayString("\u2009" + performance.toFixed(2).replaceAll(",",".") + "\u2009", x_cell, y_cell, cell_width,
                         lightGray, backgroundColor, ctx, true, 0, true, 0)) {
        displayString(performance.toFixed(1).replaceAll(",","."), x_cell, y_cell, cell_width,
                      lightGray, backgroundColor, ctx);
      }
    }
    else if (performance == 0.00) { // optimal code (+/-0.005 precision)
      let starStr = "";
      if (starDisplayIfOptimal) {
        starStr = "\u2B50\u2009";
      }
      if ( (!globalPerfDisplayIfOptimal)
           || (!displayString("\u2009" + starStr + "optimal\u2009(" + optimalglobalperformance.toFixed(2).replaceAll(",",".") + ")\u2009", x_cell, y_cell, cell_width,
                              lightGray, backgroundColor, ctx, true, 0, true, 0)) ) {
        if (!displayString(" " + starStr + "optimal ", x_cell, y_cell, cell_width,
                           lightGray, backgroundColor, ctx, true, 0, true, 0)) {
          if (!displayString("\u2009" + starStr + performance.toFixed(2).replaceAll(",",".") + "\u2009", x_cell, y_cell, cell_width,
                             lightGray, backgroundColor, ctx, true, 0, true, 0)) {
            displayString(starStr + performance.toFixed(1).replaceAll(",","."), x_cell, y_cell, cell_width,
                         lightGray, backgroundColor, ctx);
          }
        }
      }
    }
    else { // > 0.00: an illogical code can be better than the optimal logical code(s)
      if (!displayString("\u2009" + "+" + performance.toFixed(2).replaceAll(",",".") + "!" + "\u2009", x_cell, y_cell, cell_width,
                         greenColor, backgroundColor, ctx, true, 0, true, 0)) {
        displayString("+" + performance.toFixed(1).replaceAll(",",".") + "!", x_cell, y_cell, cell_width,
                      greenColor, backgroundColor, ctx);
      }
    }
  }
  else {
    // Nothing is displayed in case of PerformanceNA (but the background is updated if needed)
    displayString("NA", x_cell, y_cell, cell_width,
                  lightGray, backgroundColor, ctx);
  }

}

function displayGUIError(GUIErrorStr, errStack) {

  // Error displayed in Javascript console
  // **************************************

  if (errorCnt < 50) {
    console.log("***** ERROR (" + version + ") *****: " + GUIErrorStr + " / " + errStack + "\n");
    console.log("Stack:");
    let stack = new Error().stack;
    console.log(stack);
    errorCnt++;
    console.log("\n");
  }

  // Alert
  // *****

  if (errorStr.length < 750) {
    errorStr += "***** ERROR (" + version + ") *****: " + GUIErrorStr + " / " + errStack + "\n";
    alert(errorStr + "\nSee Javascript console for more details (Ctrl+Shift+I in Chrome or Firefox)\n\n");
  }

}

// *************************************************************************
// Correct blurry text display which is inhertent to default canvas
// Code shared at https://jsfiddle.net/Ghislain999/2dw0bw6h/
// *************************************************************************

let subPixelText = function(ctx,text,x,y,fontHeight){
  let width = ctx.measureText(text).width + 12; // add some extra pixels
  let hOffset = Math.floor(fontHeight);
  let c = document.createElement("canvas");
  c.width  = width * 3; // scaling by 3
  c.height = fontHeight;
  c.ctx    = c.getContext("2d");
  c.ctx.font = ctx.font;
  c.ctx.globalAlpha = ctx.globalAlpha;
  c.ctx.fillStyle = ctx.fillStyle;
  c.ctx.fontAlign = "left";
  c.ctx.setTransform(3,0,0,1,0,0); // scaling by 3
  c.ctx.imageSmoothingEnabled = false;
  // c.ctx.mozImageSmoothingEnabled = false; // (obsolete)
  c.ctx.webkitImageSmoothingEnabled = false;
  c.ctx.msImageSmoothingEnabled = false;
  c.ctx.oImageSmoothingEnabled = false;
  // copy existing pixels to new canvas
  c.ctx.drawImage(ctx.canvas,x,y-hOffset,width,fontHeight,0,0,width,fontHeight);
  c.ctx.fillText(text,0,hOffset-3 /* (hardcoded to -3 for letters like 'p', 'g', ..., could be improved) */);    // draw the text 3 time the width
  // convert to sub pixels
  c.ctx.putImageData(subPixelBitmap(c.ctx.getImageData(0,0,width*3,fontHeight)), 0, 0);
  ctx.drawImage(c,0,0,width-1,fontHeight,x,y-hOffset,width-1,fontHeight);
}

let subPixelBitmap = function(imgData){
  let spR,spG,spB; // sub pixels
  let id,id1; // pixel indexes
  let w = imgData.width;
  let h = imgData.height;
  let d = imgData.data;
  let x,y;
  let ww = w*4;
  let ww4 = ww+4;
  for(y = 0; y < h; y+=1){ // (go through all y pixels)
    for(x = 0; x < w-2; x+=3){ // (go through all groups of 3 x pixels)
      let id = y*ww+x*4; // (4 consecutive values: id->red, id+1->green, id+2->blue, id+3->alpha)
      let output_id = y*ww+Math.floor(x/3)*4;
      spR = Math.round((d[id + 0] + d[id + 4] + d[id + 8])/3);
      spG = Math.round((d[id + 1] + d[id + 5] + d[id + 9])/3);
      spB = Math.round((d[id + 2] + d[id + 6] + d[id + 10])/3);
      // console.log(d[id+0], d[id+1], d[id+2] + '|' + d[id+5], d[id+6], d[id+7] + '|' + d[id+9], d[id+10], d[id+11]);
      d[output_id] = spR;
      d[output_id+1] = spG;
      d[output_id+2] = spB;
      d[output_id+3] = 255; // alpha is always set to 255
    }
  }
  return imgData;
}

let subPixelBitmap2D = function(imgData){
  let spR,spG,spB; // sub pixels
  let id,id1; // pixel indexes
  let w = imgData.width;
  let h = imgData.height;
  let d = imgData.data;
  let x,y;
  let ww = w*4;
  for(y = 0; y < h-2; y+=3){ // (go through all y pixels)
    for(x = 0; x < w-2; x+=3){ // (go through all groups of 3 x pixels)
      let id = y*ww+x*4; // (4 consecutive values: id->red, id+1->green, id+2->blue, id+3->alpha)
      let output_id = Math.floor(y/3)*ww+Math.floor(x/3)*4;
      spR = Math.round((d[id + 0] + d[id + 4] + d[id + 8] + d[id + ww + 0] + d[id + ww + 4] + d[id + ww + 8] + d[id + 2*ww + 0] + d[id + 2*ww + 4] + d[id + 2*ww + 8])/9);
      spG = Math.round((d[id + 1] + d[id + 5] + d[id + 9] + d[id + ww + 1] + d[id + ww + 5] + d[id + ww + 9] + d[id + 2*ww + 1] + d[id + 2*ww + 5] + d[id + 2*ww + 9])/9);
      spB = Math.round((d[id + 2] + d[id + 6] + d[id + 10] + d[id + ww + 2] + d[id + ww + 6] + d[id + ww + 10] + d[id + 2*ww + 2] + d[id + 2*ww + 6] + d[id + 2*ww + 10])/9);
      d[output_id] = spR;
      d[output_id+1] = spG;
      d[output_id+2] = spB;
      d[output_id+3] = 255; // alpha is always set to 255
    }
  }
  return imgData;
}

let subPixelText2D = function(ctx,text,x,y,fontHeight){
  let width = ctx.measureText(text).width + 12; // add some extra pixels
  let hOffset = Math.floor(fontHeight);

  let c = document.createElement("canvas");
  c.width  = width * 3; // scaling by 3
  c.height = fontHeight * 3; // scaling by 3
  c.ctx    = c.getContext("2d");
  c.ctx.font = ctx.font;
  c.ctx.globalAlpha = ctx.globalAlpha;
  c.ctx.fillStyle = ctx.fillStyle;
  c.ctx.fontAlign = "left";
  c.ctx.setTransform(3,0,0,3,0,0); // scaling by 3
  c.ctx.imageSmoothingEnabled = false;
  // c.ctx.mozImageSmoothingEnabled = false; // (obsolete)
  c.ctx.webkitImageSmoothingEnabled = false;
  c.ctx.msImageSmoothingEnabled = false;
  c.ctx.oImageSmoothingEnabled = false;
  // copy existing pixels to new canvas
  c.ctx.drawImage(ctx.canvas,x,y-hOffset,width,fontHeight,0,0,width,fontHeight);
  c.ctx.fillText(text,0,hOffset-3 /* (hardcoded to -3 for letters like 'p', 'g', ..., could be improved) */); // draw the text 3 time the width
  // convert to sub pixels
  c.ctx.putImageData(subPixelBitmap2D(c.ctx.getImageData(0,0,width*3,fontHeight*3)), 0, 0);
  ctx.drawImage(c,0,0,width-1,fontHeight,x,y-hOffset,width-1,fontHeight);
}

// *************************************************************************
// Draw graphic
// *************************************************************************

draw_graphic();

let canvas = document.getElementById("my_canvas");
canvas.addEventListener("click", mouseClick, false);
canvas.addEventListener("mousemove", mouseMove, false);
