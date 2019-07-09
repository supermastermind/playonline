function write_menu(selected_idx) {
  var str = "\
    <div id='header'>\
        <h1><b><font color='#F00000'>Play </font><font color='#FF7700'>Super </font><font color='#F7F700'>Master </font><font color='#00D000'>Mind </font><font color='black'>/ </font> <font color='#0000A8'>Code </font><font color='#954400'>breaker </font><font color='#FF7700'>online!</font></b></h1>\
        <h2><font color='#333333'>Super Master Mind, Mastermind & Code breaker games</font></h2>\
      <div id='menubar'>\
        <ul id='menu'>\
          <!-- put class='selected' in the li tag for the selected page - to highlight which page you're on -->";
  switch (selected_idx) {
    case 1:
      str = str + "\
              <li><a href='index.html'>Home</a></li>\
              <li class='selected'><a href='screenshots.html'><b>Screenshots</b></a></li>\
              <li><a href='optimal_strategy.html'>Optimal strategy</a></li>\
              <li><a href='contact_info.html'>Contact info</a></li>";
      break;
    case 2:
      str = str + "\
              <li><a href='index.html'>Home</a></li>\
              <li><a href='screenshots.html'>Screenshots</a></li>\
              <li class='selected'><a href='optimal_strategy.html'><b>Optimal strategy</b></a></li>\
              <li><a href='contact_info.html'>Contact info</a></li>";
      break;
    case 3:
      str = str + "\
              <li><a href='index.html'>Home</a></li>\
              <li><a href='screenshots.html'>Screenshots</a></li>\
              <li><a href='optimal_strategy.html'>Optimal strategy</a></li>\
              <li class='selected'><a href='contact_info.html'><b>Contact info</b></a></li>";
      break;
    default:
      str = str + "\
              <li class='selected'><a href='index.html'><b>Home</b></a></li>\
              <li><a href='screenshots.html'>Screenshots</a></li>\
              <li><a href='optimal_strategy.html'>Optimal strategy</a></li>\
              <li><a href='contact_info.html'>Contact info</a></li>";
  }
  str = str + "\
        </ul>\
      </div>\
    </div>";
  document.write(str);
}

function write_sidebar() {
  var month = new Array();
  month[0] = "January";
  month[1] = "February";
  month[2] = "March";
  month[3] = "April";
  month[4] = "May";
  month[5] = "June";
  month[6] = "July";
  month[7] = "August";
  month[8] = "September";
  month[9] = "October";
  month[10] = "November";
  month[11] = "December";
  var d = new Date();
  var month_and_year_str = '(' + month[d.getMonth()] + ' ' + d.getFullYear() + ')';

  document.write("\
    <div class='sidebar'>\
      <h1 style='margin-top:0'>History</h1>\
      <b>Current version: 2.76<br>"
      + month_and_year_str +
      "</b><br><br>\
      Version 2.0<br>\
      optimal strategy assessed for all Master Mind games (4 columns, 6 colors)<br><br>\
      Version 1.5<br>\
      optimal strategy assessed at end of games<br><br>\
      Version 1.2<br>\
      possible codes at each attempt can be displayed<br><br>\
      Version 1.0<br>\
      online game scores<br><br>\
      Version 0.5<br>\
      basic gameplay\
      <br>\
      <h1>Interesting links</h1>\
      <ul>\
        <li style='margin-left:0;margin-top:0;'><a href='https://wearethemutants.com/2017/03/27/cunning-and-logic-the-international-imagery-of-mastermind/'>The international imagery of &quot;Mastermind&quot;</a></li>\
        <li style='margin-left:0;'><a href='https://en.wikipedia.org/wiki/Mastermind_(board_game)'>Mastermind on wikipedia</a></li>\
        <li style='margin-left:0;'><a href='http://mathworld.wolfram.com/Mastermind.html'>Mastermind strategies</a></li>\
      </ul>\
    </div>");
}

function write_introduction() {
  document.write("\
    <a href='game.html' onfocus='this.blur()'>\
      <div id='game_images'>");
  var img_str = "<hr style='height:0.75vh; visibility:hidden;' /><img src='img/SuperMasterMind_1.png' style='width:4.5rem;border:0;margin:0px'><img src='img/SuperMasterMind_2.png' style='width:4.5rem;border:0;margin:0px'><img src='img/SuperMasterMind_3.png' style='width:4.5rem;border:0;margin:0px'><img src='img/SuperMasterMind_4.png' style='width:4.5rem;border:0;margin:0px'>";
  if (window.innerWidth >= 777) {
    img_str = img_str + "<img src='img/SuperMasterMind_5.png' style='width:4.5rem;border:0;margin:0px'>";
  }
  document.write(img_str);
  document.write("\
      </div>\
    </a>");
}

var optimal_strategy_descr = "The optimal strategy is determined thanks to a <b>recursive algorithm</b> which goes through all possible games (enumeration of all games with some &quot;equivalent games&quot; tricks for optimization). The goal of this algorithm is to minimize the average number of attempts to find secret codes, all secret codes having the same weight (i.e. same probability to be selected).<br>In this algorithm, only the possible/logical codes are considered at each stage of the game. ";

function write_optimal_strategy_details_1() {
  var str = "<div id='strategy_details' onclick=\"document.getElementById('strategy_details').innerHTML='" + optimal_strategy_descr + "In some situations, playing an impossible/illogical code may be better than playing the best possible/logical code(s)! This could be called a &quot;useful mistake&quot;. ";
  str += "This will thus result in the above number being strictly positive (e.g. <b>+0.25</b>). If you get such a positive number (voluntarily), you are good!<br><div style=margin-top:5px;><a href=optimal_strategy.html><b>Optimal strategy statistics</b></a></div>';\"><font color=#A4AA04 style=cursor:pointer;><u><b>More details on the optimal strategy...</b></u></font></div><div style='margin-top:5px;'><a href=screenshots.html><b>Game examples & screenshots</b></a></div>";
  document.write(str);
}

function write_optimal_strategy_details_2() {
  document.write(optimal_strategy_descr + "This strategy could thus be called the <b><font color=#CC0099>optimal logical strategy</font></b>.<hr style='height:0.75vh; visibility:hidden;' />Other strategies exist which also allow playing impossible/illogical codes at each stage of the game (in addition to the possible/logical codes). They offer slightly better statistics than the <b><font color=#CC0099>optimal logical strategy</font></b> and are not considered here (very long processing times).");
}
