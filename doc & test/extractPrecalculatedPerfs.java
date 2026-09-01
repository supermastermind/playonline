// ***************************************************************************************************************
// The goal of this program is to store precalculated performances into small files that will be quick to download
// and to make precalculated performances symmetrical across attempt numbers
// ***************************************************************************************************************

import java.lang.*;
import java.io.*;
import java.util.regex.*;
import java.util.Arrays;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;
import java.nio.file.Files;
import java.util.Scanner;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

class SearchOutput {
    int count;
    int start_index;
    int dot_index;
}

public class extractPrecalculatedPerfs {

  extractPrecalculatedPerfs() {}

  private static String[] file_table =
    {
      "FINAL_RESULTS_11111_270_1300_2s_plus_depth3only_270_1300_2.7sec.txt",
      "FINAL_RESULTS_11112_FROM_PERFS5_270_1300_2s_plus_depth3only_270_1300_4.4sec.txt",
      "FINAL_RESULTS_11122_FROM_PERFS5_270_1500_2s_plus_depth3only_270_1500_4.4sec.txt",
      "FINAL_RESULTS_11123_depth2_nearlyonlylogicalcodesfromdepth2_270_32000_2.2s_plus_depth3only_270_32000_4.4sec.txt",
      "FINAL_RESULTS_11223_depth2_nearlyonlylogicalcodesfromdepth2_270_32000_2.2s_plus_depth3only_270_32000_4.4sec.txt",
      "FINAL_RESULTS_11234_depth2_nearlyonlylogicalcodesfromdepth2_270_32000_2.2s_plus_depth3only_270_32000_4.4sec.txt",
      "FINAL_RESULTS_12345_depth2_nearlyonlylogicalcodesfromdepth2_270_32000_2.2s_plus_depth3only_270_32000_4.4sec.txt"
    };

  private static final int NB_COLUMNS = 5;
  private static final int NB_COLORS = 8;
  private static final String OUT_FOLDER = "out/";
  private static final String OUT_FILES_SUFFIX = ".js";

  private static int table_tmp[][] = new int[2][NB_COLORS+1];
  private static boolean are_there_5_identical_colors[] = new boolean[2];
  private static boolean are_there_4_identical_colors[] = new boolean[2];
  private static boolean is_there_triple[] = new boolean[2];
  private static int nb_doubles[] = new int[2];
  private static int one_double_color[] = new int[2];
  private static String output_str[] = new String[2];
  private static boolean colors_int[] = new boolean[NB_COLUMNS];
  private static int code1_colors[] = new int[NB_COLUMNS];
  private static int code2_colors[] = new int[NB_COLUMNS];
  private static int different_colors[] = new int[NB_COLORS+1];
  private static int different_colors_bis[] = new int[NB_COLORS+1];

  private static int norm_code_colors[] = new int[NB_COLUMNS];
  private static int norm_code1_colors[] = new int[NB_COLUMNS];
  private static int norm_code2_colors[] = new int[NB_COLUMNS];
  private static int norm_code3_colors[] = new int[NB_COLUMNS];
  private static int norm_bijection[] = new int[NB_COLORS+1];
  private static int min_norm_bijection[] = new int[NB_COLORS+1];

  private static String first_line_prefix = "extra_precalculated_str = ";
  private static Pattern line_pattern = Pattern.compile("^\"[2-3]\\|([0-9]{5}):(\\w{4})\\|([0-9]{5}):(\\w{4})(?:\\|([0-9]{5}):(\\w{4}))?\\|N:[1-9][0-9]*\\|.*\\.\""); // "3|11123:1B1W|11111:1B0W|22222:0B0W|N:1581|13334:14F0,13344:146C,..,45613:152E." +

  // ************
  // Permutations
  // ************

  private static final int NB_PERMUTATIONS = 5*4*3*2*1;
  private static int permutations[][] =  new int [NB_PERMUTATIONS][NB_COLUMNS];
  private static void generateAllPermutations() {
    int nb_permutations = 0;
    for (int i1 = 0; i1 < NB_COLUMNS; i1++) {
      for (int i2 = 0; i2 < NB_COLUMNS; i2++) {
        if (i2 != i1) {
          for (int i3 = 0; i3 < NB_COLUMNS; i3++) {
            if ((i3 != i1) && (i3 != i2)) {
              for (int i4 = 0; i4 < NB_COLUMNS; i4++) {
                if ((i4 != i1) && (i4 != i2) && (i4 != i3)) {
                  int i5 = 10 - (i1 + i2 + i3 + i4);
                  permutations[nb_permutations][0] = i1;
                  permutations[nb_permutations][1] = i2;
                  permutations[nb_permutations][2] = i3;
                  permutations[nb_permutations][3] = i4;
                  permutations[nb_permutations][4] = i5;
                  nb_permutations++;
                }
              }
            }
          }
        }
      }
    }
    if (nb_permutations != NB_PERMUTATIONS) {
      throw new Error("generateAllPermutations: wrong number of permutations: " + nb_permutations);
    }
  }

  // *****************************************
  // File names for precalculated performances
  // *****************************************

  private static String determine_filename(String code1, String mark1, String code2, String mark2) throws Exception {

    // ****************************************************************************
    // ***** CODE DUPLICATED IN SuperMasterMind.js AND GameSolver.js SCRIPTS ******
    // ****************************************************************************

    if ((NB_COLUMNS != 5) || (NB_COLORS != 8)) {
      throw new Error("determine_filename: invalid values");
    }

    // Look for groups of same color
    // *****************************

    for (int code_idx = 0; code_idx < 2; code_idx++) {

      String code_str;
      String mark_str;
      switch (code_idx) {
        case 0:
          code_str = code1;
          mark_str = mark1;
          break;
        case 1:
          code_str = code2;
          mark_str = mark2;
          break;
        default:
          throw new Error("determine_filename: internal error (code_idx)");
      }

      if (code_str.length() != NB_COLUMNS) {
        throw new Error("determine_filename: invalid code_str: " + code_str);
      }
      if ((mark_str.length() != 4) || (mark_str.indexOf("B") == -1) || (mark_str.indexOf("W") == -1)) {
        throw new Error("determine_filename: invalid mark_str: " + mark_str);
      }

      for (int color = 0; color < table_tmp[code_idx].length; color++) {
        table_tmp[code_idx][color] = 0;
      }
      for (int col = 0; col < NB_COLUMNS; col++) {
        int color = code_str.charAt(col) - 48;
        if ((color < 1) || (color > NB_COLORS)) {
          throw new Error("determine_filename: internal error (out of range color: " + color + ")");
        }
        table_tmp[code_idx][color]++;
      }

      are_there_5_identical_colors[code_idx] = false;
      are_there_4_identical_colors[code_idx] = false;
      is_there_triple[code_idx] = false;
      nb_doubles[code_idx] = 0;
      one_double_color[code_idx] = 0;

      for (int color = 0; color < table_tmp[code_idx].length; color++) {
        if (table_tmp[code_idx][color] == 5) {
          are_there_5_identical_colors[code_idx] = true;
          break;
        }
        else if (table_tmp[code_idx][color] == 4) {
          are_there_4_identical_colors[code_idx] = true;
          break;
        }
        else if (table_tmp[code_idx][color] == 3) {
          is_there_triple[code_idx] = true;
        }
        else if (table_tmp[code_idx][color] == 2) {
          nb_doubles[code_idx]++;
          one_double_color[code_idx] = color;
        }
      }

      output_str[code_idx] = "";
      if (are_there_5_identical_colors[code_idx]) {
        output_str[code_idx] = "5";
      }
      else if (are_there_4_identical_colors[code_idx]) {
        output_str[code_idx] = "4+1";
      }
      else if (is_there_triple[code_idx]) {
        if (nb_doubles[code_idx] == 0) {
          output_str[code_idx] = "3+1+1";
        }
        else if (nb_doubles[code_idx] == 1) {
          output_str[code_idx] = "3+2";
        }
        else {
          throw new Error("determine_filename: internal error: triple with several doubles");
        }
      }
      else {
        if (nb_doubles[code_idx] == 0) {
          output_str[code_idx] = "1+1+1+1+1";
        }
        else if (nb_doubles[code_idx] == 1) {
          output_str[code_idx] = "2+1+1+1";
        }
        else if (nb_doubles[code_idx] == 2) {
          output_str[code_idx] = "2+2+1";
        }
        else {
          throw new Error("determine_filename: internal error: invalid number of doubles");
        }
      }
      output_str[code_idx] = output_str[code_idx] + "_" + mark_str;

    } // code_idx

    // Determine filename
    // ******************

    String suffix = "";
    int nbBlacks = 0;
    int nbWhites = 0;
    int col, col1, col2;

    colors_int[0] = true;
    colors_int[1] = true;
    colors_int[2] = true;
    colors_int[3] = true;
    colors_int[4] = true;
    code1_colors[0] = code1.charAt(0) - 48;
    code1_colors[1] = code1.charAt(1) - 48;
    code1_colors[2] = code1.charAt(2) - 48;
    code1_colors[3] = code1.charAt(3) - 48;
    code1_colors[4] = code1.charAt(4) - 48;
    code2_colors[0] = code2.charAt(0) - 48;
    code2_colors[1] = code2.charAt(1) - 48;
    code2_colors[2] = code2.charAt(2) - 48;
    code2_colors[3] = code2.charAt(3) - 48;
    code2_colors[4] = code2.charAt(4) - 48;

    Arrays.fill(different_colors, 0);
    for (col = 0; col < NB_COLUMNS; col++) {
      int color = code1_colors[col];
      different_colors[color]++;
    }

    Arrays.fill(different_colors_bis, 0);
    for (col = 0; col < NB_COLUMNS; col++) {
      int color = code2_colors[col];
      different_colors_bis[color]++;
    }

    // 1) Mark
    for (col1 = 0; col1 < NB_COLUMNS; col1++) {
      if (code1_colors[col1] == code2_colors[col1]) {
        nbBlacks++;
      }
      else {
        for (col2 = 0; col2 < NB_COLUMNS; col2++) {
          if ((code1_colors[col1] == code2_colors[col2]) && (code1_colors[col2] != code2_colors[col2]) && colors_int[col2]) {
            colors_int[col2] = false;
            nbWhites++;
            break;
          }
        }
      }
    }
    int res1 = nbBlacks * 10 + nbWhites;

    // 2) Total number of colors
    int totalnbcolors = 0;
    for (int color = 1; color <= NB_COLORS; color++) {
      if ((different_colors[color] > 0) || (different_colors_bis[color] > 0)) {
        totalnbcolors++;
      }
    }

    // 3) Ponderated color correspondance (does not vary when permuting columns)
    long res2 = 0;
    for (col = 0; col < NB_COLUMNS; col++) {
      int color1 = code1_colors[col];
      int color2 = code2_colors[col];
      long delta = (long)different_colors[color1] * (long)(different_colors_bis[color2] + 10)
                   * (long)(different_colors[color2] + 100) * (long)(different_colors_bis[color1] + 1000);
      res2 = res2 + delta;
    }

    long final_res = totalnbcolors + res1 * 10 + res2 * 1000;
    if (final_res <= 0) {
      throw new Error("determine_filename: invalid final_res value: " + final_res + " for " + output_str[0] + " " + output_str[1]);
    }
    suffix = "_" + Long.toString(final_res);

    return output_str[0] + "_" + output_str[1] + suffix + OUT_FILES_SUFFIX;
  }

  // **************
  // Search methods
  // **************

  private static SearchOutput static_searchOutput = new SearchOutput();
  private static int countLineHeaderInAllOutputFiles(String line_header) throws IOException {
      Path dir = Paths.get(OUT_FOLDER);
      int totalCount = 0;
      try (Stream<Path> files = Files.walk(dir)) {
          for (Path p : (Iterable<Path>) files.filter(p -> p.toString().endsWith(OUT_FILES_SUFFIX))::iterator) {
            // System.out.println("Processing file: " + p.getFileName()); // display filename
            String content = Files.readString(p);
            countLineHeaderOccurrences(content, line_header, static_searchOutput);
            totalCount += static_searchOutput.count;
          }
      }
      return totalCount;
  }

  private static void countLineHeaderOccurrences(String content, String line_header, SearchOutput searchOutput) {
    searchOutput.count = 0;
    searchOutput.start_index = -1;
    searchOutput.dot_index = -1;
    int index = 0;
    while ((index = content.indexOf(line_header, index)) != -1) {
      searchOutput.count++;
      searchOutput.start_index = index;
      index += line_header.length();
      searchOutput.dot_index = content.indexOf(".", index);
    }
  }

  private static int countOccurrences(String str, String substr) throws Exception {
    if (substr.isEmpty()) {
      throw new Error("countOccurrences: empty substr");
    }
    int count = 0;
    int index = 0;
    while ((index = str.indexOf(substr, index)) != -1) {
      count++;
      index += substr.length();
    }
    return count;
  }

  // *******************************************
  // Replace line containing a substring in file
  // *******************************************

  private static void replaceFirstMatchingLine(Path path, String searchString, String newLine, String invDebugStr) throws Exception {
    if ((path == null) || !Files.exists(path)) {
        throw new Error("replaceFirstMatchingLine: invalid path: " + path);
    }
    if (searchString.contains("\n") || searchString.contains("\r")) {
      throw new Error("replaceFirstMatchingLine: searchString must not contain newline characters (\\n or \\r).");
    }
    if (newLine.contains("\n") || newLine.contains("\r")) {
      throw new Error("replaceFirstMatchingLine: newLine must not contain newline characters (\\n or \\r).");
    }
    String debug_str = ((invDebugStr == null) ? "" : " //" + invDebugStr);

    List<String> lines = Files.readAllLines(path);
    List<String> updatedLines = new ArrayList<>(lines.size());

    boolean replaced = false;
    int line_nb = 1;
    for (String line : lines) {
      if (!replaced && line.contains(searchString)) {
        if (line_nb == 1) {
          if (!line.startsWith(first_line_prefix)) {
            throw new Error("replaceFirstMatchingLine: first line without first_line_prefix: " + line);
          }
          updatedLines.add(first_line_prefix + newLine + debug_str);
        }
        else {
          if (!line.startsWith("+")) {
            throw new Error("replaceFirstMatchingLine: >=2nd line without '+': " + line);
          }
          updatedLines.add("+" + newLine + debug_str);
        }
        replaced = true; // ensures only the first match is replaced
      }
      else {
        updatedLines.add(line);
      }
      line_nb++;
    }
    if (!replaced) {
      throw new Error("replaceFirstMatchingLine: no line replaced");
    }
    String fileContent = String.join("\n", updatedLines);
    Files.writeString(path, fileContent);
  }

  // *************
  // Normalization
  // *************

  private static String pseudo_signature(String precalculated_values) throws Exception {
    List<String> list = new ArrayList<>();
    int current_idx = 0;
    while (precalculated_values.charAt(current_idx+NB_COLUMNS) == ':') {
      int separator_idx1 = precalculated_values.indexOf(",", current_idx+NB_COLUMNS+1);
      int separator_idx2 = precalculated_values.indexOf(".", current_idx+NB_COLUMNS+1);
      if (separator_idx2 == -1) {
        throw new Error("pseudo_signature: invalid precalculated_values (missing final .)");
      }
      int min_separator_idx = (((separator_idx1 != -1) && (separator_idx1 < separator_idx2)) ? separator_idx1 : separator_idx2);
      String perf = precalculated_values.substring(current_idx+NB_COLUMNS+1, min_separator_idx);
      list.add(perf);
      if (precalculated_values.charAt(min_separator_idx) == '.') {
        break;
      }
      current_idx = min_separator_idx+1;
    }
    if (list.size() <= 3) {
      throw new Error("pseudo_signature: invalid precalculated_values (too few values): " + precalculated_values);
    }
    Collections.sort(list); // sort performances alphabetically because the order of codes can change (*)
    String pseudo_signature_str = String.join("-", list) + "-";
    boolean isHex = pseudo_signature_str.matches("[0-9A-F-]+");
    if (!isHex) {
      throw new Error("pseudo_signature: invalid precalculated_values (non hex values)");
    }
    return pseudo_signature_str;
  }

  private static boolean is_pseudo_signature_included(String pseudo_signature_1, String pseudo_signature_2) throws Exception {
    Set<String> substrings_2 = new HashSet<>(Arrays.asList(pseudo_signature_2.split("-")));
    substrings_2.remove(""); // leading '-' could produce an empty string as the first element => remove it if ever present
    for (String substring_1 : pseudo_signature_1.split("-")) {
      if (substring_1.isEmpty()) {
        throw new Error("is_pseudo_signature_included: empty performance");
      }
      if (!substrings_2.contains(substring_1)) {
        return false;
      }
    }
    return true;
  }

  private static String rebuild_line(String prefix, String code1, String mark1, String code2, String mark2, String code3, String mark3, String info_str) throws Exception {
    StringBuilder sb = new StringBuilder();
    sb.append(prefix);
    sb.append(code1);
    sb.append(":");
    sb.append(mark1);
    sb.append("|");
    sb.append(code2);
    sb.append(":");
    sb.append(mark2);
    if ((code3 != null) && (mark3 != null)) {
      sb.append("|");
      sb.append(code3);
      sb.append(":");
      sb.append(mark3);
    }
    if (info_str != null) {
      if ((info_str.indexOf("|N:") != 0) || (!info_str.endsWith("\""))) {
        throw new Error("rebuild_line: invalid info_str");
      }
      sb.append(info_str);
    }
    String str = sb.toString();
    if (str.length() < 24) {
      throw new Error("rebuild_line: too low line length");
    }
    return str;
  }

  private static void applyPermutationOnCode(String code, int permutation_idx, int[] colors) {
    colors[permutations[permutation_idx][0]] = code.charAt(0) - 48;
    colors[permutations[permutation_idx][1]] = code.charAt(1) - 48;
    colors[permutations[permutation_idx][2]] = code.charAt(2) - 48;
    colors[permutations[permutation_idx][3]] = code.charAt(3) - 48;
    colors[permutations[permutation_idx][4]] = code.charAt(4) - 48;
  }

  private static void findNormalizationBijection(int[] colors1, int[] colors2, int[] colors3, int[] bijection) throws Exception {

    Arrays.fill(bijection, 0);
    int color_cnt = 1;

    for (int code_idx = 0; code_idx < ((colors3 == null) ? 2 : 3); code_idx++) {
      int[] colors;
      switch (code_idx) {
        case 0:
          colors = colors1;
          break;
        case 1:
          colors = colors2;
          break;
        case 2:
          colors = colors3;
          break;
        default:
          throw new Error("findNormalizationBijection: invalid code_idx: " + code_idx);
      }

      for (int col = 0; col < NB_COLUMNS; col++) {
        int color = colors[col];
        if (bijection[color] == 0) { // color not filled yet in bijection
          if (color_cnt > NB_COLORS) {
            throw new Error("findNormalizationBijection: invalid bijection (1)");
          }
          bijection[color] = color_cnt;
          color_cnt++;
        }
      }
    }
    if (color_cnt == 1) {
      throw new Error("findNormalizationBijection: empty bijection");
    }

    for (int color = 1; color <= NB_COLORS; color++) {
      if (bijection[color] == 0) { // color not filled yet in bijection
        if (color_cnt > NB_COLORS) {
          throw new Error("findNormalizationBijection: invalid bijection (2)");
        }
        bijection[color] = color_cnt; // no further criteria for colors unused in header to simplify (*)
        color_cnt++;
      }
    }
    if (color_cnt != NB_COLORS+1) {
      throw new Error("findNormalizationBijection: wrong bijection");
    }

  }

  private static int applyBijection(int[] colors, int[] bijection) {
    return 10000 * bijection[colors[0]] + 1000 * bijection[colors[1]] + 100 * bijection[colors[2]] + 10 * bijection[colors[3]] + bijection[colors[4]];
  }

  private static String normalize_line(String prefix, String code1, String mark1, String code2, String mark2, String code3, String mark3, String info_str, boolean shallAlreadyBeNormalized) throws Exception {

    char first_prefix_char = prefix.charAt(0);
    if (first_prefix_char != '"') {
      throw new Error("normalize_line: invalid prefix (1)");
    }
    char second_prefix_char = prefix.charAt(1);
    if ((second_prefix_char != '2') && (second_prefix_char != '3')) {
      throw new Error("normalize_line: invalid prefix (2)");
    }
    char third_prefix_char = prefix.charAt(2);
    if (third_prefix_char != '|') {
      throw new Error("normalize_line: invalid prefix (3)");
    }
    if ( (code1.length() != NB_COLUMNS) || (code2.length() != NB_COLUMNS) || ((code3 != null) && (code3.length() != NB_COLUMNS))
         || (mark1.length() != 4) || (mark2.length() != 4) || ((mark3 != null) && (mark3.length() != 4)) ) {
      throw new Error("normalize_line: invalid code(s)/mark(s)");
    }
    if ((info_str.indexOf("|N:") != 0) || (!info_str.endsWith("\""))) {
      throw new Error("normalize_line: invalid info_str");
    }

    boolean depth_2_case = true; // Depth 2 case
    if ((code3 != null) && (mark3 != null)) {
      depth_2_case = false;
    }
    Arrays.fill(min_norm_bijection, 0);
    long min_header_value = Long.MAX_VALUE;
    int best_perm_idx = -1;
    int min_code1_value = -1;
    int min_code2_value = -1;
    int min_code3_value = -1;

    for (int i = 0; i < NB_PERMUTATIONS; i++) {

      // Apply permutation on first codes
      applyPermutationOnCode(code1, i, norm_code1_colors);
      applyPermutationOnCode(code2, i, norm_code2_colors);
      if (!depth_2_case) {
        applyPermutationOnCode(code3, i, norm_code3_colors);
      }

      // Find normalization bijection
      if (depth_2_case) {
        findNormalizationBijection(norm_code1_colors, norm_code2_colors, null, norm_bijection);
      }
      else {
        findNormalizationBijection(norm_code1_colors, norm_code2_colors, norm_code3_colors, norm_bijection);
      }

      // Determine best bijection
      int code1_value = applyBijection(norm_code1_colors, norm_bijection);
      int code2_value = applyBijection(norm_code2_colors, norm_bijection);
      int code3_value = 0;
      if (!depth_2_case) {
        code3_value = applyBijection(norm_code3_colors, norm_bijection);
      }
      long header_value = (long)100000 * (long)100000 * (long)code1_value + (long)100000 * (long)code2_value + (long)code3_value; // 64 bits, < 2^63
      if (header_value < 0) {
        throw new Error("normalize_line: negative header_value");
      }
      // In case of equality (header_value == min_header_value), no further criteria to simplify (*)
      // Consequences of current normalization simplifications are:
      // - the order of codes can change in info_str. To be noted that increasing order of codes is not guaranteed by SuperMasterMind.js and GameSolver.js scripts due to possible codes listed before impossible codes,
      //   for example in "2|12345:0B1W|12356:0B1W|N:750|27222:95D,27227:89D,27228:8C0,27272:89D,27277:876,27 [...] 7873:83E,77881:823,77883:824,11111:A4F,44444:A08,55555:A88,66666:A08,77777:9DD."
      //   which would make "perfect" normalization complex in this program
      // - several equivalent permutations of columns can be possible
      // - values of colors unused in header can be different in info_str
      if (header_value < min_header_value) {
        min_header_value = header_value;
        best_perm_idx = i;
        for (int j = 0; j < norm_bijection.length; j++) {
          min_norm_bijection[j] = norm_bijection[j];
        }
        min_code1_value = code1_value;
        min_code2_value = code2_value;
        if (!depth_2_case) {
          min_code3_value = code3_value;
        }
      }

    }

    if (best_perm_idx == -1) {
      throw new Error("normalize_line: invalid best_perm_idx (-1)");
    }
    if (shallAlreadyBeNormalized && (best_perm_idx != 0)) {
      throw new Error("normalize_line: invalid best_perm_idx (should be identity): " + best_perm_idx);
    }
    if ( (min_code1_value != 11111) && (min_code1_value != 11112) && (min_code1_value != 11122) && (min_code1_value != 11123) && (min_code1_value != 11223) && (min_code1_value != 11234) && (min_code1_value != 12345) ) {
      throw new Error("normalize_line: unexpected min_code1_value: " + min_code1_value);
    }

    // Apply best permutation and bijection on info_str
    int n_idx = info_str.indexOf("|N:");
    if (n_idx != 0) {
      throw new Error("normalize_line: invalid info_str (|N:)");
    }
    int separator_idx = info_str.indexOf("|", n_idx+3); // last "|" on the line
    if ((separator_idx == -1) || (info_str.indexOf("|", separator_idx+1) != -1)) {
      throw new Error("normalize_line: invalid info_str (cannot find last |)");
    }
    int first_separator_idx = separator_idx;
    String reformated_info_str = info_str.substring(0, separator_idx+1); // example: |N:1581|
    do {
      String code = info_str.substring(separator_idx+1, separator_idx+1+NB_COLUMNS);
      applyPermutationOnCode(code, best_perm_idx, norm_code_colors);
      reformated_info_str += String.valueOf(applyBijection(norm_code_colors, min_norm_bijection));
      if (info_str.charAt(separator_idx+1+NB_COLUMNS) != ':') {
        throw new Error("normalize_line: invalid info_str (missing :)");
      }
      int separator_idx1 = info_str.indexOf(",", separator_idx+1+NB_COLUMNS+1);
      int separator_idx2 = info_str.indexOf(".", separator_idx+1+NB_COLUMNS+1);
      if (separator_idx2 == -1) {
        throw new Error("normalize_line: invalid info_str (missing final .)");
      }
      int min_separator_idx = (((separator_idx1 != -1) && (separator_idx1 < separator_idx2)) ? separator_idx1 : separator_idx2);
      String perf = info_str.substring(separator_idx+1+NB_COLUMNS+1, min_separator_idx);
      if (perf.length() <= 2) {
        throw new Error("normalize_line: invalid info_str (invalid perf)");
      }
      reformated_info_str += ":" + perf;

      // Prepare next loop
      char next_char = info_str.charAt(min_separator_idx);
      if (next_char == ',') {
        reformated_info_str += ",";
        separator_idx = min_separator_idx;
      }
      else if (next_char == '.') {
        if (info_str.charAt(min_separator_idx+1) != '\"') { // (index out of bound not checked)
          throw new Error("normalize_line: invalid info_str (missing last double quotes)");
        }
        reformated_info_str += ".\"";
        break;
      }
      else {
        throw new Error("normalize_line: internal error");
      }
    }
    while (true);
    if ( (info_str.length() != reformated_info_str.length())
         || (!info_str.substring(n_idx, first_separator_idx).equals(reformated_info_str.substring(n_idx, first_separator_idx))) ) {
      throw new Error("normalize_line: invalid reformated_info_str");
    }

    return rebuild_line(prefix,
                        String.valueOf(min_code1_value), mark1,
                        String.valueOf(min_code2_value), mark2,
                        (depth_2_case ? null : String.valueOf(min_code3_value)), mark3,
                        reformated_info_str);

  }

  private static void normalizeCheckAndStoreLine(String line, String prefix, String code1, String mark1, String code2, String mark2, String code3, String mark3, String info_str, boolean shallAlreadyBeNormalized, String invDebugStr) throws Exception {

    // *****************
    // 1) Normalize line
    // *****************

    String normalized_line = normalize_line(prefix, code1, mark1, code2, mark2, code3, mark3, info_str, shallAlreadyBeNormalized);
    if (shallAlreadyBeNormalized) {
      if (!line.equals(normalized_line)) {
        throw new Error("normalizeCheckAndStoreLine: line is not normalized (1): " + line);
      }
    }
    else {
      Matcher matcher = line_pattern.matcher(normalized_line);
      if (matcher.find()) {
        int group_cnt = matcher.groupCount();
        if (group_cnt != 6) {
          throw new Error("normalizeCheckAndStoreLine: unexpected group_cnt value: " + group_cnt);
        }
        int matchedCount = 0;
        for (int j = 1; j <= group_cnt; j++) {
            if (matcher.group(j) != null) {
                matchedCount++;
            }
        }

        if (matchedCount == 4) { // Depth 2 case
          code1 = matcher.group(1);
          mark1 = matcher.group(2);
          code2 = matcher.group(3);
          mark2 = matcher.group(4);
          code3 = null;
          mark3 = null;
          info_str = normalized_line.substring(matcher.end(4));
        }
        else if (matchedCount == 6) { // Depth 3 case
          code1 = matcher.group(1);
          mark1 = matcher.group(2);
          code2 = matcher.group(3);
          mark2 = matcher.group(4);
          code3 = matcher.group(5);
          mark3 = matcher.group(6);
          info_str = normalized_line.substring(matcher.end(6));
        }
        else {
          throw new Error("normalizeCheckAndStoreLine: unexpected matchedCount value: " + matchedCount);
        }
      }
      else {
        throw new Error("normalizeCheckAndStoreLine: matcher.find error: " + normalized_line);
      }

      // normalize line again just for defensive check
      String normalized_line_2 = normalize_line(prefix, code1, mark1, code2, mark2, code3, mark3, info_str, true);
      if (!normalized_line.equals(normalized_line_2)) {
          throw new Error("normalizeCheckAndStoreLine: line is not normalized (2): " + normalized_line);
      }
    }

    String line_header = rebuild_line(prefix, code1, mark1, code2, mark2, code3, mark3, null); // header of normalized_line

    // *********************************
    // 2) Write to output file if needed
    // *********************************

    String content = null; // N.A.
    static_searchOutput.count = 10; // N.A.
    boolean write_first_line_prefix = false;
    String output_filename = OUT_FOLDER + determine_filename(code1, mark1, code2, mark2);
    File output_file = new File(output_filename);
    if(!output_file.exists()) {
      output_file.createNewFile();
      write_first_line_prefix = true;
    }
    else {
      content = Files.readString(Path.of(output_filename));
      if (content.indexOf(first_line_prefix) != 0) {
        throw new Error("normalizeCheckAndStoreLine: first_line_prefix not at file beginning: " + output_filename);
      }
      countLineHeaderOccurrences(content, line_header, static_searchOutput);
    }
    if (write_first_line_prefix || (static_searchOutput.count == 0)) {
      String debug_str = ((invDebugStr == null) ? "" : " //" + invDebugStr);
      FileWriter fw = new FileWriter(output_file, true /* (append) */);
      BufferedWriter bw = new BufferedWriter(fw);
      if (write_first_line_prefix) {
        bw.write(first_line_prefix + normalized_line + debug_str);
      }
      else {
        bw.write("\n+" + normalized_line + debug_str);
      }
      bw.close();
    }
    else if (static_searchOutput.count == 1) {
      // Check that precalculated performances already stored are identical to current ones for which storage is skipped
      if ((static_searchOutput.start_index == -1) || (static_searchOutput.dot_index == -1)) {
        throw new Error("normalizeCheckAndStoreLine: invalid static_searchOutput.start_index/dot_index");
      }
      String already_stored_line = content.substring(static_searchOutput.start_index, static_searchOutput.dot_index) + ".\"";
      // - Check N:xxx value
      int n_idx1 = normalized_line.indexOf("|N:");
      if (n_idx1 == -1) {
        throw new Error("normalizeCheckAndStoreLine: invalid normalized_line (|N:)");
      }
      int separator_idx1 = normalized_line.indexOf("|", n_idx1+3); // last "|" on the line
      if (separator_idx1 == -1) {
        throw new Error("normalizeCheckAndStoreLine: normalized_line (cannot find last |)");
      }
      int n_idx2 = already_stored_line.indexOf("|N:");
      if (n_idx2 == -1) {
        throw new Error("normalizeCheckAndStoreLine: invalid already_stored_line (|N:)");
      }
      int separator_idx2 = already_stored_line.indexOf("|", n_idx2+3); // last "|" on the line
      if (separator_idx2 == -1) {
        throw new Error("normalizeCheckAndStoreLine: invalid already_stored_line (cannot find last |)");
      }
      if (!normalized_line.substring(n_idx1, separator_idx1).equals(already_stored_line.substring(n_idx2, separator_idx2))) {
        throw new Error("normalizeCheckAndStoreLine: inconsistent lines (N:xxx): " + normalized_line + " != " + already_stored_line);
      }
      // - Pseudo-signature-based check
      String pseudo_signature_1 = pseudo_signature(normalized_line.substring(separator_idx1+1));
      String pseudo_signature_2 = pseudo_signature(already_stored_line.substring(separator_idx2+1));
      int nb_commas_in_normalized_line = countOccurrences(normalized_line, ",");
      int nb_commas_in_already_stored_line = countOccurrences(already_stored_line, ",");
      if (nb_commas_in_normalized_line == nb_commas_in_already_stored_line) { // nominal case
        if (normalized_line.length() != already_stored_line.length()) {
          throw new Error("normalizeCheckAndStoreLine: invalid length #1");
        }
        if (!pseudo_signature_1.equals(pseudo_signature_2)) {
          throw new Error("normalizeCheckAndStoreLine: inconsistent lines (pseudo signature) #1: " + normalized_line + " != " + already_stored_line
                          + "\n pseudo_signature_1 = " + pseudo_signature_1 + "\n pseudo_signature_2 = " + pseudo_signature_2);
        }
      }
      else { // one set of performances shall be strictly included in the other
        if (pseudo_signature_1.equals(pseudo_signature_2)) {
          throw new Error("normalizeCheckAndStoreLine: invalid pseudo signatures");
        }
        boolean include_check_1_2 = is_pseudo_signature_included(pseudo_signature_1, pseudo_signature_2);
        boolean include_check_2_1 = is_pseudo_signature_included(pseudo_signature_2, pseudo_signature_1);
        if (!include_check_1_2 && !include_check_2_1) {
          throw new Error("normalizeCheckAndStoreLine: inconsistent lines (pseudo signature) #2: " + normalized_line + " != " + already_stored_line
                          + "\n pseudo_signature_1 = " + pseudo_signature_1 + "\n pseudo_signature_2 = " + pseudo_signature_2);
        }
        // Replace already stored line by normalized_line if it has more contents
        if (include_check_2_1) {
          if (normalized_line.length() <= already_stored_line.length()) {
            throw new Error("normalizeCheckAndStoreLine: invalid length #2");
          }
          replaceFirstMatchingLine(Path.of(output_filename), line_header, normalized_line, invDebugStr);
        }
      }
    }
    else {
      throw new Error("normalizeCheckAndStoreLine: invalid static_searchOutput.count: " + static_searchOutput.count + " for line_header: " + line_header);
    }

    // ***************************************************************
    // 3) Check that normalized line is only present once in all files
    // ***************************************************************

    int count_all = countLineHeaderInAllOutputFiles(line_header);
    if (count_all != 1) {
      throw new Error("normalizeCheckAndStoreLine: invalid count_all: " + count_all + " for line_header: " + line_header);
    }

  }

  // *************
  // Main function
  // *************

  public static void main(String[] args) {
    try {

      Path outDir = clean_out_directory();
      generateAllPermutations();

      run_unit_tests();

      outDir = clean_out_directory();
      long lastTime = System.nanoTime();

      for (int inv_mode = 0; inv_mode <= 1; inv_mode++) {

        int line_cnt_total = 0;
        int line_cnt_2 = 0;
        int line_cnt_3 = 0;

        for (int i = 0; i < file_table.length; i++) {
          System.out.println("Handling file " + file_table[i] + "...");
          File file = new File(file_table[i]);
          BufferedReader br = new BufferedReader(new FileReader(file));
          String line;

          while ((line = br.readLine()) != null) {

            Matcher matcher = line_pattern.matcher(line);
            if (matcher.find()) {
              int group_cnt = matcher.groupCount();
              if (group_cnt != 6) {
                throw new Error("main: unexpected group_cnt value: " + group_cnt);
              }
              int matchedCount = 0;
              for (int j = 1; j <= group_cnt; j++) {
                  if (matcher.group(j) != null) {
                      matchedCount++;
                  }
              }

              line = line.replace("+","").trim(); // suppress final +, spaces, ^M in input files
              if (!line.endsWith("\"")) {
                throw new Error("main: unexpected line end");
              }
              if (matchedCount == 4) { // Depth 2 case
                if (inv_mode == 0) {
                  // 12
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(1), matcher.group(2), matcher.group(3), matcher.group(4), null, null, line.substring(matcher.end(4)), true, null);
                  line_cnt_2++;
                }
                else {
                  // 21
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(3), matcher.group(4), matcher.group(1), matcher.group(2), null, null, line.substring(matcher.end(4)), false, "21");
                  line_cnt_2++;
                }
              }
              else if (matchedCount == 6) { // Depth 3 case
                if (inv_mode == 0) {
                  // 123
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(1), matcher.group(2), matcher.group(3), matcher.group(4), matcher.group(5), matcher.group(6), line.substring(matcher.end(6)), true, null);
                  line_cnt_3++;
                }
                else {
                  // 132
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(1), matcher.group(2), matcher.group(5), matcher.group(6), matcher.group(3), matcher.group(4), line.substring(matcher.end(6)), false, "132");
                  // 213
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(3), matcher.group(4), matcher.group(1), matcher.group(2), matcher.group(5), matcher.group(6), line.substring(matcher.end(6)), false, "213");
                  // 231
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(3), matcher.group(4), matcher.group(5), matcher.group(6), matcher.group(1), matcher.group(2), line.substring(matcher.end(6)), false, "231");
                  // 312
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(5), matcher.group(6), matcher.group(1), matcher.group(2), matcher.group(3), matcher.group(4), line.substring(matcher.end(6)), false, "312");
                  // 321
                  normalizeCheckAndStoreLine(line, line.substring(0, matcher.start(1)), matcher.group(5), matcher.group(6), matcher.group(3), matcher.group(4), matcher.group(1), matcher.group(2), line.substring(matcher.end(6)), false, "321");
                  line_cnt_3 = line_cnt_3 + 5;
                }
              }
              else {
                throw new Error("main: unexpected matchedCount value: " + matchedCount);
              }

              line_cnt_total++;
              if ((line_cnt_total % 1000) == 0) {
                System.out.println("line_cnt_2 = " + line_cnt_2 + ", line_cnt_3 = " + line_cnt_3 + ", line_cnt_total = " + line_cnt_total + " (" + ((System.nanoTime() - lastTime) / (long)1000000000) + "s)");
                lastTime = System.nanoTime();
              }
            }
            else {
              if (!line.equals("")) {
                throw new Error("unexpected non matching line: " + line);
              }
            }

          } // end while
        } // end for files

        System.out.println("\nSUCCESS (" + (inv_mode+1) + " ouf of 2): line_cnt_2 = " + line_cnt_2 + ", line_cnt_3 = " + line_cnt_3 + ", line_cnt_total = " + line_cnt_total);

        if (inv_mode == 0) {
          Scanner scanner = new Scanner(System.in);
          System.out.println("\nPress Enter to make performances symmetrical...");
          scanner.nextLine(); // Waits until the user presses Enter
        }

      } // end for inv_mode

    }
    catch (Exception e) {
      System.out.println("ERROR: " + e);
      e.printStackTrace();
    }
  }

  // *****
  // Tests
  // *****

  private static Path clean_out_directory() throws Exception {
    Path outDir = Path.of(OUT_FOLDER);
    // Remove directory if it exists
    if (Files.exists(outDir)) {
      Files.walk(outDir)
      .sorted((a, b) -> b.compareTo(a))   // delete children first
      .forEach(path -> {
        try {
          Files.delete(path);
        } catch (IOException e) {
          throw new RuntimeException(e);
        }
      });
    }
    // Recreate directory
    Files.createDirectories(outDir);

    return outDir;
  }

  private static void run_unit_tests() throws Exception {

    // Pattern
    // *******

    String str_depth2 = "\"2|71123:1B4W|11121:4B0W|N:1581|13334:14F0,13344:146C,..,45613:152E.\" +";
    Matcher matcher = line_pattern.matcher(str_depth2);
    if (matcher.find()) {
      int group_cnt = matcher.groupCount();
      if (group_cnt != 6) {
        throw new Error("test error: unexpected group_cnt value (depth 2): " + group_cnt);
      }
      int matchedCount = 0;
      for (int j = 1; j <= group_cnt; j++) {
          if (matcher.group(j) != null) {
              matchedCount++;
          }
      }

      if (matchedCount != 4) { // Depth 2 case
        throw new Error("test error: unexpected matchedCount value (depth 2): " + matchedCount);
      }
      if ( (!str_depth2.substring(0, matcher.start(1)).equals("\"2|")) // prefix
           || (!matcher.group(1).equals("71123")) || (!matcher.group(2).equals("1B4W")) || (!matcher.group(3).equals("11121")) || (!matcher.group(4).equals("4B0W"))
           || (!str_depth2.substring(matcher.end(4)).equals("|N:1581|13334:14F0,13344:146C,..,45613:152E.\" +")) ) { // info_str
        throw new Error("test error: unexpected group value(s)  (depth 2)");
      }
    }
    else {
      throw new Error("test error: non matching line (depth 2)");
    }
    String str_depth3 = "\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:2288|13334:14F0,13344:146C,..,45613:152F.\" +";
    matcher = line_pattern.matcher(str_depth3);
    if (matcher.find()) {
      int group_cnt = matcher.groupCount();
      if (group_cnt != 6) {
        throw new Error("test error: unexpected group_cnt value (depth 3): " + group_cnt);
      }
      int matchedCount = 0;
      for (int j = 1; j <= group_cnt; j++) {
          if (matcher.group(j) != null) {
              matchedCount++;
          }
      }

      if (matchedCount != 6) { // Depth 3 case
        throw new Error("test error: unexpected matchedCount value (depth 3): " + matchedCount);
      }
      if ( (!str_depth3.substring(0, matcher.start(1)).equals("\"3|")) // prefix
           || (!matcher.group(1).equals("11123")) || (!matcher.group(2).equals("1B1W")) || (!matcher.group(3).equals("11111")) || (!matcher.group(4).equals("1B0W")) || (!matcher.group(5).equals("22222")) || (!matcher.group(6).equals("0B0W"))
           || (!str_depth3.substring(matcher.end(6)).equals("|N:2288|13334:14F0,13344:146C,..,45613:152F.\" +")) ) { // info_str
        throw new Error("test error: unexpected group value(s)  (depth 3)");
      }
    }
    else {
      throw new Error("test error: non matching line (depth 3)");
    }

    // Permutations
    // ************

    String first_perm_str = "" + permutations[0][0] + permutations[0][1] + permutations[0][2] + permutations[0][3] + permutations[0][4];
    if (!first_perm_str.equals("01234")) throw new Error("test error: first_perm_str");
    String last_perm_str = "" + permutations[119][0] + permutations[119][1] + permutations[119][2] + permutations[119][3] + permutations[119][4];
    if (!last_perm_str.equals("43210")) throw new Error("test error: last_perm_str");

    // Filenames
    // *********

    String filename1_str = determine_filename("87654", "0B2W", "71726", "0B3W");
    if (!filename1_str.equals("1+1+1+1+1_0B2W_2+1+1+1_0B3W_5738412027.js")) throw new Error("test error: filename1");
    String filename2_str = determine_filename("55317", "2B1W", "25264", "1B1W");
    if (!filename2_str.equals("2+1+1+1_2B1W_2+1+1+1_1B1W_8048644107.js")) throw new Error("test error: filename2");
    String filename3_str = determine_filename("33333", "0B0W", "44422", "0B2W");
    if (!filename3_str.equals("5_0B0W_3+2_0B2W_31500000003.js")) throw new Error("test error: filename3");
    String filename4_str = determine_filename("44244", "1B0W", "23322", "1B1W");
    if (!filename4_str.equals("4+1_1B0W_3+2_1B1W_21759600013.js")) throw new Error("test error: filename4");
    String filename5_str = determine_filename("88115", "0B2W", "11158", "1B1W");
    if (!filename5_str.equals("2+2+1_0B2W_3+1+1_1B1W_11321048133.js")) throw new Error("test error: filename5");

    // countLineHeaderInAllOutputFiles + countLineHeaderOccurrences + countOccurrences
    // *******************************************************************************

    Path outDir = clean_out_directory();

    // Write files
    Files.writeString(outDir.resolve("file1" + OUT_FILES_SUFFIX), "3|11123:1B1W|11111:1B0W|22222:0B0W|N:XXX|13334:14F0,13344:146C,..,45613:152E.");
    Files.writeString(outDir.resolve("file1" + OUT_FILES_SUFFIX + ".txt"), "3|11123:1B1W|11111:1B0W|22222:0B0W|N:XXX|13334:14F0,13344:146C,..,45613:152E.");
    Files.writeString(outDir.resolve("file2" + OUT_FILES_SUFFIX), "3|11122:1B1W|11111:1B0W|22222:0B0W|N:YYY|13334:14F0,13344:146C,..,45613:152E.");
    Files.writeString(outDir.resolve("file3" + OUT_FILES_SUFFIX), "extra_precalculated_str = \"3|11123:1B1W|11111:1B0W|22222:0B0W|N:ZZZ|13334:14F0,13344:146C,..,45613:152E.\"\n+\"3|11122:1B1W|11111:1B0W|22222:0B0W|N:TTT|13334:14F0,13344:146C,..,45613:152E.\"\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:UUU|13334:14F0,13344:146C,..,45613:152E.\"\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:VVV|13334:14F0,13344:146C,..,45613:152E.\"");
    int count = countLineHeaderInAllOutputFiles("3|11123:1B1W|11111:1B0W|");
    if (count != 4) throw new Error("test error: countLineHeaderInAllOutputFiles: " + count);

    countLineHeaderOccurrences("abc\n\ncdezzz.", "cde", static_searchOutput);
    if ((static_searchOutput.count != 1) || (static_searchOutput.start_index != 5) || (static_searchOutput.dot_index != 11)) throw new Error("test error: countLineHeaderOccurrences (1)");
    countLineHeaderOccurrences("abc\n\ncdezzz.cdecde.", "cde", static_searchOutput);
    if ((static_searchOutput.count != 3) || (static_searchOutput.start_index != 15) || (static_searchOutput.dot_index != 18)) throw new Error("test error: countLineHeaderOccurrences (2)");

    if (countOccurrences("aabbaacaaacaddaaeaafaaaa", "aa") != 7) throw new Error("test error: countOccurrences (1)");
    if (countOccurrences(",,bb,,cc,dd,x,", ":") != 0) throw new Error("test error| countOccurrences (2)");
    if (countOccurrences(",,bb,,cc,dd,x,", ",") != 7) throw new Error("test error| countOccurrences (3)");

    // replaceFirstMatchingLine
    // ************************

    // >=2nd line
    replaceFirstMatchingLine(outDir.resolve("file3" + OUT_FILES_SUFFIX), "3|11122:1B1W|11111:1B0W|", "\"XXX012345689\"", null);
    String content_replaced = Files.readString(outDir.resolve("file3" + OUT_FILES_SUFFIX));
    String expected_content_replaced = "extra_precalculated_str = \"3|11123:1B1W|11111:1B0W|22222:0B0W|N:ZZZ|13334:14F0,13344:146C,..,45613:152E.\"\n+\"XXX012345689\"\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:UUU|13334:14F0,13344:146C,..,45613:152E.\"\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:VVV|13334:14F0,13344:146C,..,45613:152E.\"";
    if (!content_replaced.equals(expected_content_replaced)) throw new Error("test error: replaceFirstMatchingLine (1)");

    replaceFirstMatchingLine(outDir.resolve("file3" + OUT_FILES_SUFFIX), "\"XXX012345689\"", "\"XXXABCDE\"", "333");
    content_replaced = Files.readString(outDir.resolve("file3" + OUT_FILES_SUFFIX));
    expected_content_replaced = "extra_precalculated_str = \"3|11123:1B1W|11111:1B0W|22222:0B0W|N:ZZZ|13334:14F0,13344:146C,..,45613:152E.\"\n+\"XXXABCDE\" //333\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:UUU|13334:14F0,13344:146C,..,45613:152E.\"\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:VVV|13334:14F0,13344:146C,..,45613:152E.\"";
    if (!content_replaced.equals(expected_content_replaced)) throw new Error("test error: replaceFirstMatchingLine (2)");

    replaceFirstMatchingLine(outDir.resolve("file3" + OUT_FILES_SUFFIX), "\"XXXABCDE\"", "\"XXX777\"", "444");
    content_replaced = Files.readString(outDir.resolve("file3" + OUT_FILES_SUFFIX));
    expected_content_replaced = "extra_precalculated_str = \"3|11123:1B1W|11111:1B0W|22222:0B0W|N:ZZZ|13334:14F0,13344:146C,..,45613:152E.\"\n+\"XXX777\" //444\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:UUU|13334:14F0,13344:146C,..,45613:152E.\"\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:VVV|13334:14F0,13344:146C,..,45613:152E.\"";
    if (!content_replaced.equals(expected_content_replaced)) throw new Error("test error: replaceFirstMatchingLine (3)");

    // First line
    replaceFirstMatchingLine(outDir.resolve("file3" + OUT_FILES_SUFFIX), "3|11123:1B1W|11111:1B0W|22222:0B0W|", "\"ABDEFG\"", "555");
    content_replaced = Files.readString(outDir.resolve("file3" + OUT_FILES_SUFFIX));
    expected_content_replaced = "extra_precalculated_str = \"ABDEFG\" //555\n+\"XXX777\" //444\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:UUU|13334:14F0,13344:146C,..,45613:152E.\"\n+\"3|11123:1B1W|11111:1B0W|22222:0B0W|N:VVV|13334:14F0,13344:146C,..,45613:152E.\"";
    if (!content_replaced.equals(expected_content_replaced)) throw new Error("test error: replaceFirstMatchingLine (4)");

    // pseudo_signature
    // ****************

    String expected_pseudo_sig = "14F0-150000-1ACBB-25D-8000-BAC-EF1-EFEE-";
    String pseudo_sig1 = pseudo_signature("13334:14F0,13344:BAC,45613:150000,45614:25D,45615:EF1,45616:8000,45617:1ACBB,45617:EFEE.\"");
    if (!pseudo_sig1.equals(expected_pseudo_sig)) throw new Error("test error: pseudo_signature (1)");
    String pseudo_sig2 = pseudo_signature("45617:EFEE,45615:EF1,45614:25D,45613:150000,45616:8000,45617:1ACBB,13344:BAC,13334:14F0.\""); // inverted perfs
    if (!pseudo_sig2.equals(expected_pseudo_sig)) throw new Error("test error: pseudo_signature (2)");

    if (!is_pseudo_signature_included("14F0-150000-1ACBB-25D-8000-BAC-EF1-EFEE-", "14F0-150000-1ACBB-25D-8000-BAC-EF1-EFEE-")) throw new Error("test error: is_pseudo_signature_included (1)");
    if (!is_pseudo_signature_included("14F0-1ACBB-25D-EF1-EFEE-", "14F0-150000-1ACBB-25D-8000-BAC-EF1-EFEE-")) throw new Error("test error: is_pseudo_signature_included (2)");
    if (!is_pseudo_signature_included("25D-EF1-EFEE-14F0-1ACBB-", "14F0-150000-1ACBB-25D-8000-BAC-EF1-EFEE-")) throw new Error("test error: is_pseudo_signature_included (3)");
    if (is_pseudo_signature_included("14F0-1ACBB-25D-EF1-AA-EFEE-", "14F0-150000-1ACBB-25D-8000-BAC-EF1-EFEE-")) throw new Error("test error: is_pseudo_signature_included (4)");

    // rebuild_line
    // ************

    String rebuilt_line1 = rebuild_line("\"2|", "22551", "1B1W", "54321", "0B0W", null, null, "|N:123|13334:14F0,13344:146C.\"");
    if (!rebuilt_line1.equals("\"2|22551:1B1W|54321:0B0W|N:123|13334:14F0,13344:146C.\"")) throw new Error("test error: rebuild_line (1): " + rebuilt_line1);
    String rebuilt_line2 = rebuild_line("\"3|", "22551", "1B1W", "54321", "0B0W", "78888", "5B0W", "|N:123|13334:14F0,13344:146C.\"");
    if (!rebuilt_line2.equals("\"3|22551:1B1W|54321:0B0W|78888:5B0W|N:123|13334:14F0,13344:146C.\"")) throw new Error("test error: rebuild_line (2): " + rebuilt_line2);
    String rebuilt_line3 = rebuild_line("\"3|", "22551", "1B1W", "54321", "0B0W", "78888", "5B0W", null);
    if (!rebuilt_line3.equals("\"3|22551:1B1W|54321:0B0W|78888:5B0W")) throw new Error("test error: rebuild_line (3): " + rebuilt_line3);

    // applyPermutationOnCode
    // **********************

    int test_colors[] = new int[NB_COLUMNS];
    applyPermutationOnCode("25728", NB_PERMUTATIONS-1, test_colors);
    if ( (test_colors[0] != 8) || (test_colors[1] != 2) || (test_colors[2] != 7) || (test_colors[3] != 5) || (test_colors[4] != 2) ) throw new Error("test error: applyPermutationOnCode");

    // findNormalizationBijection
    // **************************

    // Depth 2 case
    int test_colors1[] = new int[NB_COLUMNS];
    test_colors1[0] = 8; // 8->1
    test_colors1[1] = 3; // 3->2
    test_colors1[2] = 3;
    test_colors1[3] = 8;
    test_colors1[4] = 5; // 5->3
    int test_colors2[] = new int[NB_COLUMNS];
    test_colors2[0] = 3;
    test_colors2[1] = 2; // 2->4
    test_colors2[2] = 5;
    test_colors2[3] = 7; // 7->5
    test_colors2[4] = 2;
    // remaining colors: 1->6, 4->7, 6->8
    int test_bijection2[] = new int[NB_COLORS+1];
    findNormalizationBijection(test_colors1, test_colors2, null, test_bijection2);
    if ( (test_bijection2[0] != 0)
         || (test_bijection2[1] != 6) || (test_bijection2[2] != 4) || (test_bijection2[3] != 2) || (test_bijection2[4] != 7)
         || (test_bijection2[5] != 3) || (test_bijection2[6] != 8) || (test_bijection2[7] != 5) || (test_bijection2[8] != 1) ) {
      throw new Error("test error: findNormalizationBijection (depth 2)");
    }

    // Depth 3 case
    int test_colors3[] = new int[NB_COLUMNS];
    test_colors3[0] = 2;
    test_colors3[1] = 2;
    test_colors3[2] = 4; // 4->6
    test_colors3[3] = 1; // 1->7
    test_colors3[4] = 2;
    int test_bijection3[] = new int[NB_COLORS+1];
    findNormalizationBijection(test_colors1, test_colors2, test_colors3, test_bijection3);
    if ( (test_bijection3[0] != 0)
         || (test_bijection3[1] != 7) || (test_bijection3[2] != 4) || (test_bijection3[3] != 2) || (test_bijection3[4] != 6)
         || (test_bijection3[5] != 3) || (test_bijection3[6] != 8) || (test_bijection3[7] != 5) || (test_bijection3[8] != 1) ) {
      throw new Error("test error: findNormalizationBijection (depth 3)");
    }

    // applyBijection
    // **************

    int test_colors4[] = new int[NB_COLUMNS];
    test_colors4[0] = 1;
    test_colors4[1] = 4;
    test_colors4[2] = 6;
    test_colors4[3] = 4;
    test_colors4[4] = 2;
    int value1 = applyBijection(test_colors1, test_bijection3);
    int value2 = applyBijection(test_colors2, test_bijection3);
    int value3 = applyBijection(test_colors3, test_bijection3);
    int value4 = applyBijection(test_colors4, test_bijection2);
    if ( (value1 != 12213) || (value2 != 24354) || (value3 != 44674) || (value4 != 67874) ) {
      throw new Error("test error: applyBijection");
    }

    // normalize_line
    // **************

    // Depth 2 case
    // Existing truncated normalized line: "2|11234:1B1W|23456:0B2W|N:1166|12522:DCD,12525:D81,12527:D4E."
    String normalized_line1 = normalize_line("\"2|", "11234", "1B1W", "23456", "0B2W", null, null, "|N:1166|12522:DCD,12525:D81,12527:D4E.\"", true);
    if (!normalized_line1.equals("\"2|11234:1B1W|23456:0B2W|N:1166|12522:DCD,12525:D81,12527:D4E.\"")) throw new Error("test error: normalize_line (1): " + normalized_line1);
    // 1<->5
    String normalized_line2 = normalize_line("\"2|", "55234", "1B1W", "23416", "0B2W", null, null, "|N:1166|52122:DCD,52121:D81,52127:D4E.\"", false);
    if (!normalized_line2.equals("\"2|11234:1B1W|23456:0B2W|N:1166|12522:DCD,12525:D81,12527:D4E.\"")) throw new Error("test error: normalize_line (2): " + normalized_line2);
    // 2<-3
    String normalized_line3 = normalize_line("\"2|", "55324", "1B1W", "32416", "0B2W", null, null, "|N:1166|53133:DCD,53131:D81,53137:D4E.\"", false);
    if (!normalized_line3.equals("\"2|11234:1B1W|23456:0B2W|N:1166|12522:DCD,12525:D81,12527:D4E.\"")) throw new Error("test error: normalize_line (3): " + normalized_line3);
    // permutate first 2 columns and last 2 columns
    String normalized_line3_perm = normalize_line("\"2|", "55342", "1B1W", "23461", "0B2W", null, null, "|N:1166|35133:DCD,35113:D81,35173:D4E.\"", false);
    if (!normalized_line3_perm.equals("\"2|11234:1B1W|23456:0B2W|N:1166|12522:DCD,12525:D81,12527:D4E.\"")) throw new Error("test error: normalize_line (3perm): " + normalized_line3_perm);

    // Depth 3 case
    // Existing truncated normalized line: "3|11123:0B2W|22222:1B0W|11111:0B0W|N:2036|23334:1BFB,23344:1B23,23345:1AC0,44432:1C71,44532:1AD1,45632:1B10."
    String normalized_line4 = normalize_line("\"3|", "11123", "0B2W", "22222", "1B0W", "11111", "0B0W", "|N:2036|23334:1BFB,23344:1B23,23345:1AC0,44432:1C71,44532:1AD1,45632:1B10.\"", true);
    if (!normalized_line4.equals("\"3|11123:0B2W|22222:1B0W|11111:0B0W|N:2036|23334:1BFB,23344:1B23,23345:1AC0,44432:1C71,44532:1AD1,45632:1B10.\"")) throw new Error("test error: normalize_line (4): " + normalized_line4);
    // 1<->3
    String normalized_line5 = normalize_line("\"3|", "33321", "0B2W", "22222", "1B0W", "33333", "0B0W", "|N:2036|21114:1BFB,21144:1B23,21145:1AC0,44412:1C71,44512:1AD1,45612:1B10.\"", false);
    if (!normalized_line5.equals("\"3|11123:0B2W|22222:1B0W|11111:0B0W|N:2036|23334:1BFB,23344:1B23,23345:1AC0,44432:1C71,44532:1AD1,45632:1B10.\"")) throw new Error("test error: normalize_line (5): " + normalized_line5);
    // 2<->3
    String normalized_line6 = normalize_line("\"3|", "22231", "0B2W", "33333", "1B0W", "22222", "0B0W", "|N:2036|31114:1BFB,31144:1B23,31145:1AC0,44413:1C71,44513:1AD1,45613:1B10.\"", false);
    if (!normalized_line6.equals("\"3|11123:0B2W|22222:1B0W|11111:0B0W|N:2036|23334:1BFB,23344:1B23,23345:1AC0,44432:1C71,44532:1AD1,45632:1B10.\"")) throw new Error("test error: normalize_line (6): " + normalized_line6);
    // permutate first and last columns
    String normalized_line6perm = normalize_line("\"3|", "12232", "0B2W", "33333", "1B0W", "22222", "0B0W", "|N:2036|41113:1BFB,41143:1B23,51143:1AC0,34414:1C71,34514:1AD1,35614:1B10.\"", false);
    // several equivalent permutations of columns can be possible (*) => (col1, col2, col3, col4, col5) -> (col2, col3, col1, col4, col5) permutation in this case
    if (!normalized_line6perm.equals("\"3|11123:0B2W|22222:1B0W|11111:0B0W|N:2036|33234:1BFB,33244:1B23,33245:1AC0,44432:1C71,45432:1AD1,56432:1B10.\"")) throw new Error("test error: normalize_line (6perm): " + normalized_line6perm);

    // normalizeCheckAndStoreLine
    // **************************

    outDir = clean_out_directory();

    // Depth 2 case

    // Existing input normalized line which will be stored in 2+2+1_1B1W_3+1+1_1B1W_11149944024.js
    String line1 = "\"2|11223:1B1W|34441:1B1W|N:764|12455:89D,12456:880,14115:8D9,14155:89D,14156:871,14552:8B3,14562:890,15145:89C,15146:875,15452:899,15462:887,21455:889,21456:865,22244:9B2,23343:92F,23453:881,24254:8C0,24333:941,24353:88C,24553:895,24563:877,25244:8CA,25343:88C,25453:88D,25463:863,31335:8DE,31355:8B7,31356:896,31555:92A,31556:8B4,31565:893,31567:886,33133:9B1,33153:8E1,33234:944,33254:895,35133:8E3,35153:8CF,35163:8A2,35234:8A8,35254:8B0,35264:87B,41111:9CA,41151:8CF,41551:8AF,41561:880,42242:9AB,42245:8C1,44252:8C1,45242:8BC,45251:8C5,45261:8B1,51145:889,51146:861,51452:88E,51462:875,52244:8CC,52343:893,52453:88D,52463:873,53245:88D,53246:86D,54125:89E,54126:88A,54235:894,54236:876,11111:A54,22222:A98,33333:A2B,44444:AD1,55555:A58.\" +\r";
    line1 = line1.replace("+","").trim(); // suppress final +, spaces, ^M in input files, as before all normalizeCheckAndStoreLine calls
    normalizeCheckAndStoreLine(line1,
                               "\"2|", // prefix
                               "11223", "1B1W", "34441", "1B1W", null, null,
                               "|N:764|12455:89D,12456:880,14115:8D9,14155:89D,14156:871,14552:8B3,14562:890,15145:89C,15146:875,15452:899,15462:887,21455:889,21456:865,22244:9B2,23343:92F,23453:881,24254:8C0,24333:941,24353:88C,24553:895,24563:877,25244:8CA,25343:88C,25453:88D,25463:863,31335:8DE,31355:8B7,31356:896,31555:92A,31556:8B4,31565:893,31567:886,33133:9B1,33153:8E1,33234:944,33254:895,35133:8E3,35153:8CF,35163:8A2,35234:8A8,35254:8B0,35264:87B,41111:9CA,41151:8CF,41551:8AF,41561:880,42242:9AB,42245:8C1,44252:8C1,45242:8BC,45251:8C5,45261:8B1,51145:889,51146:861,51452:88E,51462:875,52244:8CC,52343:893,52453:88D,52463:873,53245:88D,53246:86D,54125:89E,54126:88A,54235:894,54236:876,11111:A54,22222:A98,33333:A2B,44444:AD1,55555:A58.\"", // info_str
                               true, null);
    String content1 = Files.readString(Path.of(OUT_FOLDER + "2+2+1_1B1W_3+1+1_1B1W_11149944024.js"));
    String expected_content1 = first_line_prefix + line1;
    if (!content1.equals(expected_content1)) throw new Error("test error: normalizeCheckAndStoreLine (1)");

    // Existing input normalized line which will be stored in 3+2_1B0W_1+1+1+1+1_0B3W_14457443205.js
    // Existing truncated normalized line: "2|11122:1B0W|13425:0B3W|N:1089|31334:D78,31343:D43,31344:CDD,31346:C74,31353:D4F,31356:C83,51122:F29,53425:EDE,55555:F1C,61122:F30,63425:ECA."
    // 2<->3
    String line1b = "\"2|11133:1B0W|12435:0B3W|N:1089|21224:D78,21242:D43,21244:CDD,21246:C74,21252:D4F,21256:C83,51133:F29,52435:EDE,55555:F1C,61133:F30,62435:ECA.\" +\r";
    line1b = line1b.replace("+","").trim(); // suppress final +, spaces, ^M in input files, as before all normalizeCheckAndStoreLine calls
    normalizeCheckAndStoreLine(line1b,
                               "\"2|", // prefix
                               "11133", "1B0W", "12435", "0B3W", null, null,
                               "|N:1089|21224:D78,21242:D43,21244:CDD,21246:C74,21252:D4F,21256:C83,51133:F29,52435:EDE,55555:F1C,61133:F30,62435:ECA.\"", // info_str
                               false, "ABCD");
    String content1b = Files.readString(Path.of(OUT_FOLDER + "3+2_1B0W_1+1+1+1+1_0B3W_14457443205.js"));
    String expected_content1b = first_line_prefix + "\"2|11122:1B0W|13425:0B3W|N:1089|31334:D78,31343:D43,31344:CDD,31346:C74,31353:D4F,31356:C83,51122:F29,53425:EDE,55555:F1C,61122:F30,63425:ECA.\"" + " //ABCD";
    if (!content1b.equals(expected_content1b)) throw new Error("test error: normalizeCheckAndStoreLine (1b)");

    // Depth 3 case

    // Existing input normalized line which will be stored in 2+1+1+1_0B1W_5_0B0W_10612575104.js
    String line2 = "\"3|11234:0B1W|22222:0B0W|33333:1B0W|N:1024|35555:CB7,35556:BDF,35565:BEB,35566:BD9,35567:BD3,35655:BDF,35656:BD9,35657:BD4,35665:BD9,35666:BDF,35667:BD4,35675:BD3,35676:BD3,35677:BD4,35678:CA7,55355:CB7,55356:BDF,55365:BEB,55366:BD9,55367:BD3,55553:CB7,55563:BEB,55653:BDF,55663:BD9,55673:BD3,56355:BDF,56356:BD9,56357:BD4,56375:BD3,56377:BD4,56378:CA7,56553:BDF,56563:BD9,56573:BD3,56753:BD4,56773:BD4,56783:CA7.\" +\r";
    line2 = line2.replace("+","").trim(); // suppress final +, spaces, ^M in input files, as before all normalizeCheckAndStoreLine calls
    normalizeCheckAndStoreLine(line2,
                               "\"3|", // prefix
                               "11234", "0B1W", "22222", "0B0W", "33333", "1B0W",
                               "|N:1024|35555:CB7,35556:BDF,35565:BEB,35566:BD9,35567:BD3,35655:BDF,35656:BD9,35657:BD4,35665:BD9,35666:BDF,35667:BD4,35675:BD3,35676:BD3,35677:BD4,35678:CA7,55355:CB7,55356:BDF,55365:BEB,55366:BD9,55367:BD3,55553:CB7,55563:BEB,55653:BDF,55663:BD9,55673:BD3,56355:BDF,56356:BD9,56357:BD4,56375:BD3,56377:BD4,56378:CA7,56553:BDF,56563:BD9,56573:BD3,56753:BD4,56773:BD4,56783:CA7.\"", // info_str
                               false, "ABC");
    String content2 = Files.readString(Path.of(OUT_FOLDER + "2+1+1+1_0B1W_5_0B0W_10612575104.js"));
    String expected_content2 = first_line_prefix + line2 + " //ABC";
    if (!content2.equals(expected_content2)) throw new Error("test error: normalizeCheckAndStoreLine (2)");

    // Existing input normalized line which will be stored in 2+1+1+1_0B2W_5_1B0W_10612575104.js
    // Existing truncated normalized line: "3|11234:0B2W|22222:1B0W|11111:0B0W|N:2202|23353:1D1B,23355:1C40,23356:1C39,23553:1C47,23555:1CCC,23556:1C09,23563:1C2A,56352:1BEC,56372:1C7C,56523:1BFE,56723:1C75."
    // 1<->2
    // 3<->4
    String line2b = "\"3|22143:0B2W|11111:1B0W|22222:0B0W|N:2202|14454:1D1B,14455:1C40,14456:1C39,14554:1C47,14555:1CCC,14556:1C09,14564:1C2A,56451:1BEC,56471:1C7C,56514:1BFE,56714:1C75.\" +\r";
    line2b = line2b.replace("+","").trim(); // suppress final +, spaces, ^M in input files, as before all normalizeCheckAndStoreLine calls
    normalizeCheckAndStoreLine(line2b,
                               "\"3|", // prefix
                               "22143", "0B2W", "11111", "1B0W", "22222", "0B0W",
                               "|N:2202|14454:1D1B,14455:1C40,14456:1C39,14554:1C47,14555:1CCC,14556:1C09,14564:1C2A,56451:1BEC,56471:1C7C,56514:1BFE,56714:1C75.\"", // info_str
                               false, "ABCD");
    String content2b = Files.readString(Path.of(OUT_FOLDER + "2+1+1+1_0B2W_5_1B0W_10612575104.js"));
    String expected_content2b = first_line_prefix + "\"3|11234:0B2W|22222:1B0W|11111:0B0W|N:2202|23353:1D1B,23355:1C40,23356:1C39,23553:1C47,23555:1CCC,23556:1C09,23563:1C2A,56352:1BEC,56372:1C7C,56523:1BFE,56723:1C75.\"" + " //ABCD";
    if (!content2b.equals(expected_content2b)) throw new Error("test error: normalizeCheckAndStoreLine (2b)");

    // Depth 2 + 3 case
    // Existing input normalized line which will be stored in 3+1+1_1B0W_5_0B0W_16672575103.js
    // Existing truncated normalized lines:
    // - "2|11123:1B0W|22222:0B0W|N:3171|14444:2D4B,14445:2ABD,14454:2A7A,14455:29CF,14456:29D4,14544:2A8A,14545:29CD,14546:29C9,14564:29D2,14566:29E7,14567:2AC5,33333:3260,33343:2DF4,33433:2DEB,33443:2C89,33453:2BC5,34433:2C8E,34443:2CEA,34453:2AF6,34533:2BCB,34543:2AF1,34563:2B5A,44433:2D08,44443:2F7E,44453:2BF0,44533:2B00,44543:2BCF,44553:2AF1,44563:2AA9,45633:2B80,45643:2AB4,45673:2B91,11111:34B5,44444:30C6."
    // - "3|11123:1B0W|22222:0B0W|33333:0B0W|N:1875|14444:199E,14445:17BD,14454:17BD,14455:1748,14456:1776,14544:17D9,14545:1746,14546:175A,14564:175A,14566:177E,14567:1842."
    String line3a = "\"2|11123:1B0W|22222:0B0W|N:3171|14444:2D4B,14445:2ABD,14454:2A7A,14455:29CF,14456:29D4,14544:2A8A,14545:29CD,14546:29C9,14564:29D2,14566:29E7,14567:2AC5,33333:3260,33343:2DF4,33433:2DEB,33443:2C89,33453:2BC5,34433:2C8E,34443:2CEA,34453:2AF6,34533:2BCB,34543:2AF1,34563:2B5A,44433:2D08,44443:2F7E,44453:2BF0,44533:2B00,44543:2BCF,44553:2AF1,44563:2AA9,45633:2B80,45643:2AB4,45673:2B91,11111:34B5,44444:30C6.\" +\r";
    line3a = line3a.replace("+","").trim(); // suppress final +, spaces, ^M in input files, as before all normalizeCheckAndStoreLine calls
    normalizeCheckAndStoreLine(line3a,
                               "\"2|", // prefix
                               "11123", "1B0W", "22222", "0B0W", null, null,
                               "|N:3171|14444:2D4B,14445:2ABD,14454:2A7A,14455:29CF,14456:29D4,14544:2A8A,14545:29CD,14546:29C9,14564:29D2,14566:29E7,14567:2AC5,33333:3260,33343:2DF4,33433:2DEB,33443:2C89,33453:2BC5,34433:2C8E,34443:2CEA,34453:2AF6,34533:2BCB,34543:2AF1,34563:2B5A,44433:2D08,44443:2F7E,44453:2BF0,44533:2B00,44543:2BCF,44553:2AF1,44563:2AA9,45633:2B80,45643:2AB4,45673:2B91,11111:34B5,44444:30C6.\"", // info_str
                               true, null);
    String line3b = "\"3|11123:1B0W|22222:0B0W|33333:0B0W|N:1875|14444:199E,14445:17BD,14454:17BD,14455:1748,14456:1776,14544:17D9,14545:1746,14546:175A,14564:175A,14566:177E,14567:1842.\" +\r";
    line3b = line3b.replace("+","").trim(); // suppress final +, spaces, ^M in input files, as before all normalizeCheckAndStoreLine calls
    normalizeCheckAndStoreLine(line3b,
                               "\"3|", // prefix
                               "11123", "1B0W", "22222", "0B0W", "33333", "0B0W",
                               "|N:1875|14444:199E,14445:17BD,14454:17BD,14455:1748,14456:1776,14544:17D9,14545:1746,14546:175A,14564:175A,14566:177E,14567:1842.\"", // info_str
                               true, null);
    String content3 = Files.readString(Path.of(OUT_FOLDER + "3+1+1_1B0W_5_0B0W_16672575103.js"));
    String expected_content3 = first_line_prefix + line3a + "\n+" + line3b;
    if (!content3.equals(expected_content3)) throw new Error("test error: normalizeCheckAndStoreLine (3)");

    // Error cases

    boolean error_met_1 = false;
    try {
      normalizeCheckAndStoreLine(line1.replace("N:764", "N:765"),
                                "\"2|", // prefix
                                "11223", "1B1W", "34441", "1B1W", null, null,
                                "|N:764|12455:89D,12456:880,14115:8D9,14155:89D,14156:871,14552:8B3,14562:890,15145:89C,15146:875,15452:899,15462:887,21455:889,21456:865,22244:9B2,23343:92F,23453:881,24254:8C0,24333:941,24353:88C,24553:895,24563:877,25244:8CA,25343:88C,25453:88D,25463:863,31335:8DE,31355:8B7,31356:896,31555:92A,31556:8B4,31565:893,31567:886,33133:9B1,33153:8E1,33234:944,33254:895,35133:8E3,35153:8CF,35163:8A2,35234:8A8,35254:8B0,35264:87B,41111:9CA,41151:8CF,41551:8AF,41561:880,42242:9AB,42245:8C1,44252:8C1,45242:8BC,45251:8C5,45261:8B1,51145:889,51146:861,51452:88E,51462:875,52244:8CC,52343:893,52453:88D,52463:873,53245:88D,53246:86D,54125:89E,54126:88A,54235:894,54236:876,11111:A54,22222:A98,33333:A2B,44444:AD1,55555:A58.\"".replace("N:764", "N:765"), // info_str
                                true, null);
    }
    catch (Error e) {
      error_met_1 = (e.toString().contains("inconsistent lines (N:xxx)"));
    }
    if (!error_met_1) {
      throw new Error("test error: normalizeCheckAndStoreLine (error 1)");
    }

    boolean error_met_2 = false;
    try {
      normalizeCheckAndStoreLine(line1.replace("871", "872"), // same nb of perfs + same length
                                "\"2|", // prefix
                                "11223", "1B1W", "34441", "1B1W", null, null,
                                "|N:764|12455:89D,12456:880,14115:8D9,14155:89D,14156:871,14552:8B3,14562:890,15145:89C,15146:875,15452:899,15462:887,21455:889,21456:865,22244:9B2,23343:92F,23453:881,24254:8C0,24333:941,24353:88C,24553:895,24563:877,25244:8CA,25343:88C,25453:88D,25463:863,31335:8DE,31355:8B7,31356:896,31555:92A,31556:8B4,31565:893,31567:886,33133:9B1,33153:8E1,33234:944,33254:895,35133:8E3,35153:8CF,35163:8A2,35234:8A8,35254:8B0,35264:87B,41111:9CA,41151:8CF,41551:8AF,41561:880,42242:9AB,42245:8C1,44252:8C1,45242:8BC,45251:8C5,45261:8B1,51145:889,51146:861,51452:88E,51462:875,52244:8CC,52343:893,52453:88D,52463:873,53245:88D,53246:86D,54125:89E,54126:88A,54235:894,54236:876,11111:A54,22222:A98,33333:A2B,44444:AD1,55555:A58.\"".replace("871", "872"), // info_str
                                true, null);
    }
    catch (Error e) {
      error_met_2 = (e.toString().contains("inconsistent lines (pseudo signature) #1"));
    }
    if (!error_met_2) {
      throw new Error("test error: normalizeCheckAndStoreLine (error 2)");
    }

    boolean error_met_2b = false;
    try {
      normalizeCheckAndStoreLine(line1.replace("871", "8722"), // same nb of perfs + different length
                                "\"2|", // prefix
                                "11223", "1B1W", "34441", "1B1W", null, null,
                                "|N:764|12455:89D,12456:880,14115:8D9,14155:89D,14156:871,14552:8B3,14562:890,15145:89C,15146:875,15452:899,15462:887,21455:889,21456:865,22244:9B2,23343:92F,23453:881,24254:8C0,24333:941,24353:88C,24553:895,24563:877,25244:8CA,25343:88C,25453:88D,25463:863,31335:8DE,31355:8B7,31356:896,31555:92A,31556:8B4,31565:893,31567:886,33133:9B1,33153:8E1,33234:944,33254:895,35133:8E3,35153:8CF,35163:8A2,35234:8A8,35254:8B0,35264:87B,41111:9CA,41151:8CF,41551:8AF,41561:880,42242:9AB,42245:8C1,44252:8C1,45242:8BC,45251:8C5,45261:8B1,51145:889,51146:861,51452:88E,51462:875,52244:8CC,52343:893,52453:88D,52463:873,53245:88D,53246:86D,54125:89E,54126:88A,54235:894,54236:876,11111:A54,22222:A98,33333:A2B,44444:AD1,55555:A58.\"".replace("871", "8722"), // info_str
                                true, null);
    }
    catch (Error e) {
      error_met_2b = (e.toString().contains("invalid length #1"));
    }
    if (!error_met_2b) {
      throw new Error("test error: normalizeCheckAndStoreLine (error 2b)");
    }

    boolean error_met_3 = false;
    try {
      normalizeCheckAndStoreLine(line1.replace("55555:A58.", "55555:A59,55556:A60."), // different nb of perfs + no inclusion
                                "\"2|", // prefix
                                "11223", "1B1W", "34441", "1B1W", null, null,
                                "|N:764|12455:89D,12456:880,14115:8D9,14155:89D,14156:871,14552:8B3,14562:890,15145:89C,15146:875,15452:899,15462:887,21455:889,21456:865,22244:9B2,23343:92F,23453:881,24254:8C0,24333:941,24353:88C,24553:895,24563:877,25244:8CA,25343:88C,25453:88D,25463:863,31335:8DE,31355:8B7,31356:896,31555:92A,31556:8B4,31565:893,31567:886,33133:9B1,33153:8E1,33234:944,33254:895,35133:8E3,35153:8CF,35163:8A2,35234:8A8,35254:8B0,35264:87B,41111:9CA,41151:8CF,41551:8AF,41561:880,42242:9AB,42245:8C1,44252:8C1,45242:8BC,45251:8C5,45261:8B1,51145:889,51146:861,51452:88E,51462:875,52244:8CC,52343:893,52453:88D,52463:873,53245:88D,53246:86D,54125:89E,54126:88A,54235:894,54236:876,11111:A54,22222:A98,33333:A2B,44444:AD1,55555:A58.\"".replace("55555:A58.", "55555:A59,55556:A60."), // info_str
                                true, null);
    }
    catch (Error e) {
      error_met_3 = (e.toString().contains("inconsistent lines (pseudo signature) #2"));
    }
    if (!error_met_3) {
      throw new Error("test error: normalizeCheckAndStoreLine (error 3)");
    }

    boolean error_met_4 = false;
    try {
      Files.copy(Path.of(OUT_FOLDER + "2+2+1_1B1W_3+1+1_1B1W_11149944024.js"), Path.of(OUT_FOLDER + "2+2+1_1B1W_3+1+1_1B1W_111499440247.js"));
      normalizeCheckAndStoreLine(line1,
                                "\"2|", // prefix
                                "11223", "1B1W", "34441", "1B1W", null, null,
                                "|N:764|12455:89D,12456:880,14115:8D9,14155:89D,14156:871,14552:8B3,14562:890,15145:89C,15146:875,15452:899,15462:887,21455:889,21456:865,22244:9B2,23343:92F,23453:881,24254:8C0,24333:941,24353:88C,24553:895,24563:877,25244:8CA,25343:88C,25453:88D,25463:863,31335:8DE,31355:8B7,31356:896,31555:92A,31556:8B4,31565:893,31567:886,33133:9B1,33153:8E1,33234:944,33254:895,35133:8E3,35153:8CF,35163:8A2,35234:8A8,35254:8B0,35264:87B,41111:9CA,41151:8CF,41551:8AF,41561:880,42242:9AB,42245:8C1,44252:8C1,45242:8BC,45251:8C5,45261:8B1,51145:889,51146:861,51452:88E,51462:875,52244:8CC,52343:893,52453:88D,52463:873,53245:88D,53246:86D,54125:89E,54126:88A,54235:894,54236:876,11111:A54,22222:A98,33333:A2B,44444:AD1,55555:A58.\"", // info_str
                                true, null);
    }
    catch (Error e) {
      error_met_4 = (e.toString().contains("invalid count_all: 2 for line_header: \"2|11223:1B1W|34441:1B1W"));
    }
    if (!error_met_4) {
      throw new Error("test error: normalizeCheckAndStoreLine (error 4)");
    }

    // Replace >=2nd line + Depth 3 case

    normalizeCheckAndStoreLine(line3b.replace(",14567:1842.","."),
                               "\"3|", // prefix
                               "11123", "1B0W", "22222", "0B0W", "33333", "0B0W",
                               "|N:1875|14444:199E,14445:17BD,14454:17BD,14455:1748,14456:1776,14544:17D9,14545:1746,14546:175A,14564:175A,14566:177E,14567:1842.\"".replace(",14567:1842.","."), // info_str
                               true, null);
    String content3_replace1 = Files.readString(Path.of(OUT_FOLDER + "3+1+1_1B0W_5_0B0W_16672575103.js"));
    String expected_content3_replace1 = first_line_prefix + line3a + "\n+" + line3b; // no change in file as normalized_line has a lower length
    if (!content3_replace1.equals(expected_content3_replace1)) throw new Error("test error: normalizeCheckAndStoreLine (replacement #1): " + content3_replace1 + " != " + expected_content3_replace1);

    normalizeCheckAndStoreLine(line3b.replace("14567:1842.","14567:1842,14777:333."),
                               "\"3|", // prefix
                               "11123", "1B0W", "22222", "0B0W", "33333", "0B0W",
                               "|N:1875|14444:199E,14445:17BD,14454:17BD,14455:1748,14456:1776,14544:17D9,14545:1746,14546:175A,14564:175A,14566:177E,14567:1842.\"".replace("14567:1842.","14567:1842,14777:333."), // info_str
                               true, null);
    String content3_replace2 = Files.readString(Path.of(OUT_FOLDER + "3+1+1_1B0W_5_0B0W_16672575103.js"));
    String expected_content3_replace2 = first_line_prefix + line3a + "\n+" + line3b.replace("14567:1842.","14567:1842,14777:333.");
    if (!content3_replace2.equals(expected_content3_replace2)) throw new Error("test error: normalizeCheckAndStoreLine (replacement #2): " + content3_replace2 + " != " + expected_content3_replace2);

    // Replace first line + Depth 2 case

    normalizeCheckAndStoreLine(line3a.replace("33333:3260,",""),
                               "\"2|", // prefix
                               "11123", "1B0W", "22222", "0B0W", null, null,
                               "|N:3171|14444:2D4B,14445:2ABD,14454:2A7A,14455:29CF,14456:29D4,14544:2A8A,14545:29CD,14546:29C9,14564:29D2,14566:29E7,14567:2AC5,33333:3260,33343:2DF4,33433:2DEB,33443:2C89,33453:2BC5,34433:2C8E,34443:2CEA,34453:2AF6,34533:2BCB,34543:2AF1,34563:2B5A,44433:2D08,44443:2F7E,44453:2BF0,44533:2B00,44543:2BCF,44553:2AF1,44563:2AA9,45633:2B80,45643:2AB4,45673:2B91,11111:34B5,44444:30C6.\"".replace("33333:3260,",""), // info_str
                               true, "ABC");
    String content3_replace3 = Files.readString(Path.of(OUT_FOLDER + "3+1+1_1B0W_5_0B0W_16672575103.js"));
    String expected_content3_replace3 = expected_content3_replace2; // no change in file as normalized_line has a lower number of performances
    if (!content3_replace3.equals(expected_content3_replace3)) throw new Error("test error: normalizeCheckAndStoreLine (replacement #3): " + content3_replace3 + " != " + expected_content3_replace3);

    normalizeCheckAndStoreLine(line3a.replace("33333:3260,","33333:3260,33344:3262,"),
                               "\"2|", // prefix
                               "11123", "1B0W", "22222", "0B0W", null, null,
                               "|N:3171|14444:2D4B,14445:2ABD,14454:2A7A,14455:29CF,14456:29D4,14544:2A8A,14545:29CD,14546:29C9,14564:29D2,14566:29E7,14567:2AC5,33333:3260,33343:2DF4,33433:2DEB,33443:2C89,33453:2BC5,34433:2C8E,34443:2CEA,34453:2AF6,34533:2BCB,34543:2AF1,34563:2B5A,44433:2D08,44443:2F7E,44453:2BF0,44533:2B00,44543:2BCF,44553:2AF1,44563:2AA9,45633:2B80,45643:2AB4,45673:2B91,11111:34B5,44444:30C6.\"".replace("33333:3260,","33333:3260,33344:3262,"), // info_str
                               true, "ABC");
    String content3_replace4 = Files.readString(Path.of(OUT_FOLDER + "3+1+1_1B0W_5_0B0W_16672575103.js"));
    String expected_content3_replace4 = first_line_prefix + line3a.replace("33333:3260,","33333:3260,33344:3262,") + " //ABC\n+" + line3b.replace("14567:1842.","14567:1842,14777:333.");
    if (!content3_replace4.equals(expected_content3_replace4)) throw new Error("test error: normalizeCheckAndStoreLine (replacement #4): " + content3_replace4 + " != " + expected_content3_replace4);

    // Final status
    // ************

    System.out.println("\nUnit tests: OK\n");
  }

}