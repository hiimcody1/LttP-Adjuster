function z2Patcher(rom, disableHealthBeep, disableMusic, useFastSpell, remapUpA, removeFlashing, spriteName, normalColor, shieldColor, beamSprite){
    console.log(crc32(rom));
    patchHealthBeep(rom,disableHealthBeep);
	patchMusic(rom,disableMusic);
    patchFastSpell(rom,useFastSpell);
    patchRemapUpA(rom,remapUpA);
    patchRemoveFlashing(rom,removeFlashing);
    console.log(crc32(rom));
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
