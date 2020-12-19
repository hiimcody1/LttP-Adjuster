var db;

function IndexedDb(){
  this.obj = {
    jp_file: null,
    quickswap: true,
    music: true,
    sprite: 'https://alttpr.s3.us-east-2.amazonaws.com/001.link.1.zspr',
    color: 'red',
    beep: 'half',
    speed: 'normal',
    owp: 'none',
    uwp: 'none'
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
  
      this.setFormValues();
    }
  } else {
    this.setFormValues();
  }
  
}

IndexedDb.prototype.setFormValues = function(){
  el('checkbox-quickswap').checked = this.obj.quickswap;
  el('checkbox-music').checked = this.obj.music;
  el('select-sprite').value = this.obj.sprite;
  el('select-heartcolor').value = this.obj.color;
  el('select-beep').value = this.obj.beep;
  el('select-menuspeed').value = this.obj.speed;
  el('select-owpalettes').value = this.obj.owp;
  el('select-uwpalettes').value = this.obj.uwp;
  el('checkbox-quickswap2').checked = this.obj.quickswap;
  el('checkbox-music2').checked = this.obj.music;
  el('select-sprite2').value = this.obj.sprite;
  el('select-heartcolor2').value = this.obj.color;
  el('select-beep2').value = this.obj.beep;
  el('select-menuspeed2').value = this.obj.speed;
  el('select-owpalettes2').value = this.obj.owp;
  el('select-uwpalettes2').value = this.obj.uwp;
}

IndexedDb.prototype.save = function(tab){
  var id = '';
  if (tab==='create')
    id='2';  
  // TODO: add jp rom
  this.obj.quickswap = el('checkbox-quickswap'+id).checked;
  this.obj.music = el('checkbox-music'+id).checked;
  this.obj.sprite = el('select-sprite'+id).value;
  this.obj.color = el('select-heartcolor'+id).value;
  this.obj.beep = el('select-beep'+id).value;
  this.obj.speed = el('select-menuspeed'+id).value;
  this.obj.owp = el('select-owpalettes'+id).value;
  this.obj.uwp = el('select-uwpalettes'+id).value;

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