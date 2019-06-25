@echo OFF

set precalc_files="1 of 5 Precalculated perfs in range 300..1300 and 3.5 seconds for 11111, 11112 and 11122 first codes.txt" "2 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11123 first code.txt" "3 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11223 first code.txt" "4 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 11234 first code.txt" "5 of 5 Precalculated perfs in range 270..1500 and 2.7 seconds for 12345 first code.txt"

grep -h '^"1' %precalc_files%
grep -h '^"2' %precalc_files%
grep -h '^"3' %precalc_files%
grep -h '^"4' %precalc_files%
