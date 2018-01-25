
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

let possibleCodesAfterNAttempts;

let nbCodesForSystematicPerfEvaluation = 2000;

let currentAttemptNumber = 0;
let nbMaxAttemptsForEndOfGame = -1;
let message_processing_ongoing = false;

let refresh_time = 999;
let long_refresh_time = 999;

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

// *****************************************
// Fill a short initial possible codes table
// *****************************************

function fillShortInitialPossibleCodesTable(table, size_to_fill) {
 
  let code_tmp = 0;
  let cnt = 0; 
 
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

        for (let color1 = 1; color1 <= nbColors; color1++) {
          for (let color2 = 1; color2 <= nbColors; color2++) {
            for (let color3 = 1; color3 <= nbColors; color3++) {
              for (let color4 = 1; color4 <= nbColors; color4++) {
                for (let color5 = 1; color5 <= nbColors; color5++) {
                  for (let color6 = 1; color6 <= nbColors; color6++) {
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
        break;
      case 4:
        nbMaxMarks = 14;
        break;
      case 5:
        nbMaxMarks = 20;
        break;
      case 6:
        nbMaxMarks = 27;
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
        break;
      default:
        throw new Error("INIT phase / invalid nbColumns: " + nbColumns);
    }    
    
    // **********
    // Update GUI
    // **********
    
    colorsFoundCode = codeHandler.setAllColorsIdentical(emptyColor); // value at game start
    for (let color = 1; color <= nbColors; color++) { // values at game start
      minNbColorsTable[color] = 0;
      maxNbColorsTable[color] = nbColumns;
    }

    let now = new Date().getTime();    
    if (!first_session_game) {
      while(new Date().getTime() < now + refresh_time){}
    }
    else {
      while(new Date().getTime() < now + long_refresh_time){}
    }
    self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': initialNbPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': 1, 'game_id': game_id});

    let shortInitialPossibleCodesTable = new Array(nbMaxPossibleCodesShown);
    let nb_possible_codes_listed = fillShortInitialPossibleCodesTable(shortInitialPossibleCodesTable, nbMaxPossibleCodesShown);
    self.postMessage({'rsp_type': 'LIST_OF_POSSIBLE_CODES', 'possibleCodesList_p': shortInitialPossibleCodesTable.toString(), 'nb_possible_codes_listed': nb_possible_codes_listed, 'attempt_nb': 1, 'game_id': game_id});
    
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

    // ***************
    // Main processing
    // ***************

    let now = new Date().getTime();
    
    if (currentAttemptNumber == 1) { // first attempt
      possibleCodesAfterNAttempts = new OptimizedArrayList(Math.max(1 + Math.floor(initialNbPossibleCodes/nb_max_internal_lists), 5*nb_max_internal_lists));
    }

    let possibleCodes = new Array(nbMaxPossibleCodesShown);
    
    previousNbOfPossibleCodes = nextNbOfPossibleCodes;
    nextNbOfPossibleCodes = computeNbOfPossibleCodes(currentAttemptNumber+1, nbMaxPossibleCodesShown, possibleCodes);
    
    // **********
    // Update GUI
    // **********
    
    if (currentAttemptNumber+1 <= nbMaxAttemptsForEndOfGame) {
      while(new Date().getTime() < now + refresh_time){}      
      self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': nextNbOfPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': (currentAttemptNumber+1), 'game_id': game_id});
      self.postMessage({'rsp_type': 'LIST_OF_POSSIBLE_CODES', 'possibleCodesList_p': possibleCodes.toString(), 'nb_possible_codes_listed': Math.min(nextNbOfPossibleCodes, nbMaxPossibleCodesShown), 'attempt_nb': (currentAttemptNumber+1), 'game_id': game_id});      
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
