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
{"name":"Four Swords Link","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/4slink-armors.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Abigail","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/abigail.1.zspr","tags":["Female"],"usage":["smz3"]},
{"name":"Adol","author":"Yuushia","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/adol.1.zspr","tags":["Ys","Male"],"usage":["commercial","smz3"]},
{"name":"Aggretsuko","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/aggretsuko.1.zspr","tags":["Cartoon","Animal","Female"],"usage":["smz3"]},
{"name":"Alice","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/alice.1.zspr","tags":["Female"],"usage":["smz3"]},
{"name":"Angry Video Game Nerd","author":"ABOhiccups","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/angry-video-game-nerd.1.zspr","tags":["Personality","Male"],"usage":["commercial","smz3"]},
{"name":"Arcane","author":"MM102","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/arcane.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Ark (No Cape)","author":"Dorana","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ark-dorana.2.zspr","tags":["Terranigma","Male"],"usage":["commercial","smz3"]},
{"name":"Ark (Cape)","author":"wzl","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ark.1.zspr","tags":["Terranigma","Male"],"usage":["smz3"]},
{"name":"Arrghus","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/arrghus.3.zspr","tags":["Male","Legend of Zelda","ALTTP NPC","Boss"],"usage":["smz3"]},
{"name":"Astronaut","author":"Malmo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/astronaut.1.zspr","tags":["IRL"],"usage":["commercial","smz3"]},
{"name":"Asuna","author":"Natsuru Kiyohoshi","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/asuna.2.zspr","tags":["Female","Sword Art Online"],"usage":["commercial","smz3"]},
{"name":"Badeline","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/badeline.1.zspr","tags":["Celeste","Female"],"usage":["commercial","smz3"]},
{"name":"Bananas In Pyjamas","author":"codemann8","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bananas-in-pyjamas.1.zspr","tags":["Cartoon"],"usage":["commercial","smz3"]},
{"name":"Bandit","author":"Fenrika","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bandit.1.zspr","tags":["Mario"],"usage":["commercial","smz3"]},
{"name":"Batman","author":"Ninjakauz","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/batman.1.zspr","tags":["Superhero","Male","DC Comics"],"usage":["commercial","smz3"]},
{"name":"Beau","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/beau.1.zspr","tags":["Animal Crossing","Male","Animal"],"usage":["commercial","smz3"]},
{"name":"Bewp","author":"Valechec","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bewp.1.zspr","tags":["Animal","Streamer","Personality"],"usage":["smz3"]},
{"name":"Big Key","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bigkey.2.zspr","tags":["Legend of Zelda"],"usage":["smz3"]},
{"name":"Birb","author":"Dr. Deadrewski","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birb.2.zspr","tags":["Bird","Animal","Streamer"],"usage":["commercial","smz3"]},
{"name":"Birdo","author":"BlackTycoon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/birdo.1.zspr","tags":["Female","Mario"],"usage":["smz3"]},
{"name":"Black Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blackmage.1.zspr","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Blacksmith Link","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blacksmithlink.1.zspr","tags":["Link","Male","Legend of Zelda","ALTTP NPC"],"usage":["commercial","smz3"]},
{"name":"Blazer","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blazer.1.zspr","tags":["Male"],"usage":["commercial","smz3"]},
{"name":"Blossom","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/blossom.1.zspr","tags":["Female","Powerpuff Girls","Superhero","Cartoon Network"],"usage":["smz3"]},
{"name":"Bob","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bob.2.zspr","tags":["Randomizer","ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Bob Ross","author":"CaptainApathy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bobross.1.zspr","tags":["Male","Personality"],"usage":["commercial","smz3"]},
{"name":"Boco the Chocobo","author":"TarThoron","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boco.2.zspr","tags":["Final Fantasy","Animal"],"usage":["commercial","smz3"]},
{"name":"Boo 2","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boo-two.1.zspr","tags":["Mario","Ghost"],"usage":["commercial","smz3"]},
{"name":"Boo","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/boo.2.zspr","tags":["Mario","Ghost"],"usage":["commercial","smz3"]},
{"name":"Bottle o' Goo","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bottle_o_goo.1.zspr","tags":["Legend of Zelda"],"usage":["smz3"]},
{"name":"BotW Link","author":"Pasta La Vista","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/botw-link.1.zspr","tags":["Legend of Zelda","Male"],"usage":["commercial","smz3"]},
{"name":"BotW Zelda","author":"Roo","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/botw-zelda.1.zspr","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"Bowser","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowser.1.zspr","tags":["Male","Mario","Villain"],"usage":["smz3"]},
{"name":"Bowsette (Red)","author":"Sarah Shinespark","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowsette-red.1.zspr","tags":["Mario","Female","Villain"],"usage":["smz3"]},
{"name":"Bowsette","author":"Sarah Shinespark","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bowsette.1.zspr","tags":["Mario","Female","Villain"],"usage":["smz3"]},
{"name":"Branch","author":"cbass601","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/branch.1.zspr","tags":["Trolls","Male"],"usage":["commercial","smz3"]},
{"name":"Brian","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/brian.1.zspr","tags":["Quest","Male"],"usage":["commercial","smz3"]},
{"name":"Broccoli","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/broccoli.2.zspr","tags":["Legend of Zelda","ALTTP NPC"],"usage":["smz3"]},
{"name":"Bronzor","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bronzor.2.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"B.S. Boy","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bsboy.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"B.S. Girl","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bsgirl.1.zspr","tags":["Link","Female","Legend of Zelda"],"usage":["smz3"]},
{"name":"Bubbles","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bubbles.1.zspr","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"],"usage":["smz3"]},
{"name":"Bullet Bill","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/bullet_bill.1.zspr","tags":["Mario"],"usage":["smz3"]},
{"name":"Buttercup","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/buttercup.1.zspr","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"],"usage":["smz3"]},
{"name":"Cactuar","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cactuar.1.zspr","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Cadence","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cadence.1.zspr","tags":["Crypt of the Necrodancer","Cadence of Hyrule","Female"],"usage":["smz3"]},
{"name":"CarlSagan42","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/carlsagan42.1.zspr","tags":["Personality","Mario","Streamer"],"usage":["commercial"]},
{"name":"Casual Zelda","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/casual-zelda.1.zspr","tags":["Female","Legend of Zelda"],"usage":["smz3"]},
{"name":"Marvin the Cat","author":"Fish_waffle64","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cat.3.zspr","tags":["Personality","Animal","Male","Cat"],"usage":["smz3"]},
{"name":"Cat Boo","author":"JaySee87","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/catboo.1.zspr","tags":["Mario","Ghost","Cat"],"usage":["commercial","smz3"]},
{"name":"CD-i Link","author":"SnipSlum","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cdilink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Celes","author":"Deagans","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/celes.1.zspr","tags":["Final Fantasy","Female"],"usage":["commercial","smz3"]},
{"name":"Charizard","author":"Charmander106","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/charizard.1.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Cheep Cheep","author":"Faw","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cheepcheep.1.zspr","tags":["Mario","Fish"],"usage":["commercial","smz3"]},
{"name":"Chibity","author":"Ecyro","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chibity.1.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Chrizzz","author":"Chrizzz","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/chrizzz.1.zspr","tags":["Link","Personality"],"usage":["commercial","smz3"]},
{"name":"Cinna","author":"norskmatty","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cinna.1.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Cirno","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cirno.1.zspr","tags":["Touhou Project","Female"],"usage":["commercial","smz3"]},
{"name":"Clifford","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clifford.1.zspr","tags":["Animal","Dog"],"usage":["smz3"]},
{"name":"Clyde","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/clyde.1.zspr","tags":["Pac-man","Namco","Ghost"],"usage":["smz3"]},
{"name":"Conker","author":"Charmander106\/SePH","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/conker.1.zspr","tags":["Rare","Animal"],"usage":["smz3"]},
{"name":"Cornelius","author":"Lori","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cornelius.1.zspr","tags":["Odin Sphere","Male"],"usage":["commercial","smz3"]},
{"name":"Corona","author":"Herowho","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/corona.2.zspr","tags":["King's Quest","Male"],"usage":["commercial","smz3"]},
{"name":"Crewmate","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/crewmate.2.zspr","tags":["Among Us"],"usage":["smz3"]},
{"name":"Cucco","author":"Mike Trethewey","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cucco.2.zspr","tags":["Legend of Zelda","ALTTP NPC","Bird"],"usage":["commercial","smz3"]},
{"name":"Cursor","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/cursor.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"D.Owls","author":"D.Owls","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/d_owls.2.zspr","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Dark Panda","author":"MM102","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dark-panda.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Dark Boy","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkboy.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Girl","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkgirl.1.zspr","tags":["Link","Female","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Link (Tunic)","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darklink-tunic.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Dark Link","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darklink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Swatchy","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkswatchy.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Dark Zelda","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkzelda.1.zspr","tags":["Female","Legend of Zelda"],"usage":["commercial"]},
{"name":"Dark Zora","author":"iBazly","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/darkzora.2.zspr","tags":["Legend of Zelda","ALTTP NPC"],"usage":["commercial","smz3"]},
{"name":"Deadpool (Mythic)","author":"Mythic","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadpool-mythic.1.zspr","tags":["Superhero","Marvel","Male"],"usage":["smz3"]},
{"name":"Deadpool (SirCzah)","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadpool.1.zspr","tags":["Superhero","Marvel","Male"],"usage":["smz3"]},
{"name":"Deadrock","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/deadrock.1.zspr","tags":["Legend of Zelda","ALTTP NPC"],"usage":["commercial","smz3"]},
{"name":"Decidueye","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/decidueye.1.zspr","tags":["Pokemon","Bird"],"usage":["commercial","smz3"]},
{"name":"Dekar","author":"The3X","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dekar.1.zspr","tags":["Male","Lufia"],"usage":["smz3"]},
{"name":"Demon Link","author":"Krelbel","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/demonlink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Dipper","author":"Sharpefern","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dipper.1.zspr","tags":["Gravity Falls","Male"],"usage":["smz3"]},
{"name":"Dragonite","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/dragonite.2.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Drake The Dragon","author":"NO Body The Dragon","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/drake.2.zspr","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Eggplant","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/eggplant.1.zspr","tags":["Emoji"],"usage":["smz3"]},
{"name":"Ema Skye","author":"Linlinlin","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ema-skye.1.zspr","tags":["Phoenix Wright","Female"],"usage":["smz3"]},
{"name":"EmoSaru","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/emosaru.1.zspr","tags":["Personality","Streamer"],"usage":[]},
{"name":"Ezlo","author":"cbass601","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ezlo.1.zspr","tags":["Legend of Zelda","Male"],"usage":["commercial","smz3"]},
{"name":"Fierce Deity Link","author":"Jeffreygriggs2","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fierce-deity-link.3.zspr","tags":["Link","Legend of Zelda","Male"],"usage":["smz3"]},
{"name":"Finn Merten","author":"Devan2002","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/finn.3.zspr","tags":["Cartoon Network","Male"],"usage":["smz3"]},
{"name":"Finny Bear","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/finny_bear.1.zspr","tags":["Animal","Personality"],"usage":["smz3"]},
{"name":"Floodgate Fish","author":"Delphi1024","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fish_floodgate.1.zspr","tags":["Legend of Zelda","ALTTP NPC","Animal"],"usage":["commercial","smz3"]},
{"name":"Flavor Guy","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/flavor_guy.1.zspr","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Fox Link","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/foxlink.1.zspr","tags":["Link","Animal"],"usage":["commercial","smz3"]},
{"name":"Freya Crescent","author":"Demoncraze","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/freya.1.zspr","tags":["Final Fantasy","Female"],"usage":["smz3"]},
{"name":"Frisk","author":"TobyFox\/MisterKerr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/frisk.2.zspr","tags":["Undertale"],"usage":["commercial","smz3"]},
{"name":"Frog Link","author":"Mike Trethewey","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/froglink.3.zspr","tags":["Link","Animal"],"usage":["commercial","smz3"]},
{"name":"Fujin","author":"FujinAkari","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/fujin.2.zspr","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Future Trunks","author":"Merciter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/future_trunks.1.zspr","tags":["Dragonball","Male"],"usage":["smz3"]},
{"name":"Gamer","author":"InTheBeef","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gamer.2.zspr","tags":["Link","Male"],"usage":["commercial","smz3"]},
{"name":"Mini Ganon","author":"atth3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ganon.2.zspr","tags":["Villain","ALTTP NPC","Male","Legend of Zelda","Boss"],"usage":["commercial","smz3"]},
{"name":"Ganondorf","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ganondorf.2.zspr","tags":["Villain","ALTTP NPC","Male","Legend of Zelda","Boss"],"usage":["smz3"]},
{"name":"Garfield","author":"Fwiller","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garfield.2.zspr","tags":["Male","Animal"],"usage":["commercial","smz3"]},
{"name":"Garnet","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garnet.1.zspr","tags":["Female","Cartoon Network"],"usage":["smz3"]},
{"name":"Garo Master","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/garomaster.1.zspr","tags":["Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"GBC Link","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gbc-link.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Geno","author":"FedoraFriday","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/geno.2.zspr","tags":["Mario","Male"],"usage":["commercial","smz3"]},
{"name":"GliitchWiitch","author":"Ivy-IV","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gliitchwiitch.1.zspr","tags":["Female","Personality","Streamer"],"usage":["smz3"]},
{"name":"Gobli","author":"Lantis","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gobli.1.zspr","tags":["Male"],"usage":["smz3"]},
{"name":"Gooey","author":"Lougaroc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gooey.1.zspr","tags":["Kirby"],"usage":["commercial","smz3"]},
{"name":"Goomba","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/goomba.1.zspr","tags":["Mario"],"usage":["smz3"]},
{"name":"Goose","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/goose.1.zspr","tags":["Bird","Animal"],"usage":["commercial","smz3"]},
{"name":"GrandPOOBear","author":"proximitysound","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/grandpoobear.2.zspr","tags":["Personality","Streamer","Animal","Male"],"usage":["smz3"]},
{"name":"Gretis","author":"SnakeGrunger","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/gretis.1.zspr","tags":["Male","Personality","Streamer"],"usage":["commercial","smz3"]},
{"name":"Gruncle Stan","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/grunclestan.1.zspr","tags":["Disney","Male"],"usage":["smz3"]},
{"name":"Guiz","author":"GuizDP","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/guiz.2.zspr","tags":["Personality","Streamer","Male"],"usage":["commercial","smz3"]},
{"name":"Hanna","author":"Maya-Neko","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hanna.1.zspr","tags":["Female","Personality"],"usage":["commercial","smz3"]},
{"name":"Hardhat Beetle","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hardhat_beetle.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hat Kid","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hat-kid.1.zspr","tags":["Female","A Hat in Time"],"usage":["smz3"]},
{"name":"Headless Link","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/headlesslink.2.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hello Kitty","author":"qeeen","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hello_kitty.1.zspr","tags":["Female","Cat","Animal"],"usage":["commercial","smz3"]},
{"name":"Hero of Awakening","author":"Vonyee","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hero-of-awakening.1.zspr","tags":["Link","Male"],"usage":["commercial","smz3"]},
{"name":"Hero of Hyrule","author":"Vonyee","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hero-of-hyrule.1.zspr","tags":["Link","Male"],"usage":["commercial","smz3"]},
{"name":"Hidari","author":"Hidari","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hidari.1.zspr","tags":["Legend of Zelda","ALTTP NPC"],"usage":["commercial","smz3"]},
{"name":"Hint Tile","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hint_tile.1.zspr","tags":["ALTTP NPC"],"usage":["smz3"]},
{"name":"Hoarder (Bush)","author":"Restomak","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-bush.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hoarder (Pot)","author":"Restomak","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-pot.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hoarder (Rock)","author":"Restomak","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hoarder-rock.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Hollow Knight (Malmo\/Winter)","author":"Malmo and Atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hollow-knight-winter.1.zspr","tags":["Hollow Knight"],"usage":["commercial","smz3"]},
{"name":"Hollow Knight","author":"Chew_Terr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hollow-knight.2.zspr","tags":["Hollow Knight"],"usage":["commercial","smz3"]},
{"name":"Homer Simpson","author":"Fwiller","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/homer.1.zspr","tags":["Simpsons","Male"],"usage":["commercial","smz3"]},
{"name":"Hotdog","author":"Xag & Tylo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hotdog.1.zspr","tags":["Link","Food"],"usage":["smz3"]},
{"name":"Hyrule Knight","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/hyruleknight.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"iBazly","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ibazly.1.zspr","tags":["Personality","Streamer","Male"],"usage":["commercial"]},
{"name":"Ignignokt","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ignignokt.3.zspr","tags":["Male","Alien","Cartoon Network","Aqua Teen Hunger Force"],"usage":["smz3"]},
{"name":"Informant Woman","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/informant_woman.1.zspr","tags":["ALTTP NPC","Female","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Inkling","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/inkling.1.zspr","tags":["Splatoon"],"usage":["smz3"]},
{"name":"Invisible Link","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/invisibleman.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Jack Frost","author":"xypotion","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jack-frost.1.zspr","tags":["Shin Megami Tensei"],"usage":["commercial","smz3"]},
{"name":"Jason Frudnick","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jason_frudnick.1.zspr","tags":["Blast Master","Male"],"usage":["smz3"]},
{"name":"Jasp","author":"Chonixtu","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jasp.1.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Jogurt","author":"Nakuri","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/jogurt.1.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Kain","author":"Chew Terr","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kain.1.zspr","tags":["Final Fantasy","Male"],"usage":["commercial","smz3"]},
{"name":"Katsura","author":"atth3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/katsura.2.zspr","tags":["Gintama","Cartoon","Male"],"usage":["commercial","smz3"]},
{"name":"Kecleon","author":"Gylergin","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kecleon.1.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Kefka","author":"Chew Terr","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kefka.1.zspr","tags":["Final Fantasy","Male","Villain"],"usage":["commercial","smz3"]},
{"name":"Kenny McCormick","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kenny_mccormick.1.zspr","tags":["South Park","Male"],"usage":["smz3"]},
{"name":"Ketchup","author":"t0uchan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ketchup.1.zspr","tags":["Tasty","IRL"],"usage":["commercial","smz3"]},
{"name":"Kholdstare","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kholdstare.2.zspr","tags":["ALTTP NPC","Legend of Zelda","Boss"],"usage":["smz3"]},
{"name":"King Gothalion","author":"kickpixel","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/king_gothalion.1.zspr","tags":["Streamer","Personality","Male"],"usage":["smz3"]},
{"name":"King Graham","author":"MisterKerr","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/king_graham.2.zspr","tags":["King's Quest","Male"],"usage":["commercial","smz3"]},
{"name":"Kinu","author":"UberNooga","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kinu.1.zspr","tags":["Temtem"],"usage":["commercial","smz3"]},
{"name":"Kirby (Dreamland 3)","author":"Lougaroc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kirby-d3.1.zspr","tags":["Kirby"],"usage":["commercial","smz3"]},
{"name":"Kirby","author":"KHRoxas","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kirby-meta.1.zspr","tags":["Male","Kirby"],"usage":["commercial","smz3"]},
{"name":"Kore8","author":"Skewer","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kore8.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Korok","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/korok.1.zspr","tags":["The Legend of Zelda","Wind Waker","NPC"],"usage":["commercial","smz3"]},
{"name":"Kriv","author":"UltChimi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/kriv.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Lakitu","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lakitu.1.zspr","tags":["Mario"],"usage":[]},
{"name":"Lapras","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lapras.1.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Lest","author":"PrideToRuleEarth","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lest.1.zspr","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Lily","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lily.1.zspr","tags":["Blossom Tales","Female"],"usage":["commercial","smz3"]},
{"name":"Linja","author":"Razhagal","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linja.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Link Redrawn","author":"Spiffy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/link-redrawn.1.zspr","tags":["Link","ALTTP","Male"],"usage":["smz3"]},
{"name":"Hat Color Link","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linkhatcolor.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Tunic Color Link","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/linktuniccolor.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Little Hylian","author":"MM102","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/little-hylian.1.zspr","tags":["Male","Personality","Pokemon"],"usage":["smz3"]},
{"name":"Pony","author":"Botchos","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/littlepony.1.zspr","tags":["My Little Pony","Female","Animal"],"usage":["smz3"]},
{"name":"Locke","author":"Rose","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/locke.1.zspr","tags":["Male","Final Fantasy"],"usage":["smz3"]},
{"name":"Figaro Merchant","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/locke_merchant.1.zspr","tags":["Final Fantasy","Male"],"usage":["smz3"]},
{"name":"Lucario","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lucario.1.zspr","tags":["Pokemon"],"usage":["commercial","smz3"]},
{"name":"Luffy","author":"BOtheMighty","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luffy.2.zspr","tags":["Personality","Streamer","Male"],"usage":["smz3"]},
{"name":"Luigi","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luigi.1.zspr","tags":["Male","Mario","Superhero"],"usage":["commercial","smz3"]},
{"name":"Luna Maindo","author":"IkkyLights","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/luna-maindo.1.zspr","tags":["Female","Elsword"],"usage":["smz3"]},
{"name":"Lynel (BotW)","author":"Lougaroc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/lynel-botw.1.zspr","tags":["Legend of Zelda","Villain"],"usage":["commercial","smz3"]},
{"name":"Madeline","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/madeline.1.zspr","tags":["Female","Celeste"],"usage":["commercial","smz3"]},
{"name":"Magus","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/magus.1.zspr","tags":["Chrono Trigger","Villain","Male"],"usage":["smz3"]},
{"name":"Maiden","author":"Plan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/maiden.1.zspr","tags":["ALTTP NPC","Female","Legend of Zelda"],"usage":["smz3"]},
{"name":"Mallow (Cat)","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mallow-cat.1.zspr","tags":["Cat","Animal","Streamer"],"usage":["commercial","smz3"]},
{"name":"Manga Link","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mangalink.2.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Maple Queen","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/maplequeen.2.zspr","tags":["Female"],"usage":["commercial","smz3"]},
{"name":"Marin","author":"Nocturnesthesia","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/marin.2.zspr","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"Mario (Classic)","author":"Damon","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mario-classic.2.zspr","tags":["Mario","Male"],"usage":["commercial","smz3"]},
{"name":"Tanooki Mario","author":"Nocturnesthesia","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mario_tanooki.2.zspr","tags":["Mario","Male"],"usage":["smz3"]},
{"name":"Mario and Cappy","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mariocappy.1.zspr","tags":["Mario","Male"],"usage":["commercial","smz3"]},
{"name":"Marisa Kirisame","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/marisa.1.zspr","tags":["Touhou Project","Female"],"usage":["commercial","smz3"]},
{"name":"Matthias","author":"Marcus Bolduc","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/matthias.1.zspr","tags":["Redwall","Male","Cartoon","Book"],"usage":["smz3"]},
{"name":"Meatwad","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/meatwad.2.zspr","tags":["Male","Aqua Teen Hunger Force","Cartoon Network"],"usage":["smz3"]},
{"name":"Medallions","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/medallions.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Medli","author":"Kzinssie","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/medli.1.zspr","tags":["Legend of Zelda","Female","Bird"],"usage":["commercial","smz3"]},
{"name":"Megaman X","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/megaman-x.2.zspr","tags":["Male","Megaman"],"usage":["smz3"]},
{"name":"Baby Metroid","author":"Jam","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/metroid.1.zspr","tags":["Metroid","Alien"],"usage":["commercial","smz3"]},
{"name":"MewLp","author":"MewLp","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mew.1.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Mike Jones","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mike-jones.2.zspr","tags":["StarTropics","Male"],"usage":["smz3"]},
{"name":"Minish Link","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/minish_link.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Minish Cap Link","author":"InTheBeef","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/minishcaplink.3.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"missingno","author":"AAhbxsujd","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/missingno.2.zspr","tags":["Pokemon"],"usage":["commercial","smz3"]},
{"name":"Moblin","author":"Noctai_","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/moblin.2.zspr","tags":["Legend of Zelda","ALTTP"],"usage":["commercial","smz3"]},
{"name":"Modern Link","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/modernlink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Mog","author":"Krelbel","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mog.2.zspr","tags":["Final Fantasy"],"usage":["commercial","smz3"]},
{"name":"Momiji Inubashiri","author":"Ardaceus","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/momiji.1.zspr","tags":["Touhou Project","Female"],"usage":["commercial","smz3"]},
{"name":"Moosh","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/moosh.1.zspr","tags":["Link","Male","Legend of Zelda","Animal"],"usage":["smz3"]},
{"name":"Mouse","author":"Malthaez","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mouse.1.zspr","tags":["Link","Animal"],"usage":["smz3"]},
{"name":"Ms. Paint Dog","author":"TehRealSalt","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ms-paintdog.1.zspr","tags":["Animal"],"usage":["smz3"]},
{"name":"Power Up with Pride Mushroom","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/mushy.1.zspr","tags":["Pride"],"usage":["smz3"]},
{"name":"Nature Link","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/naturelink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Navi","author":"qwertymodo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/navi.1.zspr","tags":["Female","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Navirou","author":"Lori","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/navirou.3.zspr","tags":["Monster Hunter"],"usage":["commercial","smz3"]},
{"name":"Ned Flanders","author":"JJ0033LL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ned-flanders.1.zspr","tags":["Male","Cartoon","Simpsons"],"usage":["commercial","smz3"]},
{"name":"Negative Link","author":"iBazly","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/negativelink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial"]},
{"name":"Neosad","author":"Dr. Deadrewski","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/neosad.2.zspr","tags":["Personality","Streamer"],"usage":["commercial","smz3"]},
{"name":"NES Link","author":"Mike Trethewey\/kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/neslink.2.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Ness","author":"Lantis","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ness.2.zspr","tags":["Male","Earthbound"],"usage":["smz3"]},
{"name":"Nia","author":"Mojonbo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/nia.1.zspr","tags":["Xenoblade","Female"],"usage":["smz3"]},
{"name":"Niddraig","author":"Jakebob","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/niddraig.1.zspr","tags":["Final Fantasy","Personality"],"usage":["commercial","smz3"]},
{"name":"Niko","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/niko.1.zspr","tags":["OneShot","Cat"],"usage":["commercial","smz3"]},
{"name":"Old Man","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/oldman.2.zspr","tags":["ALTTP NPC","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Ori","author":"Phant","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ori.2.zspr","tags":["Ori","Male"],"usage":["commercial","smz3"]},
{"name":"Outline Link","author":"VT","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/outlinelink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Parallel Worlds Link","author":"SePH\/InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/parallelworldslink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Paula","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/paula.1.zspr","tags":["Earthbound","Female"],"usage":["smz3"]},
{"name":"Princess Peach","author":"RoPan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/peach.1.zspr","tags":["Mario","Princess","Female"],"usage":["smz3"]},
{"name":"Penguin Link","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/penguinlink.2.zspr","tags":["Link","Animal"],"usage":["smz3"]},
{"name":"Pete","author":"Lantis","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pete.2.zspr","tags":["Male","Harvest Moon"],"usage":["smz3"]},
{"name":"Phoenix Wright","author":"SnipSlum","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/phoenix-wright.1.zspr","tags":["Male","Ace Attorney"],"usage":["commercial","smz3"]},
{"name":"Pikachu","author":"t0uchan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pikachu.2.zspr","tags":["Pokemon"],"usage":["commercial","smz3"]},
{"name":"Pink Ribbon Link","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pinkribbonlink.3.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Piranha Plant","author":"lecremateur","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/piranha_plant.1.zspr","tags":["Mario","Villain"],"usage":["commercial","smz3"]},
{"name":"Plague Knight","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/plagueknight.1.zspr","tags":["Shovel Knight","Male"],"usage":["smz3"]},
{"name":"Pokey","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pokey.2.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Popoi","author":"ItsSupercar","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/popoi.1.zspr","tags":["Secret of Mana","Male"],"usage":["commercial","smz3"]},
{"name":"Poppy","author":"cbass601","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/poppy.1.zspr","tags":["Trolls","Female"],"usage":["commercial","smz3"]},
{"name":"Porg Knight","author":"PorgCollector","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/porg_knight.1.zspr","tags":["Star Wars"],"usage":["commercial","smz3"]},
{"name":"Power Ranger","author":"Zeta Xero","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/power-ranger.1.zspr","tags":["Power Ranger"],"usage":["commercial","smz3"]},
{"name":"Powerpuff Girl","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/powerpuff_girl.1.zspr","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"],"usage":["smz3"]},
{"name":"Pride Link","author":"proximitysound","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pridelink.2.zspr","tags":["Link","Male","Legend of Zelda","Pride"],"usage":["smz3"]},
{"name":"Primm","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/primm.1.zspr","tags":["Secret of Mana","Female"],"usage":["smz3"]},
{"name":"Princess Bubblegum","author":"Devan2002","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/princess_bubblegum.1.zspr","tags":["Female","Cartoon Network"],"usage":["smz3"]},
{"name":"The Professor","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/professor.1.zspr","tags":["Personality","Rush","Male"],"usage":["smz3"]},
{"name":"Psyduck","author":"skovacs1","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/psyduck.2.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"The Pug","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pug.1.zspr","tags":["Personality","Animal","Streamer","Male"],"usage":["commercial","smz3"]},
{"name":"Purple Chest","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/purplechest-bottle.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Pyro","author":"malmo","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/pyro.1.zspr","tags":["Team Fortress","Male"],"usage":["commercial","smz3"]},
{"name":"QuadBanger","author":"Kai Gomez","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/quadbanger.1.zspr","tags":["Personality","Male"],"usage":["smz3"]},
{"name":"Rainbow Link","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rainbowlink.2.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Rat","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rat.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Red Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/red-mage.1.zspr","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Remeer","author":"Herowho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/remeer.1.zspr","tags":["Brain Lord","Male"],"usage":["commercial","smz3"]},
{"name":"Remus R Black","author":"The3rdX","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/remus-ruldufus-black.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Rick","author":"Eric the Terrible\/Devan 2002","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rick.2.zspr","tags":["Male","Cartoon Network"],"usage":["smz3"]},
{"name":"Robo-Link 9000","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/robotlink.2.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Rocko","author":"t0uchan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rocko.2.zspr","tags":["Male","Nickelodeon"],"usage":["commercial","smz3"]},
{"name":"Rottytops","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rottytops.1.zspr","tags":["Cartoon"],"usage":["smz3"]},
{"name":"Rover","author":"NO Body the Dragon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rover.1.zspr","tags":["Male","Animal Crossing","Cat"],"usage":["commercial","smz3"]},
{"name":"Roy Koopa","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/roykoopa.1.zspr","tags":["Male","Mario"],"usage":["commercial","smz3"]},
{"name":"Rumia","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rumia.1.zspr","tags":["Touhou Project","Female"],"usage":["commercial","smz3"]},
{"name":"Rydia","author":"Sho","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/rydia.1.zspr","tags":["Final Fantasy","Female"],"usage":["commercial","smz3"]},
{"name":"Ryu","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ryu.1.zspr","tags":["Male","Street Fighter"],"usage":["smz3"]},
{"name":"Sailor Moon","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sailormoon.1.zspr","tags":["Sailor Moon","Female","Cartoon"],"usage":["smz3"]},
{"name":"Saitama","author":"Dabeanjelly\/Ath3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/saitama.2.zspr","tags":["Male","Superhero"],"usage":["commercial","smz3"]},
{"name":"Samus (Super Metroid)","author":"Ben G","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus-sm.1.zspr","tags":["Metroid","Female"],"usage":["commercial","smz3"]},
{"name":"Samus","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus.2.zspr","tags":["Metroid","Female"],"usage":["smz3"]},
{"name":"Samus (Classic)","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/samus_classic.1.zspr","tags":["Metroid","Female"],"usage":["smz3"]},
{"name":"Santa Hat Link","author":"Lexitik","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/santahat-link.1.zspr","tags":["Link","Male"],"usage":["commercial","smz3"]},
{"name":"Santa Link","author":"HOHOHO","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/santalink.2.zspr","tags":["Link","Male","Legend of Zelda","Festive"],"usage":["commercial","smz3"]},
{"name":"Scholar","author":"Damon","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/scholar.1.zspr","tags":["Link","Male"],"usage":["commercial","smz3"]},
{"name":"Selan","author":"atth3h3art0fwinter","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/selan.2.zspr","tags":["Lufia","Female"],"usage":["commercial","smz3"]},
{"name":"SevenS1ns","author":"Hroun","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sevens1ns.1.zspr","tags":["Personality","Streamer","Male"],"usage":["smz3"]},
{"name":"Shadow","author":"CGG Zayik","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shadow.1.zspr","tags":["Final Fantasy","Male"],"usage":["smz3"]},
{"name":"Shadow Sakura","author":"iBazly","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shadowsaku.2.zspr","tags":["Personality","Streamer","Female"],"usage":["commercial"]},
{"name":"Shantae","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shantae.1.zspr","tags":["Shantae","Female"],"usage":["smz3"]},
{"name":"Shuppet","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shuppet.2.zspr","tags":["Pokemon","Ghost"],"usage":["smz3"]},
{"name":"Shy Gal","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shy-gal.1.zspr","tags":["Mario","Female"],"usage":["commercial","smz3"]},
{"name":"Shy Guy","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/shy-guy.1.zspr","tags":["Mario"],"usage":["smz3"]},
{"name":"SighnWaive","author":"GenoCL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sighn_waive.1.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Skunk","author":"Hiveul","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/skunk.1.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Slime","author":"KamenRideDecade","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/slime.1.zspr","tags":["Dragon Quest"],"usage":["commercial","smz3"]},
{"name":"Slowpoke","author":"Joey_Rat","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/slowpoke.2.zspr","tags":["Pokemon"],"usage":["commercial","smz3"]},
{"name":"SNES Controller","author":"cbass601","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/snes-controller.2.zspr","tags":["SNES"],"usage":["commercial","smz3"]},
{"name":"Soda Can","author":"Zarby89","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sodacan.1.zspr","tags":["Sprite","Tasty","IRL"],"usage":["commercial","smz3"]},
{"name":"Solaire of Astora","author":"Knilip","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/solaire.1.zspr","tags":["Dark Souls","Male"],"usage":["smz3"]},
{"name":"Hyrule Soldier","author":"InTheBeef","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/soldiersprite.1.zspr","tags":["Legend of Zelda","ALTTP NPC"],"usage":["commercial","smz3"]},
{"name":"Sonic the Hedgehog","author":"Osaka","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sonic.1.zspr","tags":["Male","Sonic the Hedgehog"],"usage":["commercial","smz3"]},
{"name":"Sora","author":"roxas232","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sora.1.zspr","tags":["Male","Kingdom Hearts"],"usage":["commercial","smz3"]},
{"name":"Sora (KH1)","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/sora_kh1.1.zspr","tags":["Male","Kingdom Hearts"],"usage":["commercial","smz3"]},
{"name":"Spongebob Squarepants","author":"JJ0033LL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/spongebob.1.zspr","tags":["Male","Spongebob Squarepants"],"usage":["commercial","smz3"]},
{"name":"Squall","author":"Maessan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squall.1.zspr","tags":["Male","Final Fantasy"],"usage":["smz3"]},
{"name":"Squirrel","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squirrel.1.zspr","tags":["Animal","Personality","Streamer"],"usage":["smz3"]},
{"name":"Squirtle","author":"Numberplay","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/squirtle.1.zspr","tags":["Pokemon"],"usage":["commercial","smz3"]},
{"name":"Stalfos","author":"Artheau","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stalfos.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Stan","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stan.2.zspr","tags":["Male","Okage: Shadow King"],"usage":["smz3"]},
{"name":"Static Link","author":"kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/staticlink.2.zspr","tags":["Link","Male","Legend of Zelda","Randomizer"],"usage":["smz3"]},
{"name":"Steamed Hams","author":"AFewGoodTaters","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/steamedhams.1.zspr","tags":["Link","Cartoon"],"usage":["smz3"]},
{"name":"Stick Man","author":"skovacs1","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/stick_man.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Super Bomb","author":"Ninjakauz","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/superbomb.1.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Super Bunny","author":"TheOkayGuy","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/superbunny.2.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Super Meat Boy","author":"Achy","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/supermeatboy.1.zspr","tags":["Male","Meat Boy"],"usage":["commercial","smz3"]},
{"name":"Susie","author":"Zandra","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/susie.1.zspr","tags":["Female","Undertale","Deltarune"],"usage":["smz3"]},
{"name":"Swatchy","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/swatchy.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"TASBot","author":"GenoCL","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tasbot.1.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Tea Time","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/teatime.1.zspr","tags":["Personality","Streamer"],"usage":["smz3"]},
{"name":"Terra (Esper)","author":"All-in-one Mighty","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/terra.1.zspr","tags":["Final Fantasy","Female"],"usage":["smz3"]},
{"name":"Terry (Contact DS)","author":"CD-Mestay","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/terry.1.zspr","tags":["Male","Contact DS"],"usage":["smz3"]},
{"name":"Tetra","author":"Ferelheart","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tetra.1.zspr","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"TGH","author":"Drew Wise, pizza_for_free","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tgh.1.zspr","tags":["Personality","Streamer","Male"],"usage":["commercial","smz3"]},
{"name":"Thief","author":"Devan2002","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thief.1.zspr","tags":["ALTTP NPC","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"ThinkDorm","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thinkdorm.1.zspr","tags":["ALTTP NPC","Villain"],"usage":["smz3"]},
{"name":"Thomcrow","author":"Thom","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/thomcrow.1.zspr","tags":["Personality","Streamer","Male","Bird"],"usage":["commercial","smz3"]},
{"name":"Tile","author":"kan","version":3,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tile.3.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["smz3"]},
{"name":"Tingle","author":"Xenobond","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tingle.1.zspr","tags":["Legend of Zelda","Male"],"usage":["commercial","smz3"]},
{"name":"TMNT","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/tmnt.1.zspr","tags":["Animal","Male","Cartoon"],"usage":["smz3"]},
{"name":"Toad","author":"Zarby89","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toad.2.zspr","tags":["Male","Mario"],"usage":["commercial","smz3"]},
{"name":"Toadette","author":"Devan2002","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toadette.2.zspr","tags":["Female","Mario"],"usage":["smz3"]},
{"name":"Captain Toadette","author":"Devan2002","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/toadette_captain.1.zspr","tags":["Female","Mario"],"usage":["smz3"]},
{"name":"TotemLinks","author":"Yotohan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/totem-links.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Trogdor the Burninator","author":"Mike Trethewey\/kan","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/trogdor.2.zspr","tags":["Male"],"usage":["commercial","smz3"]},
{"name":"TP Zelda","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/twilightprincesszelda.2.zspr","tags":["Legend of Zelda","Female"],"usage":["smz3"]},
{"name":"TwoFaced","author":"Devan2002","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/two_faced.2.zspr","tags":["Personality"],"usage":["smz3"]},
{"name":"Ty the Tasmanian Tiger","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ty.1.zspr","tags":["Animal","Ty the Tasmanian Tiger"],"usage":["smz3"]},
{"name":"Ultros","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/ultros.1.zspr","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Valeera","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/valeera.1.zspr","tags":["Warcraft","Female"],"usage":["commercial","smz3"]},
{"name":"VanillaLink","author":"Jenichi","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vanillalink.1.zspr","tags":["Link","Male","Legend of Zelda"],"usage":["smz3"]},
{"name":"Vaporeon","author":"Aquana","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vaporeon.1.zspr","tags":["Pokemon"],"usage":["smz3"]},
{"name":"Vegeta","author":"Merciter","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vegeta.1.zspr","tags":["Male","Dragonball"],"usage":["smz3"]},
{"name":"Vera","author":"aitchFactor","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vera.1.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Vitreous","author":"Glan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vitreous.1.zspr","tags":["ALTTP NPC","Legend of Zelda","Boss"],"usage":["commercial","smz3"]},
{"name":"Vivi","author":"RyuTech","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vivi.1.zspr","tags":["Final Fantasy","Male"],"usage":["smz3"]},
{"name":"Vivian","author":"SirCzah","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/vivian.1.zspr","tags":["Mario","Female"],"usage":["smz3"]},
{"name":"Wario","author":"Deagans","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wario.1.zspr","tags":["Male","Mario","Villain"],"usage":["commercial","smz3"]},
{"name":"White Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/whitemage.1.zspr","tags":["Final Fantasy"],"usage":["smz3"]},
{"name":"Will","author":"Xenobond","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/will.1.zspr","tags":["Illusion of Gaia","Male"],"usage":["commercial","smz3"]},
{"name":"Wizzrobe","author":"iBazly","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wizzrobe.2.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial"]},
{"name":"Wolf Link (Festive)","author":"Fish\/Beef-Chan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wolf_link.1.zspr","tags":["Link","Male","Legend of Zelda","Animal","Festive"],"usage":["smz3"]},
{"name":"Wolf Link (TP)","author":"Gfish59","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/wolf_link_tp.1.zspr","tags":["Link","Male","Legend of Zelda","Animal"],"usage":["commercial","smz3"]},
{"name":"Yoshi","author":"Yotohan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/yoshi.1.zspr","tags":["Mario"],"usage":["smz3"]},
{"name":"Yunica Tovah","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/yunica.2.zspr","tags":["Female","Ys"],"usage":["smz3"]},
{"name":"Zandra","author":"ZandraVandra","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zandra.2.zspr","tags":["Personality","Streamer","Female"],"usage":["commercial","smz3"]},
{"name":"Zebra Unicorn","author":"Brass Man","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zebraunicorn.1.zspr","tags":["Animal","Personlity","Streamer"],"usage":["smz3"]},
{"name":"Zeckemyro","author":"aitchFactor","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zeck.2.zspr","tags":["Personality"],"usage":["commercial","smz3"]},
{"name":"Zelda","author":"Myriachan","version":1,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zelda.1.zspr","tags":["ALTTP NPC","Female","Legend of Zelda"],"usage":["commercial","smz3"]},
{"name":"Zero Suit Samus","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zerosuitsamus.2.zspr","tags":["Metroid","Female"],"usage":["smz3"]},
{"name":"Zora","author":"Zarby, InTheBeef","version":2,"file":"https:\/\/alttpr-assets.s3.us-east-2.amazonaws.com\/zora.2.zspr","tags":["ALTTP NPC","Legend of Zelda"],"usage":["commercial","smz3"]}];