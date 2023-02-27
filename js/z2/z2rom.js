class Z2Rom {
    static memory = {
        "beep": {
            0xEA: [0x1d4e4],
            0x38: [0x1d4e5]
        },
        "music": {
            0x00: [
                0x1a02f,
                0x1a032,
                0x1a033,
                0x1a034,

                0x1a3f4,
                0x1a3f7,
                0x1a3f8,
                0x1a3f9,

                0x1a66e,
                0x1a671,
                0x1a672,
                0x1a673,

                0x1a970,
                0x1a973,
                0x1a974,
                0x1a975
            ],
            0x08: [
                0x1a010,
                0x1a011,
                0x1a012,
                0x1a013,
                
                0x1a3da,
                0x1a3db,
                0x1a3dc,
                0x1a3dd,
    
                0x1a63f,
                0x1a640,
                0x1a641,
                0x1a642,
    
                0x1a946,
                0x1a947,
                0x1a94c
            ],
            0x44: [
                0x1a030,
                0x1a3f5,
                0x1a66f,
                0x1a971
            ],
            0xA3: [
                0x1a031,
                0x1a3f6,
                0x1a670,
                0x1a972
            ]
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
        },
        "tunicColorSingles": [0x2a0a, 0x2a10, 0x2a16],
        "tunicColor": [0x285b, 0x40b0, 0x40c0, 0x40d0, 0x80e0, 0x80b0, 0x80c0, 0x80d0, 0x80e0, 0xc0b0, 0xc0c0, 0xc0d0, 0xc0e0, 0x100b0, 0x100c0, 0x100d0, 0x100e0, 0x140b0, 0x140c0, 0x140d0, 0x140e0, 0x17c1a, 0x1c465, 0x1c47d],
        "shieldColor": [0xe9e],
    }

    static palettes = {
        //NES: R,G,B,A
        0x00: [89,89,95,255],
        0x01: [0,0,143,255],
        0x02: [24,0,143,255],
        0x03: [63,0,119,255],
        0x04: [85,0,85,255],
        0x05: [85,0,17,255],
        0x06: [85,0,0,255],
        0x07: [68,34,0,255],
        0x08: [51,51,0,255],
        0x09: [17,51,0,255],
        0x0a: [0,51,17,255],
        0x0b: [0,68,68,255],
        0x0c: [0,68,102,255],
        0x0d: [0,0,0,255],
        0x0e: [8,8,8,255],
        0x0f: [8,8,8,255],
        0x10: [170,170,170,255],
        0x11: [0,68,221,255],
        0x12: [85,17,238,255],
        0x13: [119,0,238,255],
        0x14: [153,0,187,255],
        0x15: [170,0,85,255],
        0x16: [153,51,0,255],
        0x17: [136,68,0,255],
        0x18: [102,102,0,255],
        0x19: [51,102,0,255],
        0x1a: [0,102,0,255],
        0x1b: [0,102,85,255],
        0x1c: [0,85,136,255],
        0x1d: [8,8,8,255],
        0x1e: [8,8,8,255],
        0x1f: [8,8,8,255],
        0x20: [238,238,238,255],
        0x21: [68,136,255,255],
        0x22: [119,119,255,255],
        0x23: [153,68,255,255],
        0x24: [187,68,238,255],
        0x25: [204,85,153,255],
        0x26: [221,102,68,255],
        0x27: [204,136,0,255],
        0x28: [187,170,0,255],
        0x29: [119,187,0,255],
        0x2a: [34,187,34,255],
        0x2b: [34,187,119,255],
        0x2c: [34,187,204,255],
        0x2d: [68,68,68,255],
        0x2e: [8,8,8,255],
        0x2f: [8,8,8,255],
        0x30: [238,238,238,255],
        0x31: [153,204,255,255],
        0x32: [170,170,255,255],
        0x33: [187,153,255,255],
        0x34: [221,153,255,255],
        0x35: [238,153,221,255],
        0x36: [238,170,170,255],
        0x37: [238,187,153,255],
        0x38: [238,221,136,255],
        0x39: [187,221,136,255],
        0x3a: [153,221,153,255],
        0x3b: [153,221,187,255],
        0x3c: [153,221,238,255]
    }

    rom;
    header = 0x10;
    //size = 0x3c000;
    size = 0x40010;
    dataSize = 0x39ff7;
    crc = {
        trimmed: '8b5a9d69',
        headerClean: 'd870601b',
        headerDirty: 'a7090f55',
        unheaderedClean: 'fae9c6c1'
    }

    startByteValue = 0x21;
    shieldSpellColorLoc = 0xe9e;
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
            } else {
                console.log("Unable to clean rom!");
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
        this.trim();
        switch(this.crc32()) {
            case this.crc.trimmed:
            case this.crc.unheaderedClean:
                //Clean rom, we can build a new header now
                this.injectHeaderAndPad();
                console.log("Clean rom, inject header and compare");
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
        } else {
            console.log("Rom has no header");
        }
    }

    trim() {
        var array = new Uint8Array(this.dataSize);
        for(var b=0; b<this.dataSize; b++){
            if(this.rom.seekReadBytes(b,1) == null)
                array[b] = 0xFF;
            else
                array[b] = this.rom.seekReadBytes(b,1);
        }
        for(var b=this.dataSize; b<this.size-16; b++){
            array[b] = 0xFF;
        }
        this.rom=new MarcFile(array);
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