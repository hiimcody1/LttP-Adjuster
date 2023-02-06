/* Rom Patcher JS v20201106 - Marc Robledo 2016-2020 - http://www.marcrobledo.com/license */
/* Modified into LttP Adjuster - Fabio Kubagawa */


var romFile, patchFile, patch, tempFile, indexedDb, spriteFile;

/* Shortcuts */
function addEvent(e,ev,f){e.addEventListener(ev,f,false)}
function el(e){return document.getElementById(e)}



function fetchPatch(uri){
	setTabCreateEnabled(false);
	setMessage('create', 'Downloading...', 'loading');


	var isCompressed=/\#/.test(uri);
	var patchURI=decodeURI(uri.replace(/\#.*?$/, ''));
	var compressedName=uri.replace(/^.*?\#/,'');


	if(typeof window.fetch==='function'){
		fetch(patchURI)
			.then(result => result.arrayBuffer()) // Gets the response and returns it as a blob
			.then(arrayBuffer => {
				fetchedPatches[patchURI]=patchFile=new MarcFile(arrayBuffer);
				fetchedPatches[patchURI].fileName=patchURI.replace(/^(.*?\/)+/g, '');
				_readPatchFile();
				el('row-input-file-patch').style.display = 'none';
			})
			.catch(function(evt){
				setMessage('create', 'Error downloading patch', 'error');
				//setMessage('create', evt.message, 'error');
			});
	}else{
		var xhr=new XMLHttpRequest();
		xhr.open('GET', patchURI, true);
		xhr.responseType='arraybuffer';

		xhr.onload=function(evt){
			if(this.status===200){
				fetchedPatches[patchURI]=patchFile=new MarcFile(xhr.response);
				fetchedPatches[patchURI].fileName=patchURI.replace(/^(.*?\/)+/g, '');
				_readPatchFile();
			}else{
				setMessage('create', 'Error downloading patch'+' ('+this.status+')', 'error');
			}
		};

		xhr.onerror=function(evt){
			setMessage('create', 'Error downloading patch', 'error');
		};

		xhr.send(null);
	}
}

function fetchJsonPatch(uri){
	var patchURI=decodeURI(uri.replace(/\#.*?$/, ''));

	if(typeof window.fetch==='function' || 9 == 8){
		fetch(patchURI)
			.then(result => result.json()) // Gets the response and returns it as a blob
			.then(json => {
				if(json.spoiler != null) {
					SeedMode = json.spoiler.meta.name;
				}
				jsonPatch = json.patch;
			})
			.catch(function(evt){
				setMessage('create', 'Error downloading JSON', 'error');
				setTabCreateEnabled(false);
			});
	}else{
		var xhr=new XMLHttpRequest();
		xhr.open('GET', patchURI, true);
		xhr.responseType='json';

		xhr.onload=function(evt){
			if(this.status===200){
				if(xhr.response.spoiler != null) {
					SeedMode = xhr.response.spoiler.meta.name;
				}
				jsonPatch = xhr.response.patch;
			}else{
				setMessage('create', 'Error downloading JSON', 'error');
				setTabCreateEnabled(false);
			}
		};

		xhr.onerror=function(evt){
			setMessage('create', 'Error downloading JSON', 'error');
			setTabCreateEnabled(false);
		};

		xhr.send(null);
	}
}


/* initialize app */
addEvent(window,'load',function(){
	zip.useWebWorkers=false;

	var script=document.createElement('script');
	script.src='/js/zip.js/inflate.js';
	document.getElementsByTagName('head')[0].appendChild(script);

	el('romfile').value='';
	addEvent(el('romfile'), 'change', function(e){
		if (e.target.value)
			romFile=new Z2Rom(this);
	});

	indexedDb = new IndexedDb();
	
});

function _readPatchFile(){
	//setMessage('create','');
	//setTabCreateEnabled(false);
	patchFile.littleEndian=false;

	var header=patchFile.readString(6);
	if(header.startsWith(ZIP_MAGIC)){
		if(typeof PREDEFINED_PATCHES !== 'undefined' && /\#/.test(el('input-file-patch').value)){
			parseZIPFile(patchFile, el('input-file-patch').value.replace(/^.*?\#/, ''));
		}else{
			parseZIPFile(patchFile);
		}
		patch=false;
		//setTabCreateEnabled(false);
	}else{
		if(header.startsWith(IPS_MAGIC)){
			patch=parseIPSFile(patchFile);
		}else if(header.startsWith(UPS_MAGIC)){
			patch=parseUPSFile(patchFile);
		}else if(header.startsWith(APS_MAGIC)){
			patch=parseAPSFile(patchFile);
		}else if(header.startsWith(BPS_MAGIC)){
			patch=parseBPSFile(patchFile);
		}else if(header.startsWith(RUP_MAGIC)){
			patch=parseRUPFile(patchFile);
		}else if(header.startsWith(PPF_MAGIC)){
			patch=parsePPFFile(patchFile);
		}else if(header.startsWith(PMSR_MAGIC)){
			patch=parseMODFile(patchFile);
		}else if(header.startsWith(VCDIFF_MAGIC)){
			patch=parseVCDIFF(patchFile);
		}else{
			patch=null;
			setMessage('create', 'Invalid patch file', 'error');
		}



		/*if(patch && typeof PREDEFINED_PATCHES!=='undefined' && PREDEFINED_PATCHES[el('input-file-patch').selectedIndex].crc){
			patch.validateSource=function(romFile, headerSize){
				return PREDEFINED_PATCHES[el('input-file-patch').selectedIndex].crc===crc32(romFile, headerSize)
			}
		}*/

		//window.setTimeout(()=>{setTabCreateEnabled(true);}, 30);
	}
}

function preparePatchedRom(originalRom, patchedRom){
	//patchedRom.fileName=patchFile.fileName.replace(/\.([^\.]*?)$/, '.sfc');
	patchedRom = z2Patcher(originalRom,patchedRom,!document.getElementById("enableHealthBeep").checked,!document.getElementById("enableMusic").checked,document.getElementById("useFastSpell").checked,document.getElementById("remapUpA").checked,document.getElementById("disableFlashing").checked,document.getElementById("sprite-list").value,document.getElementById("tunic-color-picker").value,document.getElementById("shield-color-picker").value,document.getElementById("beam-list").value);
	patchedRom.fileName=seedName;
	patchedRom.fileType=originalRom.fileType;
	patchedRom.save();
	indexedDb.save();
}

function applyPatch(p,r){
	if(p && r){
		setMessage('create', 'Applying patch...', 'loading');

		try{
			//p.apply(r);
			preparePatchedRom(r, p);

		}catch(e){
			setMessage('create', 'Error: '+e.message, 'error');
		}
	}else{
		setMessage('create', 'No ROM/patch selected', 'error');
	}
}


/* GUI functions */
function setMessage(tab, msg, className){
	console.log(msg);
	return;
	var messageBox=el('message-'+tab);
	if(msg){
		if(className==='loading'){
			messageBox.className='message';
			messageBox.innerHTML='<span class="loading"></span> '+msg;
		}else{
			messageBox.className='message '+className;
			if(className==='warning')
				messageBox.innerHTML='&#9888; '+msg;
			else if(className==='error')
				messageBox.innerHTML='&#10007; '+msg;
			else
				messageBox.innerHTML=msg;
		}
		messageBox.style.display='inline';
	}else{
		messageBox.style.display='none';
	}
}

function setElementEnabled(element,status){
	if(status){
		el(element).className='enabled';
	}else{
		el(element).className='disabled';
	}
	el(element).disabled=!status;
}

/* FileSaver.js (source: http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js)
 * A saveAs() FileSaver implementation.
 * 1.3.8
 * 2018-03-22 14:03:47
 *
 * By Eli Grey, https://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */
var saveAs=saveAs||function(c){"use strict";if(!(void 0===c||"undefined"!=typeof navigator&&/MSIE [1-9]\./.test(navigator.userAgent))){var t=c.document,f=function(){return c.URL||c.webkitURL||c},s=t.createElementNS("http://www.w3.org/1999/xhtml","a"),d="download"in s,u=/constructor/i.test(c.HTMLElement)||c.safari,l=/CriOS\/[\d]+/.test(navigator.userAgent),p=c.setImmediate||c.setTimeout,v=function(t){p(function(){throw t},0)},w=function(t){setTimeout(function(){"string"==typeof t?f().revokeObjectURL(t):t.remove()},4e4)},m=function(t){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type)?new Blob([String.fromCharCode(65279),t],{type:t.type}):t},r=function(t,n,e){e||(t=m(t));var r,o=this,a="application/octet-stream"===t.type,i=function(){!function(t,e,n){for(var r=(e=[].concat(e)).length;r--;){var o=t["on"+e[r]];if("function"==typeof o)try{o.call(t,n||t)}catch(t){v(t)}}}(o,"writestart progress write writeend".split(" "))};if(o.readyState=o.INIT,d)return r=f().createObjectURL(t),void p(function(){var t,e;s.href=r,s.download=n,t=s,e=new MouseEvent("click"),t.dispatchEvent(e),i(),w(r),o.readyState=o.DONE},0);!function(){if((l||a&&u)&&c.FileReader){var e=new FileReader;return e.onloadend=function(){var t=l?e.result:e.result.replace(/^data:[^;]*;/,"data:attachment/file;");c.open(t,"_blank")||(c.location.href=t),t=void 0,o.readyState=o.DONE,i()},e.readAsDataURL(t),o.readyState=o.INIT}r||(r=f().createObjectURL(t)),a?c.location.href=r:c.open(r,"_blank")||(c.location.href=r);o.readyState=o.DONE,i(),w(r)}()},e=r.prototype;return"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(t,e,n){return e=e||t.name||"download",n||(t=m(t)),navigator.msSaveOrOpenBlob(t,e)}:(e.abort=function(){},e.readyState=e.INIT=0,e.WRITING=1,e.DONE=2,e.error=e.onwritestart=e.onprogress=e.onwrite=e.onabort=e.onerror=e.onwriteend=null,function(t,e,n){return new r(t,e||t.name||"download",n)})}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this);