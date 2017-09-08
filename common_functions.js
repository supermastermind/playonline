function write_menu(selected_idx) {
  var str = "\
    <div id='header'>\
      <div id='logo'>\
        <!-- class='logo_colour', allows you to change the colour of the text -->\
        <h1><font color='#F00000'>Play </font><font color='#FF7700'>super </font><font color='#F7F700'>master </font><font color='#00D000'>mind </font><font color='black'>/ </font> <font color='#0000A8'>code </font><font color='#954400'>breaker </font><font color='#FF7700'>online!</font></h1>\
        <h2><font color='#333333'>super master mind, mastermind & code breaker games</font></h2>\
      </div>\
      <div id='menubar'>\
        <ul id='menu'>\
          <!-- put class='selected' in the li tag for the selected page - to highlight which page you're on -->";
  switch (selected_idx) {
    case 1:
      str = str + "\
              <li><a href='index.html'>Home</a></li>\
              <li class='selected'><a href='screenshots.html'>Screenshots</a></li>\
              <li><a href='optimal_strategy.html'>Optimal strategy</a></li>\
              <li><a href='page.html'>Contact</a></li>";    
      break;
    case 2:
      str = str + "\
              <li><a href='index.html'>Home</a></li>\
              <li><a href='screenshots.html'>Screenshots</a></li>\
              <li class='selected'><a href='optimal_strategy.html'>Optimal strategy</a></li>\
              <li class='selected'><a href='page.html'>Contact</a></li>";    
      break;
    default:
      str = str + "\
              <li class='selected'><a href='index.html'>Home</a></li>\
              <li><a href='screenshots.html'>Screenshots</a></li>\
              <li><a href='optimal_strategy.html'>Optimal strategy</a></li>\
              <li><a href='page.html'>Contact</a></li>";   
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
      <h4>Version 0.5</h4>\
      September 5th 2017:<br>\
      simple gameplay available\
      <br><br>\
      <h1>Interesting links</h1>\
      <ul>\
        <li><a href='https://wearethemutants.com/2017/03/27/cunning-and-logic-the-international-imagery-of-mastermind/'>The international imagery of &quot;Mastermind&quot;</a></li>\
        <li><a href='https://en.wikipedia.org/wiki/Mastermind_(board_game)'>Mastermind on wikipedia</a></li>\
        <li><a href='http://mathworld.wolfram.com/Mastermind.html'>Mastermind strategies</a></li>\
      </ul>\
    </div>");
}

function write_optimal_strategy_details(detail_level) {
  var str = "<div id='strategy_details' onclick=\"document.getElementById('strategy_details').innerHTML='The optimal strategy is determined thanks to a recursive algorithm which goes through all possible games (enumeration of all games with some &quot;equivalent games&quot; tricks for optimization). The goal of this algorithm is to minimize the average number of attempts to find secret codes, all secret codes having the same weight (i.e. same probability to be selected).<br>In this algorithm, only the possible codes are considered at each stage of the game. In some (very rare) cases, playing an impossible code may be better than playing the best possible code! This could be called a &quot;useful mistake&quot;. ";
  if (detail_level == 0) {
    str += "This will thus result in the above number being strictly positive (e.g. +0.10). If you get such a positive number (voluntarily), you are really good!<br><a href=optimal_strategy.html>Display optimal strategy statistics.</a>';\"><i>Click here for more details on the optimal strategy...</i></div><br>";
  }
  document.write(str);
}
            
