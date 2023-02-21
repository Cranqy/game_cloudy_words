const DB_WORDS = [];
const game_area = document.getElementById("game");
const text = document.getElementById("text_container");
const ctx = game_area.getContext('2d');
const bg = document.getElementById("bg");
const bg_clouds = document.getElementById("bg_clouds");
const bg_stars = document.getElementById("bg_stars");
const cloud_scroll = document.getElementById("cloud_scroll");
const foreground_width = 1000;
const foreground_height = 400;
let last_update = 0;
let foreground_offset = 0;
let bg_offset = 0;
let game_loop = null;
let start_text_color = "#1d6637";
let font = "40px Arial";
let text_color = "#1d6637";
ctx.font = font;
ctx.textAlign = "center";
//INITIALIZE GAME INSTANCE. CG STANDS FOR current game.
const CG = new Game();
CG.SetGameScreen(ctx);
//CG.SetWordList(WORD_LIST);
window.addEventListener('keydown', function(event) {
  CG.HandleInput(event);
});
window.addEventListener('blur', (event) => {
  if (!CG) { return; }
  if (CG.game_state == null || CG.game_state == "newgame" || CG.game_state == "gameover") { return; }
  CG.SetState("pause");
});




function UpdateScreen() {
  let timestamp = Date.now();
  let dt = timestamp - last_update;
  if (dt < 1000 / 30) { return; }
  ctx.clearRect(0, 0, 1000, 400);
  DrawBackground();
  ScrollClouds(dt);
  CG.Update(dt);
  ControlPauseButton(CG.game_state);
  last_update = timestamp;



}

function DrawBackground() {
  if (!ctx || !bg) { return; }
  ctx.fillStyle = "#0fdbce";
  ctx.drawImage(bg, 0, 0, 1000, 400);
}
function ScrollClouds(d) {
  if (!bg_clouds && cloud_scroll) { return; }
  let delta_time = d / 1000;
  let x_pos_bg = (foreground_offset * 0.125) % foreground_width;
  let x_pos = foreground_offset % foreground_width;
  let x_pos_2 = (foreground_offset * 0.25) % foreground_width;
  ctx.drawImage(bg_clouds, x_pos_bg, 0, foreground_width, foreground_height);
  ctx.drawImage(bg_clouds, x_pos_bg + foreground_width, 0, foreground_width, foreground_height);
  ctx.drawImage(cloud_scroll, x_pos, 0, foreground_width, foreground_height);
  ctx.drawImage(cloud_scroll, x_pos + foreground_width, 0, foreground_width, foreground_height);

  ctx.drawImage(cloud_scroll, x_pos_2, -200, foreground_width, foreground_height);
  ctx.drawImage(cloud_scroll, x_pos_2 + foreground_width, -200, foreground_width, foreground_height);
  foreground_offset -= 30 * delta_time;
}
function Play() {
  if (CG) {
    if (CG.game_state == "play" || CG.game_state == "pause" || CG.game_state == "newgame") { return console.log(CG.game_state); }
    CG.SetState("newgame");
  }
}
function Pause() {
  if (CG) {
    if (!CG.game_state) { return; }
    if (CG.game_state == "gameover" || CG.game_state == "newgame") { return; }
    if (CG.game_state == "pause") {
      CG.SetState("play");
      return;
    }
    CG.SetState("pause");

  }

}
function StartUpdateLoop() {
  game_loop = setInterval(function() { UpdateScreen(); }, 30);
}
async function FirstStart() {
  if (!CG) { return; }
  await GetHighscores();
  let game = await new Promise((res,rej) =>{

    fetch('/getgamewords').then((res) => res.json()).then((data) => {

      data.forEach(function(w) {
        if (!DB_WORDS[w.unit]) {
          DB_WORDS[w.unit] = [w];
        }
        else {
          DB_WORDS[w.unit].push(w);
        }
  
      })
    }).then(() => CG.SetWordList(DB_WORDS)).then(() => res()).catch((err) => rej());

  }).then((resp) => game_loop = setInterval(function() { UpdateScreen(); }, 30)).catch(() => console.log("Error starting game. Try refreshing page"));

  

}
async function GetHighscores()
{
  let hs_container = document.getElementById("highscoresinner");
  if(!hs_container) {return;}
  let hs_list = await new Promise((res,rej) =>{

    fetch('/fetchhighscores',
    {
      method:'GET',
      headers:
      {
        "Content-Type":'application/json'
      }
    }).then((res) => res.json()).then((data) => res(data)).catch(error => rej());

  }).then((list) => list).catch(error => null);

  if(!hs_list){hs_container.innerHTML = "Couldn't fetch highscores"; return;}
  let score_text = '';
  for(var i = 0; i < 10; i++)
  {
    if(!(hs_list[i])){continue;}
    score_text += `${i+1}:<span>${hs_list[i].name}</span> - ${hs_list[i].score}<br>`;
  }
  hs_container.innerHTML = score_text;
}
function ControlPauseButton(g_state) {
  if (!g_state) { return; }
  let pause_button = document.getElementById("pause_button");
  switch (g_state) {
    case "pause": pause_button.innerHTML = "Unpause";
      break;
    default: pause_button.innerHTML = "Pause";
  }
}
function UpdateGameWords() {
  if (!CG) { return; }
  CG.UpdateWordIndexes();
}
