class Z2Rom {
    static memory = {
        "beep": {
            0xEA: [0x1d4e4],
            0x38: [0x1d4e5]
        },
        "music": {
            0x08: [0x1a010,0x1a011,0x1a012,0x1a013,0x1a014,0x1a3da,0x1a3db,0x1a3dc,0x1a3dd,0x1a63f,0x1a640,0x1a641,0x1a642,0x1a946,0x1a947,0x1a94c],
            0x44: [0x1a030,0x1a3f5,0x1a66f,0x1a971],
            0x00: [0x1a02f,0x1a032,0x1a033,0x1a034,0x1a3f4,0x1a3f7,0x1a3f8,0x1a3f9,0x1a66e,0x1a671,0x1a672,0x1a673,0x1a970,0x1a973,0x1a974,0x1a975],
        },
        "fastSpell": {
            0xEA: [0xe15,0xe16,0xe17]
        },
        "remapUpA": {
            0xF7: [0x21b0,0x21ee],
            0x28: [0x21b2,0x21f0]
        },
        "disableFlashing": {
            0x12: [0x2a01,0x2a02,0x2a03],
            0x16: [0x1c9fa,0x1c9fc]
        }
    }
    rom;
    header = 0x10;
    //size = 0x3c000;
    size = 0x40010;
    crc = {
        trimmed: '8b5a9d69',
        headerClean: '861c3fe6',
        headerDirty: 'a7090f55',
        unheaderedClean: 'ba322865'
    }

    startByteValue = 0x21;
    shieldSpellLoc = 0xe9e;
    shieldSpellValue = 0x16;
    endByteLoc = 0x2bfff;
    endByteValue = 0xff;

    constructor(rawRom) {
        let marcFile;
        let wait = new Promise((resolve, reject) => {
            marcFile = new MarcFile(rawRom,() => {
                resolve();
            });
        }).then(() => {
            this.rom = marcFile;
            if(this.cleanRom()) {
                indexedDb.saveZ2Rom(this.rom);
                document.getElementById("badRom").classList.add("d-none");
                retrieveSeedInfo();
            } else {
                console.log("Failure");
                indexedDb.obj.z2Rom = null;
                indexedDb.save();
                indexedDb.setFormValues();
                document.getElementById("badRom").classList.remove("d-none");
            }
        });
    }

    cleanRom() {
        if(this.crc32() == this.crc.headerClean)
            return true;
        
        this.stripHeader();
        switch(this.crc32()) {
            case this.crc.trimmed:
            case this.crc.unheaderedClean:
                //Clean rom, we can build a new header now
                this.injectHeaderAndPad();
                console.log(this.crc32());
                return this.crc32() == this.crc.headerClean;
            default:
                console.log(this.crc32());
                return false;
        }
    }

    hasHeader() {
        var header = this.rom.seekReadBytes(0,3);
        return (header[0] == 0x4E) && (header[1] == 0x45) && (header[2] == 0x53);
    }

    stripHeader() {
        if(this.hasHeader()) {
            var array = new Uint8Array(this.size-16);
            for(var i=0;i<this.size-16;i++)
                array[i] = this.rom.seekReadBytes(16+i,1);
            this.rom = new MarcFile(array);
        }
    }

    injectHeaderAndPad() {
        var array = new Uint8Array(this.size);
        array[0] = 0x4E;  //N
        array[1] = 0x45;  //E
        array[2] = 0x53;  //S
        array[3] = 0x1A;  //EOF
        array[4] = 0x08;  //PRG SIZE
        array[5] = 0x10;  //CHR SIZE
        array[6] = 0x12;  //MAPPER,MIRRORING,BATTERY,TRAINER -> MAPS TO: 00010010 -> Has battery, Ignore mirroring
        array[7] = 0x08;  //NES - NES2.0  
        array[8] = 0x00;  //MAPPER number
        array[9] = 0x00;  //PRG-ROM/CHR-ROM size
        array[10]= 0x70;  //PRG-RAM/EEPROM size
        array[11]= 0x00;  //CHR RAM size
        array[12]= 0x00;  //CPU/PPU Timing
        array[13]= 0x00;  //Vs System (not)
        array[14]= 0x00;  //Misc Roms (not)
        array[15]= 0x01;  //Default expansion device
        
        for(var b=16; b<this.size; b++){
            if(this.rom.seekReadBytes(b-16,1) == null)
                array[b] = 0xFF;
            else
                array[b] = this.rom.seekReadBytes(b-16,1);
        }
        this.rom=new MarcFile(array);
    }

    crc32() {
        return padZeroes(crc32(this.rom, 0), 4);
    }

    arrayToRaw(array) {
        var rom;
        for(var i=0;i<array.length;i++)
            rom = rom + "" + array[i];
        return rom;
    }
}