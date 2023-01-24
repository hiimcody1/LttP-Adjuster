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
    try{
      var bin = atob(this.obj.z2Rom);

      var array = new Uint8Array(bin.length);
      for(var k=0; k<bin.length; k++){
        array[k] = bin.charCodeAt(k);
      }

      var z2Rom = new Z2Rom(array);
      if(z2Rom) {
        this.saveZ2Rom(z2Rom.rom);
      } else
        this.obj.z2Rom = null;
      
    } catch(e){
      console.log(e);
    }
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
  this.obj.z2Rom==null ? el('romUpload').classList.remove("d-none") : el('romUpload').classList.add("d-none");
  this.obj.z2Rom==null ? el('seedInfo').classList.add("d-none") : el('seedInfo').classList.remove("d-none");
  
  this.obj.healthBeep ? el('enableHealthBeep').bootstrapToggle('on'): el('enableHealthBeep').bootstrapToggle('off');
  this.obj.music ? el('enableMusic').bootstrapToggle('on'): el('enableMusic').bootstrapToggle('off');
  this.obj.fastSpell ? el('useFastSpell').bootstrapToggle('on'): el('useFastSpell').bootstrapToggle('off');
  this.obj.remapUpA ? el('remapUpA').bootstrapToggle('on'): el('remapUpA').bootstrapToggle('off');
  this.obj.removeFlashing ? el('disableFlashing').bootstrapToggle('on'): el('disableFlashing').bootstrapToggle('off');
  return;
  if(this.obj.sprite == "custom" || this.obj.sprite == "random")
    //parent.postMessage({"action": "setPreview", "url": "https://static.hiimcody1.com/images/Random.png"}, "https://alttpr.hiimcody1.com/");
    if(this.obj.sprite == "custom")
      el('input-file-sprite').style.display="block";
  //else
  //  parent.postMessage({"action": "setPreview", "url": el('select-sprite2')[el('select-sprite2').selectedIndex].getAttribute('preview')}, "https://alttpr.hiimcody1.com/");
}

IndexedDb.prototype.save = function(){
  var id = '2';
  this.obj.healthBeep = el('enableHealthBeep').checked;
  this.obj.music = el('enableMusic').checked;
  this.obj.fastSpell = el('useFastSpell').checked;
  this.obj.remapUpA = el('remapUpA').checked;
  this.obj.removeFlashing = el('disableFlashing').checked;
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

IndexedDb.prototype.saveZ2Rom = function(rom){
  if(!this.obj.jp_file && rom){
    var bin = '';
    var array = rom._u8array;
    for(var k=0; k<array.length; k++){
      bin += String.fromCharCode(array[k]);
    }
    this.obj.z2Rom = btoa(bin);
    romFile = rom;
    this.save();
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