function z2Patcher(rom, disableHealthBeep, disableMusic, useFastSpell, remapUpA, removeFlashing, spriteId, normalColor, shieldColor, beamSprite){
    console.log(crc32(rom));
    rom = patchSprite(rom,spriteId);
    patchHealthBeep(rom,disableHealthBeep);
	patchMusic(rom,disableMusic);
    patchFastSpell(rom,useFastSpell);
    patchRemapUpA(rom,remapUpA);
    patchRemoveFlashing(rom,removeFlashing);
    console.log(crc32(rom));
    return rom;
}

function patchSprite(rom,spriteId) {
    if(spriteId !== -1 && spriteId in indexedDb.obj.spriteCache) {
        console.log("Applying " + indexedDb.obj.spriteCache[spriteId]["name"]);
        let spritePatchRaw = indexedDb.obj.spriteCache[spriteId]["patch"];
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
