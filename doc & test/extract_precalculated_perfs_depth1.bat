@echo OFF

set precalc_files="1 of 5 Precalculated perfs in range 300..1300 and 3.5 seconds for 11111, 11112 and 11122 first codes.txt" "2 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11123 first code.txt" "3 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11223 first code.txt" "4 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11234 first code.txt" "5 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 12345 first code.txt"

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
