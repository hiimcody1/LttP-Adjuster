function z2Patcher(rom, disableHealthBeep, disableMusic, useFastSpell, remapUpA, removeFlashing, spriteId, tunicColorId, shieldColorId, beamId){
    console.log(crc32(rom));
    rom = patchSprite(rom,spriteId);
    rom = patchBeamSprite(rom,beamId);
    patchTunicColor(rom,tunicColorId);
    patchShieldColor(rom,shieldColorId);
    patchHealthBeep(rom,disableHealthBeep);
	patchMusic(rom,disableMusic);
    patchFastSpell(rom,useFastSpell);
    patchRemapUpA(rom,remapUpA);
    patchRemoveFlashing(rom,removeFlashing);
    console.log(crc32(rom));
    return rom;
}

function patchSprite(rom,spriteId) {
    let spritePatchRaw = null;
    if((spriteId !== "-1") && (spriteId in indexedDb.obj.spriteCache)) {
        console.log("Applying " + indexedDb.obj.spriteCache[spriteId]["name"]);
        spritePatchRaw = indexedDb.obj.spriteCache[spriteId]["patch"];
    } else if(spriteId == "-2") {
        //Random sprite
        console.log("Random sprite");
        let spriteCache = indexedDb.obj.spriteCache;
        var randomSprite = function (obj) {
            var keys = Object.keys(obj);
            return obj[keys[ keys.length * Math.random() << 0]];
        };
        let sprite = randomSprite(spriteCache);
        console.log("Rolled " + sprite["name"]);
        spritePatchRaw = sprite["patch"];
    }

    //We have a sprite to patch
    if(spritePatchRaw) {
        let rawPatch = atob(spritePatchRaw);

        var array = new Uint8Array(rawPatch.length);
        for(let r=0;r<rawPatch.length;r++) {
            array[r] = rawPatch.charCodeAt(r);
        }
        
        let patch = new MarcFile(array);
        let spritePatch = parseIPSFile(patch);
        return spritePatch.apply(rom);
    }

    return rom;
}

function patchBeamSprite(rom,spriteId) {
    let spritePatchRaw = null;

    if(spriteId !== "-1" && spriteId in indexedDb.obj.beamCache) {
        console.log("Applying " + indexedDb.obj.beamCache[spriteId]["name"]);
        spritePatchRaw = indexedDb.obj.beamCache[spriteId]["patch"];
    } else if(spriteId == "-2") {
        //Random sprite
        console.log("Random sprite");
        let beamCache = indexedDb.obj.beamCache;
        var randomSprite = function (obj) {
            var keys = Object.keys(obj);
            return obj[keys[ keys.length * Math.random() << 0]];
        };
        let sprite = randomSprite(beamCache);
        console.log("Rolled " + sprite["name"]);
        spritePatchRaw = sprite["patch"];
    }

    //We have a sprite to patch
    if(spritePatchRaw) {
        let rawPatch = atob(spritePatchRaw);

        var array = new Uint8Array(rawPatch.length);
        for(let r=0;r<rawPatch.length;r++) {
            array[r] = rawPatch.charCodeAt(r);
        }
        
        let patch = new MarcFile(array);
        let spritePatch = parseIPSFile(patch);
        return spritePatch.apply(rom);
    }

    return rom;
}

function patchTunicColor(rom,tunicColorId) {
    console.log("Tunic: " + tunicColorId);
    if(tunicColorId !== "-1") {
        for(let i=0;i<Z2Rom.memory.tunicColorSingles.length;i++) {
            rom.seekWriteU8(Z2Rom.memory.tunicColorSingles[i],tunicColorId);
        }
        rom.seekWriteU8(Z2Rom.memory.tunicColorSingles[0],tunicColorId-0x20);
        rom.seekWriteU8(Z2Rom.memory.tunicColorSingles[1],tunicColorId);
        rom.seekWriteU8(Z2Rom.memory.tunicColorSingles[2],tunicColorId-0x10);
        for(let i=0;i<Z2Rom.memory.tunicColor.length;i++) {
            rom.seekWriteU8(Z2Rom.memory.tunicColor[i],tunicColorId);
            rom.seekWriteU8(Z2Rom.memory.tunicColor[i]+1,tunicColorId-0x10);
            rom.seekWriteU8(Z2Rom.memory.tunicColor[i]-1,tunicColorId-0x20);
        }
    }
}

function patchShieldColor(rom,shieldColorId) {
    console.log("Shield: " + shieldColorId);
    if(shieldColorId !== "-1") {
        for(let i=0;i<Z2Rom.memory.shieldColor.length;i++) {
            rom.seekWriteU8(Z2Rom.memory.shieldColor[i],shieldColorId);
        }
    }
}

function patchHealthBeep(rom, disableHealthBeep) {
    if(disableHealthBeep) {
        console.log("Disable Low Health Beep");
        let addresses = Object.entries(Z2Rom.memory.beep);
        for(let i=0;i<addresses.length;i++) {
            for(let a=0;a<addresses[i][1].length;a++)
                rom.seekWriteU8(addresses[i][1][a],addresses[i][0]);
        }
    }
}

function patchMusic(rom, disableMusic) {
    if(disableMusic) {
        console.log("Disable Music");
        let addresses = Object.entries(Z2Rom.memory.music);
        for(let i=0;i<addresses.length;i++) {
            for(let a=0;a<addresses[i][1].length;a++)
                rom.seekWriteU8(addresses[i][1][a],addresses[i][0]);
        }
    }
}

function patchFastSpell(rom, useFastSpell) {
    if(useFastSpell) {
        console.log("Enable Fast Spell");
        let addresses = Object.entries(Z2Rom.memory.fastSpell);
        for(let i=0;i<addresses.length;i++) {
            for(let a=0;a<addresses[i][1].length;a++)
                rom.seekWriteU8(addresses[i][1][a],addresses[i][0]);
        }
    }
}

function patchRemapUpA(rom, remapUpA) {
    if(remapUpA) {
        console.log("Remap Up+A");
        let addresses = Object.entries(Z2Rom.memory.remapUpA);
        for(let i=0;i<addresses.length;i++) {
            for(let a=0;a<addresses[i][1].length;a++)
                rom.seekWriteU8(addresses[i][1][a],addresses[i][0]);
        }
    }
}

function patchRemoveFlashing(rom, removeFlashing) {
    if(removeFlashing) {
        console.log("Disable Flashing");
        let addresses = Object.entries(Z2Rom.memory.disableFlashing);
        for(let i=0;i<addresses.length;i++) {
            for(let a=0;a<addresses[i][1].length;a++)
                rom.seekWriteU8(addresses[i][1][a],addresses[i][0]);
        }
    }
}
