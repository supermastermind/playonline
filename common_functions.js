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
// Note: in addition to set_div_contents_several_times() calls, other method used for ezoic: use the data-ezoic-cmp-override attribute to disable Ezoic ads for the entire body of the HTML page or for a div (<div id="ad" data-ezoic-cmp-override="true">).
// You can add the data-ezoic-cmp-override attribute to the body tag to disable Ezoic ads for the entire page and then add the data-ezoic-cmp-override="false" attribute to a specific div to re-enable Ezoic ads for that div.
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

function write_sidebar_delayed() {
  var sidebar_div = document.getElementById("sidebar_div");
  sidebar_div.innerHTML =
      "<h1>Android app</h1>\
        Get it on Google Play:<br>\
        <a href='https://play.google.com/store/apps/details?id=supermastermind.github.io'>\
        <img alt='Get it on Google Play' style='width:5.0rem;margin-top:0.5rem;margin-bottom:0.5rem;border-radius:7%' src='img/Playstore_icon.png'/></a><br>\
        <h1>Interesting links</h1>\
        <ul>\
          <li style='margin-left:0;'><a href='https://en.wikipedia.org/wiki/Mastermind_(board_game)'>Mastermind wiki</a></li>\
          <li style='margin-left:0;margin-top:0;'><a href='https://wearethemutants.com/2017/03/27/cunning-and-logic-the-international-imagery-of-mastermind/'>The international imagery of Mastermind</a></li>\
          <li style='margin-left:0;'><a href='http://mathworld.wolfram.com/Mastermind.html'>Mastermind strategies</a></li>\
        </ul><br>";
  sidebar_div.style.visibility = "visible";
}

function write_sidebar() {
  document.write("<div id='sidebar_div' class='sidebar' style='visibility:hidden; data-ezoic-cmp-override=\"true\"'></div>");
  set_div_contents_several_times("write_sidebar_delayed()", tick_repeat_nb, false);
}


function write_index_page_contents_delayed() {
  var index_page_contents_div = document.getElementById("index_page_contents_div");
  index_page_contents_div.innerHTML =
      "<hr style=\"height:0.5rem; visibility:hidden;\" />\
      <h2>Play Super Master Mind and evaluate your strategy!</h2>\
      During the game, each of your attempts is compared to what the optimal strategy would have played, which will help you to progress.<br>\
      At each attempt, the number of possible codes is displayed, and the lists of possible codes are shown at game end.<br>\
      Several displays (with colors or numbers) and modes (from 3 to 7 columns and from 5 to 10 colors/numbers) are possible.<br>\
      Game scores are stored online to rank players and follow their progression.\
      <hr style=\"height:0.5rem; visibility:hidden;\" />\
      <a href=\"img/SMM_game_example_1_portrait.png\"><img src=\"img/SMM_game_example_1_portrait.png\" style=\"width:30%;border-color:#AAAAAA;border-style:solid;border-width:thin;margin-top:0.5rem;border-radius:2%\"></a>\
      <a href=\"img/SMM_game_example_2_portrait.png\"><img src=\"img/SMM_game_example_2_portrait.png\" style=\"width:30%;border-color:#AAAAAA;border-style:solid;border-width:thin;margin-top:0.5rem;border-radius:2%\"></a>\
      <hr style=\"height:0.5rem; visibility:hidden;\" />\
      <a href='game.html' onfocus='this.blur()'><b><font style='font-size:130%'>Play online in your browser</font></b></a><br>\
      or&nbsp;<a href='https://play.google.com/store/apps/details?id=supermastermind.github.io' onfocus='this.blur()'><b><font style='font-size:130%'>play&nbsp;with&nbsp;the&nbsp;Android&nbsp;app</font></b></a> on your smartphone for a better game experience<br>\
      <a href='https://play.google.com/store/apps/details?id=supermastermind.github.io'>\
        <img alt='Get it on Google Play' style='width:11.0rem;margin-top:0.5rem;margin-bottom:0.5rem' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png'/><img alt='Get it on Google Play' style='width:5.5rem;margin-top:0.5rem;margin-bottom:0.5rem;border-radius:7%' src='img/Playstore_icon.png'/>\
      </a>\
      <h3><a name='game_rules'></a>Rules</h3>\
      The goal of Super Master Mind is to find out a secret code of 5 colors chosen randomly among 8 (with duplicate colors allowed).<br>\
      The player makes successive attempts, and each code played is given pegs:<br>\
      <ul style='margin:0' data-ezoic-cmp-override='true'>\
      <li style='list-style-type:disc'>a black peg <small><small>&#x26ab;</small></small> indicates the existence of a correct color in a correct position,</li>\
      <li style='list-style-type:disc'>a white peg <small><small>&#x26aa;</small></small> indicates the existence of a correct color in a wrong position.</li>\
      </ul>\
      Only the total numbers of black pegs and of white pegs are given (without column information).<br>\
      The game is won when 5 black pegs are got (secret code discovered) or lost when the maximum number of attempts is reached.<br>\
      For Master Mind, the rules are the same with a secret code of 4 colors chosen randomly among 6, and more generally M among N for other code breakers games.\
      <hr style='height:0.5rem; visibility:hidden;' />\
      <a href='img/SuperMasterMind_rules.png'><img src='img/SuperMasterMind_rules.png' style='width:30%;border-color:#AAAAAA;border-style:solid;border-width:thin;background-color:#FFFFFF;padding-top:0.5rem;padding-bottom:0.5rem;padding-left:1.5rem;padding-right:1.5rem;margin-top:0.5rem;margin-right:0.5rem;border-radius:2%'><small>click to enlarge</small></a>\
      <hr style='height:0.5rem; visibility:hidden;' />\
      Some rules are still not clear? See <a href='screenshots.html' onfocus='this.blur()'><b>Game examples</b></a>\
      <h3><a name='Strategy'></a>Optimal strategy & performance evaluation</h3>\
      Behind the graphical game interface, the program is assisted by a calculator which will give you hints to find the optimal strategy.\
      This calculator compares what you played to what the optimal strategy would have played. For each code played,\
      it compares \"the average number of attempts to find secret codes\" which is reachable when an optimal code is played\
      to this same average number when your code is played, and then displays the difference next to your code.<br>\
      <hr style='height:0.5rem; visibility:hidden;' />\
      For example:<br>\
      <ul style='margin:0' data-ezoic-cmp-override='true'>\
      <li style='list-style-type:disc'><b>0.00</b> means that what you played was optimal (no difference between your code and the optimal code(s)),</li>\
      <li style='list-style-type:disc'><b>-1.00</b> means that what you played was useless (1 attempt was lost on average, thus -1),</li>\
      <li style='list-style-type:disc'><b>-0.50</b> means that what you played was not optimal: you lost <sup>1</sup>&frasl;<sub>2</sub> attempt on average\
      to reach secret codes in comparison to an optimal code. That means that if the optimal strategy reaches\
      secret codes in 4 attempts on average, your code (followed by an optimal strategy) will reach them in 4.5 attempts on average.\
      Of course, if you are lucky (or intuitive &#x1F638;), this inefficient code may be the secret code, in which case you will win the game instantly!\
      </ul>\
      <hr style='height:0.5rem; visibility:hidden;' />";
  index_page_contents_div.style.visibility = "visible";
}

function write_index_page_contents() {
  document.write("<div id='index_page_contents_div' style='visibility:hidden; data-ezoic-cmp-override=\"true\"'></div>");
  set_div_contents_several_times("write_index_page_contents_delayed()", tick_repeat_nb, false);
}

function write_introduction() {
  document.write("<div id='game_images' data-ezoic-cmp-override='true'>");
  var img_str = "<hr style='height:0.75vh; visibility:hidden;' /><img src='img/SuperMasterMind_1.png' style='width:4.5rem;border:0;margin:0px;border-radius:7%'><img src='img/SuperMasterMind_2.png' style='width:4.5rem;border:0;margin:0px;border-radius:7%'><img src='img/SuperMasterMind_3.png' style='width:4.5rem;border:0;margin:0px;border-radius:7%'>";
  if (window.innerWidth >= 360) {
    img_str = img_str + "<img src='img/SuperMasterMind_5.png' style='width:4.5rem;border:0;margin:0px;border-radius:7%'>";
  }
  if (window.innerWidth >= 500) {
    // img_str = img_str + "<img src='img/SuperMasterMind_4.png' style='width:4.5rem;border:0;margin:0px'>";
  }
  document.write(img_str);
  document.write("</div>");
}

var optimal_strategy_descr = "The optimal strategy is determined thanks to a recursive algorithm which goes through all possible games (enumeration of all games with some &quot;equivalent games&quot; rules for optimization). The goal of this algorithm is to minimize the average number of attempts to find secret codes, all secret codes having the same weight (same probability to be selected).<br>In this algorithm, only the possible/logical codes are considered at each stage of the game. ";

function write_optimal_strategy_details_1() {
  var str = "<div>" + optimal_strategy_descr + "In some situations, playing an impossible/illogical code may be better than playing the best possible/logical code(s). This could be called a &quot;useful mistake&quot;. "
            + "This will thus result in the above number being strictly positive (e.g. <b>+0.25</b>). If you get such a positive number (voluntarily), you are good! &#x1F914;"
            + "<hr style='height:0.5rem; visibility:hidden;' />"
            + "See <a href=optimal_strategy.html><b>Optimal strategy</b></a> for more details.</div>";
  document.write(str);
}

function write_optimal_strategy_details_2() {
  document.write(optimal_strategy_descr + "This strategy could thus be called the <b><font color=#CC0099>optimal logical strategy</font></b>.<hr style='height:0.75vh; visibility:hidden;' />Other strategies exist which also allow playing impossible/illogical codes at each stage of the game (in addition to the possible/logical codes). \"Mathematically optimal strategies\" are among them, but processing times to fully evaluate them can be very long (especially for Super Master Mind and more complex games). They offer slightly better statistics than the <b><font color=#CC0099>optimal logical strategy</font></b>: some comparison is made in this page.");
}
