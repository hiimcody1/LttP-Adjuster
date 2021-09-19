/* Rom Patcher JS v20201106 - Marc Robledo 2016-2020 - http://www.marcrobledo.com/license */
/* Modified into LttP Adjuster - Fabio Kubagawa */

/* service worker */
const FORCE_HTTPS=!location.href.startsWith('http://localhost:');
if(FORCE_HTTPS && location.protocol==='http:')
	location.href=window.location.href.replace('http:','https:');
else if(location.protocol==='https:' && 'serviceWorker' in navigator)
	navigator.serviceWorker.register('/LttP-Adjuster/_cache_service_worker.js', {scope: '/LttP-Adjuster/'});



var romFile, patchFile, patch, romFile1, jpCrc, tempFile, indexedDb;
var fetchedPatches;
var CAN_USE_WEB_WORKERS=false;
var webWorkerApply,webWorkerCrc;
try{
	webWorkerApply=new Worker('./js/worker_apply.js');
	webWorkerApply.onmessage = event => { // listen for events from the worker
		//retrieve arraybuffers back from webworker		
		romFile1._u8array=event.data.romFileU8Array;
		romFile1._dataView=new DataView(romFile._u8array.buffer);
		
		patchFile._u8array=event.data.patchFileU8Array;
		patchFile._dataView=new DataView(patchFile._u8array.buffer);
				
		if(event.data.patchedRomU8Array)
			preparePatchedRom(romFile, new MarcFile(event.data.patchedRomU8Array.buffer));

		setTabApplyEnabled(true);
		if(event.data.errorMessage)
			setMessage('apply', event.data.errorMessage.replace('Error: ',''), 'error');
		else
			setMessage('apply');
	};
	webWorkerApply.onerror = event => { // listen for events from the worker
		setTabApplyEnabled(true);
		setMessage('apply', event.message.replace('Error: ',''), 'error');
	};

	webWorkerCrc=new Worker('./js/worker_crc.js');
	webWorkerCrc.onmessage = event => { // listen for events from the worker
		//console.log('received_crc');
		setMessage('create','');
		jpCrc=padZeroes(event.data.crc32, 4);
		if (jpCrc!=='3322effc')
			setMessage('create','Invalid JP v1.0 ROM', 'error');
		else
			setTabCreateEnabled(true);
	};
	webWorkerCrc.onerror = event => { // listen for events from the worker
		setMessage('apply', event.message.replace('Error: ',''), 'error');
	};
}catch(e){
	CAN_USE_WEB_WORKERS=false;
}


/* Shortcuts */
function addEvent(e,ev,f){e.addEventListener(ev,f,false)}
function el(e){return document.getElementById(e)}



function fetchPatch(uri){
	setTabCreateEnabled(false);
	setMessage('create', 'Downloading...', 'loading');


	var isCompressed=/\#/.test(uri);
	var patchURI=decodeURI(uri.replace(/\#.*?$/, ''));
	//console.log(patchURI);
	var compressedName=uri.replace(/^.*?\#/,'');
	//console.log(compressedName);


	if(typeof window.fetch==='function'){
		fetch(patchURI)
			.then(result => result.arrayBuffer()) // Gets the response and returns it as a blob
			.then(arrayBuffer => {
				fetchedPatches[patchURI]=patchFile=new MarcFile(arrayBuffer);
				fetchedPatches[patchURI].fileName=patchURI.replace(/^(.*?\/)+/g, '');
				_readPatchFile();
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


/* initialize app */
addEvent(window,'load',function(){
	/* zip-js web worker */
	if(CAN_USE_WEB_WORKERS){
		zip.useWebWorkers=true;
		zip.workerScriptsPath='./js/zip.js/';
	}else{
		zip.useWebWorkers=false;

		var script=document.createElement('script');
		script.src='./js/zip.js/inflate.js';
		document.getElementsByTagName('head')[0].appendChild(script);
	}
	
	el('input-file-rom').value='';
	el('input-file-patch').value='';
	el('input-file-jp').value='';
	setTabApplyEnabled(true);

	addEvent(el('input-file-rom'), 'change', function(){
		romFile=new MarcFile(this);
		setTabApplyEnabled(true);		
	});


	/* dirty fix for mobile Safari https://stackoverflow.com/a/19323498 */
	if(/Mobile\/\S+ Safari/.test(navigator.userAgent)){
		el('input-file-patch').accept='';
	}



	/* predefined patches */
	if(typeof PREDEFINED_PATCHES!=='undefined'){
		fetchedPatches={};

		var container=el('input-file-patch').parentElement;
		container.removeChild(el('input-file-patch'));

		var select=document.createElement('select');
		select.id='input-file-patch';
		for(var i=0; i<PREDEFINED_PATCHES.length; i++){
			var option=document.createElement('option');
			option.value=PREDEFINED_PATCHES[i].patch;
			option.innerHTML=PREDEFINED_PATCHES[i].name;
			select.appendChild(option);
		}
		container.appendChild(select)
		container.parentElement.title='';

		addEvent(select,'change',function(){
			if(fetchedPatches[this.value.replace(/\#.*?$/, '')]){
				patchFile=fetchedPatches[this.value.replace(/\#.*?$/, '')];
				patchFile.seek(0);
				_readPatchFile();
			}else{
				patch=null;
				patchFile=null;
				fetchPatch(this.value);
			}
		});
		fetchPatch(select.value);
	}else{
		el('input-file-patch').value='';

		el('switch-container').style.visibility='visible';
		
		addEvent(el('input-file-patch'), 'change', function(){
			setTabCreateEnabled(false);
			patchFile=new MarcFile(this, _readPatchFile);
		});
	}

	el('input-file-jp').value='';
	addEvent(el('input-file-jp'), 'change', function(e){
		if (e.target.value){
			setTabCreateEnabled(false);
			romFile1=new MarcFile(this, function(){
				if(romFile1.fileSize%1024===512){
					romFile1=romFile1.slice(512);
				}
				verifyJpRom(romFile1,0);
			});
			
		}
	});

	var spriteSelect = el('select-sprite');
	var spriteSelect2 = el('select-sprite2');
	spriteDatabase.forEach(eachSprite => {
		spriteSelect.options.add(new Option(eachSprite.name, eachSprite.file));
		spriteSelect2.options.add(new Option(eachSprite.name, eachSprite.file));
	});

	indexedDb = new IndexedDb();
	
});

function verifyJpRom(file, startOffset){
	setTabCreateEnabled(false);
	if(CAN_USE_WEB_WORKERS){		
		webWorkerCrc.postMessage({u8array:file._u8array, startOffset:startOffset}, [file._u8array.buffer]);
	}else{
		setMessage('create','');
		window.setTimeout(()=>{
			jpCrc=padZeroes(crc32(file, startOffset), 4);
			if (jpCrc!=='3322effc')
				setMessage('create','Invalid JP v1.0 ROM', 'error');
			else
				setTabCreateEnabled(true);
		}, 30);
	}
}


function _readPatchFile(){
	setMessage('create','');
	setTabCreateEnabled(false);
	patchFile.littleEndian=false;

	var header=patchFile.readString(6);
	if(header.startsWith(ZIP_MAGIC)){
		if(typeof PREDEFINED_PATCHES !== 'undefined' && /\#/.test(el('input-file-patch').value)){
			parseZIPFile(patchFile, el('input-file-patch').value.replace(/^.*?\#/, ''));
		}else{
			parseZIPFile(patchFile);
		}
		patch=false;
		setTabCreateEnabled(false);
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

		window.setTimeout(()=>{setTabCreateEnabled(true);}, 30);
	}
}





function preparePatchedRom(originalRom, patchedRom){
	patchedRom.fileName=patchFile.fileName.replace(/\.([^\.]*?)$/, '.sfc');
	patchedRom.fileType=originalRom.fileType;

	// Adjust the ROM
	fetchSpriteData(patchedRom,indexedDb.obj.sprite,
		(rom,sprite) => {
				zeldaPatcher(rom,indexedDb.obj.beep,indexedDb.obj.color,
					indexedDb.obj.quickswap,indexedDb.obj.speed,!indexedDb.obj.music,
					indexedDb.obj.resume,indexedDb.obj.flashing,sprite,
					indexedDb.obj.owp,indexedDb.obj.uwp);
				setMessage('create');
				rom.save();
	});
}

function adjustPatch(romToAdjust){
	indexedDb.save('apply');
	romToAdjust.fileName=romToAdjust.fileName.replace(/\.([^\.]*?)$/, ' (adjusted).$1');	
	fetchSpriteData(romToAdjust,indexedDb.obj.sprite,
		(rom,sprite) => {
				zeldaPatcher(rom,indexedDb.obj.beep,indexedDb.obj.color,
					indexedDb.obj.quickswap,indexedDb.obj.speed,!indexedDb.obj.music,
					indexedDb.obj.resume,indexedDb.obj.flashing,sprite,
					indexedDb.obj.owp,indexedDb.obj.uwp);
				setMessage('apply');
				rom.save();
		});
}

function applyPatch(p,r){
	indexedDb.save('create');
	if(p && r){
		if(CAN_USE_WEB_WORKERS){
			setMessage('create', 'Applying patch...', 'loading');
			setTabApplyEnabled(false);

			webWorkerApply.postMessage(
				{
					romFileU8Array:r._u8array,
					patchFileU8Array:patchFile._u8array
				},[
					r._u8array.buffer,
					patchFile._u8array.buffer
				]
			);

		}else{
			setMessage('create', 'Applying patch...', 'loading');

			try{
				p.apply(r);
				preparePatchedRom(r, p.apply(r));

			}catch(e){
				setMessage('create', 'Error: '+e.message, 'error');
			}
		}

	}else{
		setMessage('create', 'No ROM/patch selected', 'error');
	}
}




/* GUI functions */
function setMessage(tab, msg, className){
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
function setTabCreateEnabled(status){
	if((patchFile || patch) && romFile1 && status && jpCrc==='3322effc'){
		setElementEnabled('button-create', status);
	}else{
		setElementEnabled('button-create', false);
	}
}
function setTabApplyEnabled(status){
	if(romFile && status){
		setElementEnabled('button-apply', status);
	}else{
		setElementEnabled('button-apply', false);
	}
}
function setCreatorMode(creatorMode){
	if(creatorMode){
		el('tab0').style.display='none';
		el('tab1').style.display='block';
		el('switch-create').className='switch enabled'
	}else{
		el('tab0').style.display='block';
		el('tab1').style.display='none';
		el('switch-create').className='switch disabled'
	}
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