import java.lang.*;
import java.io.*;
import java.util.regex.*;

// The goal of this program is to store all precalculated performances into plenty of small files that will be quick to load

/* Notes about final outputs:
23175 lines with " +"
- number of lines with "1|...": 68
- number of lines with "0|...": 2
= 23105 lines written in total [SUCCESS! (23105 out of 88522 lines)] [checkable with "ff B"]
*/

public class extractPrecalculatedPerfs {

  extractPrecalculatedPerfs() {}

  // ***********
  // Main method
  // ***********

  private static String[] file_table =
    {
      "1 of 5 Precalculated perfs in range 300..1300 and 3.5 seconds for 11111, 11112 and 11122 first codes.txt",
      "2 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11123 first code.txt",
      "3 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11223 first code.txt",
      "4 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11234 first code.txt",
      "5 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 12345 first code.txt"
    };

  private static int table_tmp[][] = new int[2][9]; // (9 as the highest number standing on one char)
  private static boolean are_there_5_identical_colors[] = new boolean[2];
  private static boolean are_there_4_identical_colors[] = new boolean[2];
  private static boolean is_there_triple[] = new boolean[2];
  private static int nb_doubles[] = new int[2];
  private static int one_double_color[] = new int[2];
  private static String output_str[] = new String[2];
  private static String determine_smm_jscriptname(String code_str_1, String mark_str_1, String code_str_2, String mark_str_2) throws Exception {

  // ***** CODE DUPLICATED IN SuperMasterMind.js ******

  // Handle each couple (code, mark)
  // *******************************

  for (int code_idx = 0; code_idx < 2; code_idx++) {

    String code_str;
    String mark_str;
    switch (code_idx) {
      case 0:
        code_str = code_str_1;
        mark_str = mark_str_1;
        break;
      case 1:
        code_str = code_str_2;
        mark_str = mark_str_2;
        break;
      default:
        throw new Error("determine_smm_jscriptname: internal error (code_idx)");
    }

    if (code_str.length() != 5) {
      throw new Error("determine_smm_jscriptname: invalid code_str: " + code_str);
    }
    if ((mark_str.length() != 4) || (mark_str.indexOf("B") == -1) || (mark_str.indexOf("W") == -1)) {
      throw new Error("determine_smm_jscriptname: invalid mark_str: " + mark_str);
    }

    for (int color = 0; color < table_tmp[code_idx].length; color++) {
      table_tmp[code_idx][color] = 0;
    }
    for (int column = 0; column < 5; column++) {
      int color = code_str.charAt(column) - 48;
      if ((color < 1) || (color >= 9)) {
        throw new Error("determine_smm_jscriptname: internal error (out of range color: " + color + ")");
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
        throw new Error("determine_smm_jscriptname: internal error: triple with several doubles");
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
        throw new Error("determine_smm_jscriptname: internal error: invalid number of doubles");
      }
    }
    output_str[code_idx] = output_str[code_idx] + "_" + mark_str;

  } // end for code_idx

  // Determine output filename
  // *************************

  int totalnbcolors = 0;
  for (int color = 0; color < table_tmp[0].length; color++) {
    if ((table_tmp[0][color] > 0) || (table_tmp[1][color] > 0)) {
      totalnbcolors++;
    }
  }

  String suffix = "";
  suffix = "_" + Integer.toString(totalnbcolors) + "X";
  if ((!is_there_triple[1]) && (nb_doubles[1] == 1)) { // many combinations in case of 1 double => a suffix is necessary / 1 double => this color is not equivalent to any other
    suffix = suffix + "_" +  Integer.toString(table_tmp[0][one_double_color[1]]) + "Y";
    if ((!is_there_triple[0]) && (nb_doubles[0] == 1)) { // many combinations in case of 1 double => an extra suffix is necessary
      int nb_double_intersections = 0;
      for (int column = 0; column < 5; column++) {
        int color_1 = code_str_1.charAt(column) - 48;
        if (color_1 == one_double_color[0]) {
          int color_2 = code_str_2.charAt(column) - 48;
          if (color_2 == one_double_color[1]) {
            nb_double_intersections++;
          }
        }
      }
      suffix = suffix + "_" + Integer.toString(nb_double_intersections) + "Z";
    }
  }

  // Return filename
  // ***************

  return output_str[0] + "_" + output_str[1] + suffix + ".js";

 }

  public static void main(String[] args) {
    try {

      Pattern line_pattern_depth_2_and_3 = Pattern.compile("^\"[2-3]\\|([0-9]+):(\\w+)\\|([0-9]+):(\\w+)\\|"); // "2or3|11111:2B0W|12234:0B2W|...

      int cnt = 0;
      int cnt_total = 0;
      for (int i = 0; i < file_table.length; i++) {
        System.out.println("Handling file " + file_table[i] + "...");
        File file = new File(file_table[i]);
        BufferedReader br = new BufferedReader(new FileReader(file));
        String line;
        while ((line = br.readLine()) != null) {

          cnt_total++;
          Matcher matcher = line_pattern_depth_2_and_3.matcher(line);
          if (matcher.find()) {
            int group_cnt = matcher.groupCount();
            if (group_cnt != 4) {
              throw new Error("unexpected group_cnt value: " + group_cnt);
            }
            cnt++;

            String output_filename = "out/" + determine_smm_jscriptname(matcher.group(1), matcher.group(2), matcher.group(3), matcher.group(4));
            File output_file = new File(output_filename);
            boolean write_prefix = false;
            if(!output_file.exists()){
              output_file.createNewFile();
              write_prefix = true;
            }
            FileWriter fw = new FileWriter(output_file, true /* (append) */);
            BufferedWriter bw = new BufferedWriter(fw);
            if (write_prefix) {
              bw.write("extra_precalculated_str = " + line.replace(" +","") + "\n");
            }
            else {
              bw.write("+" + line.replace(" +","") + "\n");
            }
            bw.close();
          }

        } // end while
      } // end for
      System.out.println("SUCCESS! (" + cnt + " out of " + cnt_total + " lines)");

    } catch (Exception e) {
      System.out.println("ERROR: " + e);
    }
  }

}