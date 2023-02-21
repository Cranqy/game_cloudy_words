class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class GameObject {
  constructor() {
    this.sprite = null;
    this.pos = new Vector2(0, 0);
    this.size = new Vector2(200,200);
    this.destroyed = false;
  }

  SetSprite(sp) { this.sprite = sp; }
  SetPos(pos) { this.pos = pos; }
  SetSize(s) { this.size = s; }

  Draw(ctx) {
    if (!ctx || !this.sprite) { return; }
    ctx.drawImage(this.sprite, this.pos.x, this.pos.y, this.size.x, this.size.y);
  }
  Destroy() {
    this.destroyed = true;
  }
}
class Word extends GameObject {
  constructor(word, translation,unit,type) {
    super();
    this.word = word;
    this.translations = translation;
    this.unit = unit;
    this.type = type;
    this.matched = false;
    this.matched_color = "#0cb012";
  }
  Draw(ctx) {
    if (!ctx || !this.sprite) { return; }
    let cloud_word;
    if (this.matched == true) {
      let word_string = '';
      if (this.translations.length > 1) {
        for (let i in this.translations) {
          word_string += `${this.translations[i]}-`;
        }
        //this.translations.forEach(function(e) {word_string += `${this.translations} - `});
      }
      else {
        word_string += this.translations[0];
      }

      cloud_word = word_string;
    }
    else {
      cloud_word = this.word;
    }
    ctx.fillStyle = this.matched == true ? this.matched_color : "#121111";
    ctx.font = "bold 48px serif";
    ctx.drawImage(this.sprite, this.pos.x, this.pos.y, this.size.x, this.size.y);
    ctx.fillText(cloud_word, this.pos.x + Math.floor((this.size.x * 0.5)), this.pos.y + Math.floor((this.size.y * 0.5)));

  }
}

class Character extends GameObject {
  constructor() {
    super();
    this.o2_level = 1;
    this.float_speed = 10;
    this.damage_level = 0.1;
  }
  DecreaseO2(dtime, loss) {
    if (this.o2_level > 0) {
      this.o2_level -= loss * dtime;
    }
  }
  LoseWordO2() {
    if (this.o2_level > 0) {
      this.o2_level -= 0.1;
    }
  }
  IncreaseO2() {
    if (this.o2_level < 1) {
      this.o2_level += 0.1;
    }
  }
}

class Game {
  constructor() {
    this.word_list = null;
    this.word_indexes = [];
    this.words_matched = 0;
    this.words_missed = 0;
    this.player_name = null;
    this.highscore = null;
    this.score = 0;
    this.ctx = null;
    this.character = null;
    this.HUD = null;
    this.gameObjects = [];
    this.game_state = null;
    this.states = ["newgame", "play", "pause", "gameover"];
    this.input = "";
    this.word_spawn_interval = 4;
    this.phrase_spawn_interval = this.word_spawn_interval * 5;
    this.o2_loss = .01;
    this.base_float_speed = 10;
    this.float_speed = this.base_float_speed;
    this.character_float_speed = 10;
    this.max_float_speed = 15;
    this.last_word_spawn = 0;
    this.last_phrase_spawn = 0;
    this.last_update = 0;
    this.counter = 0;
    this.game_timer = 0;
    this.game_over_message = null;
    this.starting_game = null;
  }

  Update(delta) {
    if (this.game_state == "pause") {
      this.ManageHUD();
      this.DrawGame();
      this.ShowPauseScreen();
      return;
    }

    let delta_time = delta / 1000;

    if (this.game_state == "newgame") {
      if(this.starting_game){return;}
      this.StartNewGame();
    }
    if (this.game_state == "play") {
      if (this.last_word_spawn >= this.word_spawn_interval) {
        this.SpawnWords();
        this.last_word_spawn = 0;
      }
      this.ManageDifficulty(delta_time);
      this.FloatWords(delta_time);
      this.O2Loss(delta_time, this.o2_loss);
      this.MoveCharacter(delta_time);
      this.DestroyWords();
      this.last_word_spawn += delta_time;
      this.last_phrase_spawn += delta_time;
      this.GetCharacterStatus();
      this.game_timer += delta_time;
    }
    if (this.game_state == "gameover") {
      if(this.character){this.character = null;}
      if(this.player_name){this.player_name = null;}
      if(this.starting_game){this.starting_game = null;}
      this.gameObjects = [];
      this.input = "";
      this.ShowGameOverScreen();
      this.UpdateScoreboard();
      this.counter = 0;
      return;
    }

    this.ManageHUD();
    this.DrawGame();
    this.UpdateScoreboard();

  }
  SetState(st) {
    if (this.states.indexOf(st) == -1) { return; }
    this.game_state = st;
    //console.log("Setting state",this.game_state);
  }
  SetGameScreen(canvas_ctx) {
    this.ctx = canvas_ctx;
  }
  SetWordList(list) {
    this.word_list = list;
  }
  DrawGame() {
    if (!this.ctx || !this.gameObjects.length - 1 > 0) { return; }
    //console.log(this.gameObjects.length,this.gameObjects[0].size);
    for (var go in this.gameObjects) {
      if (!this.gameObjects[go]) { return; }
      if (!this.gameObjects[go].destroyed) {
        this.gameObjects[go].Draw(this.ctx);
      }

    }
    ctx.fillStyle = "#9e5629";
    ctx.fillRect(525 - (this.input.length * 12), 345, this.input.length * 24, 50);
    ctx.font = "30px Verdana";
    ctx.fillStyle = "#f2ebdf";
    ctx.fillText(this.input, 525, 385);
  }
  SpawnWords() {
    if (this.game_state == "pause" || this.word_indexes.length < 1) { return; }
    let word_sprite;
    let word;
    let unit_index = this.word_indexes[Math.floor(Math.random() * this.word_indexes.length)];
    let selected_unit = this.word_list[unit_index];
    if(this.last_phrase_spawn > this.phrase_spawn_interval)
    {
      console.log("Spawning phrase");
      word_sprite = document.getElementById("phrase_sprite");
      if(!word_sprite){this.last_phrase_spawn = 0; return;}
      let phrases = selected_unit.filter((w) => w.type == "phrase");
      if(!phrases){this.last_phrase_spawn = 0; return;}
      word = phrases[Math.floor(Math.random() * phrases.length % phrases.length)];
      console.log(`word is ${word.word}`);
      if(!word){this.last_phrase_spawn = 0; return;}
      let word_object = new Word(word.word,word.translations,word.unit,word.type);
      word_object.SetSprite(word_sprite);
      word_object.size = new Vector2(800,200);
      word_object.pos = new Vector2(1200, Math.floor(Math.random() * 20));
      this.gameObjects.push(word_object);
      this.last_phrase_spawn = 0;
      this.last_word_spawn = 0;
      return;
    }
    word_sprite = document.getElementById("word_bubble");
    if(!word_sprite){return;}
    let words = selected_unit.filter((w) => w.type == "word");
    if(!words){return console.log("No words");}
    word = words[Math.floor(Math.random() * words.length % words.length)];
    if (!word) { return; }
    console.log(`Word is ${word.word}`);
    let word_object = new Word(word.word, word.translations,word.unit,word.type);
    word_object.SetSprite(word_sprite);
    word_object.size = new Vector2(256,256);
    word_object.pos = new Vector2(1200, Math.floor(Math.random() * 200)+50);
    this.gameObjects.push(word_object);
  }

  HandleInput(input) {
    input.preventDefault();
    if(this.game_state == "newgame")
    {
      if(this.word_indexes.length < 1){return;}
      if(input.key == "Enter")
      {
        this.player_name = this.input.length > 0?this.input:"player1";
        this.input = "";
        console.log(`Welcome ${this.player_name}`);
      }
      if (input.key == "Backspace") {
        let input_text = this.input.substring(0, this.input.length - 1);
        this.input = input_text;
        return;
      }
      if (this.input.length < 12 && input.key.length < 2) {
        this.input += input.key;
        return;
      }
    }
    if (!this.character) { return; }
    if (this.game_state != 'play') { return; }
    if (input.key == "Backspace") {
      let input_text = this.input.substring(0, this.input.length - 1);
      this.input = input_text;
      return;
    }
    if (this.input.length < 40 && input.key.length < 2) {
      this.input += input.key;

    }


    this.CheckForMatch();
  }
  CheckForMatch() {
    if (!this.character) { return; }
    for (var w in this.gameObjects) {
      if (this.gameObjects[w].word && this.gameObjects[w].translations) {
        if (this.gameObjects[w].destroyed || this.gameObjects[w].matched) { continue; }
        console.log(this.gameObjects[w].translations.indexOf(this.input))
        if (this.gameObjects[w].translations.indexOf(this.input) > -1) {
          this.score += this.input.length * 2;
          console.log(this.score);
          this.input = '';
          this.gameObjects[w].matched = true;
          this.character.IncreaseO2();
          this.words_matched += 1;

        }
      }

    }
  }
  ManageHUD() {
    if (!this.character) { return; }
    this.ctx.fillStyle = "#36dbf5";
    this.ctx.fillRect(this.character.pos.x + 190, this.character.pos.y + 210, 40, -this.character.o2_level * 175);
    if(!this.highscore){return;}
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "20px IMPACT";
    this.ctx.fillText(`${this.player_name}'s highscore: ${this.highscore}`,800,30);

  }
  FloatWords(delt) {
    if (this.game_state == "pause") { return; }
    for (let word in this.gameObjects) {
      let cw = this.gameObjects[word];
      if (!cw.word) { continue; }
      cw.pos = new Vector2(cw.pos.x - this.float_speed * delt * 10, cw.pos.y + (this.float_speed * 0.25) * delt);
    }
  }
  DestroyWords() {
    if (!this.character) { return; }
    let clear_destroyed_words = false;
    for (let wo in this.gameObjects) {
      if (this.gameObjects[wo].word) {
        let position = this.gameObjects[wo].pos.x;
        if (position <= -this.gameObjects[wo].size.x) {
          this.gameObjects[wo].destroyed = true;
          if (this.gameObjects[wo].matched != true) {
            let last_missed_word = document.getElementById("last_word");
            if (last_missed_word) { last_missed_word.innerHTML = this.gameObjects[wo].translations; }
            this.character.LoseWordO2(); this.words_missed += 1;
          }
          clear_destroyed_words = true;

        }

      }

    }
    if (clear_destroyed_words) {
      this.gameObjects = this.gameObjects.filter(function(x) { return x.destroyed == false });

    }
  }
  MoveCharacter(dtime) {
    if (!this.character) { return; }
    let step = Math.cos(((this.counter % 360) / 180 * Math.PI));
    this.character.pos = new Vector2(this.character.pos.x + (step * dtime * this.character_float_speed), this.character.pos.y + (step * dtime * this.character_float_speed));
    this.counter += 1;
  }
  O2Loss(dtime, loss) {
    if (!this.character) { return; }
    this.character.DecreaseO2(dtime, loss);
  }
  async GetCharacterStatus() {
    if (!this.character) { return; }
    if (this.game_state == "game_over") { return; }
    if (this.character.o2_level <= 0) {

      if(this.player_name)
      {
        
        
          this.game_state = "gameover";
          let updated = await new Promise((res,rej) =>{

            fetch('/updatehighscore',{
              method:"GET",
              headers:
              {
                "Content-Type":"application/json",
                "name":this.player_name,
                "score":this.score
              },
            }).then((res) => res.json()).then((result) => res(result))
            .catch((error) => rej());
          }).then((data) => data);
          if(updated){this.game_over_message = updated.message; return;}
        
      }
      this.game_state = "gameover";
    }
  }
  ManageDifficulty(dt)
  {
    if(this.float_speed >= this.max_float_speed){return;}
    let increment = (dt * 0.001);
    this.float_speed += (increment);
  }
 async StartNewGame() {
    if(!this.player_name)
    {
      if(!this.ctx){return;}
      this.ctx.fillStyle = "#263d6e";
      this.ctx.fillRect(50,100,900,200);
      this.ctx.font = "25px monospace";
      this.ctx.fillStyle = "#e0dbc1";
      this.ctx.fillText("Type your name and press enter to start the game.",50+(900*0.5),100 +(200*0.5));
      this.ctx.fillText("You must have at least one unit selected to start.(o.o)('')",50+(900*0.5),140 +(200*0.5));
      return;
    }
    this.starting_game = true;
    let hs = await new Promise((res,rej) =>{

      fetch('/gethighscore',
    {
      method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "player_name":this.player_name
          },
        
    }).then((res) => res.json()).then((resp) => {
      res(resp.score);
    })

    }).then((hscore) => hscore);

    if(hs){this.highscore = hs;}
    const character_sprite = document.getElementById("char_sprite");
    const last_word = document.getElementById("last_word");
    const unit_selector = document.getElementById("unit_selector");
    if(unit_selector){unit_selector.style.display = "none";}
    if (last_word) { last_word.innerHTML = ""; }
    if (!character_sprite) { return; }
    this.words_matched = 0;
    this.words_missed = 0;
    this.score = 0;
    this.game_over_message = null;
    this.float_speed = this.base_float_speed;
    this.last_word_spawn = 0;
    const new_char = new Character();
    new_char.size = new Vector2(400,400);
    new_char.SetSprite(character_sprite);
    this.character = new_char;
    this.gameObjects.push(new_char);
    this.game_state = "play";
  }
  ShowGameOverScreen() {
    if (!this.ctx) { return; }
    ctx.font = "bold 88px serif";
    ctx.fillStyle = "#141414";
    ctx.fillText("Game Over", 500, 200);
    if(this.game_over_message)
    {
      ctx.font = "bold 50px serif";
      ctx.fillText(this.game_over_message, 500, 300);
    }
    
  }
  ShowPauseScreen() {
    if (!this.ctx) { return; }
    ctx.font = "bold 50px serif";
    ctx.fillStyle = "#141414";
    ctx.fillText("Paused", 500, 200);
  }
  UpdateScoreboard() {
    let matched = document.getElementById("scoreboard_matched");
    let lost = document.getElementById("scoreboard_lost");
    let game_score = document.getElementById("game_score");
    if (!(matched && lost && game_score)) { return console.log("No scoreboard"); }
    matched.innerText = this.words_matched;
    lost.innerText = this.words_missed;
    game_score.innerHTML = `<span style="color:yellow;">SCORE</span><br>${this.score}`;
  }
  UpdateWordIndexes() {
    let new_indexes = [];
    let unit_selector = document.getElementById("unit_selector");
    if (!unit_selector) { return; }
    let unit_inputs = unit_selector.getElementsByTagName("input");
    if (!unit_inputs) { return; }
    for (let box in unit_inputs) {
      try
      {
        if (unit_inputs[box].checked) {
          let box_name = unit_inputs[box].name;
          if(!box_name){continue;}
          if (!(this.word_list[box_name])) { continue; }
          new_indexes.push(unit_inputs[box].name);
        }
      }
      catch(error)
      {
        continue;
      }
      
    }
    this.word_indexes = new_indexes;
  }

}