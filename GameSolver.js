"use strict";
try {
let emptyColor=0;
let nbMinColors=5;
let nbMaxColors=10;
let nbMinColumns=3;
let nbMaxColumns=7;
let overallNbMinAttempts=4;
let overallNbMaxAttempts=15;
let overallMaxDepth=15;
let init_done=false;
let nbColumns=-1;
let nbColors=-1;
let nbMaxAttempts=-1;
let nbMaxPossibleCodesShown=-1;
let possibleCodesShown;
let globalPerformancesShown;
let game_id=-1;
let codesPlayed;
let marks;
let codeHandler;
let initialNbPossibleCodes=-1;
let previousNbOfPossibleCodes=-1;
let nextNbOfPossibleCodes=-1;
let colorsFoundCode=-1;
let minNbColorsTable;
let maxNbColorsTable;
let nbColorsTableForMinMaxNbColors;
let nbMaxMarks=-1;
let marksTable_MarkToNb;
let marksTable_NbToMark;
let best_mark_idx;
let worst_mark_idx;
let possibleCodesAfterNAttempts;
let currentAttemptNumber=0;
let nbMaxAttemptsForEndOfGame=-1;
let message_processing_ongoing=false;
let IAmAliveMessageSent=false;
let abort_worker_process=false;
let baseOfMaxPerformanceEvaluationTime=30000;
let maxPerformanceEvaluationTime=-1;
let refNbOfCodesForSystematicEvaluation=1500;
let nbOfCodesForSystematicEvaluation=-1;
let nbOfCodesForSystematicEvaluation_ForMemAlloc=-1;
let initialNbClasses=-1;
let currentNbClasses=-1;
let possibleCodesForPerfEvaluation;
let possibleCodesForPerfEvaluation_lastIndexWritten=-1;
let mem_reduc_factor=0.90;
let maxDepth=-1;
let maxDepthApplied=-1;
let marks_optimization_mask;
let performanceListsInitDone=false;
let performanceListsInitDoneForPrecalculatedGames=false;
let arraySizeAtInit=-1;
let listOfGlobalPerformances;
let listsOfPossibleCodes;
let nbOfPossibleCodes;
let listOfClassesFirstCall;
let nbOfClassesFirstCall=-1;
let listOfEquivalentCodesAndPerformances;
let marks_already_computed_table=null;
let nbCodesLimitForEquivalentCodesCheck=40;
let PerformanceNA=-3.00;
let PerformanceUNKNOWN=-2.00;
let PerformanceMinValidValue=-1.30;
let PerformanceMaxValidValue=+1.30;
let initialInitDone=false;
let currentGame;
let currentGameSize;
let marksIdxs;
let all_permutations_table_size;
let all_permutations_table;
let current_permutations_table_size=0;
let current_permutations_table;
let minNbCodesForPrecalculation=270;
let nbCodesForPrecalculationThreshold=Math.max(refNbOfCodesForSystematicEvaluation, minNbCodesForPrecalculation);
let maxDepthForGamePrecalculation=-1;
let maxDepthForGamePrecalculation_ForMemAlloc=10;
let currentGameForGamePrecalculation=new Array(maxDepthForGamePrecalculation_ForMemAlloc);
currentGameForGamePrecalculation.fill(0);/* empty code */
let marksIdxsForGamePrecalculation=new Array(maxDepthForGamePrecalculation_ForMemAlloc);
marksIdxsForGamePrecalculation.fill(-1);
let precalculation_mode_mark={nbBlacks:0, nbWhites:0};
let precalculated_games_4columns=
"0||N:1296|1111:13C7,1112:11C8,1122:1168,1123:110C,1234:115F.";
let precalculated_games_5columns=
"0||N:32768|11111:28B03,11112:25A19,11122:24BF0,11123:24501,11223:23ED9,11234:23F55,12345:244BA.";
let dotStr=".";
let separatorStr="|";
let separator2Str=":";
let separator3Str=",";
let nbCodesPrefixStr="N:";
let precalculated_mark={nbBlacks:0, nbWhites:0};
function lookForCodeInPrecalculatedGames(code_p, current_game_size, nb_possible_codes_p) {
if (current_game_size > maxDepthForGamePrecalculation) {
throw new Error("lookForCodeInPrecalculatedGames: invalid game size: "+current_game_size);
}
let precalculated_games;
switch (nbColumns) {
case 4:
precalculated_games=precalculated_games_4columns;
break;
case 5:
precalculated_games=precalculated_games_5columns;
break;
default:
throw new Error("lookForCodeInPrecalculatedGames: invalid nbColumns value: "+nbColumns);
}
let dot_index=0;
let last_dot_index=0;
while ((dot_index=precalculated_games.indexOf(dotStr, last_dot_index))!=-1) {
let line_str=precalculated_games.substring(last_dot_index, dot_index+1);
let last_line_str_index=dot_index - last_dot_index;
let separator_index1=line_str.indexOf(separatorStr);
let depth=Number(line_str.substring(0, separator_index1));
if ((separator_index1==-1)||isNaN(depth)||(depth < 0)||(depth > maxDepthForGamePrecalculation)) {
throw new Error("lookForCodeInPrecalculatedGames: invalid depth: "+depth);
}
if (depth!=current_game_size) {
last_dot_index=dot_index+1;
continue;
}
let last_separator_index=separator_index1+1;
if (current_game_size==0) {
last_separator_index++;
}
else {
for (let i=0;i < current_game_size;i++) {
let separator_index2=line_str.indexOf(separator2Str, last_separator_index);
let code_str=line_str.substring(last_separator_index, separator_index2);
let code=codeHandler.uncompressStringToCode(code_str);
let separator_index3=line_str.indexOf(separatorStr, separator_index2+1);
let mark_str=line_str.substring(separator_index2+1, separator_index3);
codeHandler.stringToMark(mark_str, precalculated_mark);
currentGameForGamePrecalculation[i]=code;
marksIdxsForGamePrecalculation[i]=marksTable_MarkToNb[precalculated_mark.nbBlacks][precalculated_mark.nbWhites];
last_separator_index=separator_index3+1;
}
}
let areAllMarksEqual=true;
for (let i=0;i < current_game_size;i++) {
if (marksIdxs[i]!=marksIdxsForGamePrecalculation[i]) {
areAllMarksEqual=false;
break;
}
}
if (!areAllMarksEqual) {
last_dot_index=dot_index+1;
continue;
}
if (!areCodesEquivalent(0, 0, current_game_size, true, -1 /* N.A. */, currentGameForGamePrecalculation)) {
last_dot_index=dot_index+1;
continue;
}
let separator_index4=line_str.indexOf(separatorStr, last_separator_index);
let nb_possible_codes_str=line_str.substring(last_separator_index, separator_index4);
if ((separator_index4==-1)||(nb_possible_codes_str.indexOf(nbCodesPrefixStr)!=0)) {
throw new Error("lookForCodeInPrecalculatedGames: invalid number of possible codes (1): "+nb_possible_codes_str);
}
nb_possible_codes_str=nb_possible_codes_str.substring(nbCodesPrefixStr.length);
let nb_possible_codes=Number(nb_possible_codes_str);
if (isNaN(nb_possible_codes)||(nb_possible_codes <=0)||(nb_possible_codes > initialNbPossibleCodes)) {
throw new Error("lookForCodeInPrecalculatedGames: invalid number of possible codes (2): "+nb_possible_codes_str);
}
if (nb_possible_codes <=nbCodesLimitForEquivalentCodesCheck) {
throw new Error("lookForCodeInPrecalculatedGames: too low number of possible codes: "+nb_possible_codes_str);
}
if (nb_possible_codes!=nb_possible_codes_p) {
throw new Error("lookForCodeInPrecalculatedGames: invalid numbers of possible codes: "+nb_possible_codes+", "+nb_possible_codes_p);
}
let last_end_of_code_perf_pair_index=separator_index4+1;
while (true) {
let middle_of_code_perf_pair_index=line_str.indexOf(separator2Str, last_end_of_code_perf_pair_index);
if (middle_of_code_perf_pair_index==-1) {
throw new Error("lookForCodeInPrecalculatedGames: inconsistent code and perf pair: "+line_str);
}
let code_str=line_str.substring(last_end_of_code_perf_pair_index, middle_of_code_perf_pair_index);
let code=codeHandler.uncompressStringToCode(code_str);
let separator_index5=line_str.indexOf(separator3Str, middle_of_code_perf_pair_index+1);
if (separator_index5==-1) {
separator_index5=line_str.indexOf(dotStr, middle_of_code_perf_pair_index+1);
if (separator_index5!=last_line_str_index) {
throw new Error("lookForCodeInPrecalculatedGames: inconsistent end of line: "+separator_index5+", "+last_line_str_index);
}
}
let sum_str=line_str.substring(middle_of_code_perf_pair_index+1, separator_index5);
let sum=Number("0x"+sum_str);
if (isNaN(sum)||(sum <=0)) {
throw new Error("lookForCodeInPrecalculatedGames: invalid sum: "+sum_str);
}
if (areCodesEquivalent(code_p, code /* (shall be in second parameter) */, current_game_size, false, -1 /* N.A. */, currentGameForGamePrecalculation)) {
return sum;
}
if (separator_index5 >=last_line_str_index) {
break;
}
last_end_of_code_perf_pair_index=separator_index5+1;
}
last_dot_index=dot_index+1;
return 0;
}
return -1;
}
/* ********************************************************************************************************
OptimizedArrayInternalList class (used by OptimizedArrayList)
******************************************************************************************************** */
class OptimizedArrayInternalList {
constructor(granularity_p) {
this.list=new Array(granularity_p);
}
}
/* **********************************************************************************************************
OptimizedArrayList class: "ArrayList" of non-null integers optimized in terms of performances and memory.
A classical use case of this class is the handling of a memory buffer whose size is significantly flexible
(dynamic memory allocation instead of static allocation).
********************************************************************************************************** */
let nb_max_internal_lists=100;
class OptimizedArrayList {
constructor(granularity_p) {
if (granularity_p < 5*nb_max_internal_lists)  {
throw new Error("OptimizedArrayList: invalid granularity: "+granularity_p);
}
this.granularity=granularity_p;
this.nb_elements=0;
this.current_add_list_idx=0;
this.current_add_idx=0;
this.current_get_list_idx=0;
this.current_get_idx=0;
this.internal_lists=new Array(nb_max_internal_lists);
this.internal_lists[0]=new OptimizedArrayInternalList(this.granularity);
}
clear() {
this.nb_elements=0;
this.current_add_list_idx=0;
this.current_add_idx=0;
this.current_get_list_idx=0;
this.current_get_idx=0;
}
free() {
this.nb_elements=0;
this.current_add_list_idx=0;
this.current_add_idx=0;
this.current_get_list_idx=0;
this.current_get_idx=0;
for (let list_idx=0;list_idx < nb_max_internal_lists;list_idx++) {
this.internal_lists[list_idx]=null;
}
this.internal_lists=null;
}
getNbElements() {
return this.nb_elements;
}
add(value) {
this.internal_lists[this.current_add_list_idx].list[this.current_add_idx]=value;
this.nb_elements++;
if (this.current_add_idx < this.granularity-1) {
this.current_add_idx++;
}
else {
if (this.current_add_list_idx >=nb_max_internal_lists-1) {
throw new Error("OptimizedArrayList: array is full");
}
this.current_add_list_idx++;
if (this.internal_lists[this.current_add_list_idx]==null) {
this.internal_lists[this.current_add_list_idx]=new OptimizedArrayInternalList(this.granularity);
}
this.current_add_idx=0;
}
}
resetGetIterator() {
this.current_get_list_idx=0;
this.current_get_idx=0;
}
getNextElement(goToNext) {
if ( (this.current_get_list_idx < this.current_add_list_idx)
|| ( (this.current_get_list_idx==this.current_add_list_idx) && (this.current_get_idx < this.current_add_idx) ) ) {
let value=this.internal_lists[this.current_get_list_idx].list[this.current_get_idx];
if (goToNext) {
if (this.current_get_idx < this.granularity-1) {
this.current_get_idx++;
}
else {
this.current_get_list_idx++;
this.current_get_idx=0;
}
}
if (value==0) {
throw new Error("OptimizedArrayList: getNextElement inconsistency");
}
return value;
}
else {
return 0;
}
}
replaceNextElement(value_ini_p, value_p) {
if ( (value_ini_p==0)||(value_p==0) ) {
throw new Error("OptimizedArrayList: replaceNextElement: invalid parameter ("+value_ini_p+","+value_p+")");
}
if ( (this.current_get_list_idx < this.current_add_list_idx)
|| ( (this.current_get_list_idx==this.current_add_list_idx) && (this.current_get_idx < this.current_add_idx) ) ) {
let value=this.internal_lists[this.current_get_list_idx].list[this.current_get_idx];
if (value!=value_ini_p) {
throw new Error("OptimizedArrayList: replaceNextElement inconsistency ("+value+","+value_ini_p+")");
}
this.internal_lists[this.current_get_list_idx].list[this.current_get_idx]=value_p;
if (this.current_get_idx < this.granularity-1) {
this.current_get_idx++;
}
else {
this.current_get_list_idx++;
this.current_get_idx=0;
}
}
else {
throw new Error("OptimizedArrayList: replaceNextElement inconsistency");
}
}
}
class CodeHandler {
constructor(nbColumns_p, nbColors_p, nbMinColumns_p, nbMaxColumns_p, emptyColor_p) {
if ( (nbColumns_p < Math.max(nbMinColumns_p,3))||(nbColumns_p > Math.min(nbMaxColumns_p,7)) /* 3 and 7 is hardcoded in some methods of this class for better performances */ ) {
throw new Error("CodeHandler: invalid nb of columns ("+nbColumns_p+", "+nbMinColumns_p+","+nbMaxColumns_p+")");
}
if (nbColors_p < 0) {
throw new Error("CodeHandler: invalid nb of colors: ("+nbColors_p+")");
}
this.nbColumns=nbColumns_p;
this.nbColors=nbColors_p;
this.nbMaxColumns=nbMaxColumns_p;
this.emptyColor=emptyColor_p;
this.code1_colors=new Array(this.nbMaxColumns);
this.code2_colors=new Array(this.nbMaxColumns);
this.colors_int=new Array(this.nbMaxColumns);
this.different_colors=new Array(this.nbColors+1)
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
throw new Error("CodeHandler: getColor ("+column+")");
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
throw new Error("CodeHandler: setColor ("+column+")");
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
let res_code=0;
for (let col=0;col < this.nbColumns;col++) {
res_code=this.setColor(res_code, color, col+1);
}
return res_code;
}
nbDifferentColors(code) {
let sum=0;
this.different_colors.fill(0);
for (let col=0;col < this.nbColumns;col++) {
let color=this.getColor(code, col+1);
if (this.different_colors[color]==0) {
this.different_colors[color]=1;
sum=sum+1;
}
}
return sum;
}
isVerySimple(code) {
this.different_colors.fill(0);
for (let col=0;col < this.nbColumns;col++) {
let color=this.getColor(code, col+1);
this.different_colors[color]++;
}
for (let color=0;color <=this.nbColors;color++) {
if (this.different_colors[color]==this.nbColumns) {
return true;
}
else if (this.different_colors[color]==this.nbColumns - 1) {
return true;
}
}
return false;
}
codeToString(code) {
let res="[ ";
for (let col=0;col < this.nbColumns;col++) {
let color=this.getColor(code, col+1);
res=res+color+" ";
}
res=res+"]";
return res;
}
compressCodeToString(code) {
let res="";
for (let col=0;col < this.nbColumns;col++) {
let color=this.getColor(code, col+1);
res=res+color.toString(16).toUpperCase();
}
return res;
}
uncompressStringToCode(str) {
let code=0;/* empty code */
if (str.length!=this.nbColumns) {
throw new Error("CodeHandler: uncompressStringToCode (1) ("+str+")");
}
for (let col=0;col < this.nbColumns;col++) {
let color=Number("0x"+str.substring(col, col+1));
code=this.setColor(code, color, col+1);
}
if (!this.isFullAndValid(code)) {
throw new Error("CodeHandler: uncompressStringToCode (2) ("+str+")");
}
return code;
}
createRandomCode() {
let code=0;
for (let col=0;col < this.nbColumns;col++) {
code=this.setColor(code, Math.floor((Math.random() * this.nbColors)+1), col+1);
}
return code;
}
isValid(code) {
for (let col=0;col < this.nbColumns;col++) {
let color=this.getColor(code, col+1);
if ( ((color < 1)||(color > this.nbColors))
&& (color!=this.emptyColor) ) {
return false;
}
}
for (let col=this.nbColumns+1;col <=this.nbMaxColumns;col++) {
let color=this.getColor(code, col);
if (color!=this.emptyColor) {
return false;
}
}
return true;
}
isFullAndValid(code) {
for (let col=0;col < this.nbColumns;col++) {
let color=this.getColor(code, col+1);
if ( (color < 1)||(color > this.nbColors)
|| (color==this.emptyColor) ) {
return false;
}
}
for (let col=this.nbColumns+1;col <=this.nbMaxColumns;col++) {
let color=this.getColor(code, col);
if (color!=this.emptyColor) {
return false;
}
}
return true;
}
nbEmptyColors(code) {
let cnt=0;
for (let col=0;col < this.nbColumns;col++) {
if (this.getColor(code, col+1)==this.emptyColor) {
cnt++;
}
}
return cnt;
}
isEmpty(code) {
return (code==0);
}
replaceEmptyColor(code, emptyColorIdx, code2) {
let cnt=0;
for (let col=0;col < this.nbColumns;col++) {
if (this.getColor(code, col+1)==this.emptyColor) {
if (cnt==emptyColorIdx) {
return this.setColor(code, this.getColor(code2, col+1), col+1);
}
cnt++;
}
}
return code;
}
getMark(code1, code2) {
let mark={nbBlacks:0, nbWhites:0};
this.fillMark(code1, code2, mark);
return mark;
}
fillMark(code1, code2, mark) {
let marks_already_computed_table_cell;
let codeX;
let codeY;
let sum_codes=code1+code2;
let key=( (sum_codes /* (use LSBs) */
+ (sum_codes >> 9) /* (use MSBs) */
+ code1 * code2 /* (mix LSBs) */) & marks_optimization_mask );
marks_already_computed_table_cell=marks_already_computed_table[key];
codeX=marks_already_computed_table_cell.code1a;
codeY=marks_already_computed_table_cell.code2a;
if ( ((codeX==code1) && (codeY==code2))||((codeX==code2) && (codeY==code1)) ) {
mark.nbBlacks=marks_already_computed_table_cell.nbBlacksa;
mark.nbWhites=marks_already_computed_table_cell.nbWhitesa;
}
else {
codeX=marks_already_computed_table_cell.code1b;
codeY=marks_already_computed_table_cell.code2b;
if ( ((codeX==code1) && (codeY==code2))||((codeX==code2) && (codeY==code1)) ) {
mark.nbBlacks=marks_already_computed_table_cell.nbBlacksb;
mark.nbWhites=marks_already_computed_table_cell.nbWhitesb;
}
else {
codeX=marks_already_computed_table_cell.code1c;
codeY=marks_already_computed_table_cell.code2c;
if ( ((codeX==code1) && (codeY==code2))||((codeX==code2) && (codeY==code1)) ) {
mark.nbBlacks=marks_already_computed_table_cell.nbBlacksc;
mark.nbWhites=marks_already_computed_table_cell.nbWhitesc;
}
else {
let nbBlacks=0;
let nbWhites=0;
let col1, col2;
this.colors_int[0]=true;
this.colors_int[1]=true;
this.colors_int[2]=true;
this.colors_int[3]=true;
this.colors_int[4]=true;
this.colors_int[5]=true;
this.colors_int[6]=true;
this.code1_colors[0]=(code1 & 0x0000000F);
this.code1_colors[1]=((code1 >> 4) & 0x0000000F);
this.code1_colors[2]=((code1 >> 8) & 0x0000000F);
this.code1_colors[3]=((code1 >> 12) & 0x0000000F);
this.code1_colors[4]=((code1 >> 16) & 0x0000000F);
this.code1_colors[5]=((code1 >> 20) & 0x0000000F);
this.code1_colors[6]=((code1 >> 24) & 0x0000000F);
this.code2_colors[0]=(code2 & 0x0000000F);
this.code2_colors[1]=((code2 >> 4) & 0x0000000F);
this.code2_colors[2]=((code2 >> 8) & 0x0000000F);
this.code2_colors[3]=((code2 >> 12) & 0x0000000F);
this.code2_colors[4]=((code2 >> 16) & 0x0000000F);
this.code2_colors[5]=((code2 >> 20) & 0x0000000F);
this.code2_colors[6]=((code2 >> 24) & 0x0000000F);
for (col1=0;col1 < this.nbColumns;col1++) {
if (this.code1_colors[col1]==this.code2_colors[col1]) {
nbBlacks++;
}
else {
for (col2=0;col2 < this.nbColumns;col2++) {
if ((this.code1_colors[col1]==this.code2_colors[col2]) && (this.code1_colors[col2]!=this.code2_colors[col2]) && this.colors_int[col2]) {
this.colors_int[col2]=false;
nbWhites++;
break;
}
}
}
}
mark.nbBlacks=nbBlacks;
mark.nbWhites=nbWhites;
if (marks_already_computed_table_cell.write_index==0) {
marks_already_computed_table_cell.code1a=code1;
marks_already_computed_table_cell.code2a=code2;
marks_already_computed_table_cell.nbBlacksa=nbBlacks;
marks_already_computed_table_cell.nbWhitesa=nbWhites;
marks_already_computed_table_cell.write_index=1;
}
else if (marks_already_computed_table_cell.write_index==1) {
marks_already_computed_table_cell.code1b=code1;
marks_already_computed_table_cell.code2b=code2;
marks_already_computed_table_cell.nbBlacksb=nbBlacks;
marks_already_computed_table_cell.nbWhitesb=nbWhites;
marks_already_computed_table_cell.write_index=2;
}
else if (marks_already_computed_table_cell.write_index==2) {
marks_already_computed_table_cell.code1c=code1;
marks_already_computed_table_cell.code2c=code2;
marks_already_computed_table_cell.nbBlacksc=nbBlacks;
marks_already_computed_table_cell.nbWhitesc=nbWhites;
marks_already_computed_table_cell.write_index=0;
}
else {
throw new Error("CodeHandler: fillMark (wrong write_index: "+marks_already_computed_table_cell.write_index+")");
}
}
}
}
}
marksEqual(mark1, mark2) {
return ( (mark1.nbBlacks==mark2.nbBlacks) && (mark1.nbWhites==mark2.nbWhites) );
}
isMarkValid(mark) {
if ( (mark.nbBlacks >=0) && (mark.nbWhites >=0) && (mark.nbBlacks+mark.nbWhites <=this.nbColumns)
&&!((mark.nbBlacks==this.nbColumns - 1) && (mark.nbWhites==1)) ) {
return true;
}
return false;
}
markToString(mark) {
return mark.nbBlacks+"B"+mark.nbWhites+"W";
}
stringToMark(str, mark) {
if (str.length!=4) {
throw new Error("CodeHandler: stringToMark (1) ("+str+")");
}
let index_blacks=str.indexOf("B");
if (index_blacks!=1) {
throw new Error("CodeHandler: stringToMark (2) ("+str+")");
}
let index_whites=str.indexOf("W", index_blacks);
if (index_whites!=3) {
throw new Error("CodeHandler: stringToMark (3) ("+str+")");
}
mark.nbBlacks=Number(str.substring(0,1));
mark.nbWhites=Number(str.substring(2,3));
if (!codeHandler.isMarkValid(mark)) {
throw new Error("CodeHandler: stringToMark (4) ("+str+")");
}
}
}
function isAttemptPossibleinGameSolver(attempt_nb) {
if ( (attempt_nb <=0)||(attempt_nb > currentAttemptNumber) ) {
throw new Error("isAttemptPossibleinGameSolver: invalid attempt_nb "+attempt_nb+", "+currentAttemptNumber);
return 1;
}
let mark_tmp={nbBlacks:0, nbWhites:0};
for (let i=1;i <=attempt_nb-1;i++) {
codeHandler.fillMark(codesPlayed[attempt_nb-1], codesPlayed[i-1], mark_tmp);
if (!codeHandler.marksEqual(mark_tmp, marks[i-1])) {
return i;
}
}
return 0;
}
function fillShortInitialPossibleCodesTable(table, size_to_fill) {
let code_tmp=0;
let cnt=0;
if (size_to_fill > table.length) {
throw new Error("fillShortInitialPossibleCodesTable: table size is too low: "+size_to_fill+", "+table.length);
}
switch (nbColumns) {
case 3:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, emptyColor, emptyColor, emptyColor, emptyColor);
table[cnt]=code_tmp;
cnt++;
if (cnt >=size_to_fill) return cnt;
}
}
}
break;
case 4:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, emptyColor, emptyColor, emptyColor);
table[cnt]=code_tmp;
cnt++;
if (cnt >=size_to_fill) return cnt;
}
}
}
}
break;
case 5:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
for (let color5=1;color5 <=nbColors;color5++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, color5, emptyColor, emptyColor);
table[cnt]=code_tmp;
cnt++;
if (cnt >=size_to_fill) return cnt;
}
}
}
}
}
break;
case 6:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
for (let color5=1;color5 <=nbColors;color5++) {
for (let color6=1;color6 <=nbColors;color6++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, emptyColor);
table[cnt]=code_tmp;
cnt++;
if (cnt >=size_to_fill) return cnt;
}
}
}
}
}
}
break;
case 7:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
for (let color5=1;color5 <=nbColors;color5++) {
for (let color6=1;color6 <=nbColors;color6++) {
for (let color7=1;color7 <=nbColors;color7++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, color7);
table[cnt]=code_tmp;
cnt++;
if (cnt >=size_to_fill) return cnt;
}
}
}
}
}
}
}
break;
default:
throw new Error("fillShortInitialPossibleCodesTable: invalid nbColumns value: "+nbColumns);
}
throw new Error("fillShortInitialPossibleCodesTable: internal error (cnt value: "+cnt+")");
}
function updateNbColorsTables(code) {
if (!codeHandler.isEmpty(colorsFoundCode)) {
for (let column=0;column < nbColumns;column++) {
let color=codeHandler.getColor(colorsFoundCode, column+1);
if (color==emptyColor) {
continue;
}
let color2=codeHandler.getColor(code, column+1);
if (color==nbColors+1) {
colorsFoundCode=codeHandler.setColor(colorsFoundCode, color2, column+1);
}
else if (color!=color2) {
colorsFoundCode=codeHandler.setColor(colorsFoundCode, emptyColor, column+1);
}
}
}
let sum=0;
for (let color=1;color <=nbColors;color++) {
let nb_colors_tmp=nbColorsTableForMinMaxNbColors[color];
sum +=nb_colors_tmp;
minNbColorsTable[color]=Math.min(nb_colors_tmp, minNbColorsTable[color]);
maxNbColorsTable[color]=Math.max(nb_colors_tmp, maxNbColorsTable[color]);
}
if (sum!=nbColumns) {
throw new Error("updateNbColorsTables() error: "+sum);
}
}
let last_attempt_nb=1;
function computeNbOfPossibleCodes(attempt_nb, nb_codes_max_listed, possibleCodes_p) {
if ( (attempt_nb < 2)||(attempt_nb!=last_attempt_nb+1)||(nb_codes_max_listed <=0) ) {
throw new Error("computeNbOfPossibleCodes: invalid parameters ("+attempt_nb+","+last_attempt_nb+","+nb_codes_max_listed+")");
}
if (nb_codes_max_listed > possibleCodes_p.length) {
throw new Error("computeNbOfPossibleCodes: table size is too low: "+nb_codes_max_listed+", "+possibleCodes_p.length);
}
last_attempt_nb++;
colorsFoundCode=codeHandler.setAllColorsIdentical(nbColors+1);
for (let color=1;color <=nbColors;color++) {
minNbColorsTable[color]=nbColumns;
maxNbColorsTable[color]=0;
}
let N;
if (nbColumns >=7) {
N=5;
}
else {
N=2;
}
if (attempt_nb <=N) {
if (possibleCodesAfterNAttempts.getNbElements()!=0) {
throw new Error("computeNbOfPossibleCodes: internal error ("+possibleCodesAfterNAttempts.getNbElements()+")");
}
let code_tmp=0;
let mark_tmp={nbBlacks:0, nbWhites:0};
let cnt=0;
switch (nbColumns) {
case 3:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, emptyColor, emptyColor, emptyColor, emptyColor);
let isPossible=true;
for (let attempt_idx=0;attempt_idx < attempt_nb-1;attempt_idx++) {
codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
isPossible=false;
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
possibleCodes_p[cnt]=code_tmp;
}
cnt++;
if (attempt_nb==N) {
possibleCodesAfterNAttempts.add(code_tmp);
}
}
}
}
}
break;
case 4:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, emptyColor, emptyColor, emptyColor);
let isPossible=true;
for (let attempt_idx=0;attempt_idx < attempt_nb-1;attempt_idx++) {
codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
isPossible=false;
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
possibleCodes_p[cnt]=code_tmp;
}
cnt++;
if (attempt_nb==N) {
possibleCodesAfterNAttempts.add(code_tmp);
}
}
}
}
}
}
break;
case 5:
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
for (let color5=1;color5 <=nbColors;color5++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, color5, emptyColor, emptyColor);
let isPossible=true;
for (let attempt_idx=0;attempt_idx < attempt_nb-1;attempt_idx++) {
codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
isPossible=false;
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
possibleCodes_p[cnt]=code_tmp;
}
cnt++;
if (attempt_nb==N) {
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
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
for (let color5=1;color5 <=nbColors;color5++) {
for (let color6=1;color6 <=nbColors;color6++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, emptyColor);
let isPossible=true;
for (let attempt_idx=0;attempt_idx < attempt_nb-1;attempt_idx++) {
codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
isPossible=false;
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
possibleCodes_p[cnt]=code_tmp;
}
cnt++;
if (attempt_nb==N) {
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
let mark0_nb_pegs=marks[0].nbBlacks+marks[0].nbWhites;
let mark1_nb_pegs=-1;
if (attempt_nb==3) {
mark1_nb_pegs=marks[1].nbBlacks+marks[1].nbWhites;
}
for (let color1=1;color1 <=nbColors;color1++) {
for (let color2=1;color2 <=nbColors;color2++) {
for (let color3=1;color3 <=nbColors;color3++) {
for (let color4=1;color4 <=nbColors;color4++) {
for (let color5=1;color5 <=nbColors;color5++) {
for (let color6=1;color6 <=nbColors;color6++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, emptyColor);
codeHandler.fillMark(codesPlayed[0], code_tmp, mark_tmp);
let mark_tmp_nb_pegs=mark_tmp.nbBlacks+mark_tmp.nbWhites;
if ( (mark_tmp_nb_pegs > mark0_nb_pegs)
|| (mark_tmp_nb_pegs < mark0_nb_pegs - 1)
|| (mark_tmp.nbBlacks > marks[0].nbBlacks)
|| (mark_tmp.nbBlacks < marks[0].nbBlacks - 1) ) {
continue;
}
if (mark1_nb_pegs!=-1) {
codeHandler.fillMark(codesPlayed[1], code_tmp, mark_tmp);
let mark_tmp_nb_pegs=mark_tmp.nbBlacks+mark_tmp.nbWhites;
if ( (mark_tmp_nb_pegs > mark1_nb_pegs)
|| (mark_tmp_nb_pegs < mark1_nb_pegs - 1)
|| (mark_tmp.nbBlacks > marks[1].nbBlacks)
|| (mark_tmp.nbBlacks < marks[1].nbBlacks - 1) ) {
continue;
}
}
for (let color7=1;color7 <=nbColors;color7++) {
code_tmp=codeHandler.setAllColors(color1, color2, color3, color4, color5, color6, color7);
let isPossible=true;
for (let attempt_idx=0;attempt_idx < attempt_nb-1;attempt_idx++) {
codeHandler.fillMark(codesPlayed[attempt_idx], code_tmp, mark_tmp);
if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
isPossible=false;
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
possibleCodes_p[cnt]=code_tmp;
}
cnt++;
if (attempt_nb==N) {
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
throw new Error("computeNbOfPossibleCodes: invalid nbColumns value: "+nbColumns);
}
if ( (cnt <=0)||(cnt > initialNbPossibleCodes)
|| ( (attempt_nb==1) && (cnt!=initialNbPossibleCodes) )
|| ( (attempt_nb < N) && (possibleCodesAfterNAttempts.getNbElements()!=0) )
|| ( (attempt_nb==N) && (cnt!=possibleCodesAfterNAttempts.getNbElements()) ) ) {
throw new Error("computeNbOfPossibleCodes: invalid cnt values ("+cnt+","+attempt_nb+","+possibleCodesAfterNAttempts.getNbElements()+")");
}
return cnt;
}
else {
let code_possible_after_N_attempts;
let code_possible_after_N_attempts_bis;
let mark_tmp={nbBlacks:0, nbWhites:0};
let cnt=0;
let cnt_global=0;
possibleCodesAfterNAttempts.resetGetIterator();
do {
code_possible_after_N_attempts=possibleCodesAfterNAttempts.getNextElement(false /* (do not make the iteration) */);
if (code_possible_after_N_attempts==0) {
break;
}
cnt_global++;
let isPossible;
if (code_possible_after_N_attempts!=-1) {
isPossible=true;
for (let attempt_idx=0;attempt_idx < attempt_nb-1;attempt_idx++) {
codeHandler.fillMark(codesPlayed[attempt_idx], code_possible_after_N_attempts, mark_tmp);
if (!codeHandler.marksEqual(marks[attempt_idx], mark_tmp)) {
isPossible=false;
break;
}
}
}
else {
isPossible=false;
}
if (isPossible) {
code_possible_after_N_attempts_bis=possibleCodesAfterNAttempts.getNextElement(true /* (make the iteration) */);
if (code_possible_after_N_attempts!=code_possible_after_N_attempts_bis) {
throw new Error("computeNbOfPossibleCodes: iteration inconsistency ("+code_possible_after_N_attempts+","+code_possible_after_N_attempts_bis+")");
}
nbColorsTableForMinMaxNbColors.fill(0);
for (let column=0;column < nbColumns;column++) {
nbColorsTableForMinMaxNbColors[codeHandler.getColor(code_possible_after_N_attempts, column+1)]++;
}
updateNbColorsTables(code_possible_after_N_attempts);
if (cnt < nb_codes_max_listed) {
possibleCodes_p[cnt]=code_possible_after_N_attempts;
}
cnt++;
}
else {
possibleCodesAfterNAttempts.replaceNextElement(code_possible_after_N_attempts, -1);
}
} while (true);
if ( (cnt <=0)||(cnt > initialNbPossibleCodes)
|| ( (attempt_nb==1) && (cnt!=initialNbPossibleCodes) )
|| (cnt_global!=possibleCodesAfterNAttempts.getNbElements()) ) {
throw new Error("computeNbOfPossibleCodes: invalid cnt/cnt_global values ("+cnt+","+cnt_global+","+possibleCodesAfterNAttempts.getNbElements()+")");
}
return cnt;
}
}
function generateAllPermutations() {
all_permutations_table_size=new Array(nbMaxColumns+1);
all_permutations_table_size.fill(0);
all_permutations_table_size[3]=3*2;
all_permutations_table_size[4]=4*3*2;
all_permutations_table_size[5]=5*4*3*2;
all_permutations_table_size[6]=6*5*4*3*2;
all_permutations_table_size[7]=7*6*5*4*3*2;
if (all_permutations_table_size[nbColumns] <=0) {
throw new Error("generateAllPermutations / error while computing all_permutations_table_size: "+nbColumns);
}
all_permutations_table=new Array(nbMaxColumns+1);
for (let nb_elts=nbMinColumns;nb_elts <=nbMaxColumns;nb_elts++) {
if (all_permutations_table_size[nb_elts] > 0) {
all_permutations_table[nb_elts]=new Array(all_permutations_table_size[nb_elts]);
}
}
let NB_ELEMENTS;
let indexes=new Array(nbMaxColumns);
let permutation_cnt=0;
switch (nbColumns) {
case 3:
NB_ELEMENTS=3;
for (indexes[0]=0;indexes[0] < NB_ELEMENTS;indexes[0]++) {
for (indexes[1]=0;indexes[1] < NB_ELEMENTS;indexes[1]++) {
for (indexes[2]=0;indexes[2] < NB_ELEMENTS;indexes[2]++) {
let is_a_permutation=true;
for (let idx1=0;(idx1 < NB_ELEMENTS) && is_a_permutation;idx1++) {
for (let idx2=0;idx2 < NB_ELEMENTS;idx2++) {
if ((idx1!=idx2) && (indexes[idx1]==indexes[idx2])) {
is_a_permutation=false;
break;
}
}
}
if (is_a_permutation) {
all_permutations_table[NB_ELEMENTS][permutation_cnt]=[indexes[0], indexes[1], indexes[2]];
permutation_cnt++;
}
}
}
}
if (permutation_cnt!=all_permutations_table_size[NB_ELEMENTS]) {
throw new Error("generateAllPermutations / error while computing "+NB_ELEMENTS+"-elements permutations!");
}
break;
case 4:
NB_ELEMENTS=4;
for (indexes[0]=0;indexes[0] < NB_ELEMENTS;indexes[0]++) {
for (indexes[1]=0;indexes[1] < NB_ELEMENTS;indexes[1]++) {
for (indexes[2]=0;indexes[2] < NB_ELEMENTS;indexes[2]++) {
for (indexes[3]=0;indexes[3] < NB_ELEMENTS;indexes[3]++) {
let is_a_permutation=true;
for (let idx1=0;(idx1 < NB_ELEMENTS) && is_a_permutation;idx1++) {
for (let idx2=0;idx2 < NB_ELEMENTS;idx2++) {
if ((idx1!=idx2) && (indexes[idx1]==indexes[idx2])) {
is_a_permutation=false;
break;
}
}
}
if (is_a_permutation) {
all_permutations_table[NB_ELEMENTS][permutation_cnt]=[indexes[0], indexes[1], indexes[2], indexes[3]];
permutation_cnt++;
}
}
}
}
}
if (permutation_cnt!=all_permutations_table_size[NB_ELEMENTS]) {
throw new Error("generateAllPermutations / error while computing "+NB_ELEMENTS+"-elements permutations!");
}
break;
case 5:
NB_ELEMENTS=5;
for (indexes[0]=0;indexes[0] < NB_ELEMENTS;indexes[0]++) {
for (indexes[1]=0;indexes[1] < NB_ELEMENTS;indexes[1]++) {
for (indexes[2]=0;indexes[2] < NB_ELEMENTS;indexes[2]++) {
for (indexes[3]=0;indexes[3] < NB_ELEMENTS;indexes[3]++) {
for (indexes[4]=0;indexes[4] < NB_ELEMENTS;indexes[4]++) {
let is_a_permutation=true;
for (let idx1=0;(idx1 < NB_ELEMENTS) && is_a_permutation;idx1++) {
for (let idx2=0;idx2 < NB_ELEMENTS;idx2++) {
if ((idx1!=idx2) && (indexes[idx1]==indexes[idx2])) {
is_a_permutation=false;
break;
}
}
}
if (is_a_permutation) {
all_permutations_table[NB_ELEMENTS][permutation_cnt]=[indexes[0], indexes[1], indexes[2], indexes[3], indexes[4]];
permutation_cnt++;
}
}
}
}
}
}
if (permutation_cnt!=all_permutations_table_size[NB_ELEMENTS]) {
throw new Error("generateAllPermutations / error while computing "+NB_ELEMENTS+"-elements permutations!");
}
break;
case 6:
NB_ELEMENTS=6;
for (indexes[0]=0;indexes[0] < NB_ELEMENTS;indexes[0]++) {
for (indexes[1]=0;indexes[1] < NB_ELEMENTS;indexes[1]++) {
for (indexes[2]=0;indexes[2] < NB_ELEMENTS;indexes[2]++) {
for (indexes[3]=0;indexes[3] < NB_ELEMENTS;indexes[3]++) {
for (indexes[4]=0;indexes[4] < NB_ELEMENTS;indexes[4]++) {
for (indexes[5]=0;indexes[5] < NB_ELEMENTS;indexes[5]++) {
let is_a_permutation=true;
for (let idx1=0;(idx1 < NB_ELEMENTS) && is_a_permutation;idx1++) {
for (let idx2=0;idx2 < NB_ELEMENTS;idx2++) {
if ((idx1!=idx2) && (indexes[idx1]==indexes[idx2])) {
is_a_permutation=false;
break;
}
}
}
if (is_a_permutation) {
all_permutations_table[NB_ELEMENTS][permutation_cnt]=[indexes[0], indexes[1], indexes[2], indexes[3], indexes[4], indexes[5]];
permutation_cnt++;
}
}
}
}
}
}
}
if (permutation_cnt!=all_permutations_table_size[NB_ELEMENTS]) {
throw new Error("generateAllPermutations / error while computing "+NB_ELEMENTS+"-elements permutations!");
}
break;
case 7:
NB_ELEMENTS=7;
for (indexes[0]=0;indexes[0] < NB_ELEMENTS;indexes[0]++) {
for (indexes[1]=0;indexes[1] < NB_ELEMENTS;indexes[1]++) {
for (indexes[2]=0;indexes[2] < NB_ELEMENTS;indexes[2]++) {
for (indexes[3]=0;indexes[3] < NB_ELEMENTS;indexes[3]++) {
for (indexes[4]=0;indexes[4] < NB_ELEMENTS;indexes[4]++) {
for (indexes[5]=0;indexes[5] < NB_ELEMENTS;indexes[5]++) {
for (indexes[6]=0;indexes[6] < NB_ELEMENTS;indexes[6]++) {
let is_a_permutation=true;
for (let idx1=0;(idx1 < NB_ELEMENTS) && is_a_permutation;idx1++) {
for (let idx2=0;idx2 < NB_ELEMENTS;idx2++) {
if ((idx1!=idx2) && (indexes[idx1]==indexes[idx2])) {
is_a_permutation=false;
break;
}
}
}
if (is_a_permutation) {
all_permutations_table[NB_ELEMENTS][permutation_cnt]=[indexes[0], indexes[1], indexes[2], indexes[3], indexes[4], indexes[5], indexes[6]];
permutation_cnt++;
}
}
}
}
}
}
}
}
if (permutation_cnt!=all_permutations_table_size[NB_ELEMENTS]) {
throw new Error("generateAllPermutations / error while computing "+NB_ELEMENTS+"-elements permutations!");
}
break;
default:
throw new Error("generateAllPermutations / invalid nbColumns: "+nbColumns);
}
if ( (all_permutations_table_size.length!=nbMaxColumns+1)||(permutation_cnt!=all_permutations_table_size[nbColumns]) ) {
throw new Error("generateAllPermutations / internal error");
}
current_permutations_table_size=new Array(overallNbMaxAttempts+overallMaxDepth);
current_permutations_table_size[0]=all_permutations_table_size[nbColumns];
current_permutations_table=new2DArray(overallNbMaxAttempts+overallMaxDepth, current_permutations_table_size[0]);
for (let i=0;i < current_permutations_table_size[0];i++) {
current_permutations_table[0][i]=i;
}
}
function new2DArray(x, y) {
var my_array=new Array(x);
for (let i=0;i < x;i++) {
my_array[i]=new Array(y);
}
return my_array;
}
function check2DArraySizes(my_array, x, y) {
if (my_array.length!=x) {
console.log("check2DArraySizes/0: "+my_array.length+"!="+x);
return false;
}
for (let i=0;i < my_array.length;i++) {
if (my_array[i].length!=y) {
console.log("check2DArraySizes/1("+i+"): "+my_array[i].length+"!="+y);
return false;
}
}
return true;
}
function new3DArray(x, y, z, reduc) {
var my_array=new Array(x);
var reduced_z=z;
for (let i=0;i < x;i++) {
my_array[i]=new2DArray(y, reduced_z);
reduced_z=Math.ceil(reduced_z * reduc);
}
return my_array;
}
function check3DArraySizes(my_array, x, y, z, reduc) {
if (my_array.length!=x) {
console.log("check3DArraySizes/0: "+my_array.length+"!="+x);
return false;
}
var reduced_z=z;
for (let i=0;i < my_array.length;i++) {
if (!check2DArraySizes(my_array[i], y, reduced_z)) {
return false;
}
reduced_z=Math.ceil(reduced_z * reduc);
}
return true;
}
function spaces(nb) {
let str="";
for (let i=-1;i < nb;i++) {
str=str+"  ";
}
return str;
}
function print_permutation_list(list, list_size) {
let str="";
for (let i=0;i < list_size;i++) {
str=str+all_permutations_table[nbColumns][list[i]]+" | ";
}
str="{"+str.trim()+"}";
return str;
}
function str_from_list_of_codes(list, list_size) {
let str="";
for (let i=0;i < list_size;i++) {
str=str+codeHandler.codeToString(list[i])+" ";
}
str="{"+str.trim()+"}";
return str;
}
function compressed_str_from_lists_of_codes_and_markidxs(code_list, mark_idx_list, list_size) {
if (list_size==0) {
return "";
}
else {
let str="";
for (let i=0;i < list_size-1;i++) {
str=str+codeHandler.compressCodeToString(code_list[i])+":"+codeHandler.markToString(marksTable_NbToMark[mark_idx_list[i]])+"|";
}
str=str+codeHandler.compressCodeToString(code_list[list_size-1])+":"+codeHandler.markToString(marksTable_NbToMark[mark_idx_list[list_size-1]]);
return str;
}
}
function send_trace_msg(trace_str) {
self.postMessage({'rsp_type': 'TRACE', 'trace_contents': trace_str});
}
let code_colors=new Array(nbMaxColumns);
let other_code_colors=new Array(nbMaxColumns);
let different_colors_1=new Array(nbMaxColors+1);
let different_colors_2=new Array(nbMaxColors+1);
let current_game_code_colors=new2DArray(overallNbMaxAttempts+overallMaxDepth, nbMaxColumns);
let other_game_code_colors=new2DArray(overallNbMaxAttempts+overallMaxDepth, nbMaxColumns);
let permuted_other_code_colors=new Array(nbMaxColumns);
let partial_bijection=new Array(nbMaxColors+1);
function areCodesEquivalent(code, other_code, current_game_size, assess_current_game_only, forceGlobalPermIdx /* -1 if N.A. */, otherGame /* null if N.A. */) {
let all_permutations=all_permutations_table[nbColumns];
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
if (!assess_current_game_only) {
code_colors[0]=(code & 0x0000000F);
code_colors[1]=((code >> 4) & 0x0000000F);
code_colors[2]=((code >> 8) & 0x0000000F);
code_colors[3]=((code >> 12) & 0x0000000F);
code_colors[4]=((code >> 16) & 0x0000000F);
code_colors[5]=((code >> 20) & 0x0000000F);
code_colors[6]=((code >> 24) & 0x0000000F);
other_code_colors[0]=(other_code & 0x0000000F);
other_code_colors[1]=((other_code >> 4) & 0x0000000F);
other_code_colors[2]=((other_code >> 8) & 0x0000000F);
other_code_colors[3]=((other_code >> 12) & 0x0000000F);
other_code_colors[4]=((other_code >> 16) & 0x0000000F);
other_code_colors[5]=((other_code >> 20) & 0x0000000F);
other_code_colors[6]=((other_code >> 24) & 0x0000000F);
let sum_1=0;
let sum_2=0;
different_colors_1.fill(0);
different_colors_2.fill(0);
for (col=0;col < nbColumns;col++) {
let color_1=code_colors[col];
let color_2=other_code_colors[col];
if (different_colors_1[color_1]==0) {
different_colors_1[color_1]=1;
sum_1=sum_1+1;
}
if (different_colors_2[color_2]==0) {
different_colors_2[color_2]=1;
sum_2=sum_2+1;
}
}
if (sum_1==sum_2) {
if (current_game_size==0) {
if (sum_1==nbColumns-1) {
return true;
}
if (sum_1==nbColumns) {
return true;
}
}
}
else {
return false;
}
}
for (current_game_depth=0;current_game_depth < current_game_size;current_game_depth++) {
current_game_code=currentGame[current_game_depth]
current_game_code_colors_set=current_game_code_colors[current_game_depth];
current_game_code_colors_set[0]=(current_game_code & 0x0000000F);
current_game_code_colors_set[1]=((current_game_code >> 4) & 0x0000000F);
current_game_code_colors_set[2]=((current_game_code >> 8) & 0x0000000F);
current_game_code_colors_set[3]=((current_game_code >> 12) & 0x0000000F);
current_game_code_colors_set[4]=((current_game_code >> 16) & 0x0000000F);
current_game_code_colors_set[5]=((current_game_code >> 20) & 0x0000000F);
current_game_code_colors_set[6]=((current_game_code >> 24) & 0x0000000F);
}
if (otherGame!=null) {
for (current_game_depth=0;current_game_depth < current_game_size;current_game_depth++) {
other_game_code=otherGame[current_game_depth]
other_game_code_colors_set=other_game_code_colors[current_game_depth];
other_game_code_colors_set[0]=(other_game_code & 0x0000000F);
other_game_code_colors_set[1]=((other_game_code >> 4) & 0x0000000F);
other_game_code_colors_set[2]=((other_game_code >> 8) & 0x0000000F);
other_game_code_colors_set[3]=((other_game_code >> 12) & 0x0000000F);
other_game_code_colors_set[4]=((other_game_code >> 16) & 0x0000000F);
other_game_code_colors_set[5]=((other_game_code >> 20) & 0x0000000F);
other_game_code_colors_set[6]=((other_game_code >> 24) & 0x0000000F);
}
}
let permLoopStartIdx=0;
let permLoopStopIdx;
if (forceGlobalPermIdx!=-1) {
if ((forceGlobalPermIdx < 0)||(forceGlobalPermIdx >=all_permutations_table_size[nbColumns])) {
throw new Error("areCodesEquivalent: invalid forceGlobalPermIdx: "+forceGlobalPermIdx);
}
permLoopStopIdx=1;
}
else if (otherGame==null) {
permLoopStopIdx=current_permutations_table_size[current_game_size];
}
else {
permLoopStopIdx=current_permutations_table_size[0];
}
if (permLoopStopIdx <=permLoopStartIdx) {
throw new Error("areCodesEquivalent: no permutation");
}
for (perm_idx=permLoopStartIdx;perm_idx < permLoopStopIdx;perm_idx++) {
if (forceGlobalPermIdx!=-1) {
global_perm_idx=forceGlobalPermIdx;
}
else if (otherGame==null) {
global_perm_idx=current_permutations_table[current_game_size][perm_idx];
}
else {
global_perm_idx=current_permutations_table[0][perm_idx];
}
bijection_is_possible_for_this_permutation=true;
partial_bijection.fill(0);
if (!assess_current_game_only) {
for (col=0;col < nbColumns;col++) {
permuted_other_code_colors[all_permutations[global_perm_idx][col]]=other_code_colors[col];
}
for (col=0;col < nbColumns;col++) {
source_color=code_colors[col];
old_target_color=partial_bijection[source_color];
new_target_color=permuted_other_code_colors[col];
if ((old_target_color!=0) && (old_target_color!=new_target_color)) {
bijection_is_possible_for_this_permutation=false;
break;
}
for (color=1;color <=nbColors;color++) {
if ((color!=source_color) && (partial_bijection[color]==new_target_color)) {
bijection_is_possible_for_this_permutation=false;
break;
}
}
if (!bijection_is_possible_for_this_permutation) {
break;
}
/* if (partial_bijection[source_color]!=new_target_color) {
console.log(source_color+" -> "+new_target_color);
} */
partial_bijection[source_color]=new_target_color;
}
}
if (bijection_is_possible_for_this_permutation) {
for (current_game_depth=current_game_size-1;current_game_depth >=0;current_game_depth--) {
current_game_code_colors_set=current_game_code_colors[current_game_depth];
if (otherGame==null) {
other_game_code_colors_set=current_game_code_colors_set;
}
else {
other_game_code_colors_set=other_game_code_colors[current_game_depth];
}
for (col=0;col < nbColumns;col++) {
permuted_other_code_colors[all_permutations[global_perm_idx][col]]=other_game_code_colors_set[col];
}
for (col=0;col < nbColumns;col++) {
source_color=current_game_code_colors_set[col];
old_target_color=partial_bijection[source_color];
new_target_color=permuted_other_code_colors[col];
if ((old_target_color!=0) && (old_target_color!=new_target_color)) {
bijection_is_possible_for_this_permutation=false;
break;
}
for (color=1;color <=nbColors;color++) {
if ((color!=source_color) && (partial_bijection[color]==new_target_color)) {
bijection_is_possible_for_this_permutation=false;
break;
}
}
if (!bijection_is_possible_for_this_permutation) {
break;
}
/* if (partial_bijection[source_color]!=new_target_color) {
console.log(source_color+" -> "+new_target_color);
} */
partial_bijection[source_color]=new_target_color;
}
}
}
if (bijection_is_possible_for_this_permutation) {
return true;
}
}
return false;
}
let evaluatePerformancesStartTime;
let mark_perf_tmp={nbBlacks:-1, nbWhites:-1};
let mark_perf_tmpa={nbBlacks:-1, nbWhites:-1};
let mark_perf_tmpb={nbBlacks:-1, nbWhites:-1};
let mark_perf_tmpc={nbBlacks:-1, nbWhites:-1};
let mark_perf_tmpd={nbBlacks:-1, nbWhites:-1};
let mark_perf_tmpe={nbBlacks:-1, nbWhites:-1};
let mark_perf_tmpf={nbBlacks:-1, nbWhites:-1};
let code1_colors=new Array(nbMaxColumns);
let code2_colors=new Array(nbMaxColumns);
let colors_int=new Array(nbMaxColumns);
let particularCodeToAssess=0;/* empty code */
let particularCodeGlobalPerformance=PerformanceNA;
let recursiveEvaluatePerformancesWasAborted=false;
let areCurrentGameOrCodePrecalculated=-1;
function evaluatePerformances(depth, listOfCodes, nbCodes, particularCode, areCurrentGameOrCodePrecalculated_p) {
let idx;
let res;
evaluatePerformancesStartTime=new Date().getTime();
if ((best_mark_idx!=marksTable_MarkToNb[nbColumns][0])||(best_mark_idx >=nbMaxMarks)) {
throw new Error("evaluatePerformances: invalid best_mark_idx");
}
if ((worst_mark_idx!=marksTable_MarkToNb[0][0])||(worst_mark_idx >=nbMaxMarks)) {
throw new Error("evaluatePerformances: invalid worst_mark_idx");
}
if (currentAttemptNumber <=0) {
throw new Error("evaluatePerformances: invalid currentAttemptNumber: "+currentAttemptNumber);
}
if ((nbCodes < 1)||(listOfCodes.length < nbCodes)) {
throw new Error("evaluatePerformances: invalid number of codes: "+nbCodes+", "+listOfCodes.length);
}
areCurrentGameOrCodePrecalculated=areCurrentGameOrCodePrecalculated_p;
if (depth==-1) {
if (currentGameSize!=currentAttemptNumber-1) {
throw new Error("evaluatePerformances: invalid currentGameSize");
}
for (idx=0;idx < currentGameSize;idx++) {
if ( (currentGame[idx]!=codesPlayed[idx])||(!codeHandler.isFullAndValid(currentGame[idx])) ) {
throw new Error("evaluatePerformances: invalid current game ("+idx+")");
}
if ( (!codeHandler.marksEqual(marksTable_NbToMark[marksIdxs[idx]], marks[idx]))||(!codeHandler.isMarkValid(marksTable_NbToMark[marksIdxs[idx]])) )  {
throw new Error("evaluatePerformances: invalid current marks ("+idx+")");
}
}
listOfClassesFirstCall.fill(0);
nbOfClassesFirstCall=0;
for (let idx1=0;idx1 < nbCodes;idx1++) {
let current_code=listOfCodes[idx1];
let equiv_code_found=false;
for (let idx2=0;idx2 < nbOfClassesFirstCall;idx2++) {
let known_code=listOfClassesFirstCall[idx2];
if (areCodesEquivalent(current_code, known_code, currentGameSize, false, -1 /* N.A. */, null)) {
equiv_code_found=true;
break;
}
}
if (!equiv_code_found) {
listOfClassesFirstCall[nbOfClassesFirstCall]=current_code;
nbOfClassesFirstCall++;
}
}
currentNbClasses=nbOfClassesFirstCall;
if ( (currentNbClasses <=0)||(currentNbClasses > nbCodes)
|| ((currentGameSize==0) && (currentNbClasses!=initialNbClasses)) ) {
throw new Error("evaluatePerformances: invalid currentNbClasses: "+currentNbClasses);
}
for (let idx1=0;idx1 < listOfEquivalentCodesAndPerformances.length;idx1++) {
for (let idx2=0;idx2 < listOfEquivalentCodesAndPerformances[idx1].length;idx2++) {
listOfEquivalentCodesAndPerformances[idx1][idx2].equiv_code=0;
listOfEquivalentCodesAndPerformances[idx1][idx2].equiv_sum=PerformanceNA;
}
}
if (nbCodes!=previousNbOfPossibleCodes) {
throw new Error("evaluatePerformances: (nbCodes!=previousNbOfPossibleCodes)");
}
for (idx=0;idx < nbCodes;idx++) {
listOfGlobalPerformances[idx]=PerformanceNA;
}
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=false;
particularCodeToAssess=particularCode;
res=recursiveEvaluatePerformances(depth, listOfCodes, nbCodes /*,  true (precalculation mode) */);
if (recursiveEvaluatePerformancesWasAborted) {
for (idx=0;idx < nbCodes;idx++) {
listOfGlobalPerformances[idx]=PerformanceNA;
}
particularCodeGlobalPerformance=PerformanceNA;
return PerformanceUNKNOWN;
}
if (res <=0.01) {
throw new Error("evaluatePerformances: invalid global performance: "+res);
}
return res;
}
else {
throw new Error("evaluatePerformances: invalid depth: "+depth);
}
}
function recursiveEvaluatePerformances(depth, listOfCodes, nbCodes /*, possibleGame (precalculation mode) */) {
let first_call=(depth==-1);
let next_depth=depth+1;
let next_current_game_idx=currentGameSize+next_depth;
let nextListsOfCodes;
let nextNbsCodes;
let nbOfEquivalentCodesAndPerformances=0;
let mark_idx, idx, idx1, idx2;
let current_code;
let other_code;
let mark_perf_tmp_idx;
let compute_sum_ini=(nbCodes <=nbCodesLimitForEquivalentCodesCheck);
let compute_sum;
let precalculated_current_game_or_code=(first_call ? areCurrentGameOrCodePrecalculated : -1);
let precalculated_sum;
let sum;
let sum_marks;
let best_sum=100000000000.0;
let marks_already_computed_table_cell;
let codeX;
let codeY;
let nb_classes_cnt=0;
/*
let precalculation_mode=( (nbCodes >=minNbCodesForPrecalculation)
&& (next_current_game_idx <=maxDepthForGamePrecalculation)
&& ( (next_current_game_idx <=1)
|| ((next_current_game_idx==2) && ((possibleGame && (codeHandler.nbDifferentColors(currentGame[0]) <=2))||(codeHandler.isVerySimple(currentGame[0]) && codeHandler.isVerySimple(currentGame[1]))||(nbCodes <=nbCodesForPrecalculationThreshold)))
|| ((next_current_game_idx==3) && possibleGame && (codeHandler.nbDifferentColors(currentGame[0]) <=2) && (codeHandler.nbDifferentColors(currentGame[1]) <=2) && (codeHandler.nbDifferentColors(currentGame[2]) <=2)) )
&& (!compute_sum_ini) );
let str;
let precalculation_start_time;
if (precalculation_mode) {
str=next_current_game_idx+"|"+compressed_str_from_lists_of_codes_and_markidxs(currentGame, marksIdxs, next_current_game_idx)+"|N:"+nbCodes+"|";
send_trace_msg("-"+str+" is being computed... "+new Date());
precalculation_start_time=new Date().getTime();
} */
if (next_depth >=maxDepth) {
throw new Error("recursiveEvaluatePerformances: max depth reached");
}
nextListsOfCodes=listsOfPossibleCodes[next_depth];
nextNbsCodes=nbOfPossibleCodes[next_depth];
/*
let nbCodesToGoThrough=nbCodes;
if (precalculation_mode) {
nbCodesToGoThrough=nbCodesToGoThrough+initialNbPossibleCodes;
}
for (idx1=0;idx1 < nbCodesToGoThrough;idx1++) {
if (idx1 < nbCodes) {
current_code=listOfCodes[idx1];
}
else {
current_code=initialCodeListForPrecalculatedMode[idx1 - nbCodes];
if (!precalculation_mode) {
throw new Error("recursiveEvaluatePerformances: precalculation_mode error");
}
let skip_current_code=false;
for (let i=0;i < next_current_game_idx;i++) {
if (marksIdxs[i]==worst_mark_idx) {
codeHandler.fillMark(current_code, currentGame[i], precalculation_mode_mark);
if ((precalculation_mode_mark.nbBlacks > 0)||(precalculation_mode_mark.nbWhites > 0)) {
skip_current_code=true;
break;
}
}
}
if ((next_current_game_idx >=2) && (nbCodes <=nbCodesForPrecalculationThreshold)) {
skip_current_code=true;
}
if (skip_current_code) {
continue;
}
}
*/
for (idx1=0;idx1 < nbCodes;idx1++) {
current_code=listOfCodes[idx1];
/* if ((depth <=1) &&(!compute_sum_ini)) {
console.log(spaces(depth)+"(depth "+depth+") "+"CURRENT_CODE:"+codeHandler.codeToString(current_code));
console.log(spaces(depth)+"current game: "+str_from_list_of_codes(currentGame, next_current_game_idx));
console.log(spaces(depth)+"perms: "+current_permutations_table_size[next_current_game_idx]+": "
+ print_permutation_list(current_permutations_table[next_current_game_idx], current_permutations_table_size[next_current_game_idx]));
} */
compute_sum=compute_sum_ini;
if (!compute_sum) {
sum=0.0;
for (idx=0;idx < nbOfEquivalentCodesAndPerformances;idx++) {
let known_code=listOfEquivalentCodesAndPerformances[next_depth][idx].equiv_code;
if (areCodesEquivalent(current_code, known_code, next_current_game_idx, false, -1 /* N.A. */, null)) {
sum=listOfEquivalentCodesAndPerformances[next_depth][idx].equiv_sum;
break;
}
}
if (sum < 0.00) {
throw new Error("recursiveEvaluatePerformances: negative sum (1): "+sum);
}
compute_sum=(sum==0.0);
precalculated_sum=false;
if ( (precalculated_current_game_or_code >=0)
&& compute_sum /* && (!precalculation_mode) */ ) {
sum=lookForCodeInPrecalculatedGames(current_code, next_current_game_idx, nbCodes);
if (sum > 0) {
compute_sum=false;
precalculated_sum=true;
if (!compute_sum_ini) {
listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_code=current_code;
listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_sum=sum;
nbOfEquivalentCodesAndPerformances++;
}
}
else {
throw new Error("recursiveEvaluatePerformances: cannot find precalculated game and code (possible code): "+codeHandler.codeToString(current_code));
}
}
}
if (compute_sum) {
/* if (first_call) {
console.log("assessed: "+codeHandler.codeToString(current_code));
write_me=true;
} */
nextNbsCodes.fill(0);
code1_colors[0]=(current_code & 0x0000000F);
code1_colors[1]=((current_code >> 4) & 0x0000000F);
code1_colors[2]=((current_code >> 8) & 0x0000000F);
code1_colors[3]=((current_code >> 12) & 0x0000000F);
code1_colors[4]=((current_code >> 16) & 0x0000000F);
code1_colors[5]=((current_code >> 20) & 0x0000000F);
code1_colors[6]=((current_code >> 24) & 0x0000000F);
for (idx2=0;idx2 < nbCodes;idx2++) {
other_code=listOfCodes[idx2];
if (current_code!=other_code) {
let code1=current_code;
let code2=other_code;
let sum_codes=code1+code2;
let key=( (sum_codes /* (use LSBs) */
+ (sum_codes >> 9) /* (use MSBs) */
+ code1 * code2 /* (mix LSBs) */) & marks_optimization_mask );
marks_already_computed_table_cell=marks_already_computed_table[key];
codeX=marks_already_computed_table_cell.code1a;
codeY=marks_already_computed_table_cell.code2a;
if ( ((codeX==code1) && (codeY==code2))||((codeX==code2) && (codeY==code1)) ) {
mark_perf_tmp.nbBlacks=marks_already_computed_table_cell.nbBlacksa;
mark_perf_tmp.nbWhites=marks_already_computed_table_cell.nbWhitesa;
}
else {
codeX=marks_already_computed_table_cell.code1b;
codeY=marks_already_computed_table_cell.code2b;
if ( ((codeX==code1) && (codeY==code2))||((codeX==code2) && (codeY==code1)) ) {
mark_perf_tmp.nbBlacks=marks_already_computed_table_cell.nbBlacksb;
mark_perf_tmp.nbWhites=marks_already_computed_table_cell.nbWhitesb;
}
else {
codeX=marks_already_computed_table_cell.code1c;
codeY=marks_already_computed_table_cell.code2c;
if ( ((codeX==code1) && (codeY==code2))||((codeX==code2) && (codeY==code1)) ) {
mark_perf_tmp.nbBlacks=marks_already_computed_table_cell.nbBlacksc;
mark_perf_tmp.nbWhites=marks_already_computed_table_cell.nbWhitesc;
}
else {
let nbBlacks=0;
let nbWhites=0;
let col1, col2;
colors_int[0]=true;
colors_int[1]=true;
colors_int[2]=true;
colors_int[3]=true;
colors_int[4]=true;
colors_int[5]=true;
colors_int[6]=true;
code2_colors[0]=(code2 & 0x0000000F);
code2_colors[1]=((code2 >> 4) & 0x0000000F);
code2_colors[2]=((code2 >> 8) & 0x0000000F);
code2_colors[3]=((code2 >> 12) & 0x0000000F);
code2_colors[4]=((code2 >> 16) & 0x0000000F);
code2_colors[5]=((code2 >> 20) & 0x0000000F);
code2_colors[6]=((code2 >> 24) & 0x0000000F);
for (col1=0;col1 < nbColumns;col1++) {
if (code1_colors[col1]==code2_colors[col1]) {
nbBlacks++;
}
else {
for (col2=0;col2 < nbColumns;col2++) {
if ((code1_colors[col1]==code2_colors[col2]) && (code1_colors[col2]!=code2_colors[col2]) && colors_int[col2]) {
colors_int[col2]=false;
nbWhites++;
break;
}
}
}
}
mark_perf_tmp.nbBlacks=nbBlacks;
mark_perf_tmp.nbWhites=nbWhites;
if (marks_already_computed_table_cell.write_index==0) {
marks_already_computed_table_cell.code1a=code1;
marks_already_computed_table_cell.code2a=code2;
marks_already_computed_table_cell.nbBlacksa=nbBlacks;
marks_already_computed_table_cell.nbWhitesa=nbWhites;
marks_already_computed_table_cell.write_index=1;
}
else if (marks_already_computed_table_cell.write_index==1) {
marks_already_computed_table_cell.code1b=code1;
marks_already_computed_table_cell.code2b=code2;
marks_already_computed_table_cell.nbBlacksb=nbBlacks;
marks_already_computed_table_cell.nbWhitesb=nbWhites;
marks_already_computed_table_cell.write_index=2;
}
else if (marks_already_computed_table_cell.write_index==2) {
marks_already_computed_table_cell.code1c=code1;
marks_already_computed_table_cell.code2c=code2;
marks_already_computed_table_cell.nbBlacksc=nbBlacks;
marks_already_computed_table_cell.nbWhitesc=nbWhites;
marks_already_computed_table_cell.write_index=0;
}
else {
throw new Error("recursiveEvaluatePerformances: wrong write_index: "+marks_already_computed_table_cell.write_index);
}
}
}
}
mark_perf_tmp_idx=marksTable_MarkToNb[mark_perf_tmp.nbBlacks][mark_perf_tmp.nbWhites];
nextListsOfCodes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]]=other_code;
nextNbsCodes[mark_perf_tmp_idx]++;
}
else {
nextListsOfCodes[best_mark_idx][nextNbsCodes[best_mark_idx]]=other_code;
nextNbsCodes[best_mark_idx]++;
}
}
sum=0.0;
sum_marks=0;
/* if ( (next_current_game_idx==1)
&& (!(idx1 < nbCodes))
&& (!(codeHandler.nbDifferentColors(currentGame[0]) <=2)) ) {
let very_inefficient_current_code=false;
for (mark_idx=nbMaxMarks-1;mark_idx >=0;mark_idx--) {
let nextNbCodes=nextNbsCodes[mark_idx];
if (nextNbCodes > 0) {
if (!(nextNbCodes <=nbCodesForPrecalculationThreshold)) {
very_inefficient_current_code=true;
break;
}
}
}
if (very_inefficient_current_code) {
if (idx1 < nbCodes) {
throw new Error("recursiveEvaluatePerformances: very_inefficient_current_code");
}
continue;
}
} */
for (mark_idx=nbMaxMarks-1;mark_idx >=0;mark_idx--) {
let nextNbCodes=nextNbsCodes[mark_idx];
if (nextNbCodes > 0) {
/* if (nextNbCodes==nbCodes) {
useless_current_code=true;
break;
} */
sum_marks +=nextNbCodes;
if (mark_idx==best_mark_idx) {
if (sum_marks==nbCodes) break;
}
else if (nextNbCodes==1) {
sum=sum+1.0;
if (sum_marks==nbCodes) break;
}
else if (nextNbCodes==2) {
sum=sum+3.0;
if (sum_marks==nbCodes) break;
}
else if (nextNbCodes==3) {
let nextListOfCodesToConsider=nextListsOfCodes[mark_idx];
codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[1], mark_perf_tmpa);
codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[2], mark_perf_tmpb);
if ((mark_perf_tmpa.nbBlacks==mark_perf_tmpb.nbBlacks) && (mark_perf_tmpa.nbWhites==mark_perf_tmpb.nbWhites)) {
codeHandler.fillMark(nextListOfCodesToConsider[1], nextListOfCodesToConsider[2], mark_perf_tmpc);
if ((mark_perf_tmpa.nbBlacks==mark_perf_tmpc.nbBlacks) && (mark_perf_tmpa.nbWhites==mark_perf_tmpc.nbWhites)) {
sum=sum+6.0;
}
else {
sum=sum+5.0;
}
}
else {
sum=sum+5.0;
}
if (sum_marks==nbCodes) break;
}
else if (nextNbCodes==4) {
let nextListOfCodesToConsider=nextListsOfCodes[mark_idx];
codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[1], mark_perf_tmpa);
codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[2], mark_perf_tmpb);
codeHandler.fillMark(nextListOfCodesToConsider[0], nextListOfCodesToConsider[3], mark_perf_tmpc);
let a_b=((mark_perf_tmpa.nbBlacks==mark_perf_tmpb.nbBlacks) && (mark_perf_tmpa.nbWhites==mark_perf_tmpb.nbWhites));
let a_c=((mark_perf_tmpa.nbBlacks==mark_perf_tmpc.nbBlacks) && (mark_perf_tmpa.nbWhites==mark_perf_tmpc.nbWhites));
let b_c=((mark_perf_tmpb.nbBlacks==mark_perf_tmpc.nbBlacks) && (mark_perf_tmpb.nbWhites==mark_perf_tmpc.nbWhites));
if ((!a_b) && (!a_c) && (!b_c)) {
sum=sum+7.0;
}
else {
codeHandler.fillMark(nextListOfCodesToConsider[1], nextListOfCodesToConsider[2], mark_perf_tmpd);
codeHandler.fillMark(nextListOfCodesToConsider[1], nextListOfCodesToConsider[3], mark_perf_tmpe);
codeHandler.fillMark(nextListOfCodesToConsider[2], nextListOfCodesToConsider[3], mark_perf_tmpf);
let a_d=((mark_perf_tmpa.nbBlacks==mark_perf_tmpd.nbBlacks) && (mark_perf_tmpa.nbWhites==mark_perf_tmpd.nbWhites));
let a_e=((mark_perf_tmpa.nbBlacks==mark_perf_tmpe.nbBlacks) && (mark_perf_tmpa.nbWhites==mark_perf_tmpe.nbWhites));
let a_f=((mark_perf_tmpa.nbBlacks==mark_perf_tmpf.nbBlacks) && (mark_perf_tmpa.nbWhites==mark_perf_tmpf.nbWhites));
if (a_b && a_c && a_d && a_e && a_f) {
sum=sum+10.0;
}
else {
let d_e=((mark_perf_tmpd.nbBlacks==mark_perf_tmpe.nbBlacks) && (mark_perf_tmpd.nbWhites==mark_perf_tmpe.nbWhites));
if ((!a_d) && (!a_e) && (!d_e)) {
sum=sum+7.0;
}
else {
let c_e=((mark_perf_tmpc.nbBlacks==mark_perf_tmpe.nbBlacks) && (mark_perf_tmpc.nbWhites==mark_perf_tmpe.nbWhites));
let c_f=((mark_perf_tmpc.nbBlacks==mark_perf_tmpf.nbBlacks) && (mark_perf_tmpc.nbWhites==mark_perf_tmpf.nbWhites));
let e_f=((mark_perf_tmpe.nbBlacks==mark_perf_tmpf.nbBlacks) && (mark_perf_tmpe.nbWhites==mark_perf_tmpf.nbWhites));
if ((!c_e) && (!c_f) && (!e_f)) {
sum=sum+7.0;
}
else {
let b_d=((mark_perf_tmpb.nbBlacks==mark_perf_tmpd.nbBlacks) && (mark_perf_tmpb.nbWhites==mark_perf_tmpd.nbWhites));
let b_f=((mark_perf_tmpb.nbBlacks==mark_perf_tmpf.nbBlacks) && (mark_perf_tmpb.nbWhites==mark_perf_tmpf.nbWhites));
let d_f=((mark_perf_tmpd.nbBlacks==mark_perf_tmpf.nbBlacks) && (mark_perf_tmpd.nbWhites==mark_perf_tmpf.nbWhites));
if ((!b_d) && (!b_f) && (!d_f)) {
sum=sum+7.0;
}
else {
sum=sum+8.0;
}
}
}
}
}
if (sum_marks==nbCodes) break;
}
else {
currentGame[next_current_game_idx]=current_code;
marksIdxs[next_current_game_idx]=mark_idx;
if (nextNbCodes > nbCodesLimitForEquivalentCodesCheck) {
let new_perm_cnt=0;
for (let perm_idx=0;perm_idx < current_permutations_table_size[next_current_game_idx];perm_idx++) {
if (areCodesEquivalent(0, 0, next_current_game_idx+1, true /* assess current game only */, current_permutations_table[next_current_game_idx][perm_idx], null) /* forced permutation */) {
if ((current_permutations_table[next_current_game_idx][perm_idx] < 0)||(current_permutations_table[next_current_game_idx][perm_idx] >=all_permutations_table_size[nbColumns])) {
throw new Error("recursiveEvaluatePerformances: invalid permutation index: "+perm_idx);
}
current_permutations_table[next_current_game_idx+1][new_perm_cnt]=current_permutations_table[next_current_game_idx][perm_idx];
new_perm_cnt++;
}
}
if (new_perm_cnt <=0) {
throw new Error("recursiveEvaluatePerformances: invalid new_perm_cnt value: "+new_perm_cnt);
}
current_permutations_table_size[next_current_game_idx+1]=new_perm_cnt;
}
else {
current_permutations_table_size[next_current_game_idx+1]=0;
}
sum=sum+nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes /*, ((idx1 < nbCodes) && possibleGame) (precalculation mode) */);
if (sum_marks==nbCodes) break;
}
}
}
/*
if (useless_current_code) {
if (idx1 < nbCodes) {
throw new Error("recursiveEvaluatePerformances: useless_current_code");
}
continue;
} */
if (sum_marks!=nbCodes) {
throw new Error("recursiveEvaluatePerformances: invalid sum_marks value (1) (depth="+depth+", sum_marks="+sum_marks+", sum_marks="+sum_marks+")");
}
if (!compute_sum_ini) {
listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_code=current_code;
listOfEquivalentCodesAndPerformances[next_depth][nbOfEquivalentCodesAndPerformances].equiv_sum=sum;
nbOfEquivalentCodesAndPerformances++;
}
}
/* if ((sum < best_sum) && (idx1 < nbCodes)) {
best_sum=sum;
} */
if (sum < best_sum) {
best_sum=sum;
}
if (depth <=1) {
if (first_call) {
if ((!compute_sum_ini) && (nbCodes > 100)) {
let time_elapsed=new Date().getTime() - evaluatePerformancesStartTime;
if (compute_sum||precalculated_sum) {
nb_classes_cnt++;
/* if (precalculation_mode) {
send_trace_msg("______________________________ END OF CLASS ______________________________ "+time_elapsed+" ms");
} */
}
let idxToConsider;
let totalNbToConsider;
idxToConsider=nb_classes_cnt;
totalNbToConsider=currentNbClasses;
if (time_elapsed > maxPerformanceEvaluationTime) {
console.log("(processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%))");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > 3000) && (time_elapsed > maxPerformanceEvaluationTime*7/100) && (idxToConsider < Math.floor(totalNbToConsider*1.25/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #0)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*10/100) && (idxToConsider < Math.floor(totalNbToConsider*2/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #1)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*15/100) && (idxToConsider < Math.floor(totalNbToConsider*3.75/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #2)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*20/100) && (idxToConsider < Math.floor(totalNbToConsider*6/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #3)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*30/100) && (idxToConsider < Math.floor(totalNbToConsider*12/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #4)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*40/100) && (idxToConsider < Math.floor(totalNbToConsider*20/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #5)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*50/100) && (idxToConsider < Math.floor(totalNbToConsider*30/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #6)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*60/100) && (idxToConsider < Math.floor(totalNbToConsider*42/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #7)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*70/100) && (idxToConsider < Math.floor(totalNbToConsider*56/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #8)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if ( (time_elapsed > maxPerformanceEvaluationTime*80/100) && (idxToConsider < Math.floor(totalNbToConsider*72/100)) ) {
console.log("(anticipation of processing abortion after "+time_elapsed+"ms ("+Math.round(100*idxToConsider/totalNbToConsider)+"%) #9)");
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
if (idx1+1==nbCodes) {
if (idxToConsider!=totalNbToConsider) {
throw new Error("recursiveEvaluatePerformances: invalid code numbers ("+idxToConsider+"!="+totalNbToConsider+")");
}
}
}
listOfGlobalPerformances[idx1]=1.0+sum / nbCodes;
/* if (write_me) {
let time_elapsed=new Date().getTime() - evaluatePerformancesStartTime;
console.log("perf #"+idx1+": "+listOfGlobalPerformances[idx1]+" / "+time_elapsed+"ms");
} */
}
else if ((depth==0)||(depth==1)) {
let time_elapsed=new Date().getTime() - evaluatePerformancesStartTime;
if (time_elapsed > maxPerformanceEvaluationTime) {
listOfGlobalPerformances[0]=PerformanceNA;
listOfGlobalPerformances[nbCodes-1]=PerformanceNA;
particularCodeGlobalPerformance=PerformanceNA;
recursiveEvaluatePerformancesWasAborted=true;return PerformanceUNKNOWN;
}
time_elapsed=undefined;
}
else {
throw new Error("recursiveEvaluatePerformances: internal error (1)");
}
}
/* if (precalculation_mode && write_me_for_precalculation) {
str=str+codeHandler.compressCodeToString(current_code)+":"+Math.round(sum).toString(16).toUpperCase()+",";
} */
}
/* if (precalculation_mode) {
if (!str.endsWith(",")) {
throw new Error("recursiveEvaluatePerformances: internal error (2)");
}
str="\""+str.substring(0, str.length-1)+".\" +";
let precalculation_time=new Date().getTime() - precalculation_start_time;
if (precalculation_time >=2700) {
send_trace_msg(str);
}
else {
send_trace_msg("skipped ("+precalculation_time+"ms)");
}
} */
if (first_call && (particularCodeToAssess!=0 /* empty code */)) {
current_code=particularCodeToAssess;
let particular_precalculated_sum=false;
if ( (precalculated_current_game_or_code > 0)
&& (!compute_sum_ini) /* && (!precalculation_mode) */ ) {
sum=lookForCodeInPrecalculatedGames(current_code, next_current_game_idx, nbCodes);
if (sum > 0) {
particular_precalculated_sum=true;
}
else {
throw new Error("recursiveEvaluatePerformances: cannot find precalculated game and code (impossible code): "+codeHandler.codeToString(current_code));
}
}
if (!particular_precalculated_sum) {
nextNbsCodes.fill(0);
for (idx2=0;idx2 < nbCodes;idx2++) {
other_code=listOfCodes[idx2];
codeHandler.fillMark(current_code, other_code, mark_perf_tmp);
mark_perf_tmp_idx=marksTable_MarkToNb[mark_perf_tmp.nbBlacks][mark_perf_tmp.nbWhites];
nextListsOfCodes[mark_perf_tmp_idx][nextNbsCodes[mark_perf_tmp_idx]]=other_code;
nextNbsCodes[mark_perf_tmp_idx]++;
}
sum=0.0;
sum_marks=0;
for (mark_idx=nbMaxMarks-1;mark_idx >=0;mark_idx--) {
let nextNbCodes=nextNbsCodes[mark_idx];
if (nextNbCodes > 0) {
sum_marks +=nextNbCodes;
if (mark_idx==best_mark_idx) {
throw new Error("recursiveEvaluatePerformances: impossible code is possible");
}
else if (nextNbCodes==1) {
sum=sum+1.0;
}
else if (nextNbCodes==2) {
sum=sum+3.0;
}
else {
currentGame[next_current_game_idx]=current_code;
marksIdxs[next_current_game_idx]=mark_idx;
if (nextNbCodes > nbCodesLimitForEquivalentCodesCheck) {
let new_perm_cnt=0;
for (let perm_idx=0;perm_idx < current_permutations_table_size[next_current_game_idx];perm_idx++) {
if (areCodesEquivalent(0, 0, next_current_game_idx+1, true /* assess current game only */, current_permutations_table[next_current_game_idx][perm_idx], null) /* forced permutation */) {
if ((current_permutations_table[next_current_game_idx][perm_idx] < 0)||(current_permutations_table[next_current_game_idx][perm_idx] >=all_permutations_table_size[nbColumns])) {
throw new Error("recursiveEvaluatePerformances: invalid permutation index: "+perm_idx);
}
current_permutations_table[next_current_game_idx+1][new_perm_cnt]=current_permutations_table[next_current_game_idx][perm_idx];
new_perm_cnt++;
}
}
if (new_perm_cnt <=0) {
throw new Error("recursiveEvaluatePerformances: invalid new_perm_cnt value: "+new_perm_cnt);
}
current_permutations_table_size[next_current_game_idx+1]=new_perm_cnt;
}
else {
current_permutations_table_size[next_current_game_idx+1]=0;
}
sum=sum+nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes /*, false (precalculation mode) */);
}
}
}
if (sum_marks!=nbCodes) {
throw new Error("recursiveEvaluatePerformances: invalid sum_marks value (2) (depth="+depth+", sum_marks="+sum_marks+", sum_marks="+sum_marks+")");
}
}
particularCodeGlobalPerformance=1.0+sum / nbCodes;
}
return 1.0+best_sum / nbCodes;
}
self.addEventListener('message', function(e) {
if (abort_worker_process) {
return;
}
try {
if (message_processing_ongoing) {
throw new Error("GameSolver event handling error (message_processing_ongoing is true)");
}
message_processing_ongoing=true;
if (e.data==undefined) {
throw new Error("data is undefined");
}
let data=e.data;
if (data.req_type==undefined) {
throw new Error("req_type is undefined");
}
if (data.req_type=='INIT') {
if (!IAmAliveMessageSent) {
self.postMessage({'rsp_type': 'I_AM_ALIVE'});
IAmAliveMessageSent=true;
}
if (init_done) {
throw new Error("INIT phase / double initialization");
}
if (data.nbColumns==undefined) {
throw new Error("INIT phase / nbColumns is undefined");
}
nbColumns=Number(data.nbColumns);
if ( isNaN(nbColumns)||(nbColumns < nbMinColumns)||(nbColumns > nbMaxColumns) ) {
throw new Error("INIT phase / invalid nbColumns: "+nbColumns);
}
if (data.nbColors==undefined) {
throw new Error("INIT phase / nbColors is undefined");
}
nbColors=Number(data.nbColors);
if ( isNaN(nbColors)||(nbColors < nbMinColors)||(nbColors > nbMaxColors) ) {
throw new Error("INIT phase / invalid nbColors: "+nbColors);
}
if (data.nbMaxAttempts==undefined) {
throw new Error("INIT phase / nbMaxAttempts is undefined");
}
nbMaxAttempts=Number(data.nbMaxAttempts);
if ( isNaN(nbMaxAttempts)||(nbMaxAttempts < overallNbMinAttempts)||(nbMaxAttempts > overallNbMaxAttempts) ) {
throw new Error("INIT phase / invalid nbMaxAttempts: "+nbMaxAttempts);
}
if (data.nbMaxPossibleCodesShown==undefined) {
throw new Error("INIT phase / nbMaxPossibleCodesShown is undefined");
}
nbMaxPossibleCodesShown=Number(data.nbMaxPossibleCodesShown);
if ( isNaN(nbMaxPossibleCodesShown)||(nbMaxPossibleCodesShown < 5)||(nbMaxPossibleCodesShown > 100) ) {
throw new Error("INIT phase / invalid nbMaxPossibleCodesShown: "+nbMaxPossibleCodesShown);
}
possibleCodesShown=new Array(nbMaxPossibleCodesShown);
globalPerformancesShown=new Array(nbMaxPossibleCodesShown);
for (let i=0;i < nbMaxPossibleCodesShown;i++) {
globalPerformancesShown[i]=PerformanceNA;
}
if (data.first_session_game==undefined) {
throw new Error("INIT phase / first_session_game is undefined");
}
let first_session_game=data.first_session_game;
if (data.game_id==undefined) {
throw new Error("INIT phase / game_id is undefined");
}
game_id=Number(data.game_id);
if ( isNaN(game_id)||(game_id < 0) ) {
throw new Error("INIT phase / invalid game_id: "+game_id);
}
if (data.debug_mode==undefined) {
throw new Error("INIT phase / debug_mode is undefined");
}
if (data.debug_mode!="") {
if (data.debug_mode=="dbg") {
for (let i=0;i==i;i++) {
}
}
}
codesPlayed=new Array(nbMaxAttempts);
for (let i=0;i < nbMaxAttempts;i++) {
codesPlayed[i]=0;
}
marks=new Array(nbMaxAttempts);
for (let i=0;i < nbMaxAttempts;i++) {
marks[i]={nbBlacks:0, nbWhites:0};
}
codeHandler=new CodeHandler(nbColumns, nbColors, nbMinColumns, nbMaxColumns, emptyColor)
initialNbPossibleCodes=Math.round(Math.pow(nbColors,nbColumns));
previousNbOfPossibleCodes=initialNbPossibleCodes;
nextNbOfPossibleCodes=initialNbPossibleCodes;
minNbColorsTable=new Array(nbColors+1);
maxNbColorsTable=new Array(nbColors+1);
nbColorsTableForMinMaxNbColors=new Array(nbColors+1);
switch (nbColumns) {
case 3:
nbMaxMarks=9;
maxPerformanceEvaluationTime=baseOfMaxPerformanceEvaluationTime*10/30;
nbOfCodesForSystematicEvaluation=initialNbPossibleCodes;
nbOfCodesForSystematicEvaluation_ForMemAlloc=initialNbPossibleCodes;
initialNbClasses=3;
maxDepth=Math.min(11, overallMaxDepth);
marks_optimization_mask=0x1FFF;
maxDepthForGamePrecalculation=-1;
break;
case 4:
nbMaxMarks=14;
maxPerformanceEvaluationTime=baseOfMaxPerformanceEvaluationTime*20/30;
nbOfCodesForSystematicEvaluation=initialNbPossibleCodes;
nbOfCodesForSystematicEvaluation_ForMemAlloc=initialNbPossibleCodes;
initialNbClasses=5;
maxDepth=Math.min(12, overallMaxDepth);
marks_optimization_mask=0x3FFF;
maxDepthForGamePrecalculation=3;
break;
case 5:
nbMaxMarks=20;
maxPerformanceEvaluationTime=baseOfMaxPerformanceEvaluationTime*50/30;
nbOfCodesForSystematicEvaluation=Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
nbOfCodesForSystematicEvaluation_ForMemAlloc=initialNbPossibleCodes;
initialNbClasses=7;
maxDepth=Math.min(13, overallMaxDepth);
marks_optimization_mask=0xFFFF;
maxDepthForGamePrecalculation=3;
break;
case 6:
nbMaxMarks=27;
maxPerformanceEvaluationTime=baseOfMaxPerformanceEvaluationTime*60/30;
nbOfCodesForSystematicEvaluation=Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
nbOfCodesForSystematicEvaluation_ForMemAlloc=nbOfCodesForSystematicEvaluation;
initialNbClasses=11;
maxDepth=Math.min(14, overallMaxDepth);
marks_optimization_mask=0xFFFF;
maxDepthForGamePrecalculation=-1;
break;
case 7:
nbMaxMarks=35;
maxPerformanceEvaluationTime=baseOfMaxPerformanceEvaluationTime*75/30;
nbOfCodesForSystematicEvaluation=Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
nbOfCodesForSystematicEvaluation_ForMemAlloc=nbOfCodesForSystematicEvaluation;
initialNbClasses=15;
maxDepth=Math.min(15, overallMaxDepth);
marks_optimization_mask=0xFFFF;
maxDepthForGamePrecalculation=-1;
break;
default:
throw new Error("INIT phase / invalid nbColumns: "+nbColumns);
}
if (nbOfCodesForSystematicEvaluation > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
throw new Error("INIT phase / internal error: nbOfCodesForSystematicEvaluation");
}
if ( (maxDepthForGamePrecalculation > maxDepthForGamePrecalculation_ForMemAlloc)
|| ((maxDepthForGamePrecalculation!=-1) && (maxDepthForGamePrecalculation!=3)) ) {
throw new Error("INIT phase / internal error (maxDepthForGamePrecalculation: "+maxDepthForGamePrecalculation+")");
}
if (minNbCodesForPrecalculation <=nbCodesLimitForEquivalentCodesCheck) {
throw new Error("INIT phase / internal error: minNbCodesForPrecalculation");
}
marksTable_MarkToNb=new Array(nbColumns+1);
for (let i=0;i <=nbColumns;i++) {
marksTable_MarkToNb[i]=new Array(nbColumns+1);
for (let j=0;j <=nbColumns;j++) {
marksTable_MarkToNb[i][j]=-1;
}
}
marksTable_NbToMark=new Array(nbMaxMarks);
for (let i=0;i < nbMaxMarks;i++) {
marksTable_NbToMark[i]={nbBlacks:-1, nbWhites:-1};
}
let mark_cnt=0;
for (let i=0;i <=nbColumns;i++) {
for (let j=0;j <=nbColumns;j++) {
let mark_tmp={nbBlacks:i, nbWhites:j};
if (codeHandler.isMarkValid(mark_tmp)) {
if (mark_cnt >=nbMaxMarks) {
throw new Error("INIT phase / internal error (mark_cnt: "+mark_cnt+") (1)");
}
marksTable_NbToMark[mark_cnt]=mark_tmp;
marksTable_MarkToNb[i][j]=mark_cnt;
mark_cnt++;
}
}
}
if (mark_cnt!=nbMaxMarks) {
throw new Error("INIT phase / internal error (mark_cnt: "+mark_cnt+") (2)");
}
if (marksTable_NbToMark.length!=nbMaxMarks) {
throw new Error("INIT phase / internal error (marksTable_NbToMark length: "+marksTable_NbToMark.length+")");
}
if (marksTable_MarkToNb.length!=nbColumns+1) {
throw new Error("INIT phase / internal error (marksTable_MarkToNb length: "+marksTable_MarkToNb.length+") (1)");
}
for (let i=0;i <=nbColumns;i++) {
if (marksTable_MarkToNb[i].length!=nbColumns+1) {
throw new Error("INIT phase / internal error (marksTable_MarkToNb length: "+marksTable_MarkToNb.length+") (2)");
}
}
best_mark_idx=marksTable_MarkToNb[nbColumns][0];
worst_mark_idx=marksTable_MarkToNb[0][0];
possibleCodesForPerfEvaluation=new Array(2);
possibleCodesForPerfEvaluation[0]=new Array(nbOfCodesForSystematicEvaluation_ForMemAlloc);
possibleCodesForPerfEvaluation[1]=new Array(nbOfCodesForSystematicEvaluation_ForMemAlloc);
colorsFoundCode=codeHandler.setAllColorsIdentical(emptyColor);
for (let color=1;color <=nbColors;color++) {
minNbColorsTable[color]=0;
maxNbColorsTable[color]=nbColumns;
}
self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': initialNbPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': 1, 'game_id': game_id});
let nb_possible_codes_listed=fillShortInitialPossibleCodesTable(possibleCodesForPerfEvaluation[1], nbOfCodesForSystematicEvaluation_ForMemAlloc);
if (possibleCodesForPerfEvaluation_lastIndexWritten!=-1) {
throw new Error("INIT phase / inconsistent writing into possibleCodesForPerfEvaluation");
}
possibleCodesForPerfEvaluation_lastIndexWritten=1;
/* if (8*8*8*8*8!=fillShortInitialPossibleCodesTable(initialCodeListForPrecalculatedMode, nbOfCodesForSystematicEvaluation_ForMemAlloc)) {
throw new Error("INIT phase / internal error");
} */
init_done=true;
}
else if (init_done && (data.req_type=='NEW_ATTEMPT')) {
if (data.currentAttemptNumber==undefined) {
throw new Error("NEW_ATTEMPT phase / currentAttemptNumber is undefined");
}
let currentAttemptNumber_tmp=Number(data.currentAttemptNumber);
if ( isNaN(currentAttemptNumber_tmp)||(currentAttemptNumber_tmp < 0)||(currentAttemptNumber_tmp > nbMaxAttempts) ) {
throw new Error("NEW_ATTEMPT phase / invalid currentAttemptNumber: "+currentAttemptNumber_tmp);
}
if (currentAttemptNumber_tmp!=currentAttemptNumber+1) {
throw new Error("NEW_ATTEMPT phase / non consecutive currentAttemptNumber values: "+currentAttemptNumber+", "+currentAttemptNumber_tmp);
}
currentAttemptNumber=currentAttemptNumber_tmp;
if (data.nbMaxAttemptsForEndOfGame==undefined) {
throw new Error("NEW_ATTEMPT phase / nbMaxAttemptsForEndOfGame is undefined");
}
nbMaxAttemptsForEndOfGame=Number(data.nbMaxAttemptsForEndOfGame);
if ( isNaN(nbMaxAttemptsForEndOfGame)||(nbMaxAttemptsForEndOfGame < 0)||(nbMaxAttemptsForEndOfGame > nbMaxAttempts)||(nbMaxAttemptsForEndOfGame < currentAttemptNumber) ) {
throw new Error("NEW_ATTEMPT phase / invalid nbMaxAttemptsForEndOfGame: "+nbMaxAttemptsForEndOfGame+", "+currentAttemptNumber);
}
if (data.code==undefined) {
throw new Error("NEW_ATTEMPT phase / code is undefined");
}
codesPlayed[currentAttemptNumber-1]=Number(data.code);
if ( isNaN(codesPlayed[currentAttemptNumber-1])||!codeHandler.isFullAndValid(codesPlayed[currentAttemptNumber-1]) ) {
throw new Error("NEW_ATTEMPT phase / invalid code: "+codesPlayed[currentAttemptNumber-1]);
}
if (data.mark_nbBlacks==undefined) {
throw new Error("NEW_ATTEMPT phase / mark_nbBlacks is undefined");
}
let mark_nbBlacks=Number(data.mark_nbBlacks);
if ( isNaN(mark_nbBlacks)||(mark_nbBlacks < 0)||(mark_nbBlacks > nbColumns) ) {
throw new Error("NEW_ATTEMPT phase / invalid mark_nbBlacks: "+mark_nbBlacks+", "+nbColumns);
}
let gameWon=(mark_nbBlacks==nbColumns);
if (data.mark_nbWhites==undefined) {
throw new Error("NEW_ATTEMPT phase / mark_nbWhites is undefined");
}
let mark_nbWhites=Number(data.mark_nbWhites);
if ( isNaN(mark_nbWhites)||(mark_nbWhites < 0)||(mark_nbWhites > nbColumns) ) {
throw new Error("NEW_ATTEMPT phase / invalid mark_nbWhites: "+mark_nbWhites+", "+nbColumns);
}
marks[currentAttemptNumber-1]={nbBlacks:mark_nbBlacks, nbWhites:mark_nbWhites};
if (!codeHandler.isMarkValid(marks[currentAttemptNumber-1])) {
throw new Error("NEW_ATTEMPT phase / invalid mark: "+mark_nbBlacks+"B, "+mark_nbWhites+"W, "+nbColumns);
}
if (data.game_id==undefined) {
throw new Error("NEW_ATTEMPT phase / game_id is undefined");
}
let attempt_game_id=Number(data.game_id);
if ( isNaN(attempt_game_id)||(attempt_game_id < 0)||(attempt_game_id!=game_id) ) {
throw new Error("NEW_ATTEMPT phase / invalid game_id: "+attempt_game_id+" ("+game_id+")");
}
if (!initialInitDone) {
initialInitDone=true;
currentGame=new Array(nbMaxAttempts+maxDepth);
currentGame.fill(0);/* empty code */
marksIdxs=new Array(nbMaxAttempts+maxDepth);
marksIdxs.fill(-1);
generateAllPermutations();
}
if (currentAttemptNumber >=2) {
currentGame[currentAttemptNumber-2]=codesPlayed[currentAttemptNumber-2];
marksIdxs[currentAttemptNumber-2]=marksTable_MarkToNb[marks[currentAttemptNumber-2].nbBlacks][marks[currentAttemptNumber-2].nbWhites];
}
currentGameSize=currentAttemptNumber-1;
if (currentGameSize!=currentAttemptNumber-1) {
throw new Error("NEW_ATTEMPT phase / invalid currentGameSize");
}
for (let idx=0;idx < currentGameSize;idx++) {
if ( (currentGame[idx]!=codesPlayed[idx])||(!codeHandler.isFullAndValid(currentGame[idx])) ) {
throw new Error("NEW_ATTEMPT phase / invalid current game ("+idx+")");
}
if ( (!codeHandler.marksEqual(marksTable_NbToMark[marksIdxs[idx]], marks[idx]))||(!codeHandler.isMarkValid(marksTable_NbToMark[marksIdxs[idx]])) )  {
throw new Error("NEW_ATTEMPT phase /  invalid current marks ("+idx+")");
}
}
if (currentAttemptNumber >=2) {
if (current_permutations_table_size[currentGameSize-1] <=0) {
throw new Error("NEW_ATTEMPT phase / invalid current_permutations_table_size value: "+current_permutations_table_size[currentGameSize-1]);
}
let new_perm_cnt=0;
for (let perm_idx=0;perm_idx < current_permutations_table_size[currentGameSize-1];perm_idx++) {
if (areCodesEquivalent(0, 0, currentGameSize, true /* assess current game only */, current_permutations_table[currentGameSize-1][perm_idx], null) /* forced permutation */) {
if ((current_permutations_table[currentGameSize-1][perm_idx] < 0)||(current_permutations_table[currentGameSize-1][perm_idx] >=all_permutations_table_size[nbColumns])) {
throw new Error("NEW_ATTEMPT phase / invalid permutation index: "+perm_idx);
}
current_permutations_table[currentGameSize][new_perm_cnt]=current_permutations_table[currentGameSize-1][perm_idx];
new_perm_cnt++;
}
}
if (new_perm_cnt <=0) {
throw new Error("NEW_ATTEMPT phase / invalid new_perm_cnt value: "+new_perm_cnt);
}
current_permutations_table_size[currentGameSize]=new_perm_cnt;
}
console.log(String(currentAttemptNumber)+": "+codeHandler.markToString(marks[currentAttemptNumber-1])+" "+codeHandler.codeToString(codesPlayed[currentAttemptNumber-1]));
if (marks_already_computed_table==null) {
marks_already_computed_table=new Array(marks_optimization_mask+1);
for (let i=0;i < marks_already_computed_table.length;i++) {
marks_already_computed_table[i]={ code1a:0, code2a:0, nbBlacksa:-1, nbWhitesa:-1,
code1b:0, code2b:0, nbBlacksb:-1, nbWhitesb:-1,
code1c:0, code2c:0, nbBlacksc:-1, nbWhitesc:-1,
write_index:0};
}
}
if (currentAttemptNumber==1) {
possibleCodesAfterNAttempts=new OptimizedArrayList(Math.max(1+Math.floor(initialNbPossibleCodes/nb_max_internal_lists), 5*nb_max_internal_lists));
}
previousNbOfPossibleCodes=nextNbOfPossibleCodes;
nextNbOfPossibleCodes=computeNbOfPossibleCodes(currentAttemptNumber+1, nbOfCodesForSystematicEvaluation_ForMemAlloc, possibleCodesForPerfEvaluation[(currentAttemptNumber+1)%2]);
if (possibleCodesForPerfEvaluation_lastIndexWritten!=(currentAttemptNumber%2)) {
throw new Error("NEW_ATTEMPT phase / inconsistent writing into possibleCodesForPerfEvaluation");
}
possibleCodesForPerfEvaluation_lastIndexWritten=(currentAttemptNumber+1)%2;
if (nextNbOfPossibleCodes > previousNbOfPossibleCodes) {
throw new Error("NEW_ATTEMPT phase / inconsistent numbers of possible codes: "+nextNbOfPossibleCodes+" > "+previousNbOfPossibleCodes);
}
if (currentAttemptNumber+1 <=nbMaxAttemptsForEndOfGame) {
self.postMessage({'rsp_type': 'NB_POSSIBLE_CODES', 'nbOfPossibleCodes_p': nextNbOfPossibleCodes, 'colorsFoundCode_p': colorsFoundCode, 'minNbColorsTable_p': minNbColorsTable.toString(), 'maxNbColorsTable_p': maxNbColorsTable.toString(), 'attempt_nb': (currentAttemptNumber+1), 'game_id': game_id});
}
let best_global_performance=PerformanceNA;
let code_played_relative_perf=PerformanceNA;
let relative_perf_evaluation_done=false;
if ((nextNbOfPossibleCodes==previousNbOfPossibleCodes) && (!gameWon)) {
best_global_performance=PerformanceUNKNOWN;
code_played_relative_perf=-1.00;
relative_perf_evaluation_done=true;
}
else {
let precalculated_current_game_or_code=-1;
if ( (previousNbOfPossibleCodes >=minNbCodesForPrecalculation)
&& (currentGameSize <=maxDepthForGamePrecalculation) ) {
precalculated_current_game_or_code=lookForCodeInPrecalculatedGames(codesPlayed[currentAttemptNumber-1], currentGameSize, previousNbOfPossibleCodes);
}
if ( (precalculated_current_game_or_code > 0)
|| ((precalculated_current_game_or_code==0) && (previousNbOfPossibleCodes <=nbOfCodesForSystematicEvaluation))
|| (previousNbOfPossibleCodes <=nbOfCodesForSystematicEvaluation) ) {
if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (1): "+previousNbOfPossibleCodes+", "+ nbOfCodesForSystematicEvaluation_ForMemAlloc);
}
if (precalculated_current_game_or_code > 0) {
if (performanceListsInitDone) {
throw new Error("NEW_ATTEMPT phase / inconsistent game precalculation");
}
if (!performanceListsInitDoneForPrecalculatedGames) {
performanceListsInitDoneForPrecalculatedGames=true;
arraySizeAtInit=Math.ceil((3*previousNbOfPossibleCodes+nbOfCodesForSystematicEvaluation_ForMemAlloc)/4);
listOfGlobalPerformances=new Array(arraySizeAtInit);
maxDepthApplied=1;
listsOfPossibleCodes=undefined;
listsOfPossibleCodes=new3DArray(maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor);
nbOfPossibleCodes=undefined;
nbOfPossibleCodes=new2DArray(maxDepthApplied, nbMaxMarks);
listOfClassesFirstCall=new Array(arraySizeAtInit);
listOfEquivalentCodesAndPerformances=undefined;
listOfEquivalentCodesAndPerformances=new2DArray(maxDepthApplied, arraySizeAtInit);
for (let idx1=0;idx1 < maxDepthApplied;idx1++) {
for (let idx2=0;idx2 < arraySizeAtInit;idx2++) {
listOfEquivalentCodesAndPerformances[idx1][idx2]={equiv_code:0, equiv_sum:PerformanceNA};
}
}
if ((marks_already_computed_table==null)||(marks_already_computed_table.length!=marks_optimization_mask+1)) {
throw new Error("NEW_ATTEMPT phase / inconsistent marks_already_computed_table (1)");
}
}
}
else if ( ((precalculated_current_game_or_code==0) && (previousNbOfPossibleCodes <=nbOfCodesForSystematicEvaluation))
|| (previousNbOfPossibleCodes <=nbOfCodesForSystematicEvaluation) ) {
if (precalculated_current_game_or_code > 0) {
throw new Error("NEW_ATTEMPT phase / internal error (precalculated_current_game_or_code)");
}
if (!performanceListsInitDone) {
performanceListsInitDone=true;
arraySizeAtInit=Math.ceil((3*previousNbOfPossibleCodes+nbOfCodesForSystematicEvaluation)/4);
listOfGlobalPerformances=new Array(arraySizeAtInit);
maxDepthApplied=maxDepth;
listsOfPossibleCodes=undefined;
listsOfPossibleCodes=new3DArray(maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor);
nbOfPossibleCodes=undefined;
nbOfPossibleCodes=new2DArray(maxDepthApplied, nbMaxMarks);
listOfClassesFirstCall=new Array(arraySizeAtInit);
listOfEquivalentCodesAndPerformances=undefined;
listOfEquivalentCodesAndPerformances=new2DArray(maxDepthApplied, arraySizeAtInit);
for (let idx1=0;idx1 < maxDepthApplied;idx1++) {
for (let idx2=0;idx2 < arraySizeAtInit;idx2++) {
listOfEquivalentCodesAndPerformances[idx1][idx2]={equiv_code:0, equiv_sum:PerformanceNA};
}
}
if ((marks_already_computed_table==null)||(marks_already_computed_table.length!=marks_optimization_mask+1)) {
throw new Error("NEW_ATTEMPT phase / inconsistent marks_already_computed_table (2)");
}
}
}
else {
throw new Error("NEW_ATTEMPT phase / inconsistent performance evaluation case");
}
for (let i=0;i < arraySizeAtInit;i++) {
listOfGlobalPerformances[i]=PerformanceNA;
}
for (let i=0;i < maxDepthApplied;i++) {
for (let j=0;j < nbMaxMarks;j++) {
nbOfPossibleCodes[i][j]=0;
}
}
let code_played_global_performance=PerformanceNA;
let index=(currentAttemptNumber%2);
if (0==isAttemptPossibleinGameSolver(currentAttemptNumber)) {
let startTime=(new Date()).getTime();
best_global_performance=evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, 0 /* empty code */, precalculated_current_game_or_code);
if (best_global_performance!=PerformanceUNKNOWN) {
let code_played_found=false;
for (let i=0;i < previousNbOfPossibleCodes;i++) {
if ( (possibleCodesForPerfEvaluation[index][i]==codesPlayed[currentAttemptNumber-1]) && (listOfGlobalPerformances[i]!=PerformanceNA) ) {
code_played_global_performance=listOfGlobalPerformances[i];
code_played_found=true;
break;
}
}
if (!code_played_found) {
throw new Error("NEW_ATTEMPT phase / performance of possible code played was not evaluated ("+codeHandler.codeToString(codesPlayed[currentAttemptNumber-1])+", "+currentAttemptNumber+")");
}
console.log("(perfeval#1: best performance: "+best_global_performance
+ " / code performance: "+code_played_global_performance
+ " / "+((new Date()).getTime() - startTime)+"ms / "+previousNbOfPossibleCodes+((previousNbOfPossibleCodes > 1) ? " codes" : " code")+" / "+currentNbClasses+((currentNbClasses > 1) ? " classes" : " class")
+ ((precalculated_current_game_or_code >=0) ? ((precalculated_current_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "")+")");
}
else {
console.log("(perfeval#1 failed in "+((new Date()).getTime() - startTime)+"ms / "+previousNbOfPossibleCodes+((previousNbOfPossibleCodes > 1) ? " codes" : " code")+" / "+currentNbClasses+((currentNbClasses > 1) ? " classes" : " class")+")");
}
}
else {
let startTime=(new Date()).getTime();
best_global_performance=evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, codesPlayed[currentAttemptNumber-1], precalculated_current_game_or_code);
if (best_global_performance!=PerformanceUNKNOWN) {
if ((particularCodeGlobalPerformance==PerformanceNA)||(particularCodeGlobalPerformance==PerformanceUNKNOWN)||(particularCodeGlobalPerformance <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid particularCodeGlobalPerformance: "+particularCodeGlobalPerformance);
}
code_played_global_performance=particularCodeGlobalPerformance;
console.log("(perfeval#2: best performance: "+best_global_performance
+ " / code performance: "+particularCodeGlobalPerformance
+ " / "+((new Date()).getTime() - startTime)+"ms / "+previousNbOfPossibleCodes+((previousNbOfPossibleCodes > 1) ? " codes" : " code")+" / "+currentNbClasses+((currentNbClasses > 1) ? " classes" : " class")
+ ((precalculated_current_game_or_code >=0) ? ((precalculated_current_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "")+")");
}
else {
console.log("(perfeval#2 failed in "+((new Date()).getTime() - startTime)+"ms / "+previousNbOfPossibleCodes+((previousNbOfPossibleCodes > 1) ? " codes" : " code")+" / "+currentNbClasses+((currentNbClasses > 1) ? " classes" : " class")+")");
}
}
if (best_global_performance!=PerformanceUNKNOWN) {
if ((best_global_performance==PerformanceNA)||(best_global_performance <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid best_global_performance: "+best_global_performance);
}
for (let i=0;i < previousNbOfPossibleCodes;i++) {
let global_performance=listOfGlobalPerformances[i];
if ( (global_performance==PerformanceNA)||(global_performance==PerformanceUNKNOWN)||(global_performance <=0.01) ) {
throw new Error("invalid global performance in listOfGlobalPerformances (1): "+global_performance+", "+best_global_performance+", "+previousNbOfPossibleCodes+", "+i);
}
if ( (best_global_performance - global_performance < (PerformanceMinValidValue-1)/2)||(best_global_performance - global_performance >=+0.0001) ) {
throw new Error("invalid global performance in listOfGlobalPerformances (2): "+global_performance+", "+best_global_performance+", "+previousNbOfPossibleCodes+", "+i);
}
}
if ((code_played_global_performance==PerformanceNA)||(code_played_global_performance==PerformanceUNKNOWN)||(code_played_global_performance <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid code_played_global_performance: "+code_played_global_performance);
}
code_played_relative_perf=best_global_performance - code_played_global_performance;
if ( (code_played_relative_perf < PerformanceMinValidValue)||(code_played_relative_perf > PerformanceMaxValidValue) ) {
throw new Error("NEW_ATTEMPT phase / invalid relative performance: "+code_played_relative_perf+", "+best_global_performance+", "+code_played_global_performance);
}
relative_perf_evaluation_done=true;
}
else {
best_global_performance=PerformanceUNKNOWN;
code_played_relative_perf=PerformanceUNKNOWN;
relative_perf_evaluation_done=false;
}
if (listOfGlobalPerformances.length!=arraySizeAtInit) {
throw new Error("NEW_ATTEMPT phase / listOfGlobalPerformances allocation was modified");
}
if (!check3DArraySizes(listsOfPossibleCodes, maxDepthApplied, nbMaxMarks, arraySizeAtInit, mem_reduc_factor)) {
throw new Error("NEW_ATTEMPT phase / listsOfPossibleCodes allocation was modified");
}
if (!check2DArraySizes(nbOfPossibleCodes, maxDepthApplied, nbMaxMarks)) {
throw new Error("NEW_ATTEMPT phase / nbOfPossibleCodes allocation was modified");
}
if (currentGame.length!=nbMaxAttempts+maxDepth) {
throw new Error("NEW_ATTEMPT phase / currentGame allocation was modified");
}
if (marksIdxs.length!=nbMaxAttempts+maxDepth) {
throw new Error("NEW_ATTEMPT phase / marksIdxs allocation was modified");
}
if (listOfClassesFirstCall.length!=arraySizeAtInit) {
throw new Error("NEW_ATTEMPT phase / listOfClassesFirstCall allocation was modified");
}
if (!check2DArraySizes(listOfEquivalentCodesAndPerformances, maxDepthApplied, arraySizeAtInit)) {
throw new Error("NEW_ATTEMPT phase / listOfEquivalentCodesAndPerformances allocation was modified");
}
if (current_permutations_table_size.length!=overallNbMaxAttempts+overallMaxDepth) {
throw new Error("NEW_ATTEMPT phase / current_permutations_table_size allocation was modified");
}
if (!check2DArraySizes(current_permutations_table, overallNbMaxAttempts+overallMaxDepth, current_permutations_table_size[0])) {
throw new Error("NEW_ATTEMPT phase / current_permutations_table allocation was modified");
}
if (code_colors.length!=nbMaxColumns) {
throw new Error("NEW_ATTEMPT phase / code_colors allocation was modified");
}
if (other_code_colors.length!=nbMaxColumns) {
throw new Error("NEW_ATTEMPT phase / other_code_colors allocation was modified");
}
if ( (!check2DArraySizes(current_game_code_colors, overallNbMaxAttempts+overallMaxDepth, nbMaxColumns))
|| (current_game_code_colors.size < currentGame.length) ) {
throw new Error("NEW_ATTEMPT phase / current_game_code_colors allocation was modified or is invalid");
}
if ( (!check2DArraySizes(other_game_code_colors, overallNbMaxAttempts+overallMaxDepth, nbMaxColumns))
|| (other_game_code_colors.size < currentGame.length) ) {
throw new Error("NEW_ATTEMPT phase / other_game_code_colors allocation was modified or is invalid");
}
if (permuted_other_code_colors.length!=nbMaxColumns) {
throw new Error("NEW_ATTEMPT phase / permuted_other_code_colors allocation was modified");
}
if (partial_bijection.length!=nbMaxColors+1) {
throw new Error("NEW_ATTEMPT phase / partial_bijection allocation was modified");
}
if ( (currentGameForGamePrecalculation.length!=maxDepthForGamePrecalculation_ForMemAlloc)
|| (marksIdxsForGamePrecalculation.length!=maxDepthForGamePrecalculation_ForMemAlloc) ) {
throw new Error("NEW_ATTEMPT phase / currentGameForGamePrecalculation or marksIdxsForGamePrecalculation allocation was modified");
}
}
else {
best_global_performance=PerformanceUNKNOWN;
code_played_relative_perf=PerformanceUNKNOWN;
relative_perf_evaluation_done=false;
}
}
if (best_global_performance==PerformanceNA) {
throw new Error("NEW_ATTEMPT phase / best_global_performance is NA");
}
if (code_played_relative_perf==PerformanceNA) {
throw new Error("NEW_ATTEMPT phase / code_played_relative_perf is NA");
}
self.postMessage({'rsp_type': 'CODE_PLAYED_PERFORMANCE', 'relative_perf_p': code_played_relative_perf, 'best_global_performance_p': best_global_performance, 'relative_perf_evaluation_done_p': relative_perf_evaluation_done, 'code_p': codesPlayed[currentAttemptNumber-1], 'attempt_nb': currentAttemptNumber, 'game_id': game_id});
if (nbMaxPossibleCodesShown > nbOfCodesForSystematicEvaluation) {
throw new Error("NEW_ATTEMPT phase / inconsistent numbers of listed codes: "+nbMaxPossibleCodesShown+" > "+nbOfCodesForSystematicEvaluation);
}
let nb_codes_shown=Math.min(previousNbOfPossibleCodes, nbMaxPossibleCodesShown);
if (nb_codes_shown > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
throw new Error("NEW_ATTEMPT phase / inconsistent nb_codes_shown or nbOfCodesForSystematicEvaluation_ForMemAlloc value: "+nb_codes_shown+", "+ nbOfCodesForSystematicEvaluation_ForMemAlloc);
}
let current_possible_code_list=possibleCodesForPerfEvaluation[currentAttemptNumber%2];
if ((currentAttemptNumber==1) && (nbColumns==4)) {
if (nb_codes_shown <=5) {
throw new Error("NEW_ATTEMPT phase / internal error (nb_codes_shown)");
}
if (previousNbOfPossibleCodes!=initialNbPossibleCodes) {
throw new Error("NEW_ATTEMPT phase / internal error (previousNbOfPossibleCodes)");
}
if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (2): "+previousNbOfPossibleCodes+", "+ nbOfCodesForSystematicEvaluation_ForMemAlloc);
}
possibleCodesShown[0]=codeHandler.uncompressStringToCode("1233");
possibleCodesShown[1]=codeHandler.uncompressStringToCode("1234");
possibleCodesShown[2]=codeHandler.uncompressStringToCode("1122");
possibleCodesShown[3]=codeHandler.uncompressStringToCode("1222");
possibleCodesShown[4]=codeHandler.uncompressStringToCode("1111");
for (let i=0;i < 5;i++) {
if (best_global_performance==PerformanceUNKNOWN) {
globalPerformancesShown[i]=PerformanceUNKNOWN;
}
else {
let simple_code_found=false;
for (let j=0;j < previousNbOfPossibleCodes;j++) {
if (possibleCodesShown[i]==current_possible_code_list[j]) {
if ((listOfGlobalPerformances[j]==PerformanceNA)||(listOfGlobalPerformances[j]==PerformanceUNKNOWN)||(listOfGlobalPerformances[j] <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (1) (index "+i+")");
}
globalPerformancesShown[i]=listOfGlobalPerformances[j];
simple_code_found=true;
break;
}
}
if (!simple_code_found) {
throw new Error("NEW_ATTEMPT phase / internal error (simple_code_found)");
}
}
}
let cnt=5;
for (let i=0;i < previousNbOfPossibleCodes;i++) {
let simple_code_already_present=false;
for (let j=0;j < 5;j++) {
if (current_possible_code_list[i]==possibleCodesShown[j]) {
simple_code_already_present=true;
break;
}
}
if (!simple_code_already_present) {
possibleCodesShown[cnt]=current_possible_code_list[i];
if (best_global_performance==PerformanceUNKNOWN) {
globalPerformancesShown[cnt]=PerformanceUNKNOWN;
}
else {
if ((listOfGlobalPerformances[i]==PerformanceNA)||(listOfGlobalPerformances[i]==PerformanceUNKNOWN)||(listOfGlobalPerformances[i] <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (2) (index "+i+")");
}
globalPerformancesShown[cnt]=listOfGlobalPerformances[i];
}
cnt++;
if (cnt==nb_codes_shown) {
break;
}
}
}
}
else if ((currentAttemptNumber==1) && (nbColumns==5)) {
if (nb_codes_shown <=7) {
throw new Error("NEW_ATTEMPT phase / internal error (nb_codes_shown)");
}
if (previousNbOfPossibleCodes!=initialNbPossibleCodes) {
throw new Error("NEW_ATTEMPT phase / internal error (previousNbOfPossibleCodes)");
}
if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (3): "+previousNbOfPossibleCodes+", "+ nbOfCodesForSystematicEvaluation_ForMemAlloc);
}
possibleCodesShown[0]=codeHandler.uncompressStringToCode("12233");
possibleCodesShown[1]=codeHandler.uncompressStringToCode("12344");
possibleCodesShown[2]=codeHandler.uncompressStringToCode("12345");
possibleCodesShown[3]=codeHandler.uncompressStringToCode("12333");
possibleCodesShown[4]=codeHandler.uncompressStringToCode("11222");
possibleCodesShown[5]=codeHandler.uncompressStringToCode("12222");
possibleCodesShown[6]=codeHandler.uncompressStringToCode("11111");
for (let i=0;i < 7;i++) {
if (best_global_performance==PerformanceUNKNOWN) {
globalPerformancesShown[i]=PerformanceUNKNOWN;
}
else {
let simple_code_found=false;
for (let j=0;j < previousNbOfPossibleCodes;j++) {
if (possibleCodesShown[i]==current_possible_code_list[j]) {
if ((listOfGlobalPerformances[j]==PerformanceNA)||(listOfGlobalPerformances[j]==PerformanceUNKNOWN)||(listOfGlobalPerformances[j] <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (3) (index "+i+")");
}
globalPerformancesShown[i]=listOfGlobalPerformances[j];
simple_code_found=true;
break;
}
}
if (!simple_code_found) {
throw new Error("NEW_ATTEMPT phase / internal error (simple_code_found)");
}
}
}
let cnt=7;
for (let i=0;i < previousNbOfPossibleCodes;i++) {
let simple_code_already_present=false;
for (let j=0;j < 7;j++) {
if (current_possible_code_list[i]==possibleCodesShown[j]) {
simple_code_already_present=true;
break;
}
}
if (!simple_code_already_present) {
possibleCodesShown[cnt]=current_possible_code_list[i];
if (best_global_performance==PerformanceUNKNOWN) {
globalPerformancesShown[cnt]=PerformanceUNKNOWN;
}
else {
if ((listOfGlobalPerformances[i]==PerformanceNA)||(listOfGlobalPerformances[i]==PerformanceUNKNOWN)||(listOfGlobalPerformances[i] <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (4) (index "+i+")");
}
globalPerformancesShown[cnt]=listOfGlobalPerformances[i];
}
cnt++;
if (cnt==nb_codes_shown) {
break;
}
}
}
}
else {
for (let i=0;i < nb_codes_shown;i++) {
possibleCodesShown[i]=current_possible_code_list[i];
if (best_global_performance==PerformanceUNKNOWN) {
globalPerformancesShown[i]=PerformanceUNKNOWN;
}
else {
if ((listOfGlobalPerformances[i]==PerformanceNA)||(listOfGlobalPerformances[i]==PerformanceUNKNOWN)||(listOfGlobalPerformances[i] <=0.01)) {
throw new Error("NEW_ATTEMPT phase / invalid listOfGlobalPerformances (5) (index "+i+")");
}
globalPerformancesShown[i]=listOfGlobalPerformances[i];
}
}
}
self.postMessage({'rsp_type': 'LIST_OF_POSSIBLE_CODES', 'possibleCodesList_p': possibleCodesShown.toString(), 'nb_possible_codes_listed': nb_codes_shown, 'globalPerformancesList_p': globalPerformancesShown.toString(), 'attempt_nb': currentAttemptNumber, 'game_id': game_id});
if ( (possibleCodesForPerfEvaluation[0].length!=nbOfCodesForSystematicEvaluation_ForMemAlloc)
|| (possibleCodesForPerfEvaluation[1].length!=nbOfCodesForSystematicEvaluation_ForMemAlloc) ) {
throw new Error("inconsistent possibleCodesForPerfEvaluation length: "+possibleCodesForPerfEvaluation[0].length+", "+possibleCodesForPerfEvaluation[1].length+", "+nbOfCodesForSystematicEvaluation_ForMemAlloc);
}
}
else {
throw new Error("unexpected req_type: "+data.req_type);
}
message_processing_ongoing=false;
}
catch (exc) {
abort_worker_process=true;
throw new Error("gameSolver internal error (message): "+exc+": "+exc.stack);
}
}, false);
}
catch (exc) {
abort_worker_process=true;
throw new Error("gameSolver internal error (global): "+exc+": "+exc.stack);
}
