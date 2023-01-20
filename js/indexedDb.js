var db;

function IndexedDb(){
  this.obj = {
    healthBeep: true,
    music: true,
    fastSpell: false,
    remapUpA: false,
    removeFlashing: true,
    spriteFile: null,
    spriteName: 'link',
    normalColor: 'default',
    shieldColor: 'default',
    beamSprite: 'default',
    z2Rom: null
  };

  if (!('indexedDB' in window)){
    console.log('This browser doesn\'t support IndexedDB');
    return;
  } else {
    var dbPromise = window.indexedDB.open('adjuster-db', 2);

    dbPromise.onupgradeneeded = function(e) {
      var thisDB = e.target.result;
      if (!thisDB.objectStoreNames.contains('configs')){
        thisDB.createObjectStore('configs', {keyPath: 'field'});
      }
    }
  
    dbPromise.onsuccess = (e) => {
      db = e.target.result;
      this.load();
    }
  }  
}

IndexedDb.prototype.load = function(){
  if (db) {
    var tx = db.transaction('configs', 'readonly');
    var store = tx.objectStore('configs');
    var req = store.getAll();
  
    req.onsuccess = (e) => {
      var req = e.target.result;
      if (req.length > 0){
        req.forEach(eachConfig => {
          this.obj[eachConfig.field] = eachConfig.value;
        });      
      }
  
      this.loadZ2Rom();
      this.loadSprite();
      this.setFormValues();
    }
  } else {
    this.setFormValues();
  }
}

IndexedDb.prototype.loadZ2Rom = function(){
  if(this.obj.z2Rom){
    var header= 0x10;
    var size = 0x3c00f;
    var trimmedCrc = '8b5a9d69';

    try{
      var bin = atob(this.obj.z2Rom);

      if(bin.length > size+header) {
        //Try to re-arrange the rom to make it work
      }

      var array = new Uint8Array(bin.length);
      for(var k=0; k<bin.length; k++){
        array[k] = bin.charCodeAt(k);
      }

      

      var storedRom = new MarcFile(array);
      var crc = padZeroes(crc32(storedRom, 0), 4);
      var crcNoHeader = padZeroes(crc32(storedRom, 16), 4);
      if(crcNoHeader==='ba322865') {
        //Rom is fine, minus headers, clean it up
        array = new Uint8Array(bin.length+16);

        array[0] = 0x4E;  //N
        array[1] = 0x45;  //E
        array[2] = 0x53;  //S
        array[3] = 0x1A;  //EOF
        array[4] = 0x08;  //PRG SIZE
        array[5] = 0x10;  //CHR SIZE
        array[6] = 0x12;  //MAPPER,MIRRORING,BATTERY,TRAINER -> MAPS TO: 00010010 -> Has battery, Ignore mirroring

        //Padding
        for(var h=7;h<16;h++)
          array[h] = 0x00;
        
        for(var k=16; k<bin.length+16; k++){
          array[k] = bin.charCodeAt(k);
        }

        storedRom = new MarcFile(array);
        crc = padZeroes(crc32(storedRom, 0), 4);
      }

      if(crc==='ba322865') {
        //Headerless rom, inject fake header
        array = new Uint8Array(bin.length+16);

        array[0] = 0x4E;  //N
        array[1] = 0x45;  //E
        array[2] = 0x53;  //S
        array[3] = 0x1A;  //EOF
        array[4] = 0x08;  //PRG SIZE
        array[5] = 0x10;  //CHR SIZE
        array[6] = 0x12;  //MAPPER,MIRRORING,BATTERY,TRAINER -> MAPS TO: 00010010 -> Has battery, Ignore mirroring

        //Padding
        for(var h=7;h<16;h++)
          array[h] = 0x00;
        
        for(var k=16; k<bin.length+16; k++){
          array[k] = bin.charCodeAt(k-16);
        }

        //Lets try again to get the right hash
        storedRom = new MarcFile(array);
        crc = padZeroes(crc32(storedRom, 0), 4);
      } 

      if(crc==='e3c788b0'){
        //Headered rom
        romFile = storedRom;
        el('row-input-file-z2').style.display = 'none';
      } else {
        this.obj.z2Rom = null;
      }
    }
    catch(e){}
  }
}

IndexedDb.prototype.loadSprite = function(){
  if(this.obj.spriteFile){
    try{
      var bin = atob(this.obj.spriteFile);
      var array = new Uint8Array(bin.length);
      for(var k=0; k<bin.length; k++){
        array[k] = bin.charCodeAt(k);
      }
      spriteFile = new MarcFile(array);
      var small = document.createElement("small");
      small.innerHTML = "<br />Cached Custom: " + this.obj.spriteName + "<br />";
      document.getElementById("select-sprite").options[1].innerHTML = "[Custom] - " + this.obj.spriteName;
    }
    catch(e){}
  }
}

IndexedDb.prototype.setFormValues = function(){
  el('checkbox-music').checked = this.obj.music;
  el('checkbox-flashing').checked = this.obj.flashing;
  el('select-sprite').value = this.obj.sprite;
  if(this.obj.sprite == "custom" || this.obj.sprite == "random")
    //parent.postMessage({"action": "setPreview", "url": "https://static.hiimcody1.com/images/Random.png"}, "https://alttpr.hiimcody1.com/");
    if(this.obj.sprite == "custom")
      el('input-file-sprite').style.display="block";
  //else
  //  parent.postMessage({"action": "setPreview", "url": el('select-sprite2')[el('select-sprite2').selectedIndex].getAttribute('preview')}, "https://alttpr.hiimcody1.com/");
}

IndexedDb.prototype.save = function(tab){
  var id = '2'; 
  this.saveZ2Rom();
  this.saveSprite();
  this.obj.quickswap = el('checkbox-quickswap'+id).checked;
  this.obj.music = el('checkbox-music'+id).checked;
  this.obj.resume = el('checkbox-resume'+id).checked;
  this.obj.flashing = el('checkbox-flashing'+id).checked;
  this.obj.sprite = el('select-sprite'+id).value;
  this.obj.color = el('select-heartcolor'+id).value;
  this.obj.beep = el('select-beep'+id).value;
  this.obj.sfx = el('checkbox-sfx'+id).checked;
  this.obj.chicken = el('checkbox-sfx-chicken2').checked;
  this.obj.speed = el('select-menuspeed'+id).value;
  this.obj.tphSprite = el('select-tph-pieces'+id).value;
  this.obj.owp = el('checkbox-owpalettes'+id).checked;
  this.obj.uwp = this.obj.owp;

  if (db) {
    var tx = db.transaction('configs', 'readwrite');
    var store = tx.objectStore('configs');
    Object.keys(this.obj).forEach(eachKey => {
      var item = {
        field: eachKey,
        value: this.obj[eachKey]
      };
      store.put(item);
    });
    tx.oncomplete = () => {
      this.setFormValues();
    }
  } 
}

IndexedDb.prototype.saveZ2Rom = function(){
  if(!this.obj.jp_file && romFile1 && jpCrc==='3322effc'){
    var bin = '';
    var array = romFile1._u8array;
    for(var k=0; k<array.length; k++){
      bin += String.fromCharCode(array[k]);
    }
    this.obj.jp_file = btoa(bin);
  }
}

IndexedDb.prototype.saveSprite = function(){
  if(spriteFile){
    var bin = '';
    var array = spriteFile._u8array;
    for(var k=0; k<array.length; k++){
      bin += String.fromCharCode(array[k]);
    }
    if(this.obj.spriteFile !== btoa(bin)) {
      this.obj.spriteFile = btoa(bin);
      this.obj.spriteName = document.getElementById("input-file-sprite").files[0].name;
    }
  }
}