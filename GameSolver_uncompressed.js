// ***************************************
// ********** GameSolver script **********
// ***************************************

"use strict";

if (typeof debug_game_state !== 'undefined') {
  debug_game_state = 76;
}

// *************************************************************************
// *************************************************************************
// Global constants (shared between threads)
// *************************************************************************
// *************************************************************************

let emptyColor = 0; // (0 is also the Java default table init value)
let nbMinColors = 5;
let nbMaxColors = 10;
let nbMinColumns = 3;
let nbMaxColumns = 7;
let overallNbMinAttempts = 4;
let overallNbMaxAttempts = 15;
let overallMaxDepth = 15;

let PerformanceNA = -3.00;
let PerformanceUNKNOWN = -2.00;
let PerformanceMinValidValue = -1.60; // (a valid relative performance can be < -1.00 in some extremely rare cases / Value observed: -1.35 for 5-colmuns game {1B4W 12345; 1B4W 51234; 45123} (SCODE: 25314))
let PerformanceMaxValidValue = +1.30; // (a valid relative performance can be > 0.00 in some rare (impossible code) cases / Some values observed: +0.94 for 5-colmuns game {4B0W 11223; 11456}, +1.04 for 6-colmuns game {5B0W 112234; 112567}
let PerformanceLOW = -0.25;
let PerformanceVERYLOW = -0.50;

// *************************************************************************
// *************************************************************************
// Global CodeHandler class (shared between threads)
// *************************************************************************
// *************************************************************************

class CodeHandler {

  constructor(nbColumns_p, nbColors_p, nbMinColumns_p, nbMaxColumns_p, emptyColor_p, game_solver_call_p) {
    if ((nbColumns_p == undefined) || !Number.isInteger(nbColumns_p)) {
      throw new Error("CodeHandler: invalid nbColumns_p");
    }
    if ((nbColors_p == undefined) || !Number.isInteger(nbColors_p)) {
      throw new Error("CodeHandler: invalid nbColors_p");
    }
    if ((nbMinColumns_p == undefined) || !Number.isInteger(nbMinColumns_p)) {
      throw new Error("CodeHandler: invalid nbMinColumns_p");
    }
    if ((nbMaxColumns_p == undefined) || !Number.isInteger(nbMaxColumns_p)) {
      throw new Error("CodeHandler: invalid nbMaxColumns_p");
    }
    if ((emptyColor_p == undefined) || !Number.isInteger(emptyColor_p)) {
      throw new Error("CodeHandler: invalid emptyColor_p");
    }
    if ((game_solver_call_p == undefined) || ((game_solver_call_p != true) && (game_solver_call_p != false))) {
      throw new Error("CodeHandler: invalid game_solver_call_p");
    }

    if ( (nbColumns_p < Math.max(nbMinColumns_p,3)) || (nbColumns_p > Math.min(nbMaxColumns_p,7)) /* 3 and 7 is hardcoded in some methods of this class for better performances */ ) {
      throw new Error("CodeHandler: invalid nb of columns (" + nbColumns_p + ", " + nbMinColumns_p + "," + nbMaxColumns_p + ")");
    }
    if (nbColors_p < 0) {
      throw new Error("CodeHandler: invalid nb of colors: (" + nbColors_p + ")");
    }
    this.nbColumns = nbColumns_p;
    this.nbColors = nbColors_p;
    this.nbMinColumns = nbMinColumns_p;
    this.nbMaxColumns = nbMaxColumns_p;
    this.emptyColor = emptyColor_p;
    this.game_solver_call = game_solver_call_p;

    this.code1_colors = new Array(this.nbMaxColumns);
    this.code2_colors = new Array(this.nbMaxColumns);
    this.colors_int = new Array(this.nbMaxColumns);

    this.different_colors = new Array(this.nbColors+1);
    this.different_colors_bis = new Array(this.nbColors+1);

    // Attributes useful for getSMMCodeClassId() method:
    this.complete_game = new Array(overallNbMaxAttempts+1);
    this.different_game_colors_per_row = new Array(overallNbMaxAttempts+1);
    for (let i = 0; i < overallNbMaxAttempts+1; i++) {
      this.different_game_colors_per_row[i] = new Array(this.nbColors+1);
    }
    this.different_game_colors_per_column = new Array(this.nbColumns);
    for (let i = 0; i < this.nbColumns; i++) {
      this.different_game_colors_per_column[i] = new Array(this.nbColors+1);
    }
    this.color_correlation_matrix = new Array(this.nbColors+1);
    for (let i = 0; i < this.nbColors+1; i++) {
      this.color_correlation_matrix[i] = new Array(this.nbColors+1);
    }
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

  nbDifferentColors(code) {
    let sum = 0;
    this.different_colors.fill(0);
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      if (this.different_colors[color] == 0) {
        this.different_colors[color] = 1;
        sum = sum + 1;
      }
    }
    return sum;
  }

  nbDifferentColorsInListOfCodes(list_of_codes, nb_codes) {
    let sum = 0;
    this.different_colors.fill(0);
    for (let i = 0; i < nb_codes; i++) {
      for (let col = 0; col < this.nbColumns; col++) {
        let color = this.getColor(list_of_codes[i], col+1);
        if (this.different_colors[color] == 0) {
          this.different_colors[color] = 1;
          sum = sum + 1;
        }
      }
    }
    return sum;
  }

  sameColorsReused(code1, code2) {
    for (let col2 = 0; col2 < this.nbColumns; col2++) {
      let color2 = this.getColor(code2, col2+1);
      let colorReused = false;
      for (let col1 = 0; col1 < this.nbColumns; col1++) {
        if (color2 == this.getColor(code1, col1+1)) {
          colorReused = true;
          break;
        }
      }
      if (!colorReused) {
        return false;
      }
    }
    return true;
  }

  getSMMGameIdAfter2Attempts(code1, code2) {

    // ***** CODE DUPLICATED IN extractPrecalculatedPerfs.java ******

    if (this.nbColumns != 5) { // function only for Super Master Mind games
      throw new Error("CodeHandler: getGameIdFrom2Codes (" + this.nbColumns + ")");
    }

    let nbBlacks = 0;
    let nbWhites = 0;
    let col, col1, col2;

    this.colors_int[0] = true;
    this.colors_int[1] = true;
    this.colors_int[2] = true;
    this.colors_int[3] = true;
    this.colors_int[4] = true;
    this.code1_colors[0] = (code1 & 0x0000000F);
    this.code1_colors[1] = ((code1 >> 4) & 0x0000000F);
    this.code1_colors[2] = ((code1 >> 8) & 0x0000000F);
    this.code1_colors[3] = ((code1 >> 12) & 0x0000000F);
    this.code1_colors[4] = ((code1 >> 16) & 0x0000000F);
    this.code2_colors[0] = (code2 & 0x0000000F);
    this.code2_colors[1] = ((code2 >> 4) & 0x0000000F);
    this.code2_colors[2] = ((code2 >> 8) & 0x0000000F);
    this.code2_colors[3] = ((code2 >> 12) & 0x0000000F);
    this.code2_colors[4] = ((code2 >> 16) & 0x0000000F);

    this.different_colors.fill(0);
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.code1_colors[col];
      this.different_colors[color]++;
    }

    this.different_colors_bis.fill(0);
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.code2_colors[col];
      this.different_colors_bis[color]++;
    }

    // 1) Mark
    // (duplicated code from fillMark())
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
    let res1 = nbBlacks * 10 + nbWhites;

    // 2) Total number of colors
    let totalnbcolors = 0;
    for (let color = 1; color <= this.nbColors; color++) {
      if ((this.different_colors[color] > 0) || (this.different_colors_bis[color] > 0)) {
        totalnbcolors++;
      }
    }

    // 3) Ponderated color correspondance (does not vary when permuting columns)
    let res2 = 0;
    for (col = 0; col < this.nbColumns; col++) {
      let color1 = this.code1_colors[col];
      let color2 = this.code2_colors[col];
      let delta = this.different_colors[color1] * (this.different_colors_bis[color2] + 10)
                  * (this.different_colors[color2] + 100) * (this.different_colors_bis[color1] + 1000);
      res2 = res2 + delta;
    }

    let final_res = totalnbcolors + res1 * 10 + res2 * 1000;
    if (final_res <= 0) {
      throw new Error("CodeHandler: getSMMGameIdAfter2Attempts - invalid final_res value: " + final_res);
    }
    return final_res;

  }

  getSMMCodeClassId(code, game = null, game_size = 0) {

    if (this.nbColumns != 5) { // function only for Super Master Mind games
      throw new Error("CodeHandler: getSMMCodeClassId (" + this.nbColumns + ")");
    }

    this.different_colors.fill(0);
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      this.different_colors[color]++;
    }

    let extra_game_id = 0;
    if ((game != null) && (game_size >= 1)) {

      // Initializations
      // ***************

      let complete_game_size = game_size+1;
      if (complete_game_size > overallNbMaxAttempts+1) {
        throw new Error("CodeHandler: getSMMCodeClassId - internal error #1");
      }
      this.complete_game.fill(0);
      for (let i = 0; i < game_size; i++) {
        this.complete_game[i] = game[i];
      }
      this.complete_game[game_size] = code;

      for (let row = 0; row < complete_game_size; row++) {
        this.different_game_colors_per_row[row].fill(0);
        for (let col = 0; col < this.nbColumns; col++) {
          let color = this.getColor(this.complete_game[row], col+1);
          this.different_game_colors_per_row[row][color]++;
        }
      }

      for (let col = 0; col < this.nbColumns; col++) {
        this.different_game_colors_per_column[col].fill(0);
        for (let row = 0; row < complete_game_size; row++) {
          let color = this.getColor(this.complete_game[row], col+1);
          this.different_game_colors_per_column[col][color]++;
        }
      }

      for (let i = 0; i < this.nbColors+1; i++) {
        this.color_correlation_matrix[i].fill(0);
      }

      // Column-based color correlations
      // *******************************

      for (let col = 0; col < this.nbColumns; col++) {
        for (let row1 = 0; row1 < complete_game_size; row1++) {
          for (let row2 = 0; row2 < complete_game_size; row2++) {
            if (row1 < row2) { // Go through all pairs of colors in current column
              let color1 = this.getColor(this.complete_game[row1], col+1);
              let color2 = this.getColor(this.complete_game[row2], col+1);
              let color_min;
              let color_max;
              if (color1 <= color2) {
                color_min = color1;
                color_max = color2;
              }
              else {
                color_min = color2;
                color_max = color1;
              }
              let coef = ((row1+1) * 0xA26970) ^ ((row2+1) * 0xF14457) // (Rq: no permutations on rows)
                         ^ (this.different_game_colors_per_row[row1][color1] * 0x749841) ^ (this.different_game_colors_per_row[row2][color2] * 0x369874)
                         ^ (this.different_game_colors_per_row[row1][color2] * 0xB54796) ^ (this.different_game_colors_per_row[row2][color1] * 0x252241);
              if (color_min == color_max) {
                coef = coef ^ 0x5C1148;
              }
              this.color_correlation_matrix[color_min][color_max] = this.color_correlation_matrix[color_min][color_max] ^ coef;
            }
          }
        }
      }

      // Row-based color correlations
      // ****************************

      for (let row = 0; row < complete_game_size; row++) {
        for (let col1 = 0; col1 < this.nbColumns; col1++) {
          for (let col2 = 0; col2 < this.nbColumns; col2++) {
            if (col1 < col2) { // Go through all pairs of colors in current row
              let color1 = this.getColor(this.complete_game[row], col1+1);
              let color2 = this.getColor(this.complete_game[row], col2+1);
              let color_min;
              let color_max;
              if (color1 <= color2) {
                color_min = color1;
                color_max = color2;
              }
              else {
                color_min = color2;
                color_max = color1;
              }
              let common_mask_1 = 0xA49875;
              let common_mask_2 = 0xCE84F4;
              let coef = ((row+1) * 0x2A3698) // (Rq: no permutations on rows)
                         ^ (this.different_game_colors_per_column[col1][color1] * common_mask_1) ^ (this.different_game_colors_per_column[col2][color2] * common_mask_1)
                         ^ (this.different_game_colors_per_column[col2][color1] * common_mask_2) ^ (this.different_game_colors_per_column[col1][color2] * common_mask_2);
              if (color_min == color_max) {
                coef = coef ^ 0x533E16;
              }
              this.color_correlation_matrix[color_min][color_max] = this.color_correlation_matrix[color_min][color_max] ^ coef;
            }
          }
        }
      }

      // Color decorrelations
      // ********************

      for (let col1 = 0; col1 < this.nbColumns; col1++) {
        for (let row1 = 0; row1 < complete_game_size; row1++) {
          let color1 = this.getColor(this.complete_game[row1], col1+1);
          for (let col2 = 0; col2 < this.nbColumns; col2++) {
            if (col1 != col2) {
              for (let row2 = 0; row2 < complete_game_size; row2++) {
                if (row1 < row2) {
                  let color2 = this.getColor(this.complete_game[row2], col2+1);
                  if (color1 != color2) { // Go through all pairs of different colors not in current column and row
                    if ( (this.different_game_colors_per_row[row1][color2] == 0) && (this.different_game_colors_per_row[row2][color1] == 0)
                         && (this.different_game_colors_per_column[col1][color2] == 0) && (this.different_game_colors_per_column[col2][color1] == 0) ) {
                      let color_min;
                      let color_max;
                      if (color1 <= color2) {
                        color_min = color1;
                        color_max = color2;
                      }
                      else {
                        color_min = color2;
                        color_max = color1;
                      }
                      let coef = ((row1+1) * 0xB48725) ^ ((row2+1) * 0x67F428); // (Rq: no permutations on rows)
                      this.color_correlation_matrix[color_min][color_max] = this.color_correlation_matrix[color_min][color_max] ^ coef;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Unused colors
      // *************

      let nbUnusedColors = 0;
      for (let color = 1; color <= this.nbColors; color++) {
        let isColorUsedInCurrentGame = false;
        for (let row = 0; row < complete_game_size; row++) {
          for (let col = 0; col < this.nbColumns; col++) {
            if (color == this.getColor(this.complete_game[row], col+1)) {
              isColorUsedInCurrentGame = true;
              break;
            }
          }
          if (isColorUsedInCurrentGame) {
            break;
          }
        }
        if (!isColorUsedInCurrentGame) {
          nbUnusedColors = nbUnusedColors + 1;
        }
      }

      // Infer number from color correlation matrix
      // ******************************************

      for (let i = 0; i < this.nbColors+1; i++) {
        for (let j = 0; j < this.nbColors+1; j++) {
          extra_game_id = extra_game_id + this.color_correlation_matrix[i][j];
        }
      }
      if (extra_game_id <= 0) {
        throw new Error("CodeHandler: getSMMCodeClassId - internal error #2: " + extra_game_id);
      }
      extra_game_id = extra_game_id + nbUnusedColors * 444;
      if (extra_game_id != Math.floor(extra_game_id)) {
        throw new Error("CodeHandler: getSMMCodeClassId - internal error #3: " + extra_game_id);
      }

    }

    // Basic SMM code class ids: {100: 11111, 200: 11112, 300: 11122, 400: 11123, 500: 11223, 600: 11234, 700: 12345}
    let is_there_triple = false;
    let nb_doubles = 0;
    for (let color = 1; color <= this.nbColors; color++) {
      let nb_different_colors = this.different_colors[color];
      if (nb_different_colors == 2) {
        nb_doubles++;
      }
      else if (nb_different_colors == 3) {
        is_there_triple = true;
      }
      else if (nb_different_colors == 4) {
        return 200 + extra_game_id;
      }
      else if (nb_different_colors == 5) {
        return 100 + extra_game_id;
      }
    }
    if (is_there_triple) {
      if (nb_doubles == 0) {
        return 400 + extra_game_id;
      }
      else if (nb_doubles == 1) {
        return 300 + extra_game_id;
      }
      else {
        throw new Error("CodeHandler: getSMMCodeClassId - internal error #4");
      }
    }
    else {
      if (nb_doubles == 0) {
        return 700 + extra_game_id;
      }
      else if (nb_doubles == 1) {
        return 600 + extra_game_id;
      }
      else if (nb_doubles == 2) {
        return 500 + extra_game_id;
      }
      else {
        throw new Error("CodeHandler: getSMMCodeClassId - internal error #5");
      }
    }

  }

  isVerySimple(code) {
    this.different_colors.fill(0);
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      this.different_colors[color]++;
    }
    for (let color = 0; color <= this.nbColors; color++) {
      if (this.different_colors[color] == this.nbColumns) {
        return true; // "111...1" like codes
      }
      else if (this.different_colors[color] == this.nbColumns - 1) {
        return true; // "122...2" like codes
      }
    }
    return false;
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

  compressCodeToString(code) {
    let res = "";
    for (let col = 0; col < this.nbColumns; col++) {
      let color = this.getColor(code, col+1);
      res = res + color.toString(16).toUpperCase(); // (hexa number used if >= 10)
    }
    return res;
  }

  uncompressStringToCode(str) {
    let code = 0; // empty code
    if (str.length != this.nbColumns) {
      throw new Error("CodeHandler: uncompressStringToCode (1) (" + str + ")");
    }
    for (let col = 0; col < this.nbColumns; col++) {
      let color = Number("0x" + str.substring(col, col+1)); // (hexa number parsing)
      code = this.setColor(code, color, col+1);
    }
    if (!this.isFullAndValid(code)) {
      throw new Error("CodeHandler: uncompressStringToCode (2) (" + str + ")");
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

    // The below operations are unrolled for better performances (ruling out [5] and [6] index updates when this.nbColumns <= 5 does not bring measurable gains)
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

  stringToMark(str, mark) {
    if (str.length != 4) {
      throw new Error("CodeHandler: stringToMark (1) (" + str + ")");
    }
    let index_blacks = str.indexOf("B");
    if (index_blacks != 1) {
      throw new Error("CodeHandler: stringToMark (2) (" + str + ")");
    }
    let index_whites = str.indexOf("W", index_blacks);
    if (index_whites != 3) {
      throw new Error("CodeHandler: stringToMark (3) (" + str + ")");
    }
    mark.nbBlacks = Number(str.substring(0,1));
    mark.nbWhites = Number(str.substring(2,3));
    if (!this.isMarkValid(mark)) {
      throw new Error("CodeHandler: stringToMark (4) (" + str + ")");
    }
  }

  convert(code) {
    return ~code;
  }

}

if (typeof debug_game_state !== 'undefined') {
  debug_game_state = 76.1;
}

// ************************************************
// ************************************************
// ************************************************
let END_OF_COMMON_DEFINITIONS;
// ************************************************
// ************************************************
// ************************************************

if (typeof debug_game_state !== 'undefined') {
  debug_game_state = 76.2;
}

// *************************************************************************
// *************************************************************************
// GsCodeHandler class
// *************************************************************************
// *************************************************************************

class GsCodeHandler extends CodeHandler {

  constructor(nbColumns_p, nbColors_p, nbMinColumns_p, nbMaxColumns_p, emptyColor_p) {
    super(nbColumns_p, nbColors_p, nbMinColumns_p, nbMaxColumns_p, emptyColor_p, true);
  }

}

// *************************************************************************
// *************************************************************************
// GameSolver variables
// *************************************************************************
// *************************************************************************

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
let worst_mark_idx;

let possibleCodesAfterNAttempts;

let curAttemptNumber = 0;
let nbMaxAttemptsForEndOfGame = -1;
let message_processing_ongoing = false;
let IAmAliveMessageSent = false;

let buffer_incoming_messages = false;
let nb_incoming_messages_buffered = 0;
let incoming_messages_table = new Array(3*overallMaxDepth);

// Performance-related variables
// *****************************

let maxPerformanceEvaluationTime = -1;
let appliedMaxPerformanceEvaluationTime = -1;
let extraTimeForSimplisticGames = 30000; // 30 seconds
let maxAllowedExtraTime = 30000; // 30 seconds
let factorForMaxPerformanceEvaluationTime = 1000; // 1000 for 1 second - shall be much higher in (precalculation mode)

let refNbOfCodesForSystematicEvaluation = 3200; // (high values may induce latencies)
let refNbOfCodesForSystematicEvaluation_AllCodesEvaluated = 3200; // (shall be <= refNbOfCodesForSystematicEvaluation - high values may induce latencies)
let nbOfCodesForSystematicEvaluation = -1;
let nbOfCodesForSystematicEvaluation_AllCodesEvaluated = -1;
let nbOfCodesForSystematicEvaluation_ForMemAlloc = -1;

let refNbCodesLimitForMarkOptimization = 1500;
let nbCodesLimitForMarkOptimization = -1;

let initialNbClasses = -1;
let curNbClasses = -1;

let possibleCodesForPerfEvaluation;
let possibleCodesForPerfEvaluation_lastIndexWritten = -1;
let possibleCodesForPerfEvaluation_InitialIndexes = null;
let possibleCodesForPerfEvaluation_InitialCodesPt = null;
let possibleCodesForPerfEvaluation_OptimizedCodes = null;
// let initialCodeListForPrecalculatedMode; // (precalculation mode)

let mem_reduc_factor = 0.90; // (too low values can lead to dynamic memory allocations)
let maxDepth = -1;
let maxDepthApplied = -1;
let listOfClassIds = null;

let performanceListsInitDone = false;
let performanceListsInitDoneForPrecalculatedGames = false;
let arraySizeAtInit = -1;
let listOfGlobalPerformances;
let listsOfPossibleCodeIndexes;
let nbOfPossibleCodes;
let listOfEquivalentCodesAndPerformances;
let marks_already_computed_table = null;
let nbCodesLimitForEquivalentCodesCheck = 40; // (value determined empirically)
let tooLongTimeDetected = false;

let initialInitDone = false;
let curGame;
let curGameSize;
let marksIdxs;
let all_permutations_table_size;
let all_permutations_table;
let cur_permutations_table_size;
let cur_permutations_table;

// *************************************************************************
// *************************************************************************
// Game precalculation
// *************************************************************************
// *************************************************************************

let minNbCodesForPrecalculation = 270;
let nbCodesForPrecalculationThreshold = Math.max(refNbOfCodesForSystematicEvaluation, minNbCodesForPrecalculation); // (shall be in [minNbCodesForPrecalculation, refNbOfCodesForSystematicEvaluation])

let maxDepthForGamePrecalculation = -1; // (-1 or 3)
let maxDepthForGamePrecalculation_ForMemAlloc = 10;
let curGameForGamePrecalculation = new Array(maxDepthForGamePrecalculation_ForMemAlloc);
curGameForGamePrecalculation.fill(0); // empty code
let marksIdxsForGamePrecalculation = new Array(maxDepthForGamePrecalculation_ForMemAlloc);
marksIdxsForGamePrecalculation.fill(-1);

let lookForCodeInPrecalculatedGamesReuseTable = null;
let lookForCodeInPrecalculatedGamesClassIdsTable = null;
let lookForCodeInPrecalculatedGamesLastlineStr = null;

let precalculation_mode_mark = {nbBlacks:0, nbWhites:0};
let precalculation_mode_mark_first_2_codes_at_depth2 = {nbBlacks:0, nbWhites:0};

// ***************************************************************************************************************
// Precalculated table for 4 columns
// for minNbCodesForPrecalculation = 300, nbCodesForPrecalculationThreshold = 1296, precalculation_time >= 3.5 sec
// ***************************************************************************************************************

let precalculated_games_4columns =
  "0||N:1296|1111:13C7,1112:11C8,1122:1168,1123:110C,1234:115F.";

// ***************************************************************************************************************
// Precalculated table for 5 columns
// ***************************************************************************************************************

let precalculated_games_5columns =
  "0||N:32768|11111:28B03,11112:25A19,11122:24BF0,11123:24501,11223:23ED9,11234:23F55,12345:244BA."; // (precalculation mode: TBC with depth-2 or depth-3 precalculations)

// ***************************
// Look for precalculated game
// ***************************

let dotStr = ".";
let separatorStr = "|";
let separator2Str = ":";
let separator3Str = ",";
let nbCodesPrefixStr = "N:";
let precalculated_mark = {nbBlacks:0, nbWhites:0};
// Returned value:
// - > 0 if both game and code were precalculated
// - 0 if only game was precalculated
// - -1 if nothing was precalculated
function lookForCodeInPrecalculatedGames(code_p, cur_game_size, nb_possible_codes_p, reuse_mode) {

  if (cur_game_size > maxDepthForGamePrecalculation) {
    throw new Error("lookForCodeInPrecalculatedGames: invalid game size: " + cur_game_size);
  }

  if ((reuse_mode != 0) && (reuse_mode != 1) && (reuse_mode != 2)) {
    throw new Error("lookForCodeInPrecalculatedGames: invalid reuse_mode: " + reuse_mode);
  }

  let precalculated_games;
  switch (nbColumns) {
    case 4:
      precalculated_games = precalculated_games_4columns;
      break;
    case 5:
      precalculated_games = precalculated_games_5columns;
      break;
    default:
      throw new Error("lookForCodeInPrecalculatedGames: invalid nbColumns value: " + nbColumns);
  }

  let validLookForCodeInPrecalculatedGamesReuseTables = ((lookForCodeInPrecalculatedGamesReuseTable != null) && (lookForCodeInPrecalculatedGamesClassIdsTable != null));
  if (validLookForCodeInPrecalculatedGamesReuseTables) {
    if (reuse_mode == 1) {
      lookForCodeInPrecalculatedGamesReuseTable.fill(0);
      lookForCodeInPrecalculatedGamesClassIdsTable.fill(0);
      lookForCodeInPrecalculatedGamesLastlineStr = null;
    }
    else if (reuse_mode == 2) {
      if (lookForCodeInPrecalculatedGamesLastlineStr == null) {
        throw new Error("lookForCodeInPrecalculatedGames: null lookForCodeInPrecalculatedGamesLastlineStr");
      }
      precalculated_games = lookForCodeInPrecalculatedGamesLastlineStr;
    }
    else {
      lookForCodeInPrecalculatedGamesLastlineStr = null;
    }
  }
  else {
    lookForCodeInPrecalculatedGamesLastlineStr = null;
  }

  let dot_index = 0;
  let last_dot_index = 0;
  while ((dot_index = precalculated_games.indexOf(dotStr, last_dot_index)) != -1) {
    let line_str = precalculated_games.substring(last_dot_index, dot_index+1);
    let last_line_str_index = dot_index - last_dot_index;

    // Parse precalculated depth
    // *************************

    let separator_index1 = line_str.indexOf(separatorStr);
    let depth = Number(line_str.substring(0, separator_index1));
    if ((separator_index1 == -1) || isNaN(depth) || (depth < 0) || (depth > maxDepthForGamePrecalculation)) {
      throw new Error("lookForCodeInPrecalculatedGames: invalid depth: " + depth);
    }
    if (depth != cur_game_size) {
      // End of loop processing
      last_dot_index = dot_index+1;
      continue;
    }

    // Parse precalculated game
    // ************************

    let last_separator_index = separator_index1+1;
    if (cur_game_size == 0) {
      last_separator_index++;
    }
    else {
      for (let i = 0; i < cur_game_size; i++) {
        // Precalculated code
        let separator_index2 = line_str.indexOf(separator2Str, last_separator_index);
        let code_str = line_str.substring(last_separator_index, separator_index2);
        let code = codeHandler.uncompressStringToCode(code_str);
        // Precalculated mark
        let separator_index3 = line_str.indexOf(separatorStr, separator_index2+1);
        let mark_str = line_str.substring(separator_index2+1, separator_index3);
        codeHandler.stringToMark(mark_str, precalculated_mark);

        curGameForGamePrecalculation[i] = code;
        marksIdxsForGamePrecalculation[i] = marksTable_MarkToNb[precalculated_mark.nbBlacks][precalculated_mark.nbWhites];

        last_separator_index = separator_index3+1;
      }
    }

    // Check marks equivalence
    // ***********************

    let areAllMarksEqual = true;
    for (let i = 0; i < cur_game_size; i++) {
      if (marksIdxs[i] != marksIdxsForGamePrecalculation[i]) {
        areAllMarksEqual = false;
        break;
      }
    }
    if (!areAllMarksEqual) {
      // End of loop processing
      last_dot_index = dot_index+1;
      continue;
    }

    // Check game equivalence
    // **********************

    if (!areCodesEquivalent(0, 0, cur_game_size, true, -1 /* N.A. */, curGameForGamePrecalculation)) {
      // End of loop processing
      last_dot_index = dot_index+1;
      continue;
    }

    if (validLookForCodeInPrecalculatedGamesReuseTables && (reuse_mode == 1)) {
      lookForCodeInPrecalculatedGamesLastlineStr = line_str;
    }

    // Parse number of possible codes
    // ******************************

    let separator_index4 = line_str.indexOf(separatorStr, last_separator_index);
    let nb_possible_codes_str = line_str.substring(last_separator_index, separator_index4);
    if ((separator_index4 == -1) || (nb_possible_codes_str.indexOf(nbCodesPrefixStr) != 0)) {
      throw new Error("lookForCodeInPrecalculatedGames: invalid number of possible codes (1): " + nb_possible_codes_str);
    }
    nb_possible_codes_str = nb_possible_codes_str.substring(nbCodesPrefixStr.length);
    let nb_possible_codes = Number(nb_possible_codes_str);
    if (isNaN(nb_possible_codes) || (nb_possible_codes <= 0) || (nb_possible_codes > initialNbPossibleCodes)) {
      throw new Error("lookForCodeInPrecalculatedGames: invalid number of possible codes (2): " + nb_possible_codes_str);
    }
    if (nb_possible_codes <= nbCodesLimitForEquivalentCodesCheck) {
      throw new Error("lookForCodeInPrecalculatedGames: too low number of possible codes: " + nb_possible_codes_str);
    }
    if (nb_possible_codes != nb_possible_codes_p) {
      throw new Error("lookForCodeInPrecalculatedGames: invalid numbers of possible codes: " + nb_possible_codes + ", " + nb_possible_codes_p);
    }
    // console.log(nb_possible_codes);

    // Parse precalculated codes
    // *************************

    let codeClass1 = -1; // N.A.
    let reuse_optims = (validLookForCodeInPrecalculatedGamesReuseTables && (reuse_mode != 0));
    if (reuse_optims) {
      codeClass1 = codeHandler.getSMMCodeClassId(code_p, curGame, cur_game_size);
    }
    let precalculated_code_cnt = -1;
    let last_end_of_code_perf_pair_index = separator_index4+1;
    while (true) {
      precalculated_code_cnt++;

      let middle_of_code_perf_pair_index = line_str.indexOf(separator2Str, last_end_of_code_perf_pair_index);
      if (middle_of_code_perf_pair_index == -1) {
        throw new Error("lookForCodeInPrecalculatedGames: inconsistent code and perf pair: " + line_str);
      }

      let separator_index5 = line_str.indexOf(separator3Str, middle_of_code_perf_pair_index+1);
      if (separator_index5 == -1) {
        separator_index5 = line_str.indexOf(dotStr, middle_of_code_perf_pair_index+1);
        if (separator_index5 != last_line_str_index) {
          throw new Error("lookForCodeInPrecalculatedGames: inconsistent end of line: " + separator_index5 + ", " + last_line_str_index);
        }
      }

      // Check global game + code equivalence
      // console.log("assessed: " + compressed_str_from_lists_of_codes_and_markidxs(curGameForGamePrecalculation, marksIdxsForGamePrecalculation, cur_game_size) + " for code "  + codeHandler.codeToString(code));
      // console.log(" versus " + str_from_list_of_codes(curGame, cur_game_size) + " for code " + codeHandler.codeToString(code_p));
      if (!reuse_optims) {
        // Precalculated code
        let code_str = line_str.substring(last_end_of_code_perf_pair_index, middle_of_code_perf_pair_index);
        let code = codeHandler.uncompressStringToCode(code_str);
        if (areCodesEquivalent(code_p, code /* (shall be in second parameter) */, cur_game_size, false, -1 /* N.A. */, curGameForGamePrecalculation)) {
          // console.log("precalculated game found: " + compressed_str_from_lists_of_codes_and_markidxs(curGameForGamePrecalculation, marksIdxsForGamePrecalculation, cur_game_size));
          // Precalculated sum
          let sum_str = line_str.substring(middle_of_code_perf_pair_index+1, separator_index5);
          let sum = Number("0x" + sum_str); // (hexa number parsing)
          if (isNaN(sum) || (sum <= 0)) {
            throw new Error("lookForCodeInPrecalculatedGames: invalid sum: " + sum_str);
          }
          // console.log(codeHandler.codeToString(code) + ":" + sum + ",");
          return sum; // both game and code were precalculated - precalculated sum found
        }
      }
      else { // (validLookForCodeInPrecalculatedGamesReuseTables && reuse_mode == 1 or 2)
        if (lookForCodeInPrecalculatedGamesReuseTable[precalculated_code_cnt] == 0) {
          let code = 0;
          let codeClass2;
          if (lookForCodeInPrecalculatedGamesClassIdsTable[precalculated_code_cnt] == 0) {
            // Precalculated code
            let code_str = line_str.substring(last_end_of_code_perf_pair_index, middle_of_code_perf_pair_index);
            code = codeHandler.uncompressStringToCode(code_str);
            codeClass2 = codeHandler.getSMMCodeClassId(code, curGameForGamePrecalculation, cur_game_size);
            lookForCodeInPrecalculatedGamesClassIdsTable[precalculated_code_cnt] = codeClass2;
          }
          else {
            codeClass2 = lookForCodeInPrecalculatedGamesClassIdsTable[precalculated_code_cnt];
          }
          if (codeClass1 == codeClass2) {
            if (code == 0) {
              // Precalculated code
              let code_str = line_str.substring(last_end_of_code_perf_pair_index, middle_of_code_perf_pair_index);
              code = codeHandler.uncompressStringToCode(code_str);
            }
            if (areCodesEquivalent(code_p, code /* (shall be in second parameter) */, cur_game_size, false, -1 /* N.A. */, curGameForGamePrecalculation)) {
              // console.log("precalculated game found: " + compressed_str_from_lists_of_codes_and_markidxs(curGameForGamePrecalculation, marksIdxsForGamePrecalculation, cur_game_size));
              lookForCodeInPrecalculatedGamesReuseTable[precalculated_code_cnt] = 1;
              // Precalculated sum
              let sum_str = line_str.substring(middle_of_code_perf_pair_index+1, separator_index5);
              let sum = Number("0x" + sum_str); // (hexa number parsing)
              if (isNaN(sum) || (sum <= 0)) {
                throw new Error("lookForCodeInPrecalculatedGames: invalid sum: " + sum_str);
              }
              // console.log(codeHandler.codeToString(code) + ":" + sum + ",");
              return sum; // both game and code were precalculated - precalculated sum found
            }
          }
        }
      }

      // End of loop processing
      if (separator_index5 >= last_line_str_index) {
        break;
      }
      last_end_of_code_perf_pair_index = separator_index5+1;
    }

    // End of loop processing
    last_dot_index = dot_index+1;
    return 0; // only game was precalculated - no precalculated sum found

  } // end while

  return -1; // nothing was precalculated - no precalculated sum found

}

// *************************************************************************
// *************************************************************************
// Classes
// *************************************************************************
// *************************************************************************

// ********************************************************************************************************
// OptimizedArrayInternalList class (used by OptimizedArrayList)
// ********************************************************************************************************
class OptimizedArrayInternalList {
  constructor(granularity_p) {
    this.list = new Array(granularity_p);
  }
}

// **********************************************************************************************************
// OptimizedArrayList class: "ArrayList" of non-null integers optimized in terms of performances and memory.
// A classical use case of this class is the handling of a memory buffer whose size is significantly flexible
// (dynamic memory allocation instead of static allocation).
// **********************************************************************************************************
let nb_max_internal_lists = 100; // (100 means a 1% memory allocation flexibility)
class OptimizedArrayList {

  constructor(granularity_p) {
    if (granularity_p < 5*nb_max_internal_lists)  {
      throw new Error("OptimizedArrayList: invalid granularity: " + granularity_p);
    }

    this.granularity = granularity_p;
    this.nb_elements = 0;
    this.cur_add_list_idx = 0;
    this.cur_add_idx = 0;
    this.cur_get_list_idx = 0;
    this.cur_get_idx = 0;
    this.internal_lists = new Array(nb_max_internal_lists);
    this.internal_lists[0] = new OptimizedArrayInternalList(this.granularity);
  }

  clear() {
    this.nb_elements = 0;
    this.cur_add_list_idx = 0;
    this.cur_add_idx = 0;
    this.cur_get_list_idx = 0;
    this.cur_get_idx = 0;
    // Memory is not freed explicitly (no "this.internal_lists[x] = null" (or "this.internal_lists[x].list[y] = null": N.A. for int type))
    // => the tables allocated in memory will thus be reusable, which can fasten the processes
  }

  free() {
    this.nb_elements = 0;
    this.cur_add_list_idx = 0;
    this.cur_add_idx = 0;
    this.cur_get_list_idx = 0;
    this.cur_get_idx = 0;
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
    this.internal_lists[this.cur_add_list_idx].list[this.cur_add_idx] = value;
    this.nb_elements++;

    // Prepare next add
    if (this.cur_add_idx < this.granularity-1) {
      this.cur_add_idx++;
    }
    else {
      if (this.cur_add_list_idx >= nb_max_internal_lists-1) {
        throw new Error("OptimizedArrayList: array is full");
      }
      this.cur_add_list_idx++;
      if (this.internal_lists[this.cur_add_list_idx] == null) {
        this.internal_lists[this.cur_add_list_idx] = new OptimizedArrayInternalList(this.granularity);
      }
      this.cur_add_idx = 0;
    }

  }

  resetGetIterator() {
    this.cur_get_list_idx = 0;
    this.cur_get_idx = 0;
  }

  getNextElement(goToNext) {

    // Get next element
    if ( (this.cur_get_list_idx < this.cur_add_list_idx)
         || ( (this.cur_get_list_idx == this.cur_add_list_idx) && (this.cur_get_idx < this.cur_add_idx) ) ) {

      let value = this.internal_lists[this.cur_get_list_idx].list[this.cur_get_idx];

      // Prepare next get
      if (goToNext) {
        if (this.cur_get_idx < this.granularity-1) {
          this.cur_get_idx++;
        }
        else {
          this.cur_get_list_idx++;
          this.cur_get_idx = 0;
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
    if ( (this.cur_get_list_idx < this.cur_add_list_idx)
         || ( (this.cur_get_list_idx == this.cur_add_list_idx) && (this.cur_get_idx < this.cur_add_idx) ) ) {

      let value = this.internal_lists[this.cur_get_list_idx].list[this.cur_get_idx];
      if (value != value_ini_p) {
        throw new Error("OptimizedArrayList: replaceNextElement inconsistency (" + value + "," + value_ini_p + ")");
      }

      // Replace
      this.internal_lists[this.cur_get_list_idx].list[this.cur_get_idx] = value_p;

      // Prepare next get
      if (this.cur_get_idx < this.granularity-1) {
        this.cur_get_idx++;
      }
      else {
        this.cur_get_list_idx++;
        this.cur_get_idx = 0;
      }

    }
    else {
      throw new Error("OptimizedArrayList: replaceNextElement inconsistency");
    }

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
  if ( (attempt_nb <= 0) || (attempt_nb > curAttemptNumber) ) {
    throw new Error("isAttemptPossibleinGameSolver: invalid attempt_nb " + attempt_nb + ", " + curAttemptNumber);
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
    N = 4;
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
        if (attempt_nb >= 3) {
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

// *********************
// Generate permutations
// *********************

function generateAllPermutations() {

  all_permutations_table_size = new Array(nbMaxColumns+1);
  all_permutations_table_size.fill(0);
  all_permutations_table_size[3] = 3*2; // 3! permutations
  all_permutations_table_size[4] = 4*3*2; // 4! permutations
  all_permutations_table_size[5] = 5*4*3*2; // 5! permutations
  all_permutations_table_size[6] = 6*5*4*3*2; // 6! permutations
  all_permutations_table_size[7] = 7*6*5*4*3*2; // 7! permutations

  if (all_permutations_table_size[nbColumns] <= 0) {
    throw new Error("generateAllPermutations / error while computing all_permutations_table_size: " + nbColumns);
  }

  all_permutations_table = new Array(nbMaxColumns+1);
  for (let nb_elts = nbMinColumns; nb_elts <= nbMaxColumns; nb_elts++) {
    if (all_permutations_table_size[nb_elts] > 0) {
      all_permutations_table[nb_elts] = new Array(all_permutations_table_size[nb_elts]);
    }
  }

  let NB_ELEMENTS;
  let indexes = new Array(nbMaxColumns);
  let permutation_cnt = 0;

  switch (nbColumns) {

    case 3:

      // Generate permutations of 3 elements
      // ***********************************

      NB_ELEMENTS = 3;
      // console.log("// Permutations of " + NB_ELEMENTS + " elements:");
      for (indexes[0] = 0; indexes[0] < NB_ELEMENTS; indexes[0]++) {
        for (indexes[1] = 0; indexes[1] < NB_ELEMENTS; indexes[1]++) {
          for (indexes[2] = 0; indexes[2] < NB_ELEMENTS; indexes[2]++) { // NB_ELEMENTS loops
            // Check if {indexes[0], indexes[1], ... indexes[NB_ELEMENTS-1]} is a permutation
            let is_a_permutation = true;
            for (let idx1 = 0; (idx1 < NB_ELEMENTS) && is_a_permutation; idx1++) {
              for (let idx2 = 0; idx2 < NB_ELEMENTS; idx2++) {
                if ((idx1 != idx2) && (indexes[idx1] == indexes[idx2])) {
                  is_a_permutation = false;
                  break;
                }
              }
            }
            if (is_a_permutation) {
              all_permutations_table[NB_ELEMENTS][permutation_cnt] = [indexes[0], indexes[1], indexes[2]]; // NB_ELEMENTS elements
              // console.log("all_permutations_table[" + NB_ELEMENTS + "][" + permutation_cnt + "] = [" + indexes[0] + ", " + indexes[1] + ", " + indexes[2] + "];"); // NB_ELEMENTS elements
              permutation_cnt++;
            }
          }
        }
      }
      if (permutation_cnt != all_permutations_table_size[NB_ELEMENTS]) {
        throw new Error("generateAllPermutations / error while computing " + NB_ELEMENTS + "-elements permutations!");
      }
      break;

    case 4:

      // Generate permutations of 4 elements
      // ***********************************

      NB_ELEMENTS = 4;
      // console.log("// Permutations of " + NB_ELEMENTS + " elements:");
      for (indexes[0] = 0; indexes[0] < NB_ELEMENTS; indexes[0]++) {
        for (indexes[1] = 0; indexes[1] < NB_ELEMENTS; indexes[1]++) {
          for (indexes[2] = 0; indexes[2] < NB_ELEMENTS; indexes[2]++) {
            for (indexes[3] = 0; indexes[3] < NB_ELEMENTS; indexes[3]++) { // NB_ELEMENTS loops
              // Check if {indexes[0], indexes[1], ... indexes[NB_ELEMENTS-1]} is a permutation
              let is_a_permutation = true;
              for (let idx1 = 0; (idx1 < NB_ELEMENTS) && is_a_permutation; idx1++) {
                for (let idx2 = 0; idx2 < NB_ELEMENTS; idx2++) {
                  if ((idx1 != idx2) && (indexes[idx1] == indexes[idx2])) {
                    is_a_permutation = false;
                    break;
                  }
                }
              }
              if (is_a_permutation) {
                all_permutations_table[NB_ELEMENTS][permutation_cnt] = [indexes[0], indexes[1], indexes[2], indexes[3]]; // NB_ELEMENTS elements
                // console.log("all_permutations_table[" + NB_ELEMENTS + "][" + permutation_cnt + "] = [" + indexes[0] + ", " + indexes[1] + ", " + indexes[2] + ", " + indexes[3] + "];"); // NB_ELEMENTS elements
                permutation_cnt++;
              }
            }
          }
        }
      }
      if (permutation_cnt != all_permutations_table_size[NB_ELEMENTS]) {
        throw new Error("generateAllPermutations / error while computing " + NB_ELEMENTS + "-elements permutations!");
      }
      break;

    case 5:

      // Generate permutations of 5 elements
      // ***********************************

      NB_ELEMENTS = 5;
      // console.log("// Permutations of " + NB_ELEMENTS + " elements:");
      for (indexes[0] = 0; indexes[0] < NB_ELEMENTS; indexes[0]++) {
        for (indexes[1] = 0; indexes[1] < NB_ELEMENTS; indexes[1]++) {
          for (indexes[2] = 0; indexes[2] < NB_ELEMENTS; indexes[2]++) {
            for (indexes[3] = 0; indexes[3] < NB_ELEMENTS; indexes[3]++) {
              for (indexes[4] = 0; indexes[4] < NB_ELEMENTS; indexes[4]++) { // NB_ELEMENTS loops
                // Check if {indexes[0], indexes[1], ... indexes[NB_ELEMENTS-1]} is a permutation
                let is_a_permutation = true;
                for (let idx1 = 0; (idx1 < NB_ELEMENTS) && is_a_permutation; idx1++) {
                  for (let idx2 = 0; idx2 < NB_ELEMENTS; idx2++) {
                    if ((idx1 != idx2) && (indexes[idx1] == indexes[idx2])) {
                      is_a_permutation = false;
                      break;
                    }
                  }
                }
                if (is_a_permutation) {
                  all_permutations_table[NB_ELEMENTS][permutation_cnt] = [indexes[0], indexes[1], indexes[2], indexes[3], indexes[4]]; // NB_ELEMENTS elements
                  // console.log("all_permutations_table[" + NB_ELEMENTS + "][" + permutation_cnt + "] = [" + indexes[0] + ", " + indexes[1] + ", " + indexes[2] + ", " + indexes[3] + ", " + indexes[4] + "];"); // NB_ELEMENTS elements
                  permutation_cnt++;
                }
              }
            }
          }
        }
      }
      if (permutation_cnt != all_permutations_table_size[NB_ELEMENTS]) {
        throw new Error("generateAllPermutations / error while computing " + NB_ELEMENTS + "-elements permutations!");
      }
      break;

    case 6:

      // Generate permutations of 6 elements
      // ***********************************

      NB_ELEMENTS = 6;
      // console.log("// Permutations of " + NB_ELEMENTS + " elements:");
      for (indexes[0] = 0; indexes[0] < NB_ELEMENTS; indexes[0]++) {
        for (indexes[1] = 0; indexes[1] < NB_ELEMENTS; indexes[1]++) {
          for (indexes[2] = 0; indexes[2] < NB_ELEMENTS; indexes[2]++) {
            for (indexes[3] = 0; indexes[3] < NB_ELEMENTS; indexes[3]++) {
              for (indexes[4] = 0; indexes[4] < NB_ELEMENTS; indexes[4]++) {
                for (indexes[5] = 0; indexes[5] < NB_ELEMENTS; indexes[5]++) { // NB_ELEMENTS loops
                  // Check if {indexes[0], indexes[1], ... indexes[NB_ELEMENTS-1]} is a permutation
                  let is_a_permutation = true;
                  for (let idx1 = 0; (idx1 < NB_ELEMENTS) && is_a_permutation; idx1++) {
                    for (let idx2 = 0; idx2 < NB_ELEMENTS; idx2++) {
                      if ((idx1 != idx2) && (indexes[idx1] == indexes[idx2])) {
                        is_a_permutation = false;
                        break;
                      }
                    }
                  }
                  if (is_a_permutation) {
                    all_permutations_table[NB_ELEMENTS][permutation_cnt] = [indexes[0], indexes[1], indexes[2], indexes[3], indexes[4], indexes[5]]; // NB_ELEMENTS elements
                    // console.log("all_permutations_table[" + NB_ELEMENTS + "][" + permutation_cnt + "] = [" + indexes[0] + ", " + indexes[1] + ", " + indexes[2] + indexes[3] + ", " + indexes[4] + ", " + indexes[5] + "];"); // NB_ELEMENTS elements
                    permutation_cnt++;
                  }
                }
              }
            }
          }
        }
      }
      if (permutation_cnt != all_permutations_table_size[NB_ELEMENTS]) {
        throw new Error("generateAllPermutations / error while computing " + NB_ELEMENTS + "-elements permutations!");
      }
      break;

    case 7:

      // Generate permutations of 7 elements
      // ***********************************

      NB_ELEMENTS = 7;
      // console.log("// Permutations of " + NB_ELEMENTS + " elements:");
      for (indexes[0] = 0; indexes[0] < NB_ELEMENTS; indexes[0]++) {
        for (indexes[1] = 0; indexes[1] < NB_ELEMENTS; indexes[1]++) {
          for (indexes[2] = 0; indexes[2] < NB_ELEMENTS; indexes[2]++) {
            for (indexes[3] = 0; indexes[3] < NB_ELEMENTS; indexes[3]++) {
              for (indexes[4] = 0; indexes[4] < NB_ELEMENTS; indexes[4]++) {
                for (indexes[5] = 0; indexes[5] < NB_ELEMENTS; indexes[5]++) {
                  for (indexes[6] = 0; indexes[6] < NB_ELEMENTS; indexes[6]++) { // NB_ELEMENTS loops
                    // Check if {indexes[0], indexes[1], ... indexes[NB_ELEMENTS-1]} is a permutation
                    let is_a_permutation = true;
                    for (let idx1 = 0; (idx1 < NB_ELEMENTS) && is_a_permutation; idx1++) {
                      for (let idx2 = 0; idx2 < NB_ELEMENTS; idx2++) {
                        if ((idx1 != idx2) && (indexes[idx1] == indexes[idx2])) {
                          is_a_permutation = false;
                          break;
                        }
                      }
                    }
                    if (is_a_permutation) {
                      all_permutations_table[NB_ELEMENTS][permutation_cnt] = [indexes[0], indexes[1], indexes[2], indexes[3], indexes[4], indexes[5], indexes[6]]; // NB_ELEMENTS elements
                      // console.log("all_permutations_table[" + NB_ELEMENTS + "][" + permutation_cnt + "] = [" + indexes[0] + ", " + indexes[1] + ", " + indexes[2] + ", " + indexes[3] + ", " + indexes[4] + ", " + indexes[5] + ", " + indexes[6] + "];"); // NB_ELEMENTS elements
                      permutation_cnt++;
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (permutation_cnt != all_permutations_table_size[NB_ELEMENTS]) {
        throw new Error("generateAllPermutations / error while computing " + NB_ELEMENTS + "-elements permutations!");
      }
      break;

    default:
      throw new Error("generateAllPermutations / invalid nbColumns: " + nbColumns);

  }

  if ( (all_permutations_table_size.length != nbMaxColumns+1) || (permutation_cnt != all_permutations_table_size[nbColumns]) ) {
    throw new Error("generateAllPermutations / internal error");
  }

  // Update possible permutations
  // ****************************

  // All permutations are listed by default
  cur_permutations_table_size = new Array(overallNbMaxAttempts+overallMaxDepth);
  cur_permutations_table_size[0] = all_permutations_table_size[nbColumns];
  cur_permutations_table = new2DArray(overallNbMaxAttempts+overallMaxDepth, cur_permutations_table_size[0]);
  for (let i = 0; i < cur_permutations_table_size[0]; i++) {
    cur_permutations_table[0][i] = i;
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
    console.log("check2DArraySizes/0: " + my_array.length + " != " + x);
    return false;
  }
  for (let i = 0; i < my_array.length; i++) {
    if (my_array[i].length != y) {
      console.log("check2DArraySizes/1(" + i + "): " + my_array[i].length + " != " + y);
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
    console.log("check3DArraySizes/0: " + my_array.length + " != " + x);
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

function print_permutation_list(list, list_size) {
  let str = "";
  for (let i = 0; i < list_size; i++) {
    str = str + all_permutations_table[nbColumns][list[i]] + " | ";
  }
  str = "{" + str.trim() + "}";
  return str;
}

function str_from_list_of_codes(list, list_size) {
  let str = "";
  for (let i = 0; i < list_size; i++) {
    str = str + codeHandler.codeToString(list[i]) + " ";
  }
  str = "{" + str.trim() + "}";
  return str;
}

function compressed_str_from_lists_of_codes_and_markidxs(code_list, mark_idx_list, list_size) {
  if (list_size == 0) {
    return "";
  }
  else {
    let str = "";
    for (let i = 0; i < list_size-1; i++) {
      str = str + codeHandler.compressCodeToString(code_list[i]) + ":" + codeHandler.markToString(marksTable_NbToMark[mark_idx_list[i]]) + "|";
    }
    str = str + codeHandler.compressCodeToString(code_list[list_size-1]) + ":" + codeHandler.markToString(marksTable_NbToMark[mark_idx_list[list_size-1]]);
    return str;
  }
}

function send_trace_msg(trace_str) {
  self.postMessage({'rsp_type': 'TRACE', 'trace_contents': trace_str, 'game_id': game_id});
}

let code_colors = new Array(nbMaxColumns);
let other_code_colors = new Array(nbMaxColumns);
let different_colors_1 = new Array(nbMaxColors+1);
let different_colors_2 = new Array(nbMaxColors+1);
let cur_game_code_colors = new2DArray(overallNbMaxAttempts+overallMaxDepth, nbMaxColumns); // first dimension shall be >= curGame size
let other_game_code_colors = new2DArray(overallNbMaxAttempts+overallMaxDepth, nbMaxColumns); // first dimension shall be >= curGame size
let permuted_other_code_colors = new Array(nbMaxColumns);
let partial_bijection = new Array(nbMaxColors+1);
function areCodesEquivalent(code, other_code, cur_game_size, assess_cur_game_only, forceGlobalPermIdx /* -1 if N.A. */, otherGame /* null if N.A. */) {
  let all_permutations = all_permutations_table[nbColumns]; // [nb_permutations][nbColumns] array
  let global_perm_idx;
  let perm_idx;
  let cur_game_depth;
  let cur_game_code;
  let other_game_code;
  let cur_game_code_colors_set;
  let other_game_code_colors_set;
  let col;
  let color;
  let bijection_is_possible_for_this_permutation;
  let source_color, old_target_color, new_target_color;

  // *****************
  // Get useful colors
  // *****************

  // 2 codes colors
  if (!assess_cur_game_only) {

    // (duplicated code from getColor() for better performances - begin)
    code_colors[0] = (code & 0x0000000F);
    code_colors[1] = ((code >> 4) & 0x0000000F);
    code_colors[2] = ((code >> 8) & 0x0000000F);
    code_colors[3] = ((code >> 12) & 0x0000000F);
    code_colors[4] = ((code >> 16) & 0x0000000F);
    code_colors[5] = ((code >> 20) & 0x0000000F);
    code_colors[6] = ((code >> 24) & 0x0000000F);

    other_code_colors[0] = (other_code & 0x0000000F);
    other_code_colors[1] = ((other_code >> 4) & 0x0000000F);
    other_code_colors[2] = ((other_code >> 8) & 0x0000000F);
    other_code_colors[3] = ((other_code >> 12) & 0x0000000F);
    other_code_colors[4] = ((other_code >> 16) & 0x0000000F);
    other_code_colors[5] = ((other_code >> 20) & 0x0000000F);
    other_code_colors[6] = ((other_code >> 24) & 0x0000000F);
    // (duplicated code from getColor() for better performances - end)

    // Optimization
    // ************

    // (duplicated code from nbDifferentColors() for better performances - begin)
    let sum_1 = 0;
    let sum_2 = 0;
    different_colors_1.fill(0);
    different_colors_2.fill(0);
    for (col = 0; col < nbColumns; col++) {
      let color_1 = code_colors[col];
      let color_2 = other_code_colors[col];
      if (different_colors_1[color_1] == 0) {
        different_colors_1[color_1] = 1;
        sum_1 = sum_1 + 1;
      }
      if (different_colors_2[color_2] == 0) {
        different_colors_2[color_2] = 1;
        sum_2 = sum_2 + 1;
      }
    }
    // (duplicated code from nbDifferentColors() for better performances - end)
    if (sum_1 == sum_2) {
      if (cur_game_size == 0) {
        if (sum_1 == nbColumns-1) {
          return true; // 1 double and N-2 other different colors - at least one bijection exists between the 2 games
        }
        if (sum_1 == nbColumns) {
          return true; // N different colors - at least one bijection exists between the 2 games
        }
      }
    }
    else {
      return false; // no bijection exists between the 2 games
    }

  }

  // Game(s) colors
  for (cur_game_depth = 0; cur_game_depth < cur_game_size; cur_game_depth++) {
    cur_game_code = curGame[cur_game_depth];
    cur_game_code_colors_set = cur_game_code_colors[cur_game_depth]; // [nbMaxColumns] array

    // (duplicated code from getColor() for better performances - begin)
    cur_game_code_colors_set[0] = (cur_game_code & 0x0000000F);
    cur_game_code_colors_set[1] = ((cur_game_code >> 4) & 0x0000000F);
    cur_game_code_colors_set[2] = ((cur_game_code >> 8) & 0x0000000F);
    cur_game_code_colors_set[3] = ((cur_game_code >> 12) & 0x0000000F);
    cur_game_code_colors_set[4] = ((cur_game_code >> 16) & 0x0000000F);
    cur_game_code_colors_set[5] = ((cur_game_code >> 20) & 0x0000000F);
    cur_game_code_colors_set[6] = ((cur_game_code >> 24) & 0x0000000F);
    // (duplicated code from getColor() for better performances - end)
  }
  if (otherGame != null) {
    for (cur_game_depth = 0; cur_game_depth < cur_game_size; cur_game_depth++) {
      other_game_code = otherGame[cur_game_depth];
      other_game_code_colors_set = other_game_code_colors[cur_game_depth]; // another game is used - [nbMaxColumns] array

      // (duplicated code from getColor() for better performances - begin)
      other_game_code_colors_set[0] = (other_game_code & 0x0000000F);
      other_game_code_colors_set[1] = ((other_game_code >> 4) & 0x0000000F);
      other_game_code_colors_set[2] = ((other_game_code >> 8) & 0x0000000F);
      other_game_code_colors_set[3] = ((other_game_code >> 12) & 0x0000000F);
      other_game_code_colors_set[4] = ((other_game_code >> 16) & 0x0000000F);
      other_game_code_colors_set[5] = ((other_game_code >> 20) & 0x0000000F);
      other_game_code_colors_set[6] = ((other_game_code >> 24) & 0x0000000F);
      // (duplicated code from getColor() for better performances - end)
    }
  }

  // ************************************
  // Go through all possible permutations
  // ************************************

  let permLoopStartIdx = 0;
  let permLoopStopIdx;
  if (forceGlobalPermIdx != -1) { // Evaluate one given permutation only
    if ((forceGlobalPermIdx < 0) || (forceGlobalPermIdx >= all_permutations_table_size[nbColumns])) {
      throw new Error("areCodesEquivalent: invalid forceGlobalPermIdx: " + forceGlobalPermIdx);
    }
    permLoopStopIdx = 1; // one loop only
  }
  else if (otherGame == null) {
    permLoopStopIdx = cur_permutations_table_size[cur_game_size];
  }
  else { // (otherGame != null)
    permLoopStopIdx = cur_permutations_table_size[0]; // all permutations
  }

  if (permLoopStopIdx <= permLoopStartIdx) {
    throw new Error("areCodesEquivalent: no permutation");
  }

  for (perm_idx = permLoopStartIdx; perm_idx < permLoopStopIdx; perm_idx++) {

    if (forceGlobalPermIdx != -1) { // Evaluate one given permutation only
      global_perm_idx = forceGlobalPermIdx;
    }
    else if (otherGame == null) {
      global_perm_idx = cur_permutations_table[cur_game_size][perm_idx];
    }
    else { // (otherGame != null)
      global_perm_idx = cur_permutations_table[0][perm_idx]; // all permutations
    }
    // console.log("permutation:" + all_permutations[global_perm_idx]);

    // **********************************************************************
    // If possible, compute bijection between:
    // 1) code and permuted other code (if assess_cur_game_only is false)
    // 2) current game and permuted game
    // **********************************************************************

    bijection_is_possible_for_this_permutation = true;
    partial_bijection.fill(0);

    // 1) Bijection between code and permuted other code (if assess_cur_game_only is false)
    // ****************************************************************************************

    if (!assess_cur_game_only) {

      // Compute permuted other code
      for (col = 0; col < nbColumns; col++) {
        permuted_other_code_colors[all_permutations[global_perm_idx][col]] = other_code_colors[col];
      }

      // console.log("  permuted_other_code_colors = " + permuted_other_code_colors);

      for (col = 0; col < nbColumns; col++) {
        source_color = code_colors[col];
        old_target_color = partial_bijection[source_color];
        new_target_color = permuted_other_code_colors[col];
        if ((old_target_color != 0) && (old_target_color != new_target_color)) { // target color already allocated differently
          // console.log("  NOK1:" + old_target_color);
          bijection_is_possible_for_this_permutation = false;
          break;
        }
        for (color = 1; color <= nbColors; color++) {
          if ((color != source_color) && (partial_bijection[color] == new_target_color)) { // new target color already allocated to another source color
            // console.log("  NOK2");
            bijection_is_possible_for_this_permutation = false;
            break;
          }
        }
        if (!bijection_is_possible_for_this_permutation) {
          break;
        }
        // if (partial_bijection[source_color] != new_target_color) {
        //  console.log(source_color + " -> " + new_target_color);
        // }
        partial_bijection[source_color] = new_target_color;
      }

    }

    // 2) Bijection between current game and permuted game
    // ***************************************************

    if (bijection_is_possible_for_this_permutation) {

      for (cur_game_depth = cur_game_size-1; cur_game_depth >= 0; cur_game_depth--) { // (impacts on permutations are more likely for the last played codes)
        cur_game_code_colors_set = cur_game_code_colors[cur_game_depth]; // [nbMaxColumns] array
        if (otherGame == null) {
          other_game_code_colors_set = cur_game_code_colors_set; // currrent game is used twice - [nbMaxColumns] array
        }
        else { // (otherGame != null)
          other_game_code_colors_set = other_game_code_colors[cur_game_depth]; // another game is used - [nbMaxColumns] array
        }

        // Compute permuted other code
        for (col = 0; col < nbColumns; col++) {
          permuted_other_code_colors[all_permutations[global_perm_idx][col]] = other_game_code_colors_set[col];
        }

        // console.log("  permuted_other_code_colors = " + permuted_other_code_colors);

        for (col = 0; col < nbColumns; col++) {
          source_color = cur_game_code_colors_set[col];
          old_target_color = partial_bijection[source_color];
          new_target_color = permuted_other_code_colors[col];
          if ((old_target_color != 0) && (old_target_color != new_target_color)) { // target color already allocated differently
            // console.log("  NOK1B:" + old_target_color);
            bijection_is_possible_for_this_permutation = false;
            break;
          }
          for (color = 1; color <= nbColors; color++) {
            if ((color != source_color) && (partial_bijection[color] == new_target_color)) { // new target color already allocated to another source color
              // console.log("  NOK2B");
              bijection_is_possible_for_this_permutation = false;
              break;
            }
          }
          if (!bijection_is_possible_for_this_permutation) {
            break;
          }
          // if (partial_bijection[source_color] != new_target_color) {
          //  console.log(source_color + " -> " + new_target_color);
          // }
          partial_bijection[source_color] = new_target_color;
        }
      } // end loop on currrent game

    }

    if (bijection_is_possible_for_this_permutation) {
      return true; // at least one bijection exists between the 2 games
    }

  } // end loop on perm_idx

  return false; // no bijection exists between the 2 games
}

let evaluatePerformancesStartTime;

let mark_perf_tmp = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmpa = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmpb = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmpc = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmpd = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmpe = {nbBlacks:-1, nbWhites:-1}; // N.A.
let mark_perf_tmpf = {nbBlacks:-1, nbWhites:-1}; // N.A.

let currentCodeToAssess = 0; // empty code
let equivalentPossibleCode = 0; // empty code
let particularCodeToAssess = 0; // empty code
let particularCodeGlobalPerformance = PerformanceNA;
let recursiveEvaluatePerformancesWasAborted = false;
let performanceEvaluationAbortedStr = "PERFORMANCE EVALUATION ABORTED";

let areCurrentGameOrCodePrecalculated = -1;

// Outputs: listOfGlobalPerformances[]
//          particularCodeGlobalPerformance in case of impossible code
function evaluatePerformances(depth, listOfCodeIndexes, nbCodes, particularCode, areCurrentGameOrCodePrecalculated_p, nbOfClassesFirstCall_p) {

  let idx;
  let res = PerformanceNA;

  evaluatePerformancesStartTime = new Date().getTime();

  // Defensive check
  if ((best_mark_idx != marksTable_MarkToNb[nbColumns][0]) || (best_mark_idx >= nbMaxMarks)) {
    throw new Error("evaluatePerformances: invalid best_mark_idx");
  }
  if ((worst_mark_idx != marksTable_MarkToNb[0][0]) || (worst_mark_idx >= nbMaxMarks)) {
    throw new Error("evaluatePerformances: invalid worst_mark_idx");
  }
  if (curAttemptNumber <= 0) {
    throw new Error("evaluatePerformances: invalid curAttemptNumber: " + curAttemptNumber);
  }
  if ((nbCodes < 1) || (listOfCodeIndexes.length < nbCodes)) {
    throw new Error("evaluatePerformances: invalid number of codes: " + nbCodes + ", " + listOfCodeIndexes.length);
  }
  if ((nbCodes > nbCodesLimitForMarkOptimization) && (possibleCodesForPerfEvaluation_InitialCodesPt == null)) {
    throw new Error("null possibleCodesForPerfEvaluation_InitialCodesPt");
  }
  if ((nbCodes <= nbCodesLimitForMarkOptimization) && (possibleCodesForPerfEvaluation_InitialCodesPt != null)) {
    throw new Error("non-null possibleCodesForPerfEvaluation_InitialCodesPt");
  }
  if (possibleCodesForPerfEvaluation_OptimizedCodes == null) {
    throw new Error("null possibleCodesForPerfEvaluation_OptimizedCodes");
  }
  if (marks_already_computed_table == null) {
    throw new Error("null marks_already_computed_table");
  }

  areCurrentGameOrCodePrecalculated = areCurrentGameOrCodePrecalculated_p;

  if (depth == -1) { // first call

    // Check current game (useful for subsequent equivalent codes processing - duplicated code)
    if (curGameSize != curAttemptNumber-1) {
      throw new Error("evaluatePerformances: invalid curGameSize");
    }
    for (idx = 0; idx < curGameSize; idx++) {
      if ( (curGame[idx] != codesPlayed[idx]) || (!codeHandler.isFullAndValid(curGame[idx])) ) {
        throw new Error("evaluatePerformances: invalid current game (" + idx + ")");
      }
      if ( (!codeHandler.marksEqual(marksTable_NbToMark[marksIdxs[idx]], marks[idx])) || (!codeHandler.isMarkValid(marksTable_NbToMark[marksIdxs[idx]])) )  {
        throw new Error("evaluatePerformances: invalid currrent marks (" + idx + ")");
      }
    }

    curNbClasses = nbOfClassesFirstCall_p;
    if ( (curNbClasses <= 0) || (curNbClasses > nbCodes)
         || ((curGameSize == 0) && (curNbClasses != initialNbClasses)) ) {
      throw new Error("evaluatePerformances: invalid curNbClasses: " + curNbClasses);
    }

    // Initializations
    // ***************

    // Initialize equivalent codes and performances
    for (let idx1 = 0; idx1 < listOfEquivalentCodesAndPerformances.length; idx1++) {
      for (let idx2 = 0; idx2 < listOfEquivalentCodesAndPerformances[idx1].length; idx2++) {
        listOfEquivalentCodesAndPerformances[idx1][idx2].equiv_code = 0; // output
        listOfEquivalentCodesAndPerformances[idx1][idx2].equiv_sum = PerformanceNA; // output
      }
    }

    // Initialize outputs
    if (nbCodes != previousNbOfPossibleCodes) {
      throw new Error("evaluatePerformances: (nbCodes != previousNbOfPossibleCodes)");
    }
    for (idx = 0; idx < nbCodes; idx++) {
      listOfGlobalPerformances[idx] = PerformanceNA; // output
    }
    particularCodeGlobalPerformance = PerformanceNA; // output
    recursiveEvaluatePerformancesWasAborted = false; // output

    // Main processing
    // ***************

    currentCodeToAssess = codesPlayed[curAttemptNumber-1];
    equivalentPossibleCode = 0; // empty code

    particularCodeToAssess = particularCode;

    appliedMaxPerformanceEvaluationTime = maxPerformanceEvaluationTime;
    // Simplistic Super Master Mind game #1: very inefficient code played, few permutations left, no precalculation
    if ( (nbColumns == 5)
         && (curGameSize == 3)
         && ( ( (codeHandler.nbDifferentColors(curGame[0]) > 2)
                && (codeHandler.nbDifferentColors(curGame[1]) > 2)
                && (codeHandler.nbDifferentColors(curGame[2]) == 1) )
               || ( (codeHandler.nbDifferentColors(curGame[0]) > 2)
                    && (codeHandler.nbDifferentColors(curGame[2]) > 2)
                    && (codeHandler.nbDifferentColors(curGame[1]) == 1) )
               || ( (codeHandler.nbDifferentColors(curGame[1]) > 2)
                    && (codeHandler.nbDifferentColors(curGame[2]) > 2)
                    && (codeHandler.nbDifferentColors(curGame[0]) == 1) ) )
         && (codeHandler.nbDifferentColors(particularCode) <= 2)
         && (areCurrentGameOrCodePrecalculated < 0) ) {
      appliedMaxPerformanceEvaluationTime = appliedMaxPerformanceEvaluationTime
                                            + ((particularCode != 0 /* empty code */) && (codeHandler.nbDifferentColors(particularCode) == 1) ? extraTimeForSimplisticGames : extraTimeForSimplisticGames/2); // extra time for simplistic game
    }
    // Simplistic Super Master Mind game #2: very few colors played after many attempts, no precalculation
    if ( (nbColumns == 5)
         && (curGameSize == 4)
         && (codeHandler.nbDifferentColorsInListOfCodes(curGame, curGameSize) <= 3)
         && (codeHandler.nbDifferentColors(particularCode) <= 2)
         && (areCurrentGameOrCodePrecalculated < 0) ) {
      appliedMaxPerformanceEvaluationTime = appliedMaxPerformanceEvaluationTime
                                            + ((particularCode != 0 /* empty code */) ? extraTimeForSimplisticGames : extraTimeForSimplisticGames/2); // extra time for simplistic game
    }

    try {
      res = recursiveEvaluatePerformances(depth, listOfCodeIndexes, nbCodes /*,  true (precalculation mode) */);
    }
    catch (exc) {
      if (!recursiveEvaluatePerformancesWasAborted) {
        throw exc;
      }
    }

    if (recursiveEvaluatePerformancesWasAborted) {
      for (idx = 0; idx < nbCodes; idx++) {
        listOfGlobalPerformances[idx] = PerformanceNA; // output
      }
      particularCodeGlobalPerformance = PerformanceNA; // output
      return PerformanceUNKNOWN;
    }
    if (res <= 0.01) { // result is always known if the process was not aborted
      throw new Error("evaluatePerformances: invalid global performance: " + res);
    }
    return res;

  }
  else {
    throw new Error("evaluatePerformances: invalid depth: " + depth);
  }

}

function recursiveEvaluatePerformances(depth, listOfCodeIndexes, nbCodes /*, possibleGame (precalculation mode) */) {

  let first_call = (depth == -1);
  let next_depth = depth+1;
  let next_cur_game_idx = curGameSize + next_depth;
  let nextListsOfCodeIndexes;
  let nextNbsCodes;
  let nbOfEquivalentCodesAndPerformances = 0;
  let mark_idx, idx, idx1, idx2;
  let cur_code_idx;
  let cur_code;
  let other_code_idx;
  let other_code;
  let mark_perf_tmp_idx;
  let mark_optimization_mode = (nbCodes <= nbCodesLimitForMarkOptimization);
  let compute_sum_ini = (nbCodes <= nbCodesLimitForEquivalentCodesCheck);
  let compute_sum;
  let precalculated_cur_game_or_code = (first_call ? areCurrentGameOrCodePrecalculated : -1);
  let precalculated_sum;
  // let write_me; // (traces useful for debug)
  // let depth2or3 = 2 or 3; // (precalculation mode)
  // let write_me_for_precalculation; // (precalculation mode)
  // let precalculation_cnt = 0; // (precalculation mode)
  // let precalculation_cnt_tot = 0; // (precalculation mode)
  // let skip_lookfor = false; // (precalculation mode)
  let sum;
  let sum_marks;
  let best_sum = 100000000000.0;
  let nb_classes_cnt = 0;
  let reuse_mode = 1;

  /*
  // (precalculation mode)
  // Note: rules shall be more and more constraining when depth increases
  let precalculation_mode = ( (nbCodes >= minNbCodesForPrecalculation) // (**) only games for which there may not be enough CPU capacity / time to calculate performances online
                              && (next_cur_game_idx <= maxDepthForGamePrecalculation) // (-1 or 3)
                              && ( (next_cur_game_idx <= 1)
                                   || (next_cur_game_idx == 2)
                                   || ( (depth2or3 == 3) // (new possible depth-3 criterion, skipped when depth-2 is considered)
                                        && (next_cur_game_idx == 3) && (nbCodes >= 450)
                                        // simple games to reduce precalculation efforts + avoid too big precalculated files (can be an issue with only one file transfer at 2nd attempt)
                                        && ( (possibleGame && (codeHandler.nbDifferentColors(curGame[0]) <= 2) && (codeHandler.nbDifferentColors(curGame[1]) <= 2) && (codeHandler.nbDifferentColors(curGame[2]) <= 2))
                                             || ((codeHandler.nbDifferentColors(curGame[0]) <= 2) && codeHandler.isVerySimple(curGame[1]) && codeHandler.isVerySimple(curGame[2]))
                                             || ((codeHandler.nbDifferentColors(curGame[1]) <= 2) && codeHandler.isVerySimple(curGame[0]) && codeHandler.isVerySimple(curGame[2]))
                                             || ((codeHandler.nbDifferentColors(curGame[2]) <= 2) && codeHandler.isVerySimple(curGame[0]) && codeHandler.isVerySimple(curGame[1]))
                                             || ((nbCodes >= 700) && (codeHandler.nbDifferentColors(curGame[0]) == 1) && (codeHandler.nbDifferentColors(curGame[1]) == 1) && (codeHandler.nbDifferentColors(curGame[2]) > 2))
                                             || ((nbCodes >= 700) && (codeHandler.nbDifferentColors(curGame[0]) == 1) && (codeHandler.nbDifferentColors(curGame[2]) == 1) && (codeHandler.nbDifferentColors(curGame[1]) > 2))
                                             || ((nbCodes >= 700) && (codeHandler.nbDifferentColors(curGame[1]) == 1) && (codeHandler.nbDifferentColors(curGame[2]) == 1) && (codeHandler.nbDifferentColors(curGame[0]) > 2)) )
                                      )
                                 )
                              && (!compute_sum_ini) ); // not a leaf
  let str; // (precalculation mode)
  let precalculation_start_time; // (precalculation mode)
  if (precalculation_mode) { // (precalculation mode)
    let NAprefix = "";
    if ((depth2or3 == 3) && (next_cur_game_idx < 3)) {
      NAprefix = "N.A.";
    }
    str = NAprefix + next_cur_game_idx + "|" + compressed_str_from_lists_of_codes_and_markidxs(curGame, marksIdxs, next_cur_game_idx) + "|N:" + nbCodes + "|";
    let date = new Date();
    let dd = date.getDate();
    if(dd < 10) {
      dd = '0' + dd;
    }
    let mm = date.getMonth()+1;
    let yyyy = date.getFullYear();
    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();
    send_trace_msg("-" + str + "... " + dd + "/" + mm + "/" + yyyy + " " + hour + ":" + minutes + ":" + seconds);
    precalculation_start_time = new Date().getTime();
  } */

  // Initializations
  // ***************

  if (next_depth >= maxDepth) {
    throw new Error("recursiveEvaluatePerformances: max depth reached");
  }

  nextListsOfCodeIndexes = listsOfPossibleCodeIndexes[next_depth]; // [nbMaxMarks][n]
  nextNbsCodes = nbOfPossibleCodes[next_depth]; // [nbMaxMarks] array

  // Evaluate performances of possible codes
  // ***************************************

  /*
  let nbCodesToGoThrough = nbCodes; // (precalculation mode)
  if (precalculation_mode) { // (precalculation mode)
    nbCodesToGoThrough = nbCodesToGoThrough + initialNbPossibleCodes; // add also impossible codes
  }
  if (next_cur_game_idx == 2) {
    codeHandler.fillMark(curGame[0], curGame[1], precalculation_mode_mark_first_2_codes_at_depth2);
  }
  for (idx1 = 0; idx1 < nbCodesToGoThrough; idx1++) { // (precalculation mode)
    // Split precalculation if needed
    // - 4 coluns:
    //   0:  1111
    //   1:  1112
    //   7:  1122
    //   8:  1123
    //   51: 1234
    // - 5 coluns:
    //   0:  11111
    //   1:  11112
    //   9:  11122
    //   10: 11123
    //   74: 11223
    //   83: 11234
    //   668: 12345
    if (first_call && (idx1 != 83)) {
      continue;
    }
    if (idx1 < nbCodes) {
      cur_code_idx = listOfCodeIndexes[idx1];
      if (mark_optimization_mode) {
        cur_code = possibleCodesForPerfEvaluation_OptimizedCodes[cur_code_idx];
      }
      else {
        cur_code = possibleCodesForPerfEvaluation_InitialCodesPt[cur_code_idx];
      }
    }
    else {
      cur_code_idx = -2; // invalid value
      cur_code = initialCodeListForPrecalculatedMode[idx1 - nbCodes]; // (precalculation mode) / add also impossible codes
      // Precalculation optimization (1/3): skip current code if needed
      if (!precalculation_mode) {
        throw new Error("recursiveEvaluatePerformances: precalculation_mode error");
      }
      let skip_cur_code = false;
      let four_blacks = false;
      let all_four_blacks = true;
      for (let i = 0; i < next_cur_game_idx; i++) {
        // (replayed codes are addressed more generally below through useless codes, as all codes equivalent to replayed codes shall be covered to reach an optimization)
        if (cur_code == curGame[i]) {
          skip_cur_code = true; // code replayed
          break;
        }
        codeHandler.fillMark(cur_code, curGame[i], precalculation_mode_mark);
        if (precalculation_mode_mark.nbBlacks >= 4) {
          four_blacks = true;
        }
        else {
          all_four_blacks = false;
        }
        if (marksIdxs[i] == worst_mark_idx) { // 0 black + 0 white mark => all colors in this code are obviously impossible
          if ((precalculation_mode_mark.nbBlacks > 0) || (precalculation_mode_mark.nbWhites > 0)) {
            skip_cur_code = true; // obviously impossible color played
            break;
          }
        }
      }
      if (!skip_cur_code) {
        // "Nearly only logical codes" mode
        let nearly_only_logical_codes_from_depth2 = false;
        if ((next_cur_game_idx >= 2) && nearly_only_logical_codes_from_depth2) {
          if (next_cur_game_idx > 2) {
            skip_cur_code = true;
          }
          else if ( !((precalculation_mode_mark_first_2_codes_at_depth2.nbBlacks >= 4) && all_four_blacks)
                    && !((nbCodes >= 700) && (codeHandler.nbDifferentColors(cur_code) == 1)) ) { // a few classical very inefficient impossible codes
            skip_cur_code = true;
          }
        }
        else {
          // Precalculation optimization (2/3): skip impossible current code if acceptable (a few classical impossible codes are kept for better coverage)
          if ( (next_cur_game_idx == 2) && (nbCodes <= nbCodesForPrecalculationThreshold) // (below threshold)
               && !((nbCodes >= 700) && four_blacks) // a few classical very inefficient impossible codes (1 of 2)
               && !((nbCodes >= 700) && (codeHandler.nbDifferentColors(cur_code) == 1)) ) { // a few classical very inefficient impossible codes (2 of 2)
            skip_cur_code = true;
          }
          if ( (next_cur_game_idx == 2) && (nbCodes > nbCodesForPrecalculationThreshold) // (above threshold)
               && !(possibleGame && (codeHandler.nbDifferentColors(curGame[0]) <= 2)) // possible games
               && !((codeHandler.nbDifferentColors(curGame[0]) <= 2) && (codeHandler.nbDifferentColors(curGame[1]) <= 2)) // simple games => relatively reduced number of impossible codes
               && !((nbCodes >= 700) && (codeHandler.nbDifferentColors(curGame[0]) == 1) && (codeHandler.nbDifferentColors(curGame[1]) > 2))
               && !((nbCodes >= 700) && four_blacks) // same condition as above
               && !((nbCodes >= 700) && (codeHandler.nbDifferentColors(cur_code) <= 2)) ) { // more general than above condition for better coverage
            skip_cur_code = true; // simplification
          }
          if ( (next_cur_game_idx >= 3)
               && !((codeHandler.nbDifferentColors(curGame[0]) == 1) && (codeHandler.nbDifferentColors(curGame[1]) == 1) && (codeHandler.nbDifferentColors(curGame[2]) == 1)) ) { // (covers 11111|22222|33333-like games for which 3125 possibles codes can be left)
            skip_cur_code = true;
          }
        }
      }
      if (skip_cur_code) {
        continue; // skip current code
      }
    }
  */
  for (idx1 = 0; idx1 < nbCodes; idx1++) {
    cur_code_idx = listOfCodeIndexes[idx1];
    if (mark_optimization_mode) {
      cur_code = possibleCodesForPerfEvaluation_OptimizedCodes[cur_code_idx];
    }
    else {
      cur_code = possibleCodesForPerfEvaluation_InitialCodesPt[cur_code_idx];
    }

    /* if ((depth <= 1) && (!compute_sum_ini)) { // Specific trace
      console.log(spaces(depth) + "(depth " + depth + ") " + "CURRENT_CODE:" + codeHandler.codeToString(cur_code));
      console.log(spaces(depth) + "current game: " + str_from_list_of_codes(curGame, next_cur_game_idx));
      console.log(spaces(depth) + "perms: " + cur_permutations_table_size[next_cur_game_idx] + ": "
                  + print_permutation_list(cur_permutations_table[next_cur_game_idx], cur_permutations_table_size[next_cur_game_idx]));
    } */
    // write_me = false; // (traces useful for debug)
    // write_me_for_precalculation = false; // (precalculation mode)

    compute_sum = compute_sum_ini;
    // precalculated_sum = false; useless setting due to compute_sum setting
    if (!compute_sum) {
      let cur_code_class_id = ((listOfClassIds != null) ? listOfClassIds[cur_code] : 0);
      sum = 0.0;
      for (idx = 0; idx < nbOfEquivalentCodesAndPerformances; idx++) {
        let known_code = listOfEquivalentCodesAndPerformances[next_depth][idx].equiv_code;
        let known_code_class_id = ((listOfClassIds != null) ? listOfClassIds[known_code] : 0);
        if ((cur_code_class_id == known_code_class_id) && areCodesEquivalent(cur_code, known_code, next_cur_game_idx, false, -1 /* N.A. */, null)) {
          sum = listOfEquivalentCodesAndPerformances[next_depth][idx].equiv_sum;
          if (first_call && (cur_code == currentCodeToAssess)) {
            if (equivalentPossibleCode != 0) {
              throw new Error("recursiveEvaluatePerformances: several equivalent possible codes");
            }
            if (cur_code == known_code) {
              throw new Error("recursiveEvaluatePerformances: cur_code == known_code");
            }
            equivalentPossibleCode = known_code;
          }
          break;
        }
      }
      if (sum < 0.00) {
        throw new Error("recursiveEvaluatePerformances: negative sum (1): " + sum);
      }
      compute_sum = (sum == 0.0);

      precalculated_sum = false;
      if ( (precalculated_cur_game_or_code >= 0) // both game and code were precalculated OR only game was precalculated
           && compute_sum /* && (!precalculation_mode) */ ) { // (precalculation mode)
        sum = lookForCodeInPrecalculatedGames(cur_code, next_cur_game_idx, nbCodes, reuse_mode);
        if (sum > 0) { // precalculated sum found
          compute_sum = false;
          precalculated_sum = true;
          reuse_mode = 2;

          if (!compute_sum_ini) {
            listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_code = cur_code;
            listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_sum = sum;
            nbOfEquivalentCodesAndPerformances++;
          }
        }
        else { // no precalculated sum found
          throw new Error("recursiveEvaluatePerformances: cannot find precalculated game and code (possible code): " + codeHandler.codeToString(cur_code));
          // compute_sum = true;
        }
      }
      /* // (precalculation mode)
      else if ((next_cur_game_idx == depth2or3) && compute_sum && precalculation_mode && (!compute_sum_ini) && (!skip_lookfor)) { // Do not recalculate 2nd attempt sums if already calculated in the past
        let sum_tmp = lookForCodeInPrecalculatedGames(cur_code, next_cur_game_idx, nbCodes, reuse_mode);
        if (sum_tmp > 0) { // precalculated sum found
          sum = sum_tmp;
          compute_sum = false;
          precalculated_sum = true;
          reuse_mode = 2;

          if (!compute_sum_ini) {
            listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_code = cur_code;
            listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_sum = sum;
            nbOfEquivalentCodesAndPerformances++;
          }

          write_me_for_precalculation = true; // (precalculation mode)
          precalculation_cnt++;
        }
        else {
          // skip_lookfor = true;
          if (reuse_mode == 2) {
            // throw new Error("recursiveEvaluatePerformances: game completion inconsistency in precalculation mode: " + codeHandler.codeToString(cur_code));
          }
        }
        precalculation_cnt_tot++;
      }
      else if ( (next_cur_game_idx == depth2or3)
                && (next_cur_game_idx == 3) // only applied in case we exclusively focus on updating depth-3 precalculations, i.e. if depth2or3=3. Depth-2 precalculations will then be erroneous and shall be ignored.
                && (!precalculation_mode) ) { // skip all classical depth-3 cases where number of possibles code is low
        continue; // skip current code
      }
      */
    }

    if (compute_sum) { // compute_sum

      /* if (first_call) { // (traces useful for debug)
        console.log("assessed: " + codeHandler.codeToString(cur_code));
        write_me = true;
      } */
      // write_me_for_precalculation = true; // (precalculation mode)

      nextNbsCodes.fill(0); // (faster than (or close to) a loop on 0..nbMaxMarks-1)

      // Determine all possible marks for current code
      for (idx2 = 0; idx2 < nbCodes; idx2++) {
        other_code_idx = listOfCodeIndexes[idx2];
        if (/* (idx1 >= nbCodes) i.e. invalid cur_code_idx value in (precalculation mode) || */ (cur_code_idx != other_code_idx)) {
          if (mark_optimization_mode) {
            // if (idx1 >= nbCodes) i.e. invalid cur_code_idx value in (precalculation mode) { mark_perf_tmp_idx = -2; } else {below line}
            mark_perf_tmp_idx = marks_already_computed_table[cur_code_idx][other_code_idx];
            if (/* (idx1 >= nbCodes) i.e. invalid cur_code_idx value in (precalculation mode) || */ (mark_perf_tmp_idx < 0)) { // mark not computed yet
              other_code = possibleCodesForPerfEvaluation_OptimizedCodes[other_code_idx];
              codeHandler.fillMark(cur_code, other_code, mark_perf_tmp);
              mark_perf_tmp_idx = marksTable_MarkToNb[mark_perf_tmp.nbBlacks][mark_perf_tmp.nbWhites];
              nextListsOfCodeIndexes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]] = other_code_idx;
              nextNbsCodes[mark_perf_tmp_idx]++;
              // if (idx1 < nbCodes) { // i.e. valid cur_code_idx value in (precalculation mode)
              //   if (mark_perf_tmp_idx < 0) {throw new Error("mark_perf_tmp_idx < 0");} // (precalculation mode)
              marks_already_computed_table[cur_code_idx][other_code_idx] = mark_perf_tmp_idx;
              marks_already_computed_table[other_code_idx][cur_code_idx] = mark_perf_tmp_idx; // symmetrical filling
              // }  // (precalculation mode)
            }
            else { // mark already computed
              nextListsOfCodeIndexes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]] = other_code_idx;
              nextNbsCodes[mark_perf_tmp_idx]++;
            }
          }
          else {
            other_code = possibleCodesForPerfEvaluation_InitialCodesPt[other_code_idx];
            codeHandler.fillMark(cur_code, other_code, mark_perf_tmp);
            mark_perf_tmp_idx = marksTable_MarkToNb[mark_perf_tmp.nbBlacks][mark_perf_tmp.nbWhites];
            nextListsOfCodeIndexes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]] = other_code_idx;
            nextNbsCodes[mark_perf_tmp_idx]++;
          }
        }
        else {
          nextListsOfCodeIndexes[best_mark_idx][nextNbsCodes[best_mark_idx]] = other_code_idx;
          nextNbsCodes[best_mark_idx]++;
        }
      }

      // Assess current code
      sum = 0.0;
      sum_marks = 0;

      // let useless_cur_code = false; // (precalculation mode)
      for (mark_idx = nbMaxMarks-1; mark_idx >= 0; mark_idx--) {
        let nextNbCodes = nextNbsCodes[mark_idx];
        // Go through all sets of possible marks
        if (nextNbCodes > 0) {

          /* if (nextNbCodes == nbCodes) { // (precalculation mode)
            useless_cur_code = true;
            break;
          } */

          sum_marks += nextNbCodes;
          if (mark_idx == best_mark_idx) { // Note: handling it outside the loop does not bring measurable gains
            // sum = sum + 0.0; // 1.0 * 0.0 = 0.0
            if (sum_marks == nbCodes) break;
          }
          else if (nextNbCodes == 1) {
            sum = sum + 1.0; // 1.0 * 1.0 = 1.0
            if (sum_marks == nbCodes) break;
          }
          else if (nextNbCodes == 2) {
            sum = sum + 3.0; // 2 * 1.5 = 3.0
            if (sum_marks == nbCodes) break;
          }
          else if (nextNbCodes == 3) {
            let nextListOfCodeIndexesToConsider = nextListsOfCodeIndexes[mark_idx];
            let code_idx0 = nextListOfCodeIndexesToConsider[0];
            let code_idx1 = nextListOfCodeIndexesToConsider[1];
            let code_idx2 = nextListOfCodeIndexesToConsider[2];
            if (mark_optimization_mode) {
              let mark_a_idx = marks_already_computed_table[code_idx0][code_idx1];
              if (mark_a_idx < 0) { // mark not computed yet
                codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx0], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx1], mark_perf_tmpa); // a
                mark_a_idx = marksTable_MarkToNb[mark_perf_tmpa.nbBlacks][mark_perf_tmpa.nbWhites];
                marks_already_computed_table[code_idx0][code_idx1] = mark_a_idx;
                marks_already_computed_table[code_idx1][code_idx0] = mark_a_idx; // symmetrical filling
              }
              let mark_b_idx = marks_already_computed_table[code_idx0][code_idx2];
              if (mark_b_idx < 0) { // mark not computed yet
                codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx0], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx2], mark_perf_tmpb); // b
                mark_b_idx = marksTable_MarkToNb[mark_perf_tmpb.nbBlacks][mark_perf_tmpb.nbWhites];
                marks_already_computed_table[code_idx0][code_idx2] = mark_b_idx;
                marks_already_computed_table[code_idx2][code_idx0] = mark_b_idx; // symmetrical filling
              }
              if (mark_a_idx == mark_b_idx) {
                let mark_c_idx = marks_already_computed_table[code_idx1][code_idx2];
                if (mark_c_idx < 0) { // mark not computed yet
                  codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx1], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx2], mark_perf_tmpc); // c
                  mark_c_idx = marksTable_MarkToNb[mark_perf_tmpc.nbBlacks][mark_perf_tmpc.nbWhites];
                  marks_already_computed_table[code_idx1][code_idx2] = mark_c_idx;
                  marks_already_computed_table[code_idx2][code_idx1] = mark_c_idx; // symmetrical filling
                }
                if (mark_a_idx == mark_c_idx) {
                  sum = sum + 6.0; // 3 * ((1+2+3)/3.0) = 6.0
                }
                else {
                  sum = sum + 5.0; // 3 * ((1+2+2)/3.0) = 5.0
                }
              }
              else {
                sum = sum + 5.0; // 3 * ((1+2+2)/3.0) = 5.0
              }
            }
            else {
              codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx0], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx1], mark_perf_tmpa); // a
              codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx0], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx2], mark_perf_tmpb); // b
              if ((mark_perf_tmpa.nbBlacks == mark_perf_tmpb.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpb.nbWhites)) {
                codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx1], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx2], mark_perf_tmpc); // c
                if ((mark_perf_tmpa.nbBlacks == mark_perf_tmpc.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpc.nbWhites)) {
                  sum = sum + 6.0; // 3 * ((1+2+3)/3.0) = 6.0
                }
                else {
                  sum = sum + 5.0; // 3 * ((1+2+2)/3.0) = 5.0
                }
              }
              else {
                sum = sum + 5.0; // 3 * ((1+2+2)/3.0) = 5.0
              }
            }
            if (sum_marks == nbCodes) break;
          }
          else if (nextNbCodes == 4) {
            // An optimal code being played, if it is not the secret code, can lead to:
            // a) 3 groups of 1 code => obviously optimal (performance will be 1+2+2+2=7).
            // b) 1 group of 3 codes => at best, the performance will be 1+2+3+3=9. Thus there can't be any other c) case for the other codes
            //    (because performance would be 8 < 9), which means all marks are equal for the 6 pairs of codes (performance will be 1+2+3+4=10).
            // c) 1 group of 1 code and 1 group of 2 codes (performance will be 1+2+2+3=8).

            let nextListOfCodeIndexesToConsider = nextListsOfCodeIndexes[mark_idx];
            let code_idx0 = nextListOfCodeIndexesToConsider[0];
            let code_idx1 = nextListOfCodeIndexesToConsider[1];
            let code_idx2 = nextListOfCodeIndexesToConsider[2];
            let code_idx3 = nextListOfCodeIndexesToConsider[3];
            if (mark_optimization_mode) {
              let mark_a_idx = marks_already_computed_table[code_idx0][code_idx1];
              if (mark_a_idx < 0) { // mark not computed yet
                codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx0], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx1], mark_perf_tmpa); // a
                mark_a_idx = marksTable_MarkToNb[mark_perf_tmpa.nbBlacks][mark_perf_tmpa.nbWhites];
                marks_already_computed_table[code_idx0][code_idx1] = mark_a_idx;
                marks_already_computed_table[code_idx1][code_idx0] = mark_a_idx; // symmetrical filling
              }

              let mark_b_idx = marks_already_computed_table[code_idx0][code_idx2];
              if (mark_b_idx < 0) { // mark not computed yet
                codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx0], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx2], mark_perf_tmpb); // b
                mark_b_idx = marksTable_MarkToNb[mark_perf_tmpb.nbBlacks][mark_perf_tmpb.nbWhites];
                marks_already_computed_table[code_idx0][code_idx2] = mark_b_idx;
                marks_already_computed_table[code_idx2][code_idx0] = mark_b_idx; // symmetrical filling
              }

              let mark_c_idx = marks_already_computed_table[code_idx0][code_idx3];
              if (mark_c_idx < 0) { // mark not computed yet
                codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx0], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx3], mark_perf_tmpc); // c
                mark_c_idx = marksTable_MarkToNb[mark_perf_tmpc.nbBlacks][mark_perf_tmpc.nbWhites];
                marks_already_computed_table[code_idx0][code_idx3] = mark_c_idx;
                marks_already_computed_table[code_idx3][code_idx0] = mark_c_idx; // symmetrical filling
              }

              let a_b = (mark_a_idx == mark_b_idx);
              let a_c = (mark_a_idx == mark_c_idx);
              let b_c = (mark_b_idx == mark_c_idx);
              if ((!a_b) && (!a_c) && (!b_c)) { // a) 3 different marks when code 0 is played
                sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
              }
              else {
                let mark_d_idx = marks_already_computed_table[code_idx1][code_idx2];
                if (mark_d_idx < 0) { // mark not computed yet
                  codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx1], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx2], mark_perf_tmpd); // d
                  mark_d_idx = marksTable_MarkToNb[mark_perf_tmpd.nbBlacks][mark_perf_tmpd.nbWhites];
                  marks_already_computed_table[code_idx1][code_idx2] = mark_d_idx;
                  marks_already_computed_table[code_idx2][code_idx1] = mark_d_idx; // symmetrical filling
                }

                let mark_e_idx = marks_already_computed_table[code_idx1][code_idx3];
                if (mark_e_idx < 0) { // mark not computed yet
                  codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx1], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx3], mark_perf_tmpe); // e
                  mark_e_idx = marksTable_MarkToNb[mark_perf_tmpe.nbBlacks][mark_perf_tmpe.nbWhites];
                  marks_already_computed_table[code_idx1][code_idx3] = mark_e_idx;
                  marks_already_computed_table[code_idx3][code_idx1] = mark_e_idx; // symmetrical filling
                }

                let mark_f_idx = marks_already_computed_table[code_idx2][code_idx3];
                if (mark_f_idx < 0) { // mark not computed yet
                  codeHandler.fillMark(possibleCodesForPerfEvaluation_OptimizedCodes[code_idx2], possibleCodesForPerfEvaluation_OptimizedCodes[code_idx3], mark_perf_tmpf); // f
                  mark_f_idx = marksTable_MarkToNb[mark_perf_tmpf.nbBlacks][mark_perf_tmpf.nbWhites];
                  marks_already_computed_table[code_idx2][code_idx3] = mark_f_idx;
                  marks_already_computed_table[code_idx3][code_idx2] = mark_f_idx; // symmetrical filling
                }

                let a_d = (mark_a_idx == mark_d_idx);
                let a_e = (mark_a_idx == mark_e_idx);
                let a_f = (mark_a_idx == mark_f_idx);
                if (a_b && a_c && a_d && a_e && a_f) { // b) all marks are equal
                  sum = sum + 10.0; // 4 * ((1+2+3+4)/4.0)
                }
                else {
                  let d_e = (mark_d_idx == mark_e_idx);
                  if ((!a_d) && (!a_e) && (!d_e)) { // a) 3 different marks when code 1 is played
                    sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
                  }
                  else {
                    let c_e = (mark_c_idx == mark_e_idx);
                    let c_f = (mark_c_idx == mark_f_idx);
                    let e_f = (mark_e_idx == mark_f_idx);
                    if ((!c_e) && (!c_f) && (!e_f)) { // a) 3 different marks when code 3 is played
                      sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
                    }
                    else {
                      let b_d = (mark_b_idx == mark_d_idx);
                      let b_f = (mark_b_idx == mark_f_idx);
                      let d_f = (mark_d_idx == mark_f_idx);
                      if ((!b_d) && (!b_f) && (!d_f)) { // a) 3 different marks when code 2 is played
                        sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
                      }
                      else {
                        // c) after an optimal code is played, if it is not the secret code, there will be 1 group of 1 code and 1 group of 2 codes
                        sum = sum + 8.0; // 4 * ((1+2+2+3)/4.0)
                      }
                    }
                  }
                }
              }
            }
            else {
              // Note: the algorithms to handle other recursive leaf cases (5+n possible remaining codes, n small) could be generated automatically
              //       by a program going through all possible inter-code mark relations with just an equality/difference criterion considered on marks:
              //       not done to simplify (gain was ~15% for the 4-leaf case).
              codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx0], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx1], mark_perf_tmpa); // a
              codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx0], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx2], mark_perf_tmpb); // b
              codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx0], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx3], mark_perf_tmpc); // c
              let a_b = ((mark_perf_tmpa.nbBlacks == mark_perf_tmpb.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpb.nbWhites));
              let a_c = ((mark_perf_tmpa.nbBlacks == mark_perf_tmpc.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpc.nbWhites));
              let b_c = ((mark_perf_tmpb.nbBlacks == mark_perf_tmpc.nbBlacks) && (mark_perf_tmpb.nbWhites == mark_perf_tmpc.nbWhites));
              if ((!a_b) && (!a_c) && (!b_c)) { // a) 3 different marks when code 0 is played
                sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
              }
              else {
                codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx1], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx2], mark_perf_tmpd); // d
                codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx1], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx3], mark_perf_tmpe); // e
                codeHandler.fillMark(possibleCodesForPerfEvaluation_InitialCodesPt[code_idx2], possibleCodesForPerfEvaluation_InitialCodesPt[code_idx3], mark_perf_tmpf); // f
                let a_d = ((mark_perf_tmpa.nbBlacks == mark_perf_tmpd.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpd.nbWhites));
                let a_e = ((mark_perf_tmpa.nbBlacks == mark_perf_tmpe.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpe.nbWhites));
                let a_f = ((mark_perf_tmpa.nbBlacks == mark_perf_tmpf.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpf.nbWhites));
                if (a_b && a_c && a_d && a_e && a_f) { // b) all marks are equal
                  sum = sum + 10.0; // 4 * ((1+2+3+4)/4.0)
                }
                else {
                  let d_e = ((mark_perf_tmpd.nbBlacks == mark_perf_tmpe.nbBlacks) && (mark_perf_tmpd.nbWhites == mark_perf_tmpe.nbWhites));
                  if ((!a_d) && (!a_e) && (!d_e)) { // a) 3 different marks when code 1 is played
                    sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
                  }
                  else {
                    let c_e = ((mark_perf_tmpc.nbBlacks == mark_perf_tmpe.nbBlacks) && (mark_perf_tmpc.nbWhites == mark_perf_tmpe.nbWhites));
                    let c_f = ((mark_perf_tmpc.nbBlacks == mark_perf_tmpf.nbBlacks) && (mark_perf_tmpc.nbWhites == mark_perf_tmpf.nbWhites));
                    let e_f = ((mark_perf_tmpe.nbBlacks == mark_perf_tmpf.nbBlacks) && (mark_perf_tmpe.nbWhites == mark_perf_tmpf.nbWhites));
                    if ((!c_e) && (!c_f) && (!e_f)) { // a) 3 different marks when code 3 is played
                      sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
                    }
                    else {
                      let b_d = ((mark_perf_tmpb.nbBlacks == mark_perf_tmpd.nbBlacks) && (mark_perf_tmpb.nbWhites == mark_perf_tmpd.nbWhites));
                      let b_f = ((mark_perf_tmpb.nbBlacks == mark_perf_tmpf.nbBlacks) && (mark_perf_tmpb.nbWhites == mark_perf_tmpf.nbWhites));
                      let d_f = ((mark_perf_tmpd.nbBlacks == mark_perf_tmpf.nbBlacks) && (mark_perf_tmpd.nbWhites == mark_perf_tmpf.nbWhites));
                      if ((!b_d) && (!b_f) && (!d_f)) { // a) 3 different marks when code 2 is played
                        sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
                      }
                      else {
                        // c) after an optimal code is played, if it is not the secret code, there will be 1 group of 1 code and 1 group of 2 codes
                        sum = sum + 8.0; // 4 * ((1+2+2+3)/4.0)
                      }
                    }
                  }
                }
              }
            }
            if (sum_marks == nbCodes) break;
          }
          else { // (nextNbCodes >= 5). Note: from 5 codes, "leaf algos" would be very long to write & to optimize

            // 1) Update current game
            // **********************

            curGame[next_cur_game_idx] = cur_code;
            marksIdxs[next_cur_game_idx] = mark_idx;

            // 2) Update possible permutations
            // *******************************

            if (nextNbCodes > nbCodesLimitForEquivalentCodesCheck) {
              let new_perm_cnt = 0;
              for (let perm_idx = 0; perm_idx < cur_permutations_table_size[next_cur_game_idx]; perm_idx++) {
                if (areCodesEquivalent(0, 0, next_cur_game_idx+1, true /* assess current game only */, cur_permutations_table[next_cur_game_idx][perm_idx], null) /* forced permutation */) { // determine which permutations are still valid for current game
                  if ((cur_permutations_table[next_cur_game_idx][perm_idx] < 0) || (cur_permutations_table[next_cur_game_idx][perm_idx] >= all_permutations_table_size[nbColumns])) {
                    throw new Error("recursiveEvaluatePerformances: invalid permutation index: " + perm_idx);
                  }
                  cur_permutations_table[next_cur_game_idx+1][new_perm_cnt] = cur_permutations_table[next_cur_game_idx][perm_idx];
                  new_perm_cnt++;
                }
              }
              if (new_perm_cnt <= 0) { // identity shall always be valid
                throw new Error("recursiveEvaluatePerformances: invalid new_perm_cnt value: " + new_perm_cnt);
              }
              cur_permutations_table_size[next_cur_game_idx+1] = new_perm_cnt;
            }
            else {
              cur_permutations_table_size[next_cur_game_idx+1] = 0; // (defensive setting)
            }

            // 3) Recursive call
            // *****************

            let nextListOfCodeIndexesToConsider = nextListsOfCodeIndexes[mark_idx];

            // Check if transition to mark optimzation mode
            if ((!mark_optimization_mode) && (nextNbCodes <= nbCodesLimitForMarkOptimization)) {
              for (let i = 0; i < nextNbCodes; i++) {
                // Codes indexed
                let next_code_idx = nextListOfCodeIndexesToConsider[i];
                possibleCodesForPerfEvaluation_OptimizedCodes[i] = possibleCodesForPerfEvaluation_InitialCodesPt[next_code_idx];
                // Code indexes
                nextListOfCodeIndexesToConsider[i] = i;
                // Marks already computed
                for (let j = 0; j < nextNbCodes; j++) {
                  marks_already_computed_table[i][j] = -1; // mark not computed yet
                }
              }
              if (nextNbCodes < nbCodesLimitForMarkOptimization) { // (defensive setting)
                possibleCodesForPerfEvaluation_OptimizedCodes[nextNbCodes] = 0; /* empty code */
              }
            }

            sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListOfCodeIndexesToConsider, nextNbCodes /*, ((idx1 < nbCodes) && possibleGame) (precalculation mode) */); // (Note: possibleGame = ((idx1 < nbCodes) && possibleGame))
            if (sum_marks == nbCodes) break;

          }
        }
      }
      /*
      // Precalculation optimization (3/3): skip useless current code if acceptable
      if (useless_cur_code) { // (precalculation mode)
        if (idx1 < nbCodes) {
          throw new Error("recursiveEvaluatePerformances: useless_cur_code");
        }
        continue; // skip useless current code
      } */

      if (sum_marks != nbCodes) {
        throw new Error("recursiveEvaluatePerformances: invalid sum_marks value (1) (depth=" + depth + ", sum_marks=" + sum_marks + ", sum_marks=" + sum_marks + ")");
      }

      if (!compute_sum_ini) {
        listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_code = cur_code;
        listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_sum = sum;
        nbOfEquivalentCodesAndPerformances++;
      }

    } // compute_sum

    // Max possible value of sum = 24 bits (10.000.000 for 7 columns case) + 20 bits (for value 999999 so that < 1/10000 precision) = 44 bits << 52 mantissa bits of double type
    // To simplify, no optimization is done to exit the previous loop when "sum >= best_sum" (after some reordering of the codes and/or marks), recursively or not. The gains
    // were indeed assessed to be low. Such an optimization would moreover not be applied to the first depth, as it is targeted to evaluate all possible codes.
    /* if ((sum < best_sum) && (idx1 < nbCodes)) { // (precalculation mode)
      best_sum = sum;
    } */
    if (sum < best_sum) {
      best_sum = sum;
    }

    // Fill output in case of first call
    // if ((depth <= 1) && (idx1 < nbCodes)) { // (precalculation mode)
    if (depth <= 1) {

      let time_elapsed = new Date().getTime() - evaluatePerformancesStartTime;

      if ((!tooLongTimeDetected) && (time_elapsed > appliedMaxPerformanceEvaluationTime + maxAllowedExtraTime)) {
        tooLongTimeDetected = true;
        var delayedErrorStr = "throw new Error('recursiveEvaluatePerformances: too long process (" + time_elapsed + "ms >> " + (appliedMaxPerformanceEvaluationTime + maxAllowedExtraTime) + "ms) (" + depth + ")')";
        setTimeout(delayedErrorStr, 444);
      }

      if (first_call) {

        if ((!compute_sum_ini) && (nbCodes > 100)) {

          if (compute_sum || precalculated_sum) { // a new class has been evaluated
            nb_classes_cnt++;
            /* if (precalculation_mode) { // (precalculation mode)
              send_trace_msg("______________________________ END OF CLASS ______________________________ " + time_elapsed + " ms");
            } */
          }

          let idxToConsider;
          let totalNbToConsider;
          idxToConsider = nb_classes_cnt;
          totalNbToConsider = curNbClasses;

          // Processing is aborted when too long
          if ( (time_elapsed > appliedMaxPerformanceEvaluationTime)
               && (idxToConsider != totalNbToConsider) ) { // not 100%
            console.log("(processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%))");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }

          // Anticipation of processing abortion
          if ( (areCurrentGameOrCodePrecalculated < 0) && (time_elapsed > 5000) && (time_elapsed > appliedMaxPerformanceEvaluationTime*7/100) && (idxToConsider < Math.floor(totalNbToConsider*1.167/100)) ) { // (6 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #0)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (areCurrentGameOrCodePrecalculated < 0) && (time_elapsed > 5000) && (time_elapsed > appliedMaxPerformanceEvaluationTime*10/100) && (idxToConsider < Math.floor(totalNbToConsider*2/100)) ) { // (5.00 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #1)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (areCurrentGameOrCodePrecalculated < 0) && (time_elapsed > 5000) && (time_elapsed > appliedMaxPerformanceEvaluationTime*15/100) && (idxToConsider < Math.floor(totalNbToConsider*3.75/100)) ) { // (4.00 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #2)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (areCurrentGameOrCodePrecalculated < 0) && (time_elapsed > 5000) && (time_elapsed > appliedMaxPerformanceEvaluationTime*20/100) && (idxToConsider < Math.floor(totalNbToConsider*6/100)) ) { // (3.33 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #3)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (time_elapsed > 5000) && (time_elapsed > appliedMaxPerformanceEvaluationTime*30/100) && (idxToConsider < Math.floor(totalNbToConsider*10/100)) ) { // (3.00 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #4)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (time_elapsed > 5000) && (time_elapsed > appliedMaxPerformanceEvaluationTime*40/100) && (idxToConsider < Math.floor(totalNbToConsider*17/100)) ) { // (2.35 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #5)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (time_elapsed > appliedMaxPerformanceEvaluationTime*50/100) && (idxToConsider < Math.floor(totalNbToConsider*25/100)) ) { // (2.00 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #6)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (time_elapsed > appliedMaxPerformanceEvaluationTime*60/100) && (idxToConsider < Math.floor(totalNbToConsider*36/100)) ) { // (1.67 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #7)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (time_elapsed > appliedMaxPerformanceEvaluationTime*70/100) && (idxToConsider < Math.floor(totalNbToConsider*48/100)) ) { // (1.46 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #8)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }
          if ( (time_elapsed > appliedMaxPerformanceEvaluationTime*80/100) && (idxToConsider < Math.floor(totalNbToConsider*64/100)) ) { // (1.25 ratio)
            console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #9)");
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
          }

          if (idx1+1 == nbCodes) { // last loop
            if (idxToConsider != totalNbToConsider) { // not 100%
              throw new Error("recursiveEvaluatePerformances: invalid code numbers (" + idxToConsider + " != " + totalNbToConsider + ")");
            }
          }

        }

        listOfGlobalPerformances[idx1] = 1.0 + sum / nbCodes; // output
        /* if (write_me) { // (traces useful for debug)
          console.log("perf #" + idx1 + ": " + listOfGlobalPerformances[idx1] + " / " + time_elapsed + "ms");
        } */

      }
      else if ((depth == 0) || (depth == 1)) { // first and second levels of recursivity
        // Processing is aborted when too long
        if (time_elapsed > appliedMaxPerformanceEvaluationTime * 1.05) {
          console.log("(processing abortion after " + time_elapsed + "ms)");
          listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
          listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
          particularCodeGlobalPerformance = PerformanceNA; // output
          recursiveEvaluatePerformancesWasAborted = true; throw new Error(performanceEvaluationAbortedStr);
        }
      }
      else {
        throw new Error("recursiveEvaluatePerformances: internal error (1)");
      }
      time_elapsed = undefined;

    } // (depth <= 1)

    /* if (precalculation_mode && write_me_for_precalculation) { // (precalculation mode)
      str = str + codeHandler.compressCodeToString(cur_code) + ":" + Math.round(sum).toString(16).toUpperCase() + ",";
    } */

  } // (loop on idx1)

  /* if (precalculation_mode) { // (precalculation mode)
    if (!str.endsWith(",")) {
      throw new Error("recursiveEvaluatePerformances: internal error (2)");
    }
    str = "\"" + str.substring(0, str.length-1) + ".\" +"; // remove last ','
    // console.log(str);
    let precalculation_time = new Date().getTime() - precalculation_start_time;
    if (precalculation_cnt > 0) { // keep all already-precalculated games
      send_trace_msg(str + " // cplt (" + precalculation_cnt + "/" + precalculation_cnt_tot + ")");
    }
    else if (precalculation_time >= 2000) { // 2000 = 2.0 seconds on i5 processor or on Linux VB running on i7 processor
      send_trace_msg(str + " // " + precalculation_time + "ms");
    }
    else {
      if (next_cur_game_idx <= 2) {
        send_trace_msg("skipped (" + precalculation_time + "ms)");
      }
    }
  } */

  // Evaluate performance of impossible code if needed
  // *************************************************

  if (first_call && (particularCodeToAssess != 0 /* empty code */)) {

    cur_code_idx = -2; // invalid value
    cur_code = particularCodeToAssess;

    let particular_precalculated_sum = false;
    if ( (precalculated_cur_game_or_code > 0) // both game and code were precalculated
         && (!compute_sum_ini) /* && (!precalculation_mode) */ ) { // (precalculation mode)
      sum = lookForCodeInPrecalculatedGames(cur_code, next_cur_game_idx, nbCodes, 0);
      if (sum > 0) { // precalculated sum found
        particular_precalculated_sum = true;
      }
      else {
        throw new Error("recursiveEvaluatePerformances: cannot find precalculated game and code (impossible code): " + codeHandler.codeToString(cur_code));
      }
    }

    if (!particular_precalculated_sum) {

      nextNbsCodes.fill(0); // (faster than (or close to) a loop on 0..nbMaxMarks-1)

      // Determine all possible marks for current code
      for (idx2 = 0; idx2 < nbCodes; idx2++) {
        other_code_idx = listOfCodeIndexes[idx2];
        if (mark_optimization_mode) {
          other_code = possibleCodesForPerfEvaluation_OptimizedCodes[other_code_idx];
        }
        else {
          other_code = possibleCodesForPerfEvaluation_InitialCodesPt[other_code_idx];
        }
        codeHandler.fillMark(cur_code, other_code, mark_perf_tmp); // mark_optimization_mode is not applicable here as cur_code_idx is invalid
        mark_perf_tmp_idx = marksTable_MarkToNb[mark_perf_tmp.nbBlacks][mark_perf_tmp.nbWhites];
        nextListsOfCodeIndexes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]] = other_code_idx;
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
            sum = sum + 3.0; // 2 * 1.5 = 3.0
          }
          else {

            // 1) Update current game
            // **********************

            curGame[next_cur_game_idx] = cur_code;
            marksIdxs[next_cur_game_idx] = mark_idx;

            // 2) Update possible permutations
            // *******************************

            if (nextNbCodes > nbCodesLimitForEquivalentCodesCheck) { // this computing would be useless otherwise
              let new_perm_cnt = 0;
              for (let perm_idx = 0; perm_idx < cur_permutations_table_size[next_cur_game_idx]; perm_idx++) {
                if (areCodesEquivalent(0, 0, next_cur_game_idx+1, true /* assess current game only */, cur_permutations_table[next_cur_game_idx][perm_idx], null) /* forced permutation */) { // determine which permutations are still valid for current game
                  if ((cur_permutations_table[next_cur_game_idx][perm_idx] < 0) || (cur_permutations_table[next_cur_game_idx][perm_idx] >= all_permutations_table_size[nbColumns])) {
                    throw new Error("recursiveEvaluatePerformances: invalid permutation index: " + perm_idx);
                  }
                  cur_permutations_table[next_cur_game_idx+1][new_perm_cnt] = cur_permutations_table[next_cur_game_idx][perm_idx];
                  new_perm_cnt++;
                }
              }
              if (new_perm_cnt <= 0) { // identity shall always be valid
                throw new Error("recursiveEvaluatePerformances: invalid new_perm_cnt value: " + new_perm_cnt);
              }
              cur_permutations_table_size[next_cur_game_idx+1] = new_perm_cnt;
            }
            else {
              cur_permutations_table_size[next_cur_game_idx+1] = 0; // (defensive setting)
            }

            // 3) Recursive call
            // *****************

            let nextListOfCodeIndexesToConsider = nextListsOfCodeIndexes[mark_idx];

            // Check if transition to mark optimzation mode
            if ((!mark_optimization_mode) && (nextNbCodes <= nbCodesLimitForMarkOptimization)) {
              for (let i = 0; i < nextNbCodes; i++) {
                // Codes indexed
                let next_code_idx = nextListOfCodeIndexesToConsider[i];
                possibleCodesForPerfEvaluation_OptimizedCodes[i] = possibleCodesForPerfEvaluation_InitialCodesPt[next_code_idx];
                // Code indexes
                nextListOfCodeIndexesToConsider[i] = i;
                // Marks already computed
                for (let j = 0; j < nextNbCodes; j++) {
                  marks_already_computed_table[i][j] = -1; // mark not computed yet
                }
              }
              if (nextNbCodes < nbCodesLimitForMarkOptimization) { // (defensive setting)
                possibleCodesForPerfEvaluation_OptimizedCodes[nextNbCodes] = 0; /* empty code */
              }
            }

            sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListOfCodeIndexesToConsider, nextNbCodes /*, false (precalculation mode) */);

          }
        }
      }
      if (sum_marks != nbCodes) {
        throw new Error("recursiveEvaluatePerformances: invalid sum_marks value (2) (depth=" + depth + ", sum_marks=" + sum_marks + ", sum_marks=" + sum_marks + ")");
      }

    } // !particular_precalculated_sum

    // Fill output
    particularCodeGlobalPerformance = 1.0 + sum / nbCodes; // output

  }

  return 1.0 + best_sum / nbCodes;

}

// ********************************
// Handle messages from main thread
// ********************************

function handleMessage(data) {

  // **************
  // Initialization
  // **************

  if (data.smm_req_type == 'INIT') {

    // *******************
    // Read message fields
    // *******************

    if (init_done) {
      throw new Error("INIT phase / double initialization");
    }

    if (data.game_id == undefined) {
      throw new Error("INIT phase / game_id is undefined");
    }
    game_id = Number(data.game_id);
    if ( isNaN(game_id) || (game_id < 0) ) {
      throw new Error("INIT phase / invalid game_id: " + game_id);
    }

    // Post I_AM_ALIVE message
    if (!IAmAliveMessageSent) {
      self.postMessage({'rsp_type': 'I_AM_ALIVE', 'game_id': game_id}); // first message sent
      IAmAliveMessageSent = true;
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
      possibleCodesShown[i] = 0; // empty code
      globalPerformancesShown[i] = PerformanceNA;
    }

    if (data.first_session_game == undefined) {
      throw new Error("INIT phase / first_session_game is undefined");
    }
    let first_session_game = data.first_session_game;

    let beginner_mode = true;
    if (data.beginner_mode !== undefined) {
      beginner_mode = data.beginner_mode;
    }

    if (data.debug_mode == undefined) {
      throw new Error("INIT phase / debug_mode is undefined");
    }
    if (data.debug_mode != "") {
      if (data.debug_mode == "dbg") {
        for (let i = 0; i == i; i++) {
          // if (i % 2 == 0) {console.log(" ");} else {console.log("  ")};
        }
      }
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
        maxPerformanceEvaluationTime = factorForMaxPerformanceEvaluationTime*5; // (short games)
        nbOfCodesForSystematicEvaluation = initialNbPossibleCodes; // systematic performance evaluation
        nbOfCodesForSystematicEvaluation_AllCodesEvaluated = initialNbPossibleCodes;
        nbOfCodesForSystematicEvaluation_ForMemAlloc = initialNbPossibleCodes;
        initialNbClasses = 3; // {111, 112, 123}
        maxDepth = Math.min(11, overallMaxDepth);
        maxDepthForGamePrecalculation = -1; // no game precalculation needed (-1 or 3)
        lookForCodeInPrecalculatedGamesReuseTable = null;
        lookForCodeInPrecalculatedGamesClassIdsTable = null;
        break;
      case 4:
        nbMaxMarks = 14;
        maxPerformanceEvaluationTime = factorForMaxPerformanceEvaluationTime*15; // (short games)
        nbOfCodesForSystematicEvaluation = initialNbPossibleCodes; // systematic performance evaluation
        nbOfCodesForSystematicEvaluation_AllCodesEvaluated = initialNbPossibleCodes;
        nbOfCodesForSystematicEvaluation_ForMemAlloc = initialNbPossibleCodes; // game precalculation (*)
        initialNbClasses = 5; // {1111, 1112, 1122, 1123, 1234}
        maxDepth = Math.min(12, overallMaxDepth);
        maxDepthForGamePrecalculation = 3; // game precalculation (-1 or 3) (*)
        lookForCodeInPrecalculatedGamesReuseTable = null;
        lookForCodeInPrecalculatedGamesClassIdsTable = null;
        break;
      case 5:
        nbMaxMarks = 20;
        maxPerformanceEvaluationTime = factorForMaxPerformanceEvaluationTime*(beginner_mode ? 20 : 60); // (as many games fully evaluated as possible)
        nbOfCodesForSystematicEvaluation = Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes); // initialNbPossibleCodes in (precalculation mode)
        nbOfCodesForSystematicEvaluation_AllCodesEvaluated = Math.min(refNbOfCodesForSystematicEvaluation_AllCodesEvaluated, initialNbPossibleCodes); // initialNbPossibleCodes in (precalculation mode)
        nbOfCodesForSystematicEvaluation_ForMemAlloc = initialNbPossibleCodes; // game precalculation (*)
        initialNbClasses = 7; // {11111, 11112, 11122, 11123, 11223, 11234, 12345}
        maxDepth = Math.min(13, overallMaxDepth);
        maxDepthForGamePrecalculation = 3; // game precalculation (-1 or 3) (*)
        lookForCodeInPrecalculatedGamesReuseTable = new Array(initialNbPossibleCodes);
        lookForCodeInPrecalculatedGamesClassIdsTable = new Array(initialNbPossibleCodes);
        break;
      case 6:
        nbMaxMarks = 27;
        maxPerformanceEvaluationTime = factorForMaxPerformanceEvaluationTime*(beginner_mode ? 20 : 35); // (games never fully evaluated but extrapolated global performances)
        nbOfCodesForSystematicEvaluation = Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
        nbOfCodesForSystematicEvaluation_AllCodesEvaluated = Math.min(refNbOfCodesForSystematicEvaluation_AllCodesEvaluated, initialNbPossibleCodes);
        nbOfCodesForSystematicEvaluation_ForMemAlloc = nbOfCodesForSystematicEvaluation;
        initialNbClasses = 11; // {111111, 111112, 111122, 111123, 111222, 111223, 111234, 112233, 112234, 112345, 123456}
        maxDepth = Math.min(14, overallMaxDepth);
        maxDepthForGamePrecalculation = -1; // no game precalculation as precalculation would be too long (-1 or 3)
        lookForCodeInPrecalculatedGamesReuseTable = null;
        lookForCodeInPrecalculatedGamesClassIdsTable = null;
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
        maxPerformanceEvaluationTime = factorForMaxPerformanceEvaluationTime*(beginner_mode ? 20 : 30); // (games never fully evaluated)
        nbOfCodesForSystematicEvaluation = Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
        nbOfCodesForSystematicEvaluation_AllCodesEvaluated = Math.min(refNbOfCodesForSystematicEvaluation_AllCodesEvaluated, initialNbPossibleCodes);
        nbOfCodesForSystematicEvaluation_ForMemAlloc = nbOfCodesForSystematicEvaluation;
        initialNbClasses = 15; // {1111111, 1111112, 1111122, 1111123, 1111222, 1111223, 1111234, 1112223, 1112233, 1112234, 1112345, 1122334, 1122345, 1123456, 1234567}
        maxDepth = Math.min(15, overallMaxDepth);
        maxDepthForGamePrecalculation = -1; // no game precalculation as precalculation would be too long (-1 or 3)
        lookForCodeInPrecalculatedGamesReuseTable = null;
        lookForCodeInPrecalculatedGamesClassIdsTable = null;
        break;
      default:
        throw new Error("INIT phase / invalid nbColumns: " + nbColumns);
    }
    nbCodesLimitForMarkOptimization = Math.min(Math.min(refNbCodesLimitForMarkOptimization, initialNbPossibleCodes), refNbOfCodesForSystematicEvaluation);

    if ((nbOfCodesForSystematicEvaluation <= 0) || (nbOfCodesForSystematicEvaluation_AllCodesEvaluated <= 0) || (nbOfCodesForSystematicEvaluation_ForMemAlloc <= 0) || (refNbOfCodesForSystematicEvaluation_AllCodesEvaluated > refNbOfCodesForSystematicEvaluation)) {
      throw new Error("INIT phase / internal error: [ref]nbOfCodesForSystematicEvaluation series");
    }
    if (nbOfCodesForSystematicEvaluation_AllCodesEvaluated > nbOfCodesForSystematicEvaluation) {
      throw new Error("INIT phase / internal error: nbOfCodesForSystematicEvaluation_AllCodesEvaluated");
    }
    if (nbOfCodesForSystematicEvaluation > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
      throw new Error("INIT phase / internal error: nbOfCodesForSystematicEvaluation");
    }
    if ( (maxDepthForGamePrecalculation > maxDepthForGamePrecalculation_ForMemAlloc)
         || ((maxDepthForGamePrecalculation != -1) && (maxDepthForGamePrecalculation != 3)) ) { // (-1 or 3)
      throw new Error("INIT phase / internal error (maxDepthForGamePrecalculation: " + maxDepthForGamePrecalculation + ")");
    }
    if (minNbCodesForPrecalculation <= nbCodesLimitForEquivalentCodesCheck) {
      throw new Error("INIT phase / internal error: minNbCodesForPrecalculation");
    }
    if ( (nbCodesLimitForMarkOptimization < nbCodesLimitForEquivalentCodesCheck)
         || (nbCodesLimitForMarkOptimization > initialNbPossibleCodes)
         || (nbCodesLimitForMarkOptimization > nbOfCodesForSystematicEvaluation_ForMemAlloc)
         || (nbCodesLimitForMarkOptimization < 100) ) {
      throw new Error("INIT phase / internal error: nbCodesLimitForMarkOptimization");
    }

    codeHandler = new GsCodeHandler(nbColumns, nbColors, nbMinColumns, nbMaxColumns, emptyColor);

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
            throw new Error("INIT phase / internal error (mark_cnt: " + mark_cnt + ") (1)");
          }
          marksTable_NbToMark[mark_cnt] = mark_tmp;
          marksTable_MarkToNb[i][j] = mark_cnt;
          mark_cnt++;
        }
      }
    }
    if (mark_cnt != nbMaxMarks) {
      throw new Error("INIT phase / internal error (mark_cnt: " + mark_cnt + ") (2)");
    }
    if (marksTable_NbToMark.length != nbMaxMarks) {
      throw new Error("INIT phase / internal error (marksTable_NbToMark length: " + marksTable_NbToMark.length + ")");
    }
    if (marksTable_MarkToNb.length != nbColumns+1) {
      throw new Error("INIT phase / internal error (marksTable_MarkToNb length: " + marksTable_MarkToNb.length + ") (1)");
    }
    for (let i = 0; i <= nbColumns; i++) { // nbBlacks
      if (marksTable_MarkToNb[i].length != nbColumns+1) {
        throw new Error("INIT phase / internal error (marksTable_MarkToNb length: " + marksTable_MarkToNb.length + ") (2)");
      }
    }

    best_mark_idx = marksTable_MarkToNb[nbColumns][0];
    worst_mark_idx = marksTable_MarkToNb[0][0];

    possibleCodesForPerfEvaluation = new Array(2);
    possibleCodesForPerfEvaluation[0] = new Array(nbOfCodesForSystematicEvaluation_ForMemAlloc);
    possibleCodesForPerfEvaluation[1] = new Array(nbOfCodesForSystematicEvaluation_ForMemAlloc);
    // initialCodeListForPrecalculatedMode = new Array(nbOfCodesForSystematicEvaluation_ForMemAlloc); // (precalculation mode)

    if (nbColumns == 5) { // Optimization for Super Master Mind games
      if (nbColors != 8) {
        throw new Error("INIT phase / internal error (unexpected number of colors)");
      }
      listOfClassIds = new Array(0x88888+1); // (A few Mbytes)
    }
    else {
      listOfClassIds = null;
    }

    // **********
    // Update GUI
    // **********

    colorsFoundCode = codeHandler.setAllColorsIdentical(emptyColor); // value at game start
    for (let color = 1; color <= nbColors; color++) { // values at game start
      minNbColorsTable[color] = 0;
      maxNbColorsTable[color] = nbColumns;
    }

    self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': initialNbPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': 1, 'game_id': game_id});

    let nb_possible_codes_listed = fillShortInitialPossibleCodesTable(possibleCodesForPerfEvaluation[1], nbOfCodesForSystematicEvaluation_ForMemAlloc);
    if (possibleCodesForPerfEvaluation_lastIndexWritten != -1) {
      throw new Error("INIT phase / inconsistent writing into possibleCodesForPerfEvaluation");
    }
    possibleCodesForPerfEvaluation_lastIndexWritten = 1;

    /* if (8*8*8*8*8 != fillShortInitialPossibleCodesTable(initialCodeListForPrecalculatedMode, nbOfCodesForSystematicEvaluation_ForMemAlloc)) { // (precalculation mode)
      throw new Error("INIT phase / internal error");
    } */

    init_done = true;

  }

  // ***********
  // New attempt
  // ***********

  else if (init_done && (data.smm_req_type == 'NEW_ATTEMPT')) {

    // *******************
    // Read message fields
    // *******************

    if (data.curAttemptNumber == undefined) {
      throw new Error("NEW_ATTEMPT phase / curAttemptNumber is undefined");
    }
    let curAttemptNumber_tmp = Number(data.curAttemptNumber);
    if ( isNaN(curAttemptNumber_tmp) || (curAttemptNumber_tmp < 0) || (curAttemptNumber_tmp > nbMaxAttempts) ) {
      throw new Error("NEW_ATTEMPT phase / invalid curAttemptNumber: " + curAttemptNumber_tmp);
    }
    if (curAttemptNumber_tmp != curAttemptNumber+1) { // attempt numbers shall be consecutive
      throw new Error("NEW_ATTEMPT phase / non consecutive curAttemptNumber values: " + curAttemptNumber + ", " + curAttemptNumber_tmp);
    }
    curAttemptNumber = curAttemptNumber_tmp;

    if (data.nbMaxAttemptsForEndOfGame == undefined) {
      throw new Error("NEW_ATTEMPT phase / nbMaxAttemptsForEndOfGame is undefined");
    }
    nbMaxAttemptsForEndOfGame = Number(data.nbMaxAttemptsForEndOfGame);
    if ( isNaN(nbMaxAttemptsForEndOfGame) || (nbMaxAttemptsForEndOfGame < 0) || (nbMaxAttemptsForEndOfGame > nbMaxAttempts) || (nbMaxAttemptsForEndOfGame < curAttemptNumber) ) {
      throw new Error("NEW_ATTEMPT phase / invalid nbMaxAttemptsForEndOfGame: " + nbMaxAttemptsForEndOfGame + ", " + curAttemptNumber);
    }

    if (data.code == undefined) {
      throw new Error("NEW_ATTEMPT phase / code is undefined");
    }
    codesPlayed[curAttemptNumber-1] = Number(data.code);
    if ( isNaN(codesPlayed[curAttemptNumber-1]) || !codeHandler.isFullAndValid(codesPlayed[curAttemptNumber-1]) ) {
      throw new Error("NEW_ATTEMPT phase / invalid code: " + codesPlayed[curAttemptNumber-1]);
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
    marks[curAttemptNumber-1] = {nbBlacks:mark_nbBlacks, nbWhites:mark_nbWhites};
    if (!codeHandler.isMarkValid(marks[curAttemptNumber-1])) {
      throw new Error("NEW_ATTEMPT phase / invalid mark: " + mark_nbBlacks + "B, " + mark_nbWhites + "W, " + nbColumns);
    }

    if (data.precalculated_games == undefined) {
      throw new Error("NEW_ATTEMPT phase / precalculated_games is undefined");
    }
    if (data.precalculated_games != "") { // (duplicated code - begin)
      if (nbColumns != 5) { // precalculated_games is only expected for 5 columns games
        throw new Error("NEW_ATTEMPT phase / unexpected precalculated_games: " + nbColumns + ", " + curAttemptNumber);
      }
      if (precalculated_games_5columns.length + data.precalculated_games.length > 20000000) { // 20 MB
        throw new Error("NEW_ATTEMPT phase / too big precalculated_games: " + precalculated_games_5columns.length);
      }
      precalculated_games_5columns = precalculated_games_5columns + data.precalculated_games;
    } // (duplicated code - end)

    if (data.game_id == undefined) {
      throw new Error("NEW_ATTEMPT phase / game_id is undefined");
    }
    let attempt_game_id = Number(data.game_id);
    if ( isNaN(attempt_game_id) || (attempt_game_id < 0) || (attempt_game_id != game_id) ) {
      throw new Error("NEW_ATTEMPT phase / invalid game_id: " + attempt_game_id + " (" + game_id + ")");
    }

    // ***************
    // Initializations
    // ***************

    // 1) Update current game
    // **********************

    if (!initialInitDone) {
      initialInitDone = true;
      curGame = new Array(nbMaxAttempts+maxDepth);
      curGame.fill(0); /* empty code */
      marksIdxs = new Array(nbMaxAttempts+maxDepth);
      marksIdxs.fill(-1);
      generateAllPermutations();
    }

    if (curAttemptNumber >= 2) {
      // Notes on "future-based" criteria:
      // - to simplify, useless codes (likely to be played near game end) are not excluded from current game, which can lead to some
      //   (very rare) disturbances on precalculations.
      // - to simplify, codes with a 0 black + 0 white mark are not particularized. More generally, the fact that impossible colors
      //   are interchangeable is not exploited (mostly covered by 0 black + 0 white mark cases / difficult to take into account
      //   recursively at small cost / complex impacts on possible permutations whose number could increase instead of decrease
      //   from some attempts + on associated bijections).
      // - handling a "dynamic dictionary of games" containing sets of (k to k+n, k >= 5) possible remaining codes and their associated
      //   performance was assessed and does not allow to reach any gain for long evaluations (too low percentage of repetitive games).
      curGame[curAttemptNumber-2] = codesPlayed[curAttemptNumber-2];
      marksIdxs[curAttemptNumber-2] = marksTable_MarkToNb[marks[curAttemptNumber-2].nbBlacks][marks[curAttemptNumber-2].nbWhites];
    }
    curGameSize = curAttemptNumber-1; // (equal to 0 at first attempt)

    // Check current game (useful for subsequent equivalent codes processing - duplicated code)
    if (curGameSize != curAttemptNumber-1) {
      throw new Error("NEW_ATTEMPT phase / invalid curGameSize");
    }
    for (let idx = 0; idx < curGameSize; idx++) {
      if ( (curGame[idx] != codesPlayed[idx]) || (!codeHandler.isFullAndValid(curGame[idx])) ) {
        throw new Error("NEW_ATTEMPT phase / invalid current game (" + idx + ")");
      }
      if ( (!codeHandler.marksEqual(marksTable_NbToMark[marksIdxs[idx]], marks[idx])) || (!codeHandler.isMarkValid(marksTable_NbToMark[marksIdxs[idx]])) )  {
        throw new Error("NEW_ATTEMPT phase /  invalid current marks (" + idx + ")");
      }
    }

    // 2) Update possible permutations
    // *******************************

    // Note: to simplify, more complex algorithms are not used to update possible permutations. For instance: games {[1 1 2] [1 3 4]}, {[1 1 2] [3 4 3]}
    //       and {[1 2 3] [1 1 1]} lead to numbers of possible permutations which are underestimated.

    if (curAttemptNumber >= 2) {
      if (cur_permutations_table_size[curGameSize-1] <= 0) {
        throw new Error("NEW_ATTEMPT phase / invalid cur_permutations_table_size value: " + cur_permutations_table_size[curGameSize-1]);
      }
      let new_perm_cnt = 0;
      for (let perm_idx = 0; perm_idx < cur_permutations_table_size[curGameSize-1]; perm_idx++) {
        if (areCodesEquivalent(0, 0, curGameSize, true /* assess current game only */, cur_permutations_table[curGameSize-1][perm_idx], null) /* forced permutation */) { // determine which permutations are still valid for current game
          if ((cur_permutations_table[curGameSize-1][perm_idx] < 0) || (cur_permutations_table[curGameSize-1][perm_idx] >= all_permutations_table_size[nbColumns])) {
            throw new Error("NEW_ATTEMPT phase / invalid permutation index: " + perm_idx);
          }
          cur_permutations_table[curGameSize][new_perm_cnt] = cur_permutations_table[curGameSize-1][perm_idx];
          new_perm_cnt++;
        }
      }
      if (new_perm_cnt <= 0) { // identity shall always be valid
        throw new Error("NEW_ATTEMPT phase / invalid new_perm_cnt value: " + new_perm_cnt);
      }
      cur_permutations_table_size[curGameSize] = new_perm_cnt;
    }

    // **************************************************
    // A.1) Compute number and list of new possible codes
    // **************************************************

    console.log(String(curAttemptNumber) + ": " + codeHandler.markToString(marks[curAttemptNumber-1]) + " " + codeHandler.codeToString(codesPlayed[curAttemptNumber-1]));

    if (possibleCodesForPerfEvaluation_InitialIndexes == null) {
      possibleCodesForPerfEvaluation_InitialIndexes = new Array(nbOfCodesForSystematicEvaluation_ForMemAlloc);
    }
    if (possibleCodesForPerfEvaluation_OptimizedCodes == null) {
      possibleCodesForPerfEvaluation_OptimizedCodes = new Array(nbCodesLimitForMarkOptimization);
    }
    if (marks_already_computed_table == null) {
      marks_already_computed_table = new2DArray(nbCodesLimitForMarkOptimization, nbCodesLimitForMarkOptimization);
    }
    for (let i = 0; i < nbCodesLimitForMarkOptimization; i++) {
      marks_already_computed_table[i].fill(-1); // mark not computed yet
    }

    if (curAttemptNumber == 1) { // first attempt
      possibleCodesAfterNAttempts = new OptimizedArrayList(Math.max(1 + Math.floor(initialNbPossibleCodes/nb_max_internal_lists), 5*nb_max_internal_lists));
    }

    previousNbOfPossibleCodes = nextNbOfPossibleCodes;
    nextNbOfPossibleCodes = computeNbOfPossibleCodes(curAttemptNumber+1, nbOfCodesForSystematicEvaluation_ForMemAlloc, possibleCodesForPerfEvaluation[(curAttemptNumber+1)%2]);
    if (possibleCodesForPerfEvaluation_lastIndexWritten != (curAttemptNumber%2)) {
      throw new Error("NEW_ATTEMPT phase / inconsistent writing into possibleCodesForPerfEvaluation");
    }
    possibleCodesForPerfEvaluation_lastIndexWritten = (curAttemptNumber+1)%2;
    if (nextNbOfPossibleCodes > previousNbOfPossibleCodes) {
      throw new Error("NEW_ATTEMPT phase / inconsistent numbers of possible codes: " + nextNbOfPossibleCodes + " > " + previousNbOfPossibleCodes);
    }

    // ***************
    // A.2) Update GUI
    // ***************

    if (curAttemptNumber+1 <= nbMaxAttemptsForEndOfGame) { // not last game attempt
      self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': nextNbOfPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': (curAttemptNumber+1), 'game_id': game_id});
    }

    // ***************************************
    // B.1) Compute performance of code played
    // ***************************************

    let best_global_performance = PerformanceNA;
    let code_played_relative_perf = PerformanceNA;
    let relative_perf_evaluation_done = false;
    let classical_useless_code = false; // "classical" useless code (number of possible codes unchanged after the attempt)
    equivalentPossibleCode = 0; // empty code

    // a) Useless code
    // ***************

    if ((nextNbOfPossibleCodes == previousNbOfPossibleCodes) && (!gameWon)) {
      // To simplify, for a useless code, performances will be computed at next useful code
      best_global_performance = PerformanceUNKNOWN;
      code_played_relative_perf = -1.00;
      relative_perf_evaluation_done = true;
      classical_useless_code = true;
    }

    // b) Useful code
    // **************

    else {

      // Check if current game and code (whether possible or impossible) were precalculated
      // ******************************************************************************

      let precalculated_cur_game_or_code = -1; // nothing was precalculated
      // precalculated_cur_game_or_code shall keep being -1 in precalculation mode => below code to comment in (precalculation mode)
      if ( (previousNbOfPossibleCodes >= minNbCodesForPrecalculation) // (**) only games for which there may not be enough CPU capacity / time to calculate performances online
           && (curGameSize <= maxDepthForGamePrecalculation) ) { // (-1 or 3)
        precalculated_cur_game_or_code = lookForCodeInPrecalculatedGames(codesPlayed[curAttemptNumber-1], curGameSize, previousNbOfPossibleCodes, 0);
      }

      // Determine current number of classes
      // ***********************************

      let index = (curAttemptNumber%2);

      let listOfClassesFirstCall = null;
      let listOfClassesIdsFirstCall = null;
      let nbOfClassesFirstCall = 0;

      if ( (nbColumns <= 5)
           || (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated) ) { // (****) optimization for 6 & 7 columns games
        listOfClassesFirstCall = new Array(previousNbOfPossibleCodes);
        listOfClassesFirstCall.fill(0);
        listOfClassesIdsFirstCall = new Array(previousNbOfPossibleCodes);
        listOfClassesIdsFirstCall.fill(0);
        for (let idx1 = 0; idx1 < previousNbOfPossibleCodes; idx1++) {
          let cur_code = possibleCodesForPerfEvaluation[index][idx1];
          let codeClass1 = 0;
          if (nbColumns == 5) { // Optimization for Super Master Mind games
            codeClass1 = codeHandler.getSMMCodeClassId(cur_code, curGame, curGameSize);
            if (listOfClassIds != null) {
              listOfClassIds[cur_code] = codeClass1;
            }
            else {
              throw new Error("NEW_ATTEMPT phase / null listOfClassIds");
            }
          }
          else {
            if (listOfClassIds != null) {
              throw new Error("NEW_ATTEMPT phase / non null listOfClassIds (1)");
            }
          }
          let equiv_code_found = false;
          for (let idx2 = 0; idx2 < nbOfClassesFirstCall; idx2++) {
            if (codeClass1 == listOfClassesIdsFirstCall[idx2]) {
              let known_code = listOfClassesFirstCall[idx2];
              if (areCodesEquivalent(cur_code, known_code, curGameSize, false, -1 /* N.A. */, null)) {
                equiv_code_found = true;
                break;
              }
            }
          }
          if (!equiv_code_found) {
            listOfClassesFirstCall[nbOfClassesFirstCall] = cur_code;
            listOfClassesIdsFirstCall[nbOfClassesFirstCall] = codeClass1;
            nbOfClassesFirstCall++;
          }
        }
      }
      else {
        if (precalculated_cur_game_or_code >= 0) {
          throw new Error("NEW_ATTEMPT phase / invalid optimization");
        }
        if (listOfClassIds != null) {
          throw new Error("NEW_ATTEMPT phase / non null listOfClassIds (2)");
        }
        nbOfClassesFirstCall = -1; // (invalid value)
      }

      // Main useful code processing
      // ***************************

      if ( (precalculated_cur_game_or_code > 0) // both game and code were precalculated
           || ((precalculated_cur_game_or_code == 0) && (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation)) // only game was precalculated and number of possible codes is not too high
           || (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated * 0.58) // number of possible codes is not too high (1/4)
           || ((previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated * 0.70) && (nbOfClassesFirstCall <= 50)) // number of possible codes is not too high (2/4)
           || ((previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated * 0.87) && (nbOfClassesFirstCall <= 25)) // number of possible codes is not too high (3/4)
           || ((previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated) && (nbOfClassesFirstCall <= 15)) ) { // number of possible codes is not too high (****) (4/4)

        if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
          throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (1): " + previousNbOfPossibleCodes + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
        }
        if (nbOfClassesFirstCall <= 0) {
          throw new Error("NEW_ATTEMPT phase / invalid nbOfClassesFirstCall: " + nbOfClassesFirstCall);
        }

        // Initializations
        // ***************

        // ***** First evaluation phase in a game *****
        if (precalculated_cur_game_or_code > 0) { // both game and code were precalculated
          // - Array allocations
          if (!performanceListsInitDoneForPrecalculatedGames) {
            performanceListsInitDoneForPrecalculatedGames = true;
            performanceListsInitDone = false;
            arraySizeAtInit = Math.ceil((3*previousNbOfPossibleCodes + nbOfCodesForSystematicEvaluation_ForMemAlloc)/4); // (overestimated for low values of previousNbOfPossibleCodes to ensure proper subsequent mem_reduc_factor application)
            listOfGlobalPerformances = new Array(arraySizeAtInit);
            maxDepthApplied = 1; // "one-recursive-depth computing of performances" for current game and code (whether possible or impossible) => memory optimization
            listsOfPossibleCodeIndexes = undefined;
            listsOfPossibleCodeIndexes = new3DArray(maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor);
            nbOfPossibleCodes = undefined;
            nbOfPossibleCodes = new2DArray(maxDepthApplied, nbMaxMarks);
            listOfEquivalentCodesAndPerformances = undefined;
            listOfEquivalentCodesAndPerformances = new2DArray(maxDepthApplied, arraySizeAtInit+1);
            for (let idx1 = 0; idx1 < maxDepthApplied; idx1++) { // structure allocation
              for (let idx2 = 0; idx2 < arraySizeAtInit+1; idx2++) {
                listOfEquivalentCodesAndPerformances[idx1][idx2] = {equiv_code:0, equiv_sum:PerformanceNA};
              }
            }
          }
        }
        // ***** Second evaluation phase in a game *****
        else if ( ((precalculated_cur_game_or_code == 0) && (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation)) // only game was precalculated and number of possible codes is not too high
                  || (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated * 0.58) // number of possible codes is not too high (1/4)
                  || ((previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated * 0.70) && (nbOfClassesFirstCall <= 50)) // number of possible codes is not too high (2/4)
                  || ((previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated * 0.87) && (nbOfClassesFirstCall <= 25)) // number of possible codes is not too high (3/4)
                  || ((previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation_AllCodesEvaluated) && (nbOfClassesFirstCall <= 15)) ) { // number of possible codes is not too high (****) (4/4)
          if (precalculated_cur_game_or_code > 0) {
            throw new Error("NEW_ATTEMPT phase / internal error (precalculated_cur_game_or_code)");
          }
          // - Array allocations
          if (!performanceListsInitDone) {
            performanceListsInitDone = true;
            performanceListsInitDoneForPrecalculatedGames = false;
            arraySizeAtInit = Math.ceil((3*previousNbOfPossibleCodes + nbOfCodesForSystematicEvaluation)/4); // (overestimated for low values of previousNbOfPossibleCodes to ensure proper subsequent mem_reduc_factor application)
            listOfGlobalPerformances = new Array(arraySizeAtInit);
            maxDepthApplied = maxDepth;
            listsOfPossibleCodeIndexes = undefined;
            listsOfPossibleCodeIndexes = new3DArray(maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor);
            nbOfPossibleCodes = undefined;
            nbOfPossibleCodes = new2DArray(maxDepthApplied, nbMaxMarks);
            listOfEquivalentCodesAndPerformances = undefined;
            listOfEquivalentCodesAndPerformances = new2DArray(maxDepthApplied, arraySizeAtInit+1);
            for (let idx1 = 0; idx1 < maxDepthApplied; idx1++) { // structure allocation
              for (let idx2 = 0; idx2 < arraySizeAtInit+1; idx2++) {
                listOfEquivalentCodesAndPerformances[idx1][idx2] = {equiv_code:0, equiv_sum:PerformanceNA};
              }
            }
          }
        }
        else {
          throw new Error("NEW_ATTEMPT phase / inconsistent performance evaluation case");
        }

        // - Other initializations
        for (let i = 0; i < arraySizeAtInit; i++) {
          listOfGlobalPerformances[i] = PerformanceNA;
        }
        // listsOfPossibleCodeIndexes is not initialized as this array may be very large
        for (let i = 0; i < maxDepthApplied; i++) {
          for (let j = 0; j < nbMaxMarks; j++) {
            nbOfPossibleCodes[i][j] = 0;
          }
        }

        possibleCodesForPerfEvaluation_InitialIndexes.fill(-1); // invalid value
        possibleCodesForPerfEvaluation_InitialCodesPt = null;
        possibleCodesForPerfEvaluation_OptimizedCodes.fill(0 /* empty code */);
        // Code indexes
        for (let i = 0; i < previousNbOfPossibleCodes; i++) {
          possibleCodesForPerfEvaluation_InitialIndexes[i] = i;
        }
        // Codes indexed
        if (previousNbOfPossibleCodes <= nbCodesLimitForMarkOptimization) {
          // possibleCodesForPerfEvaluation_OptimizedCodes will be the indexed code list used inside the performance evaluation function
          for (let i = 0; i < previousNbOfPossibleCodes; i++) {
            possibleCodesForPerfEvaluation_OptimizedCodes[i] = possibleCodesForPerfEvaluation[index][i];
          }
        }
        else {
          // possibleCodesForPerfEvaluation_InitialCodesPt will be the indexed code list used inside the performance evaluation function
          possibleCodesForPerfEvaluation_InitialCodesPt = possibleCodesForPerfEvaluation[index];
        }

        // Compute performances
        // ********************

        let code_played_global_performance = PerformanceNA;
        if (0 == isAttemptPossibleinGameSolver(curAttemptNumber)) { // code played is possible
          // Evaluate performances for possibleCodesForPerfEvaluation[curAttemptNumber%2]:
          let startTime = (new Date()).getTime();
          best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation_InitialIndexes, previousNbOfPossibleCodes, 0 /* empty code */, precalculated_cur_game_or_code, nbOfClassesFirstCall);
          if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
            let code_played_found = false;
            for (let i = 0; i < previousNbOfPossibleCodes; i++) {
              if ( (possibleCodesForPerfEvaluation[index][i] == codesPlayed[curAttemptNumber-1]) && (listOfGlobalPerformances[i] != PerformanceNA) ) {
                code_played_global_performance = listOfGlobalPerformances[i];
                code_played_found = true;
                break;
              }
            }
            if (!code_played_found) { // error to test
              throw new Error("NEW_ATTEMPT phase / performance of possible code played was not evaluated (" + codeHandler.codeToString(codesPlayed[curAttemptNumber-1]) + ", " + curAttemptNumber + ")");
            }
            console.log("(perfeval#1: best performance: " + best_global_performance
                        + " / code performance: " + code_played_global_performance
                        + " / " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + curNbClasses + ((curNbClasses > 1) ? " classes" : " class")
                        + ((precalculated_cur_game_or_code >= 0) ? ((precalculated_cur_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "") + ")");
          }
          else {
            console.log("(perfeval#1 failed in " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + curNbClasses + ((curNbClasses > 1) ? " classes" : " class")
                        + ((precalculated_cur_game_or_code >= 0) ? ((precalculated_cur_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "") + ")");
          }
        }
        else { // code played is not possible
          // Evaluate performances for possibleCodesForPerfEvaluation[curAttemptNumber%2]:
          let startTime = (new Date()).getTime();
          best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation_InitialIndexes, previousNbOfPossibleCodes, codesPlayed[curAttemptNumber-1], precalculated_cur_game_or_code, nbOfClassesFirstCall);
          if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
            if ((particularCodeGlobalPerformance == PerformanceNA) || (particularCodeGlobalPerformance == PerformanceUNKNOWN) || (particularCodeGlobalPerformance <= 0.01)) {
              throw new Error("NEW_ATTEMPT phase / invalid particularCodeGlobalPerformance: " + particularCodeGlobalPerformance);
            }
            code_played_global_performance = particularCodeGlobalPerformance;
            console.log("(perfeval#2: best performance: " + best_global_performance
                        + " / code performance: " + particularCodeGlobalPerformance
                        + " / " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + curNbClasses + ((curNbClasses > 1) ? " classes" : " class")
                        + ((precalculated_cur_game_or_code >= 0) ? ((precalculated_cur_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "") + ")");
          }
          else {
            console.log("(perfeval#2 failed in " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + curNbClasses + ((curNbClasses > 1) ? " classes" : " class")
                        + ((precalculated_cur_game_or_code >= 0) ? ((precalculated_cur_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "") + ")");
          }
          if (equivalentPossibleCode != 0) {
            throw new Error("NEW_ATTEMPT phase / unexpected equivalent possible code");
          }
        }

        if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
          if ((best_global_performance == PerformanceNA) || (best_global_performance <= 0.01)) {
            throw new Error("NEW_ATTEMPT phase / invalid best_global_performance: " + best_global_performance);
          }
          for (let i = 0; i < previousNbOfPossibleCodes; i++) {
            let global_performance = listOfGlobalPerformances[i];
            if ( (global_performance == PerformanceNA) || (global_performance == PerformanceUNKNOWN) || (global_performance <= 0.01) ) {
              throw new Error("invalid global performance in listOfGlobalPerformances (1): " + global_performance + ", " + best_global_performance + ", " + previousNbOfPossibleCodes + ", " + i);
            }
            if ( (best_global_performance - global_performance < PerformanceMinValidValue) || (best_global_performance - global_performance >= +0.0001) ) {
              throw new Error("invalid global performance in listOfGlobalPerformances (2): " + global_performance + ", " + best_global_performance + ", " + previousNbOfPossibleCodes + ", " + i);
            }
          }
          if ((code_played_global_performance == PerformanceNA) || (code_played_global_performance == PerformanceUNKNOWN) || (code_played_global_performance <= 0.01)) {
            throw new Error("NEW_ATTEMPT phase / invalid code_played_global_performance: " + code_played_global_performance);
          }
          code_played_relative_perf = best_global_performance - code_played_global_performance;
          if ( (code_played_relative_perf < PerformanceMinValidValue) || (code_played_relative_perf > PerformanceMaxValidValue) ) {
            throw new Error("NEW_ATTEMPT phase / invalid relative performance: " + code_played_relative_perf + ", " + best_global_performance + ", " + code_played_global_performance);
          }
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
        if (!check3DArraySizes(listsOfPossibleCodeIndexes, maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor)) {
          throw new Error("NEW_ATTEMPT phase / listsOfPossibleCodeIndexes allocation was modified");
        }
        if (!check2DArraySizes(nbOfPossibleCodes, maxDepthApplied, nbMaxMarks)) {
          throw new Error("NEW_ATTEMPT phase / nbOfPossibleCodes allocation was modified");
        }
        if (curGame.length != nbMaxAttempts+maxDepth) {
          throw new Error("NEW_ATTEMPT phase / curGame allocation was modified");
        }
        if (marksIdxs.length != nbMaxAttempts+maxDepth) {
          throw new Error("NEW_ATTEMPT phase / marksIdxs allocation was modified");
        }
        if ((listOfClassesFirstCall != null) && (listOfClassesFirstCall.length != previousNbOfPossibleCodes)) {
          throw new Error("NEW_ATTEMPT phase / listOfClassesFirstCall allocation was modified");
        }
        if ((listOfClassesIdsFirstCall != null) && (listOfClassesIdsFirstCall.length != previousNbOfPossibleCodes)) {
          throw new Error("NEW_ATTEMPT phase / listOfClassesIdsFirstCall allocation was modified");
        }
        if (!check2DArraySizes(listOfEquivalentCodesAndPerformances, maxDepthApplied, arraySizeAtInit+1)) {
          throw new Error("NEW_ATTEMPT phase / listOfEquivalentCodesAndPerformances allocation was modified");
        }
        if (cur_permutations_table_size.length != overallNbMaxAttempts+overallMaxDepth) {
          throw new Error("NEW_ATTEMPT phase / cur_permutations_table_size allocation was modified");
        }
        if (!check2DArraySizes(cur_permutations_table, overallNbMaxAttempts+overallMaxDepth, cur_permutations_table_size[0])) {
          throw new Error("NEW_ATTEMPT phase / cur_permutations_table allocation was modified");
        }
        if ((lookForCodeInPrecalculatedGamesReuseTable != null) && (lookForCodeInPrecalculatedGamesReuseTable.length != initialNbPossibleCodes)) {
          throw new Error("NEW_ATTEMPT phase / lookForCodeInPrecalculatedGamesReuseTable allocation was modified");
        }
        if ((lookForCodeInPrecalculatedGamesClassIdsTable != null) && (lookForCodeInPrecalculatedGamesClassIdsTable.length != initialNbPossibleCodes)) {
          throw new Error("NEW_ATTEMPT phase / lookForCodeInPrecalculatedGamesClassIdsTable allocation was modified");
        }

        if (code_colors.length != nbMaxColumns) {
          throw new Error("NEW_ATTEMPT phase / code_colors allocation was modified");
        }
        if (other_code_colors.length != nbMaxColumns) {
          throw new Error("NEW_ATTEMPT phase / other_code_colors allocation was modified");
        }
        if ( (!check2DArraySizes(cur_game_code_colors, overallNbMaxAttempts+overallMaxDepth, nbMaxColumns))
             || (cur_game_code_colors.size < curGame.length) ) { // first dimension shall be >= curGame size
          throw new Error("NEW_ATTEMPT phase / cur_game_code_colors allocation was modified or is invalid");
        }
        if ( (!check2DArraySizes(other_game_code_colors, overallNbMaxAttempts+overallMaxDepth, nbMaxColumns))
             || (other_game_code_colors.size < curGame.length) ) { // first dimension shall be >= curGame size
          throw new Error("NEW_ATTEMPT phase / other_game_code_colors allocation was modified or is invalid");
        }
        if (permuted_other_code_colors.length != nbMaxColumns) {
          throw new Error("NEW_ATTEMPT phase / permuted_other_code_colors allocation was modified");
        }
        if (partial_bijection.length != nbMaxColors+1) {
          throw new Error("NEW_ATTEMPT phase / partial_bijection allocation was modified");
        }
        if ( (curGameForGamePrecalculation.length != maxDepthForGamePrecalculation_ForMemAlloc)
             || (marksIdxsForGamePrecalculation.length != maxDepthForGamePrecalculation_ForMemAlloc) ) {
          throw new Error("NEW_ATTEMPT phase / curGameForGamePrecalculation or marksIdxsForGamePrecalculation allocation was modified");
        }

      }
      else {
        best_global_performance = PerformanceUNKNOWN;
        code_played_relative_perf = PerformanceUNKNOWN;
        relative_perf_evaluation_done = false;
      }

    }

    if (best_global_performance == PerformanceNA) {
      throw new Error("NEW_ATTEMPT phase / best_global_performance is NA");
    }
    if (code_played_relative_perf == PerformanceNA) {
      throw new Error("NEW_ATTEMPT phase / code_played_relative_perf is NA");
    }

    // ***************
    // B.2) Update GUI
    // ***************

    self.postMessage({'rsp_type': 'CODE_PLAYED_PERFORMANCE', 'relative_perf_p': code_played_relative_perf, 'best_global_performance_p': best_global_performance, 'relative_perf_evaluation_done_p': relative_perf_evaluation_done, 'classical_useless_code_p': classical_useless_code, 'code_p': codesPlayed[curAttemptNumber-1], 'attempt_nb': curAttemptNumber, 'game_id': game_id});

    // ************************************************
    // C.1) Organize performances of all possible codes
    // ************************************************

    if (nbMaxPossibleCodesShown > nbOfCodesForSystematicEvaluation) {
      throw new Error("NEW_ATTEMPT phase / inconsistent numbers of listed codes: " + nbMaxPossibleCodesShown + " > " + nbOfCodesForSystematicEvaluation);
    }
    let nb_codes_shown = Math.min(previousNbOfPossibleCodes, nbMaxPossibleCodesShown);
    if (nb_codes_shown > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
      throw new Error("NEW_ATTEMPT phase / inconsistent nb_codes_shown or nbOfCodesForSystematicEvaluation_ForMemAlloc value: " + nb_codes_shown + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
    }
    let cur_possible_code_list = possibleCodesForPerfEvaluation[curAttemptNumber%2];

    // Known performance case
    // **********************

    let possibleCodesShownSubdivision = -1; // N.A.
    if (best_global_performance != PerformanceUNKNOWN) {

      if (curAttemptNumber == 1) { // defensive checks at first attempt
        if (nb_codes_shown <= initialNbClasses) {
          throw new Error("NEW_ATTEMPT phase / internal error (nb_codes_shown)");
        }
        if (previousNbOfPossibleCodes != initialNbPossibleCodes) {
          throw new Error("NEW_ATTEMPT phase / internal error (previousNbOfPossibleCodes)");
        }
        if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
          throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (2): " + previousNbOfPossibleCodes + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
        }
      }

      // Total number of code classes
      let total_equiv_code_cnt = 0;
      let first_optimal_code_idx = -1;
      let min_equiv_sum = -1; // N.A.
      while (listOfEquivalentCodesAndPerformances[0 /* (first depth) */][total_equiv_code_cnt].equiv_code != 0) {
        let equiv_sum = listOfEquivalentCodesAndPerformances[0 /* (first depth) */][total_equiv_code_cnt].equiv_sum;
        if ( (equiv_sum > 0)
             && ((min_equiv_sum == -1) || (equiv_sum < min_equiv_sum)) ) {
          min_equiv_sum = equiv_sum;
          first_optimal_code_idx = total_equiv_code_cnt;
        }
        total_equiv_code_cnt++;
      }

      let equiv_code_cnt = 0;
      if (total_equiv_code_cnt > 0) {
        let equiv_code_ratio = 1.0;
        if (total_equiv_code_cnt > nb_codes_shown) {
          equiv_code_ratio = total_equiv_code_cnt / nb_codes_shown; // (> 1.0)
        }

        // Add code classes
        if (first_optimal_code_idx != -1) {
          possibleCodesShown[equiv_code_cnt] = listOfEquivalentCodesAndPerformances[0 /* (first depth) */][first_optimal_code_idx].equiv_code;
          equiv_code_cnt++;
        }
        for (let i = 0; i < total_equiv_code_cnt; i++) {
          let j = Math.floor(i * equiv_code_ratio);
          if (j >= total_equiv_code_cnt) {
            throw new Error("NEW_ATTEMPT phase / internal error (total_equiv_code_cnt): " + j + ", " + total_equiv_code_cnt + ", " + nb_codes_shown + ", " + equiv_code_ratio);
          }
          if (j != first_optimal_code_idx) {
            possibleCodesShown[equiv_code_cnt] = listOfEquivalentCodesAndPerformances[0 /* (first depth) */][j].equiv_code;
            equiv_code_cnt++;
            if (equiv_code_cnt >= nb_codes_shown) {
              break;
            }
          }
        }
      }

      if ((total_equiv_code_cnt > nb_codes_shown) || (total_equiv_code_cnt == 0)) {
        possibleCodesShownSubdivision = -1; // N.A. (subdivision is out of codes shown)
      }
      else {
        possibleCodesShownSubdivision = equiv_code_cnt;
      }

      if (curAttemptNumber == 1) { // defensive check at first attempt
        if (equiv_code_cnt != initialNbClasses) {
          throw new Error("NEW_ATTEMPT phase / internal error (equiv_code_cnt)");
        }
      }

      for (let i = 0; i < equiv_code_cnt; i++) {
        if (best_global_performance == PerformanceUNKNOWN) {
          globalPerformancesShown[i] = PerformanceUNKNOWN;
        }
        else {
          let code_found = false;
          for (let j = 0; j < previousNbOfPossibleCodes; j++) {
            if (possibleCodesShown[i] == cur_possible_code_list[j]) {
              if ((listOfGlobalPerformances[j] == PerformanceNA) || (listOfGlobalPerformances[j] == PerformanceUNKNOWN) || (listOfGlobalPerformances[j] <= 0.01)) {
                throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (1) (index " + i + ")");
              }
              globalPerformancesShown[i] = listOfGlobalPerformances[j];
              code_found = true;
              break;
            }
          }
          if (!code_found) {
            throw new Error("NEW_ATTEMPT phase / internal error (code_found)");
          }
        }
      }

      // Sort code classes
      while (true) {
        let swap_done = false;
        for (let i = 0; i < equiv_code_cnt-1; i++) {
          let j = i+1;
          if (globalPerformancesShown[i] > globalPerformancesShown[j]) {
            // swap cells (bubble sort)
            let tmp_code = possibleCodesShown[j];
            possibleCodesShown[j] = possibleCodesShown[i];
            possibleCodesShown[i] = tmp_code;
            let tmp_perf = globalPerformancesShown[j];
            globalPerformancesShown[j] = globalPerformancesShown[i];
            globalPerformancesShown[i] = tmp_perf;
            swap_done = true;
          }
        }
        if (!swap_done) {
          break;
        }
      }

      // Add other codes
      let cnt = equiv_code_cnt;
      if (equiv_code_cnt < nb_codes_shown) {
        for (let i = 0; i < previousNbOfPossibleCodes; i++) {
          let code_already_present = false;
          for (let j = 0; j < equiv_code_cnt; j++) {
            if (cur_possible_code_list[i] == possibleCodesShown[j]) {
              code_already_present = true;
              break;
            }
          }
          if (!code_already_present) {
            possibleCodesShown[cnt] = cur_possible_code_list[i];
            if (best_global_performance == PerformanceUNKNOWN) {
              globalPerformancesShown[cnt] = PerformanceUNKNOWN;
            }
            else {
              if ((listOfGlobalPerformances[i] == PerformanceNA) || (listOfGlobalPerformances[i] == PerformanceUNKNOWN) || (listOfGlobalPerformances[i] <= 0.01)) {
                throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (2) (index " + i + ")");
              }
              globalPerformancesShown[cnt] = listOfGlobalPerformances[i];
            }
            cnt++;
            if (cnt == nb_codes_shown) {
              break;
            }
          }
        }
      }

      // Sort other codes if there is no code class, keep them in their natural order otherwise
      if (equiv_code_cnt == 0) {
        while (true) {
          let swap_done = false;
          for (let i = 0; i < cnt-1; i++) {
            let j = i+1;
            if (globalPerformancesShown[i] > globalPerformancesShown[j]) { // Order will keep unchanged if all performances are PerformanceUNKNOWN
              // swap cells (bubble sort)
              let tmp_code = possibleCodesShown[j];
              possibleCodesShown[j] = possibleCodesShown[i];
              possibleCodesShown[i] = tmp_code;
              let tmp_perf = globalPerformancesShown[j];
              globalPerformancesShown[j] = globalPerformancesShown[i];
              globalPerformancesShown[i] = tmp_perf;
              swap_done = true;
            }
          }
          if (!swap_done) {
            break;
          }
        }
      }

      // Defensive checks
      // ****************

      for (let i = 0; i < nb_codes_shown; i++) {
        let code = possibleCodesShown[i];
        let perf = globalPerformancesShown[i];
        if (!codeHandler.isFullAndValid(code)) {
          throw new Error("NEW_ATTEMPT phase / internal error: invalid code (" + codeHandler.codeToString(code) + ")");
        }
        let code_found = false;
        for (let j = 0; j < previousNbOfPossibleCodes; j++) {
          if (cur_possible_code_list[j] == code) {
            if (listOfGlobalPerformances[j] != perf) {
              throw new Error("NEW_ATTEMPT phase / internal error: invalid perf (" + codeHandler.codeToString(code) + ")");
            }
            code_found = true;
            break;
          }
        }
        if (!code_found) {
          throw new Error("NEW_ATTEMPT phase / internal error: code not found (" + codeHandler.codeToString(code) + ")");
        }
        for (let j = 0; j < nb_codes_shown; j++) {
          if ((j != i) && (possibleCodesShown[j] == code)) {
            throw new Error("NEW_ATTEMPT phase / internal error: code duplicated (" + codeHandler.codeToString(code) + ")");
          }
        }
      }

    }

    // Unknown performance case
    // ************************

    else {
      for (let i = 0; i < nb_codes_shown; i++) {
        possibleCodesShown[i] = cur_possible_code_list[i];
        if (best_global_performance == PerformanceUNKNOWN) {
          globalPerformancesShown[i] = PerformanceUNKNOWN;
        }
        else {
          if ((listOfGlobalPerformances[i] == PerformanceNA) || (listOfGlobalPerformances[i] == PerformanceUNKNOWN) || (listOfGlobalPerformances[i] <= 0.01)) {
            throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (3) (index " + i + ")");
          }
          globalPerformancesShown[i] = listOfGlobalPerformances[i];
        }
      }
    }

    // ***************
    // C.2) Update GUI
    // ***************

    self.postMessage({'rsp_type': 'LIST_OF_POSSIBLE_CODES', 'possibleCodesList_p': possibleCodesShown.toString(), 'nb_possible_codes_listed': nb_codes_shown, 'possible_codes_subdivision': possibleCodesShownSubdivision, 'equivalent_possible_code': equivalentPossibleCode, 'globalPerformancesList_p': globalPerformancesShown.toString(), 'attempt_nb': curAttemptNumber, 'game_id': game_id});

    // ****************
    // Defensive checks
    // ****************

    // Check if errors occurred when writing into arrays
    if ( (possibleCodesForPerfEvaluation[0].length != nbOfCodesForSystematicEvaluation_ForMemAlloc)
         || (possibleCodesForPerfEvaluation[1].length != nbOfCodesForSystematicEvaluation_ForMemAlloc) ) {
      throw new Error("inconsistent possibleCodesForPerfEvaluation length: " + possibleCodesForPerfEvaluation[0].length + ", " + possibleCodesForPerfEvaluation[1].length + ", " + nbOfCodesForSystematicEvaluation_ForMemAlloc);
    }
    if ((possibleCodesForPerfEvaluation_InitialIndexes == null) || (possibleCodesForPerfEvaluation_InitialIndexes.length != nbOfCodesForSystematicEvaluation_ForMemAlloc)) {
      throw new Error("inconsistent possibleCodesForPerfEvaluation_InitialIndexes");
    }
    if ((possibleCodesForPerfEvaluation_OptimizedCodes == null) || (possibleCodesForPerfEvaluation_OptimizedCodes.length != nbCodesLimitForMarkOptimization)) {
      throw new Error("inconsistent possibleCodesForPerfEvaluation_OptimizedCodes");
    }
    if ((marks_already_computed_table == null) || !check2DArraySizes(marks_already_computed_table, nbCodesLimitForMarkOptimization, nbCodesLimitForMarkOptimization)) {
      throw new Error("inconsistent marks_already_computed_table");
    }
    if ((listOfClassIds != null) && (listOfClassIds.length != 0x88888+1)) {
      throw new Error("inconsistent listOfClassIds length: " + listOfClassIds.length);
    }

  }

  // ****************
  // "Debuffer" event
  // ****************

  else if (init_done && (data.smm_req_type == 'DEBUFFER')) {
    // Debuffering already handled at message reception
  }

  // **********
  // Error case
  // **********

  else {
    throw new Error("unexpected smm_req_type value: " + data.smm_req_type);
  }

}

self.onmessage = function(e) {
  try {

    if (message_processing_ongoing) {
      throw new Error("GameSolver event handling error (message_processing_ongoing is true)");
    }
    message_processing_ongoing = true;

    if (e == undefined) {
      throw new Error("e is undefined");
    }
    if (e.data == undefined) {
      throw new Error("data is undefined");
    }
    let data = e.data;

    if ( (buffer_incoming_messages && (nb_incoming_messages_buffered <= 0))
         || ((!buffer_incoming_messages) && (nb_incoming_messages_buffered > 0)) ) {
      throw new Error("inconsistent buffer_incoming_messages and nb_incoming_messages_buffered values: " + buffer_incoming_messages + ", " + nb_incoming_messages_buffered);
    }

    if ((data.smm_buffer_messages != undefined) && (data.smm_req_type != undefined)) { // (unexpected message - was observed in practice)

      // ********************************************
      // Immediate specific "debuffer" event handling
      // ********************************************

      if (data.smm_req_type == 'DEBUFFER') {
        if (!init_done) {
          throw new Error("DEBUFFER message / init_done");
        }
        if (data.game_id == undefined) {
          throw new Error("DEBUFFER message / game_id is undefined");
        }
        let debuffer_game_id = Number(data.game_id);
        if ( isNaN(debuffer_game_id) || (debuffer_game_id < 0) || (debuffer_game_id != game_id) ) {
          throw new Error("DEBUFFER message / invalid game_id: " + debuffer_game_id + " (" + game_id + ")");
        }

        if (data.smm_buffer_messages != 'no') {
          throw new Error("DEBUFFER message / invalid smm_buffer_messages");
        }
        if (data.precalculated_games == undefined) {
          throw new Error("DEBUFFER phase / precalculated_games is undefined");
        }
        if (data.precalculated_games != "") { // (duplicated code - begin)
          if (nbColumns != 5) { // precalculated_games is only expected for 5 columns games
            throw new Error("DEBUFFER phase / unexpected precalculated_games: " + nbColumns + ", " + curAttemptNumber);
          }
          if (precalculated_games_5columns.length + data.precalculated_games.length > 20000000) { // 20 MB
            throw new Error("DEBUFFER phase / too big precalculated_games: " + precalculated_games_5columns.length);
          }
          precalculated_games_5columns = precalculated_games_5columns + data.precalculated_games;
        } // (duplicated code - end)
      }

      // **********************
      // Global buffer handling
      // **********************

      let stop_message_buffering = false;
      if (data.smm_buffer_messages == 'yes') {
        buffer_incoming_messages = true;
      }
      else if (data.smm_buffer_messages == 'no') {
        if (buffer_incoming_messages) {
          stop_message_buffering = true;
        }
        buffer_incoming_messages = false;
      }
      else {
        throw new Error("unexpected smm_buffer_messages value: " + data.smm_buffer_messages);
      }

      if (buffer_incoming_messages) {
        if (nb_incoming_messages_buffered >= incoming_messages_table.length) {
          throw new Error("GameSolver event handling error (too many buffered incoming messages)");
        }
        incoming_messages_table[nb_incoming_messages_buffered] = JSON.parse(JSON.stringify(data)); // clone/duplicate data into incoming_messages_table[x] (using JSON conversion and back)
        nb_incoming_messages_buffered++;
      }
      else {
        if (stop_message_buffering) {
          if (nb_incoming_messages_buffered <= 0) {
            throw new Error("inconsistent stop_message_buffering flag");
          }
          for (let i = 0; i < nb_incoming_messages_buffered; i++) {
            handleMessage(incoming_messages_table[i]);
            incoming_messages_table[i] = undefined;
          }
          nb_incoming_messages_buffered = 0; // all buffered incoming messages were handled
        }
        handleMessage(data); // handle current incoming message
      }
    }

  }
  catch (exc) {
    message_processing_ongoing = false;
    throw new Error("gameSolver internal error (message): " + exc + ": " + exc.stack);
  }
  message_processing_ongoing = false;
};

if (typeof debug_game_state !== 'undefined') {
  debug_game_state = 77.9;
}
