function zeldaPatcher(rom, beepRate, heartColor, isQuickswap, menuSpeed, isMusicDisabled, sprite, owPalettes, uwPalettes){
  quickswapPatch(rom,isQuickswap);
  musicPatch(rom, isMusicDisabled);
  menuSpeedPatch(rom,menuSpeed);
  heartBeepPatch(rom,beepRate);
  heartColorPatch(rom,heartColor);
  if(sprite){
    spritePatch(rom,sprite);
  }
  paletteShufflePatch(rom, uwPalettes, owPalettes);
  writeCrc(rom);
}

function quickswapPatch(rom, isQuickswap){  
  rom.seekWriteU8(0x18004B,isQuickswap ? 0x01 : 0x00);
}

function menuSpeedPatch(rom, speed){
  if(speed==='instant'){
    rom.seekWriteU8(0x6DD9A, 0x20);
    rom.seekWriteU8(0x6DF2A, 0x20);
    rom.seekWriteU8(0x6E0E9, 0x20);
  }else{
    rom.seekWriteU8(0x6DD9A, 0x11);
    rom.seekWriteU8(0x6DF2A, 0x12);
    rom.seekWriteU8(0x6E0E9, 0x12);
  }
  switch(speed){
    case 'instant':
      rom.seekWriteU8(0x180048, 0xE8); break;
    case 'double':
      rom.seekWriteU8(0x180048, 0x10); break;
    case 'triple':
      rom.seekWriteU8(0x180048, 0x18); break;
    case 'quadruple':
      rom.seekWriteU8(0x180048, 0x20); break;
    case 'half':
      rom.seekWriteU8(0x180048, 0x04); break;
    default:
      rom.seekWriteU8(0x180048, 0x08); break;
  }
}

function heartBeepPatch(rom,rate){
  var beepValues={
    off:0x00,
    half:0x40,
    quarter:0x80,
    normal:0x20,
    double:0x10
  };
  rom.seekWriteU8(0x180033,beepValues[rate]);
}

function heartColorPatch(rom, color){
  var colorNames=['red','blue','green','yellow','random'];
  if(color==='random'){
    color=colorNames[Math.floor(Math.random()*4)];
  }
  var colorValues={
    red:[0x24, 0x05],
    blue:[0x2C, 0x0D],
    green:[0x3C, 0x19],
    yellow:[0x28, 0x09]
  };
  var addresses=[0x6FA1E,0x6FA20,0x6FA22,0x6FA24,0x6FA26,0x6FA28,0x6FA2A,0x6FA2C,0x6FA2E,0x6FA30];
  addresses.forEach(address=>{
    rom.seekWriteU8(address,colorValues[color][0]);
  })
  rom.seekWriteU8(0x65561,colorValues[color][1]); //??
}

function musicPatch(rom, isMusicDisabled){
  var addresses={
    list:[0x0CFE18,0x0CFEC1,0x0D0000,0x0D00E7,0x18021A],
    on:[[0x70],[0xC0],[0xDA,0x58],[0xDA,0x58],[0x00]],
    off:[[0x00],[0x00],[0x00,0x00],[0xC4,0x58],[1]]
  };
  var which = isMusicDisabled ? 'off' : 'on';
  addresses.list.forEach((address, i) => {
    rom.seekWriteBytes(address, addresses[which][i]);
  });
}

function spritePatch(rom, sprite){
  console.log(sprite);
  rom.seekWriteBytes(0x80000, sprite.sprite);
  rom.seekWriteBytes(0xDD308, sprite.palette);
  rom.seekWriteBytes(0xDEDF5, sprite.glovePalette);
}

function writeCrc(rom){
  var crcSum = [...rom.seekReadBytes(0,0x7FDC),...rom.seekReadBytes(0x7FE0,rom.fileSize)];  
  var crcSums = crcSum.reduce((a,b)=>{
    if (b) {
      return (a+b) & 0xFFFF
    } else {
      return a;
    }    
  }, 0);
  var crc = (crcSums + 0x01FE) & 0xFFFF;  
  var inv = crc ^ 0xFFFF;
  rom.seekWriteBytes(0x7FDC,[inv & 0xFF, (inv >> 8) & 0xFF, crc & 0xFF, (crc >> 8) & 0xFF]);
}

const z3pr = window.z3pr;
const randomize = z3pr.randomize;
function paletteShufflePatch(rom, uwPalettes, owPalettes) {
  // TODO: revert any changes when choosing none
  var options = {randomize_dungeon: true};
  switch(uwPalettes){
    case 'none':
      options.mode = 'none'; break;
    case 'shuffled':
      options.mode = 'maseya'; break;
    case 'blackout':
      options.mode = 'blackout'; break;

  }
  var romData = rom.seekReadBytes(0, rom.fileSize);
  romData = randomize(romData, options);

  options = {randomize_overworld: true};
  switch(owPalettes){
    case 'none':
      options.mode = 'none'; break;
    case 'shuffled':
      options.mode = 'maseya'; break;
    case 'blackout':
      options.mode = 'blackout'; break;

  }  
  romData = randomize(romData, options);

  rom.seekWriteBytes(0,romData);
}