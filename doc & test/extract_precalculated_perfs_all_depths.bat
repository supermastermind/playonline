@echo OFF

set precalc_files="STAGE2 - RESULTS_300_to_1300_3.5sec_11111 (OK).txt" "STAGE3 - 1 of 5 Precalculated perfs in range 300..1300 and 3.5 seconds for 11112 first codes.txt" "STAGE3 - RESULTS_270_to_2222_2.7sec_11122 (OK).txt" "STAGE2 - RESULTS_270_to_1700_2.7sec_11123 (OK).txt" "STAGE3 - RESULTS_270_to_2222_2.7sec_11223 (OK).txt" "STAGE2 - RESULTS_270_to_1700_2.7sec_11234 (OK).txt" "STAGE2 - RESULTS_270_to_1700_2.7sec_12345 (OK).txt"

grep -h '^"1' %precalc_files%
grep -h '^"2' %precalc_files%
grep -h '^"3' %precalc_files%
grep -h '^"4' %precalc_files%
