var db;

function IndexedDb(){
  this.obj = {
    jp_file: null,
    sprite_file: null,
    sprite_file_name: null,
    quickswap: true,
    music: true,
    resume: true,
    flashing: false,
    sprite: 'https://alttpr-assets.s3.us-east-2.amazonaws.com/001.link.1.zspr',
    color: 'red',
    beep: 'half',
    speed: 'normal',
    owp: 'none',
    uwp: 'none',
    sfx: false
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
  
      this.loadJpRom();
      this.loadSprite();
      this.setFormValues();
    }
  } else {
    this.setFormValues();
  }
}

IndexedDb.prototype.loadJpRom = function(){
  if(this.obj.jp_file){
    try{
      var bin = atob(this.obj.jp_file);
      var array = new Uint8Array(bin.length);
      for(var k=0; k<bin.length; k++){
        array[k] = bin.charCodeAt(k);
      }
      var storedRom = new MarcFile(array);
      var crc = padZeroes(crc32(storedRom, 0), 4);
      if(crc==='3322effc'){
        romFile1 = storedRom;
        jpCrc = crc;
        el('row-input-file-jp').style.display = 'none';
      }else{
        this.obj.jp_file = null;
      }
    }
    catch(e){}
  }
}

IndexedDb.prototype.loadSprite = function(){
  if(this.obj.sprite_file){
    try{
      var bin = atob(this.obj.sprite_file);
      var array = new Uint8Array(bin.length);
      for(var k=0; k<bin.length; k++){
        array[k] = bin.charCodeAt(k);
      }
      spriteFile = new MarcFile(array);
      var small = document.createElement("small");
      small.innerHTML = "<br />Cached Custom: " + this.obj.sprite_file_name + "<br />";
      //document.getElementById("input-file-sprite").before(small);
      document.getElementById("select-sprite2").options[1].innerHTML = "[Custom] - " + this.obj.sprite_file_name;
    }
    catch(e){}
  }
}

IndexedDb.prototype.setFormValues = function(){
  el('checkbox-quickswap2').checked = this.obj.quickswap;
  el('checkbox-music2').checked = this.obj.music;
  el('checkbox-resume2').checked = this.obj.resume;
  el('checkbox-flashing2').checked = this.obj.flashing;
  el('select-sprite2').value = this.obj.sprite;
  if(this.obj.sprite == "custom" || this.obj.sprite == "random")
    parent.postMessage({"action": "setPreview", "url": "https://static.hiimcody1.com/images/Random.png"}, "https://alttpr.hiimcody1.com/");
    if(this.obj.sprite == "custom")
      el('input-file-sprite').style.display="block";
  else
    parent.postMessage({"action": "setPreview", "url": el('select-sprite2')[el('select-sprite2').selectedIndex].getAttribute('preview')}, "https://alttpr.hiimcody1.com/");
  el('select-heartcolor2').value = this.obj.color;
  el('select-beep2').value = this.obj.beep;
  el('checkbox-sfx2').checked= this.obj.sfx;
  el('checkbox-sfx-chicken2').checked = this.obj.chicken;
  el('checkbox-owpalettes2').checked = this.obj.owp;
  el('select-menuspeed2').value = this.obj.speed;
  el('select-tph-pieces2').value = this.obj.tphSprite;
}

IndexedDb.prototype.save = function(tab){
  var id = '2'; 
  this.saveJpRom();
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

IndexedDb.prototype.saveJpRom = function(){
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
    if(this.obj.sprite_file !== btoa(bin)) {
      this.obj.sprite_file = btoa(bin);
      this.obj.sprite_file_name = document.getElementById("input-file-sprite").files[0].name;
    }
  }
}
