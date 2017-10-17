
function write_menu(selected_idx) {
  var str = "\
    <div id='header'>\
      <div id='logo'>\
        <!-- class='logo_colour', allows you to change the colour of the text -->\
        <h1><font color='#F00000'>Play </font><font color='#FF7700'>Super </font><font color='#F7F700'>Master </font><font color='#00D000'>Mind </font><font color='black'>/ </font> <font color='#0000A8'>Code </font><font color='#954400'>breaker </font><font color='#FF7700'>online!</font></h1>\
        <h2><font color='#333333'>Super Master Mind, Mastermind & Code breaker games</font></h2>\
      </div>\
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
  document.write("\
    <div class='sidebar'>\
      <h1>History</h1>\
      Site under construction...<br><br>\
      Version 0.6:<br>\
      adding online game scores<br>\
      October 17th 2017\
      <br><br>\
      Version 0.5:<br>\
      simple gameplay available<br>\
      September 5th 2017\
      <br><br>\
      <h1>Interesting links</h1>\
      <ul>\
        <li style='margin-left:0;margin-top:0;'><a href='https://wearethemutants.com/2017/03/27/cunning-and-logic-the-international-imagery-of-mastermind/'>The international imagery of &quot;Mastermind&quot;</a></li>\
        <li style='margin-left:0;'><a href='https://en.wikipedia.org/wiki/Mastermind_(board_game)'>Mastermind on wikipedia</a></li>\
        <li style='margin-left:0;'><a href='http://ma.wolfram.com/Mastermind.html'>Mastermind strategies</a></li>\
      </ul>\
    </div>");
}

function write_optimal_strategy_details(detail_level) {
  var str = "<div id='strategy_details' onclick=\"document.getElementById('strategy_details').innerHTML='The optimal strategy is determined thanks to a <b>recursive algorithm</b> which goes through all possible games (enumeration of all games with some &quot;equivalent games&quot; tricks for optimization). The goal of this algorithm is to minimize the average number of attempts to find secret codes, all secret codes having the same weight (i.e. same probability to be selected).<br>In this algorithm, only the possible codes are considered at each stage of the game. In some (very rare) cases, playing an impossible code may be better than playing the best possible code(s)! This could be called a &quot;useful mistake&quot;. ";
  if (detail_level == 0) {
    str += "This will thus result in the above number being strictly positive (e.g. +0.10). If you get such a positive number (voluntarily), you are really good!<br><div style=margin-top:5px;><a href=optimal_strategy.html><b>Optimal strategy statistics</b></a></div>';\"><font color=#A4AA04 style=cursor:pointer;><u><b>Details on the optimal strategy...</b></u></font></div><div style='margin-top:5px;'><a href=screenshots.html><b>Game examples & screenshots</b></a></div><br>";
  }
  else {
    str += "</div><br>";
  }
  document.write(str);
}
            
