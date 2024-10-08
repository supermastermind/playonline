function write_menu(selected_idx) {
  var str = "\
    <div id='header'>\
        <hr style='height:1.75vh; visibility:hidden;' />\
      <div id='menubar'>\
        <ul id='menu'>\
          <!-- put class='selected' in the li tag for the selected page - to highlight which page you're on -->";
  switch (selected_idx) {
    case 1:
      str = str + "\
              <li><a href='index.html'>&#127922;&#x2009;Game</a></li>\
              <li><a href='optimal_strategy.html'>&#x1F9E9;&#x2009;Optimal strategy</a></li>\
              <li class='selected'><a href='screenshots.html'><b>&#x1F5BC;&#xFE0F;&#x2009;Screenshots</b></a></li>\
              <li><a href='contact_info.html'>&#x1F4E7;&#x2009;Contact</a></li>";
      break;
    case 2:
      str = str + "\
              <li><a href='index.html'>&#127922;&#x2009;Game</a></li>\
              <li class='selected'><a href='optimal_strategy.html'><b>&#x1F9E9;&#x2009;Optimal strategy</b></a></li>\
              <li><a href='screenshots.html'>&#x1F5BC;&#xFE0F;&#x2009;Screenshots</a></li>\
              <li><a href='contact_info.html'>&#x1F4E7;&#x2009;Contact</a></li>";
      break;
    case 3:
      str = str + "\
              <li><a href='index.html'>&#127922;&#x2009;Game</a></li>\
              <li><a href='optimal_strategy.html'>&#x1F9E9;&#x2009;Optimal strategy</a></li>\
              <li><a href='screenshots.html'>&#x1F5BC;&#xFE0F;&#x2009;Screenshots</a></li>\
              <li class='selected'><a href='contact_info.html'><b>&#x1F4E7;&#x2009;Contact</b></a></li>";
      break;
    default:
      str = str + "\
              <li class='selected'><a href='index.html'><b>&#127922;&#x2009;Game</b></a></li>\
              <li><a href='optimal_strategy.html'>&#x1F9E9;&#x2009;Optimal strategy</a></li>\
              <li><a href='screenshots.html'>&#x1F5BC;&#xFE0F;&#x2009;Screenshots</a></li>\
              <li><a href='contact_info.html'>&#x1F4E7;&#x2009;Contact</a></li>";
  }
  str = str + "\
        </ul>\
      </div>\
    </div>";
  document.write(str);
}

var tick_time = 1000;
var tick_repeat_nb = 1800; // 30 minutes
function set_div_contents_several_times(cmd_str, targeted_nb_ticks, periodical_trigger) {
  // Attempt to prevent ads additions by setting same div contents several times
  eval(cmd_str);
  if (!periodical_trigger) {
    setTimeout(cmd_str, 250);
    setTimeout(cmd_str, 500);
  }
  if (targeted_nb_ticks > 0) {
    if ( (cmd_str.indexOf("\'") != -1) || (cmd_str.indexOf("\"") != -1) ) {
      alert("invalid set_div_contents_several_times() call");
      return;
    }
    setTimeout("set_div_contents_several_times('" + cmd_str + "', " + (targeted_nb_ticks-1) + ", true);", tick_time);
  }
}

var optimal_strategy_descr = "The optimal strategy is determined thanks to a recursive algorithm which goes through all possible games (enumeration of all games with some &quot;equivalent games&quot; rules for optimization). The goal of this algorithm is to minimize the average number of attempts to find secret codes, all secret codes having the same probability to be selected.<br>In this algorithm, only the logical (i.e. possible) codes are considered at each stage of the game. ";

function write_optimal_strategy_details_1() {
  var str = "<div>" + optimal_strategy_descr + "In some situations, playing an illogical code may be better than playing the best logical code(s). This could be called a &quot;useful mistake&quot;. "
            + "This will result in a strictly positive performance for this code (e.g. <b><font color=#008200>+0.25</font></b>). If you get such a positive performance (voluntarily), you are good!&nbsp;&#x1F914;"
            + "<hr style='height:0.5rem; visibility:hidden;' />"
            + "<hr style='height:0.5rem; visibility:hidden;' />"
            + "See <a href=optimal_strategy.html><b>Optimal strategy</b></a> for more details.</div>";
  document.write(str);
}

function write_optimal_strategy_details_2() {
  document.write(optimal_strategy_descr + "This strategy could thus be called the <b><font color=#CC0099>optimal logical strategy</font></b>. It is implemented in the <a href=index.html>online game</a> and <a href='https://play.google.com/store/apps/details?id=supermastermind.github.io'>android app</a>.<hr style='height:0.75vh; visibility:hidden;' />Other strategies exist in which \"any code\" can be played at each stage of the game, that's to say both logical codes and illogical codes. Mathematically optimal strategies are among them, but processing times to fully evaluate them can be very long, especially for Super Master Mind and more complex games. They offer slightly better statistics than the <b><font color=#CC0099>optimal logical strategy</font></b>. Some comparison is made in this page.");
}
