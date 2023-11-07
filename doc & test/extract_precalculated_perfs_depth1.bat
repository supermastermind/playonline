@echo OFF

set precalc_files="STAGE2 - RESULTS_11111_270_1300_2s_plus_depth3only_270_1300_2.7sec.txt" "STAGE2 - RESULTS_11112_270_1300_2s_plus_depth3only_270_1300_4.4sec.txt" "STAGE2 - RESULTS_11122_270_1500_2s_plus_depth3only_270_1500_4.4sec.txt" "STAGE2 - RESULTS_11123_depth2_onlylogicalcodesatdepth2_270_32000_2.7s.txt" "STAGE2 - RESULTS_11223_depth2_onlylogicalcodesatdepth2_270_32000_2.7s.txt" "STAGE2 - RESULTS_11234_depth2_onlylogicalcodesatdepth2_270_32000_2.7s.txt" "STAGE2 - RESULTS_12345_depth2_onlylogicalcodesatdepth2_270_32000_2.7s.txt"
      
echo "******************** 4B0W ********************"
grep -h "4B0W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 3B2W ********************"
grep -h "3B2W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 3B1W ********************"
grep -h "3B1W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 3B0W ********************"
grep -h "3B0W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 2B3W ********************"
grep -h "2B3W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 2B2W ********************"
grep -h "2B2W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 2B1W ********************"
grep -h "2B1W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 2B0W ********************"
grep -h "2B0W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 1B4W ********************"
grep -h "1B4W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 1B3W ********************"
grep -h "1B3W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 1B2W ********************"
grep -h "1B2W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 1B1W ********************"
grep -h "1B1W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 1B0W ********************"
grep -h "1B0W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 0B5W ********************"
grep -h "0B5W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 0B4W ********************"
grep -h "0B4W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 0B3W ********************"
grep -h "0B3W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 0B2W ********************"
grep -h "0B2W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 0B1W ********************"
grep -h "0B1W" %precalc_files% | grep -v "comp" | grep '^"1'

echo "******************** 0B0W ********************"
grep -h "0B0W" %precalc_files% | grep -v "comp" | grep '^"1'
