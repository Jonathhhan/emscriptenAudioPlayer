var LibraryHTML5Audio = {
    $AUDIO: {
    	contexts: [],
    	ffts: [],
    	lastContextID: 0,

    	soundBuffers: [],
    	soundSources: [],
    	soundStartTimes: [],
    	soundGains: [],
    	lastSoundID: 0,

    	streams: [],
    	mediaElements: [],
    	lastStreamID: 0,

    	soundPosition: function(sound_id){
    		var source = AUDIO.soundSources[sound_id];
        	if(source!=undefined){
        		var context = source.context;
        		var playTime = context.currentTime - source.startTime;
        		var duration = AUDIO.soundBuffers[sound_id].duration / AUDIO.soundSources[sound_id].playbackRate.value;
        		return Math.min(duration,playTime);
        	}else{
        		return 0;
        	}
    	}
    },

    html5audio_context_create: function(){
    	try {
			// Fix up for prefixing
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			var context = new AudioContext({sampleRate: 44100});

			// Fix issue with chrome autoplay policy
			document.addEventListener('mousedown', function cb(event) {
				context.resume();
				event.currentTarget.removeEventListener(event.type, cb);
			});

			var id = AUDIO.lastContextID++;
			AUDIO.contexts[id] = context;
			var fft = context.createAnalyser();
			fft.smoothingTimeConstant = 0;
			fft.connect(AUDIO.contexts[id].destination);
			fft.maxDecibels = 0;
			fft.minDecibels = -100;
			AUDIO.ffts[id] = fft;
			return id;
    	} catch(e) {
    		console.log('Web Audio API is not supported in this browser',e);
    		return -1;
    	}
    },

    html5audio_context_start: function(context_id){
    	AUDIO.contexts[context_id].resume();
    },

    html5audio_context_stop: function(context_id){
    	AUDIO.contexts[context_id].suspend();
    },

    html5audio_context_spectrum: function(context_id, bands, spectrum){
    	AUDIO.ffts[context_id].fftSize = bands*2;
    	var spectrumArray = Module.HEAPF32.subarray(spectrum>>2, (spectrum>>2)+bands);
    	AUDIO.ffts[context_id].getFloatFrequencyData(spectrumArray);
    },

    html5audio_context_samplerate: function(context_id){
    	return AUDIO.contexts[context_id].sampleRate.value;
    },

    html5audio_sound_load: function(context_id, url){
		var request = new XMLHttpRequest();
		request.open('GET', UTF8ToString(url), true);
		request.responseType = 'arraybuffer';

		var id = AUDIO.lastSoundID++;
		AUDIO.soundGains[id] = AUDIO.contexts[context_id].createGain();
		AUDIO.soundGains[id].connect(workletNode);

		// Decode asynchronously
		request.onload = function() {
			AUDIO.contexts[context_id].decodeAudioData(request.response,
				function(buffer) {
					AUDIO.soundBuffers[id] = buffer;
				},
				function(e){
					console.log("couldn't decode sound " + id, e);
				}
			);
    	};
    	request.send();
    	return id;
    },

    html5audio_sound_play: function(context_id, sound_id, offset){
    	if(AUDIO.soundBuffers[sound_id]!=undefined){
    		if(AUDIO.contexts[context_id]!=undefined && AUDIO.contexts[context_id].paused){
    			AUDIO.contexts[context_id].paused = false;
    			AUDIO.contexts[context_id].start(offset);
    		}else{
		    	var source = AUDIO.contexts[context_id].createBufferSource();
		    	source.buffer = AUDIO.soundBuffers[sound_id];
		    	source.connect(AUDIO.soundGains[sound_id]);
		    	source.name = sound_id;
		    	source.done = false;
		    	source.paused = false;
		    	source.onended = function(event){
		    		event.target.done = true;
		    	}
		    	AUDIO.soundSources[sound_id] = source;
		    	source.startTime = AUDIO.contexts[context_id].currentTime - offset;
	    		source.start(offset);
    		}
    	}
    },

    html5audio_sound_stop: function(sound_id){
    	AUDIO.soundSources[sound_id].stop();
    },

    html5audio_sound_pause: function(sound_id){
    	AUDIO.soundSources[sound_id].stop();
    	AUDIO.soundSources[sound_id].paused = true;
    },

    html5audio_sound_rate: function(sound_id){
    	if(AUDIO.soundSources[sound_id]!=undefined){
    		return AUDIO.soundSources[sound_id].playbackRate.value;
    	}
    },

    html5audio_sound_set_rate: function(sound_id,rate){
    	var source = AUDIO.soundSources[sound_id];
    	if(source!=undefined){
    		var offset = AUDIO.soundPosition(sound_id);
    		source.startTime = source.context.currentTime - offset;
    		AUDIO.soundSources[sound_id].playbackRate.value = rate;
    	}
    },

    html5audio_sound_done: function(sound_id){
    	if(AUDIO.soundSources[sound_id]!=undefined){
    		return AUDIO.soundSources[sound_id].done;
    	}else{
    		return false;
    	}
    },

    html5audio_sound_duration: function(sound_id){
    	if(AUDIO.soundBuffers[sound_id]!=undefined){
    		return AUDIO.soundBuffers[sound_id].duration;
    	}else{
    		return 0;
    	}
    },

	html5audio_sound_position: function(sound_id){
		return AUDIO.soundPosition(sound_id);
	},

	html5audio_sound_set_loop: function(sound_id, loop){
		AUDIO.soundSources[sound_id].loop = loop;
	},

	html5audio_sound_set_gain: function(sound_id, gain){
		AUDIO.soundGains[sound_id].gain = gain;
	},

	html5audio_sound_gain: function(sound_id){
		return AUDIO.soundGains[sound_id].gain;
	},

	html5audio_sound_free: function(sound_id){
		return AUDIO.soundBuffers[sound_id] = null;
		return AUDIO.soundSources[sound_id] = null;
		return AUDIO.soundStartTimes[sound_id] = 0;
		return AUDIO.soundGains[sound_id] = null;
	},

	html5audio_stream_create: function(context_id, bufferSize, inputChannels, outputChannels, inbuffer, outbuffer, callback, userData, pthreadPtr){
        var stream_id = AUDIO.lastStreamID++;
	out("Buffer size: " + bufferSize);
	PThread.initAudioWorkletPThread(AUDIO.contexts[context_id], pthreadPtr).then(function() {
		out("Audio worklet PThread context initialized!")
	}, function(err) {
		out("Audio worklet PThread context initialization failed: " + [err, err.stack])
	});
	PThread.createAudioWorkletNode(AUDIO.contexts[context_id], "native-passthrough-processor", {
		numberOfInputs: 1,
		numberOfOutputs: 1,
		inputChannelCount: [2],
		outputChannelCount: [2],
		processorOptions: {
		inputChannels: inputChannels,
		outputChannels: outputChannels,
		inbuffer: inbuffer,
		outbuffer: outbuffer,
		bufferSize: bufferSize,
		callback: callback,
		userData: userData
	}
	}).then(function(workletNode) {
	var audioWorklet = workletNode;
	if (typeof video != "undefined"){
	var source = AUDIO.contexts[context_id].createMediaElementSource(video);
	source.connect(audioWorklet);
	}
	out("Audio worklet node created! Tap/click on the window if you don't hear audio!");
	workletNode.connect(AUDIO.ffts[context_id]);
			if(inputChannels>0){
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
			if(navigator.getUserMedia){
				navigator.getUserMedia(
					{audio: true},
					function(audioIn) {
						var mediaElement = AUDIO.contexts[context_id].createMediaStreamSource(audioIn);
						mediaElement.connect(audioWorklet);
						AUDIO.mediaElements[stream_id] = mediaElement;
					},
					function(error){
						console.log("error creating audio in",error);
					}
				);
			}
		}
	}, function(err) {
		out("Audio worklet node creation failed: " + [err, err.stack])
	})
	window.ondragover = function(e) {
		e.preventDefault();
		e.stopImmediatePropagation()
	}
	window.ondrop = function(e) {
		e.preventDefault();
		e.stopImmediatePropagation();
		console.log("Reading...");
		var length = e.dataTransfer.items.length;
		if (length > 1) {
		console.log("Please only drop 1 file.")
		} else {
		upload(e.dataTransfer.files[0])
		}
	}
	function upload(file) {
		if (file.type.match(/audio\/*/)) {
			var request = new XMLHttpRequest;
			request.open("GET", URL.createObjectURL(file), true);
			request.responseType = "arraybuffer";
			request.onload = function() {
				AUDIO.contexts[context_id].decodeAudioData(request.response).then(function(buffer) {
					if (typeof sound_id !== "undefined") {
						AUDIO.soundGains[sound_id].disconnect();
					}
					var sound_id = AUDIO.lastSoundID++;
					AUDIO.soundGains[sound_id] = AUDIO.contexts[context_id].createGain();
					AUDIO.soundGains[sound_id].connect(audioWorklet);
					AUDIO.soundBuffers[sound_id] = buffer;
					var source = AUDIO.contexts[context_id].createBufferSource();
					source.buffer = AUDIO.soundBuffers[sound_id];
					source.connect(AUDIO.soundGains[sound_id]);
					source.name = sound_id;
					source.done = false;
					source.paused = false;
					source.loop = true;
					source.onended = function(event) {
					event.target.done = true
					}
					AUDIO.soundSources[sound_id] = source;
					source.startTime = AUDIO.contexts[context_id].currentTime - 0;
					source.start(0);
					return sound_id
				}, function(e) {
					console.log("couldn't decode sound " + context_id, e)
				})
			}
		request.send();
		console.log("This file seems to be an audio file.");
		} else {
			console.log("This file does not seem to be an audio file.");
		}
	}
	return stream_id;
	},

	html5audio_stream_free: function(stream_id){
		return AUDIO.streams[stream_id] = null;
		return AUDIO.mediaElements[stream_id] = null;
	},

	html5audio_sound_is_loaded: function(sound){
		if(sound!=-1 && AUDIO.soundBuffers[sound] != undefined){
			return true;
		}
	return false;
	}
}


autoAddDeps(LibraryHTML5Audio, '$AUDIO');
mergeInto(LibraryManager.library, LibraryHTML5Audio);

