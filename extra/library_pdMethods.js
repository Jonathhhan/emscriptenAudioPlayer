function loadAudio() { 

var offlineCtx = new OfflineAudioContext(2,44100,44100);
var input = document.createElement('input');
input.type = 'file';

input.onchange = e => { 

   // getting a hold of the file reference
   var file = e.target.files[0]; 

   // setting up the reader
   var reader = new FileReader();
   reader.readAsArrayBuffer(file);

   // here we tell the reader what to do when it's done reading...
   reader.onload = readerEvent => {
    var arrayBuffer = reader.result;
    offlineCtx.decodeAudioData(arrayBuffer, decodedDone);
    }
function decodedDone(decoded) {
 Module.audioInLeft(decoded.getChannelData(0));
 Module.audioInRight(decoded.getChannelData(1));
  }
}
input.click();
  }
