@echo OFF

set precalc_files="STAGE2 - RESULTS_300_to_1300_3.5sec_11111 (OK).txt" "STAGE1 - 1 of 5 Precalculated perfs in range 300..1300 and 3.5 seconds for 11112 and 11122 first codes.txt"       "STAGE2 - RESULTS_270_to_1700_2.7sec_11123 (OK).txt"       "STAGE2 - RESULTS_270_to_1700_2.7sec_11223 (OK).txt"       "STAGE2 - RESULTS_270_to_1700_2.7sec_11234 (OK).txt"       "STAGE2 - RESULTS_270_to_1700_2.7sec_12345 (OK).txt"

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
