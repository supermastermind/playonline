import java.lang.*;
import java.io.*;
import java.util.regex.*;

/*
23175 lines with " +"
- number of lines with "1|...": 68
- number of lines with "0|...": 2
=> 23105 lines written in total [SUCCESS! (23105 out of 88522 lines)] [checkable with "ff B"]
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

  private static int table_tmp[] = new int[9];
  private static int previous_table_tmp[] = new int[9];
  private static String output_suffix = null;
  private static String determine_5_columns_code_type(String code_str, String previous_code_str) throws Exception {

  output_suffix = "";
  int totalnbcolors = 0;

  if (code_str.length() != 5) {
    throw new Error("unexpected code_str size: " + code_str.length());
  }
  for (int color = 0; color < table_tmp.length; color++) {
    table_tmp[color] = 0;
  }
  for (int column = 0; column < 5; column++) {
    int color = code_str.charAt(column) - 48;
    table_tmp[color]++;
  }
  boolean are_there_5_identical_colors = false;
  boolean are_there_4_identical_colors = false;
  boolean is_there_triple = false;
  int nb_doubles = 0;
  int one_double_color = 0;
  for (int color = 0; color < table_tmp.length; color++) {
    if (table_tmp[color] == 5) {
      are_there_5_identical_colors = true;
      break;
    }
    else if (table_tmp[color] == 4) {
      are_there_4_identical_colors = true;
      break;
    }
    else if (table_tmp[color] == 3) {
      is_there_triple = true;
    }
    else if (table_tmp[color] == 2) {
      nb_doubles++;
      one_double_color = color;
    }
  }

  if (previous_code_str != null) {
    if (previous_code_str.length() != 5) {
      throw new Error("unexpected previous_code_str size: " + previous_code_str.length());
    }
    for (int color = 0; color < previous_table_tmp.length; color++) {
      previous_table_tmp[color] = 0;
    }
    for (int column = 0; column < 5; column++) {
      int color = previous_code_str.charAt(column) - 48;
      previous_table_tmp[color]++;
    }
    for (int color = 0; color < previous_table_tmp.length; color++) {
      if ((table_tmp[color] > 0) || (previous_table_tmp[color] > 0)) {
        totalnbcolors++;
      }
    }
    if (nb_doubles == 1) { // many combinations in case of 1 double => a suffix is necessary / 1 double => this color is not equivalent to any other
       output_suffix = "_" + Integer.toString(previous_table_tmp[one_double_color]) + "X";
    }
    output_suffix = output_suffix + "_" + Integer.toString(totalnbcolors) + "Y";
  }

  if (are_there_5_identical_colors) {
    return "5C";
  }
  else if (are_there_4_identical_colors) {
    return "4+1C";
  }
  else if (is_there_triple) {
    if (nb_doubles == 0) {
      return "3+1+1C";
    }
    else if (nb_doubles == 1) {
      return "3+2C";
    }
    else {
      throw new Error("internal error: triple with several doubles");
    }
  }
  else {
    if (nb_doubles == 0) {
      return "1+1+1+1+1C";
    }
    else if (nb_doubles == 1) {
      return "2+1+1+1C";
    }
    else if (nb_doubles == 2) {
      return "2+2+1C";
    }
    else {
      throw new Error("internal error: too many doubles");
    }
  }

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

            String output_filename = "out/" + determine_5_columns_code_type(matcher.group(1), null) + "_" + matcher.group(2) + "_" + determine_5_columns_code_type(matcher.group(3), matcher.group(1)) + "_" + matcher.group(4) + output_suffix + ".js";
            File output_file = new File(output_filename);
            boolean write_prefix = false;
            if(!output_file.exists()){
              output_file.createNewFile();
              write_prefix = true;
            }
            FileWriter fw = new FileWriter(output_file, true /* (append) */);
            BufferedWriter bw = new BufferedWriter(fw);
            if (write_prefix) {
              bw.write("let extra_precalculated_str = \"\"\n");
            }
            bw.write("+" + line.replace(" +","") + "\n");
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