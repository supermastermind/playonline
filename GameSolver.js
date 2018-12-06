
// ***************************************
// ********** GameSolver script **********
// ***************************************

"use strict";

try {

  // *************************************************************************
  // *************************************************************************
  // Global variables
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

  let currentAttemptNumber = 0;
  let nbMaxAttemptsForEndOfGame = -1;
  let message_processing_ongoing = false;
  let IAmAliveMessageSent = false;

  let attempt_refresh_time_1 = 222;
  let attempt_refresh_time_2 = 0;

  // Performance-related variables
  // *****************************

  let baseOfMaxPerformanceEvaluationTime = 30000; // 30 seconds
  let maxPerformanceEvaluationTime = -1;

  let baseOfNbOfCodesForSystematicEvaluation = 1300; // (high values may induce latencies)
  let nbOfCodesForSystematicEvaluation = -1;
  let nbOfCodesForSystematicEvaluation_ForMemAlloc = -1;

  let initialNbClasses = -1;
  let currentNbClasses = -1;

  let possibleCodesForPerfEvaluation;
  // let initialCodeListForPrecalculatedMode; // (precalculation mode)
  let possibleCodesForPerfEvaluation_lastIndexWritten = -1;
  let mem_reduc_factor = 0.90; // (too low values can lead to dynamic memory allocations)
  let maxDepth = -1;
  let maxDepthApplied = -1;
  let marks_optimization_mask;

  let performanceListsInitDone = false;
  let performanceListsInitDoneForPrecalculatedGames = false;
  let arraySizeAtInit = -1;
  let listOfGlobalPerformances;
  let listsOfPossibleCodes;
  let nbOfPossibleCodes;
  let listOfClassesFirstCall;
  let nbOfClassesFirstCall = -1;
  let listOfEquivalentCodesAndPerformances;
  let marks_already_computed_table = null;
  let nbCodesLimitForEquivalentCodesCheck = 40; // (value determined empirically)

  let PerformanceNA = -3.00; // (duplicated in SuperMasterMind.js)
  let PerformanceUNKNOWN = -2.00; // (duplicated in SuperMasterMind.js)
  let PerformanceMinValidValue = -1.30; // (a valid relative performance can be < -1.00 in some extremely rare cases - duplicated in SuperMasterMind.js)
  let PerformanceMaxValidValue = +0.90; // (a valid relative performance can be > 0.00 in some rare (impossible code) cases - duplicated in SuperMasterMind.js)

  let initialInitDone = false;
  let currentGame;
  let currentGameSize;
  let marksIdxs;
  let all_permutations_table_size;
  let all_permutations_table;
  let current_permutations_table_size = 0;
  let current_permutations_table;

 // *************************************************************************
  // *************************************************************************
  // Game precalculation
  // *************************************************************************
  // *************************************************************************

  let minNbCodesForPrecalculation = 400;
  let nbCodesForPrecalculationThreshold = Math.max(baseOfNbOfCodesForSystematicEvaluation, minNbCodesForPrecalculation); // (shall be in [minNbCodesForPrecalculation, baseOfNbOfCodesForSystematicEvaluation])

  let maxDepthForGamePrecalculation = -1; // (-1 or 3)
  let maxDepthForGamePrecalculation_ForMemAlloc = 10;
  let currentGameForGamePrecalculation = new Array(maxDepthForGamePrecalculation_ForMemAlloc);
  currentGameForGamePrecalculation.fill(0); /* empty code */
  let marksIdxsForGamePrecalculation = new Array(maxDepthForGamePrecalculation_ForMemAlloc);
  marksIdxsForGamePrecalculation.fill(-1);

  let precalculation_mode_mark = {nbBlacks:0, nbWhites:0};

  // ************************************************************************************************************************
  // Table generated for {4 columns, >= 400 possible codes}
  // ************************************************************************************************************************

  let precalculated_games_4columns =
    "1|1111:1B0W|N:500|1222:654,1223:5C4,1234:5E2,1112:696,1122:642,1123:5F9,2222:6F9,2223:61E,2233:5E5,2234:5D7,2345:60C." +
    "1|1111:0B0W|N:625|2222:892,2223:78C,2233:753,2234:73B,2345:78C." +
    "0||N:1296|1111:13C7,1112:11C8,1122:1168,1123:110C,1234:115F.";

  // ************************************************************************************************************************
  // Table generated for {5 columns, >= XXX possible codes, max depth = X, possible & impossible codes listed till depth = Y}
  // ************************************************************************************************************************

  let precalculated_games_5columns = "0||N:32768|11111:28B03,11112:25A19,11122:24BF0,11123:24501,11223:23ED9,11234:23F55,12345:244BA.";

  // ***************************
  // Look for precalculated game
  // ***************************

  let dotStr = ".";
  let separatorStr = "|";
  let separator2Str = ":";
  let separator3Str = ",";
  let nbCodesPrefixStr = "N:";
  let precalculated_mark = {nbBlacks:0, nbWhites:0};
  function lookForCodeInPrecalculatedGames(code_p, current_game_size, nb_possible_codes_p) {

    if (current_game_size > maxDepthForGamePrecalculation) {
      throw new Error("lookForCodeInPrecalculatedGames: invalid game size: " + current_game_size);
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
      if (depth != current_game_size) {
        // End of loop processing
        last_dot_index = dot_index+1;
        continue;
      }

      // Parse precalculated game
      // ************************

      let last_separator_index = separator_index1+1;
      if (current_game_size == 0) {
        last_separator_index++;
      }
      else {
        for (let i = 0; i < current_game_size; i++) {
          // Precalculated code
          let separator_index2 = line_str.indexOf(separator2Str, last_separator_index);
          let code_str = line_str.substring(last_separator_index, separator_index2);
          let code = codeHandler.uncompressStringToCode(code_str);
          // Precalculated mark
          let separator_index3 = line_str.indexOf(separatorStr, separator_index2+1);
          let mark_str = line_str.substring(separator_index2+1, separator_index3);
          codeHandler.stringToMark(mark_str, precalculated_mark);

          currentGameForGamePrecalculation[i] = code;
          marksIdxsForGamePrecalculation[i] = marksTable_MarkToNb[precalculated_mark.nbBlacks][precalculated_mark.nbWhites];

          last_separator_index = separator_index3+1;
        }
      }

      // Check marks equivalence
      // ***********************

      let areAllMarksEqual = true;
      for (let i = 0; i < current_game_size; i++) {
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

      if (!areCodesEquivalent(0, 0, current_game_size, true, -1 /* N.A. */, currentGameForGamePrecalculation)) {
        // End of loop processing
        last_dot_index = dot_index+1;
        continue;
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

      let last_end_of_code_perf_pair_index = separator_index4+1;
      while (true) {
        let middle_of_code_perf_pair_index = line_str.indexOf(separator2Str, last_end_of_code_perf_pair_index);
        if (middle_of_code_perf_pair_index == -1) {
          throw new Error("lookForCodeInPrecalculatedGames: inconsistent code and perf pair: " + line_str);
        }

        // Precalculated code
        let code_str = line_str.substring(last_end_of_code_perf_pair_index, middle_of_code_perf_pair_index);
        let code = codeHandler.uncompressStringToCode(code_str);

        // Precalculated sum
        let separator_index5 = line_str.indexOf(separator3Str, middle_of_code_perf_pair_index+1);
        if (separator_index5 == -1) {
          separator_index5 = line_str.indexOf(dotStr, middle_of_code_perf_pair_index+1);
          if (separator_index5 != last_line_str_index) {
            throw new Error("lookForCodeInPrecalculatedGames: inconsistent end of line: " + separator_index5 + ", " + last_line_str_index);
          }
        }
        let sum_str = line_str.substring(middle_of_code_perf_pair_index+1, separator_index5);
        let sum = Number("0x" + sum_str); // (hexa number parsing)
        if (isNaN(sum) || (sum <= 0)) {
          throw new Error("lookForCodeInPrecalculatedGames: invalid sum: " + sum_str);
        }
        // console.log(codeHandler.codeToString(code) + ":" + sum + ",");

        // Check global game + code equivalence
        // console.log("assessed: " + compressed_str_from_lists_of_codes_and_markidxs(currentGameForGamePrecalculation, marksIdxsForGamePrecalculation, current_game_size) + " for code "  + codeHandler.codeToString(code));
        // console.log(" versus " + str_from_list_of_codes(currentGame, current_game_size) + " for code " + codeHandler.codeToString(code_p));
        if (areCodesEquivalent(code_p, code /* (shall be in second parameter) */, current_game_size, false, -1 /* N.A. */, currentGameForGamePrecalculation)) {
          // console.log("precalculated game found: " + compressed_str_from_lists_of_codes_and_markidxs(currentGameForGamePrecalculation, marksIdxsForGamePrecalculation, current_game_size));
          return sum; // precalculated sum found
        }

        // End of loop processing
        if (separator_index5 >= last_line_str_index) {
          break;
        }
        last_end_of_code_perf_pair_index = separator_index5+1;
      }

      // End of loop processing
      last_dot_index = dot_index+1;
    } // end while

    return -1; // no precalculated sum found

  }

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

      this.different_colors = new Array(this.nbColors+1)
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
      let code = 0; /* empty code */
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

      let marks_already_computed_table_cell;
      let codeX;
      let codeY;

      // Marks optimization (1/2) - begin
      // Notes: - Hash key computing shall be symetrical wrt code1 and code2 and very fast.
      //        - Bit operations are done on 32 bits in javascript (so for example 'x >> y', with x > 0 on 64 bits, may be negative).
      //        - The final hash key will anyway always be in the range [0, marks_optimization_mask] after bit mask application with the '&' operator.

      let sum_codes = code1 + code2;
      let key = ( (sum_codes /* (use LSBs) */
                  + (sum_codes >> 9) /* (use MSBs) */
                  + code1 * code2 /* (mix LSBs) */) & marks_optimization_mask ); // (duplicated code)
      marks_already_computed_table_cell = marks_already_computed_table[key];
      codeX = marks_already_computed_table_cell.code1a;
      codeY = marks_already_computed_table_cell.code2a;
      if ( ((codeX == code1) && (codeY == code2)) || ((codeX == code2) && (codeY == code1)) ) {
        mark.nbBlacks = marks_already_computed_table_cell.nbBlacksa;
        mark.nbWhites = marks_already_computed_table_cell.nbWhitesa;
      }
      else {
        codeX = marks_already_computed_table_cell.code1b;
        codeY = marks_already_computed_table_cell.code2b;
        if ( ((codeX == code1) && (codeY == code2)) || ((codeX == code2) && (codeY == code1)) ) {
          mark.nbBlacks = marks_already_computed_table_cell.nbBlacksb;
          mark.nbWhites = marks_already_computed_table_cell.nbWhitesb;
        }
        else {
          codeX = marks_already_computed_table_cell.code1c;
          codeY = marks_already_computed_table_cell.code2c;
          if ( ((codeX == code1) && (codeY == code2)) || ((codeX == code2) && (codeY == code1)) ) {
            mark.nbBlacks = marks_already_computed_table_cell.nbBlacksc;
            mark.nbWhites = marks_already_computed_table_cell.nbWhitesc;
          }
          // Marks optimization (1/2) - end
          else {
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

            // Marks optimization (2/2) - begin
            if (marks_already_computed_table_cell.write_index == 0) {
              marks_already_computed_table_cell.code1a = code1;
              marks_already_computed_table_cell.code2a = code2;
              marks_already_computed_table_cell.nbBlacksa = nbBlacks;
              marks_already_computed_table_cell.nbWhitesa = nbWhites;
              marks_already_computed_table_cell.write_index = 1;
            }
            else if (marks_already_computed_table_cell.write_index == 1) {
              marks_already_computed_table_cell.code1b = code1;
              marks_already_computed_table_cell.code2b = code2;
              marks_already_computed_table_cell.nbBlacksb = nbBlacks;
              marks_already_computed_table_cell.nbWhitesb = nbWhites;
              marks_already_computed_table_cell.write_index = 2;
            }
            else if (marks_already_computed_table_cell.write_index == 2) {
              marks_already_computed_table_cell.code1c = code1;
              marks_already_computed_table_cell.code2c = code2;
              marks_already_computed_table_cell.nbBlacksc = nbBlacks;
              marks_already_computed_table_cell.nbWhitesc = nbWhites;
              marks_already_computed_table_cell.write_index = 0;
            }
            else {
              throw new Error("CodeHandler: fillMark (wrong write_index: " + marks_already_computed_table_cell.write_index + ")");
            }
            // Marks optimization (2/2) - end
          }
        }
      }

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
      if (!codeHandler.isMarkValid(mark)) {
        throw new Error("CodeHandler: stringToMark (4) (" + str + ")");
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
      N = 5;
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
    current_permutations_table_size = new Array(overallNbMaxAttempts+overallMaxDepth);
    current_permutations_table_size[0] = all_permutations_table_size[nbColumns];
    current_permutations_table = new2DArray(overallNbMaxAttempts+overallMaxDepth, current_permutations_table_size[0]);
    for (let i = 0; i < current_permutations_table_size[0]; i++) {
      current_permutations_table[0][i] = i;
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
    self.postMessage({'rsp_type': 'TRACE', 'trace_contents': trace_str});
  }

  let code_colors = new Array(nbMaxColumns);
  let other_code_colors = new Array(nbMaxColumns);
  let different_colors_1 = new Array(nbMaxColors+1);
  let different_colors_2 = new Array(nbMaxColors+1);
  let current_game_code_colors = new2DArray(overallNbMaxAttempts+overallMaxDepth, nbMaxColumns); // first dimension shall be >= currentGame size
  let other_game_code_colors = new2DArray(overallNbMaxAttempts+overallMaxDepth, nbMaxColumns); // first dimension shall be >= currentGame size
  let permuted_other_code_colors = new Array(nbMaxColumns);
  let partial_bijection = new Array(nbMaxColors+1);
  function areCodesEquivalent(code, other_code, current_game_size, assess_current_game_only, forceGlobalPermIdx /* -1 if N.A. */, otherGame /* null if N.A. */) {
    let all_permutations = all_permutations_table[nbColumns]; // [nb_permutations][nbColumns] array
    let global_perm_idx;
    let perm_idx;
    let current_game_depth;
    let current_game_code;
    let other_game_code;
    let current_game_code_colors_set;
    let other_game_code_colors_set;
    let col;
    let color;
    let bijection_is_possible_for_this_permutation;
    let source_color, old_target_color, new_target_color;

    // *****************
    // Get useful colors
    // *****************

    // 2 codes colors
    if (!assess_current_game_only) {

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
        if (current_game_size == 0) {
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
    for (current_game_depth = 0; current_game_depth < current_game_size; current_game_depth++) {
      current_game_code = currentGame[current_game_depth]
      current_game_code_colors_set = current_game_code_colors[current_game_depth]; // [nbMaxColumns] array

      // (duplicated code from getColor() for better performances - begin)
      current_game_code_colors_set[0] = (current_game_code & 0x0000000F);
      current_game_code_colors_set[1] = ((current_game_code >> 4) & 0x0000000F);
      current_game_code_colors_set[2] = ((current_game_code >> 8) & 0x0000000F);
      current_game_code_colors_set[3] = ((current_game_code >> 12) & 0x0000000F);
      current_game_code_colors_set[4] = ((current_game_code >> 16) & 0x0000000F);
      current_game_code_colors_set[5] = ((current_game_code >> 20) & 0x0000000F);
      current_game_code_colors_set[6] = ((current_game_code >> 24) & 0x0000000F);
      // (duplicated code from getColor() for better performances - end)
    }
    if (otherGame != null) {
      for (current_game_depth = 0; current_game_depth < current_game_size; current_game_depth++) {
        other_game_code = otherGame[current_game_depth]
        other_game_code_colors_set = other_game_code_colors[current_game_depth]; // another game is used - [nbMaxColumns] array

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
      permLoopStopIdx = current_permutations_table_size[current_game_size];
    }
    else { // (otherGame != null)
      permLoopStopIdx = current_permutations_table_size[0]; // all permutations
    }

    if (permLoopStopIdx <= permLoopStartIdx) {
      throw new Error("areCodesEquivalent: no permutation");
    }

    for (perm_idx = permLoopStartIdx; perm_idx < permLoopStopIdx; perm_idx++) {

      if (forceGlobalPermIdx != -1) { // Evaluate one given permutation only
        global_perm_idx = forceGlobalPermIdx;
      }
      else if (otherGame == null) {
        global_perm_idx = current_permutations_table[current_game_size][perm_idx];
      }
      else { // (otherGame != null)
        global_perm_idx = current_permutations_table[0][perm_idx]; // all permutations
      }
      // console.log("permutation:" + all_permutations[global_perm_idx]);

      // **********************************************************************
      // If possible, compute bijection between:
      // 1) code and permuted other code (if assess_current_game_only is false)
      // 2) current game and permuted game
      // **********************************************************************

      bijection_is_possible_for_this_permutation = true;
      partial_bijection.fill(0);

      // 1) Bijection between code and permuted other code (if assess_current_game_only is false)
      // ****************************************************************************************

      if (!assess_current_game_only) {

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
          /* if (partial_bijection[source_color] != new_target_color) {
            console.log(source_color + " -> " + new_target_color);
          } */
          partial_bijection[source_color] = new_target_color;
        }

      }

      // 2) Bijection between current game and permuted game
      // ***************************************************

      if (bijection_is_possible_for_this_permutation) {

        for (current_game_depth = current_game_size-1; current_game_depth >= 0; current_game_depth--) { // (impacts on permutations are more likely for the last played codes)
          current_game_code_colors_set = current_game_code_colors[current_game_depth]; // [nbMaxColumns] array
          if (otherGame == null) {
            other_game_code_colors_set = current_game_code_colors_set; // current game is used twice - [nbMaxColumns] array
          }
          else { // (otherGame != null)
            other_game_code_colors_set = other_game_code_colors[current_game_depth]; // another game is used - [nbMaxColumns] array
          }

          // Compute permuted other code
          for (col = 0; col < nbColumns; col++) {
            permuted_other_code_colors[all_permutations[global_perm_idx][col]] = other_game_code_colors_set[col];
          }

          // console.log("  permuted_other_code_colors = " + permuted_other_code_colors);

          for (col = 0; col < nbColumns; col++) {
            source_color = current_game_code_colors_set[col];
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
            /* if (partial_bijection[source_color] != new_target_color) {
              console.log(source_color + " -> " + new_target_color);
            } */
            partial_bijection[source_color] = new_target_color;
          }
        } // end loop on current game

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

  let code1_colors = new Array(nbMaxColumns);
  let code2_colors = new Array(nbMaxColumns);
  let colors_int = new Array(nbMaxColumns);

  let particularCodeToAssess = 0; /* empty code */
  let particularCodeGlobalPerformance = PerformanceNA;
  let recursiveEvaluatePerformancesWasAborted = false;

  let areCurrentGameAndCodePrecalculated = false;

  // Outputs: listOfGlobalPerformances[]
  //          particularCodeGlobalPerformance in case of impossible code
  function evaluatePerformances(depth, listOfCodes, nbCodes, particularCode, areCurrentGameAndCodePrecalculated_p) {

    let idx;
    let res;

    evaluatePerformancesStartTime = new Date().getTime();

    // Defensive check
    if ((best_mark_idx != marksTable_MarkToNb[nbColumns][0]) || (best_mark_idx >= nbMaxMarks)) {
      throw new Error("evaluatePerformances: invalid best_mark_idx");
    }
    if ((worst_mark_idx != marksTable_MarkToNb[0][0]) || (worst_mark_idx >= nbMaxMarks)) {
      throw new Error("evaluatePerformances: invalid worst_mark_idx");
    }
    if (currentAttemptNumber <= 0) {
      throw new Error("evaluatePerformances: invalid currentAttemptNumber: " + currentAttemptNumber);
    }

    areCurrentGameAndCodePrecalculated = areCurrentGameAndCodePrecalculated_p;

    if (depth == -1) { // first call

      // Check current game (useful for subsequent equivalent codes processing - duplicated code)
      if (currentGameSize != currentAttemptNumber-1) {
        throw new Error("evaluatePerformances: invalid currentGameSize");
      }
      for (idx = 0; idx < currentGameSize; idx++) {
        if ( (currentGame[idx] != codesPlayed[idx]) || (!codeHandler.isFullAndValid(currentGame[idx])) ) {
          throw new Error("evaluatePerformances: invalid current game (" + idx + ")");
        }
        if ( (!codeHandler.marksEqual(marksTable_NbToMark[marksIdxs[idx]], marks[idx])) || (!codeHandler.isMarkValid(marksTable_NbToMark[marksIdxs[idx]])) )  {
          throw new Error("evaluatePerformances: invalid current marks (" + idx + ")");
        }
      }

      // Determine current number of classes
      // ***********************************

      listOfClassesFirstCall.fill(0);
      nbOfClassesFirstCall = 0;

      for (let idx1 = 0; idx1 < nbCodes; idx1++) {
        let current_code = listOfCodes[idx1];
        let equiv_code_found = false;
        for (let idx2 = 0; idx2 < nbOfClassesFirstCall; idx2++) {
          let known_code = listOfClassesFirstCall[idx2];
          if (areCodesEquivalent(current_code, known_code, currentGameSize, false, -1 /* N.A. */, null)) {
            equiv_code_found = true;
            break;
          }
        }
        if (!equiv_code_found) {
          listOfClassesFirstCall[nbOfClassesFirstCall] = current_code;
          nbOfClassesFirstCall++;
        }
      }

      currentNbClasses = nbOfClassesFirstCall;
      if ( (currentNbClasses <= 0) || (currentNbClasses > nbCodes)
           || ((currentGameSize == 0) && (currentNbClasses != initialNbClasses)) ) {
        throw new Error("evaluatePerformances: invalid currentNbClasses: " + currentNbClasses);
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

      particularCodeToAssess = particularCode;
      res = recursiveEvaluatePerformances(depth, listOfCodes, nbCodes);

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

  // XXX Further work to do:
  // - X) nbCodesForPrecalculationThreshold modif => precalculation may only be valid for possible codes => memory alloc to do normally, transition precalc -> memory alloc earlier and not in that direction only!
  // - X) "precalculated_current_game_and_code" => "game_precalculated"
  // - X) LONG PROCESSING TIME - 37 sec for 365 possibles codes on i5 processor.png
  // - X) test strictly positive precalculated perf
  // - X) XXX Precalculate {5 columns, 8 colors} games, check possible & impossible & useless & "some-useless-color" codes, check RAM due to nbOfCodesForSystematicEvaluation_ForMemAlloc
  // - X) Precalculated table split in several javascript modules to decrease size loaded?
  // - X) XXXs/TBCs/TBDs in all files
  // - XXX Max nber of attempts for SMM games once precalculation fully stored + check total sum of attempts at the same time
  // - X) Complete forum? -> https://codegolf.stackexchange.com/questions/31926/mastermind-strategy
  // - X) XXX Appli Android?
  // - X) XXX If still some sporadic undefined GameSolver errors, remaining tracks: 1) good solution? thread code in same .js file is possible (only one .js file loaded) - still error in local Chrome execution? / or cumulated with module importation https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file 2) pb when loading the .js worker file? (cf. img - can occur at very first creation as seen!) => unavoidable except by retry (if not alive yet) 3) Wait a bit before sending first message, the time the worker is fully operational?
  function recursiveEvaluatePerformances(depth, listOfCodes, nbCodes) {

    let first_call = (depth == -1);
    let next_depth = depth+1;
    let next_current_game_idx = currentGameSize + next_depth;
    let nextListsOfCodes;
    let nextNbsCodes;
    let nbOfEquivalentCodesAndPerformances = 0;
    let mark_idx, idx, idx1, idx2;
    let current_code;
    let other_code;
    let mark_perf_tmp_idx;
    let compute_sum_ini = (nbCodes <= nbCodesLimitForEquivalentCodesCheck);
    let compute_sum;
    let precalculated_current_game_and_code = (first_call && areCurrentGameAndCodePrecalculated);
    let precalculated_sum;
    // let write_me; // (traces useful for debug)
    // let write_me_for_precalculation; // (precalculation mode)
    let sum;
    let sum_marks;
    let best_sum = 100000000000.0;
    let marks_already_computed_table_cell;
    let codeX;
    let codeY;
    let nb_classes_cnt = 0;

    /*
    // (precalculation mode)
    // Note: if some specific rules are applied, they shall be more and more constraining when depth increases
    let precalculation_mode = ( (nbCodes >= minNbCodesForPrecalculation) // (**) only games for which there may not be enough CPU capacity / time to calculate performances online
                                && (next_current_game_idx <= maxDepthForGamePrecalculation) // (-1 or 3)
                                && ( (next_current_game_idx < maxDepthForGamePrecalculation) // (-1 or 3)
                                     || ((next_current_game_idx == 3) && codeHandler.isVerySimple(currentGame[0]) && codeHandler.isVerySimple(currentGame[1]) && codeHandler.isVerySimple(currentGame[2])) ) // (***)
                                && (!compute_sum_ini) ); // not a leaf
    let str; // (precalculation mode)
    let precalculation_start_time; // (precalculation mode)
    if (precalculation_mode) {
      str = next_current_game_idx + "|" + compressed_str_from_lists_of_codes_and_markidxs(currentGame, marksIdxs, next_current_game_idx) + "|N:" + nbCodes + "|";
      send_trace_msg("-" + str + " is being computed... " + new Date());
      precalculation_start_time = new Date().getTime();
    } */

    // Initializations
    // ***************

    if (next_depth >= maxDepth) {
      throw new Error("recursiveEvaluatePerformances: max depth reached");
    }

    nextListsOfCodes = listsOfPossibleCodes[next_depth]; // [nbMaxMarks][n]
    nextNbsCodes = nbOfPossibleCodes[next_depth]; // [nbMaxMarks] array

    // Evaluate performances of possible codes
    // ***************************************

    /*
    let nbCodesToGoThrough = nbCodes; // (precalculation mode)
    if (precalculation_mode) { // (precalculation mode)
      nbCodesToGoThrough = nbCodesToGoThrough + initialNbPossibleCodes; // add also impossible codes
    }

    for (idx1 = 0; idx1 < nbCodesToGoThrough; idx1++) { // (precalculation mode)

      // Split precalculation if needed
      // if (first_call && (idx1 != 83)) {
      //  continue;
      // }

      if (idx1 < nbCodes) {
        current_code = listOfCodes[idx1];
      }
      else {
        current_code = initialCodeListForPrecalculatedMode[idx1 - nbCodes]; // (precalculation mode) / add also impossible codes

        // Precalculation optimization (1/3): skip current code if needed
        if (!precalculation_mode) {
          throw new Error("recursiveEvaluatePerformances: precalculation_mode error");
        }
        let skip_current_code = false;
        for (let i = 0; i < next_current_game_idx; i++) {
          // (replayed codes are addressed more generally below through useless codes, as all codes equivalent to replayed codes shall be covered to reach an optimization)
          // if (current_code == currentGame[i]) {
          //  skip_current_code = true; // code replayed
          //  break;
          // }
          if (marksIdxs[i] == worst_mark_idx) { // 0 black + 0 white mark => all colors in this code are obviously impossible
            codeHandler.fillMark(current_code, currentGame[i], precalculation_mode_mark);
            if ((precalculation_mode_mark.nbBlacks > 0) || (precalculation_mode_mark.nbWhites > 0)) {
              skip_current_code = true; // obviously impossible color played
              break;
            }
          }
        }
        // Precalculation optimization (2/3): skip impossible codes if acceptable
        if ((next_current_game_idx >= 2) && (nbCodes <= nbCodesForPrecalculationThreshold)) {
          if (next_current_game_idx == 2) {
            if (!(codeHandler.isVerySimple(currentGame[0]) && codeHandler.isVerySimple(currentGame[1]) && codeHandler.isVerySimple(current_code))) { // (***)
              skip_current_code = true;
            }
          }
          else {
            skip_current_code = true;
          }
        }
        if (skip_current_code) {
          continue; // skip current code
        }

      }
    */
    for (idx1 = 0; idx1 < nbCodes; idx1++) {
      current_code = listOfCodes[idx1];

      /* if ((depth <= 1) &&(!compute_sum_ini)) { // Specific trace
        console.log(spaces(depth) + "(depth " + depth + ") " + "CURRENT_CODE:" + codeHandler.codeToString(current_code));
        console.log(spaces(depth) + "current game: " + str_from_list_of_codes(currentGame, next_current_game_idx));
        console.log(spaces(depth) + "perms: " + current_permutations_table_size[next_current_game_idx] + ": "
                    + print_permutation_list(current_permutations_table[next_current_game_idx], current_permutations_table_size[next_current_game_idx]));
      } */
      // write_me = false; // (traces useful for debug)
      // write_me_for_precalculation = false; // (precalculation mode)

      compute_sum = compute_sum_ini;
      // precalculated_sum = false; useless setting due to compute_sum setting
      if (!compute_sum) {
        sum = 0.0;
        for (idx = 0; idx < nbOfEquivalentCodesAndPerformances; idx++) {
          let known_code = listOfEquivalentCodesAndPerformances[next_depth][idx].equiv_code;
          if (areCodesEquivalent(current_code, known_code, next_current_game_idx, false, -1 /* N.A. */, null)) {
            sum = listOfEquivalentCodesAndPerformances[next_depth][idx].equiv_sum;
            break;
          }
        }
        if (sum < 0.00) {
          throw new Error("recursiveEvaluatePerformances: negative sum (1): " + sum);
        }
        compute_sum = (sum == 0.0);

        precalculated_sum = false;
        if (precalculated_current_game_and_code && compute_sum /* && (!precalculation_mode) */) { // (precalculation mode)
          sum = lookForCodeInPrecalculatedGames(current_code, next_current_game_idx, nbCodes);
          if (sum != -1) { // precalculated sum found
            compute_sum = false;
            precalculated_sum = true;

            if (!compute_sum_ini) {
              listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_code = current_code;
              listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_sum = sum;
              nbOfEquivalentCodesAndPerformances++;
            }
          }
          else { // no precalculated sum found
            throw new Error("recursiveEvaluatePerformances: cannot find precalculated game and code (possible code): " + codeHandler.codeToString(current_code));
            // compute_sum = true;
          }
        }
      }

      if (compute_sum) { // compute_sum

        /* if (first_call) { // (traces useful for debug)
          console.log("assessed: " + codeHandler.codeToString(current_code));
          write_me = true;
        } */
        // write_me_for_precalculation = true; // (precalculation mode)

        nextNbsCodes.fill(0); // (faster than (or close to) a loop on 0..nbMaxMarks-1)

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
            let code1 = current_code;
            let code2 = other_code;

            // Marks optimization (1/2) - begin
            // Notes: - Hash key computing shall be symetrical wrt code1 and code2 and very fast.
            //        - Bit operations are done on 32 bits in javascript (so for example 'x >> y', with x > 0 on 64 bits, may be negative).
            //        - The final hash key will anyway always be in the range [0, marks_optimization_mask] after bit mask application with the '&' operator.
            let sum_codes = code1 + code2;
            let key = ( (sum_codes /* (use LSBs) */
                        + (sum_codes >> 9) /* (use MSBs) */
                        + code1 * code2 /* (mix LSBs) */) & marks_optimization_mask ); // (duplicated code)
            marks_already_computed_table_cell = marks_already_computed_table[key];
            codeX = marks_already_computed_table_cell.code1a;
            codeY = marks_already_computed_table_cell.code2a;
            if ( ((codeX == code1) && (codeY == code2)) || ((codeX == code2) && (codeY == code1)) ) {
              mark_perf_tmp.nbBlacks = marks_already_computed_table_cell.nbBlacksa;
              mark_perf_tmp.nbWhites = marks_already_computed_table_cell.nbWhitesa;
            }
            else {
              codeX = marks_already_computed_table_cell.code1b;
              codeY = marks_already_computed_table_cell.code2b;
              if ( ((codeX == code1) && (codeY == code2)) || ((codeX == code2) && (codeY == code1)) ) {
                mark_perf_tmp.nbBlacks = marks_already_computed_table_cell.nbBlacksb;
                mark_perf_tmp.nbWhites = marks_already_computed_table_cell.nbWhitesb;
              }
              else {
                codeX = marks_already_computed_table_cell.code1c;
                codeY = marks_already_computed_table_cell.code2c;
                if ( ((codeX == code1) && (codeY == code2)) || ((codeX == code2) && (codeY == code1)) ) {
                  mark_perf_tmp.nbBlacks = marks_already_computed_table_cell.nbBlacksc;
                  mark_perf_tmp.nbWhites = marks_already_computed_table_cell.nbWhitesc;
                }
                // Marks optimization (1/2) - end
                else {
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

                  mark_perf_tmp.nbBlacks = nbBlacks;
                  mark_perf_tmp.nbWhites = nbWhites;

                  // Marks optimization (2/2) - begin
                  if (marks_already_computed_table_cell.write_index == 0) {
                    marks_already_computed_table_cell.code1a = code1;
                    marks_already_computed_table_cell.code2a = code2;
                    marks_already_computed_table_cell.nbBlacksa = nbBlacks;
                    marks_already_computed_table_cell.nbWhitesa = nbWhites;
                    marks_already_computed_table_cell.write_index = 1;
                  }
                  else if (marks_already_computed_table_cell.write_index == 1) {
                    marks_already_computed_table_cell.code1b = code1;
                    marks_already_computed_table_cell.code2b = code2;
                    marks_already_computed_table_cell.nbBlacksb = nbBlacks;
                    marks_already_computed_table_cell.nbWhitesb = nbWhites;
                    marks_already_computed_table_cell.write_index = 2;
                  }
                  else if (marks_already_computed_table_cell.write_index == 2) {
                    marks_already_computed_table_cell.code1c = code1;
                    marks_already_computed_table_cell.code2c = code2;
                    marks_already_computed_table_cell.nbBlacksc = nbBlacks;
                    marks_already_computed_table_cell.nbWhitesc = nbWhites;
                    marks_already_computed_table_cell.write_index = 0;
                  }
                  else {
                    throw new Error("recursiveEvaluatePerformances: wrong write_index: " + marks_already_computed_table_cell.write_index);
                  }
                  // Marks optimization (2/2) - end
                }
              }
            }
            // (duplicated code from fillMark() for better performances (2/2) - end)

            mark_perf_tmp_idx = marksTable_MarkToNb[mark_perf_tmp.nbBlacks][mark_perf_tmp.nbWhites];
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
        // let useless_current_code = false; // (precalculation mode)
        for (mark_idx = nbMaxMarks-1; mark_idx >= 0; mark_idx--) {
          let nextNbCodes = nextNbsCodes[mark_idx];
          // Go through all sets of possible marks
          if (nextNbCodes > 0) {

            /* if (nextNbCodes == nbCodes) { // (precalculation mode)
              useless_current_code = true;
              break;
            } */

            sum_marks += nextNbCodes;
            if (mark_idx == best_mark_idx) {
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
              let nextListOfCodesToConsider = nextListsOfCodes[mark_idx];
              codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[1], mark_perf_tmpa);
              codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[2], mark_perf_tmpb);
              if ((mark_perf_tmpa.nbBlacks == mark_perf_tmpb.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpb.nbWhites)) {
                codeHandler.fillMark(nextListOfCodesToConsider[1], nextListOfCodesToConsider[2], mark_perf_tmpc);
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
              if (sum_marks == nbCodes) break;
            }
            else if (nextNbCodes == 4) {

              // An optimal code being played, if it is not the secret code, can lead to:
              // a) 3 groups of 1 code => obviously optimal (performance will be 1+2+2+2=7).
              // b) 1 group of 3 codes => at best, the performance will be 1+2+3+3=9. Thus there can't be any other c) case for the other codes
              //    (because performance would be 8 < 9), which means all marks are equal for the 6 pairs of codes (performance will be 1+2+3+4=10).
              // c) 1 group of 1 code and 1 group of 2 codes (performance will be 1+2+2+3=8).

              let nextListOfCodesToConsider = nextListsOfCodes[mark_idx];
              codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[1], mark_perf_tmpa); // a
              codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[2], mark_perf_tmpb); // b
              codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[3], mark_perf_tmpc); // c
              let a_b = ((mark_perf_tmpa.nbBlacks == mark_perf_tmpb.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpb.nbWhites));
              let a_c = ((mark_perf_tmpa.nbBlacks == mark_perf_tmpc.nbBlacks) && (mark_perf_tmpa.nbWhites == mark_perf_tmpc.nbWhites));
              let b_c = ((mark_perf_tmpb.nbBlacks == mark_perf_tmpc.nbBlacks) && (mark_perf_tmpb.nbWhites == mark_perf_tmpc.nbWhites));
              if ((!a_b) && (!a_c) && (!b_c)) { // a) 3 different marks when code 0 is played
                sum = sum + 7.0; // 4 * ((1+2+2+2)/4.0)
              }
              else {
                codeHandler.fillMark(nextListOfCodesToConsider[1], nextListOfCodesToConsider[2], mark_perf_tmpd); // d
                codeHandler.fillMark(nextListOfCodesToConsider[1], nextListOfCodesToConsider[3], mark_perf_tmpe); // e
                codeHandler.fillMark(nextListOfCodesToConsider[2], nextListOfCodesToConsider[3], mark_perf_tmpf); // f
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
              if (sum_marks == nbCodes) break;

            }
            else { // (nextNbCodes >= 5). Note: from 5 codes, "leaf algos" would be very long to write & to optimize

              // 1) Update current game
              // **********************

              currentGame[next_current_game_idx] = current_code;
              marksIdxs[next_current_game_idx] = mark_idx;

              // 2) Update possible permutations
              // *******************************

              if (nextNbCodes > nbCodesLimitForEquivalentCodesCheck) { // this computing would be useless otherwise
                let new_perm_cnt = 0;
                for (let perm_idx = 0; perm_idx < current_permutations_table_size[next_current_game_idx]; perm_idx++) {
                  if (areCodesEquivalent(0, 0, next_current_game_idx+1, true /* assess current game only */, current_permutations_table[next_current_game_idx][perm_idx], null) /* forced permutation */) { // determine which permutations are still valid for current game
                    if ((current_permutations_table[next_current_game_idx][perm_idx] < 0) || (current_permutations_table[next_current_game_idx][perm_idx] >= all_permutations_table_size[nbColumns])) {
                      throw new Error("recursiveEvaluatePerformances: invalid permutation index: " + perm_idx);
                    }
                    current_permutations_table[next_current_game_idx+1][new_perm_cnt] = current_permutations_table[next_current_game_idx][perm_idx];
                    new_perm_cnt++;
                  }
                }
                if (new_perm_cnt <= 0) { // identity shall always be valid
                  throw new Error("recursiveEvaluatePerformances: invalid new_perm_cnt value: " + new_perm_cnt);
                }
                current_permutations_table_size[next_current_game_idx+1] = new_perm_cnt;
              }
              else {
                current_permutations_table_size[next_current_game_idx+1] = 0; // (defensive setting)
              }

              // 3) Recursive call
              // *****************

              sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes); // (Note: possibleGame = ((idx1 < nbCodes) && possibleGame))
              if (sum_marks == nbCodes) break;

            }
          }
        }
        /*
        // Precalculation optimization (3/3): skip current code if needed
        if (useless_current_code) { // (precalculation mode)
          if (idx1 < nbCodes) {
            throw new Error("recursiveEvaluatePerformances: useless_current_code");
          }
          continue; // skip useless current code
        } */
        if (sum_marks != nbCodes) {
          throw new Error("recursiveEvaluatePerformances: invalid sum_marks value (1) (depth=" + depth + ", sum_marks=" + sum_marks + ", sum_marks=" + sum_marks + ")");
        }

        if (!compute_sum_ini) {
          listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_code = current_code;
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

        if (first_call) {

          if ((!compute_sum_ini) && (nbCodes > 100)) {

            let time_elapsed = new Date().getTime() - evaluatePerformancesStartTime;

            if (compute_sum || precalculated_sum) { // a new class has been evaluated
              nb_classes_cnt++;
              /* if (precalculation_mode) { // (precalculation mode)
                send_trace_msg("______________________________ END OF CLASS ______________________________ " + time_elapsed + " ms");
              } */
            }

            let idxToConsider;
            let totalNbToConsider;
            idxToConsider = nb_classes_cnt;
            totalNbToConsider = currentNbClasses;

            // Processing is aborted when too long
            if (time_elapsed > maxPerformanceEvaluationTime) {
              console.log("(processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%))");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }

            // Anticipation of processing abortion
            // To simplify, it is assumed here that processing times of all classes are "relatively" close to each other
            if ( (time_elapsed > 3500) && (time_elapsed > maxPerformanceEvaluationTime*7/100) && (idxToConsider < Math.floor(totalNbToConsider*1.25/100)) ) { // (0.179 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #0)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*10/100) && (idxToConsider < Math.floor(totalNbToConsider*2/100)) ) { // (0.20 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #1)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*15/100) && (idxToConsider < Math.floor(totalNbToConsider*3.75/100)) ) { // (0.25 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #2)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*20/100) && (idxToConsider < Math.floor(totalNbToConsider*6/100)) ) { // (0.30 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #3)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*30/100) && (idxToConsider < Math.floor(totalNbToConsider*12/100)) ) { // (0.40 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #4)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*40/100) && (idxToConsider < Math.floor(totalNbToConsider*20/100)) ) { // (0.50 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #5)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*50/100) && (idxToConsider < Math.floor(totalNbToConsider*30/100)) ) { // (0.60 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #6)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*60/100) && (idxToConsider < Math.floor(totalNbToConsider*42/100)) ) { // (0.70 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #7)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*70/100) && (idxToConsider < Math.floor(totalNbToConsider*56/100)) ) { // (0.80 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #8)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }
            if ( (time_elapsed > maxPerformanceEvaluationTime*80/100) && (idxToConsider < Math.floor(totalNbToConsider*72/100)) ) { // (0.90 ratio)
              console.log("(anticipation of processing abortion after " + time_elapsed + "ms (" + Math.round(100*idxToConsider/totalNbToConsider) + "%) #9)");
              listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
              listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
              particularCodeGlobalPerformance = PerformanceNA; // output
              recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN;
            }

            if (idx1+1 == nbCodes) { // last loop
              if (idxToConsider != totalNbToConsider) { // not 100%
                throw new Error("recursiveEvaluatePerformances: invalid code numbers (" + idxToConsider + " != " + totalNbToConsider + ")");
              }
            }

          }

          listOfGlobalPerformances[idx1] = 1.0 + sum / nbCodes; // output
          /* if (write_me) { // (traces useful for debug)
            let time_elapsed = new Date().getTime() - evaluatePerformancesStartTime;
            console.log("perf #" + idx1 + ": " + listOfGlobalPerformances[idx1] + " / " + time_elapsed + "ms");
          } */

        }
        else if ((depth == 0) || (depth == 1)) { // first and second levels of recursivity
          let time_elapsed = new Date().getTime() - evaluatePerformancesStartTime;

          // Processing is aborted when too long
          if (time_elapsed > maxPerformanceEvaluationTime) {
            listOfGlobalPerformances[0] = PerformanceNA; // output (basic reset)
            listOfGlobalPerformances[nbCodes-1] = PerformanceNA; // output (basic reset)
            particularCodeGlobalPerformance = PerformanceNA; // output
            recursiveEvaluatePerformancesWasAborted = true; return PerformanceUNKNOWN; // (final returned value will be invalid)
          }
          time_elapsed = undefined;
        }
        else {
          throw new Error("recursiveEvaluatePerformances: internal error (1)");
        }

      } // (depth <= 1)

      /* if (precalculation_mode && write_me_for_precalculation) { // (precalculation mode)
        str = str + codeHandler.compressCodeToString(current_code) + ":" + Math.round(sum).toString(16).toUpperCase() + ",";
      } */

    } // (loop on idx1)

    /* if (precalculation_mode) { // (precalculation mode)
      if (!str.endsWith(",")) {
        throw new Error("recursiveEvaluatePerformances: internal error (2)");
      }
      str = "\"" + str.substring(0, str.length-1) + ".\" +"; // remove last ','
      // console.log(str);
      let precalculation_time = new Date().getTime() - precalculation_start_time;
      if (precalculation_time >= 3500) { // 3500 = 3.5 seconds on i5 processor or on Linux VB running on i7 processor
        send_trace_msg(str);
      }
      else {
        send_trace_msg("skipped (" + precalculation_time + "ms)");
      }
    } */

    // Evaluate performance of impossible code if needed
    // *************************************************

    if (first_call && (particularCodeToAssess != 0 /* empty code */)) {

      current_code = particularCodeToAssess;

      let particular_precalculated_sum = false;
      if (precalculated_current_game_and_code && (!compute_sum_ini) /* && (!precalculation_mode) */) { // (precalculation mode)
        sum = lookForCodeInPrecalculatedGames(current_code, next_current_game_idx, nbCodes);
        if (sum != -1) { // precalculated sum found
          particular_precalculated_sum = true;
        }
        else {
          throw new Error("recursiveEvaluatePerformances: cannot find precalculated game and code (impossible code): " + codeHandler.codeToString(current_code));
        }
      }

      if (!particular_precalculated_sum) {

        nextNbsCodes.fill(0); // (faster than (or close to) a loop on 0..nbMaxMarks-1)

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
              sum = sum + 3.0; // 2 * 1.5 = 3.0
            }
            else {

              // 1) Update current game
              // **********************

              currentGame[next_current_game_idx] = current_code;
              marksIdxs[next_current_game_idx] = mark_idx;

              // 2) Update possible permutations
              // *******************************

              if (nextNbCodes > nbCodesLimitForEquivalentCodesCheck) { // this computing would be useless otherwise
                let new_perm_cnt = 0;
                for (let perm_idx = 0; perm_idx < current_permutations_table_size[next_current_game_idx]; perm_idx++) {
                  if (areCodesEquivalent(0, 0, next_current_game_idx+1, true /* assess current game only */, current_permutations_table[next_current_game_idx][perm_idx], null) /* forced permutation */) { // determine which permutations are still valid for current game
                    if ((current_permutations_table[next_current_game_idx][perm_idx] < 0) || (current_permutations_table[next_current_game_idx][perm_idx] >= all_permutations_table_size[nbColumns])) {
                      throw new Error("recursiveEvaluatePerformances: invalid permutation index: " + perm_idx);
                    }
                    current_permutations_table[next_current_game_idx+1][new_perm_cnt] = current_permutations_table[next_current_game_idx][perm_idx];
                    new_perm_cnt++;
                  }
                }
                if (new_perm_cnt <= 0) { // identity shall always be valid
                  throw new Error("recursiveEvaluatePerformances: invalid new_perm_cnt value: " + new_perm_cnt);
                }
                current_permutations_table_size[next_current_game_idx+1] = new_perm_cnt;
              }
              else {
                current_permutations_table_size[next_current_game_idx+1] = 0; // (defensive setting)
              }

              // 3) Recursive call
              // *****************

              sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes);

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

  self.addEventListener('message', function(e) {

    try {

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

        if (!IAmAliveMessageSent) {
          self.postMessage({'rsp_type': 'I_AM_ALIVE'}); // first message sent
          IAmAliveMessageSent = true;
        }

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
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*10/30; // (short games)
            nbOfCodesForSystematicEvaluation = initialNbPossibleCodes; // systematic performance evaluation
            nbOfCodesForSystematicEvaluation_ForMemAlloc = initialNbPossibleCodes;
            initialNbClasses = 3; // {111, 112, 123}
            maxDepth = Math.min(11, overallMaxDepth);
            marks_optimization_mask = 0x1FFF;
            maxDepthForGamePrecalculation = -1; // no game precalculation needed (-1 or 3)
            break;
          case 4:
            nbMaxMarks = 14;
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*20/30; // (short games)
            nbOfCodesForSystematicEvaluation = initialNbPossibleCodes; // systematic performance evaluation
            nbOfCodesForSystematicEvaluation_ForMemAlloc = initialNbPossibleCodes; // game precalculation (*)
            initialNbClasses = 5; // {1111, 1112, 1122, 1123, 1234}
            maxDepth = Math.min(12, overallMaxDepth);
            marks_optimization_mask = 0x3FFF;
            maxDepthForGamePrecalculation = 3; // game precalculation (-1 or 3) (*)
            break;
          case 5:
            nbMaxMarks = 20;
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*60/30;
            nbOfCodesForSystematicEvaluation = Math.min(baseOfNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
            nbOfCodesForSystematicEvaluation_ForMemAlloc = initialNbPossibleCodes; // game precalculation (*)
            initialNbClasses = 7; // {11111, 11112, 11122, 11123, 11223, 11234, 12345}
            maxDepth = Math.min(13, overallMaxDepth);
            marks_optimization_mask = 0xFFFF; // (do not consume too much memory)
            maxDepthForGamePrecalculation = 3; // game precalculation (-1 or 3) (*)
            break;
          case 6:
            nbMaxMarks = 27;
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*70/30;
            nbOfCodesForSystematicEvaluation = Math.min(baseOfNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
            nbOfCodesForSystematicEvaluation_ForMemAlloc = nbOfCodesForSystematicEvaluation;
            initialNbClasses = 11; // {111111, 111112, 111122, 111123, 111222, 111223, 111234, 112233, 112234, 112345, 123456}
            maxDepth = Math.min(14, overallMaxDepth);
            marks_optimization_mask = 0xFFFF; // (do not consume too much memory)
            maxDepthForGamePrecalculation = -1; // no game precalculation as precalculation would be too long (-1 or 3)
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
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*80/30;
            nbOfCodesForSystematicEvaluation = Math.min(baseOfNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
            nbOfCodesForSystematicEvaluation_ForMemAlloc = nbOfCodesForSystematicEvaluation;
            initialNbClasses = 15; // {1111111, 1111112, 1111122, 1111123, 1111222, 1111223, 1111234, 1112223, 1112233, 1112234, 1112345, 1122334, 1122345, 1123456, 1234567}
            maxDepth = Math.min(15, overallMaxDepth);
            marks_optimization_mask = 0xFFFF; // (do not consume too much memory)
            maxDepthForGamePrecalculation = -1; // no game precalculation as precalculation would be too long (-1 or 3)
            break;
          default:
            throw new Error("INIT phase / invalid nbColumns: " + nbColumns);
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

        /* if (1296 != fillShortInitialPossibleCodesTable(initialCodeListForPrecalculatedMode, nbOfCodesForSystematicEvaluation_ForMemAlloc)) { // (precalculation mode)
          throw new Error("INIT phase / internal error");
        } */

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

        // ***************
        // Initializations
        // ***************

        // 1) Update current game
        // **********************

        if (!initialInitDone) {
          initialInitDone = true;
          currentGame = new Array(nbMaxAttempts+maxDepth);
          currentGame.fill(0); /* empty code */
          marksIdxs = new Array(nbMaxAttempts+maxDepth);
          marksIdxs.fill(-1);
          generateAllPermutations();
        }

        if (currentAttemptNumber >= 2) {
          // Notes on "future-based" criteria:
          // - to simplify, useless codes (likely to be played near game end) are not excluded from current game.
          // - to simplify, codes with a 0 black + 0 white mark (likely to be played at game beginning, whose performances are targeted
          //   to be precalculated) are not excluded from current game. More generally, the fact that impossible colors are interchangeable
          //   is not exploited (as mostly covered by 0 black + 0 white mark cases at game beginning / as difficult to take into account
          //   recursively at small cost / as bijections would have to be calculated in some specific way(s) for those cases).
          // - handling a "dynamic dictionary of games" containing sets of (k to k+n, k >= 5) possible remaining codes and their associated
          //   performance was assessed and does not allow to reach any gain for long evaluations (too low percentage of repetitive games).
          currentGame[currentAttemptNumber-2] = codesPlayed[currentAttemptNumber-2];
          marksIdxs[currentAttemptNumber-2] = marksTable_MarkToNb[marks[currentAttemptNumber-2].nbBlacks][marks[currentAttemptNumber-2].nbWhites];
        }
        currentGameSize = currentAttemptNumber-1; // (equal to 0 at first attempt)

        // Check current game (useful for subsequent equivalent codes processing - duplicated code)
        if (currentGameSize != currentAttemptNumber-1) {
          throw new Error("NEW_ATTEMPT phase / invalid currentGameSize");
        }
        for (let idx = 0; idx < currentGameSize; idx++) {
          if ( (currentGame[idx] != codesPlayed[idx]) || (!codeHandler.isFullAndValid(currentGame[idx])) ) {
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

        if (currentAttemptNumber >= 2) {
          if (current_permutations_table_size[currentGameSize-1] <= 0) {
            throw new Error("NEW_ATTEMPT phase / invalid current_permutations_table_size value: " + current_permutations_table_size[currentGameSize-1]);
          }
          let new_perm_cnt = 0;
          for (let perm_idx = 0; perm_idx < current_permutations_table_size[currentGameSize-1]; perm_idx++) {
            if (areCodesEquivalent(0, 0, currentGameSize, true /* assess current game only */, current_permutations_table[currentGameSize-1][perm_idx], null) /* forced permutation */) { // determine which permutations are still valid for current game
              if ((current_permutations_table[currentGameSize-1][perm_idx] < 0) || (current_permutations_table[currentGameSize-1][perm_idx] >= all_permutations_table_size[nbColumns])) {
                throw new Error("NEW_ATTEMPT phase / invalid permutation index: " + perm_idx);
              }
              current_permutations_table[currentGameSize][new_perm_cnt] = current_permutations_table[currentGameSize-1][perm_idx];
              new_perm_cnt++;
            }
          }
          if (new_perm_cnt <= 0) { // identity shall always be valid
            throw new Error("NEW_ATTEMPT phase / invalid new_perm_cnt value: " + new_perm_cnt);
          }
          current_permutations_table_size[currentGameSize] = new_perm_cnt;
        }

        // **************************************************
        // A.1) Compute number and list of new possible codes
        // **************************************************

        console.log(String(currentAttemptNumber) + ": " + codeHandler.markToString(marks[currentAttemptNumber-1]) + " " + codeHandler.codeToString(codesPlayed[currentAttemptNumber-1]));

        let now = new Date().getTime();

        if (marks_already_computed_table == null) {
          marks_already_computed_table = new Array(marks_optimization_mask+1);
          for (let i = 0; i < marks_already_computed_table.length; i++) {
            marks_already_computed_table[i] = { code1a:0, code2a:0, nbBlacksa:-1, nbWhitesa:-1,
                                                code1b:0, code2b:0, nbBlacksb:-1, nbWhitesb:-1,
                                                code1c:0, code2c:0, nbBlacksc:-1, nbWhitesc:-1,
                                                write_index:0};
          }
        }

        if (currentAttemptNumber == 1) { // first attempt
          possibleCodesAfterNAttempts = new OptimizedArrayList(Math.max(1 + Math.floor(initialNbPossibleCodes/nb_max_internal_lists), 5*nb_max_internal_lists));
        }

        previousNbOfPossibleCodes = nextNbOfPossibleCodes;
        nextNbOfPossibleCodes = computeNbOfPossibleCodes(currentAttemptNumber+1, nbOfCodesForSystematicEvaluation_ForMemAlloc, possibleCodesForPerfEvaluation[(currentAttemptNumber+1)%2]);
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

          // Check if current game and code (whether possible or impossible) were precalculated
          // **********************************************************************************

          let precalculated_current_game_and_code = false;
          // precalculated_current_game_and_code shall keep being false in precalculation mode => below code to comment if needed (precalculation mode)
          if ( (previousNbOfPossibleCodes >= minNbCodesForPrecalculation) // (**) only games for which there may not be enough CPU capacity / time to calculate performances online
               && (currentGameSize <= maxDepthForGamePrecalculation) ) { // (-1 or 3)
            if (lookForCodeInPrecalculatedGames(codesPlayed[currentAttemptNumber-1], currentGameSize, previousNbOfPossibleCodes) != -1) {
              precalculated_current_game_and_code = true;
            }
          }

          // Main useful code processing
          // ***************************

          if ( precalculated_current_game_and_code
               || (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation) ) {

            // Initializations
            // ***************

            if (precalculated_current_game_and_code) { // ***** First evaluation phase in a game *****
              if (performanceListsInitDone) {
                throw new Error("NEW_ATTEMPT phase / inconsistent game precalculation (1)");
              }
              if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
                throw new Error("NEW_ATTEMPT phase / inconsistent game precalculation (2): " + previousNbOfPossibleCodes + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
              }
              // - Array allocations
              if (!performanceListsInitDoneForPrecalculatedGames) {
                performanceListsInitDoneForPrecalculatedGames = true;
                arraySizeAtInit = Math.ceil((3*previousNbOfPossibleCodes + nbOfCodesForSystematicEvaluation_ForMemAlloc)/4); // (overestimated for low values of previousNbOfPossibleCodes to ensure proper subsequent mem_reduc_factor application)
                listOfGlobalPerformances = new Array(arraySizeAtInit);
                maxDepthApplied = 1; // "one-recursive-depth computing of performances" for current game and code (whether possible or impossible) => memory optimization
                listsOfPossibleCodes = undefined;
                listsOfPossibleCodes = new3DArray(maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor);
                nbOfPossibleCodes = undefined;
                nbOfPossibleCodes = new2DArray(maxDepthApplied, nbMaxMarks);
                listOfClassesFirstCall = new Array(arraySizeAtInit);
                listOfEquivalentCodesAndPerformances = undefined;
                listOfEquivalentCodesAndPerformances = new2DArray(maxDepthApplied, arraySizeAtInit);
                for (let idx1 = 0; idx1 < maxDepthApplied; idx1++) { // structure allocation
                  for (let idx2 = 0; idx2 < arraySizeAtInit; idx2++) {
                    listOfEquivalentCodesAndPerformances[idx1][idx2] = {equiv_code:0, equiv_sum:PerformanceNA};
                  }
                }
                if ((marks_already_computed_table == null) || (marks_already_computed_table.length != marks_optimization_mask+1)) {
                  throw new Error("NEW_ATTEMPT phase / inconsistent marks_already_computed_table (1)");
                }
              }
            }
            else if (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation) { // ***** Second evaluation phase in a game *****
              if (precalculated_current_game_and_code) {
                throw new Error("NEW_ATTEMPT phase / internal error (precalculated_current_game_and_code)");
              }
              // - Array allocations
              if (!performanceListsInitDone) {
                performanceListsInitDone = true;
                arraySizeAtInit = Math.ceil((3*previousNbOfPossibleCodes + nbOfCodesForSystematicEvaluation)/4); // (overestimated for low values of previousNbOfPossibleCodes to ensure proper subsequent mem_reduc_factor application)
                listOfGlobalPerformances = new Array(arraySizeAtInit);
                maxDepthApplied = maxDepth;
                listsOfPossibleCodes = undefined;
                listsOfPossibleCodes = new3DArray(maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor);
                nbOfPossibleCodes = undefined;
                nbOfPossibleCodes = new2DArray(maxDepthApplied, nbMaxMarks);
                listOfClassesFirstCall = new Array(arraySizeAtInit);
                listOfEquivalentCodesAndPerformances = undefined;
                listOfEquivalentCodesAndPerformances = new2DArray(maxDepthApplied, arraySizeAtInit);
                for (let idx1 = 0; idx1 < maxDepthApplied; idx1++) { // structure allocation
                  for (let idx2 = 0; idx2 < arraySizeAtInit; idx2++) {
                    listOfEquivalentCodesAndPerformances[idx1][idx2] = {equiv_code:0, equiv_sum:PerformanceNA};
                  }
                }
                if ((marks_already_computed_table == null) || (marks_already_computed_table.length != marks_optimization_mask+1)) {
                  throw new Error("NEW_ATTEMPT phase / inconsistent marks_already_computed_table (2)");
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
            // listsOfPossibleCodes is not initialized as this array may be very large
            for (let i = 0; i < maxDepthApplied; i++) {
              for (let j = 0; j < nbMaxMarks; j++) {
                nbOfPossibleCodes[i][j] = 0;
              }
            }

            // Compute performances
            // ********************

            let code_played_global_performance = PerformanceNA;
            let index = (currentAttemptNumber%2);
            if (0 == isAttemptPossibleinGameSolver(currentAttemptNumber)) { // code played is possible
              // Evaluate performances for possibleCodesForPerfEvaluation[currentAttemptNumber%2]:
              let startTime = (new Date()).getTime();
              best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, 0 /* empty code */, precalculated_current_game_and_code);
              if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
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
                console.log("(perfeval#1: best performance: " + best_global_performance
                            + " / code performance: " + code_played_global_performance
                            + " / " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + currentNbClasses + ((currentNbClasses > 1) ? " classes" : " class")
                            + (precalculated_current_game_and_code ? " / precalculated" : "") + ")");
              }
              else {
                console.log("(perfeval#1 failed in " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + currentNbClasses + ((currentNbClasses > 1) ? " classes" : " class") + ")");
              }
            }
            else { // code played is not possible
              // Evaluate performances for possibleCodesForPerfEvaluation[currentAttemptNumber%2]:
              let startTime = (new Date()).getTime();
              best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, codesPlayed[currentAttemptNumber-1], precalculated_current_game_and_code);
              if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
                if ((particularCodeGlobalPerformance == PerformanceNA) || (particularCodeGlobalPerformance == PerformanceUNKNOWN) || (particularCodeGlobalPerformance <= 0.01)) {
                  throw new Error("NEW_ATTEMPT phase / invalid particularCodeGlobalPerformance: " + particularCodeGlobalPerformance);
                }
                code_played_global_performance = particularCodeGlobalPerformance;
                console.log("(perfeval#2: best performance: " + best_global_performance
                            + " / code performance: " + particularCodeGlobalPerformance
                            + " / " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + currentNbClasses + ((currentNbClasses > 1) ? " classes" : " class")
                            + (precalculated_current_game_and_code ? " / precalculated" : "") + ")");
              }
              else {
                console.log("(perfeval#2 failed in " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + currentNbClasses + ((currentNbClasses > 1) ? " classes" : " class") + ")");
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
                if ( (best_global_performance - global_performance < (PerformanceMinValidValue-1)/2) || (best_global_performance - global_performance >= +0.0001) ) {
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
            if (!check3DArraySizes(listsOfPossibleCodes, maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor)) {
              throw new Error("NEW_ATTEMPT phase / listsOfPossibleCodes allocation was modified");
            }
            if (!check2DArraySizes(nbOfPossibleCodes, maxDepthApplied, nbMaxMarks)) {
              throw new Error("NEW_ATTEMPT phase / nbOfPossibleCodes allocation was modified");
            }
            if (currentGame.length != nbMaxAttempts+maxDepth) {
              throw new Error("NEW_ATTEMPT phase / currentGame allocation was modified");
            }
            if (marksIdxs.length != nbMaxAttempts+maxDepth) {
              throw new Error("NEW_ATTEMPT phase / marksIdxs allocation was modified");
            }
            if (listOfClassesFirstCall.length != arraySizeAtInit) {
              throw new Error("NEW_ATTEMPT phase / listOfClassesFirstCall allocation was modified");
            }
            if (!check2DArraySizes(listOfEquivalentCodesAndPerformances, maxDepthApplied, arraySizeAtInit)) {
              throw new Error("NEW_ATTEMPT phase / listOfEquivalentCodesAndPerformances allocation was modified");
            }
            if (current_permutations_table_size.length != overallNbMaxAttempts+overallMaxDepth) {
              throw new Error("NEW_ATTEMPT phase / current_permutations_table_size allocation was modified");
            }
            if (!check2DArraySizes(current_permutations_table, overallNbMaxAttempts+overallMaxDepth, current_permutations_table_size[0])) {
              throw new Error("NEW_ATTEMPT phase / current_permutations_table allocation was modified");
            }

            if (code_colors.length != nbMaxColumns) {
              throw new Error("NEW_ATTEMPT phase / code_colors allocation was modified");
            }
            if (other_code_colors.length != nbMaxColumns) {
              throw new Error("NEW_ATTEMPT phase / other_code_colors allocation was modified");
            }
            if ( (!check2DArraySizes(current_game_code_colors, overallNbMaxAttempts+overallMaxDepth, nbMaxColumns))
                 || (current_game_code_colors.size < currentGame.length) ) { // first dimension shall be >= currentGame size
              throw new Error("NEW_ATTEMPT phase / current_game_code_colors allocation was modified or is invalid");
            }
            if ( (!check2DArraySizes(other_game_code_colors, overallNbMaxAttempts+overallMaxDepth, nbMaxColumns))
                 || (other_game_code_colors.size < currentGame.length) ) { // first dimension shall be >= currentGame size
              throw new Error("NEW_ATTEMPT phase / other_game_code_colors allocation was modified or is invalid");
            }
            if (permuted_other_code_colors.length != nbMaxColumns) {
              throw new Error("NEW_ATTEMPT phase / permuted_other_code_colors allocation was modified");
            }
            if (partial_bijection.length != nbMaxColors+1) {
              throw new Error("NEW_ATTEMPT phase / partial_bijection allocation was modified");
            }
            if ( (currentGameForGamePrecalculation.length != maxDepthForGamePrecalculation_ForMemAlloc)
                 || (marksIdxsForGamePrecalculation.length != maxDepthForGamePrecalculation_ForMemAlloc) ) {
              throw new Error("NEW_ATTEMPT phase / currentGameForGamePrecalculation or marksIdxsForGamePrecalculation allocation was modified");
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

        while(new Date().getTime() < now + attempt_refresh_time_1 + attempt_refresh_time_2){}
        self.postMessage({'rsp_type': 'CODE_PLAYED_PERFORMANCE', 'relative_perf_p': code_played_relative_perf, 'best_global_performance_p': best_global_performance, 'relative_perf_evaluation_done_p': relative_perf_evaluation_done, 'code_p': codesPlayed[currentAttemptNumber-1], 'attempt_nb': currentAttemptNumber, 'game_id': game_id});

        // ************************************************
        // C.1) Organize performances of all possible codes
        // ************************************************

        if (nbMaxPossibleCodesShown > nbOfCodesForSystematicEvaluation) {
          throw new Error("NEW_ATTEMPT phase / inconsistent numbers of listed codes: " + nbMaxPossibleCodesShown + " > " + nbOfCodesForSystematicEvaluation);
        }
        let nb_codes_shown = Math.min(previousNbOfPossibleCodes, nbMaxPossibleCodesShown);
        let current_possible_code_list = possibleCodesForPerfEvaluation[currentAttemptNumber%2];

        // Particular case of first attempt of Master Mind game
        // ****************************************************

        if ((currentAttemptNumber == 1) && (nbColumns == 4)) { // first attempt
          if (nb_codes_shown <= 5) { // (initialNbClasses)
            throw new Error("NEW_ATTEMPT phase / internal error (nb_codes_shown)");
          }
          if (previousNbOfPossibleCodes != initialNbPossibleCodes) {
            throw new Error("NEW_ATTEMPT phase / internal error (previousNbOfPossibleCodes)");
          }
          // Add simple codes
          possibleCodesShown[0] = codeHandler.uncompressStringToCode("1233");
          possibleCodesShown[1] = codeHandler.uncompressStringToCode("1234");
          possibleCodesShown[2] = codeHandler.uncompressStringToCode("1122");
          possibleCodesShown[3] = codeHandler.uncompressStringToCode("1222");
          possibleCodesShown[4] = codeHandler.uncompressStringToCode("1111");
          for (let i = 0; i < 5; i++) {
            if (best_global_performance == PerformanceUNKNOWN) {
              globalPerformancesShown[i] = PerformanceUNKNOWN;
            }
            else {
              let simple_code_found = false;
              for (let j = 0; j < previousNbOfPossibleCodes; j++) {
                if (possibleCodesShown[i] == current_possible_code_list[j]) {
                  if ((listOfGlobalPerformances[j] == PerformanceNA) || (listOfGlobalPerformances[j] == PerformanceUNKNOWN) || (listOfGlobalPerformances[j] <= 0.01)) {
                    throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (1) (index " + i + ")");
                  }
                  globalPerformancesShown[i] = listOfGlobalPerformances[j];
                  simple_code_found = true;
                  break;
                }
              }
              if (!simple_code_found) {
                throw new Error("NEW_ATTEMPT phase / internal error (simple_code_found)");
              }
            }
          }
          // Add other codes
          let cnt = 5;
          for (let i = 0; i < previousNbOfPossibleCodes; i++) {
            let simple_code_already_present = false;
            for (let j = 0; j < 5; j++) {
              if (current_possible_code_list[i] == possibleCodesShown[j]) {
                simple_code_already_present = true;
                break;
              }
            }
            if (!simple_code_already_present) {
              possibleCodesShown[cnt] = current_possible_code_list[i];
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

        // Particular case of first attempt of Super Master Mind game
        // **********************************************************

        else if ((currentAttemptNumber == 1) && (nbColumns == 5)) { // first attempt
          if (nb_codes_shown <= 7) { // (initialNbClasses)
            throw new Error("NEW_ATTEMPT phase / internal error (nb_codes_shown)");
          }
          if (previousNbOfPossibleCodes != initialNbPossibleCodes) {
            throw new Error("NEW_ATTEMPT phase / internal error (previousNbOfPossibleCodes)");
          }
          // Add simple codes
          possibleCodesShown[0] = codeHandler.uncompressStringToCode("12233");
          possibleCodesShown[1] = codeHandler.uncompressStringToCode("12344");
          possibleCodesShown[2] = codeHandler.uncompressStringToCode("12345");
          possibleCodesShown[3] = codeHandler.uncompressStringToCode("12333");
          possibleCodesShown[4] = codeHandler.uncompressStringToCode("11222");
          possibleCodesShown[5] = codeHandler.uncompressStringToCode("12222");
          possibleCodesShown[6] = codeHandler.uncompressStringToCode("11111");
          for (let i = 0; i < 7; i++) {
            if (best_global_performance == PerformanceUNKNOWN) {
              globalPerformancesShown[i] = PerformanceUNKNOWN;
            }
            else {
              let simple_code_found = false;
              for (let j = 0; j < previousNbOfPossibleCodes; j++) {
                if (possibleCodesShown[i] == current_possible_code_list[j]) {
                  if ((listOfGlobalPerformances[j] == PerformanceNA) || (listOfGlobalPerformances[j] == PerformanceUNKNOWN) || (listOfGlobalPerformances[j] <= 0.01)) {
                    throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (3) (index " + i + ")");
                  }
                  globalPerformancesShown[i] = listOfGlobalPerformances[j];
                  simple_code_found = true;
                  break;
                }
              }
              if (!simple_code_found) {
                throw new Error("NEW_ATTEMPT phase / internal error (simple_code_found)");
              }
            }
          }
          // Add other codes
          let cnt = 7;
          for (let i = 0; i < previousNbOfPossibleCodes; i++) {
            let simple_code_already_present = false;
            for (let j = 0; j < 7; j++) {
              if (current_possible_code_list[i] == possibleCodesShown[j]) {
                simple_code_already_present = true;
                break;
              }
            }
            if (!simple_code_already_present) {
              possibleCodesShown[cnt] = current_possible_code_list[i];
              if (best_global_performance == PerformanceUNKNOWN) {
                globalPerformancesShown[cnt] = PerformanceUNKNOWN;
              }
              else {
                if ((listOfGlobalPerformances[i] == PerformanceNA) || (listOfGlobalPerformances[i] == PerformanceUNKNOWN) || (listOfGlobalPerformances[i] <= 0.01)) {
                  throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (4) (index " + i + ")");
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

        // General case
        // ************

        else {
          for (let i = 0; i < nb_codes_shown; i++) {
            possibleCodesShown[i] = current_possible_code_list[i];
            if (best_global_performance == PerformanceUNKNOWN) {
              globalPerformancesShown[i] = PerformanceUNKNOWN;
            }
            else {
              if ((listOfGlobalPerformances[i] == PerformanceNA) || (listOfGlobalPerformances[i] == PerformanceUNKNOWN) || (listOfGlobalPerformances[i] <= 0.01)) {
                throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (5) (index " + i + ")");
              }
              globalPerformancesShown[i] = listOfGlobalPerformances[i];
            }
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
        if ( (possibleCodesForPerfEvaluation[0].length != nbOfCodesForSystematicEvaluation_ForMemAlloc)
             || (possibleCodesForPerfEvaluation[1].length != nbOfCodesForSystematicEvaluation_ForMemAlloc) ) {
          throw new Error("inconsistent possibleCodesForPerfEvaluation length: " + possibleCodesForPerfEvaluation[0].length + ", " + possibleCodesForPerfEvaluation[1].length + ", " + nbOfCodesForSystematicEvaluation_ForMemAlloc);
        }

      }

      // **********
      // Error case
      // **********

      else {
        throw new Error("unexpected req_type: " + data.req_type);
      }

      message_processing_ongoing = false;

    }
    catch (exc) {
      throw new Error("gameSolver internal error (message): " + exc + ": " + exc.stack);
    }

  }, false);

}
catch (exc) {
  throw new Error("gameSolver internal error (global): " + exc + ": " + exc.stack);
}
