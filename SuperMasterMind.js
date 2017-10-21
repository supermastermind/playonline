
// XXXs globally: .js, .html and google scripts / trace of right code to be suppressed

"use strict";

console.log("Running SuperMasterMind.js...");

// *************************************************************************
// *************************************************************************
// Global variables
// *************************************************************************
// *************************************************************************

// Main game variables
// *******************

let version = "v0.6";

let emptyColor = 0; // (0 is also the Java default table init value)
let nbMinColors = 6;
let nbMaxColors = 10;
let nbMinColumns = 3;
let nbMaxColumns = 7;
let overallNbMaxAttempts = 12;

let defaultNbColumns = 5; // classical Super Master Mind game
let defaultNbColors = 8; // classical Super Master Mind game
let defaultNbMaxAttempts = 12; // classical Super Master Mind game

let nbColumns = -1; // N.A.
let nbColors = -1; // N.A.
let nbMaxAttempts = -1; // N.A.

let codeHandler = null;

let showPossibleCodesMode = false;
let nbMinPossibleCodesShown = -1; // N.A.
let nbMaxPossibleCodesShown = -1; // N.A.
let nbPossibleCodesShown = -1; // N.A. (only valid if showPossibleCodesMode is true)
let currentPossibleCodeShown = -1; // N.A. (only valid if showPossibleCodesMode is true)

let currentCode = -1;
let codesPlayed;
let marks;
let nbOfPossibleCodes;
let colorsFoundCodes;
let minNbColorsTables;
let maxNbColorsTables;
let performanceIndicators;
let performanceIndicatorsEvaluatedSystematically;
let possibleCodesLists;
let possibleCodesListsSizes;
let PerformanceIndicatorNA = -3.00;
let PerformanceIndicatorUNKNOWN = -2.00;
let equivalenceClassIdUNKNOWN = -100;
let nbOfStatsFilled = 0;
let currentAttemptNumber = 1;
let gameWon = false;
let nbGamesWonWithoutHelpAtAll = 0;
let secretCode = -1;
let secretCodeRevealed = -1;
let game_cnt = 0;
let startTime = -1; // N.A.
let stopTime = -1; // N.A.
let newGameEvent = true;
let playerWasHelpedSignificantly = false;
let playerWasHelpedSlightly = false;
let hintHasAlreadyBlinked = false;

let errorStr = "";
let errorCnt = 0;

// GUI variables
// *************

let newGameButtonIniName = document.getElementById("newGameButton").value;
let nbColumnsRadioObjectIniNames = new Array(nbMaxColumns-nbMinColumns+1);
for (let i = nbMinColumns; i <= nbMaxColumns; i++) {
  nbColumnsRadioObjectIniNames[i-nbMinColumns] = document.getElementById("columnslabel_" + i).innerHTML;
}
let resetCurrentCodeButtonIniName = document.getElementById("resetCurrentCodeButton").value;
let playRandomCodeButtonIniName = document.getElementById("playRandomCodeButton").value;
let playPossibleCodeButtonIniName = document.getElementById("playPossibleCodeButton").value;
let revealSecretColorButtonIniName = document.getElementById("revealSecretColorButton").value;
let showPossibleCodesButtonIniName = document.getElementById("showPossibleCodesButton").value;

let tableIniWidth = document.getElementById("my_table").style.width;
let tableIniLeft = document.getElementById("my_table").style.left;
let tableIniHeight = document.getElementById("my_table").style.height;
let tableIniTop = document.getElementById("my_table").style.top;
let tableIniBorder = document.getElementById("my_table").style.border;
let tableIniBorderRadius = document.getElementById("my_table").style["border-radius"];
let myCanvasIniWidth = document.getElementById("my_canvas").style.width;
let myCanvasIniHeight = document.getElementById("my_canvas").style.height;

let CompressedDisplayMode = false;
let CompressedDisplayMode_compressWidth = 400;
let CompressedDisplayMode_uncompressWidth = 900;
let mobileMode = false;

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

let backgroundColor_2 = document.getElementById("my_table").style.backgroundColor;
let backgroundColor_3 = "#D0D0D0";
let lightGray = "#909090"; // (shall be significantly darker than backgroundColor_2)
let darkGray = "#000000"; // (shall be significantly darker than lightGray)
let highlightColor = "#FFFF00"; // Yellow

// Fonts
// *****

let fontFamily = "Verdana";
let defaultFont = "10px " + fontFamily;
let min_font_size = 10;
let max_font_size = 30;
let basic_font = defaultFont;
let basic_bold_font = defaultFont;
let basic_bold_italic_font = defaultFont;
let small_basic_font = defaultFont;
let small_bold_font = defaultFont;
let small_italic_font = defaultFont;
let very_small_italic_font = defaultFont;
let medium_basic_font = defaultFont;
let medium_bold_font = defaultFont;
let medium_bold_italic_font = defaultFont;
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
// Code handler class
// *************************************************************************

class CodeHandler {

  constructor(nbColumns_p, nbColors_p) {
    if ( (nbColumns_p < Math.max(nbMinColumns,3)) || (nbColumns_p > Math.min(nbMaxColumns,7)) /* 3 and 7 is hardcoded in some methods of this class for better performances */ ) {
      throw new Error("CodeHandler: invalid nb of columns (" + nbColumns_p + ")");
    }
    this.nbColumns = nbColumns_p;
    this.nbColors = nbColors_p;

    this.code1_colors = new Array(nbMaxColumns);
    this.code2_colors = new Array(nbMaxColumns);
    this.colors_int = new Array(nbMaxColumns);
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
           && (color != emptyColor) ) {
        return false;
      }
    }
    return true;
  }

  isFullAndValid(code) {
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      if ( (color < 1) || (color > this.nbColors)
           || (color == emptyColor) ) {
        return false;
      }
    }
    return true;
  }

  nbEmptyColors(code) {
    let cnt = 0;
    for (let col = 0; col < this.nbColumns; col++) {
      if (this.getColor(code, col+1) == emptyColor) {
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
      if (this.getColor(code, col+1) == emptyColor) {
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

    // The below operations are switch/cased for better performances
    switch (this.nbColumns) {

      case 3:
        for (col1 = 0; col1 < 3; col1++) {
          if (this.code1_colors[col1] == this.code2_colors[col1]) {
            nbBlacks++;
          }
          else {
            for (col2 = 0; col2 < 3; col2++) {
              if ((this.code1_colors[col1] == this.code2_colors[col2]) && (this.code1_colors[col2] != this.code2_colors[col2]) && this.colors_int[col2]) {
                this.colors_int[col2] = false;
                nbWhites++;
                break;
              }
            }
          }
        }
        break;

      case 4:
        for (col1 = 0; col1 < 4; col1++) {
          if (this.code1_colors[col1] == this.code2_colors[col1]) {
            nbBlacks++;
          }
          else {
            for (col2 = 0; col2 < 4; col2++) {
              if ((this.code1_colors[col1] == this.code2_colors[col2]) && (this.code1_colors[col2] != this.code2_colors[col2]) && this.colors_int[col2]) {
                this.colors_int[col2] = false;
                nbWhites++;
                break;
              }
            }
          }
        }
        break;

      case 5:
        for (col1 = 0; col1 < 5; col1++) {
          if (this.code1_colors[col1] == this.code2_colors[col1]) {
            nbBlacks++;
          }
          else {
            for (col2 = 0; col2 < 5; col2++) {
              if ((this.code1_colors[col1] == this.code2_colors[col2]) && (this.code1_colors[col2] != this.code2_colors[col2]) && this.colors_int[col2]) {
                this.colors_int[col2] = false;
                nbWhites++;
                break;
              }
            }
          }
        }
        break;

      case 6:
        for (col1 = 0; col1 < 6; col1++) {
          if (this.code1_colors[col1] == this.code2_colors[col1]) {
            nbBlacks++;
          }
          else {
            for (col2 = 0; col2 < 6; col2++) {
              if ((this.code1_colors[col1] == this.code2_colors[col2]) && (this.code1_colors[col2] != this.code2_colors[col2]) && this.colors_int[col2]) {
                this.colors_int[col2] = false;
                nbWhites++;
                break;
              }
            }
          }
        }
        break;

      case 7:
        for (col1 = 0; col1 < 7; col1++) {
          if (this.code1_colors[col1] == this.code2_colors[col1]) {
            nbBlacks++;
          }
          else {
            for (col2 = 0; col2 < 7; col2++) {
              if ((this.code1_colors[col1] == this.code2_colors[col2]) && (this.code1_colors[col2] != this.code2_colors[col2]) && this.colors_int[col2]) {
                this.colors_int[col2] = false;
                nbWhites++;
                break;
              }
            }
          }
        }
        break;

      default:
        throw new Error("CodeHandler: fillMark (" + this.nbColumns + ")");

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

}

// *************************************************************************
// *************************************************************************
// Functions
// *************************************************************************
// *************************************************************************

// ***********************
// Event-related functions
// ***********************

function newGameButtonClick(nbColumns) {
  if ( (nbColumns == 0) // ("NEW GAME" button event)
       || (currentAttemptNumber <= 1) ) { // (radio buttons events)
    newGameEvent = true;
    draw_graphic();
  }
}

function resetCurrentCodeButtonClick() {
  if (!document.getElementById("resetCurrentCodeButton").disabled) {
    currentCode = secretCodeRevealed;
    draw_graphic();
  }
}

function playRandomCodeButtonClick() {
  if (!document.getElementById("playRandomCodeButton").disabled) {
    currentCode = codeHandler.createRandomCode(nbColumns);
    draw_graphic();
  }
}

function playPossibleCodeButtonClick() {
  if (!document.getElementById("playPossibleCodeButton").disabled) {
    if (currentAttemptNumber > 1) {
      playerWasHelpedSignificantly = true;
    }
    currentCode = possibleCodesLists[nbOfStatsFilled-1][0].code; // select first code of the list
    draw_graphic();
  }
}

function revealSecretColorButtonClick() {
  if ( (!document.getElementById("revealSecretColorButton").disabled)
       && gameOnGoing()
       && (secretCode != -1) && (secretCodeRevealed != -1) ) {
    let nbEmptyColors = codeHandler.nbEmptyColors(secretCodeRevealed);
    if (nbEmptyColors <= 1) {
      displayGUIError("too many revealed colors", new Error().stack);
    }
    else if ((nbColumns-nbEmptyColors+1) < (nbColumns+1)/2) {
      playerWasHelpedSlightly = true;
      let revealedColorIdx = Math.floor(Math.random() * nbEmptyColors);
      secretCodeRevealed = codeHandler.replaceEmptyColor(secretCodeRevealed, revealedColorIdx, secretCode);
      currentCode = secretCodeRevealed;
      main_graph_update_needed = true;
      draw_graphic();
    }
  }
}

function showPossibleCodesButtonClick() {
  if (!document.getElementById("showPossibleCodesButton").disabled) {
    showPossibleCodesMode = !showPossibleCodesMode;
    if (!showPossibleCodesMode) {
      nbPossibleCodesShown = -1;
      currentPossibleCodeShown = -1;
    }
    else {
      nbPossibleCodesShown = Math.max(nbMinPossibleCodesShown, Math.min(nbMaxPossibleCodesShown, 20 + (nbMaxAttempts+1 - currentAttemptNumber)));
      currentPossibleCodeShown = 1;
    }
    updateGameSizes();
  }
}

function mouseClick(e) {
  let event_x_min, event_x_max, event_y_min, event_y_max;
  let rect = canvas.getBoundingClientRect();  
  let mouse_x = e.clientX - rect.left;
  let mouse_y = e.clientY - rect.top;

  // ***************
  // Color selection
  // ***************

  if (gameOnGoing()) {

    event_x_min = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100));
    event_x_max = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2));
    event_y_min = get_y_pixel(y_min+y_step*(nbMaxAttempts+3+nbColors));
    event_y_max = get_y_pixel(y_min+(currentAttemptNumber-1)*y_step);

    if ( (mouse_x > event_x_min) && (mouse_x < event_x_max)
         && (mouse_y > event_y_min) && (mouse_y < event_y_max) ) {

      try {
        for (let column = 0; column < nbColumns; column++) {
          let x_0, y_0, x_1, y_1;
          x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+column*2));
          x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+(column+1)*2));
          if ((mouse_x > x_0) && (mouse_x < x_1)) {
            let colorSelected = false;
            for (let color = 0; color < nbColors; color++) {
              y_0 = get_y_pixel(y_min+y_step*(nbMaxAttempts+3+(color+1)));
              y_1 = get_y_pixel(y_min+y_step*(nbMaxAttempts+3+color));
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

  /* else if ((!gameOnGoing()) && allPossibleCodesFilled()) {
    if (superMasterMind.showPossibleCodesComboBox.getSelectedIndex() == 0) {
      event_y_min = get_y_pixel(y_min+nbMaxAttempts*y_step);
    }
    else {
      event_y_min = get_y_pixel(y_min+(currentAttemptNumber-1)*y_step);
    }
    event_y_max = get_y_pixel(y_min+y_step*0);

    if ( (mouse_y > event_y_min) && (mouse_y < event_y_max) ) {
      let attempt_found = false;
      for (let idx = 0; idx < currentAttemptNumber-1; idx++) {
        let y_0 = get_y_pixel(y_min+y_step*(idx+1));
        let y_1 = get_y_pixel(y_min+y_step*(idx));
        if ((mouse_y > y_0) && (mouse_y < y_1)) {
          if (superMasterMind.showPossibleCodesComboBox.isEnabled()) {
            superMasterMind.showPossibleCodesComboBox.setSelectedIndex((superMasterMind.showPossibleCodesComboBox.getItemCount() - (idx+1)));
          }
          attempt_found = true;
          break;
        }
      }
      if (!attempt_found) {
        superMasterMind.showPossibleCodesComboBox.setSelectedIndex((superMasterMind.showPossibleCodesComboBox.getItemCount() - ((currentAttemptNumber-2)+1)));
      }
    }
    else {
      if (superMasterMind.showPossibleCodesComboBox.isEnabled() && (superMasterMind.showPossibleCodesComboBox.getSelectedIndex() > 0)) {
        superMasterMind.showPossibleCodesComboBox.setSelectedIndex(0);
      }
    }
  } */
}

function playAColor(color, column) {
  if (gameOnGoing()) {
    currentCode = codeHandler.setColor(currentCode, color, column);
    draw_graphic();
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

  x_step = (x_max - x_min) / (2 // attempt number
                              +(90*(nbColumns+1))/100 // mark
                              +nbColumns*2 // code
                              +((nbColumns>=7)?5:4) // number of possible codes
                              +4 // optimal
                              +3); // OK/NOK
  if (!showPossibleCodesMode) {
    y_step = (y_max - y_min) / (nbMaxAttempts // max number of attempts
                                +1 // margin
                                +1 // secret code
                                +1 // margin
                                +nbColors); // color selection
  }
  else {
    if ( !((!gameOnGoing()) && allPossibleCodesFilled()) || (currentAttemptNumber <= 0) ) {
      displayGUIError("invalid context for updateGameSizes(): " + gameOnGoing() + ", " + allPossibleCodesFilled(), new Error().stack);
    }
    y_step = (y_max - y_min) / (currentAttemptNumber-1 // number of attempts reached at end of game
                                +1 // margin
                                +nbPossibleCodesShown); // possible codes
  }

}

function resetGameAttributes(nbColumnsSelected) {

  let i;

  main_graph_update_needed = true;
  codeHandler = null;

  nbColumns = nbColumnsSelected;
  switch (nbColumns) {
    case 3:
      nbColors = Math.max(nbMinColors, defaultNbColors - 2);
      nbMaxAttempts = defaultNbMaxAttempts - 4;
      break;
    case 4:
      nbColors = Math.max(nbMinColors, defaultNbColors - 1);
      nbMaxAttempts = defaultNbMaxAttempts - 2;
      break;
    case 5: // defaultNbColumns
      nbColors = defaultNbColors;
      nbMaxAttempts = defaultNbMaxAttempts;
      break;
    case 6:
      nbColors = Math.min(nbMaxColors, defaultNbColors + 1);
      nbMaxAttempts = defaultNbMaxAttempts;
      break;
    case 7:
      nbColors = Math.min(nbMaxColors, defaultNbColors + 2);
      nbMaxAttempts = defaultNbMaxAttempts;
      break;
    default:
      throw new Error("invalid selection of number of columns: " + nbColumns + " (#1)");
  }
  if ( (nbMaxAttempts < 4) || (nbMaxAttempts > overallNbMaxAttempts) ) {
    throw new Error("invalid nbMaxAttempts: " + nbMaxAttempts);
  }

  codeHandler = new CodeHandler(nbColumns, nbColors);

  showPossibleCodesMode = false;
  nbMinPossibleCodesShown = nbColumns+nbColors+4;
  nbMaxPossibleCodesShown = 30;
  nbPossibleCodesShown = -1;
  currentPossibleCodeShown = -1;

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
  performanceIndicators = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    performanceIndicators = PerformanceIndicatorNA;
  }
  performanceIndicatorsEvaluatedSystematically = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    performanceIndicatorsEvaluatedSystematically[i] = false;
  }

  possibleCodesLists = new Array(nbMaxAttempts);
  possibleCodesListsSizes = new Array(nbMaxAttempts);
  for (i = 0; i < nbMaxAttempts; i++) {
    possibleCodesLists[i] = new Array(nbMaxPossibleCodesShown);
    possibleCodesListsSizes[i] = 0;
  }
  nbOfStatsFilled = 0;
  currentAttemptNumber = 1;
  gameWon = false;
  secretCode = codeHandler.createRandomCode();
  // secretCode = 0x07777777;
  // XXX console.log("Secret code: " + codeHandler.codeToString(secretCode));  
  secretCodeRevealed = 0;
  
  game_cnt++;
  if (game_cnt > 1000000) {
    game_cnt = 0;
  }
  
  newGameEvent = false;
  playerWasHelpedSignificantly = false;
  playerWasHelpedSlightly = false;
  hintHasAlreadyBlinked = false;

  errorStr = "";
  errorCnt = 0;

  updateGameSizes();

}

function checkArraySizes() {
  if (codesPlayed.length > nbMaxAttempts) {displayGUIError("array is wider than expected", new Error().stack);}
  if (marks.length > nbMaxAttempts) {displayGUIError("array is wider than expected", new Error().stack);}
  if (nbOfPossibleCodes.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  if (colorsFoundCodes.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  if (minNbColorsTables.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  for (let i = 0; i < nbMaxAttempts; i++) {
    if (minNbColorsTables[i].length > nbColors+1) {displayGUIError("array is wider than expected", new Error().stack);}
  }
  if (maxNbColorsTables.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  for (let i = 0; i < nbMaxAttempts; i++) {
    if (maxNbColorsTables[i].length > nbColors+1){displayGUIError("array is wider than expected", new Error().stack);}
  }
  if (performanceIndicators.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  if (performanceIndicatorsEvaluatedSystematically.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  if (possibleCodesLists.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  if (possibleCodesListsSizes.length > nbMaxAttempts){displayGUIError("array is wider than expected", new Error().stack);}
  for (let i = 0; i < nbMaxAttempts; i++) {
    if (possibleCodesLists[i].length > nbMaxPossibleCodesShown){displayGUIError("array is wider than expected", new Error().stack);}
  }
}

function gameOnGoing() {
  return ((!gameWon) && (currentAttemptNumber <= nbMaxAttempts));
}

function allPerformanceIndicatorsFilled() {
  return ( // game on-going and all performance indicators filled
            (gameOnGoing() && (currentAttemptNumber == nbOfStatsFilled) && (nbOfStatsFilled >= 1) && (performanceIndicators[nbOfStatsFilled-1] != PerformanceIndicatorNA))
            ||
            // game over and all performance indicators filled
            ((!gameOnGoing()) && (currentAttemptNumber-1 == nbOfStatsFilled) && (nbOfStatsFilled >= 1) && (performanceIndicators[nbOfStatsFilled-1] != PerformanceIndicatorNA)) );
}

function allPossibleCodesFilled() {
  return ( // game on-going and all stats filled
            (gameOnGoing() && (currentAttemptNumber == nbOfStatsFilled) && (nbOfStatsFilled >= 1) && (possibleCodesListsSizes[nbOfStatsFilled-1] > 0))
            ||
            // game over and all stats filled
            ((!gameOnGoing()) && (currentAttemptNumber-1 == nbOfStatsFilled) && (nbOfStatsFilled >= 1) && (possibleCodesListsSizes[nbOfStatsFilled-1] > 0)) );
}

function isAttemptPossible(attempt_nb) { // (returns 0 if the attempt_nb th code is possible, returns the first attempt number with which there is a contradiction otherwise)
  if ( (attempt_nb <= 0) || (attempt_nb >= currentAttemptNumber) ) {
    displayGUIError("invalid attempt nb (" + attempt_nb + ")", new Error().stack);
    return 1;
  }
  let mark_tmp = {nbBlacks:0, nbWhites:0};
  for (let i = 1; i <= attempt_nb-1; i++) { // go through all codes previously played
    codeHandler.fillMark(codesPlayed[attempt_nb-1], codesPlayed[i-1], mark_tmp);
    if (!codeHandler.marksEqual(mark_tmp, marks[i-1])) {
      return i;
    }
  }
  return 0;
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

function draw_graphic() {
  draw_graphic_bis();
  draw_graphic_bis(); // sometimes improves the display  - not perfect but best solution found
}

function draw_graphic_bis() {

  let canvas = document.getElementById("my_canvas");
  let ctx = canvas.getContext("2d");

  let res;
  let nbMaxAttemptsToDisplay = nbMaxAttempts;
  let draw_exception = false;
  
  let timeStr = "";
  let game_won_without_big_help = false;
  let score = -1.0;
  let nbColorsRevealed = 0;

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
            CompressedDisplayMode = false;
          }
        }
        else if (width <= CompressedDisplayMode_compressWidth) {
            CompressedDisplayMode = true;
        }
        mobileMode = false;        
        if ( (/Mobi/i.test(navigator.userAgent)) || (/Android/i.test(navigator.userAgent)) // (mobile device check 1/2)
             || (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i.test(navigator.userAgent)) ) { // (mobile device check 2/2)
          CompressedDisplayMode = true;
          mobileMode = true;
        }    
        if (mobileMode && (/Android/i.test(navigator.userAgent))) {  // It is not possible to change the \u2714 and \u2716 character color on Android/Chrome      
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
            document.getElementById("columnslabel_" + i).innerHTML = nbColumnsRadioObjectIniNames[i-nbMinColumns].replace(" " + i + " columns", i);;
          }
          document.getElementById("resetCurrentCodeButton").value = crossChar; // (cross)
          document.getElementById("playRandomCodeButton").value = "R";
          document.getElementById("playPossibleCodeButton").value = "P";
          document.getElementById("revealSecretColorButton").value = "?";
          document.getElementById("showPossibleCodesButton").value = "\uFF0A";
          document.getElementById("my_table").style.width = "100%";
          document.getElementById("my_table").style.left = "0%";
          document.getElementById("my_table").style.height = "100%";
          document.getElementById("my_table").style.top = "0%";
          document.getElementById("my_table").style.border = "none";
          document.getElementById("my_table").style["border-radius"] = "0%";
          if (mobileMode) { // (The below settings can lead to issues when resizing windows on PCs, in particular with Firefox)
            document.getElementById("my_canvas").style.width = "99%";
            document.getElementById("my_canvas").style.height = "99%";          
          }
          
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
          document.getElementById("playPossibleCodeButton").value = playPossibleCodeButtonIniName;
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
        else if (height >= 1100) {
          for (let i = 0; i < allButtons.length; i ++) {
            allButtons[i].style.fontSize = "21px";
          }
          for (let i = 0; i < allRadioButtons.length; i ++) {
            allRadioButtons[i].style.fontSize = "21px";
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

    } while (resize_detected && (resize_cnt <= 50)); // several iterative calls are necessary to redraw the canvas with proper width and height on window resize

    let nbColumnsSelected = getNbColumnsSelected();
    if ( (nbColumnsSelected < 0) || (nbColumnsSelected > nbMaxColumns) ) { // (error case)
      displayGUIError("inconsistent number of columns selected: " + nbColumnsSelected, new Error().stack);
      nbColumnsSelected = defaultNbColumns;
    }
    if ( newGameEvent
         || (nbColumns != nbColumnsSelected) ) { // Check event "column number change"
      resetGameAttributes(nbColumnsSelected);
    }
    if (codeHandler.getNbColumns() != nbColumns) {
      throw new Error("invalid nbColumns handling");
    }

    if ((currentAttemptNumber <= 0) || (currentAttemptNumber > nbMaxAttempts+1)) { // Defensive check that currentAttemptNumber is valid
      displayGUIError("inconsistent currentAttemptNumber value: " + currentAttemptNumber, new Error().stack);
    }
    else {
      if ( gameOnGoing() // playing phase
           && codeHandler.isFullAndValid(currentCode) ) { // New code submitted
        if (1 == currentAttemptNumber) {
          startTime = (new Date()).getTime(); // time in milliseconds
          stopTime = startTime;
          try {
            if (typeof(Storage) !== 'undefined') {  
              if (localStorage.nbgamesstarted) {
                localStorage.nbgamesstarted = Number(localStorage.nbgamesstarted) + 1;
              }
            }
          }
          catch (err) {}          
        }
        codesPlayed[currentAttemptNumber-1] = currentCode;
        codeHandler.fillMark(secretCode, currentCode, marks[currentAttemptNumber-1]);
        if (marks[currentAttemptNumber-1].nbBlacks == nbColumns) { // game over (game won)
          stopTime = (new Date()).getTime(); // time in milliseconds
          currentAttemptNumber++;
          currentCode = -1;
          gameWon = true;
          if ((!playerWasHelpedSignificantly) && (!playerWasHelpedSlightly)) {
            nbGamesWonWithoutHelpAtAll++;            
          }
          if (!playerWasHelpedSignificantly) {
            game_won_without_big_help = true;
          }
        }
        else {
          currentAttemptNumber++;
          if (currentAttemptNumber == nbMaxAttempts+1) { // game over (game lost)
            currentCode = -1;
            stopTime = (new Date()).getTime(); // time in milliseconds
          }
          else {
            currentCode = secretCodeRevealed;
          }
        }
        main_graph_update_needed = true;
      }
    }

    // ***************
    // Full repainting
    // ***************

    nbMaxAttemptsToDisplay = ((!showPossibleCodesMode) ? nbMaxAttempts : currentAttemptNumber-1);

    // XXX optimized display event to be tested!
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

      small_basic_font = Math.floor((3*min_font_size+font_size)/4) + "px " + fontFamily;
      small_bold_font = "bold " + Math.floor((3*min_font_size+font_size)/4) + "px " + fontFamily;
      small_italic_font = "italic " + Math.floor((3*min_font_size+font_size)/4) + "px " + fontFamily;
      very_small_italic_font = "italic " + Math.floor((9*min_font_size+font_size)/10) + "px " + fontFamily;

      medium_basic_font = Math.floor((2*min_font_size+font_size)/3) + "px " + fontFamily;
      medium_bold_font = "bold " + Math.floor((2*min_font_size+font_size)/3) + "px " + fontFamily;
      medium_bold_italic_font = "bold italic " + Math.floor((2*min_font_size+font_size)/3) + "px " + fontFamily;

      error_font = font_size + "px " + fontFamily;

      // Draw main game table
      // ********************
                   
      x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100));
      y_0 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2));
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
        drawLine(ctx, x_0, y_0, x_1, y_1);
        if (attempt < nbMaxAttemptsToDisplay) {
          let backgroundColor = backgroundColor_2;
          if (attempt+1 == currentPossibleCodeShown) {
            backgroundColor = highlightColor;
          }
          if (gameWon) {
            if (attempt+1 == currentAttemptNumber-1) {
              displayString(attempt+1, 0, attempt, 2,
                            darkGray, backgroundColor, ctx, true, 0, true, 0);
            }
            else {
              displayString(attempt+1, 0, attempt, 2,
                            lightGray, backgroundColor, ctx, true, 0, true, 0);
            }
          }
          else if (attempt+1 == currentAttemptNumber) {
            if (attempt+1 == nbMaxAttempts) {
              displayString(attempt+1, 0, attempt, 2,
                            redColor, backgroundColor, ctx, true, 0, true, 0);
            }
            else if (attempt+2 == nbMaxAttempts) {
              displayString(attempt+1, 0, attempt, 2,
                            orangeColor, backgroundColor, ctx, true, 0, true, 0);
            }
            else {
              displayString(attempt+1, 0, attempt, 2,
                            darkGray, backgroundColor, ctx, true, 0, true, 0);
            }
          }
          else {
            displayString(attempt+1, 0, attempt, 2,
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

      x_0 = get_x_pixel(x_min+x_step*2);
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*2);
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      for (let col = 0; col <= nbColumns; col++) {
        x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
        y_0 = get_y_pixel(y_min);
        x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
        y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
        drawLine(ctx, x_0, y_0, x_1, y_1);
      }

      x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)));
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)));
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4));
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4));
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4+3));
      y_0 = get_y_pixel(y_min);
      x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4+3));
      y_1 = get_y_pixel(y_min+y_step*nbMaxAttemptsToDisplay);
      drawLine(ctx, x_0, y_0, x_1, y_1);

      // Draw codes played and associated marks
      // **************************************

      ctx.font = basic_bold_font;
      for (let i = 1 ; i < currentAttemptNumber; i++) {

        displayCode(codesPlayed[i-1], i-1, ctx);

        let backgroundColor = backgroundColor_2;
        if (i == currentPossibleCodeShown) {
          backgroundColor = highlightColor;
        }
        displayMark(marks[i-1], i-1, backgroundColor, ctx);

      }

      // Draw stats
      // **********

      let nbMaxHintsDisplayed = 2;
      for (let i = 1 ; i <= nbOfStatsFilled; i++) {

        let backgroundColor = backgroundColor_2;
        if (i == currentPossibleCodeShown) {
          backgroundColor = highlightColor;
        }

        let statsColor;
        ctx.font = medium_bold_font;
        if ((i == currentAttemptNumber) || (gameWon && (i == currentAttemptNumber-1))) {
          statsColor = darkGray;
        }
        else {
          statsColor = lightGray;
        }
        displayString(nbOfPossibleCodes[i-1], 2+(90*(nbColumns+1))/100+nbColumns*2, i-1, ((nbColumns>=7)?5:4),
                      statsColor, backgroundColor, ctx);
        if (i < currentAttemptNumber) {
          if ( (!gameOnGoing()) || (i <= nbMaxHintsDisplayed)
               || performanceIndicatorsEvaluatedSystematically[i-1]
               || (nbColumns < defaultNbColumns) /* (easy games) */ ) {
            displayPerf(performanceIndicators[i-1], i-1, backgroundColor, ctx);
          }
          else {
            displayString("...", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), i-1, 4,
                          lightGray, backgroundColor, ctx);
          }
        }
      }

      // Draw whether codes are possible or not
      // **************************************

      ctx.font = basic_bold_font;
      for (let i = 1 ; i < currentAttemptNumber; i++) {

        let backgroundColor = backgroundColor_2;
        if (i == currentPossibleCodeShown) {
          backgroundColor = highlightColor;
        }

        let isPossible = isAttemptPossible(i);
        if ( gameOnGoing() && (i > nbMaxHintsDisplayed)
             && (performanceIndicators[i-1] != -1.0 /* (useless code) */)
             && (nbColumns >= defaultNbColumns) /* (easy games) */ ) {
          displayString("...", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4, i-1, 3,
                        lightGray, backgroundColor, ctx);
        }
        else if (0 == isPossible) { // code is possible
          if (performanceIndicators[i-1] == -1.0 /* (useless code) */) {
            displayGUIError("useless code inconsistency", false);
          }
          displayString(tickChar, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4, i-1, 3,
                        greenColor, backgroundColor, ctx);
        }
        else { // code is not possible
          res = false;
          if (i > 2) {
            res = displayString(crossChar + " " + isPossible + " ", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4, i-1, 3,
                                redColor, backgroundColor, ctx, true, 0, true, 0);
          }
          if (!res) {
            displayString(crossChar, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4, i-1, 3,
                          redColor, backgroundColor, ctx);
          }
        }

      }

      let HintsThreshold = 5;
      if (!showPossibleCodesMode) {

        // Display game version
        // ********************

        ctx.font = very_small_italic_font;
        displayString(version, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4+3-5, nbMaxAttemptsToDisplay+3+nbColors, 5,
                      lightGray, backgroundColor_2, ctx, true, 2, true, 1, true /* (ignoreRanges) */);

        // Display column headers
        // **********************

        // Note: when showPossibleCodesMode is true, this line is used for displayGUIError()
        ctx.font = medium_bold_font;
        if ((!gameOnGoing()) && allPerformanceIndicatorsFilled()) {
          let sum = 0.0;
          let approx = false;
          for (let i = 1 ; i <= nbOfStatsFilled; i++) {
            if (performanceIndicators[i-1] == PerformanceIndicatorNA) {
              displayGUIError("performanceIndicatorNA inconsistency (" + i + ")", false);
            }
            else if (performanceIndicators[i-1] == PerformanceIndicatorUNKNOWN) {
              approx = true;
            }
            else {
              sum = sum + performanceIndicators[i-1];
            }
          }
          let str1, str1bis, str2;
          let sum_rounded = Math.round(sum * 100.0) / 100.0;
          if (!approx) {
            str1 = ":";
            str1bis = "";
          }
          else {
            str1 = "";
            str1bis = "\u2264\u200A"; // ("<= ")
          }
          if (sum_rounded > 0.0) {
            str2 = "+" + sum_rounded.toFixed(2) + "!"; // 2 decimal figures
          }
          else {
            str2 = sum_rounded.toFixed(2); // 2 decimal figures
          }
          if (display2Strings("Total" + str1, str1bis + str2, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), nbMaxAttemptsToDisplay, 4,
                              darkGray, backgroundColor_2, ctx, 0, true)) {
            display2Strings("Number", "of codes", 2+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay, ((nbColumns>=7)?5:4),
                            darkGray, backgroundColor_2, ctx, 0, true);
            displayString(tickChar + " / " + crossChar, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4, nbMaxAttemptsToDisplay, 3,
                          darkGray, backgroundColor_2, ctx, true, 0, true, 1);
          }
        }
        else {
          if (display2Strings("0: optimal", "-1: useless", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), nbMaxAttemptsToDisplay, 4,
                              lightGray, backgroundColor_2, ctx, 0, true)) {
            display2Strings("Number", "of codes", 2+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay, ((nbColumns>=7)?5:4),
                            lightGray, backgroundColor_2, ctx, 0, true);
            displayString(tickChar + " / " + crossChar, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4, nbMaxAttemptsToDisplay, 3,
                          lightGray, backgroundColor_2, ctx, true, 0, true, 1);
          }
        }

        // Draw secret code
        // ****************

        ctx.fillStyle = darkGray;
        for (let col = 0; col <= nbColumns; col++) {
          x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+1));
          x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+2));
          drawLine(ctx, x_0, y_0, x_1, y_1);
        }

        x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100));
        y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+1));
        x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2));
        y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+1));
        drawLine(ctx, x_0, y_0, x_1, y_1);

        x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100));
        y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+2));
        x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2));
        y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+2));
        drawLine(ctx, x_0, y_0, x_1, y_1);

        ctx.font = basic_bold_font;
        displayString("Secret code  ", 0, nbMaxAttemptsToDisplay+1, 2+(90*(nbColumns+1))/100,
                      darkGray, backgroundColor_2, ctx, true, 2, true, 0);
        if (gameOnGoing()) {
          displayCode(secretCodeRevealed, nbMaxAttemptsToDisplay+1, ctx, true);
        }
        else { // game over
          displayCode(secretCode, nbMaxAttemptsToDisplay+1, ctx);
        }

        // Display game over status
        // ************************

        if (!gameOnGoing()) {

          let totalTimeInSeconds = Math.floor((stopTime - startTime)/1000);         
         
          let timeInSeconds = totalTimeInSeconds;          
          let timeInMinutes = Math.floor(timeInSeconds/60);
          timeInSeconds = timeInSeconds - timeInMinutes*60; // (range: [0;59])
          if (timeInMinutes != 0) {
            timeInSeconds = Math.floor(timeInSeconds/10.0)*10;
            if (timeInMinutes >= 30) {
              timeStr = timeInMinutes + " min";
            }
            else if (timeInSeconds != 0) {
              timeStr = timeInMinutes + " min " + timeInSeconds + " sec";
            }
            else {
              timeStr = timeInMinutes + " min";
            }
          }
          else {
            timeStr = timeInSeconds + " sec";
          }

          if (gameWon) { // game won
            let victoryStr;         
            let nb_attempts_for_max_score;
            let time_in_seconds_corresponding_to_one_attempt_in_score;
            let multiply_factor;
            switch (nbColumns) {
              case 3:
                nb_attempts_for_max_score = 2;
                time_in_seconds_corresponding_to_one_attempt_in_score = 90.0; // (time corresponding to 2 attempts: 3 min)
                multiply_factor = 0.30;
                break;
              case 4:
                nb_attempts_for_max_score = 3;
                time_in_seconds_corresponding_to_one_attempt_in_score = 450.0; // (time corresponding to 2 attempts: 15 min)
                multiply_factor = 0.50;
                break;                
              case 5:
                nb_attempts_for_max_score = 4;
                time_in_seconds_corresponding_to_one_attempt_in_score = 900.0; // (time corresponding to 2 attempts: 30 min) // See (*)
                multiply_factor = 1.0;
                break;
              case 6:
                nb_attempts_for_max_score = 6;
                time_in_seconds_corresponding_to_one_attempt_in_score = 1350.0;  // (time corresponding to 2 attempts: 45 min) // See (*)
                multiply_factor = 1.5;
                break;                
              case 7:
                nb_attempts_for_max_score = 7;
                time_in_seconds_corresponding_to_one_attempt_in_score = 1800.0;  // (time corresponding to 2 attempts: 1 hour) // See (*)
                multiply_factor = 2.0;
                break;
              default:
                throw new Error("invalid number of columns in score calculation: " + nbColumns);
            }
            let max_score = 100.0;
            let min_score = 1.0;
            let score_from_nb_attempts;
            if (currentAttemptNumber-1 /* number of attempts */ <= nb_attempts_for_max_score) { // (all the very low numbers of attempts ("lucky games") are handled the same way)
              score_from_nb_attempts = max_score;
            }
            else {
              score_from_nb_attempts = max_score - ((currentAttemptNumber-1) /* number of attempts */ - nb_attempts_for_max_score)*10.0;
            }
            let max_time_delta_score;
            if (currentAttemptNumber-1 /* number of attempts */ < nbMaxAttempts) {
              max_time_delta_score = 2*10.0; // (the time spent will tend not to cost more than 2 attempts in the score)
            }
            else {
              max_time_delta_score = score_from_nb_attempts; // (at very last attempt, score will tend towards zero as time goes on)
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
            if (time_delta_score <= max_time_delta_score) {
              score = multiply_factor * (score_from_nb_attempts - time_delta_score);
            }
            else {
              score = multiply_factor * (score_from_nb_attempts - max_time_delta_score 
                                         - (time_delta_score - max_time_delta_score)/2.0); // "good player's slope / 4"
            }
            if (score < min_score) {
              score = min_score; /* (score will never be zero in case the game was won without significant help) */
            }

            // Check if the player was helped
            if (playerWasHelpedSignificantly) {
              victoryStr = "You won with help!";
              score = 0.0;
            }
            else if (playerWasHelpedSlightly) {
              victoryStr = "You won with help!";              
              nbColorsRevealed = (nbColumns-codeHandler.nbEmptyColors(secretCodeRevealed));
              if (nbColorsRevealed == 1) { // 1 color revealed
                score = Math.max(score / 2.0, min_score);
              }
              else if (nbColorsRevealed == 2) { // 2 colors revealed
                score = Math.max(score / 4.0, min_score);
              }
              else if (nbColorsRevealed > 2) { // > 2 colors revealed
                score = Math.max(score / 8.0, min_score);
              }
              else {
                score = 0.0;                
                displayGUIError("internal error: nbColorsRevealed = " + nbColorsRevealed, new Error().stack);
              }
            }
            else {
              victoryStr = "You won!!!";
            }
            
            displayString(victoryStr, 2+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+3+nbColors/2, ((nbColumns>=7)?5:4)+4+3,
                          greenColor, backgroundColor_2, ctx, true, 0, false, 0);
            displayString("Time: " + timeStr, 2+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+3+nbColors/2-1, ((nbColumns>=7)?5:4)+4+3,
                          greenColor, backgroundColor_2, ctx, true, 0, false, 0);
            if (score > 0.0) {
              let rounded_score = Math.round(score * 5.0) / 5.0;
              displayString("Score: " + rounded_score, 2+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+3+nbColors/2-2, ((nbColumns>=7)?5:4)+4+3,
                            greenColor, backgroundColor_2, ctx, true, 0, false, 0);                          
            }
            
          }
          else if (currentAttemptNumber == nbMaxAttemptsToDisplay+1) { // game lost
          
            score = 0.0;
            displayString("You lost!", 2+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+3+nbColors/2, ((nbColumns>=7)?5:4)+4+3,
                          redColor, backgroundColor_2, ctx, true, 0, false, 0);
            displayString("Time: " + timeStr, 2+(90*(nbColumns+1))/100+nbColumns*2, nbMaxAttemptsToDisplay+3+nbColors/2-1, ((nbColumns>=7)?5:4)+4+3,
                          redColor, backgroundColor_2, ctx, true, 0, false, 0);
                          
          }
          else {
            displayGUIError("game over inconsistency", false);
          }

          ctx.font = small_italic_font;
          if ((nbGamesWonWithoutHelpAtAll <= HintsThreshold) && (!gameOnGoing()) && allPossibleCodesFilled()) { // XXX Use blinking button instead!!!
            displayString("\u2193 Click below to show the possible codes", 0, nbMaxAttemptsToDisplay, 2+(90*(nbColumns+1))/100+nbColumns*2,
                          darkGray, backgroundColor_2, ctx, true, 1, true, 0); // XXX Bubble
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
          x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+3+color));
          x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+3+color));
          drawLine(ctx, x_0, y_0, x_1, y_1);
        }

        for (let col = 0; col <= nbColumns; col++) {
          x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+3));
          x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+3+nbColors));
          drawLine(ctx, x_0, y_0, x_1, y_1);
        }

        ctx.font = basic_bold_font;
        for (let color = 0; color < nbColors; color++) {
          for (let col = 0; col < nbColumns; col++) {
            color_selection_code = codeHandler.setColor(color_selection_code, color+1, col+1);
          }
          displayCode(color_selection_code, nbMaxAttemptsToDisplay+3+color, ctx);
        }

        ctx.fillStyle = darkGray;

        ctx.font = medium_bold_font;
        if ((nbGamesWonWithoutHelpAtAll == 0) && gameOnGoing()) {
          let x_delta = 0.75;
          displayString("Click on the colors to select them!", 2+(90*(nbColumns+1))/100+nbColumns*2+x_delta, nbMaxAttemptsToDisplay+3+Math.floor(nbColors/2)-1, +((nbColumns>=7)?5:4)+4+3-x_delta,
                        darkGray, backgroundColor_2, ctx, true, 1, true, 0, false, true);
        }

      }

      else { // showPossibleCodesMode is true

        // Display text related to possible codes
        // **************************************

        let nbOfCodes = nbOfPossibleCodes[currentPossibleCodeShown-1];
        let nbOfCodesListed = Math.min(nbOfCodes,nbPossibleCodesShown);
        if ( (currentPossibleCodeShown >= 1) && (currentPossibleCodeShown <= nbMaxAttempts) && (nbOfCodes>=1) ) {

          ctx.font = medium_bold_font;
          if (nbOfCodes == 1) {
            res = displayString("1 possible code  ", 0, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-1, 2+(90*(nbColumns+1))/100,
                          darkGray, backgroundColor_2, ctx, true, 2, true, 0);
            if (!res) {
              res = displayString("1 code  ", 0, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-1, 2+(90*(nbColumns+1))/100,
                                                        darkGray, backgroundColor_2, ctx, true, 2, true, 0);
            }
          }
          else {
            res = displayString(nbOfCodes + " possible codes  ", 0, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-1, 2+(90*(nbColumns+1))/100,
                                        darkGray, backgroundColor_2, ctx, true, 2, true, 0);
            if (!res) {
              res = displayString(nbOfCodes + " codes  ", 0, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-1, 2+(90*(nbColumns+1))/100,
                                                        darkGray, backgroundColor_2, ctx, true, 2, true, 0);
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
            displayString("at " + currentPossibleCodeShownStr + " attempt  ", 0, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-2, 2+(90*(nbColumns+1))/100,
                          darkGray, backgroundColor_2, ctx, true, 2, true, 0);
          }
          if (nbOfCodesListed < nbOfCodes) {
            ctx.font = medium_bold_font;
            if (nbOfCodes-nbOfCodesListed == 1) {
              displayString("+ 1 other code", 2+(90*(nbColumns+1))/100, nbMaxAttemptsToDisplay, nbColumns*2,
                            darkGray, backgroundColor_2, ctx, true, 0, false, 0);
            }
            else {
              displayString("+ " + (nbOfCodes-nbOfCodesListed) + " other codes", 2+(90*(nbColumns+1))/100, nbMaxAttemptsToDisplay, nbColumns*2,
                            darkGray, backgroundColor_2, ctx, true, 0, false, 0);
            }
          }
        }
        else {
          displayGUIError("invalid currentPossibleCodeShown: " + currentPossibleCodeShown, false);
        }

        ctx.font = small_italic_font;
        if (nbGamesWonWithoutHelpAtAll <= HintsThreshold) { // XXX Rename button instead
          displayString("\u2190 Back to game", 0, nbMaxAttemptsToDisplay, 2+(90*(nbColumns+1))/100,  // XXX bubble
                        darkGray, backgroundColor_2, ctx, true, 1, true, 0);
        }

        // Draw always present and impossible colors
        // *****************************************

        ctx.font = small_basic_font;
        for (let col = 0; col < nbColumns; col++) {
          if (codeHandler.getColor(colorsFoundCodes[currentPossibleCodeShown-1], col+1) != emptyColor) {
            displayString(tickChar, 2+(90*(nbColumns+1))/100+col*2, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown, 2,
                          greenColor, backgroundColor_2, ctx, true, 0, true, 1, true /* (ignoreRanges) */);
          }
        }

        ctx.font = basic_bold_font;
        let colors_cnt = 0;
        for (let color = 1; color <= nbColors; color++) {
          if (minNbColorsTables[currentPossibleCodeShown-1][color] > 0) { // always present color
            for (let i = 0; i < minNbColorsTables[currentPossibleCodeShown-1][color]; i++) {
              displayColor(color, 2+(90*(nbColumns+1))/100-3, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-4-colors_cnt, ctx, false, true);
              colors_cnt++;
            }
          }
        }
        if (colors_cnt > 0) {
          colors_cnt++;
        }
        for (let color = 1; color <= nbColors; color++) {
          if (maxNbColorsTables[currentPossibleCodeShown-1][color] == 0) { // impossible color
            displayColor(color, 2+(90*(nbColumns+1))/100-3, nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-4-colors_cnt, ctx, false, false);
            colors_cnt++;
          }
        }

        // Draw possible codes & their stats
        // *********************************

        ctx.fillStyle = darkGray;
        for (let codeidx = 0; codeidx <= nbPossibleCodesShown; codeidx++) {
          x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+1+codeidx));
          x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+nbColumns*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+1+codeidx));
          drawLine(ctx, x_0, y_0, x_1, y_1);
        }

        for (let col = 0; col <= nbColumns; col++) {
          x_0 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
          y_0 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+1));
          x_1 = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100+col*2));
          y_1 = get_y_pixel(y_min+y_step*(nbMaxAttemptsToDisplay+1+nbPossibleCodesShown));
          drawLine(ctx, x_0, y_0, x_1, y_1);
        }

        for (let codeidx = 0; codeidx < nbOfCodesListed; codeidx++) {
          let codeAndPerfs = possibleCodesLists[currentPossibleCodeShown-1][codeidx];
          let y_cell = nbMaxAttemptsToDisplay+1+nbPossibleCodesShown-1-codeidx;
          ctx.font = basic_bold_font;
          displayCode(codeAndPerfs.code, y_cell, ctx);
          let globalPerfStr = "";
          let performanceIndicator = Math.round(codeAndPerfs.globalPerformance * 100.0) / 100.0;
          if (performanceIndicator == PerformanceIndicatorUNKNOWN) {
            globalPerfStr = "?";
          }
          else if (performanceIndicator != PerformanceIndicatorNA) {
            globalPerfStr = String.format("%.2f", performanceIndicator).replaceAll(",",".");
          }
          // else: nothing is displayed in case of PerformanceIndicatorNA
          ctx.font = medium_bold_font;
          displayString(globalPerfStr, 2+(90*(nbColumns+1))/100+nbColumns*2, y_cell, ((nbColumns>=7)?5:4),
                        lightGray, backgroundColor_2, ctx);
          displayPerf(codeAndPerfs.relativePerformance, y_cell, backgroundColor_2, ctx);
          if ( (codeAndPerfs.equivalenceClassId != equivalenceClassIdUNKNOWN) && (codeAndPerfs.equivalenceClassId >= 0) /* (valid value) */ ) {
            ctx.font = medium_bold_italic_font;
            displayString("(" + codeAndPerfs.equivalenceClassId + ")", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4, y_cell, 3,
                          lightGray, backgroundColor_2, ctx, true, 0, true, 0);
          }
        }

      }

      // Enable or disable GUI controls
      // ******************************

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

      document.getElementById("playRandomCodeButton").disabled = !gameOnGoing();
      if (document.getElementById("playRandomCodeButton").disabled) {
        document.getElementById("playRandomCodeButton").className  = "button disabled";
      }
      else {
        document.getElementById("playRandomCodeButton").className  = "button";
      }
      document.getElementById("playPossibleCodeButton").disabled = !(gameOnGoing() && allPossibleCodesFilled());
      if (document.getElementById("playPossibleCodeButton").disabled) {
        document.getElementById("playPossibleCodeButton").className = "button disabled";
      }
      else {
        document.getElementById("playPossibleCodeButton").className = "button";
      }
      document.getElementById("revealSecretColorButton").disabled = !(gameOnGoing() && (nbColumns-codeHandler.nbEmptyColors(secretCodeRevealed)+1) < (nbColumns+1)/2);
      if (document.getElementById("revealSecretColorButton").disabled) {
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
        document.getElementById("showPossibleCodesButton").className = "button";
      }

      checkArraySizes();

      // *****************************
      // Store player's info distantly
      // *****************************

      if (game_won_without_big_help) {
        if ((timeStr.length == 0) || (score < 0.0)) { // XXX storage to be done only when all perfs have been computed
          displayGUIError("internal error at store_player_info call", new Error().stack);
        }
        else if (score > 0.0) {
          store_player_info(game_cnt, nbColumns, score, currentAttemptNumber-1, timeStr, "+0.00", nbColorsRevealed); // XXX to be filled properly (with perfs)
        }
      }      
      
      main_graph_update_needed = false;
      
    }

    // ******************
    // Partial repainting
    // ******************

    // Display current code
    if (gameOnGoing()) { // playing phase
      ctx.font = basic_bold_font;
      displayCode(currentCode, currentAttemptNumber-1, ctx);

    document.getElementById("resetCurrentCodeButton").disabled  = !(gameOnGoing() && (currentCode != secretCodeRevealed));
    if (document.getElementById("resetCurrentCodeButton").disabled) {
      document.getElementById("resetCurrentCodeButton").className = "button disabled";
    }
    else {
      document.getElementById("resetCurrentCodeButton").className = "button";
    }

    if ( (!hintHasAlreadyBlinked)
         && gameOnGoing() && (currentAttemptNumber > 1)
         && !(document.getElementById("revealSecretColorButton").disabled)
         && (secretCodeRevealed == 0)
         && ( (((new Date()).getTime() - startTime)/1000 > ((nbColumns <= 5) ? 1680 /* 30 min - 2 min = 28 min */ : 2580 /* 45 min - 2 min = 43 min */))  // See (*)
              || (currentAttemptNumber >= nbMaxAttempts-1) /* (last but one attempt) */ ) ) {
        document.getElementById("revealSecretColorButton").className = document.getElementById("revealSecretColorButton").className + " blinking";
        hintHasAlreadyBlinked = true;
      }
    }

  }
  catch (err) {
    draw_exception = true;
    displayGUIError("draw error: " + err, err.stack);
  }

  // *********************
  // Display errors if any
  // *********************
  
  if (errorStr != "") { // XXX A tester
    ctx.font = very_small_italic_font;
    let errorColor;
    if (draw_exception) { // A Java exception occurred while drawing the graphic (showPossibleCodesMode and nbMaxAttemptsToDisplay can be corrupted / inconsistent with current GUI display)
      errorColor = "red";
    }
    else {
      errorColor = "lightGray";
    }
    if (showPossibleCodesMode) { // XXX Erreurs à tester, bien affichees? tjs valides?
      displayString(errorStr, 0, nbMaxAttemptsToDisplay+3-1, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4+3,
                    errorColor, backgroundColor_2, ctx, true, 1, false, 0);
    }
    else {
      displayString(errorStr, 0, nbMaxAttemptsToDisplay, 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4)+4+3,
                    errorColor, backgroundColor_2, ctx, true, 1, false, 0);
    }
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
                       drawInBubble = false) {

  let x_0 = get_x_pixel(x_min+x_step*x_cell);
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
      /* XXX TBC
      if (!displayColorMode) { // To simplify, strikethrough mode is only handled in the centered case
        if (Math.max(Math.max(backgroundColor.getRed(), backgroundColor.getGreen()), backgroundColor.getBlue()) < 50) {
          ctx.fillStyle = "white";
        }
        else {
          ctx.fillStyle = "black";
        }
        graphics2D.setStroke(thickStroke);
        drawLine(ctx, x_0 + 2, y_0 - 2, x_0_next - 2, y_0_next + 2);
        drawLine(ctx, x_0 + 2, y_0_next + 2, x_0_next - 2, y_0 - 2);
        graphics2D.setStroke(basicStroke);
        ctx.fillStyle = backgroundColor;
        let half_hidding_rect_width = Math.min(16*(x_0_next - x_0)/100, str_width/2+2);
        ctx.fillRect(x_0 + (x_0_next - x_0)/2 - half_hidding_rect_width, y_0_next + 1, 2*half_hidding_rect_width+2, y_0 - y_0_next - 1);
      } */
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "center"; // horizontal alignment
      ctx.textBaseline = "middle"; // vertical alignment
      ctx.fillText(str, (x_0 + x_0_next)/2, (y_0 + y_0_next)/2 + y_offset);
      // subPixelText(ctx, str, (x_0 + x_0_next)/2, y_0, 25);
    }
    else if (justify == 2) { // right
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "end"; // horizontal alignment
      ctx.textBaseline = "middle"; // vertical alignment
      ctx.fillText(str, x_0_next, (y_0 + y_0_next)/2 + y_offset);
    }
    else { // left
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "start"; // horizontal alignment
      ctx.textBaseline = "middle"; // vertical alignment
      ctx.fillText(str, x_0, (y_0 + y_0_next)/2 + y_offset);
    }

    if (drawInBubble) {
      let delta_x = 10;
      let delta_y = 3;
      drawBubble(ctx, x_0 - delta_x, y_0_next - delta_y, str_width + 2*delta_x, y_0 - y_0_next + 2*delta_y, Math.floor(str_height/2), foregroundColor, 1);
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
    let color = codeHandler.getColor(code, col+1);
    displayColor(color, 2+(90*(nbColumns+1))/100+col*2, y_cell, ctx, secretCodeCase, true);
  }
}


function displayMark(mark, y_cell, backgroundColor, ctx) {

  let x_0 = get_x_pixel(x_min+x_step*2);
  let x_0_next = get_x_pixel(x_min+x_step*(2+(90*(nbColumns+1))/100));
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

function drawBubble(ctx, x, y, w, h, radius, foregroundColor, lineWidth)
{
  let r = x + w;
  let b = y + h;
  ctx.beginPath();
  ctx.strokeStyle = foregroundColor;
  ctx.lineWidth = lineWidth;
  ctx.moveTo(x+radius, y);
  ctx.lineTo(x+radius/2, y-10);
  ctx.lineTo(x+radius * 2, y);
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

function displayPerf(perf, y_cell, backgroundColor, ctx) {

  let performanceIndicator = Math.round(perf * 100.0) / 100.0;

  if (performanceIndicator == PerformanceIndicatorUNKNOWN) {
    displayString("?", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                  lightGray, backgroundColor, ctx);
  }
  else if (performanceIndicator != PerformanceIndicatorNA) {
    if (performanceIndicator == -1.0) { // useless code
      let res = displayString(" useless ", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                                  redColor, backgroundColor, ctx, true, 0, true, 0);
      if (!res) {
        displayString(String.format("%.2f", performanceIndicator).replaceAll(",","."), 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                      redColor, backgroundColor, ctx);
      }
    }
    else if (performanceIndicator <= -0.50) {
      displayString(String.format("%.2f", performanceIndicator).replaceAll(",","."), 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                    redColor, backgroundColor, ctx);
    }
    else if (performanceIndicator <= -0.25) {
      displayString(String.format("%.2f", performanceIndicator).replaceAll(",","."), 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                    orangeColor, backgroundColor, ctx);
    }
    else if (performanceIndicator < 0.0) {
      displayString(String.format("%.2f", performanceIndicator).replaceAll(",","."), 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                    lightGray, backgroundColor, ctx);
    }
    else if (performanceIndicator == 0.0) { // optimal code
      let res = displayString(" optimal ", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                                  lightGray, backgroundColor, ctx, true, 0, true, 0);
      if (!res) {
        displayString(String.format("%.2f", performanceIndicator).replaceAll(",","."), 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                      lightGray, backgroundColor, ctx);
      }
    }
    else { // (an illogical code can be better than the optimal logical code)
      displayString("+" + String.format("%.2f", performanceIndicator).replaceAll(",",".") + "!", 2+(90*(nbColumns+1))/100+nbColumns*2+((nbColumns>=7)?5:4), y_cell, 4,
                    greenColor, backgroundColor, ctx);
    }
  }
  // else: nothing is displayed in case of PerformanceIndicatorNA

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

let subPixelText = function(ctx,text,x,y,fontHeight){ // XXX à utiliser?
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

