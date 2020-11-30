function Sprite(){
  this.sprite=[];
  this.palette=[];
  this.glovePalette=[];
};

function fetchSpriteData(rom, spriteUrl, onLoad){
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

const spriteDatabase = [{"name":"Link","author":"Nintendo","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/001.link.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Four Swords Link","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/4slink-armors.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Abigail","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/abigail.1.zspr","tags":["Female"]},
{"name":"Adol","author":"Yuushia","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/adol.1.zspr","tags":["Ys","Male"]},
{"name":"Aggretsuko","author":"skovacs1","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/aggretsuko.1.zspr","tags":["Cartoon","Animal","Female"]},
{"name":"Alice","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/alice.1.zspr","tags":["Female"]},
{"name":"Angry Video Game Nerd","author":"ABOhiccups","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/angry-video-game-nerd.1.zspr","tags":["Personality","Male"]},
{"name":"Arcane","author":"MM102","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/arcane.1.zspr","tags":["Personality"]},
{"name":"Ark (No Cape)","author":"Dorana","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ark-dorana.1.zspr","tags":["Terranigma","Male"]},
{"name":"Ark (Cape)","author":"wzl","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ark.1.zspr","tags":["Terranigma","Male"]},
{"name":"Arrghus","author":"fatmanspanda","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/arrghus.2.zspr","tags":["Male","Legend of Zelda","ALTTP NPC","Boss"]},
{"name":"Astronaut","author":"Malmo","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/astronaut.1.zspr","tags":["IRL"]},
{"name":"Asuna","author":"Natsuru Kiyohoshi","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/asuna.1.zspr","tags":["Female","Sword Art Online"]},
{"name":"Badeline","author":"Jam","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/badeline.1.zspr","tags":["Celeste","Female"]},
{"name":"Bananas In Pyjamas","author":"codemann8","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bananas-in-pyjamas.1.zspr","tags":["Cartoon"]},
{"name":"Bandit","author":"Fenrika","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bandit.1.zspr","tags":["Mario"]},
{"name":"Batman","author":"Ninjakauz","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/batman.1.zspr","tags":["Superhero","Male","DC Comics"]},
{"name":"Beau","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/beau.1.zspr","tags":["Animal Crossing","Male","Animal"]},
{"name":"Bewp","author":"Valechec","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bewp.1.zspr","tags":["Animal","Streamer","Personality"]},
{"name":"Big Key","author":"Kan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bigkey.1.zspr","tags":["Legend of Zelda"]},
{"name":"Birb","author":"Dr. Deadrewski","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/birb.1.zspr","tags":["Bird","Animal","Streamer"]},
{"name":"Birdo","author":"BlackTycoon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/birdo.1.zspr","tags":["Female","Mario"]},
{"name":"Black Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/blackmage.1.zspr","tags":["Final Fantasy"]},
{"name":"Blacksmith Link","author":"Glan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/blacksmithlink.1.zspr","tags":["Link","Male","Legend of Zelda","ALTTP NPC"]},
{"name":"Blazer","author":"Herowho","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/blazer.1.zspr","tags":["Male"]},
{"name":"Blossom","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/blossom.1.zspr","tags":["Female","Powerpuff Girls","Superhero","Cartoon Network"]},
{"name":"Bob","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bob.1.zspr","tags":["Randomizer","ALTTP NPC","Legend of Zelda"]},
{"name":"Bob Ross","author":"CaptainApathy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bobross.1.zspr","tags":["Male","Personality"]},
{"name":"Boco the Chocobo","author":"Tar Thoron","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/boco.1.zspr","tags":["Final Fantasy","Animal"]},
{"name":"Boo 2","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/boo-two.1.zspr","tags":["Mario","Ghost"]},
{"name":"Boo","author":"Zarby89","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/boo.2.zspr","tags":["Mario","Ghost"]},
{"name":"Bottle o' Goo","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bottle_o_goo.1.zspr","tags":["Legend of Zelda"]},
{"name":"BotW Link","author":"Pasta La Vista","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/botw-link.1.zspr","tags":["Legend of Zelda","Male"]},
{"name":"BotW Zelda","author":"Roo","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/botw-zelda.1.zspr","tags":["Legend of Zelda","Female"]},
{"name":"Bowser","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bowser.1.zspr","tags":["Male","Mario","Villain"]},
{"name":"Bowsette (Red)","author":"Sarah Shinespark","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bowsette-red.1.zspr","tags":["Mario","Female","Villain"]},
{"name":"Bowsette","author":"Sarah Shinespark","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bowsette.1.zspr","tags":["Mario","Female","Villain"]},
{"name":"Branch","author":"cbass601","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/branch.1.zspr","tags":["Trolls","Male"]},
{"name":"Brian","author":"Herowho","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/brian.1.zspr","tags":["Quest","Male"]},
{"name":"Broccoli","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/broccoli.1.zspr","tags":["Legend of Zelda","ALTTP NPC"]},
{"name":"Bronzor","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bronzor.1.zspr","tags":["Pokemon"]},
{"name":"B.S. Boy","author":"InTheBeef","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bsboy.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"B.S. Girl","author":"InTheBeef","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bsgirl.1.zspr","tags":["Link","Female","Legend of Zelda"]},
{"name":"Bubbles","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bubbles.1.zspr","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"]},
{"name":"Bullet Bill","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/bullet_bill.1.zspr","tags":["Mario"]},
{"name":"Buttercup","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/buttercup.1.zspr","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"]},
{"name":"Cactuar","author":"RyuTech","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cactuar.1.zspr","tags":["Final Fantasy"]},
{"name":"Cadence","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cadence.1.zspr","tags":["Crypt of the Necrodancer","Cadence of Hyrule","Female"]},
{"name":"CarlSagan42","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/carlsagan42.1.zspr","tags":["Personality","Mario","Streamer"]},
{"name":"Casual Zelda","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/casual-zelda.1.zspr","tags":["Female","Legend of Zelda"]},
{"name":"Marvin the Cat","author":"Fish_waffle64","version":3,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cat.3.zspr","tags":["Personality","Animal","Male","Cat"]},
{"name":"Cat Boo","author":"JaySee87","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/catboo.1.zspr","tags":["Mario","Ghost","Cat"]},
{"name":"CD-i Link","author":"SnipSlum","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cdilink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Celes","author":"Deagans","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/celes.1.zspr","tags":["Final Fantasy","Female"]},
{"name":"Charizard","author":"Charmander106","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/charizard.1.zspr","tags":["Pokemon"]},
{"name":"Cheep Cheep","author":"Faw","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cheepcheep.1.zspr","tags":["Mario","Fish"]},
{"name":"Chibity","author":"Ecyro","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/chibity.1.zspr","tags":["Personality"]},
{"name":"Chrizzz","author":"Chrizzz","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/chrizzz.1.zspr","tags":["Link","Personality"]},
{"name":"Cirno","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cirno.1.zspr","tags":["Touhou Project","Female"]},
{"name":"Clifford","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/clifford.1.zspr","tags":["Animal","Dog"]},
{"name":"Clyde","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/clyde.1.zspr","tags":["Pac-man","Namco","Ghost"]},
{"name":"Conker","author":"Charmander106\/SePH","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/conker.1.zspr","tags":["Rare","Animal"]},
{"name":"Cornelius","author":"Lori","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cornelius.1.zspr","tags":["Odin Sphere","Male"]},
{"name":"Corona","author":"Herowho","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/corona.1.zspr","tags":["King's Quest","Male"]},
{"name":"Crewmate","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/crewmate.1.zspr","tags":["Among Us"]},
{"name":"Cucco","author":"MikeTrethewey","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cucco.1.zspr","tags":["Legend of Zelda","ALTTP NPC","Bird"]},
{"name":"Cursor","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/cursor.1.zspr","tags":["Personality"]},
{"name":"D.Owls","author":"D.Owls","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/d_owls.2.zspr","tags":["Personality","Male"]},
{"name":"Dark Panda","author":"MM102","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/dark-panda.1.zspr","tags":["Personality"]},
{"name":"Dark Boy","author":"iBazly","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/darkboy.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Dark Girl","author":"iBazly","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/darkgirl.1.zspr","tags":["Link","Female","Legend of Zelda"]},
{"name":"Dark Link (Tunic)","author":"Damon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/darklink-tunic.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Dark Link","author":"iBazly","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/darklink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Dark Swatchy","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/darkswatchy.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Dark Zelda","author":"iBazly","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/darkzelda.1.zspr","tags":["Female","Legend of Zelda"]},
{"name":"Dark Zora","author":"iBazly","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/darkzora.2.zspr","tags":["Legend of Zelda","ALTTP NPC"]},
{"name":"Deadpool (Mythic)","author":"Mythic","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/deadpool-mythic.1.zspr","tags":["Superhero","Marvel","Male"]},
{"name":"Deadpool (SirCzah)","author":"SirCzah","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/deadpool.1.zspr","tags":["Superhero","Marvel","Male"]},
{"name":"Deadrock","author":"Glan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/deadrock.1.zspr","tags":["Legend of Zelda","ALTTP NPC"]},
{"name":"Decidueye","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/decidueye.1.zspr","tags":["Pokemon","Bird"]},
{"name":"Dekar","author":"The3X","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/dekar.1.zspr","tags":["Male","Lufia"]},
{"name":"Demon Link","author":"Krelbel","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/demonlink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Dragonite","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/dragonite.2.zspr","tags":["Pokemon"]},
{"name":"Drake The Dragon","author":"No Body The Dragon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/drake.1.zspr","tags":["Personality","Male"]},
{"name":"Eggplant","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/eggplant.1.zspr","tags":["Emoji"]},
{"name":"EmoSaru","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/emosaru.1.zspr","tags":["Personality","Streamer"]},
{"name":"Ezlo","author":"cbass601","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ezlo.1.zspr","tags":["Legend of Zelda","Male"]},
{"name":"Fierce Deity Link","author":"Jeffreygriggs2","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/fierce-deity-link.2.zspr","tags":["Link","Legend of Zelda","Male"]},
{"name":"Finn Merten","author":"Devan2002","version":3,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/finn.3.zspr","tags":["Cartoon Network","Male"]},
{"name":"Finny Bear","author":"skovacs1","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/finny_bear.1.zspr","tags":["Animal","Personality"]},
{"name":"Floodgate Fish","author":"Delphi1024","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/fish_floodgate.1.zspr","tags":["Legend of Zelda","ALTTP NPC","Animal"]},
{"name":"Flavor Guy","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/flavor_guy.1.zspr","tags":["Personality","Male"]},
{"name":"Fox Link","author":"InTheBeef","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/foxlink.1.zspr","tags":["Link","Animal"]},
{"name":"Freya Crescent","author":"Demoncraze","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/freya.1.zspr","tags":["Final Fantasy","Female"]},
{"name":"Frisk","author":"TobyFox\/MisterKerr","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/frisk.1.zspr","tags":["Undertale"]},
{"name":"Frog Link","author":"Mike Trethewey","version":3,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/froglink.3.zspr","tags":["Link","Animal"]},
{"name":"Fujin","author":"FujinAkari","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/fujin.2.zspr","tags":["Final Fantasy"]},
{"name":"Future Trunks","author":"Merciter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/future_trunks.1.zspr","tags":["Dragonball","Male"]},
{"name":"Gamer","author":"Unknown","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/gamer.1.zspr","tags":["Link","Male"]},
{"name":"Mini Ganon","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ganon.1.zspr","tags":["Villain","ALTTP NPC","Male","Legend of Zelda","Boss"]},
{"name":"Ganondorf","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ganondorf.1.zspr","tags":["Villain","ALTTP NPC","Male","Legend of Zelda","Boss"]},
{"name":"Garfield","author":"Fwiller","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/garfield.2.zspr","tags":["Male","Animal"]},
{"name":"Garnet","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/garnet.1.zspr","tags":["Female","Cartoon Network"]},
{"name":"Garo Master","author":"Herowho","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/garomaster.1.zspr","tags":["Legend of Zelda"]},
{"name":"GBC Link","author":"skovacs1","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/gbc-link.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Geno","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/geno.1.zspr","tags":["Mario","Male"]},
{"name":"GliitchWiitch","author":"Ivy-IV","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/gliitchwiitch.1.zspr","tags":["Female","Personality","Streamer"]},
{"name":"Gobli","author":"Lantis","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/gobli.1.zspr","tags":["Male"]},
{"name":"Goomba","author":"SirCzah","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/goomba.1.zspr","tags":["Mario"]},
{"name":"Goose","author":"Jam","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/goose.1.zspr","tags":["Bird","Animal"]},
{"name":"GrandPOOBear","author":"proximitysound","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/grandpoobear.2.zspr","tags":["Personality","Streamer","Animal","Male"]},
{"name":"Gretis","author":"SnakeGrunger","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/gretis.1.zspr","tags":["Male","Personality","Streamer"]},
{"name":"Gruncle Stan","author":"SirCzah","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/grunclestan.1.zspr","tags":["Disney","Male"]},
{"name":"Guiz","author":"GuizDP","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/guiz.1.zspr","tags":["Personality","Streamer","Male"]},
{"name":"Hanna","author":"Maya-Neko","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hanna.1.zspr","tags":["Female","Personality"]},
{"name":"Hardhat Beetle","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hardhat_beetle.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Hat Kid","author":"skovacs1","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hat-kid.1.zspr","tags":["Female","A Hat in Time"]},
{"name":"Headless Link","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/headlesslink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Hello Kitty","author":"qeeen","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hello_kitty.1.zspr","tags":["Female","Cat","Animal"]},
{"name":"Hidari","author":"Hidari","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hidari.1.zspr","tags":["Legend of Zelda","ALTTP NPC"]},
{"name":"Hint Tile","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hint_tile.1.zspr","tags":["ALTTP NPC"]},
{"name":"Hoarder (Bush)","author":"Restomak","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hoarder-bush.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Hoarder (Pot)","author":"Restomak","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hoarder-pot.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Hoarder (Rock)","author":"Restomak","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hoarder-rock.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Hollow Knight","author":"Chew_Terr","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hollow-knight.1.zspr","tags":["Hollow Knight"]},
{"name":"Homer Simpson","author":"Fwiller","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/homer.1.zspr","tags":["Simpsons","Male"]},
{"name":"Hotdog","author":"Xag & Tylo","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hotdog.1.zspr","tags":["Link","Food"]},
{"name":"Hyrule Knight","author":"InTheBeef","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/hyruleknight.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"iBazly","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ibazly.1.zspr","tags":["Personality","Streamer","Male"]},
{"name":"Ignignokt","author":"fatmanspanda","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ignignokt.2.zspr","tags":["Male","Alien","Cartoon Network","Aqua Teen Hunger Force"]},
{"name":"Informant Woman","author":"Herowho","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/informant_woman.1.zspr","tags":["ALTTP NPC","Female","Legend of Zelda"]},
{"name":"Inkling","author":"RyuTech","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/inkling.1.zspr","tags":["Splatoon"]},
{"name":"Invisible Link","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/invisibleman.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Jack Frost","author":"xypotion","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/jack-frost.1.zspr","tags":["Shin Megami Tensei"]},
{"name":"Jason Frudnick","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/jason_frudnick.1.zspr","tags":["Blast Master","Male"]},
{"name":"Jasp","author":"Chonixtu","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/jasp.1.zspr","tags":["Personality"]},
{"name":"Jogurt","author":"Nakuri","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/jogurt.1.zspr","tags":["Personality"]},
{"name":"Katsura","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/katsura.1.zspr","tags":["Gintama","Cartoon","Male"]},
{"name":"Kecleon","author":"Gylergin","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/kecleon.1.zspr","tags":["Pokemon"]},
{"name":"Kenny McCormick","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/kenny_mccormick.1.zspr","tags":["South Park","Male"]},
{"name":"Ketchup","author":"t0uchan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ketchup.1.zspr","tags":["Tasty","IRL"]},
{"name":"Kholdstare","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/kholdstare.1.zspr","tags":["ALTTP NPC","Legend of Zelda","Boss"]},
{"name":"King Gothalion","author":"kickpixel","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/king_gothalion.1.zspr","tags":["Streamer","Personality","Male"]},
{"name":"King Graham","author":"MisterKerr","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/king_graham.1.zspr","tags":["King's Quest","Male"]},
{"name":"Kirby","author":"KHRoxas","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/kirby-meta.1.zspr","tags":["Male","Kirby"]},
{"name":"Kore8","author":"Skewer","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/kore8.1.zspr","tags":["Personality"]},
{"name":"Korok","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/korok.1.zspr","tags":["The Legend of Zelda","Wind Waker","NPC"]},
{"name":"Lakitu","author":"SirCzah","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/lakitu.1.zspr","tags":["Mario"]},
{"name":"Lapras","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/lapras.1.zspr","tags":["Pokemon"]},
{"name":"Lest","author":"PrideToRuleEarth","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/lest.1.zspr","tags":["Final Fantasy"]},
{"name":"Lily","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/lily.1.zspr","tags":["Blossom Tales","Female"]},
{"name":"Linja","author":"Razhagal","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/linja.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Link Redrawn","author":"Spiffy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/link-redrawn.1.zspr","tags":["Link","ALTTP","Male"]},
{"name":"Hat Color Link","author":"Damon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/linkhatcolor.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Tunic Color Link","author":"Damon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/linktuniccolor.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Little Hylian","author":"MM102","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/little-hylian.1.zspr","tags":["Male","Personality","Pokemon"]},
{"name":"Pony","author":"Botchos","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/littlepony.1.zspr","tags":["My Little Pony","Female","Animal"]},
{"name":"Locke","author":"Rose","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/locke.1.zspr","tags":["Male","Final Fantasy"]},
{"name":"Figaro Merchant","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/locke_merchant.1.zspr","tags":["Final Fantasy","Male"]},
{"name":"Lucario","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/lucario.1.zspr","tags":["Pokemon"]},
{"name":"Luffy","author":"BOtheMighty","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/luffy.1.zspr","tags":["Personality","Streamer","Male"]},
{"name":"Luigi","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/luigi.1.zspr","tags":["Male","Mario","Superhero"]},
{"name":"Luna Maindo","author":"IkkyLights","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/luna-maindo.1.zspr","tags":["Female","Elsword"]},
{"name":"Madeline","author":"Jam","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/madeline.1.zspr","tags":["Female","Celeste"]},
{"name":"Magus","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/magus.1.zspr","tags":["Chrono Trigger","Villain","Male"]},
{"name":"Maiden","author":"Plan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/maiden.1.zspr","tags":["ALTTP NPC","Female","Legend of Zelda"]},
{"name":"Mallow (Cat)","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mallow-cat.1.zspr","tags":["Cat","Animal","Streamer"]},
{"name":"Manga Link","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mangalink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Maple Queen","author":"Zarby89","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/maplequeen.2.zspr","tags":["Female"]},
{"name":"Marin","author":"Nocturnesthesia","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/marin.2.zspr","tags":["Legend of Zelda","Female"]},
{"name":"Mario (Classic)","author":"Damon","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mario-classic.2.zspr","tags":["Mario","Male"]},
{"name":"Tanooki Mario","author":"Nocturnesthesia","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mario_tanooki.1.zspr","tags":["Mario","Male"]},
{"name":"Mario and Cappy","author":"Damon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mariocappy.1.zspr","tags":["Mario","Male"]},
{"name":"Marisa Kirisame","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/marisa.1.zspr","tags":["Touhou Project","Female"]},
{"name":"Matthias","author":"Marcus Bolduc","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/matthias.1.zspr","tags":["Redwall","Male","Cartoon","Book"]},
{"name":"Meatwad","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/meatwad.1.zspr","tags":["Male","Aqua Teen Hunger Force","Cartoon Network"]},
{"name":"Medallions","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/medallions.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Medli","author":"Kzinssie","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/medli.1.zspr","tags":["Legend of Zelda","Female","Bird"]},
{"name":"Megaman X","author":"PlaguedOne","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/megaman-x.2.zspr","tags":["Male","Megaman"]},
{"name":"Baby Metroid","author":"Jam","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/metroid.1.zspr","tags":["Metroid","Alien"]},
{"name":"MewLp","author":"MewLp","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mew.1.zspr","tags":["Pokemon"]},
{"name":"Mike Jones","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mike-jones.2.zspr","tags":["StarTropics","Male"]},
{"name":"Minish Link","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/minish_link.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Minish Cap Link","author":"InTheBeef","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/minishcaplink.2.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"missingno","author":"AAhbxsujd","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/missingno.1.zspr","tags":["Pokemon"]},
{"name":"Moblin","author":"Noctai_","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/moblin.1.zspr","tags":["Legend of Zelda","ALTTP"]},
{"name":"Modern Link","author":"RyuTech","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/modernlink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Mog","author":"Krelbel","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mog.2.zspr","tags":["Final Fantasy"]},
{"name":"Momiji Inubashiri","author":"Ardaceus","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/momiji.1.zspr","tags":["Touhou Project","Female"]},
{"name":"Moosh","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/moosh.1.zspr","tags":["Link","Male","Legend of Zelda","Animal"]},
{"name":"Mouse","author":"Malthaez","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mouse.1.zspr","tags":["Link","Animal"]},
{"name":"Ms. Paint Dog","author":"TehRealSalt","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ms-paintdog.1.zspr","tags":["Animal"]},
{"name":"Power Up with Pride Mushroom","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/mushy.1.zspr","tags":["Pride"]},
{"name":"Nature Link","author":"iBazly","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/naturelink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Navi","author":"qwertymodo","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/navi.1.zspr","tags":["Female","Legend of Zelda"]},
{"name":"Navirou","author":"Lori","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/navirou.2.zspr","tags":["Monster Hunter"]},
{"name":"Ned Flanders","author":"JJ0033LL","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ned-flanders.1.zspr","tags":["Male","Cartoon","Simpsons"]},
{"name":"Negative Link","author":"iBazly","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/negativelink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Neosad","author":"Dr. Deadrewski","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/neosad.1.zspr","tags":["Personality","Streamer"]},
{"name":"NES Link","author":"MikeTrethewey\/Fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/neslink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Ness","author":"Lantis","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ness.1.zspr","tags":["Male","Earthbound"]},
{"name":"Nia","author":"Mojonbo","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/nia.1.zspr","tags":["Xenoblade","Female"]},
{"name":"Niddraig","author":"Jakebob","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/niddraig.1.zspr","tags":["Final Fantasy","Personality"]},
{"name":"Niko","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/niko.1.zspr","tags":["OneShot","Cat"]},
{"name":"Old Man","author":"Zarby89","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/oldman.2.zspr","tags":["ALTTP NPC","Male","Legend of Zelda"]},
{"name":"Ori","author":"Phant","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ori.2.zspr","tags":["Ori","Male"]},
{"name":"Outline Link","author":"VT","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/outlinelink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Parallel Worlds Link","author":"SePH\/InTheBeef","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/parallelworldslink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Paula","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/paula.1.zspr","tags":["Earthbound","Female"]},
{"name":"Princess Peach","author":"RoPan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/peach.1.zspr","tags":["Mario","Princess","Female"]},
{"name":"Penguin Link","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/penguinlink.1.zspr","tags":["Link","Animal"]},
{"name":"Pete","author":"Lantis","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/pete.1.zspr","tags":["Male","Harvest Moon"]},
{"name":"Phoenix Wright","author":"SnipSlum","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/phoenix-wright.1.zspr","tags":["Male","Ace Attorney"]},
{"name":"Pikachu","author":"toucansham","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/pikachu.1.zspr","tags":["Pokemon"]},
{"name":"Pink Ribbon Link","author":"fatmanspanda","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/pinkribbonlink.2.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Piranha Plant","author":"lecremateur","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/piranha_plant.1.zspr","tags":["Mario","Villain"]},
{"name":"Plague Knight","author":"Jenichi","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/plagueknight.1.zspr","tags":["Shovel Knight","Male"]},
{"name":"Pokey","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/pokey.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Popoi","author":"ItsSupercar","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/popoi.1.zspr","tags":["Secret of Mana","Male"]},
{"name":"Poppy","author":"cbass601","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/poppy.1.zspr","tags":["Trolls","Female"]},
{"name":"Porg Knight","author":"PorgCollector","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/porg_knight.1.zspr","tags":["Star Wars"]},
{"name":"Powerpuff Girl","author":"Jenichi","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/powerpuff_girl.1.zspr","tags":["Female","Superhero","Powerpuff Girls","Cartoon Network"]},
{"name":"Pride Link","author":"proximitysound","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/pridelink.2.zspr","tags":["Link","Male","Legend of Zelda","Pride"]},
{"name":"Primm","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/primm.1.zspr","tags":["Secret of Mana","Female"]},
{"name":"Princess Bubblegum","author":"Devan2002","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/princess_bubblegum.1.zspr","tags":["Female","Cartoon Network"]},
{"name":"Psyduck","author":"skovacs1","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/psyduck.2.zspr","tags":["Pokemon"]},
{"name":"The Pug","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/pug.1.zspr","tags":["Personality","Animal","Streamer","Male"]},
{"name":"Purple Chest","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/purplechest-bottle.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Pyro","author":"malmo","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/pyro.1.zspr","tags":["Team Fortress","Male"]},
{"name":"Rainbow Link","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rainbowlink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Rat","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rat.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Red Mage","author":"TheRedMage","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/red-mage.1.zspr","tags":["Final Fantasy"]},
{"name":"Remeer","author":"Herowho","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/remeer.1.zspr","tags":["Brain Lord","Male"]},
{"name":"Rick","author":"Eric the Terrible\/Devan 2002","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rick.1.zspr","tags":["Male","Cartoon Network"]},
{"name":"Robo-Link 9000","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/robotlink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Rocko","author":"toucansham","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rocko.1.zspr","tags":["Male","Nickelodeon"]},
{"name":"Rottytops","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rottytops.1.zspr","tags":["Cartoon"]},
{"name":"Rover","author":"NO Body the Dragon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rover.1.zspr","tags":["Male","Animal Crossing","Cat"]},
{"name":"Roy Koopa","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/roykoopa.1.zspr","tags":["Male","Mario"]},
{"name":"Rumia","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rumia.1.zspr","tags":["Touhou Project","Female"]},
{"name":"Rydia","author":"Sho","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/rydia.1.zspr","tags":["Final Fantasy","Female"]},
{"name":"Ryu","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ryu.1.zspr","tags":["Male","Street Fighter"]},
{"name":"Sailor Moon","author":"Jenichi","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/sailormoon.1.zspr","tags":["Sailor Moon","Female","Cartoon"]},
{"name":"Saitama","author":"Dabeanjelly\/Ath3h3art0fwinter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/saitama.1.zspr","tags":["Male","Superhero"]},
{"name":"Samus (Super Metroid)","author":"Ben G","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/samus-sm.1.zspr","tags":["Metroid","Female"]},
{"name":"Samus","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/samus.2.zspr","tags":["Metroid","Female"]},
{"name":"Samus (Classic)","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/samus_classic.1.zspr","tags":["Metroid","Female"]},
{"name":"Santa Link","author":"HOHOHO","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/santalink.2.zspr","tags":["Link","Male","Legend of Zelda","Festive"]},
{"name":"Scholar","author":"Damon","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/scholar.1.zspr","tags":["Link","Male"]},
{"name":"Selan","author":"atth3h3art0fwinter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/selan.1.zspr","tags":["Lufia","Female"]},
{"name":"SevenS1ns","author":"Hroun","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/sevens1ns.1.zspr","tags":["Personality","Streamer","Male"]},
{"name":"Shadow","author":"CGG Zayik","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/shadow.1.zspr","tags":["Final Fantasy","Male"]},
{"name":"Shadow Sakura","author":"iBazly","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/shadowsaku.2.zspr","tags":["Personality","Streamer","Female"]},
{"name":"Shantae","author":"skovacs1","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/shantae.1.zspr","tags":["Shantae","Female"]},
{"name":"Shuppet","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/shuppet.1.zspr","tags":["Pokemon","Ghost"]},
{"name":"Shy Gal","author":"FedoraFriday","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/shy-gal.1.zspr","tags":["Mario","Female"]},
{"name":"Shy Guy","author":"skovacs1","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/shy-guy.1.zspr","tags":["Mario"]},
{"name":"SighnWaive","author":"GenoCL","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/sighn_waive.1.zspr","tags":["Personality"]},
{"name":"Slime","author":"KamenRideDecade","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/slime.1.zspr","tags":["Dragon Quest"]},
{"name":"Slowpoke","author":"Joey_Rat","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/slowpoke.1.zspr","tags":["Pokemon"]},
{"name":"SNES Controller","author":"Cbass601","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/snes-controller.1.zspr","tags":["SNES"]},
{"name":"Soda Can","author":"Zarby89","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/sodacan.1.zspr","tags":["Sprite","Tasty","IRL"]},
{"name":"Solaire of Astora","author":"Knilip","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/solaire.1.zspr","tags":["Dark Souls","Male"]},
{"name":"Hyrule Soldier","author":"InTheBeef","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/soldiersprite.1.zspr","tags":["Legend of Zelda","ALTTP NPC"]},
{"name":"Sonic the Hedgehog","author":"Osaka","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/sonic.1.zspr","tags":["Male","Sonic the Hedgehog"]},
{"name":"Sora","author":"roxas232","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/sora.1.zspr","tags":["Male","Kingdom Hearts"]},
{"name":"Sora (KH1)","author":"ScatlinkSean","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/sora_kh1.1.zspr","tags":["Male","Kingdom Hearts"]},
{"name":"Spongebob Squarepants","author":"JJ0033LL","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/spongebob.1.zspr","tags":["Male","Spongebob Squarepants"]},
{"name":"Squall","author":"Maessan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/squall.1.zspr","tags":["Male","Final Fantasy"]},
{"name":"Squirrel","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/squirrel.1.zspr","tags":["Animal","Personality","Streamer"]},
{"name":"Squirtle","author":"Numberplay","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/squirtle.1.zspr","tags":["Pokemon"]},
{"name":"Stalfos","author":"Artheau","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/stalfos.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Stan","author":"Kan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/stan.1.zspr","tags":["Male","Okage: Shadow King"]},
{"name":"Static Link","author":"fatmanspanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/staticlink.1.zspr","tags":["Link","Male","Legend of Zelda","Randomizer"]},
{"name":"Steamed Hams","author":"AFewGoodTaters","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/steamedhams.1.zspr","tags":["Link","Cartoon"]},
{"name":"Stick Man","author":"skovacs1","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/stick_man.1.zspr","tags":["Personality"]},
{"name":"Super Bomb","author":"Ninjakauz","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/superbomb.1.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Super Bunny","author":"TheOkayGuy","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/superbunny.2.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Super Meat Boy","author":"Achy","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/supermeatboy.1.zspr","tags":["Male","Meat Boy"]},
{"name":"Susie","author":"Zandra","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/susie.1.zspr","tags":["Female","Undertale","Deltarune"]},
{"name":"Swatchy","author":"Mike Trethewey","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/swatchy.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"TASBot","author":"GenoCL","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/tasbot.1.zspr","tags":["Personality"]},
{"name":"Tea Time","author":"SirCzah","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/teatime.1.zspr","tags":["Personality","Streamer"]},
{"name":"Terra (Esper)","author":"All-in-one Mighty","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/terra.1.zspr","tags":["Final Fantasy","Female"]},
{"name":"Tetra","author":"Ferelheart","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/tetra.1.zspr","tags":["Legend of Zelda","Female"]},
{"name":"TGH","author":"Drew Wise, pizza_for_free","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/tgh.1.zspr","tags":["Personality","Streamer","Male"]},
{"name":"Thief","author":"Devan2002","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/thief.1.zspr","tags":["ALTTP NPC","Male","Legend of Zelda"]},
{"name":"Thomcrow","author":"Thom","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/thomcrow.1.zspr","tags":["Personality","Streamer","Male","Bird"]},
{"name":"Tile","author":"fatmanspanda","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/tile.2.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Tingle","author":"Xenobond","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/tingle.1.zspr","tags":["Legend of Zelda","Male"]},
{"name":"TMNT","author":"SirCzah","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/tmnt.1.zspr","tags":["Animal","Male","Cartoon"]},
{"name":"Toad","author":"Zarby89","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/toad.2.zspr","tags":["Male","Mario"]},
{"name":"Toadette","author":"Devan2002","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/toadette.2.zspr","tags":["Female","Mario"]},
{"name":"Captain Toadette","author":"Devan2002","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/toadette_captain.1.zspr","tags":["Female","Mario"]},
{"name":"TotemLinks","author":"Yotohan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/totem-links.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Trogdor the Burninator","author":"MikeTrethewey\/Spanda","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/trogdor.1.zspr","tags":["Male"]},
{"name":"TP Zelda","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/twilightprincesszelda.2.zspr","tags":["Legend of Zelda","Female"]},
{"name":"TwoFaced","author":"Devan2002","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/two_faced.1.zspr","tags":["Personality"]},
{"name":"Ty the Tasmanian Tiger","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ty.1.zspr","tags":["Animal","Ty the Tasmanian Tiger"]},
{"name":"Ultros","author":"PlaguedOne","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/ultros.1.zspr","tags":["Final Fantasy"]},
{"name":"Valeera","author":"Glan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/valeera.1.zspr","tags":["Warcraft","Female"]},
{"name":"VanillaLink","author":"Jenichi","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/vanillalink.1.zspr","tags":["Link","Male","Legend of Zelda"]},
{"name":"Vaporeon","author":"Aquana","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/vaporeon.1.zspr","tags":["Pokemon"]},
{"name":"Vegeta","author":"Merciter","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/vegeta.1.zspr","tags":["Male","Dragonball"]},
{"name":"Vera","author":"aitchFactor","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/vera.1.zspr","tags":["Personality"]},
{"name":"Vitreous","author":"Glan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/vitreous.1.zspr","tags":["ALTTP NPC","Legend of Zelda","Boss"]},
{"name":"Vivi","author":"RyuTech","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/vivi.1.zspr","tags":["Final Fantasy","Male"]},
{"name":"Vivian","author":"SirCzah","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/vivian.1.zspr","tags":["Mario","Female"]},
{"name":"Wario","author":"Deagans","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/wario.1.zspr","tags":["Male","Mario","Villain"]},
{"name":"Will","author":"Xenobond","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/will.1.zspr","tags":["Illusion of Gaia","Male"]},
{"name":"Wizzrobe","author":"iBazly","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/wizzrobe.2.zspr","tags":["ALTTP NPC","Legend of Zelda"]},
{"name":"Wolf Link (Festive)","author":"Fish\/Beef-Chan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/wolf_link.1.zspr","tags":["Link","Male","Legend of Zelda","Animal","Festive"]},
{"name":"Wolf Link (TP)","author":"Gfish59","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/wolf_link_tp.1.zspr","tags":["Link","Male","Legend of Zelda","Animal"]},
{"name":"Yoshi","author":"Yotohan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/yoshi.1.zspr","tags":["Mario"]},
{"name":"Yunica Tovah","author":"Fish_waffle64","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/yunica.1.zspr","tags":["Female","Ys"]},
{"name":"Zandra","author":"ZandraVandra","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/zandra.1.zspr","tags":["Personality","Streamer","Female"]},
{"name":"Zebra Unicorn","author":"Brass Man","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/zebraunicorn.1.zspr","tags":["Animal","Personlity","Streamer"]},
{"name":"Zeckemyro","author":"aitchFactor","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/zeck.1.zspr","tags":["Personality"]},
{"name":"Zelda","author":"Myriachan","version":1,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/zelda.1.zspr","tags":["ALTTP NPC","Female","Legend of Zelda"]},
{"name":"Zero Suit Samus","author":"Fish_waffle64","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/zerosuitsamus.2.zspr","tags":["Metroid","Female"]},
{"name":"Zora","author":"Zarby, InTheBeef","version":2,"file":"https:\/\/alttpr.s3.us-east-2.amazonaws.com\/zora.2.zspr","tags":["ALTTP NPC","Legend of Zelda"]}];