function Sprite(){
  this.sprite=[];
  this.palette=[];
  this.glovePalette=[];
};

function fetchSpriteData(rom, spriteUrl, onLoad){
  if (spriteUrl === 'random') {
    let rnd = Math.floor(Math.random() * (spriteDatabase.length - 2)) + 1;
    //if (rnd > 0) // removing vanilla link for now
    //  rnd++;
    spriteUrl = spriteDatabase[rnd].file;
  }

  if (spriteUrl === 'https://alttpr.s3.us-east-2.amazonaws.com/001.link.1.zspr') {
    if (onLoad) {
      onLoad(rom, null);
    }
  } else {
    fetch(spriteUrl)
      .then(response => checkStatus(response) && response.arrayBuffer())
      .then(buffer => {    
        var sprite = new Sprite();      
        var spriteData = new MarcFile(buffer);
        spriteData.littleEndian = true;
        
        if(spriteData.fileSize===0x7000){
          // Sprite file with graphics and without palette data
          sprite.sprite = spriteData.readBytes(0x7000);
          sprite.palette = defaultSpritePalette;
          sprite.glovePalette = defaultGlovePalette;
        }else if(spriteData.fileSize===0x7078){
          // Sprite file with graphics and palette data
          sprite.sprite = spriteData.readBytes(0x7000);
          sprite.palette = spriteData.readBytes(0x78);
          spriteData.seek(0x7036)
          var glove1 = spriteData.readBytes(0x2);
          spriteData.seek(0x7054);
          var glove2 = spriteData.readBytes(0x2);
          sprite.glovePalette = [...glove1, ...glove2];
        }else if(spriteData.fileSize===0x707C){
          // Sprite file with graphics and palette data including gloves
          sprite.sprite = spriteData.readBytes(0x7000);
          sprite.palette = spriteData.readBytes(0x78);
          sprite.glovePalette = spriteData.readBytes(0x4);
        }else if(spriteData.fileSize>=0x100000 && spriteData.fileSize<=0x200000){
          // Full rom with patched sprite, extract it
          spriteData.seek(0x80000);
          sprite.sprite = spriteData.readBytes(0x7000);
          spriteData.seek(0xDD308);
          sprite.palette = spriteData.readBytes(0x78);
          spriteData.seek(0xDEDF5);
          sprite.glovePalette = spriteData.readBytes(0x4);
        }else if(spriteData.readString(4)==='ZSPR'){
          parseZspr(sprite, spriteData);
        }

        if (onLoad) {
          onLoad(rom, sprite);
        }
      })
      .catch(err => console.error(err));
  }
}

function parseZspr(sprite, fileData){
  fileData.seek(0x9);
  var spriteOffset = fileData.readU32();
  var spriteSize = fileData.readU16();
  var paletteOffset = fileData.readU32();
  var paletteSize = fileData.readU16();

  fileData.seek(spriteOffset);
  sprite.sprite = fileData.readBytes(spriteSize);
  
  if(paletteSize===0){
    sprite.palette = defaultSpritePalette;
    sprite.glovePalette = defaultGlovePalette;
  }else{
    fileData.seek(paletteOffset);
    if(paletteSize===0x78){
      sprite.palette = fileData.readBytes(0x78);
      sprite.glovePalette = defaultGlovePalette;
    }else if(paletteSize===0x7C){
      sprite.palette = fileData.readBytes(0x78);
      sprite.glovePalette = fileData.readBytes(0x4);
    }
  }

  try{
    fileData.seek(0x1D);
    var skip = 2;
    while(skip && !fileData.isEOF()){
      if(fileData.readU16()===0){
        skip--;
      }
    }
    var author = '';
    while(author.length<28){
      var c = fileData.readU8();
      if(c===0){
        break;
      }
      author += String.fromCharCode(c);
    }
    if(author.length%2===1){
      author += ' ';
    }
    while(author.length<28){
      author = ' '+author+' ';
    }
    // conversion based on https://github.com/sporchia/alttp_vt_randomizer/blob/master/resources/js/rom.js
    sprite.author = author.toUpperCase().split("").map(item => {
      switch(item){
        case " ": return [0x9F, 0x9F];
        case "0": return [0x53, 0x79];
        case "1": return [0x54, 0x7A];
        case "2": return [0x55, 0x7B];
        case "3": return [0x56, 0x7C];
        case "4": return [0x57, 0x7D];
        case "5": return [0x58, 0x7E];
        case "6": return [0x59, 0x7F];
        case "7": return [0x5A, 0x80];
        case "8": return [0x5B, 0x81];
        case "9": return [0x5C, 0x82];
        case "A": return [0x5D, 0x83];
        case "B": return [0x5E, 0x84];
        case "C": return [0x5F, 0x85];
        case "D": return [0x60, 0x86];
        case "E": return [0x61, 0x87];
        case "F": return [0x62, 0x88];
        case "G": return [0x63, 0x89];
        case "H": return [0x64, 0x8A];
        case "I": return [0x65, 0x8B];
        case "J": return [0x66, 0x8C];
        case "K": return [0x67, 0x8D];
        case "L": return [0x68, 0x8E];
        case "M": return [0x69, 0x8F];
        case "N": return [0x6A, 0x90];
        case "O": return [0x6B, 0x91];
        case "P": return [0x6C, 0x92];
        case "Q": return [0x6D, 0x93];
        case "R": return [0x6E, 0x94];
        case "S": return [0x6F, 0x95];
        case "T": return [0x70, 0x96];
        case "U": return [0x71, 0x97];
        case "V": return [0x72, 0x98];
        case "W": return [0x73, 0x99];
        case "X": return [0x74, 0x9A];
        case "Y": return [0x75, 0x9B];
        case "Z": return [0x76, 0x9C];
        case "'": return [0x77, 0x9d];
        case ".": return [0xA0, 0xC0];
        case "/": return [0xA2, 0xC2];
        case ":": return [0xA3, 0xC3];
        case "_": return [0xA6, 0xC6];
        default: return [0x9F, 0x9F];
      }
    });
  }catch(e){}
  return sprite;
}

function checkStatus(response){
  if (!response.ok){
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }
  return response;
}

const defaultSpritePalette = [255, 127, 126, 35, 183, 17, 158, 54, 165, 20, 255, 1, 120, 16, 157,
  89, 71, 54, 104, 59, 74, 10, 239, 18, 92, 42, 113, 21, 24, 122,
  255, 127, 126, 35, 183, 17, 158, 54, 165, 20, 255, 1, 120, 16, 157,
  89, 128, 105, 145, 118, 184, 38, 127, 67, 92, 42, 153, 17, 24, 122,
  255, 127, 126, 35, 183, 17, 158, 54, 165, 20, 255, 1, 120, 16, 157,
  89, 87, 16, 126, 69, 243, 109, 185, 126, 92, 42, 39, 34, 24, 122,
  255, 127, 126, 35, 218, 17, 158, 54, 165, 20, 255, 1, 120, 16, 151,
  61, 71, 54, 104, 59, 74, 10, 239, 18, 126, 86, 114, 24, 24, 122];

const defaultGlovePalette = [246, 82, 118, 3];

const spriteDatabase = [{"name":"Random","author":"","version":1,"file":"random","tags":[]},
{"name":"Four Swords Link","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/4slink-armors.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/4slink-armors.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Abigail","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/abigail.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/abigail.1.zspr.png","tags":["Female"],"usage":["smz3"]},
{"name":"Adol","author":"Yuushia","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/adol.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/adol.1.zspr.png","tags":["Ys","Male"],"usage":["smz3","commercial"]},
{"name":"Adventure 2600","author":"Purple Peak","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/adventure-2600.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/adventure-2600.1.zspr.png","tags":["Atari"],"usage":["smz3"]},
{"name":"Aggretsuko","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/aggretsuko.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/aggretsuko.1.zspr.png","tags":["Cartoon","Animal","Female"],"usage":["smz3"]},
{"name":"Alice","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/alice.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/alice.1.zspr.png","tags":["Female"],"usage":["smz3"]},
{"name":"Angry Video Game Nerd","author":"ABOhiccups","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/angry-video-game-nerd.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/angry-video-game-nerd.1.zspr.png","tags":["Personality","Male"],"usage":["smz3","commercial"]},
{"name":"Arcane","author":"MM102","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/arcane.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/arcane.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Aria","author":"Maya Neko Comics","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/aria.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/aria.1.zspr.png","tags":["Female","Personality"],"usage":["smz3"]},
{"name":"Ark (No Cape)","author":"Dorana","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ark-dorana.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ark-dorana.2.zspr.png","tags":["Terranigma","Male"],"usage":["smz3","commercial"]},
{"name":"Ark (Cape)","author":"wzl","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ark.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ark.1.zspr.png","tags":["Terranigma","Male"],"usage":["smz3"]},
{"name":"Arrghus","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/arrghus.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/arrghus.3.zspr.png","tags":["Male","Legend of Zelda","ALTTP NPC","Boss"],"usage":["smz3"]},
{"name":"Astor","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/astor.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/astor.1.zspr.png","tags":["Villain","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Astronaut","author":"Malmo","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/astronaut.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/astronaut.2.zspr.png","tags":["IRL"],"usage":["smz3","commercial"]},
{"name":"Asuna","author":"Natsuru Kiyohoshi","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/asuna.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/asuna.2.zspr.png","tags":["Female","Sword Art Online"],"usage":["smz3","commercial"]},
{"name":"Baba","author":"malmo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/baba.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/baba.1.zspr.png","tags":["Baba is You"],"usage":["smz3","commercial"]},
{"name":"Baby Fro","author":"MochaJones10","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/baby-fro-mocha.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/baby-fro-mocha.1.zspr.png","tags":["Link","Male"],"usage":["smz3","commercial"]},
{"name":"Badeline","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/badeline.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/badeline.1.zspr.png","tags":["Celeste","Female"],"usage":["smz3","commercial"]},
{"name":"Bananas In Pyjamas","author":"codemann8","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bananas-in-pyjamas.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bananas-in-pyjamas.1.zspr.png","tags":["Cartoon"],"usage":["smz3","commercial"]},
{"name":"Bandit","author":"Fenrika","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bandit.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bandit.1.zspr.png","tags":["Mario"],"usage":["smz3","commercial"]},
{"name":"Batman","author":"Ninjakauz","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/batman.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/batman.1.zspr.png","tags":["Superhero","Male","DC Comics"],"usage":["smz3","commercial"]},
{"name":"Beau","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/beau.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/beau.1.zspr.png","tags":["Animal Crossing","Male","Animal"],"usage":["smz3","commercial"]},
{"name":"Bee","author":"TarThoron","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bee.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bee.1.zspr.png","tags":["ALTTP","NPC","Animal"],"usage":["smz3"]},
{"name":"Bel","author":"Kishi\/Krelbel","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bel.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bel.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Bewp","author":"Valechec","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bewp.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bewp.1.zspr.png","tags":["Animal","Streamer","Personality"],"usage":["smz3"]},
{"name":"Big Key","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bigkey.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bigkey.2.zspr.png","tags":["Legend of Zelda"],"usage":["smz3"]},
{"name":"Birb","author":"Dr. Deadrewski","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birb.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birb.2.zspr.png","tags":["Bird","Animal","Streamer"],"usage":["smz3","commercial"]},
{"name":"Birdfruit","author":"karafruit","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birdfruit.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birdfruit.1.zspr.png","tags":["Animal","Personality","Bird"],"usage":["smz3","commercial"]},
{"name":"Birdo","author":"BlackTycoon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birdo.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birdo.1.zspr.png","tags":["Female","Mario"],"usage":["smz3"]},
{"name":"Black Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blackmage.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blackmage.1.zspr.png","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Blacksmith Link","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blacksmithlink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blacksmithlink.1.zspr.png","tags":["Link","Male","Legend of Zelda","ALTTP NPC"],"usage":["smz3","commercial"]},
{"name":"Blazer","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blazer.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blazer.1.zspr.png","tags":["Male"],"usage":["smz3","commercial"]},
{"name":"Blossom","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blossom.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blossom.1.zspr.png","tags":["Female","Powerpuff Girls","Superhero","Cartoon Network"],"usage":["smz3"]},
{"name":"Bob","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bob.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bob.2.zspr.png","tags":["Randomizer","ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Bob Ross","author":"CaptainApathy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bobross.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bobross.1.zspr.png","tags":["Male","Personality"],"usage":["smz3","commercial"]},
{"name":"Boco the Chocobo","author":"TarThoron","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boco.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boco.2.zspr.png","tags":["Final Fantasy","Animal"],"usage":["smz3","commercial"]},
{"name":"Boo 2","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boo-two.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boo-two.1.zspr.png","tags":["Mario","Ghost"],"usage":["smz3","commercial"]},
{"name":"Boo","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boo.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boo.2.zspr.png","tags":["Mario","Ghost"],"usage":["smz3","commercial"]},
{"name":"Bottle o' Goo","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bottle_o_goo.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bottle_o_goo.1.zspr.png","tags":["Legend of Zelda"],"usage":["smz3"]},
{"name":"BotW Link","author":"Pasta La Vista","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/botw-link.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/botw-link.2.zspr.png","tags":["Legend of Zelda","Male"],"usage":["smz3","commercial"]},
{"name":"BotW Zelda","author":"Roo","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/botw-zelda.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/botw-zelda.1.zspr.png","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"Bowser","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowser.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowser.1.zspr.png","tags":["Male","Mario","Villain"],"usage":["smz3"]},
{"name":"Bowsette (Red)","author":"Sarah Shinespark","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowsette-red.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowsette-red.1.zspr.png","tags":["Mario","Female","Villain"],"usage":["smz3"]},
{"name":"Bowsette","author":"Sarah Shinespark","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowsette.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowsette.1.zspr.png","tags":["Mario","Female","Villain"],"usage":["smz3"]},
{"name":"Branch","author":"cbass601","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/branch.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/branch.1.zspr.png","tags":["Trolls","Male"],"usage":["smz3","commercial"]},
{"name":"Brian","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/brian.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/brian.1.zspr.png","tags":["Quest","Male"],"usage":["smz3","commercial"]},
{"name":"Broccoli","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/broccoli.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/broccoli.2.zspr.png","tags":["Legend of Zelda","ALTTP NPC"],"usage":["smz3"]},
{"name":"Bronzor","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bronzor.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bronzor.2.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"B.S. Boy","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bsboy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bsboy.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"B.S. Girl","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bsgirl.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bsgirl.1.zspr.png","tags":["Link","Female","Legend of Zelda"],"usage":["smz3"]},
{"name":"Bubbles","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bubbles.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bubbles.1.zspr.png","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"],"usage":["smz3"]},
{"name":"Bullet Bill","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bullet_bill.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bullet_bill.1.zspr.png","tags":["Mario"],"usage":["smz3"]},
{"name":"Buttercup","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/buttercup.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/buttercup.1.zspr.png","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"],"usage":["smz3"]},
{"name":"Cactuar","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cactuar.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cactuar.1.zspr.png","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Cadence","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cadence.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cadence.1.zspr.png","tags":["Crypt of the Necrodancer","Cadence of Hyrule","Female"],"usage":["smz3"]},
{"name":"Captain Novolin","author":"Fragger","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/captain-novolin.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/captain-novolin.1.zspr.png","tags":["Captain Novolin","Male"],"usage":["smz3","commercial"]},
{"name":"CarlSagan42","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/carlsagan42.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/carlsagan42.1.zspr.png","tags":["Personality","Mario","Streamer"],"usage":["commercial"]},
{"name":"Casual Zelda","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/casual-zelda.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/casual-zelda.1.zspr.png","tags":["Female","Legend of Zelda"],"usage":["smz3"]},
{"name":"Marvin the Cat","author":"Fish_waffle64","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cat.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cat.3.zspr.png","tags":["Personality","Animal","Male","Cat"],"usage":["smz3"]},
{"name":"Cat Boo","author":"JaySee87","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/catboo.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/catboo.1.zspr.png","tags":["Mario","Ghost","Cat"],"usage":["smz3","commercial"]},
{"name":"Catgirl (Hidari)","author":"Hidari","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/catgirl-hidari.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/catgirl-hidari.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"CD-i Link","author":"SnipSlum","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cdilink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cdilink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Celes","author":"Deagans","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/celes.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/celes.1.zspr.png","tags":["Final Fantasy","Female"],"usage":["smz3","commercial"]},
{"name":"Centaur Enos","author":"Ziusudra","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/centaur-enos.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/centaur-enos.1.zspr.png","tags":["Male","Personality"],"usage":["smz3"]},
{"name":"Charizard","author":"Charmander106","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/charizard.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/charizard.1.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Cheep Cheep","author":"Faw","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cheepcheep.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cheepcheep.1.zspr.png","tags":["Mario","Fish"],"usage":["smz3","commercial"]},
{"name":"Chef Pepper","author":"MiraPoix","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chef-pepper.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chef-pepper.1.zspr.png","tags":["BurgerTime","Male"],"usage":["smz3","commercial"]},
{"name":"Chibity","author":"Ecyro","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chibity.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chibity.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Chrizzz","author":"Chrizzz","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chrizzz.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chrizzz.1.zspr.png","tags":["Link","Personality"],"usage":["smz3","commercial"]},
{"name":"Chrono","author":"Dr. Deadrewski","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chrono.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chrono.1.zspr.png","tags":["Male","Chrono Trigger"],"usage":["smz3","commercial"]},
{"name":"Cinna","author":"norskmatty","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cinna.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cinna.2.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Cirno","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cirno.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cirno.1.zspr.png","tags":["Touhou Project","Female"],"usage":["smz3","commercial"]},
{"name":"Clifford","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clifford.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clifford.2.zspr.png","tags":["Animal","Dog"],"usage":["smz3"]},
{"name":"Clippy","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clippy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clippy.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Cloud","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cloud.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cloud.1.zspr.png","tags":["Male","Final Fantasy"],"usage":["smz3"]},
{"name":"Clyde","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clyde.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clyde.1.zspr.png","tags":["Pac-man","Namco","Ghost"],"usage":["smz3"]},
{"name":"Conker Neo","author":"Erock Kerberos Chew","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/conker-neo.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/conker-neo.1.zspr.png","tags":["Rare","Animal"],"usage":["smz3"]},
{"name":"Conker","author":"Charmander106\/SePH","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/conker.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/conker.1.zspr.png","tags":["Rare","Animal"],"usage":["smz3"]},
{"name":"Cornelius","author":"Lori","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cornelius.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cornelius.1.zspr.png","tags":["Odin Sphere","Male"],"usage":["smz3","commercial"]},
{"name":"Corona","author":"Herowho","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/corona.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/corona.2.zspr.png","tags":["King's Quest","Male"],"usage":["smz3","commercial"]},
{"name":"Crewmate","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/crewmate.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/crewmate.2.zspr.png","tags":["Among Us"],"usage":["smz3"]},
{"name":"Cucco","author":"Mike Trethewey","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cucco.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cucco.2.zspr.png","tags":["Legend of Zelda","ALTTP NPC","Bird"],"usage":["smz3","commercial"]},
{"name":"Cursor","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cursor.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cursor.2.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"D.Owls","author":"D.Owls","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/d_owls.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/d_owls.2.zspr.png","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Dark Link (Zelda 2)","author":"Wild Fang","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dark-link-z2.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dark-link-z2.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Dark Panda","author":"MM102","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dark-panda.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dark-panda.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Dark Boy","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkboy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkboy.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Girl","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkgirl.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkgirl.1.zspr.png","tags":["Link","Female","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Link (Tunic)","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darklink-tunic.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darklink-tunic.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Dark Link","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darklink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darklink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Swatchy","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkswatchy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkswatchy.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Dark Zelda","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkzelda.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkzelda.1.zspr.png","tags":["Female","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Zora","author":"iBazly","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkzora.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkzora.2.zspr.png","tags":["Legend of Zelda","ALTTP NPC"],"usage":["smz3","commercial"]},
{"name":"Deadpool (Mythic)","author":"Mythic","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadpool-mythic.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadpool-mythic.1.zspr.png","tags":["Superhero","Marvel","Male"],"usage":["smz3"]},
{"name":"Deadpool (SirCzah)","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadpool.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadpool.1.zspr.png","tags":["Superhero","Marvel","Male"],"usage":["smz3"]},
{"name":"Deadrock","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadrock.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadrock.1.zspr.png","tags":["Legend of Zelda","ALTTP NPC"],"usage":["smz3","commercial"]},
{"name":"Decidueye","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/decidueye.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/decidueye.1.zspr.png","tags":["Pokemon","Bird"],"usage":["smz3","commercial"]},
{"name":"Dekar","author":"The3X","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dekar.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dekar.1.zspr.png","tags":["Male","Lufia"],"usage":["smz3"]},
{"name":"Demon Link","author":"Krelbel","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/demonlink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/demonlink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Dennsen86","author":"Bonzaibier","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dennsen86.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dennsen86.1.zspr.png","tags":["Male","Personality"],"usage":["smz3"]},
{"name":"Diddy Kong","author":"copybookpizza10","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/diddy-kong.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/diddy-kong.1.zspr.png","tags":["Donkey Kong","Male","Monkey"],"usage":["smz3","commercial"]},
{"name":"Dig Dug","author":"kan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/digdug.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/digdug.1.zspr.png","tags":["Dig Dug"],"usage":["smz3"]},
{"name":"Dipper","author":"Sharpefern","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dipper.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dipper.1.zspr.png","tags":["Gravity Falls","Male"],"usage":["smz3"]},
{"name":"Discord","author":"JerryEris","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/discord-mlp.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/discord-mlp.1.zspr.png","tags":["My Little Pony","Male"],"usage":["smz3"]},
{"name":"Dragonite","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dragonite.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dragonite.2.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Drake The Dragon","author":"NO Body The Dragon","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/drake.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/drake.2.zspr.png","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Eggplant","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/eggplant.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/eggplant.1.zspr.png","tags":["Emoji"],"usage":["smz3"]},
{"name":"Ema Skye","author":"Linlinlin","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ema-skye.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ema-skye.1.zspr.png","tags":["Phoenix Wright","Female"],"usage":["smz3"]},
{"name":"EmoSaru","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/emosaru.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/emosaru.1.zspr.png","tags":["Personality","Streamer"],"usage":[]},
{"name":"Ezlo","author":"cbass601","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ezlo.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ezlo.1.zspr.png","tags":["Legend of Zelda","Male"],"usage":["smz3","commercial"]},
{"name":"Fi","author":"Lougaroc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fi.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fi.1.zspr.png","tags":["Legend of Zelda","female","Skyward Sword"],"usage":["smz3"]},
{"name":"Fierce Deity Link","author":"Jeffreygriggs2","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fierce-deity-link.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fierce-deity-link.3.zspr.png","tags":["Link","Legend of Zelda","Male"],"usage":["smz3"]},
{"name":"Finn Merten","author":"Devan2002","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/finn.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/finn.3.zspr.png","tags":["Cartoon Network","Male"],"usage":["smz3"]},
{"name":"Finny Bear","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/finny_bear.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/finny_bear.1.zspr.png","tags":["Animal","Personality"],"usage":["smz3"]},
{"name":"Floodgate Fish","author":"Delphi1024","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fish_floodgate.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fish_floodgate.1.zspr.png","tags":["Legend of Zelda","ALTTP NPC","Animal"],"usage":["smz3","commercial"]},
{"name":"Flavor Guy","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/flavor_guy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/flavor_guy.1.zspr.png","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Fox Link","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/foxlink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/foxlink.1.zspr.png","tags":["Link","Animal"],"usage":["smz3","commercial"]},
{"name":"Freya Crescent","author":"Demoncraze","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/freya.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/freya.1.zspr.png","tags":["Final Fantasy","Female"],"usage":["smz3"]},
{"name":"Frisk","author":"TobyFox\/MisterKerr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/frisk.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/frisk.2.zspr.png","tags":["Undertale"],"usage":["smz3","commercial"]},
{"name":"Frog Link","author":"Mike Trethewey","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/froglink.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/froglink.3.zspr.png","tags":["Link","Animal"],"usage":["smz3","commercial"]},
{"name":"Fujin","author":"FujinAkari","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fujin.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fujin.2.zspr.png","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Future Trunks","author":"Merciter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/future_trunks.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/future_trunks.1.zspr.png","tags":["Dragonball","Male"],"usage":["smz3"]},
{"name":"Gamer","author":"InTheBeef","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gamer.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gamer.2.zspr.png","tags":["Link","Male"],"usage":["smz3","commercial"]},
{"name":"Mini Ganon","author":"atth3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ganon.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ganon.2.zspr.png","tags":["Villain","ALTTP NPC","Male","Legend of Zelda","Boss"],"usage":["smz3","commercial"]},
{"name":"Ganondorf","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ganondorf.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ganondorf.2.zspr.png","tags":["Villain","ALTTP NPC","Male","Legend of Zelda","Boss"],"usage":["smz3"]},
{"name":"Garfield","author":"Fwiller","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garfield.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garfield.2.zspr.png","tags":["Male","Animal"],"usage":["smz3","commercial"]},
{"name":"Garnet","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garnet.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garnet.1.zspr.png","tags":["Female","Cartoon Network"],"usage":["smz3"]},
{"name":"Garo Master","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garomaster.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garomaster.1.zspr.png","tags":["Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"GBC Link","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gbc-link.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gbc-link.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Geno","author":"FedoraFriday","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/geno.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/geno.2.zspr.png","tags":["Mario","Male"],"usage":["smz3","commercial"]},
{"name":"GliitchWiitch","author":"Ivy-IV","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gliitchwiitch.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gliitchwiitch.1.zspr.png","tags":["Female","Personality","Streamer"],"usage":["smz3"]},
{"name":"Glove Color Link","author":"Wild Fang","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/glove-color-link.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/glove-color-link.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Gobli","author":"Lantis","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gobli.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gobli.1.zspr.png","tags":["Male"],"usage":["smz3"]},
{"name":"Gooey","author":"Lougaroc","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gooey.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gooey.2.zspr.png","tags":["Kirby"],"usage":["smz3","commercial"]},
{"name":"Goomba","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/goomba.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/goomba.1.zspr.png","tags":["Mario"],"usage":["smz3"]},
{"name":"Goose","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/goose.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/goose.1.zspr.png","tags":["Bird","Animal"],"usage":["smz3","commercial"]},
{"name":"Graalian Noob","author":"EGamer2","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/graalian-noob.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/graalian-noob.1.zspr.png","tags":["Graal","Male"],"usage":["smz3"]},
{"name":"GrandPOOBear","author":"proximitysound","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/grandpoobear.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/grandpoobear.2.zspr.png","tags":["Personality","Streamer","Animal","Male"],"usage":["smz3"]},
{"name":"Gretis","author":"SnakeGrunger","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gretis.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gretis.1.zspr.png","tags":["Male","Personality","Streamer"],"usage":["smz3","commercial"]},
{"name":"Gruncle Stan","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/grunclestan.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/grunclestan.1.zspr.png","tags":["Disney","Male"],"usage":["smz3"]},
{"name":"Guiz","author":"GuizDP","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/guiz.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/guiz.2.zspr.png","tags":["Personality","Streamer","Male"],"usage":["smz3","commercial"]},
{"name":"Hanna","author":"Maya-Neko","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hanna.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hanna.2.zspr.png","tags":["Female","Personality"],"usage":["smz3","commercial"]},
{"name":"Hardhat Beetle","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hardhat_beetle.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hardhat_beetle.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hat Kid","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hat-kid.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hat-kid.1.zspr.png","tags":["Female","A Hat in Time"],"usage":["smz3"]},
{"name":"Head Link","author":"TarThoron","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/head-link.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/head-link.1.zspr.png","tags":["ALTTP","Link","Male"],"usage":["smz3"]},
{"name":"Headless Link","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/headlesslink.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/headlesslink.2.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Heem","author":"Xonmean","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/heem.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/heem.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Hello Kitty","author":"qeeen","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hello_kitty.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hello_kitty.1.zspr.png","tags":["Female","Cat","Animal"],"usage":["smz3","commercial"]},
{"name":"Hero of Awakening","author":"Vonyee","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hero-of-awakening.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hero-of-awakening.1.zspr.png","tags":["Link","Male"],"usage":["smz3","commercial"]},
{"name":"Hero of Hyrule","author":"Vonyee","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hero-of-hyrule.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hero-of-hyrule.1.zspr.png","tags":["Link","Male"],"usage":["smz3","commercial"]},
{"name":"Hint Tile","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hint_tile.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hint_tile.1.zspr.png","tags":["ALTTP NPC"],"usage":["smz3"]},
{"name":"Hoarder (Bush)","author":"Restomak","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-bush.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-bush.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hoarder (Pot)","author":"Restomak","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-pot.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-pot.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hoarder (Rock)","author":"Restomak","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-rock.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-rock.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hollow Knight (Malmo\/Winter)","author":"Malmo and Atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hollow-knight-winter.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hollow-knight-winter.1.zspr.png","tags":["Hollow Knight"],"usage":["smz3","commercial"]},
{"name":"Hollow Knight","author":"Chew_Terr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hollow-knight.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hollow-knight.2.zspr.png","tags":["Hollow Knight"],"usage":["smz3","commercial"]},
{"name":"Homer Simpson","author":"Fwiller","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/homer.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/homer.1.zspr.png","tags":["Simpsons","Male"],"usage":["smz3","commercial"]},
{"name":"Hornet","author":"Spiffy","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hornet.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hornet.2.zspr.png","tags":["Hollow Knight","Female"],"usage":["smz3"]},
{"name":"Horseman","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/horse.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/horse.1.zspr.png","tags":["Link","Horse"],"usage":["smz3","commercial"]},
{"name":"Hotdog","author":"Xag & Tylo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hotdog.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hotdog.1.zspr.png","tags":["Link","Food"],"usage":["smz3"]},
{"name":"Hyrule Knight","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hyruleknight.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hyruleknight.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"iBazly","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ibazly.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ibazly.1.zspr.png","tags":["Personality","Streamer","Male"],"usage":["commercial"]},
{"name":"Ignignokt","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ignignokt.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ignignokt.3.zspr.png","tags":["Male","Alien","Cartoon Network","Aqua Teen Hunger Force"],"usage":["smz3"]},
{"name":"Informant Woman","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/informant_woman.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/informant_woman.1.zspr.png","tags":["ALTTP NPC","Female","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Inkling","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/inkling.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/inkling.1.zspr.png","tags":["Splatoon"],"usage":["smz3"]},
{"name":"Invisible Link","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/invisibleman.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/invisibleman.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Jack Frost","author":"xypotion","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jack-frost.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jack-frost.1.zspr.png","tags":["Shin Megami Tensei"],"usage":["smz3","commercial"]},
{"name":"Jason Frudnick","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jason_frudnick.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jason_frudnick.1.zspr.png","tags":["Blast Master","Male"],"usage":["smz3"]},
{"name":"Jasp","author":"Chonixtu","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jasp.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jasp.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Jogurt","author":"Nakuri","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jogurt.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jogurt.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Juzcook","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/juz.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/juz.1.zspr.png","tags":["Streamer","Male"],"usage":["smz3","commercial"]},
{"name":"Kaguya","author":"Linlinlin","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kaguya.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kaguya.1.zspr.png","tags":["Female","Love is War","Kaguya-sama"],"usage":["smz3","commercial"]},
{"name":"Kain","author":"Chew Terr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kain.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kain.2.zspr.png","tags":["Final Fantasy","Male"],"usage":["smz3","commercial"]},
{"name":"Katsura","author":"atth3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/katsura.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/katsura.2.zspr.png","tags":["Gintama","Cartoon","Male"],"usage":["smz3","commercial"]},
{"name":"Kecleon","author":"Gylergin","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kecleon.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kecleon.1.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Kefka","author":"Chew Terr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kefka.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kefka.2.zspr.png","tags":["Final Fantasy","Male","Villain"],"usage":["smz3","commercial"]},
{"name":"Kenny McCormick","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kenny_mccormick.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kenny_mccormick.1.zspr.png","tags":["South Park","Male"],"usage":["smz3"]},
{"name":"Ketchup","author":"t0uchan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ketchup.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ketchup.1.zspr.png","tags":["Tasty","IRL"],"usage":["smz3","commercial"]},
{"name":"Kholdstare","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kholdstare.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kholdstare.2.zspr.png","tags":["ALTTP NPC","Legend of Zelda","Boss"],"usage":["smz3"]},
{"name":"King Gothalion","author":"kickpixel","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/king_gothalion.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/king_gothalion.1.zspr.png","tags":["Streamer","Personality","Male"],"usage":["smz3"]},
{"name":"King Graham","author":"MisterKerr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/king_graham.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/king_graham.2.zspr.png","tags":["King's Quest","Male"],"usage":["smz3","commercial"]},
{"name":"Kinu","author":"UberNooga","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kinu.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kinu.1.zspr.png","tags":["Temtem"],"usage":["smz3","commercial"]},
{"name":"Kira","author":"Maya Neko Comics","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kira.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kira.1.zspr.png","tags":["Comics","Female"],"usage":["smz3","commercial"]},
{"name":"Kirby (Dreamland 3)","author":"Lougaroc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kirby-d3.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kirby-d3.1.zspr.png","tags":["Kirby"],"usage":["smz3","commercial"]},
{"name":"Kirby","author":"KHRoxas","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kirby-meta.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kirby-meta.1.zspr.png","tags":["Male","Kirby"],"usage":["smz3","commercial"]},
{"name":"Koragi","author":"Antroyst","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/koragi.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/koragi.1.zspr.png","tags":["Female","Personality"],"usage":["smz3","commercial"]},
{"name":"Kore8","author":"Skewer","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kore8.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kore8.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Korok","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/korok.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/korok.1.zspr.png","tags":["The Legend of Zelda","Wind Waker","NPC"],"usage":["smz3","commercial"]},
{"name":"Kriv","author":"UltChimi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kriv.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kriv.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Lakitu","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lakitu.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lakitu.1.zspr.png","tags":["Mario"],"usage":[]},
{"name":"Lapras","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lapras.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lapras.1.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"League Mascot","author":"ptrain24","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/league-mascot.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/league-mascot.1.zspr.png","tags":["Link","Male","Legend of Zelda","League"],"usage":["smz3","commercial"]},
{"name":"Lest","author":"PrideToRuleEarth","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lest.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lest.1.zspr.png","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Lestat","author":"Ziusudra","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lestat.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lestat.1.zspr.png","tags":["Male","Bahamut Lagoon"],"usage":["smz3"]},
{"name":"Lily","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lily.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lily.1.zspr.png","tags":["Blossom Tales","Female"],"usage":["smz3","commercial"]},
{"name":"Linja","author":"Razhagal","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linja.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linja.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Link Redrawn","author":"Spiffy","version":4,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/link-redrawn.4.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/link-redrawn.4.zspr.png","tags":["Link","ALTTP","Male"],"usage":["smz3"]},
{"name":"Link (Zelda 1)","author":"Starry Melody","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/link-z1.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/link-z1.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Hat Color Link","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linkhatcolor.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linkhatcolor.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Tunic Color Link","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linktuniccolor.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linktuniccolor.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Little Hylian","author":"MM102","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/little-hylian.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/little-hylian.1.zspr.png","tags":["Male","Personality","Pokemon"],"usage":["smz3"]},
{"name":"Pony","author":"Botchos","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/littlepony.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/littlepony.1.zspr.png","tags":["My Little Pony","Female","Animal"],"usage":["smz3"]},
{"name":"Locke","author":"Rose","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/locke.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/locke.1.zspr.png","tags":["Male","Final Fantasy"],"usage":["smz3"]},
{"name":"Figaro Merchant","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/locke_merchant.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/locke_merchant.1.zspr.png","tags":["Final Fantasy","Male"],"usage":["smz3"]},
{"name":"Lucario","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lucario.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lucario.1.zspr.png","tags":["Pokemon"],"usage":["smz3","commercial"]},
{"name":"Luffy","author":"BOtheMighty","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luffy.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luffy.2.zspr.png","tags":["Personality","Streamer","Male"],"usage":["smz3"]},
{"name":"Luigi","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luigi.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luigi.1.zspr.png","tags":["Male","Mario","Superhero"],"usage":["smz3","commercial"]},
{"name":"Luna Maindo","author":"IkkyLights","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luna-maindo.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luna-maindo.1.zspr.png","tags":["Female","Elsword"],"usage":["smz3"]},
{"name":"Lynel (BotW)","author":"Lougaroc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lynel-botw.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lynel-botw.1.zspr.png","tags":["Legend of Zelda","Villain"],"usage":["smz3","commercial"]},
{"name":"Madeline","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/madeline.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/madeline.1.zspr.png","tags":["Female","Celeste"],"usage":["smz3","commercial"]},
{"name":"Magus","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/magus.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/magus.1.zspr.png","tags":["Chrono Trigger","Villain","Male"],"usage":["smz3"]},
{"name":"Maiden","author":"Plan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/maiden.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/maiden.1.zspr.png","tags":["ALTTP NPC","Female","Legend of Zelda"],"usage":["smz3"]},
{"name":"Majora's Mask","author":"Dawn","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/majora.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/majora.1.zspr.png","tags":["Legend of Zelda","Majora's Mask","villain"],"usage":["smz3"]},
{"name":"Mallow (Cat)","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mallow-cat.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mallow-cat.1.zspr.png","tags":["Cat","Animal","Streamer"],"usage":["smz3","commercial"]},
{"name":"Manga Link","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mangalink.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mangalink.3.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Maple Queen","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/maplequeen.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/maplequeen.2.zspr.png","tags":["Female"],"usage":["smz3","commercial"]},
{"name":"Marin","author":"Nocturnesthesia","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/marin.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/marin.2.zspr.png","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"Mario (Classic)","author":"Damon","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mario-classic.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mario-classic.2.zspr.png","tags":["Mario","Male"],"usage":["smz3","commercial"]},
{"name":"Tanooki Mario","author":"Nocturnesthesia","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mario_tanooki.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mario_tanooki.2.zspr.png","tags":["Mario","Male"],"usage":["smz3"]},
{"name":"Mario and Cappy","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mariocappy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mariocappy.1.zspr.png","tags":["Mario","Male"],"usage":["smz3","commercial"]},
{"name":"Marisa Kirisame","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/marisa.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/marisa.1.zspr.png","tags":["Touhou Project","Female"],"usage":["smz3","commercial"]},
{"name":"Matthias","author":"Marcus Bolduc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/matthias.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/matthias.1.zspr.png","tags":["Redwall","Male","Cartoon","Book"],"usage":["smz3"]},
{"name":"Meatwad","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/meatwad.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/meatwad.2.zspr.png","tags":["Male","Aqua Teen Hunger Force","Cartoon Network"],"usage":["smz3"]},
{"name":"Medallions","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/medallions.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/medallions.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Medli","author":"Kzinssie","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/medli.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/medli.1.zspr.png","tags":["Legend of Zelda","Female","Bird"],"usage":["smz3","commercial"]},
{"name":"Megaman X","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/megaman-x.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/megaman-x.2.zspr.png","tags":["Male","Megaman"],"usage":["smz3"]},
{"name":"Megaman X2","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/megaman-x2.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/megaman-x2.1.zspr.png","tags":["Male","Megaman"],"usage":["smz3"]},
{"name":"Mega Man (Classic)","author":"CrebleStar","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/megaman.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/megaman.1.zspr.png","tags":["Male","Megaman"],"usage":["smz3"]},
{"name":"Baby Metroid","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/metroid.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/metroid.1.zspr.png","tags":["Metroid","Alien"],"usage":["smz3","commercial"]},
{"name":"MewLp","author":"MewLp","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mew.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mew.1.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Mike Jones","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mike-jones.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mike-jones.2.zspr.png","tags":["StarTropics","Male"],"usage":["smz3"]},
{"name":"Mimic","author":"Chew Terr","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mimic.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mimic.1.zspr.png","tags":["Villain","Dragon Quest"],"usage":["smz3"]},
{"name":"Minish Link","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/minish_link.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/minish_link.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Minish Cap Link","author":"InTheBeef","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/minishcaplink.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/minishcaplink.3.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Mipha","author":"RippedSnorlax","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mipha.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mipha.2.zspr.png","tags":["Legend of Zelda","Breath of the Wild","female"],"usage":["smz3"]},
{"name":"missingno","author":"AAhbxsujd","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/missingno.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/missingno.2.zspr.png","tags":["Pokemon"],"usage":["smz3","commercial"]},
{"name":"Moblin","author":"Noctai_","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/moblin.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/moblin.2.zspr.png","tags":["Legend of Zelda","ALTTP"],"usage":["smz3","commercial"]},
{"name":"Modern Link","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/modernlink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/modernlink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Mog","author":"Krelbel","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mog.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mog.2.zspr.png","tags":["Final Fantasy"],"usage":["smz3","commercial"]},
{"name":"Momiji Inubashiri","author":"Ardaceus","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/momiji.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/momiji.1.zspr.png","tags":["Touhou Project","Female"],"usage":["smz3","commercial"]},
{"name":"Moosh","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/moosh.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/moosh.1.zspr.png","tags":["Link","Male","Legend of Zelda","Animal"],"usage":["smz3"]},
{"name":"Mouse","author":"Malthaez","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mouse.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mouse.1.zspr.png","tags":["Link","Animal"],"usage":["smz3"]},
{"name":"Ms. Paint Dog","author":"TehRealSalt","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ms-paintdog.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ms-paintdog.1.zspr.png","tags":["Animal"],"usage":["smz3"]},
{"name":"Power Up with Pride Mushroom","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mushy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mushy.1.zspr.png","tags":["Pride"],"usage":["smz3"]},
{"name":"Nature Link","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/naturelink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/naturelink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Navi","author":"qwertymodo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/navi.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/navi.1.zspr.png","tags":["Female","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Navirou","author":"Lori","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/navirou.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/navirou.3.zspr.png","tags":["Monster Hunter"],"usage":["smz3","commercial"]},
{"name":"Ned Flanders","author":"JJ0033LL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ned-flanders.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ned-flanders.1.zspr.png","tags":["Male","Cartoon","Simpsons"],"usage":["smz3","commercial"]},
{"name":"Negative Link","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/negativelink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/negativelink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Neosad","author":"Dr. Deadrewski","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/neosad.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/neosad.2.zspr.png","tags":["Personality","Streamer"],"usage":["smz3","commercial"]},
{"name":"NES Link","author":"Mike Trethewey\/kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/neslink.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/neslink.2.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Ness","author":"Lantis","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ness.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ness.2.zspr.png","tags":["Male","Earthbound"],"usage":["smz3"]},
{"name":"Nia","author":"Mojonbo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/nia.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/nia.1.zspr.png","tags":["Xenoblade","Female"],"usage":["smz3"]},
{"name":"Niddraig","author":"Jakebob","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/niddraig.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/niddraig.2.zspr.png","tags":["Final Fantasy","Personality"],"usage":["smz3","commercial"]},
{"name":"Niko","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/niko.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/niko.1.zspr.png","tags":["OneShot","Cat"],"usage":["smz3","commercial"]},
{"name":"Ninten","author":"Plouni","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ninten.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ninten.1.zspr.png","tags":["Mother","Male","Earthbound"],"usage":["smz3","commercial"]},
{"name":"Octorok","author":"Fire-Luigi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/octorok.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/octorok.1.zspr.png","tags":["Enemy","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Olde Man","author":"Justin","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/olde-man.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/olde-man.1.zspr.png","tags":["Male","NPC","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Old Man","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/oldman.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/oldman.2.zspr.png","tags":["ALTTP NPC","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Ori","author":"Phant","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ori.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ori.2.zspr.png","tags":["Ori","Male"],"usage":["smz3","commercial"]},
{"name":"Outline Link","author":"VT","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/outlinelink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/outlinelink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Paper Mario","author":"Fire-Luigi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/paper-mario.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/paper-mario.1.zspr.png","tags":["Mario","Male","Super Mario"],"usage":["smz3","commercial"]},
{"name":"Parallel Worlds Link","author":"SePH\/InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/parallelworldslink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/parallelworldslink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Paula","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/paula.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/paula.1.zspr.png","tags":["Earthbound","Female"],"usage":["smz3"]},
{"name":"Princess Peach","author":"RoPan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/peach.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/peach.1.zspr.png","tags":["Mario","Princess","Female"],"usage":["smz3"]},
{"name":"Penguin Link","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/penguinlink.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/penguinlink.2.zspr.png","tags":["Link","Animal"],"usage":["smz3"]},
{"name":"Pete","author":"Lantis","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pete.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pete.2.zspr.png","tags":["Male","Harvest Moon"],"usage":["smz3"]},
{"name":"Phoenix Wright","author":"SnipSlum","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/phoenix-wright.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/phoenix-wright.1.zspr.png","tags":["Male","Ace Attorney"],"usage":["smz3","commercial"]},
{"name":"Pikachu","author":"t0uchan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pikachu.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pikachu.2.zspr.png","tags":["Pokemon"],"usage":["smz3","commercial"]},
{"name":"Pink Ribbon Link","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pinkribbonlink.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pinkribbonlink.3.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Piranha Plant","author":"lecremateur","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/piranha_plant.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/piranha_plant.1.zspr.png","tags":["Mario","Villain"],"usage":["smz3","commercial"]},
{"name":"Plague Knight","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/plagueknight.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/plagueknight.1.zspr.png","tags":["Shovel Knight","Male"],"usage":["smz3"]},
{"name":"Plouni","author":"Plouni","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/plouni.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/plouni.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Pokey","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pokey.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pokey.3.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Popoi","author":"ItsSupercar","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/popoi.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/popoi.1.zspr.png","tags":["Secret of Mana","Male"],"usage":["smz3","commercial"]},
{"name":"Poppy","author":"cbass601","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/poppy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/poppy.1.zspr.png","tags":["Trolls","Female"],"usage":["smz3","commercial"]},
{"name":"Porg Knight","author":"PorgCollector","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/porg_knight.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/porg_knight.1.zspr.png","tags":["Star Wars"],"usage":["smz3","commercial"]},
{"name":"Power Ranger","author":"Zeta Xero","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/power-ranger.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/power-ranger.1.zspr.png","tags":["Power Ranger"],"usage":["smz3","commercial"]},
{"name":"Powerpuff Girl","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/powerpuff_girl.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/powerpuff_girl.1.zspr.png","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"],"usage":["smz3"]},
{"name":"Pride Link","author":"proximitysound","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pridelink.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pridelink.2.zspr.png","tags":["Link","Male","Legend of Zelda","Pride"],"usage":["smz3"]},
{"name":"Primm","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/primm.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/primm.1.zspr.png","tags":["Secret of Mana","Female"],"usage":["smz3"]},
{"name":"Princess Bubblegum","author":"Devan2002","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/princess_bubblegum.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/princess_bubblegum.1.zspr.png","tags":["Female","Cartoon Network"],"usage":["smz3"]},
{"name":"Prof. Renderer Grizzleton","author":"Professor Renderer","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/prof-renderer-grizzleton.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/prof-renderer-grizzleton.2.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"The Professor","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/professor.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/professor.1.zspr.png","tags":["Personality","Rush","Male"],"usage":["smz3"]},
{"name":"Psyduck","author":"skovacs1","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/psyduck.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/psyduck.2.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"The Pug","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pug.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pug.1.zspr.png","tags":["Personality","Animal","Streamer","Male"],"usage":["smz3","commercial"]},
{"name":"Purple Chest","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/purplechest-bottle.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/purplechest-bottle.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Pyro","author":"malmo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pyro.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pyro.1.zspr.png","tags":["Team Fortress","Male"],"usage":["smz3","commercial"]},
{"name":"QuadBanger","author":"Kai Gomez","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/quadbanger.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/quadbanger.1.zspr.png","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Rainbow Link","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rainbowlink.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rainbowlink.2.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Rat","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rat.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rat.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Red Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/red-mage.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/red-mage.1.zspr.png","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Remeer","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/remeer.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/remeer.1.zspr.png","tags":["Brain Lord","Male"],"usage":["smz3","commercial"]},
{"name":"Remus R Black","author":"The3rdX","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/remus-ruldufus-black.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/remus-ruldufus-black.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Reverse Mail Order","author":"Wild Fang","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/reverse-mails.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/reverse-mails.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Rick","author":"Eric the Terrible\/Devan 2002","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rick.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rick.2.zspr.png","tags":["Male","Cartoon Network"],"usage":["smz3"]},
{"name":"Robo-Link 9000","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/robotlink.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/robotlink.2.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Rocko","author":"t0uchan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rocko.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rocko.2.zspr.png","tags":["Male","Nickelodeon"],"usage":["smz3","commercial"]},
{"name":"Rottytops","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rottytops.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rottytops.2.zspr.png","tags":["Cartoon"],"usage":["smz3"]},
{"name":"Rover","author":"NO Body the Dragon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rover.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rover.1.zspr.png","tags":["Male","Animal Crossing","Cat"],"usage":["smz3","commercial"]},
{"name":"Roy Koopa","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/roykoopa.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/roykoopa.1.zspr.png","tags":["Male","Mario"],"usage":["smz3","commercial"]},
{"name":"Rumia","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rumia.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rumia.1.zspr.png","tags":["Touhou Project","Female"],"usage":["smz3","commercial"]},
{"name":"Rydia","author":"Sho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rydia.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rydia.1.zspr.png","tags":["Final Fantasy","Female"],"usage":["smz3","commercial"]},
{"name":"Ryu","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ryu.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ryu.2.zspr.png","tags":["Male","Street Fighter"],"usage":["smz3"]},
{"name":"Sailor Jupiter","author":"Sharpefern","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-jupiter.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-jupiter.1.zspr.png","tags":["Sailor Moon","Female"],"usage":["smz3","commercial"]},
{"name":"Sailor Mars","author":"Sharpefern","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-mars.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-mars.1.zspr.png","tags":["Sailor Moon","Female"],"usage":["smz3","commercial"]},
{"name":"Sailor Mercury","author":"Sharpefern","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-mercury.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-mercury.1.zspr.png","tags":["Sailor Moon","Female"],"usage":["smz3","commercial"]},
{"name":"Sailor Venus","author":"Sharpefern","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-venus.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailor-venus.1.zspr.png","tags":["Sailor Moon","Female"],"usage":["smz3","commercial"]},
{"name":"Sailor Moon","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailormoon.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailormoon.1.zspr.png","tags":["Sailor Moon","Female","Cartoon"],"usage":["smz3"]},
{"name":"Saitama","author":"Dabeanjelly\/Ath3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/saitama.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/saitama.2.zspr.png","tags":["Male","Superhero"],"usage":["smz3","commercial"]},
{"name":"Samus (Super Metroid)","author":"Ben G","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus-sm.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus-sm.1.zspr.png","tags":["Metroid","Female"],"usage":["smz3","commercial"]},
{"name":"Samus","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus.2.zspr.png","tags":["Metroid","Female"],"usage":["smz3"]},
{"name":"Samus (Classic)","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus_classic.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus_classic.1.zspr.png","tags":["Metroid","Female"],"usage":["smz3"]},
{"name":"Santa Hat Link","author":"Lexitik","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/santahat-link.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/santahat-link.1.zspr.png","tags":["Link","Male"],"usage":["smz3","commercial"]},
{"name":"Santa Link","author":"HOHOHO","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/santalink.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/santalink.3.zspr.png","tags":["Link","Male","Legend of Zelda","Festive"],"usage":["smz3","commercial"]},
{"name":"Scholar","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/scholar.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/scholar.1.zspr.png","tags":["Link","Male"],"usage":["smz3","commercial"]},
{"name":"Selan","author":"atth3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/selan.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/selan.2.zspr.png","tags":["Lufia","Female"],"usage":["smz3","commercial"]},
{"name":"SevenS1ns","author":"Hroun","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sevens1ns.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sevens1ns.1.zspr.png","tags":["Personality","Streamer","Male"],"usage":["smz3"]},
{"name":"Shadow","author":"CGG Zayik","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shadow.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shadow.1.zspr.png","tags":["Final Fantasy","Male"],"usage":["smz3"]},
{"name":"Shadow Sakura","author":"iBazly","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shadowsaku.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shadowsaku.2.zspr.png","tags":["Personality","Streamer","Female"],"usage":["commercial"]},
{"name":"Shantae","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shantae.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shantae.1.zspr.png","tags":["Shantae","Female"],"usage":["smz3"]},
{"name":"Shinmyoumaru Sakuna","author":"Pasta La Vista","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shinmyoumaru-sukuna.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shinmyoumaru-sukuna.1.zspr.png","tags":["Touhou","Female"],"usage":["smz3","commercial"]},
{"name":"Shuppet","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shuppet.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shuppet.2.zspr.png","tags":["Pokemon","Ghost"],"usage":["smz3"]},
{"name":"Shy Gal","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shy-gal.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shy-gal.1.zspr.png","tags":["Mario","Female"],"usage":["smz3","commercial"]},
{"name":"Shy Guy","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shy-guy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shy-guy.1.zspr.png","tags":["Mario"],"usage":["smz3"]},
{"name":"SighnWaive","author":"GenoCL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sighn_waive.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sighn_waive.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Skunk","author":"Hiveul","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/skunk.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/skunk.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Slime","author":"KamenRideDecade","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/slime.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/slime.1.zspr.png","tags":["Dragon Quest"],"usage":["smz3","commercial"]},
{"name":"Slowpoke","author":"Joey_Rat","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/slowpoke.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/slowpoke.2.zspr.png","tags":["Pokemon"],"usage":["smz3","commercial"]},
{"name":"SNES Controller","author":"cbass601","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/snes-controller.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/snes-controller.2.zspr.png","tags":["SNES"],"usage":["smz3","commercial"]},
{"name":"Sobble","author":"Driekiann","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sobble.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sobble.1.zspr.png","tags":["Pokemon"],"usage":["smz3","commercial"]},
{"name":"Soda Can","author":"Zarby89","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sodacan.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sodacan.1.zspr.png","tags":["Sprite","Tasty","IRL"],"usage":["smz3","commercial"]},
{"name":"Sokka","author":"Sharpefern","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sokka.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sokka.1.zspr.png","tags":["Male","Avatar the Last Airbender"],"usage":["smz3","commercial"]},
{"name":"Solaire of Astora","author":"Knilip","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/solaire.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/solaire.1.zspr.png","tags":["Dark Souls","Male"],"usage":["smz3"]},
{"name":"Hyrule Soldier","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/soldiersprite.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/soldiersprite.1.zspr.png","tags":["Legend of Zelda","ALTTP NPC"],"usage":["smz3","commercial"]},
{"name":"Sonic the Hedgehog","author":"Osaka","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sonic.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sonic.1.zspr.png","tags":["Male","Sonic the Hedgehog"],"usage":["smz3","commercial"]},
{"name":"Sora","author":"roxas232","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sora.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sora.1.zspr.png","tags":["Male","Kingdom Hearts"],"usage":["smz3","commercial"]},
{"name":"Sora (KH1)","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sora_kh1.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sora_kh1.1.zspr.png","tags":["Male","Kingdom Hearts"],"usage":["smz3","commercial"]},
{"name":"Spiked Roller","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/spikedroller.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/spikedroller.1.zspr.png","tags":["ALTTP","NPC"],"usage":["smz3"]},
{"name":"Spongebob Squarepants","author":"JJ0033LL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/spongebob.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/spongebob.1.zspr.png","tags":["Male","Spongebob Squarepants"],"usage":["smz3","commercial"]},
{"name":"Squall","author":"Maessan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squall.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squall.1.zspr.png","tags":["Male","Final Fantasy"],"usage":["smz3"]},
{"name":"Squirrel","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squirrel.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squirrel.1.zspr.png","tags":["Animal","Personality","Streamer"],"usage":["smz3"]},
{"name":"Squirtle","author":"Numberplay","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squirtle.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squirtle.1.zspr.png","tags":["Pokemon"],"usage":["smz3","commercial"]},
{"name":"Stalfos","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stalfos.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stalfos.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Stan","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stan.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stan.2.zspr.png","tags":["Male","Okage: Shadow King"],"usage":["smz3"]},
{"name":"Static Link","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/staticlink.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/staticlink.2.zspr.png","tags":["Link","Male","Legend of Zelda","Randomizer"],"usage":["smz3"]},
{"name":"Steamed Hams","author":"AFewGoodTaters","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/steamedhams.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/steamedhams.1.zspr.png","tags":["Link","Cartoon"],"usage":["smz3"]},
{"name":"Stick Man","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stick_man.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stick_man.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Super Bomb","author":"Ninjakauz","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/superbomb.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/superbomb.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Super Bunny","author":"TheOkayGuy","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/superbunny.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/superbunny.2.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Super Meat Boy","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/supermeatboy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/supermeatboy.1.zspr.png","tags":["Male","Meat Boy"],"usage":["smz3","commercial"]},
{"name":"Susie","author":"Zandra","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/susie.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/susie.1.zspr.png","tags":["Female","Undertale","Deltarune"],"usage":["smz3"]},
{"name":"Swatchy","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/swatchy.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/swatchy.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Swiper","author":"Purple Peak","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/swiper.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/swiper.2.zspr.png","tags":["Male","Villain","Dora the Explorer"],"usage":["smz3"]},
{"name":"TASBot","author":"GenoCL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tasbot.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tasbot.1.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Tea Time","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/teatime.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/teatime.1.zspr.png","tags":["Personality","Streamer"],"usage":["smz3"]},
{"name":"Terra (Esper)","author":"All-in-one Mighty","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/terra.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/terra.1.zspr.png","tags":["Final Fantasy","Female"],"usage":["smz3"]},
{"name":"Terry (Contact DS)","author":"CD-Mestay","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/terry.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/terry.1.zspr.png","tags":["Male","Contact DS"],"usage":["smz3"]},
{"name":"Tetra","author":"Ferelheart","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tetra.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tetra.1.zspr.png","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"TGH","author":"Drew Wise, pizza_for_free","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tgh.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tgh.1.zspr.png","tags":["Personality","Streamer","Male"],"usage":["smz3","commercial"]},
{"name":"Thief","author":"Devan2002","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thief.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thief.1.zspr.png","tags":["ALTTP NPC","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"ThinkDorm","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thinkdorm.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thinkdorm.1.zspr.png","tags":["ALTTP NPC","Villain"],"usage":["smz3"]},
{"name":"Thomcrow","author":"Thom","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thomcrow.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thomcrow.1.zspr.png","tags":["Personality","Streamer","Male","Bird"],"usage":["smz3","commercial"]},
{"name":"Tile","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tile.3.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tile.3.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Tingle","author":"Xenobond","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tingle.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tingle.1.zspr.png","tags":["Legend of Zelda","Male"],"usage":["smz3","commercial"]},
{"name":"TMNT","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tmnt.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tmnt.1.zspr.png","tags":["Animal","Male","Cartoon"],"usage":["smz3"]},
{"name":"Toad","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toad.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toad.2.zspr.png","tags":["Male","Mario"],"usage":["smz3","commercial"]},
{"name":"Toadette","author":"Devan2002","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toadette.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toadette.2.zspr.png","tags":["Female","Mario"],"usage":["smz3"]},
{"name":"Captain Toadette","author":"Devan2002","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toadette_captain.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toadette_captain.1.zspr.png","tags":["Female","Mario"],"usage":["smz3"]},
{"name":"TotemLinks","author":"Yotohan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/totem-links.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/totem-links.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Trogdor the Burninator","author":"Mike Trethewey\/kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/trogdor.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/trogdor.2.zspr.png","tags":["Male"],"usage":["smz3","commercial"]},
{"name":"TP Zelda","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/twilightprincesszelda.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/twilightprincesszelda.2.zspr.png","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"TwoFaced","author":"Devan2002","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/two_faced.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/two_faced.2.zspr.png","tags":["Personality"],"usage":["smz3"]},
{"name":"Ty the Tasmanian Tiger","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ty.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ty.1.zspr.png","tags":["Animal","Ty the Tasmanian Tiger"],"usage":["smz3"]},
{"name":"Ultros","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ultros.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ultros.2.zspr.png","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Valeera","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/valeera.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/valeera.1.zspr.png","tags":["Warcraft","Female"],"usage":["smz3","commercial"]},
{"name":"VanillaLink","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vanillalink.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vanillalink.1.zspr.png","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Vaporeon","author":"Aquana","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vaporeon.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vaporeon.1.zspr.png","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Vegeta","author":"Merciter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vegeta.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vegeta.1.zspr.png","tags":["Male","Dragonball"],"usage":["smz3"]},
{"name":"Vera","author":"aitchFactor","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vera.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vera.1.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Vitreous","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vitreous.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vitreous.1.zspr.png","tags":["ALTTP NPC","Legend of Zelda","Boss"],"usage":["smz3","commercial"]},
{"name":"Vivi","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vivi.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vivi.1.zspr.png","tags":["Final Fantasy","Male"],"usage":["smz3"]},
{"name":"Vivian","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vivian.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vivian.1.zspr.png","tags":["Mario","Female"],"usage":["smz3"]},
{"name":"Wario","author":"Deagans","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wario.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wario.1.zspr.png","tags":["Male","Mario","Villain"],"usage":["smz3","commercial"]},
{"name":"White Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/whitemage.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/whitemage.1.zspr.png","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Will","author":"Xenobond","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/will.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/will.1.zspr.png","tags":["Illusion of Gaia","Male"],"usage":["smz3","commercial"]},
{"name":"Wizzrobe","author":"iBazly","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wizzrobe.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wizzrobe.2.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial"]},
{"name":"Wolf Link (Festive)","author":"Fish\/Beef-Chan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wolf_link.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wolf_link.1.zspr.png","tags":["Link","Male","Legend of Zelda","Animal","Festive"],"usage":["smz3"]},
{"name":"Wolf Link (TP)","author":"Gfish59","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wolf_link_tp.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wolf_link_tp.1.zspr.png","tags":["Link","Male","Legend of Zelda","Animal"],"usage":["smz3","commercial"]},
{"name":"Yoshi","author":"Yotohan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/yoshi.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/yoshi.1.zspr.png","tags":["Mario"],"usage":["smz3"]},
{"name":"Yunica Tovah","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/yunica.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/yunica.2.zspr.png","tags":["Female","Ys"],"usage":["smz3"]},
{"name":"Zandra","author":"ZandraVandra","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zandra.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zandra.2.zspr.png","tags":["Personality","Streamer","Female"],"usage":["smz3","commercial"]},
{"name":"Zebra Unicorn","author":"Brass Man","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zebraunicorn.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zebraunicorn.1.zspr.png","tags":["Animal","Personlity","Streamer"],"usage":["smz3"]},
{"name":"Zeckemyro","author":"aitchFactor","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zeck.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zeck.2.zspr.png","tags":["Personality"],"usage":["smz3","commercial"]},
{"name":"Zelda","author":"Myriachan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zelda.1.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zelda.1.zspr.png","tags":["ALTTP NPC","Female","Legend of Zelda"],"usage":["smz3","commercial"]},
{"name":"Zero Suit Samus","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zerosuitsamus.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zerosuitsamus.2.zspr.png","tags":["Metroid","Female"],"usage":["smz3"]},
{"name":"Zora","author":"Zarby, InTheBeef","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zora.2.zspr","preview":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zora.2.zspr.png","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3","commercial"]}];