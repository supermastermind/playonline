// XXXs + TBCs check RAM after repetitive gameResets w/ N codes played at 7 columns

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
let overallNbMaxAttempts = 15;

let init_done = false;
let nbColumns = -1;
let nbColors = -1;
let nbMaxAttempts = -1;
let nbMaxPossibleCodesShown = -1;
let possibleCodesShown;
let globalPerformancesShown;
let game_id = -1;

let codesPlayed;
let marks;

let codeHandler;

let initialNbPossibleCodes = -1;
let previousNbOfPossibleCodes = -1;
let nextNbOfPossibleCodes = -1;

let colorsFoundCode = -1;
let minNbColorsTable;
let maxNbColorsTable;
let nbColorsTableForMinMaxNbColors;

let nbMaxMarks = -1;
let marksTable_MarkToNb;
let marksTable_NbToMark;
let best_mark_idx;

let possibleCodesAfterNAttempts;

let currentAttemptNumber = 0;
let nbMaxAttemptsForEndOfGame = -1;
let message_processing_ongoing = false;

let init_refresh_time = 1222;
let attempt_refresh_time_1 = 222;
let attempt_refresh_time_2 = attempt_refresh_time_1*2;

let max_performance_evaluation_time = 5555;

// Performance-related variables
// *****************************

let baseOfNbOfCodesForSystematicEvaluation = 175; // XXX 175
let nbOfCodesForSystematicEvaluation = -1;
let possibleCodesForPerfEvaluation;
let possibleCodesForPerfEvaluation_lastIndexWritten = -1;
let mem_reduc_factor = 0.8;
let nbMaxDepth = -1;

let performanceListsInitDone = false;
let arraySizeAtInit = -1;
let listOfGlobalPerformances;
let listsOfPossibleCodes;
let nbOfPossibleCodes;

let PerformanceNA = -3.00; // (duplicated in SuperMasterMind.js)
let PerformanceUNKNOWN = -2.00; // (duplicated in SuperMasterMind.js)

// *************************************************************************
// *************************************************************************
// Classes
// *************************************************************************
// *************************************************************************

/* ********************************************************************************************************
   OptimizedArrayInternalList class (used by OptimizedArrayList)
   ******************************************************************************************************** */
class OptimizedArrayInternalList {
  constructor(granularity_p) {
    this.list = new Array(granularity_p);
  }
}

/* **********************************************************************************************************
   OptimizedArrayList class: "ArrayList" of non-null integers optimized in terms of performances and memory.
   A classical use case of this class is the handling of a memory buffer whose size is significantly flexible
   (dynamic memory allocation instead of static allocation).
   ********************************************************************************************************** */
let nb_max_internal_lists = 100; // (100 means a 1% memory allocation flexibility)
class OptimizedArrayList {

  constructor(granularity_p) {
    if (granularity_p < 5*nb_max_internal_lists)  {
      throw new Error("OptimizedArrayList: invalid granularity: " + granularity_p);
    }

    this.granularity = granularity_p;
    this.nb_elements = 0;
    this.current_add_list_idx = 0;
    this.current_add_idx = 0;
    this.current_get_list_idx = 0;
    this.current_get_idx = 0;
    this.internal_lists = new Array(nb_max_internal_lists);
    this.internal_lists[0] = new OptimizedArrayInternalList(this.granularity);
  }

  clear() {
    this.nb_elements = 0;
    this.current_add_list_idx = 0;
    this.current_add_idx = 0;
    this.current_get_list_idx = 0;
    this.current_get_idx = 0;
    // Memory is not freed explicitly (no "this.internal_lists[x] = null" (or "this.internal_lists[x].list[y] = null": N.A. for int type))
    // => the tables allocated in memory will thus be reusable, which can fasten the processes
  }

  free() {
    this.nb_elements = 0;
    this.current_add_list_idx = 0;
    this.current_add_idx = 0;
    this.current_get_list_idx = 0;
    this.current_get_idx = 0;
    // Memory is freed
    for (let list_idx = 0; list_idx < nb_max_internal_lists; list_idx++) {
      this.internal_lists[list_idx] = null; // (help garbage collector)
    }
    this.internal_lists = null; // (help garbage collector)
  }

  getNbElements() {
    return this.nb_elements;
  }

  add(value) {

    // Add element
    this.internal_lists[this.current_add_list_idx].list[this.current_add_idx] = value;
    this.nb_elements++;

    // Prepare next add
    if (this.current_add_idx < this.granularity-1) {
      this.current_add_idx++;
    }
    else {
      if (this.current_add_list_idx >= nb_max_internal_lists-1) {
        throw new Error("OptimizedArrayList: array is full");
      }
      this.current_add_list_idx++;
      if (this.internal_lists[this.current_add_list_idx] == null) {
        this.internal_lists[this.current_add_list_idx] = new OptimizedArrayInternalList(this.granularity);
      }
      this.current_add_idx = 0;
    }

  }

  resetGetIterator() {
    this.current_get_list_idx = 0;
    this.current_get_idx = 0;
  }

  getNextElement(goToNext) {

    // Get next element
    if ( (this.current_get_list_idx < this.current_add_list_idx)
         || ( (this.current_get_list_idx == this.current_add_list_idx) && (this.current_get_idx < this.current_add_idx) ) ) {

      let value = this.internal_lists[this.current_get_list_idx].list[this.current_get_idx];

      // Prepare next get
      if (goToNext) {
        if (this.current_get_idx < this.granularity-1) {
          this.current_get_idx++;
        }
        else {
          this.current_get_list_idx++;
          this.current_get_idx = 0;
        }
      }

      if (value == 0) {
        throw new Error("OptimizedArrayList: getNextElement inconsistency");
      }
      return value;

    }
    else {
      return 0;
    }

  }

  replaceNextElement(value_ini_p, value_p) {

    if ( (value_ini_p == 0) || (value_p == 0) ) {
      throw new Error("OptimizedArrayList: replaceNextElement: invalid parameter (" + value_ini_p + "," + value_p + ")");
    }

    // Replace next element
    if ( (this.current_get_list_idx < this.current_add_list_idx)
         || ( (this.current_get_list_idx == this.current_add_list_idx) && (this.current_get_idx < this.current_add_idx) ) ) {

      let value = this.internal_lists[this.current_get_list_idx].list[this.current_get_idx];
      if (value != value_ini_p) {
        throw new Error("OptimizedArrayList: replaceNextElement inconsistency (" + value + "," + value_ini_p + ")");
      }

      // Replace
      this.internal_lists[this.current_get_list_idx].list[this.current_get_idx] = value_p;

      // Prepare next get
      if (this.current_get_idx < this.granularity-1) {
        this.current_get_idx++;
      }
      else {
        this.current_get_list_idx++;
        this.current_get_idx = 0;
      }

    }
    else {
      throw new Error("OptimizedArrayList: replaceNextElement inconsistency");
    }

  }

}

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
  fillMark(code1, code2, mark) { // (duplicated code)

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
    if ( (mark.nbBlacks >= 0) && (mark.nbWhites >= 0) && (mark.nbBlacks + mark.nbWhites <= this.nbColumns)
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

// **********************************
// Check if a code played is possible
// **********************************

function isAttemptPossibleinGameSolver(attempt_nb) { // (returns 0 if the attempt_nb th code is possible, returns the first attempt number with which there is a contradiction otherwise)
  if ( (attempt_nb <= 0) || (attempt_nb > currentAttemptNumber) ) {
    throw new Error("isAttemptPossibleinGameSolver: invalid attempt_nb " + attempt_nb + ", " + currentAttemptNumber);
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

// *****************************************
// Fill a short initial possible codes table
// *****************************************

function fillShortInitialPossibleCodesTable(table, size_to_fill) {

  let code_tmp = 0;
  let cnt = 0;

  if (size_to_fill > table.length) {
    throw new Error("fillShortInitialPossibleCodesTable: table size is too low: " + size_to_fill + ", " + table.length);
  }

  switch (nbColumns) {

    case 3:

      for (let color1 = 1; color1 <= nbColors; color1++) {
        for (let color2 = 1; color2 <= nbColors; color2++) {
          for (let color3 = 1; color3 <= nbColors; color3++) {
            code_tmp = codeHandler.setAllColors(color1, color2, color3, emptyColor, emptyColor, emptyColor, emptyColor);
            table[cnt] = code_tmp;
            cnt++;
            if (cnt >= size_to_fill) return cnt;
          }
        }
      }
      break;

    case 4:

      for (let color1 = 1; color1 <= nbColors; color1++) {
        for (let color2 = 1; color2 <= nbColors; color2++) {
          for (let color3 = 1; color3 <= nbColors; color3++) {
            for (let color4 = 1; color4 <= nbColors; color4++) {
              code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, emptyColor, emptyColor, emptyColor);
              table[cnt] = code_tmp;
              cnt++;
              if (cnt >= size_to_fill) return cnt;
            }
          }
        }
      }
      break;

    case 5:

      for (let color1 = 1; color1 <= nbColors; color1++) {
        for (let color2 = 1; color2 <= nbColors; color2++) {
          for (let color3 = 1; color3 <= nbColors; color3++) {
            for (let color4 = 1; color4 <= nbColors; color4++) {
              for (let color5 = 1; color5 <= nbColors; color5++) {
                code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, color5, emptyColor, emptyColor);
                table[cnt] = code_tmp;
                cnt++;
                if (cnt >= size_to_fill) return cnt;
              }
            }
          }
        }
      }
      break;

    case 6:

      for (let color1 = 1; color1 <= nbColors; color1++) {
        for (let color2 = 1; color2 <= nbColors; color2++) {
          for (let color3 = 1; color3 <= nbColors; color3++) {
            for (let color4 = 1; color4 <= nbColors; color4++) {
              for (let color5 = 1; color5 <= nbColors; color5++) {
                for (let color6 = 1; color6 <= nbColors; color6++) {
                  code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, emptyColor);
                  table[cnt] = code_tmp;
                  cnt++;
                  if (cnt >= size_to_fill) return cnt;
                }
              }
            }
          }
        }
      }
      break;

    case 7:

      for (let color1 = 1; color1 <= nbColors; color1++) {
        for (let color2 = 1; color2 <= nbColors; color2++) {
          for (let color3 = 1; color3 <= nbColors; color3++) {
            for (let color4 = 1; color4 <= nbColors; color4++) {
              for (let color5 = 1; color5 <= nbColors; color5++) {
                for (let color6 = 1; color6 <= nbColors; color6++) {
                  for (let color7 = 1; color7 <= nbColors; color7++) {
                    code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, color7);
                    table[cnt] = code_tmp;
                    cnt++;
                    if (cnt >= size_to_fill) return cnt;
                  }
                }
              }
            }
          }
        }
      }
      break;

    default:
      throw new Error("fillShortInitialPossibleCodesTable: invalid nbColumns value: " + nbColumns);
  }

  throw new Error("fillShortInitialPossibleCodesTable: internal error (cnt value: " + cnt + ")");
  // return cnt;

}

// **********************************
// Update tables of numbers of colors
// **********************************

function updateNbColorsTables(code) {

  if (!codeHandler.isEmpty(colorsFoundCode)) { // colorsFoundCode is not empty
    for (let column = 0; column < nbColumns; column++) {
      let color = codeHandler.getColor(colorsFoundCode, column+1);
      if (color == emptyColor) {
        continue;
      }
      let color2 = codeHandler.getColor(code, column+1);
      if (color == nbColors+1) { // (initial value)
        colorsFoundCode = codeHandler.setColor(colorsFoundCode, color2, column+1);
      }
      else if (color != color2) {
        colorsFoundCode = codeHandler.setColor(colorsFoundCode, emptyColor, column+1);
      }
    }
  }

  let sum = 0;
  for (let color = 1; color <= nbColors; color++) {
    let nb_colors_tmp = nbColorsTableForMinMaxNbColors[color];
    sum += nb_colors_tmp;
    minNbColorsTable[color] = Math.min(nb_colors_tmp, minNbColorsTable[color]);
    maxNbColorsTable[color] = Math.max(nb_colors_tmp, maxNbColorsTable[color]);
  }
  if (sum != nbColumns) {
    throw new Error("updateNbColorsTables() error: " + sum);
  }

}

// ***************************************************
// Compute number of possible codes at a given attempt
// ***************************************************

let last_attempt_nb = 1;
function computeNbOfPossibleCodes(attempt_nb, nb_codes_max_listed, possibleCodes_p) {

  if ( (attempt_nb < 2) || (attempt_nb != last_attempt_nb+1) || (nb_codes_max_listed <= 0) ) { // Calls to computeNbOfPossibleCodes() use consecutive attempt numbers
   throw new Error("computeNbOfPossibleCodes: invalid parameters (" + attempt_nb + "," + last_attempt_nb + "," + nb_codes_max_listed + ")");
  }
  if (nb_codes_max_listed > possibleCodes_p.length) {
    throw new Error("computeNbOfPossibleCodes: table size is too low: " + nb_codes_max_listed + ", " + possibleCodes_p.length);
  }
  last_attempt_nb++;

  // Initialize tables of numbers of colors
  colorsFoundCode = codeHandler.setAllColorsIdentical(nbColors+1); // (initial value)
  for (let color = 1; color <= nbColors; color++) {
    minNbColorsTable[color] = nbColumns;
    maxNbColorsTable[color] = 0;
  }

  let N; // possibleCodesAfterNAttempts is build at attempt N (shall be >= 1)
  if (nbColumns >= 7) { // (higher memory consumption)
    N = 3;
  }
  else {
    N = 2;
  }

  if (attempt_nb <= N) {

    if (possibleCodesAfterNAttempts.getNbElements() != 0) {
      throw new Error("computeNbOfPossibleCodes: internal error (" + possibleCodesAfterNAttempts.getNbElements() + ")");
    }

    let code_tmp = 0;
    let mark_tmp = {nbBlacks:0, nbWhites:0};
    let cnt = 0;

    switch (nbColumns) {

      case 3:

        for (let color1 = 1; color1 <= nbColors; color1++) {
          for (let color2 = 1; color2 <= nbColors; color2++) {
            for (let color3 = 1; color3 <= nbColors; color3++) {
              code_tmp = codeHandler.setAllColors(color1, color2, color3, emptyColor, emptyColor, emptyColor, emptyColor);
              let isPossible = true;
              for (let attempt_idx = 0; attempt_idx < attempt_nb-1; attempt_idx++) {
                codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
                if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
                  isPossible = false;
                  break;
                }
              }
              if (isPossible) {
                nbColorsTableForMinMaxNbColors.fill(0);
                nbColorsTableForMinMaxNbColors[color1]++;
                nbColorsTableForMinMaxNbColors[color2]++;
                nbColorsTableForMinMaxNbColors[color3]++;
                updateNbColorsTables(code_tmp);
                if (cnt < nb_codes_max_listed) {
                  possibleCodes_p[cnt] = code_tmp;
                }
                cnt++;
                if (attempt_nb == N) {
                  possibleCodesAfterNAttempts.add(code_tmp);
                }
              }
            }
          }
        }
        break;

      case 4:

        for (let color1 = 1; color1 <= nbColors; color1++) {
          for (let color2 = 1; color2 <= nbColors; color2++) {
            for (let color3 = 1; color3 <= nbColors; color3++) {
              for (let color4 = 1; color4 <= nbColors; color4++) {
                code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, emptyColor, emptyColor, emptyColor);
                let isPossible = true;
                for (let attempt_idx = 0; attempt_idx < attempt_nb-1; attempt_idx++) {
                  codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
                  if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
                    isPossible = false;
                    break;
                  }
                }
                if (isPossible) {
                  nbColorsTableForMinMaxNbColors.fill(0);
                  nbColorsTableForMinMaxNbColors[color1]++;
                  nbColorsTableForMinMaxNbColors[color2]++;
                  nbColorsTableForMinMaxNbColors[color3]++;
                  nbColorsTableForMinMaxNbColors[color4]++;
                  updateNbColorsTables(code_tmp);
                  if (cnt < nb_codes_max_listed) {
                    possibleCodes_p[cnt] = code_tmp;
                  }
                  cnt++;
                  if (attempt_nb == N) {
                    possibleCodesAfterNAttempts.add(code_tmp);
                  }
                }
              }
            }
          }
        }
        break;

      case 5:

        for (let color1 = 1; color1 <= nbColors; color1++) {
          for (let color2 = 1; color2 <= nbColors; color2++) {
            for (let color3 = 1; color3 <= nbColors; color3++) {
              for (let color4 = 1; color4 <= nbColors; color4++) {
                for (let color5 = 1; color5 <= nbColors; color5++) {
                  code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, color5, emptyColor, emptyColor);
                  let isPossible = true;
                  for (let attempt_idx = 0; attempt_idx < attempt_nb-1; attempt_idx++) {
                    codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
                    if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
                      isPossible = false;
                      break;
                    }
                  }
                  if (isPossible) {
                    nbColorsTableForMinMaxNbColors.fill(0);
                    nbColorsTableForMinMaxNbColors[color1]++;
                    nbColorsTableForMinMaxNbColors[color2]++;
                    nbColorsTableForMinMaxNbColors[color3]++;
                    nbColorsTableForMinMaxNbColors[color4]++;
                    nbColorsTableForMinMaxNbColors[color5]++;
                    updateNbColorsTables(code_tmp);
                    if (cnt < nb_codes_max_listed) {
                      possibleCodes_p[cnt] = code_tmp;
                    }
                    cnt++;
                    if (attempt_nb == N) {
                      possibleCodesAfterNAttempts.add(code_tmp);
                    }
                  }
                }
              }
            }
          }
        }
        break;

      case 6:

        for (let color1 = 1; color1 <= nbColors; color1++) {
          for (let color2 = 1; color2 <= nbColors; color2++) {
            for (let color3 = 1; color3 <= nbColors; color3++) {
              for (let color4 = 1; color4 <= nbColors; color4++) {
                for (let color5 = 1; color5 <= nbColors; color5++) {
                  for (let color6 = 1; color6 <= nbColors; color6++) {
                    code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, emptyColor);
                    let isPossible = true;
                    for (let attempt_idx = 0; attempt_idx < attempt_nb-1; attempt_idx++) {
                      codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
                      if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
                        isPossible = false;
                        break;
                      }
                    }
                    if (isPossible) {
                      nbColorsTableForMinMaxNbColors.fill(0);
                      nbColorsTableForMinMaxNbColors[color1]++;
                      nbColorsTableForMinMaxNbColors[color2]++;
                      nbColorsTableForMinMaxNbColors[color3]++;
                      nbColorsTableForMinMaxNbColors[color4]++;
                      nbColorsTableForMinMaxNbColors[color5]++;
                      nbColorsTableForMinMaxNbColors[color6]++;
                      updateNbColorsTables(code_tmp);
                      if (cnt < nb_codes_max_listed) {
                        possibleCodes_p[cnt] = code_tmp;
                      }
                      cnt++;
                      if (attempt_nb == N) {
                        possibleCodesAfterNAttempts.add(code_tmp);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        break;

      case 7:

        if (!codeHandler.isFullAndValid(codesPlayed[0])) {
          throw new Error("computeNbOfPossibleCodes: internal error (codesPlayed[0] is not full and valid)");
        }
        let mark0_nb_pegs = marks[0].nbBlacks + marks[0].nbWhites;
        let mark1_nb_pegs = -1;
        if (attempt_nb == 3) {
          mark1_nb_pegs = marks[1].nbBlacks + marks[1].nbWhites;
        }
        for (let color1 = 1; color1 <= nbColors; color1++) {
          for (let color2 = 1; color2 <= nbColors; color2++) {
            for (let color3 = 1; color3 <= nbColors; color3++) {
              for (let color4 = 1; color4 <= nbColors; color4++) {
                for (let color5 = 1; color5 <= nbColors; color5++) {
                  for (let color6 = 1; color6 <= nbColors; color6++) {

                    // Optimization
                    code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, emptyColor);
                    codeHandler.fillMark(codesPlayed[0], code_tmp, mark_tmp);
                    let mark_tmp_nb_pegs = mark_tmp.nbBlacks + mark_tmp.nbWhites;
                    if ( (mark_tmp_nb_pegs > mark0_nb_pegs)
                         || (mark_tmp_nb_pegs < mark0_nb_pegs - 1)
                         || (mark_tmp.nbBlacks > marks[0].nbBlacks)
                         || (mark_tmp.nbBlacks < marks[0].nbBlacks - 1) ) {
                      continue;
                    }
                    if (mark1_nb_pegs != -1) {
                      codeHandler.fillMark(codesPlayed[1], code_tmp, mark_tmp);
                      let mark_tmp_nb_pegs = mark_tmp.nbBlacks + mark_tmp.nbWhites;
                      if ( (mark_tmp_nb_pegs > mark1_nb_pegs)
                           || (mark_tmp_nb_pegs < mark1_nb_pegs - 1)
                           || (mark_tmp.nbBlacks > marks[1].nbBlacks)
                           || (mark_tmp.nbBlacks < marks[1].nbBlacks - 1) ) {
                        continue;
                      }
                    }

                    for (let color7 = 1; color7 <= nbColors; color7++) {
                      code_tmp = codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, color7);
                      let isPossible = true;
                      for (let attempt_idx = 0; attempt_idx < attempt_nb-1; attempt_idx++) {
                        codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
                        if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
                          isPossible = false;
                          break;
                        }
                      }
                      if (isPossible) {
                        nbColorsTableForMinMaxNbColors.fill(0);
                        nbColorsTableForMinMaxNbColors[color1]++;
                        nbColorsTableForMinMaxNbColors[color2]++;
                        nbColorsTableForMinMaxNbColors[color3]++;
                        nbColorsTableForMinMaxNbColors[color4]++;
                        nbColorsTableForMinMaxNbColors[color5]++;
                        nbColorsTableForMinMaxNbColors[color6]++;
                        nbColorsTableForMinMaxNbColors[color7]++;
                        updateNbColorsTables(code_tmp);
                        if (cnt < nb_codes_max_listed) {
                          possibleCodes_p[cnt] = code_tmp;
                        }
                        cnt++;
                        if (attempt_nb == N) {
                          possibleCodesAfterNAttempts.add(code_tmp);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        break;

      default:
        throw new Error("computeNbOfPossibleCodes: invalid nbColumns value: " + nbColumns);
    }

    if ( (cnt <= 0) || (cnt > initialNbPossibleCodes)
         || ( (attempt_nb == 1) && (cnt != initialNbPossibleCodes) )
         || ( (attempt_nb < N) && (possibleCodesAfterNAttempts.getNbElements() != 0) )
         || ( (attempt_nb == N) && (cnt != possibleCodesAfterNAttempts.getNbElements()) ) ) {
      throw new Error("computeNbOfPossibleCodes: invalid cnt values (" + cnt + "," + attempt_nb + "," + possibleCodesAfterNAttempts.getNbElements() + ")");
    }
    return cnt;

  } // (attempt_nb <= N)
  else { // (attempt_nb > N)

    let code_possible_after_N_attempts;
    let code_possible_after_N_attempts_bis;
    let mark_tmp = {nbBlacks:0, nbWhites:0};
    let cnt = 0;
    let cnt_global = 0;

    possibleCodesAfterNAttempts.resetGetIterator();
    do {

      code_possible_after_N_attempts = possibleCodesAfterNAttempts.getNextElement(false /* (do not make the iteration) */);
      if (code_possible_after_N_attempts == 0) {
        break;
      }
      cnt_global++;

      let isPossible;
      if (code_possible_after_N_attempts != -1) { // ("code impossible" value)
        isPossible = true;
        for (let attempt_idx = 0; attempt_idx < attempt_nb-1; attempt_idx++) {
          codeHandler.fillMark(codesPlayed[attempt_idx], code_possible_after_N_attempts, mark_tmp);
          if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
            isPossible = false;
            break;
          }
        }
      }
      else {
        isPossible = false;
      }

      if (isPossible) {
        code_possible_after_N_attempts_bis = possibleCodesAfterNAttempts.getNextElement(true /* (make the iteration) */);
        if (code_possible_after_N_attempts != code_possible_after_N_attempts_bis) {
          throw new Error("computeNbOfPossibleCodes: iteration inconsistency (" + code_possible_after_N_attempts + "," + code_possible_after_N_attempts_bis + ")");
        }
        nbColorsTableForMinMaxNbColors.fill(0);
        for (let column = 0; column < nbColumns; column++) {
          nbColorsTableForMinMaxNbColors[codeHandler.getColor(code_possible_after_N_attempts, column+1)]++;
        }
        updateNbColorsTables(code_possible_after_N_attempts);
        if (cnt < nb_codes_max_listed) {
          possibleCodes_p[cnt] = code_possible_after_N_attempts;
        }
        cnt++;
      }
      else {
        possibleCodesAfterNAttempts.replaceNextElement(code_possible_after_N_attempts, -1); // ("code impossible" value)
      }

    } while (true);

    if ( (cnt <= 0) || (cnt > initialNbPossibleCodes)
         || ( (attempt_nb == 1) && (cnt != initialNbPossibleCodes) )
         || (cnt_global != possibleCodesAfterNAttempts.getNbElements()) ) {
      throw new Error("computeNbOfPossibleCodes: invalid cnt/cnt_global values (" + cnt + "," + cnt_global + "," + possibleCodesAfterNAttempts.getNbElements() + ")");
    }
    return cnt;

  }

}

// ******************************
// Handle multidimensional arrays
// ******************************

function new2DArray(x, y) {
  var my_array = new Array(x);
  for (let i = 0; i < x; i++) {
    my_array[i] = new Array(y);
  }
  return my_array;
}

function check2DArraySizes(my_array, x, y) {
  if (my_array.length != x) {
    return false;
  }
  for (let i = 0; i < my_array.length; i++) {
    if (my_array[i].length != y) {
      return false;
    }
  }
  return true;
}

function new3DArray(x, y, z, reduc) {
  var my_array = new Array(x);
  var reduced_z = z;
  for (let i = 0; i < x; i++) {
    my_array[i] = new2DArray(y, reduced_z);
    reduced_z = Math.ceil(reduced_z * reduc);
  }
  return my_array;
}

function check3DArraySizes(my_array, x, y, z, reduc) {
  if (my_array.length != x) {
    return false;
  }
  var reduced_z = z;
  for (let i = 0; i < my_array.length; i++) {
    if (!check2DArraySizes(my_array[i], y, reduced_z)) {
      return false;
    }
    reduced_z = Math.ceil(reduced_z * reduc);
  }
  return true;
}

// *********************
// Evaluate performances
// *********************

function spaces(nb) {
  let str = "";
  for (let i = -1; i < nb; i++) {
    str = str + "  ";
  }
  return str;
}

let evaluatePerformancesStartTime;

let mark_perf_tmp = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmp1 = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmp2 = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmp3 = {nbBlacks:-1, nbWhites:-1}; // N.A.

let code1_colors = new Array(nbMaxColumns);
let code2_colors = new Array(nbMaxColumns);
let colors_int = new Array(nbMaxColumns);

let particularCodeToAssess = 0; /* empty code */
let particularCodeGlobalPerformance = PerformanceNA;

// Outputs: listOfGlobalPerformances[]
//          particularCodeGlobalPerformance in case of impossible code
function evaluatePerformances(depth, listOfCodes, nbCodes, particularCode) {

  let idx;

  evaluatePerformancesStartTime = new Date().getTime();

  // Defensive check
  if (best_mark_idx != marksTable_MarkToNb[nbColumns][0]) {
    throw new Error("evaluatePerformances: (best_mark_idx != marksTable_MarkToNb[nbColumns][0])");
  }

  if (depth == -1) { // first call
    // Initialize outputs
    if (nbCodes != previousNbOfPossibleCodes) {
      throw new Error("evaluatePerformances: (nbCodes != previousNbOfPossibleCodes)");
    }
    for (idx = 0; idx < nbCodes; idx++) {
      listOfGlobalPerformances[idx] = PerformanceNA; // output
    }
    particularCodeGlobalPerformance = PerformanceNA; // output
    // Main processing
    particularCodeToAssess = particularCode;
    return recursiveEvaluatePerformances(depth, listOfCodes, nbCodes);
  }
  else {
    throw new Error("evaluatePerformances: (depth == -1)");
  }

}
// XXX Further optimizations:
// - 4 deep leave
// - throw new Exc in Solver/MainScript => recorded by google script
// - mark computing optimization: dictionary with depth?, hash code and limited history => gain x2/x3?
// - circular permutation optimization => gain x5000?
// - tous les XXX des fichiers .js (celui-ci + SMM.js notamment)
// - check "Code_at_-0.01_perf.docx"
// - 3rd geoloc backup site + email warning if reached? / or if "counter" field of 1st reached
// - web page image updates with perfs
function recursiveEvaluatePerformances(depth, listOfCodes, nbCodes) {

  let first_call = (depth == -1);
  let next_depth = depth+1;
  let nextListsOfCodes;
  let nextNbsCodes;
  let mark_idx, idx1, idx2;
  let current_code;
  let other_code;
  let mark_perf_tmp_idx;
  let sum;
  let sum_marks;
  let best_sum = 100000000000.0;

  // Initializations
  // ***************

  if (next_depth >= nbMaxDepth) {
    throw new Error("recursiveEvaluatePerformances: max depth reached");
  }

  nextListsOfCodes = listsOfPossibleCodes[next_depth]; // [nbMaxMarks][n]
  nextNbsCodes = nbOfPossibleCodes[next_depth]; // [nbMaxMarks] array

  // Evaluate performances of possible codes
  // ***************************************

  for (idx1 = 0; idx1 < nbCodes; idx1++) {

    current_code = listOfCodes[idx1];
    // if (depth <= 2) {console.log(spaces(depth) + "(depth " + depth + ") " + "current_code:" + codeHandler.codeToString(current_code));}

    nextNbsCodes.fill(0); // (faster than a for loop on 0..nbMaxMarks-1)

    // (duplicated code from fillMark() for better performances (1/2) - begin)
    code1_colors[0] = (current_code & 0x0000000F);
    code1_colors[1] = ((current_code >> 4) & 0x0000000F);
    code1_colors[2] = ((current_code >> 8) & 0x0000000F);
    code1_colors[3] = ((current_code >> 12) & 0x0000000F);
    code1_colors[4] = ((current_code >> 16) & 0x0000000F);
    code1_colors[5] = ((current_code >> 20) & 0x0000000F);
    code1_colors[6] = ((current_code >> 24) & 0x0000000F);
    // (duplicated code from fillMark() for better performances (1/2) - end)

    // Determine all possible marks for current code
    for (idx2 = 0; idx2 < nbCodes; idx2++) {
      other_code = listOfCodes[idx2];

      if (current_code != other_code) {
        // codeHandler.fillMark(current_code, other_code, mark_perf_tmp);
        // (duplicated code from fillMark() for better performances (2/2) - begin)
        let code2 = other_code;

        let nbBlacks = 0;
        let nbWhites = 0;
        let col1, col2;

        // The below operations are unrolled for better performances
        colors_int[0] = true;
        colors_int[1] = true;
        colors_int[2] = true;
        colors_int[3] = true;
        colors_int[4] = true;
        colors_int[5] = true;
        colors_int[6] = true;
        code2_colors[0] = (code2 & 0x0000000F);
        code2_colors[1] = ((code2 >> 4) & 0x0000000F);
        code2_colors[2] = ((code2 >> 8) & 0x0000000F);
        code2_colors[3] = ((code2 >> 12) & 0x0000000F);
        code2_colors[4] = ((code2 >> 16) & 0x0000000F);
        code2_colors[5] = ((code2 >> 20) & 0x0000000F);
        code2_colors[6] = ((code2 >> 24) & 0x0000000F);

        for (col1 = 0; col1 < nbColumns; col1++) {
          if (code1_colors[col1] == code2_colors[col1]) {
            nbBlacks++;
          }
          else {
            for (col2 = 0; col2 < nbColumns; col2++) {
              if ((code1_colors[col1] == code2_colors[col2]) && (code1_colors[col2] != code2_colors[col2]) && colors_int[col2]) {
                colors_int[col2] = false;
                nbWhites++;
                break;
              }
            }
          }
        }

        // mark_perf_tmp.nbBlacks = nbBlacks;
        // mark_perf_tmp.nbWhites = nbWhites;
        // (duplicated code from fillMark() for better performances (2/2) - end)

        mark_perf_tmp_idx = marksTable_MarkToNb[nbBlacks][nbWhites];
        nextListsOfCodes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]] = other_code;
        nextNbsCodes[mark_perf_tmp_idx]++;
      }
      else {
        nextListsOfCodes[best_mark_idx][nextNbsCodes[best_mark_idx]] = other_code;
        nextNbsCodes[best_mark_idx]++;
      }

    }

    // Assess current code
    sum = 0.0;
    sum_marks = 0;
    for (mark_idx = nbMaxMarks-1; mark_idx >= 0; mark_idx--) {
      let nextNbCodes = nextNbsCodes[mark_idx];
      // Go through all sets of possible marks
      if (nextNbCodes > 0) {
        sum_marks += nextNbCodes;
        if (mark_idx == best_mark_idx) {
          // sum = sum + 0.0; // 1.0 * 0.0 = 0.0
          if (sum_marks == nbCodes) break;
          // if (depth <= 2) {console.log(spaces(depth) + "(depth " + depth + ") " + "win");}
        }
        else if (nextNbCodes == 1) {
          sum = sum + 1.0; // 1.0 * 1.0 = 1.0
          if (sum_marks == nbCodes) break;
          // if (depth <= 2) {console.log(spaces(depth) + "(depth " + depth + ") " + codeHandler.markToString(marksTable_NbToMark[mark_idx]) + ": 1 code")};
        }
        else if (nextNbCodes == 2) {
          sum = sum + 3.0 // 2 * 1.5 = 3.0
          if (sum_marks == nbCodes) break;
          // if (depth <= 2) {console.log(spaces(depth) + "(depth " + depth + ") " + codeHandler.markToString(marksTable_NbToMark[mark_idx]) + ": 2 codes")};
        }
        else if (nextNbCodes == 3) {
          let nextListOfCodesToConsider = nextListsOfCodes[mark_idx];
          codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[1], mark_perf_tmp1);
          codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[2], mark_perf_tmp2);
          if ((mark_perf_tmp1.nbBlacks == mark_perf_tmp2.nbBlacks) && (mark_perf_tmp1.nbWhites == mark_perf_tmp2.nbWhites)) {
            codeHandler.fillMark(nextListOfCodesToConsider[1], nextListOfCodesToConsider[2], mark_perf_tmp3);
            if ((mark_perf_tmp1.nbBlacks == mark_perf_tmp3.nbBlacks) && (mark_perf_tmp1.nbWhites == mark_perf_tmp3.nbWhites)) {
              sum = sum + 6.0; // 3 * ((1+2+3)/3.0) = 6.0
            }
            else {
              sum = sum + 5.0; // 3 * ((1+2+2)/3.0) = 5.0
            }
          }
          else {
            sum = sum + 5.0; // 3 * ((1+2+2)/3.0) = 5.0
          }
          if (sum_marks == nbCodes) break;
          // if (depth <= 2) {console.log(spaces(depth) + "(depth " + depth + ") " + codeHandler.markToString(marksTable_NbToMark[mark_idx]) + ": 3 codes")};
        }
        else {
          sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes);
        }
      }
    }
    if (sum_marks != nbCodes) {
      throw new Error("recursiveEvaluatePerformances: invalid sum_marks value #1 (depth=" + depth + ", sum_marks=" + sum_marks + ", sum_marks=" + sum_marks + ")");
    }

    // Max possible value of sum = 24 bits (10.000.000 for 7 columns case) + 20 bits (for value 999999 so that < 1/10000 precision) = 44 bits << 52 mantissa bits of double type
    if (sum < best_sum) {
      best_sum = sum;
    }

    // Fill output in case of first call
    if (first_call) {

      // Processing is aborted when too long
      if (new Date().getTime() - evaluatePerformancesStartTime > max_performance_evaluation_time) {
        listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
        listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
        particularCodeGlobalPerformance = PerformanceNA; // output
        return PerformanceUNKNOWN;
      }

      listOfGlobalPerformances[idx1] = 1.0 + sum / nbCodes; // output
      // console.log(spaces(depth) + "(depth " + depth + ") " + "=> perf=" + listOfGlobalPerformances[idx1]);
    }

  }

  // Evaluate performance of impossible code if needed
  // *************************************************

  if (first_call && (particularCodeToAssess != 0 /* empty code */)) {

    current_code = particularCodeToAssess;

    nextNbsCodes.fill(0); // (faster than a for loop)

    // Determine all possible marks for current code
    for (idx2 = 0; idx2 < nbCodes; idx2++) {
      other_code = listOfCodes[idx2];
      codeHandler.fillMark(current_code, other_code, mark_perf_tmp);
      mark_perf_tmp_idx = marksTable_MarkToNb[mark_perf_tmp.nbBlacks][mark_perf_tmp.nbWhites];
      nextListsOfCodes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]] = other_code;
      nextNbsCodes[mark_perf_tmp_idx]++;
    }

    // Assess current code
    sum = 0.0;
    sum_marks = 0;
    for (mark_idx = nbMaxMarks-1; mark_idx >= 0; mark_idx--) {
      let nextNbCodes = nextNbsCodes[mark_idx];
      // Go through all sets of possible marks
      if (nextNbCodes > 0) {
        sum_marks += nextNbCodes;
        if (mark_idx == best_mark_idx) {
          throw new Error("recursiveEvaluatePerformances: impossible code is possible");
        }
        else if (nextNbCodes == 1) {
          sum = sum + 1.0; // 1.0 * 1.0 = 1.0
        }
        else if (nextNbCodes == 2) {
          sum = sum + 3.0 // 2 * 1.5 = 3.0
        }
        else {
          sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes);
        }
      }
    }
    if (sum_marks != nbCodes) {
      throw new Error("recursiveEvaluatePerformances: invalid sum_marks value #2 (depth=" + depth + ", sum_marks=" + sum_marks + ", sum_marks=" + sum_marks + ")");
    }

    // Fill output
    particularCodeGlobalPerformance = 1.0 + sum / nbCodes; // output

  }

  return 1.0 + best_sum / nbCodes;

}

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

    // *******************
    // Read message fields
    // *******************

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
    possibleCodesShown = new Array(nbMaxPossibleCodesShown);
    globalPerformancesShown = new Array(nbMaxPossibleCodesShown);
    for (let i = 0; i < nbMaxPossibleCodesShown; i++) {
      globalPerformancesShown[i] = PerformanceNA;
    }

    if (data.first_session_game == undefined) {
      throw new Error("INIT phase / first_session_game is undefined");
    }
    let first_session_game = data.first_session_game;

    if (data.game_id == undefined) {
      throw new Error("INIT phase / game_id is undefined");
    }
    game_id = Number(data.game_id);
    if ( isNaN(game_id) || (game_id < 0) ) {
      throw new Error("INIT phase / invalid game_id: " + game_id);
    }

    // ********************
    // Initialize variables
    // ********************

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
    previousNbOfPossibleCodes = initialNbPossibleCodes;
    nextNbOfPossibleCodes = initialNbPossibleCodes;

    minNbColorsTable = new Array(nbColors+1);
    maxNbColorsTable = new Array(nbColors+1);
    nbColorsTableForMinMaxNbColors = new Array(nbColors+1);

    switch (nbColumns) {
      case 3:
        // ******************************************
        // * Maximum number of marks for 3 columns: *
        // * 0 black  => 0..3 whites => 4 marks     *
        // * 1 black  => 0..2 whites => 3 marks     *
        // * 2 blacks => 0 white     => 1 mark      *
        // * 3 blacks => 0 white     => 1 mark      *
        // *                *** TOTAL:  9 marks *** *
        // ******************************************
        nbMaxMarks = 9;
        nbOfCodesForSystematicEvaluation = Math.min(Math.ceil(baseOfNbOfCodesForSystematicEvaluation*120/100), initialNbPossibleCodes);
        nbMaxDepth = 11;
        break;
      case 4:
        nbMaxMarks = 14;
        nbOfCodesForSystematicEvaluation = Math.min(Math.ceil(baseOfNbOfCodesForSystematicEvaluation*110/100), initialNbPossibleCodes);
        nbMaxDepth = 12;
        break;
      case 5:
        nbMaxMarks = 20;
        nbOfCodesForSystematicEvaluation = Math.min(Math.ceil(baseOfNbOfCodesForSystematicEvaluation*100/100), initialNbPossibleCodes);
        nbMaxDepth = 13;
        break;
      case 6:
        nbMaxMarks = 27;
        nbOfCodesForSystematicEvaluation = Math.min(Math.ceil(baseOfNbOfCodesForSystematicEvaluation*90/100), initialNbPossibleCodes);
        nbMaxDepth = 14;
        break;
      case 7:
        // ******************************************
        // * Maximum number of marks for 7 columns: *
        // * 0 black  => 0..7 whites => 8 marks     *
        // * 1 black  => 0..6 whites => 7 marks     *
        // * 2 blacks => 0..5 whites => 6 marks     *
        // * ...                                    *
        // * 5 blacks => 0..2 whites => 3 marks     *
        // * 6 blacks => 0 white     => 1 mark      *
        // * 7 blacks => 0 white     => 1 mark      *
        // *                *** TOTAL: 35 marks *** *
        // ******************************************
        nbMaxMarks = 35;
        nbOfCodesForSystematicEvaluation = Math.min(Math.ceil(baseOfNbOfCodesForSystematicEvaluation*80/100), initialNbPossibleCodes);
        nbMaxDepth = 15;
        break;
      default:
        throw new Error("INIT phase / invalid nbColumns: " + nbColumns);
    }

    marksTable_MarkToNb = new Array(nbColumns+1); // nbBlacks in 0..nbColumns
    for (let i = 0; i <= nbColumns; i++) { // nbBlacks
      marksTable_MarkToNb[i] = new Array(nbColumns+1); // nbWhites in 0..nbColumns
      for (let j = 0; j <= nbColumns; j++) { // nbWhites
        marksTable_MarkToNb[i][j] = -1; // N.A.
      }
    }
    marksTable_NbToMark = new Array(nbMaxMarks); // mark indexes in 0..nbMaxMarks-1
    for (let i = 0; i < nbMaxMarks; i++) { // mark indexes
      marksTable_NbToMark[i] = {nbBlacks:-1, nbWhites:-1}; // N.A.
    }
    let mark_cnt = 0;
    for (let i = 0; i <= nbColumns; i++) { // nbBlacks
      for (let j = 0; j <= nbColumns; j++) { // nbWhites
        let mark_tmp = {nbBlacks:i, nbWhites:j};
        if (codeHandler.isMarkValid(mark_tmp)) { // go through all valid marks
          if (mark_cnt >= nbMaxMarks) {
            throw new Error("INIT phase / internal error (mark_cnt: " + mark_cnt + ") (#1)");
          }
          marksTable_NbToMark[mark_cnt] = mark_tmp;
          marksTable_MarkToNb[i][j] = mark_cnt;
          mark_cnt++;
        }
      }
    }
    if (mark_cnt != nbMaxMarks) {
      throw new Error("INIT phase / internal error (mark_cnt: " + mark_cnt + ") (#2)");
    }
    if (marksTable_NbToMark.length != nbMaxMarks) {
      throw new Error("INIT phase / internal error (marksTable_NbToMark length: " + marksTable_NbToMark.length + ")");
    }
    if (marksTable_MarkToNb.length != nbColumns+1) {
      throw new Error("INIT phase / internal error (marksTable_MarkToNb length: " + marksTable_MarkToNb.length + ") (#1)");
    }
    for (let i = 0; i <= nbColumns; i++) { // nbBlacks
      if (marksTable_MarkToNb[i].length != nbColumns+1) {
        throw new Error("INIT phase / internal error (marksTable_MarkToNb length: " + marksTable_MarkToNb.length + ") (#2)");
      }
    }

    best_mark_idx = marksTable_MarkToNb[nbColumns][0];

    possibleCodesForPerfEvaluation = new Array(2);
    possibleCodesForPerfEvaluation[0] = new Array(nbOfCodesForSystematicEvaluation);
    possibleCodesForPerfEvaluation[1] = new Array(nbOfCodesForSystematicEvaluation);

    // **********
    // Update GUI
    // **********

    colorsFoundCode = codeHandler.setAllColorsIdentical(emptyColor); // value at game start
    for (let color = 1; color <= nbColors; color++) { // values at game start
      minNbColorsTable[color] = 0;
      maxNbColorsTable[color] = nbColumns;
    }

    let now = new Date().getTime();
    while(new Date().getTime() < now + init_refresh_time){}
    self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': initialNbPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': 1, 'game_id': game_id});

    let nb_possible_codes_listed = fillShortInitialPossibleCodesTable(possibleCodesForPerfEvaluation[1], nbOfCodesForSystematicEvaluation);
    if (possibleCodesForPerfEvaluation_lastIndexWritten != -1) {
      throw new Error("INIT phase / inconsistent writing into possibleCodesForPerfEvaluation");
    }
    possibleCodesForPerfEvaluation_lastIndexWritten = 1;

    init_done = true;

  }

  // ***********
  // New attempt
  // ***********

  else if (init_done && (data.req_type == 'NEW_ATTEMPT')) {

    // *******************
    // Read message fields
    // *******************

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
    if ( isNaN(codesPlayed[currentAttemptNumber-1]) || !codeHandler.isFullAndValid(codesPlayed[currentAttemptNumber-1]) ) {
      throw new Error("NEW_ATTEMPT phase / invalid code: " + codesPlayed[currentAttemptNumber-1]);
    }

    if (data.mark_nbBlacks == undefined) {
      throw new Error("NEW_ATTEMPT phase / mark_nbBlacks is undefined");
    }
    let mark_nbBlacks = Number(data.mark_nbBlacks);
    if ( isNaN(mark_nbBlacks) || (mark_nbBlacks < 0) || (mark_nbBlacks > nbColumns) ) {
      throw new Error("NEW_ATTEMPT phase / invalid mark_nbBlacks: " + mark_nbBlacks + ", " + nbColumns);
    }
    let gameWon = (mark_nbBlacks == nbColumns);
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

    let now = new Date().getTime();

    // **************************************************
    // A.1) Compute number and list of new possible codes
    // **************************************************

    if (currentAttemptNumber == 1) { // first attempt
      possibleCodesAfterNAttempts = new OptimizedArrayList(Math.max(1 + Math.floor(initialNbPossibleCodes/nb_max_internal_lists), 5*nb_max_internal_lists));
    }

    previousNbOfPossibleCodes = nextNbOfPossibleCodes;
    nextNbOfPossibleCodes = computeNbOfPossibleCodes(currentAttemptNumber+1, nbOfCodesForSystematicEvaluation, possibleCodesForPerfEvaluation[(currentAttemptNumber+1)%2]);
    if (possibleCodesForPerfEvaluation_lastIndexWritten != (currentAttemptNumber%2)) {
      throw new Error("NEW_ATTEMPT phase / inconsistent writing into possibleCodesForPerfEvaluation");
    }
    possibleCodesForPerfEvaluation_lastIndexWritten = (currentAttemptNumber+1)%2;
    if (nextNbOfPossibleCodes > previousNbOfPossibleCodes) {
      throw new Error("NEW_ATTEMPT phase / inconsistent numbers of possible codes: " + nextNbOfPossibleCodes + " > " + previousNbOfPossibleCodes);
    }

    // ***************
    // A.2) Update GUI
    // ***************

    if (currentAttemptNumber+1 <= nbMaxAttemptsForEndOfGame) { // not last game attempt
      while(new Date().getTime() < now + attempt_refresh_time_1){}
      self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': nextNbOfPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': (currentAttemptNumber+1), 'game_id': game_id});
    }

    // ***************************************
    // B.1) Compute performance of code played
    // ***************************************

    let best_global_performance = PerformanceNA;
    let code_played_relative_perf = PerformanceNA;
    let relative_perf_evaluation_done = false;

    // a) Useless code
    // ***************

    if ((nextNbOfPossibleCodes == previousNbOfPossibleCodes) && (!gameWon)) {
      // To simplify, for an useless code, performances will be computed at next useful code
      best_global_performance = PerformanceUNKNOWN;
      code_played_relative_perf = -1.00;
      relative_perf_evaluation_done = true;
    }

    // b) Useful code
    // **************

    else {

      if (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation) {

        // Initializations
        // ***************

        // - Array allocations
        if (!performanceListsInitDone) {
          performanceListsInitDone = true;
          arraySizeAtInit = previousNbOfPossibleCodes;
          listOfGlobalPerformances = new Array(arraySizeAtInit);
          listsOfPossibleCodes = new3DArray(nbMaxDepth, nbMaxMarks, Math.ceil((arraySizeAtInit+nbOfCodesForSystematicEvaluation)*mem_reduc_factor/2.0) /* (code duplicated) */, mem_reduc_factor);
          nbOfPossibleCodes = new2DArray(nbMaxDepth, nbMaxMarks);
        }

        // - Other initializations
        for (let i = 0; i < arraySizeAtInit; i++) {
          listOfGlobalPerformances[i] = PerformanceNA;
        }
        // listsOfPossibleCodes is not initialized as this array may be very large
        for (let i = 0; i < nbMaxDepth; i++) {
          for (let j = 0; j < nbMaxMarks; j++) {
            nbOfPossibleCodes[i][j] = 0;
          }
        }

        // Compute performances
        // ********************

        // XXX TEST TMP - BEGIN
        /* let test_code_1 = codeHandler.setAllColors(1, 2, 3, 4, 5, 6, 7);
        let test_code_2 = codeHandler.setAllColors(1, 3, 2, 1, 1, 1, 1);
        let test_code_3 = codeHandler.setAllColors(1, 1, 1, 1, 1, 1, 1);
        let test_code_4 = codeHandler.setAllColors(1, 4, 4, 1, 1, 1, 1);
        let test_code_5 = codeHandler.setAllColors(2, 2, 2, 1, 1, 1, 1);
        let test_array = new Array(nbOfCodesForSystematicEvaluation);
        test_array[0] = test_code_1;
        test_array[1] = test_code_2;
        test_array[2] = test_code_3;
        test_array[3] = test_code_4;
        previousNbOfPossibleCodes = 3;
        let res = evaluatePerformances(-1, test_array, previousNbOfPossibleCodes, test_code_5);
        console.log("RES = " + res);
        return; */
        // XXX TEMP TEST - END

        let code_played_global_performance = PerformanceNA;
        let index = (currentAttemptNumber%2);
        if (0 == isAttemptPossibleinGameSolver(currentAttemptNumber)) { // code played is possible
          // Evaluate performances for possibleCodesForPerfEvaluation[currentAttemptNumber%2]:
          let startTime = (new Date()).getTime();
          best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, 0 /* empty code */);
          if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
            console.log("(perfeval#1: best performance: " + best_global_performance
                        + " / " + ((new Date()).getTime() - startTime) + "ms)");
            let code_played_found = false;
            for (let i = 0; i < previousNbOfPossibleCodes; i++) {
              if ( (possibleCodesForPerfEvaluation[index][i] == codesPlayed[currentAttemptNumber-1]) && (listOfGlobalPerformances[i] != PerformanceNA) ) {
                code_played_global_performance = listOfGlobalPerformances[i];
                code_played_found = true;
                break;
              }
            }
            if (!code_played_found) { // error to test
              throw new Error("NEW_ATTEMPT phase / performance of possible code played was not evaluated (" + codeHandler.codeToString(codesPlayed[currentAttemptNumber-1]) + ", " + currentAttemptNumber + ")");
            }
          }
          else {
            console.log("(perfeval#1 failed in " + ((new Date()).getTime() - startTime) + "ms)");
          }
        }
        else { // code played is not possible
          // Evaluate performances for possibleCodesForPerfEvaluation[currentAttemptNumber%2]:
          let startTime = (new Date()).getTime();
          best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, codesPlayed[currentAttemptNumber-1]);
          if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
            console.log("(perfeval#2: best performance: " + best_global_performance
                        + " / particular code performance: " + particularCodeGlobalPerformance
                        + " / " + ((new Date()).getTime() - startTime) + "ms)");
            if ((particularCodeGlobalPerformance == PerformanceNA) || (particularCodeGlobalPerformance == PerformanceUNKNOWN) || (particularCodeGlobalPerformance <= 0.01)) {
              throw new Error("NEW_ATTEMPT phase / invalid particularCodeGlobalPerformance");
            }
            code_played_global_performance = particularCodeGlobalPerformance;
          }
          else {
            console.log("(perfeval#2 failed in " + ((new Date()).getTime() - startTime) + "ms)");
          }
        }

        if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
          if ((best_global_performance == PerformanceNA) || (best_global_performance <= 0.01)) {
            throw new Error("NEW_ATTEMPT phase / invalid best_global_performance: " + best_global_performance);
          }
          if ((code_played_global_performance == PerformanceNA) || (code_played_global_performance == PerformanceUNKNOWN) || (code_played_global_performance <= 0.01)) {
            throw new Error("NEW_ATTEMPT phase / invalid code_played_global_performance: " + code_played_global_performance);
          }
          code_played_relative_perf = best_global_performance - code_played_global_performance;
          relative_perf_evaluation_done = true;
        }
        else { // performance evaluation failed
          best_global_performance = PerformanceUNKNOWN;
          code_played_relative_perf = PerformanceUNKNOWN;
          relative_perf_evaluation_done = false;
        }

        // Post-processing checks
        // **********************

        if (listOfGlobalPerformances.length != arraySizeAtInit) {
          throw new Error("NEW_ATTEMPT phase / listOfGlobalPerformances allocation was modified");
        }
        if (!check3DArraySizes(listsOfPossibleCodes, nbMaxDepth, nbMaxMarks, Math.ceil((arraySizeAtInit+nbOfCodesForSystematicEvaluation)*mem_reduc_factor/2.0) /* (code duplicated) */, mem_reduc_factor)) {
          throw new Error("NEW_ATTEMPT phase / listsOfPossibleCodes allocation was modified");
        }
        if (!check2DArraySizes(nbOfPossibleCodes, nbMaxDepth, nbMaxMarks)) {
          throw new Error("NEW_ATTEMPT phase / nbOfPossibleCodes allocation was modified");
        }

      }
      else {
        best_global_performance = PerformanceUNKNOWN;
        code_played_relative_perf = PerformanceUNKNOWN;
        relative_perf_evaluation_done = false;
      }

    }

    if (code_played_relative_perf == PerformanceNA) {
      throw new Error("NEW_ATTEMPT phase / code_played_relative_perf is NA");
    }

    // ***************
    // B.2) Update GUI
    // ***************

    while(new Date().getTime() < now + attempt_refresh_time_1 + attempt_refresh_time_2){}
    self.postMessage({'rsp_type': 'CODE_PLAYED_PERFORMANCE', 'relative_perf_p': code_played_relative_perf, 'best_global_performance_p': best_global_performance, 'relative_perf_evaluation_done_p': relative_perf_evaluation_done,  'code_p': codesPlayed[currentAttemptNumber-1], 'attempt_nb': currentAttemptNumber, 'game_id': game_id});

    // ************************************************
    // C.1) Organize performances of all possible codes
    // ************************************************

    if (nbMaxPossibleCodesShown > nbOfCodesForSystematicEvaluation) {
      throw new Error("NEW_ATTEMPT phase / inconsistent numbers of listed codes: " + nbMaxPossibleCodesShown + " > " + nbOfCodesForSystematicEvaluation);
    }
    let nb_codes_shown = Math.min(previousNbOfPossibleCodes, nbMaxPossibleCodesShown);
    for (let i = 0; i < nb_codes_shown; i++) {
      possibleCodesShown[i] = possibleCodesForPerfEvaluation[currentAttemptNumber%2][i];
      if (best_global_performance == PerformanceUNKNOWN) {
        globalPerformancesShown[i] = PerformanceUNKNOWN;
      }
      else {
        if ((listOfGlobalPerformances[i] == PerformanceNA) || (listOfGlobalPerformances[i] == PerformanceUNKNOWN) || (listOfGlobalPerformances[i] <= 0.01)) {
          throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (index " + i + ")");
        }
        globalPerformancesShown[i] = listOfGlobalPerformances[i];
      }
    }

    // ***************
    // C.2) Update GUI
    // ***************

    self.postMessage({'rsp_type': 'LIST_OF_POSSIBLE_CODES', 'possibleCodesList_p': possibleCodesShown.toString(), 'nb_possible_codes_listed': nb_codes_shown, 'globalPerformancesList_p': globalPerformancesShown.toString(), 'attempt_nb': currentAttemptNumber, 'game_id': game_id});

    // ****************
    // Defensive checks
    // ****************

    // Check if errors occurred when writing into arrays
    if ( (possibleCodesForPerfEvaluation[0].length != nbOfCodesForSystematicEvaluation)
         || (possibleCodesForPerfEvaluation[1].length != nbOfCodesForSystematicEvaluation) ) {
      throw new Error("inconsistent possibleCodesForPerfEvaluation length: " + possibleCodesForPerfEvaluation[0].length + ", " + possibleCodesForPerfEvaluation[1].length + ", " + nbOfCodesForSystematicEvaluation);
    }

  }

  // **********
  // Error case
  // **********

  else {
    throw new Error("unexpected req_type: " + data.req_type);
  }

  message_processing_ongoing = false;

}, false);
