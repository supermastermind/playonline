
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

  let abort_worker_process = false;

  // Performance-related variables
  // *****************************

  let baseOfMaxPerformanceEvaluationTime = 30000; // 30 seconds / much higher in (precalculation mode)
  let maxPerformanceEvaluationTime = -1;

  let refNbOfCodesForSystematicEvaluation = 1500; // (high values may induce latencies)
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
  let PerformanceMaxValidValue = +1.30; // (a valid relative performance can be > 0.00 in some rare (impossible code) cases - duplicated in SuperMasterMind.js) / Some values observed: +0.94 for 5-colmuns game {4B0W 11223; 11456}, +1.04 for 6-colmuns game {5B0W 112234; 112567}

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

  let minNbCodesForPrecalculation = 270;
  let nbCodesForPrecalculationThreshold = Math.max(refNbOfCodesForSystematicEvaluation, minNbCodesForPrecalculation); // (shall be in [minNbCodesForPrecalculation, refNbOfCodesForSystematicEvaluation])

  let maxDepthForGamePrecalculation = -1; // (-1 or 3)
  let maxDepthForGamePrecalculation_ForMemAlloc = 10;
  let currentGameForGamePrecalculation = new Array(maxDepthForGamePrecalculation_ForMemAlloc);
  currentGameForGamePrecalculation.fill(0); /* empty code */
  let marksIdxsForGamePrecalculation = new Array(maxDepthForGamePrecalculation_ForMemAlloc);
  marksIdxsForGamePrecalculation.fill(-1);

  let precalculation_mode_mark = {nbBlacks:0, nbWhites:0};

  // ***************************************************************************************************************
  // Precalculated table for 4 columns
  // for minNbCodesForPrecalculation = 300, nbCodesForPrecalculationThreshold = 1296, precalculation_time >= 3.5 sec
  // ***************************************************************************************************************

  let precalculated_games_4columns =
    "0||N:1296|1111:13C7,1112:11C8,1122:1168,1123:110C,1234:115F.";

  // ***************************************************************************************************************
  // Precalculated table for 5 columns
  // ***************************************************************************************************************

  let precalculated_games_5columns =

    "1|11111:2B0W|N:3430|11222:3729,11223:336B,11234:32AB,11112:39B9,11122:3757,11123:34C7,12222:3896,12223:3407,12233:332C,12234:322A,12345:3218,22222:3BA2,22223:364A,22233:34B3,22234:33A9,22334:32C6,22345:329A,23456:3332." +
    "1|11111:1B0W|N:12005|12222:D2F7,12223:C5F8,12233:C277,12234:C1BF,12345:C394,11112:D7AB,11122:CE0C,11123:C8A5,11222:CD81,11223:C39F,11234:C325,22222:DFAE,22223:CD3D,22233:C783,22234:C56E,22334:C2F9,22345:C377,23456:C649." +
    "1|11111:0B0W|N:16807|22222:1362C,22223:11D1C,22233:1149F,22234:112BB,22334:10F57,22345:1109B,23456:11503." +

    "1|11112:3B0W|N:438|11133:637,11134:5B9,11222:66D,11232:5C9,11332:61F,11342:5B0,11111:750,11113:6B5,11121:6FF,11122:6BE,11123:659,11131:665,11132:689,11221:699,11223:5C5,11231:647,11233:5F7,11234:587,11331:619,11333:640,11334:59A,11341:598,11343:59B,11345:54C,12221:68C,12222:68C,12223:5D6,12231:5DB,12232:5C4,12233:5B6,12234:55C,12331:60E,12332:5B4,12333:60F,12334:57B,12341:5A6,12342:560,12343:577,12345:53C,13331:656,13332:63A,13333:65C,13334:5B6,13341:5B5,13342:594,13343:5B3,13344:58F,13345:548,13451:569,13452:558,13453:548,13456:531,22221:6CD,22222:6CD,22223:623,22231:60B,22232:60E,22233:5E6,22234:58F,22331:5F1,22332:5E3,22333:5F4,22334:57A,22341:59E,22342:587,22343:57A,22345:54B,23331:652,23332:5FC,23333:658,23334:5BB,23341:5B8,23342:579,23343:5AE,23344:594,23345:55D,23451:586,23452:559,23453:560,23456:550,33331:6A6,33332:689,33333:6AC,33334:5F7,33341:5ED,33342:5D4,33343:5ED,33344:5CA,33345:577,33441:5CF,33442:5B3,33443:5CD,33445:568,33451:585,33452:568,33453:580,33454:569,33456:54D,34561:578,34562:558,34563:562,34567:572." +
    "1|11112:2B1W|N:684|11223:912,11233:910,11234:87F,11331:935,11341:897,11111:AF9,11113:A17,11121:AAD,11122:A7D,11123:9C2,11131:99F,11132:9E9,11133:95D,11134:8DD,11221:A43,11222:A23,11231:980,11232:90A,11332:92D,11333:96B,11334:89B,11342:89B,11343:892,11345:835,12221:A5E,12222:A5E,12223:94C,12231:923,12232:927,12233:8EA,12234:860,12331:927,12332:8F2,12333:92F,12334:86D,12341:88B,12342:86E,12343:867,12345:808,13331:97E,13332:969,13333:9A9,13334:8D4,13341:8A0,13342:89C,13343:8C2,13344:897,13345:84C,13451:850,13452:857,13453:846,13456:839,22221:AC0,22222:AC0,22223:9CC,22231:987,22232:97B,22233:93F,22234:8B4,22331:921,22332:924,22333:924,22334:86E,22341:89B,22342:89F,22343:86D,22345:81B,23331:97E,23332:93F,23333:984,23334:8B9,23341:89A,23342:882,23343:8AA,23344:87F,23345:831,23451:85D,23452:855,23453:833,23456:829,33331:9CF,33332:9CF,33333:A17,33334:93C,33341:8E8,33342:8EE,33343:928,33344:8F2,33345:89F,33441:8BB,33442:8C4,33443:8E6,33445:887,33451:873,33452:88D,33453:892,33454:878,33456:86F,34561:883,34562:89B,34563:875,34567:8B6." +
    "1|11112:2B0W|N:2668|11333:27A5,11334:2544,11343:2529,11345:24B6,12222:2AB1,12232:273F,12332:26C8,12342:25C7,13332:2893,13342:25EE,13452:258B,11111:2E9D,11113:2B1E,11121:2CD6,11122:2BFE,11123:2956,11131:295A,11132:2A20,11133:2864,11134:26CC,11221:2B18,11222:2ADF,11223:27D1,11231:28E0,11232:27EA,11233:27E8,11234:2655,11331:27C9,11332:288D,11341:262A,11342:26EA,12221:2B8B,12223:279D,12231:2840,12233:26AD,12234:25AA,12331:2867,12333:27BC,12334:257B,12341:26B5,12343:257C,12345:2525,13331:283A,13333:291B,13334:2634,13341:258E,13343:25F8,13344:2558,13345:24B8,13451:2522,13453:24BA,13456:24BB,22221:2CAB,22222:2CAB,22223:2964,22231:28D4,22232:2885,22233:27AB,22234:26B5,22331:27FD,22332:278F,22333:27BB,22334:25FE,22341:2700,22342:2656,22343:25EF,22345:256E,23331:293D,23332:27F3,23333:295B,23334:26AC,23341:26B6,23342:25DF,23343:2651,23344:25CF,23345:253E,23451:2655,23452:258C,23453:2540,23456:2546,33331:2AA2,33332:2A97,33333:2B28,33334:27AA,33341:2742,33342:26EA,33343:273B,33344:2672,33345:25A3,33441:268F,33442:263C,33443:264F,33445:2514,33451:25DB,33452:2571,33453:258C,33454:24FE,33456:24E1,34561:25DD,34562:256D,34563:24E7,34567:2551." +
    "1|11112:1B2W|N:508|12221:7B1,12231:6E0,12331:729,12341:6AF,11113:829,11121:834,11122:7C7,11123:77E,11131:7A5,11132:7A5,11133:776,11134:702,11221:7C3,11222:7AD,11223:6F9,11231:74F,11232:6DE,11233:71A,11234:698,11331:74D,11332:74D,11333:74D,11334:6A3,11341:6BD,11342:6BD,11343:693,11345:650,12222:7B2,12223:6F2,12232:6D0,12233:6B9,12234:64A,12332:6C9,12333:72A,12334:68A,12342:664,12343:683,12345:645,13331:776,13332:776,13333:776,13334:6D9,13341:6BC,13342:6BC,13343:6BC,13344:69D,13345:659,13451:673,13452:673,13453:65C,13456:651,22221:844,22222:844,22223:7AB,22231:727,22232:727,22233:6F9,22234:69C,22331:6DD,22332:6D0,22333:6DD,22334:656,22341:66E,22342:662,22343:64E,22345:629,23331:77E,23332:709,23333:77E,23334:6D5,23341:6BA,23342:673,23343:6BA,23344:69C,23345:65D,23451:67B,23452:64D,23453:663,23456:651,33331:801,33332:801,33333:801,33334:77B,33341:722,33342:722,33343:722,33344:705,33345:6C2,33441:6F8,33442:6F8,33443:6F8,33445:69D,33451:6A7,33452:6A7,33453:6A7,33454:693,33456:682,34561:69F,34562:69F,34563:690,34567:6A8." +
    "1|11112:1B1W|N:3912|12223:3AC6,12233:3917,12234:37B4,12333:3AB3,12334:37E8,12343:37BC,12345:377E,13331:3C26,13341:38CF,13451:386F,11111:4562,11113:4111,11121:420E,11122:4078,11123:3D6D,11131:3DA7,11132:3EE0,11133:3C61,11134:3A66,11221:3F87,11222:3F61,11223:3AE4,11231:3C74,11232:3B19,11233:3B38,11234:391E,11331:3B6F,11332:3C61,11333:3B3D,11334:381D,11341:393F,11342:3A2B,11343:3803,11345:3773,12221:4053,12222:3F49,12231:3B2D,12232:3A33,12331:3B92,12332:396B,12341:3984,12342:3837,13332:3C20,13333:3D60,13334:3989,13342:38E5,13343:3933,13344:3833,13345:37AB,13452:38A2,13453:3790,13456:37E2,22221:439A,22222:439A,22223:3E89,22231:3C5F,22232:3C5A,22233:3AF3,22234:3989,22331:3A15,22332:3A45,22333:3A40,22334:37E4,22341:38E3,22342:38FD,22343:37CD,22345:3777,23331:3C44,23332:3AE5,23333:3CE0,23334:3964,23341:38E9,23342:3889,23343:390A,23344:3820,23345:37B6,23451:38AC,23452:3855,23453:37A6,23456:380B,33331:3F36,33332:3F36,33333:418A,33334:3CB1,33341:3A95,33342:3AD7,33343:3BE8,33344:3A3D,33345:398B,33441:3981,33442:39B2,33443:3A28,33445:38B5,33451:38E8,33452:3942,33453:3936,33454:386D,33456:387F,34561:3988,34562:39F7,34563:3882,34567:3957." +
    "1|11112:1B0W|N:7585|13333:794D,13334:72C0,13343:7237,13344:7073,13345:7047,13453:7042,13456:7191,22222:8719,22232:7C46,22332:78C7,22342:768A,23332:798C,23342:7421,23452:7457,33332:7EF9,33342:75B7,33442:73FE,33452:72E6,34562:7418,11111:8B14,11113:80BD,11121:8752,11122:8600,11123:7D1F,11131:7D2A,11132:7F40,11133:7938,11134:76A2,11221:83B6,11222:82EC,11223:7A85,11231:7C3F,11232:7A9A,11233:7864,11234:75CE,11331:7819,11332:7944,11333:77A1,11334:7271,11341:757A,11342:7688,11343:723F,11345:7298,12221:8511,12222:8389,12223:7B82,12231:7BE1,12232:79D7,12233:77B8,12234:75E9,12331:79A8,12332:7733,12333:7911,12334:73B4,12341:7722,12342:7565,12343:7360,12345:73DA,13331:78B8,13332:797F,13341:7316,13342:739A,13451:739C,13452:73DA,22221:898C,22223:7DB6,22231:7ECF,22233:7926,22234:7720,22331:7ADD,22333:78E1,22334:7412,22341:7919,22343:73D5,22345:7400,23331:7C8C,23333:7BD4,23334:751A,23341:763C,23343:7488,23344:732E,23345:7268,23451:7678,23453:7263,23456:7344,33331:7D17,33333:8230,33334:782B,33341:7477,33343:770C,33344:73F0,33345:72F4,33441:72A9,33443:73B5,33445:7188,33451:7213,33453:7298,33454:7125,33456:71D9,34561:73B1,34563:71C8,34567:73E1." +
    "1|11112:0B2W|N:1105|22221:124B,22231:100D,22331:F9B,22341:EF4,23331:10A1,23341:F38,23451:EF9,11113:11F2,11121:129D,11122:11B5,11123:113B,11131:11A4,11132:11A4,11133:1148,11134:10AD,11221:1165,11222:1149,11223:101F,11231:1102,11232:103F,11233:10A4,11234:FF0,11331:111E,11332:111E,11333:110E,11334:1006,11341:1054,11342:1054,11343:FEC,11345:FAB,12221:1191,12222:118B,12223:1038,12231:FF7,12232:FD2,12233:F97,12234:F1D,12331:108D,12332:FC2,12333:107C,12334:F63,12341:FC2,12342:F36,12343:F4F,12345:F15,13331:1135,13332:1135,13333:1135,13334:1006,13341:FBE,13342:FBE,13343:FB1,13344:F69,13345:F1E,13451:F7B,13452:F7B,13453:F25,13456:F1E,22222:124C,22223:10E2,22232:1009,22233:FAC,22234:F2A,22332:F7C,22333:F8A,22334:E9B,22342:ECF,22343:E9E,22345:E6E,23332:FBE,23333:10A2,23334:F60,23342:EC2,23343:F2C,23344:EE3,23345:E91,23452:E93,23453:E9B,23456:E97,33331:1191,33332:1191,33333:1191,33334:1050,33341:FC4,33342:FC4,33343:FC4,33344:F72,33345:F07,33441:F6B,33442:F6B,33443:F5E,33445:EBD,33451:EF9,33452:EF9,33453:EEE,33454:EB7,33456:EA6,34561:F00,34562:F00,34563:EB5,34567:EE6." +
    "1|11112:0B1W|N:7926|22223:8269,22233:7B3E,22234:7961,22333:7A54,22334:7645,22343:7619,22345:7655,23333:7FC5,23334:78A3,23343:7820,23344:7620,23345:760B,23453:75F9,23456:77B2,33331:84BD,33341:7B42,33441:78ED,33451:7841,34561:79A4,11111:9225,11113:888E,11121:8EDC,11122:8B55,11123:857E,11131:8749,11132:89CF,11133:8366,11134:80D6,11221:8912,11222:8890,11223:7FE8,11231:8418,11232:8207,11233:80EC,11234:7DF7,11331:830C,11332:84E5,11333:82A5,11334:7C6D,11341:8018,11342:8204,11343:7C27,11345:7BE6,12221:8AC2,12222:894B,12223:7F88,12231:7FE7,12232:7F31,12233:7BDD,12234:7A1F,12331:7FE9,12332:7DA2,12333:8065,12334:7A0D,12341:7CFB,12342:7C26,12343:79CB,12345:79FC,13331:82C3,13332:8478,13333:8389,13334:7B5F,13341:7BEF,13342:7D8D,13343:7AE5,13344:78F9,13345:7850,13451:7BE0,13452:7DA7,13453:7834,13456:795A,22221:8F71,22222:8CFF,22231:80FA,22232:7EF6,22331:7BD6,22332:7A32,22341:7A4B,22342:78A0,23331:7F7E,23332:7B40,23341:7927,23342:775E,23451:798F,23452:77FC,33332:836A,33333:88E6,33334:7E2D,33342:7B1B,33343:7D28,33344:7986,33345:789C,33442:78C6,33443:792A,33445:7707,33452:78B6,33453:782E,33454:767E,33456:7773,34562:7AB9,34563:7760,34567:79B9." +
    "1|11112:0B0W|N:7776|33333:83D5,33334:77CB,33343:77CB,33344:73D4,33345:730E,33443:73D4,33445:71D8,33453:730E,33454:71D8,33456:72D3,34563:72D3,34567:7649." +

    "1|11122:3B0W|N:412|11111:683,11113:5E2,11133:5D6,11134:565,11323:58B,11324:522,12222:629,12322:581,13322:59C,13422:53A,11112:680,11123:5E9,11211:651,11212:659,11213:5B2,11222:654,11223:5B9,11233:587,11234:51F,11311:5AD,11312:5B2,11313:590,11314:522,11322:5F1,11333:5A8,11334:513,11344:513,11345:4CE,12211:658,12212:62C,12213:5B0,12223:567,12233:571,12234:519,12311:59E,12312:5AE,12313:57A,12314:519,12323:56C,12324:50A,12333:5A3,12334:518,12344:51C,12345:4D9,13311:583,13312:57F,13313:597,13314:50D,13323:5A3,13324:517,13333:5DD,13334:540,13344:52F,13345:4E5,13411:51F,13412:517,13413:50C,13415:4CE,13423:517,13425:4D4,13433:543,13434:52C,13435:4E4,13455:4E6,13456:4D5,22211:659,22212:63D,22213:5A2,22222:65A,22223:59C,22233:58D,22234:535,22311:5CC,22312:588,22313:586,22314:538,22322:5A5,22323:56D,22324:50A,22333:59B,22334:523,22344:523,22345:4F0,23311:59E,23312:58E,23313:5BC,23314:542,23322:588,23323:599,23324:511,23333:5D4,23334:543,23344:52C,23345:4F9,23411:540,23412:52E,23413:539,23415:508,23422:522,23423:50D,23425:4CF,23433:53B,23434:52A,23435:4F4,23455:4F4,23456:4E8,33311:5C6,33312:5BC,33313:5F3,33314:566,33322:5D3,33323:5CB,33324:537,33333:60F,33334:56F,33344:55C,33345:513,33411:534,33412:52D,33413:55E,33414:542,33415:50C,33422:533,33423:52F,33424:512,33425:4D1,33433:56B,33434:551,33435:50B,33444:551,33445:4FE,33455:4FF,33456:4EF,34511:508,34512:4EE,34513:508,34516:4FA,34522:4FA,34523:4D2,34526:4CA,34533:50A,34534:4FD,34536:4EF,34566:4F2,34567:511." +
    "1|11122:2B1W|N:1026|11233:DD3,11234:D03,11311:E2A,11313:DA9,11314:CF0,12223:DA6,12323:D7E,12324:CB3,13312:DA6,13412:CEB,11111:1033,11112:FE6,11113:E64,11123:EBC,11133:E4C,11134:D75,11211:FB2,11212:FC9,11213:E1D,11222:FA3,11223:E31,11312:E11,11322:EA5,11323:DD0,11324:D13,11333:E09,11334:CFA,11344:CFE,11345:C91,12211:FED,12212:F68,12213:E29,12222:F7F,12233:D9C,12234:CBF,12311:E21,12312:E15,12313:DAE,12314:CE2,12322:DC7,12333:DF5,12334:CD1,12344:CCE,12345:C58,13311:DAE,13313:DE1,13314:CD6,13322:DC0,13323:DFC,13324:CE3,13333:E85,13334:D4B,13344:D26,13345:CAF,13411:CE5,13413:CD6,13415:C6D,13422:D05,13423:CD6,13425:C61,13433:D4C,13434:D16,13435:CA1,13455:CAC,13456:C95,22211:1046,22212:FB5,22213:E6D,22222:1021,22223:E2F,22233:E23,22234:D35,22311:EA3,22312:DD9,22313:DD3,22314:D11,22322:E3C,22323:D95,22324:CCF,22333:DF5,22334:CD1,22344:CD7,22345:C68,23311:DEF,23312:DA3,23313:E25,23314:D00,23322:DCA,23323:DC5,23324:CB9,23333:E64,23334:D2A,23344:CF9,23345:C90,23411:D34,23412:CDD,23413:CF7,23415:C82,23422:D0D,23423:CB0,23425:C40,23433:D26,23434:CF1,23435:C87,23455:C8F,23456:C8B,33311:E51,33312:E2C,33313:EA4,33314:D80,33322:E54,33323:E6C,33324:D4C,33333:F24,33334:DDD,33344:DAF,33345:D26,33411:D2D,33412:CF4,33413:D61,33414:D23,33415:CC8,33422:D16,33423:D32,33424:CF6,33425:C8F,33433:DD8,33434:D86,33435:D0B,33444:D83,33445:CEE,33455:CF5,33456:CEA,34511:CC3,34512:C8C,34513:CBD,34516:CBF,34522:CC8,34523:C88,34526:C89,34533:D0E,34534:CEC,34536:CE5,34566:CED,34567:D42." +
    "1|11122:2B0W|N:2287|11333:20EA,11334:1EF4,11344:1F0F,11345:1E99,13323:20CA,13324:1EDE,13423:1ECC,13425:1E7C,22222:256B,22322:222B,23322:2170,23422:2026,33322:220D,33422:1FC5,34522:1F53,11111:2603,11112:25F5,11113:22D6,11123:22CA,11133:21F2,11134:2097,11211:2537,11212:255C,11213:2210,11222:25AF,11223:2245,11233:213A,11234:2006,11311:21E6,11312:221A,11313:2102,11314:1FD4,11322:22FF,11323:213C,11324:200F,12211:25C7,12212:2501,12213:2287,12222:2489,12223:2154,12233:20FF,12234:1FE7,12311:224B,12312:2238,12313:2167,12314:2049,12322:21AF,12323:20C2,12324:1FB0,12333:20AE,12334:1ED2,12344:1EE6,12345:1E9F,13311:210F,13312:2124,13313:20DE,13314:1F05,13322:2146,13333:21A5,13334:1F4C,13344:1ED0,13345:1E44,13411:1FF5,13412:1FF7,13413:1EF5,13415:1EA2,13422:2019,13433:1F54,13434:1EBB,13435:1E34,13455:1E4A,13456:1E66,22211:26CC,22212:253C,22213:22DD,22223:21FB,22233:2172,22234:208F,22311:23A9,22312:221E,22313:21E4,22314:20F2,22323:20FA,22324:1FD6,22333:2171,22334:1FC1,22344:1FDD,22345:1F78,23311:224C,23312:218E,23313:21A1,23314:1FE9,23323:2132,23324:1F5D,23333:2210,23334:1FC2,23344:1F35,23345:1EDF,23411:2144,23412:2050,23413:1FD9,23415:1FA7,23423:1F4B,23425:1EE6,23433:1FAE,23434:1F36,23435:1ED2,23455:1ED9,23456:1F02,33311:21D0,33312:215E,33313:22A0,33314:201B,33323:21F1,33324:1FA1,33333:23CF,33334:20A6,33344:2001,33345:1F57,33411:1FD2,33412:1F5A,33413:2007,33414:1F6F,33415:1F02,33423:1F75,33424:1EE5,33425:1E6D,33433:209E,33434:1FD0,33435:1F35,33444:1FCC,33445:1EC5,33455:1EC5,33456:1EC2,34511:1FA8,34512:1F16,34513:1F15,34516:1F27,34523:1E67,34526:1E85,34533:1F2B,34534:1EC9,34536:1EC0,34566:1ED0,34567:1F4E." +
    "1|11122:1B2W|N:902|12233:BDB,12234:B32,12313:BCD,12314:B1D,13311:C1E,13411:B69,22212:DB4,22312:BFB,23312:BD4,23412:B26,11111:E43,11112:E0A,11113:CA4,11123:D08,11133:C85,11134:BD4,11211:DC0,11212:DB4,11213:C2D,11222:DB4,11223:C79,11233:C00,11234:B3D,11311:C88,11312:C6A,11313:BEA,11314:B47,11322:CDA,11323:C2A,11324:B87,11333:C3F,11334:B44,11344:B47,11345:AE4,12211:DF7,12212:D85,12213:C5D,12222:D85,12223:BFB,12311:C52,12312:C5B,12322:C09,12323:BD4,12324:B2A,12333:C25,12334:B2B,12344:B2B,12345:ACB,13312:BF3,13313:C13,13314:B28,13322:C1B,13323:C59,13324:B62,13333:CB5,13334:B97,13344:B6F,13345:B07,13412:B40,13413:B1E,13415:AB7,13422:B78,13423:B58,13425:B03,13433:B98,13434:B64,13435:B01,13455:B0A,13456:AFF,22211:E51,22213:C6D,22222:E16,22223:C95,22233:C47,22234:B9E,22311:CDF,22313:BD8,22314:B3B,22322:C59,22323:BE4,22324:B43,22333:C0A,22334:B26,22344:B2C,22345:AD3,23311:C2E,23313:C3B,23314:B44,23322:BF0,23323:C0F,23324:B2A,23333:C82,23334:B78,23344:B4F,23345:AF7,23411:B7B,23413:B3A,23415:AE1,23422:B3F,23423:B24,23425:ABE,23433:B75,23434:B3E,23435:AEC,23455:AF8,23456:AF2,33311:C90,33312:C7F,33313:CC7,33314:BC7,33322:C7E,33323:CC3,33324:BC5,33333:D4B,33334:C24,33344:BFD,33345:B8C,33411:B61,33412:B50,33413:B9D,33414:B69,33415:B16,33422:B76,33423:BA8,33424:B6F,33425:B2B,33433:C11,33434:BD0,33435:B6B,33444:BD0,33445:B53,33455:B5B,33456:B56,34511:B1C,34512:AF7,34513:B11,34516:B07,34522:B20,34523:B2A,34526:B28,34533:B6D,34534:B4B,34536:B4C,34566:B59,34567:BA2." +
    "1|11122:1B1W|N:4548|12333:4375,12334:4081,12344:40A2,12345:4023,13313:431D,13314:4008,13413:3FFB,13415:3F99,22223:4523,22323:4292,22324:40C6,23323:4303,23324:4012,23423:4000,23425:3F91,33312:4489,33412:4109,34512:40D4,11111:4D05,11112:4BBB,11113:4620,11123:47A2,11133:4470,11134:427A,11211:4A9B,11212:4B54,11213:4476,11222:4C04,11223:45D2,11233:4363,11234:4193,11311:456B,11312:44F3,11313:435A,11314:4159,11322:4884,11323:444B,11324:4277,11333:4331,11334:4013,11344:4041,11345:3FA7,12211:4CB5,12212:4A6D,12213:45C3,12222:49C4,12223:43D0,12233:436A,12234:418C,12311:44D7,12312:4581,12313:4334,12314:416E,12322:4456,12323:434B,12324:418E,13311:4367,13312:439A,13322:4457,13323:4372,13324:40C2,13333:4563,13334:4186,13344:40C0,13345:4002,13411:4180,13412:41B7,13422:4285,13423:4098,13425:4050,13433:4171,13434:40A3,13435:3FF4,13455:400E,13456:4043,22211:504A,22212:4AC5,22213:46B6,22222:4C38,22233:439D,22234:41BB,22311:4816,22312:443C,22313:4421,22314:424D,22322:449F,22333:42FD,22334:3FF4,22344:4018,22345:3F73,23311:4419,23312:4394,23313:4360,23314:40BA,23322:42B4,23333:4584,23334:4199,23344:40E3,23345:4027,23411:4248,23412:41C6,23413:4090,23415:4044,23422:4105,23433:418B,23434:40BE,23435:400B,23455:4025,23456:405C,33311:4431,33313:4598,33314:41BF,33322:443A,33323:45B2,33324:41F5,33333:4AC7,33334:4470,33344:436F,33345:423E,33411:40AC,33413:4184,33414:40AB,33415:402B,33422:40B4,33423:41BC,33424:40D0,33425:4044,33433:4459,33434:42F3,33435:41FB,33444:42F3,33445:413E,33455:4167,33456:4156,34511:409A,34513:4022,34516:4079,34522:40A3,34523:403A,34526:408C,34533:4205,34534:4134,34536:414B,34566:4173,34567:4239." +
    "1|11122:1B0W|N:6480|13333:6449,13334:5EE6,13344:5D8B,13345:5D5F,13433:5EFA,13434:5D9A,13435:5D36,13455:5D58,13456:5E72,33323:65DD,33324:5FF7,33423:5FB6,33424:5E62,33425:5DD6,34523:5DB3,34526:5E9F,11111:7201,11112:7363,11113:6909,11123:6A2D,11133:6570,11134:6328,11211:7187,11212:717E,11213:6876,11222:735F,11223:684A,11233:64D5,11234:62B8,11311:67A0,11312:6847,11313:641B,11314:61F9,11322:6A07,11323:6496,11324:627A,11333:63CD,11334:5F3A,11344:5F5B,11345:5F4E,12211:735F,12212:717E,12213:6A0F,12222:7187,12223:6864,12233:6624,12234:644D,12311:69F8,12312:6843,12313:661A,12314:641A,12322:686F,12323:649F,12324:62A0,12333:65A3,12334:60F1,12344:60E1,12345:6110,13311:6434,13312:64A1,13313:63AE,13314:5FBC,13322:64C3,13323:642C,13324:5FB3,13411:62C2,13412:62BB,13413:5FAB,13415:5FF7,13422:62BA,13423:5F98,13425:5FDC,22212:7363,22213:6D2D,22222:7201,22223:6928,22233:666F,22234:651F,22311:6D1B,22312:6A24,22313:68CA,22314:66DC,22322:6905,22323:6575,22324:638D,22333:6525,22334:6166,22344:617F,22345:619E,23311:68C3,23312:6632,23313:6855,23314:6367,23322:6590,23323:6510,23324:60B0,23333:6593,23334:602D,23344:5F04,23345:5EB5,23411:66E7,23412:645F,23413:6339,23415:6341,23422:6347,23423:607D,23425:6065,23433:601D,23434:5F0E,23435:5E7F,23455:5E95,23456:5F6A,33311:64FE,33312:65D4,33313:6585,33314:603E,33322:65F4,33333:6C29,33334:62E9,33344:6053,33345:5F75,33411:614B,33412:610E,33413:5FED,33414:5E8C,33415:5E92,33422:6083,33433:6299,33434:6032,33435:5F27,33444:6000,33445:5E2B,33455:5E0C,33456:5EBE,34511:61DC,34512:6168,34513:5E8D,34516:5FE3,34522:6078,34533:5F12,34534:5E0D,34536:5E76,34566:5E8C,34567:6079." +
    "1|11122:0B3W|N:336|22213:48B,22313:447,22314:3FE,23311:456,23411:40B,11111:533,11112:526,11113:4A5,11123:4B4,11133:493,11134:459,11211:50A,11212:512,11213:472,11222:51C,11223:4AC,11233:45C,11234:420,11311:4AC,11312:498,11313:473,11314:426,11322:4D1,11323:482,11324:44B,11333:486,11334:42F,11344:42E,11345:407,12211:52C,12212:503,12213:491,12222:503,12223:476,12233:468,12234:419,12311:47A,12312:492,12313:444,12314:3FF,12322:477,12323:457,12324:416,12333:47E,12334:40F,12344:414,12345:3E4,13311:486,13312:472,13313:473,13314:408,13322:485,13323:4A3,13324:440,13333:4AD,13334:43D,13344:425,13345:402,13411:430,13412:422,13413:400,13415:3D4,13422:43E,13423:438,13425:410,13433:433,13434:421,13435:3FC,13455:3F9,13456:3F6,22211:542,22212:514,22222:528,22223:4A4,22233:482,22234:42D,22311:4B1,22312:460,22322:477,22323:44E,22324:401,22333:466,22334:3F3,22344:3F4,22345:3BE,23312:446,23313:46B,23314:3F3,23322:451,23323:456,23324:3F1,23333:487,23334:40D,23344:3FE,23345:3CC,23412:3FF,23413:3F4,23415:3C3,23422:404,23423:3EF,23425:3C5,23433:40A,23434:3F7,23435:3C9,23455:3C9,23456:3C7,33311:493,33312:48C,33313:492,33314:41C,33322:493,33323:4B1,33324:445,33333:4BA,33334:443,33344:430,33345:3FF,33411:418,33412:413,33413:411,33414:3F8,33415:3CB,33422:41A,33423:434,33424:41F,33425:3FC,33433:437,33434:421,33435:3F2,33444:41F,33445:3EA,33455:3E5,33456:3E6,34511:3EE,34512:3E2,34513:3C8,34516:3C8,34522:3FC,34523:3F7,34526:3F2,34533:3ED,34534:3E6,34536:3E1,34566:3E1,34567:407." +
    "1|11122:0B2W|N:2196|22233:2024,22234:1EE3,22333:1F60,22334:1D71,22344:1D8B,22345:1D17,23313:1F1B,23314:1D5E,23413:1D43,23415:1CFF,33311:2040,33411:1E20,34511:1DC4,11111:242E,11112:23FE,11113:20E7,11123:21BE,11133:2066,11134:1F9D,11211:235B,11212:23BA,11213:2021,11222:2439,11223:213B,11233:1F95,11234:1E9A,11311:2118,11312:20F1,11313:1FCD,11314:1EC4,11322:2262,11323:2093,11324:1FAF,11333:2012,11334:1E7B,11344:1E8C,11345:1E30,12211:2461,12212:2394,12213:20BD,12222:236E,12223:207B,12233:1FD3,12234:1EAC,12311:2070,12312:20C5,12313:1F42,12314:1E3D,12322:20C9,12323:200E,12324:1EF3,12333:1F44,12334:1D7C,12344:1D8E,12345:1D48,13311:2031,13312:2017,13313:1FAB,13314:1DEE,13322:20E2,13323:2027,13324:1E96,13333:2085,13334:1E65,13344:1DCE,13345:1D87,13411:1EF8,13412:1EF8,13413:1DE2,13415:1D7E,13422:1FF6,13423:1E88,13425:1E57,13433:1E49,13434:1DCB,13435:1D77,13455:1D79,13456:1DA4,22211:256A,22212:23FC,22213:210F,22222:240A,22223:2104,22311:2154,22312:205F,22313:1FA6,22314:1E7D,22322:2028,22323:1F47,22324:1E29,23311:1F98,23312:1F90,23322:1F56,23323:1F4B,23324:1D90,23333:2015,23334:1DD1,23344:1D58,23345:1CDE,23411:1E7D,23412:1E77,23422:1E61,23423:1D7C,23425:1D36,23433:1DD7,23434:1D44,23435:1CCC,23455:1CE5,23456:1D06,33312:1FB0,33313:203E,33314:1E0B,33322:2021,33323:20F7,33324:1EA3,33333:220D,33334:1F18,33344:1E73,33345:1DD0,33412:1DDC,33413:1DE3,33414:1D58,33415:1CEC,33422:1E5D,33423:1E8F,33424:1E01,33425:1D9E,33433:1F0E,33434:1E40,33435:1DB0,33444:1E3F,33445:1D4E,33455:1D4D,33456:1D50,34512:1DB2,34513:1CEC,34516:1D0E,34522:1E46,34523:1DB5,34526:1DDD,34533:1DAA,34534:1D4E,34536:1D53,34566:1D67,34567:1DEB." +
    "1|11122:0B1W|N:6480|23333:6449,23334:5EE6,23344:5D8B,23345:5D5F,23433:5EFA,23434:5D9A,23435:5D36,23455:5D58,23456:5E72,33313:65DD,33314:5FF7,33413:5FB6,33414:5E62,33415:5DD6,34513:5DB3,34516:5E9F,11111:7201,11112:7363,11113:6928,11123:6D2D,11133:666F,11134:651F,11211:7187,11212:717E,11213:6864,11222:735F,11223:6A0F,11233:6624,11234:644D,11311:6905,11312:6A24,11313:6575,11314:638D,11322:6D1B,11323:68CA,11324:66DC,11333:6525,11334:6166,11344:617F,11345:619E,12211:735F,12212:717E,12213:684A,12222:7187,12223:6876,12233:64D5,12234:62B8,12311:686F,12312:6843,12313:649F,12314:62A0,12322:69F8,12323:661A,12324:641A,12333:65A3,12334:60F1,12344:60E1,12345:6110,13311:6590,13312:6632,13313:6510,13314:60B0,13322:68C3,13323:6855,13324:6367,13333:6593,13334:602D,13344:5F04,13345:5EB5,13411:6347,13412:645F,13413:607D,13415:6065,13422:66E7,13423:6339,13425:6341,13433:601D,13434:5F0E,13435:5E7F,13455:5E95,13456:5F6A,22212:7363,22213:6A2D,22222:7201,22223:6909,22233:6570,22234:6328,22311:6A07,22312:6847,22313:6496,22314:627A,22322:67A0,22323:641B,22324:61F9,22333:63CD,22334:5F3A,22344:5F5B,22345:5F4E,23311:64C3,23312:64A1,23313:642C,23314:5FB3,23322:6434,23323:63AE,23324:5FBC,23411:62BA,23412:62BB,23413:5F98,23415:5FDC,23422:62C2,23423:5FAB,23425:5FF7,33311:65F4,33312:65D4,33322:64FE,33323:6585,33324:603E,33333:6C29,33334:62E9,33344:6053,33345:5F75,33411:6083,33412:610E,33422:614B,33423:5FED,33424:5E8C,33425:5E92,33433:6299,33434:6032,33435:5F27,33444:6000,33445:5E2B,33455:5E0C,33456:5EBE,34511:6078,34512:6168,34522:61DC,34523:5E8D,34526:5FE3,34533:5F12,34534:5E0D,34536:5E76,34566:5E8C,34567:6079." +

    "0||N:32768|11111:28B03,11112:25A19,11122:24BF0,11123:24501,11223:23ED9,11234:23F55,12345:244BA.";

  // ***************************
  // Look for precalculated game
  // ***************************

  let dotStr = ".";
  let separatorStr = "|";
  let separator2Str = ":";
  let separator3Str = ",";
  let nbCodesPrefixStr = "N:";
  let precalculated_mark = {nbBlacks:0, nbWhites:0};
  // Returned value:
  // - > 0 if both game and code were precalculated
  // - 0 if only game was precalculated
  // - -1 if nothing was precalculated
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
          return sum; // both game and code were precalculated - precalculated sum found
        }

        // End of loop processing
        if (separator_index5 >= last_line_str_index) {
          break;
        }
        last_end_of_code_perf_pair_index = separator_index5+1;
      }

      // End of loop processing
      last_dot_index = dot_index+1;
      return 0; // only game was precalculated - no precalculated sum found

    } // end while

    return -1; // nothing was precalculated - no precalculated sum found

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

  let areCurrentGameOrCodePrecalculated = -1;

  // Outputs: listOfGlobalPerformances[]
  //          particularCodeGlobalPerformance in case of impossible code
  function evaluatePerformances(depth, listOfCodes, nbCodes, particularCode, areCurrentGameOrCodePrecalculated_p) {

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
    if ((nbCodes < 1) || (listOfCodes.length < nbCodes)) {
      throw new Error("evaluatePerformances: invalid number of codes: " + nbCodes + ", " + listOfCodes.length);
    }

    areCurrentGameOrCodePrecalculated = areCurrentGameOrCodePrecalculated_p;

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
      res = recursiveEvaluatePerformances(depth, listOfCodes, nbCodes /*,  true (precalculation mode) */);

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
  // - X) Web page with good smartphone display
  // - X) Generate 5col tables + document precalculation assumptions
  // - X) Precalculate {5 columns, 8 colors} games, check possible & impossible code (code precalculated or its only game precalculated) & useless (obviously + not obviously useless) code & "very inefficient" code & "some-useless-color" codes & at precalculated depth 1/2/3, check RAM due to nbOfCodesForSystematicEvaluation_ForMemAlloc
  // - X) LONG PROCESSING TIME - 37 sec for 365 possibles codes on i5 processor.png
  // - X) test strictly positive precalculated perf
  // - X) Precalculated table split in several javascript modules to decrease size loaded?
  // - X) XXXs in all files
  // - X) Max nber of attempts for SMM games once precalculation fully stored (=> web page) + new game pictures in web page w/ all perfs evaluated + check total sum of attempts at the same time
  // - X) Complete forum? -> https://codegolf.stackexchange.com/questions/31926/mastermind-strategy
  // - X) Appli Android?
  function recursiveEvaluatePerformances(depth, listOfCodes, nbCodes /*, possibleGame (precalculation mode) */) {

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
    let precalculated_current_game_or_code = (first_call ? areCurrentGameOrCodePrecalculated : -1);
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
    // Note: rules shall be more and more constraining when depth increases
    let precalculation_mode = ( (nbCodes >= minNbCodesForPrecalculation) // (**) only games for which there may not be enough CPU capacity / time to calculate performances online
                                && (next_current_game_idx <= maxDepthForGamePrecalculation) // (-1 or 3)
                                && ( (next_current_game_idx <= 1)
                                     || ((next_current_game_idx == 2) && ((possibleGame && (codeHandler.nbDifferentColors(currentGame[0]) <= 2)) || (codeHandler.isVerySimple(currentGame[0]) && codeHandler.isVerySimple(currentGame[1])) || (nbCodes <= nbCodesForPrecalculationThreshold))) // (***)
                                     || ((next_current_game_idx == 3) && possibleGame && (codeHandler.nbDifferentColors(currentGame[0]) <= 2) && (codeHandler.nbDifferentColors(currentGame[1]) <= 2) && (codeHandler.nbDifferentColors(currentGame[2]) <= 2)) )
                                && (!compute_sum_ini) ); // not a leaf
    let str; // (precalculation mode)
    let precalculation_start_time; // (precalculation mode)
    if (precalculation_mode) { // (precalculation mode)
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
      // 0:  11111
      // 1:  11112
      // 9:  11122
      // 10: 11123
      // 74: 11223
      // 83: 11234
      // 84: 12345
      // if (first_call && (idx1 != 10) && (idx1 != 74) && (idx1 != 83) && (idx1 != 84)) {
      //  continue;
      // }

      if (idx1 < nbCodes) {
        current_code = listOfCodes[idx1];
      }
      else {
        current_code = initialCodeListForPrecalculatedMode[idx1 - nbCodes]; // (precalculation mode) / add also impossible codes

        // Precalculation optimization (1/4): skip current code if needed
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
        // Precalculation optimization (2/4): skip impossible current code if acceptable
        if ((next_current_game_idx >= 2) && (nbCodes <= nbCodesForPrecalculationThreshold)) { // (***)
          skip_current_code = true;
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
        if ( (precalculated_current_game_or_code >= 0) // both game and code were precalculated OR only game was precalculated
             && compute_sum /* && (!precalculation_mode) */ ) { // (precalculation mode)
          sum = lookForCodeInPrecalculatedGames(current_code, next_current_game_idx, nbCodes);
          if (sum > 0) { // precalculated sum found
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

        // Precalculation optimization (3/4): skip "very inefficient" current code if acceptable
        /* if ( (next_current_game_idx == 1)
             && (!(idx1 < nbCodes)) // (no impact on actual computations)
             && (!(codeHandler.nbDifferentColors(currentGame[0]) <= 2)) ) { // (***) (precalculation mode)
          let very_inefficient_current_code = false;
          for (mark_idx = nbMaxMarks-1; mark_idx >= 0; mark_idx--) {
            let nextNbCodes = nextNbsCodes[mark_idx];
            // Go through all sets of possible marks
            if (nextNbCodes > 0) {
              // At least one mark with a very high number of remaining possible codes and no further precalculation planned => this code is considered as "very inefficient"
              if (!(nextNbCodes <= nbCodesForPrecalculationThreshold)) { // (***)
                very_inefficient_current_code = true;
                break;
              }
            }
          }
          if (very_inefficient_current_code) { // (precalculation mode)
            if (idx1 < nbCodes) {
              throw new Error("recursiveEvaluatePerformances: very_inefficient_current_code");
            }
            continue; // skip "very inefficient" current code
          }
        } */

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

              sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes /*, ((idx1 < nbCodes) && possibleGame) (precalculation mode) */); // (Note: possibleGame = ((idx1 < nbCodes) && possibleGame))
              if (sum_marks == nbCodes) break;

            }
          }
        }
        /*
        // Precalculation optimization (4/4): skip useless current code if acceptable
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
            if ( (time_elapsed > 3000) && (time_elapsed > maxPerformanceEvaluationTime*7/100) && (idxToConsider < Math.floor(totalNbToConsider*1.25/100)) ) { // (0.179 ratio)
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
      if (precalculation_time >= 2700) { // 2700 = 2.7 seconds on i5 processor or on Linux VB running on i7 processor
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
      if ( (precalculated_current_game_or_code > 0) // both game and code were precalculated
           && (!compute_sum_ini) /* && (!precalculation_mode) */ ) { // (precalculation mode)
        sum = lookForCodeInPrecalculatedGames(current_code, next_current_game_idx, nbCodes);
        if (sum > 0) { // precalculated sum found
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

              sum = sum + nextNbCodes * recursiveEvaluatePerformances(next_depth, nextListsOfCodes[mark_idx], nextNbCodes /*, false (precalculation mode) */);

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

    if (abort_worker_process) { // Avoid cumulative errors
      return;
    }

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
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*50/30;
            nbOfCodesForSystematicEvaluation = Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes); // initialNbPossibleCodes in (precalculation mode)
            nbOfCodesForSystematicEvaluation_ForMemAlloc = initialNbPossibleCodes; // game precalculation (*)
            initialNbClasses = 7; // {11111, 11112, 11122, 11123, 11223, 11234, 12345}
            maxDepth = Math.min(13, overallMaxDepth);
            marks_optimization_mask = 0xFFFF; // (do not consume too much memory)
            maxDepthForGamePrecalculation = 3; // game precalculation (-1 or 3) (*)
            break;
          case 6:
            nbMaxMarks = 27;
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*60/30;
            nbOfCodesForSystematicEvaluation = Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
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
            maxPerformanceEvaluationTime = baseOfMaxPerformanceEvaluationTime*75/30;
            nbOfCodesForSystematicEvaluation = Math.min(refNbOfCodesForSystematicEvaluation, initialNbPossibleCodes);
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

        /* if (8*8*8*8*8 != fillShortInitialPossibleCodesTable(initialCodeListForPrecalculatedMode, nbOfCodesForSystematicEvaluation_ForMemAlloc)) { // (precalculation mode)
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

          let precalculated_current_game_or_code = -1; // nothing was precalculated
          // precalculated_current_game_or_code shall keep being -1 in precalculation mode => below code to comment in (precalculation mode)
          if ( (previousNbOfPossibleCodes >= minNbCodesForPrecalculation) // (**) only games for which there may not be enough CPU capacity / time to calculate performances online
               && (currentGameSize <= maxDepthForGamePrecalculation) ) { // (-1 or 3)
            precalculated_current_game_or_code = lookForCodeInPrecalculatedGames(codesPlayed[currentAttemptNumber-1], currentGameSize, previousNbOfPossibleCodes);
          }

          // Main useful code processing
          // ***************************

          if ( (precalculated_current_game_or_code > 0) // both game and code were precalculated
               || ((precalculated_current_game_or_code == 0) && (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation)) // only game was precalculated and number of possible codes is not too high
               || (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation) ) { // number of possible codes is not too high (general case)

            if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
              throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (1): " + previousNbOfPossibleCodes + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
            }

            // Initializations
            // ***************

            // ***** First evaluation phase in a game *****
            if (precalculated_current_game_or_code > 0) { // both game and code were precalculated
              if (performanceListsInitDone) {
                throw new Error("NEW_ATTEMPT phase / inconsistent game precalculation");
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
            // ***** Second evaluation phase in a game *****
            else if ( ((precalculated_current_game_or_code == 0) && (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation)) // only game was precalculated and number of possible codes is not too high
                      || (previousNbOfPossibleCodes <= nbOfCodesForSystematicEvaluation) ) { // number of possible codes is not too high (general case)
              if (precalculated_current_game_or_code > 0) {
                throw new Error("NEW_ATTEMPT phase / internal error (precalculated_current_game_or_code)");
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
              best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, 0 /* empty code */, precalculated_current_game_or_code);
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
                            + ((precalculated_current_game_or_code >= 0) ? ((precalculated_current_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "") + ")");
              }
              else {
                console.log("(perfeval#1 failed in " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + currentNbClasses + ((currentNbClasses > 1) ? " classes" : " class") + ")");
              }
            }
            else { // code played is not possible
              // Evaluate performances for possibleCodesForPerfEvaluation[currentAttemptNumber%2]:
              let startTime = (new Date()).getTime();
              best_global_performance = evaluatePerformances(-1 /* first depth */, possibleCodesForPerfEvaluation[index], previousNbOfPossibleCodes, codesPlayed[currentAttemptNumber-1], precalculated_current_game_or_code);
              if (best_global_performance != PerformanceUNKNOWN) { // performance evaluation succeeded
                if ((particularCodeGlobalPerformance == PerformanceNA) || (particularCodeGlobalPerformance == PerformanceUNKNOWN) || (particularCodeGlobalPerformance <= 0.01)) {
                  throw new Error("NEW_ATTEMPT phase / invalid particularCodeGlobalPerformance: " + particularCodeGlobalPerformance);
                }
                code_played_global_performance = particularCodeGlobalPerformance;
                console.log("(perfeval#2: best performance: " + best_global_performance
                            + " / code performance: " + particularCodeGlobalPerformance
                            + " / " + ((new Date()).getTime() - startTime) + "ms / " + previousNbOfPossibleCodes + ((previousNbOfPossibleCodes > 1) ? " codes" : " code") + " / " + currentNbClasses + ((currentNbClasses > 1) ? " classes" : " class")
                            + ((precalculated_current_game_or_code >= 0) ? ((precalculated_current_game_or_code > 0) ? " / precalculated" : " / ~precalculated") : "") + ")");
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

        self.postMessage({'rsp_type': 'CODE_PLAYED_PERFORMANCE', 'relative_perf_p': code_played_relative_perf, 'best_global_performance_p': best_global_performance, 'relative_perf_evaluation_done_p': relative_perf_evaluation_done, 'code_p': codesPlayed[currentAttemptNumber-1], 'attempt_nb': currentAttemptNumber, 'game_id': game_id});

        // ************************************************
        // C.1) Organize performances of all possible codes
        // ************************************************

        if (nbMaxPossibleCodesShown > nbOfCodesForSystematicEvaluation) {
          throw new Error("NEW_ATTEMPT phase / inconsistent numbers of listed codes: " + nbMaxPossibleCodesShown + " > " + nbOfCodesForSystematicEvaluation);
        }
        let nb_codes_shown = Math.min(previousNbOfPossibleCodes, nbMaxPossibleCodesShown);
        if (nb_codes_shown > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
          throw new Error("NEW_ATTEMPT phase / inconsistent nb_codes_shown or nbOfCodesForSystematicEvaluation_ForMemAlloc value: " + nb_codes_shown + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
        }
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
          if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
            throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (2): " + previousNbOfPossibleCodes + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
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
          if (previousNbOfPossibleCodes > nbOfCodesForSystematicEvaluation_ForMemAlloc) {
            throw new Error("NEW_ATTEMPT phase / inconsistent previousNbOfPossibleCodes or nbOfCodesForSystematicEvaluation_ForMemAlloc value (3): " + previousNbOfPossibleCodes + ", " +  nbOfCodesForSystematicEvaluation_ForMemAlloc);
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
      abort_worker_process = true;
      throw new Error("gameSolver internal error (message): " + exc + ": " + exc.stack);
    }

  }, false);

}
catch (exc) {
  abort_worker_process = true;
  throw new Error("gameSolver internal error (global): " + exc + ": " + exc.stack);
}
