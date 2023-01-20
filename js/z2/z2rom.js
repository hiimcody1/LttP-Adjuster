class Z2Rom {
    rom;
    header = 0x10;
    size = 0x3c000;
    crc = {
        trimmed: '8b5a9d69',
        headerClean: '1120a180',
        headerDirty: 'a7090f55',
    }

    startByteValue = 0x21;
    shieldSpellLoc = 0xe9e;
    shieldSpellValue = 0x16;
    endByteLoc = 0x2bfff;
    endByteValue = 0xff;

    constructor(rawRom) {
        var array = new Uint8Array(rawRom.length);
        for(var k=0; k<rawRom.length; k++){
            array[k] = rawRom.charCodeAt(k);
        }
        this.rom = new MarcFile(array);
    }

    cleanRom() {
        console.log("Current CRC before stripping header: " + this.crc32());
        var header = this.rom.seekReadBytes(0,3);
        console.log(String.fromCharCode(header[0])+String.fromCharCode(header[1])+String.fromCharCode(header[2]));
        this.stripHeader();
        console.log("Checking CRC...");
        switch(this.crc32()) {
            case this.crc.trimmed:
                console.log("Found clean CRC for a trimmed rom, inject header...");
                //Clean rom, we can build a new header now
                this.injectHeader();
                if(this.crc32() == this.crc.headerClean) {
                    console.log("Success, this rom can be randomized!");
                    return this.rom;
                }
            default:
                //Bad Rom
                console.log("Bad CRC, what went wrong?" + this.crc32());
                return false;
        }
    }

    hasHeader() {
        var header = this.rom.seekReadBytes(0,3);
        return (header[0] == 0x4E) && (header[1] == 0x45) && (header[2] == 0x53);
    }

    stripHeader() {
        if(this.hasHeader()) {
            console.log("Rom has header, stripping...");
            var array = new Uint8Array(this.size);
            for(var i=0;i<this.size;i++)
                array[i] = this.rom.seekReadBytes(16+i,1);
            console.log("Done!");
            this.rom = new MarcFile(array);
        }
    }

    injectHeader() {
        var array = new Uint8Array(this.size+16);
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
        
        for(var b=16; b<this.size+16; b++){
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