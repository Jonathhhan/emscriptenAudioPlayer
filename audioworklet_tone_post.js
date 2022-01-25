/**
 * This is the JS side of the AudioWorklet processing that creates our
 * AudioWorkletProcessor that fetches the audio data from native code and 
 * copies it into the output buffers.
 * 
 * This is intentionally not made part of Emscripten AudioWorklet integration
 * because apps will usually want to a lot of control here (formats, channels, 
 * additional processors etc.)
 */

// Register our audio processors if the code loads in an AudioWorkletGlobalScope
if (typeof AudioWorkletGlobalScope === "function") {
  // This processor node is a simple proxy to the audio generator in native code.
  // It calls the native function then copies the samples into the output buffer
  var counter = 0;
  var inputChannels = 0;
  var outputChannels = 0;
  var inbuffer = 0;
  var outbuffer = 0;
  var bufferSize = 0;
  var callback = 0;
  var userData = 0;
  class NativePassthroughProcessor extends AudioWorkletProcessor {
    constructor (options) {
    super()
    inputChannels = options.processorOptions.inputChannels;
    outputChannels = options.processorOptions.outputChannels;
    inbuffer = options.processorOptions.inbuffer;
    outbuffer = options.processorOptions.outbuffer;
    bufferSize = options.processorOptions.bufferSize;
    callback = options.processorOptions.callback;
    userData = options.processorOptions.userData;
  }
        process(inputs, outputs, parameters) {
            counter = currentFrame % 128;
            if (counter == 0) {
                dynCall("viiii", callback, [bufferSize, inputChannels, outputChannels, userData]);
                const input = inputs[0];
                const output = outputs[0];
                if (outputChannels > 0) {
                    for (let c = 0; c < outputChannels; ++c) {
                        var outChannel = output[c];
                        for (let i = 0, j = c; i < bufferSize; ++i,
                        j += outputChannels) {
                            outChannel[i] = Module.HEAPF32.subarray(outbuffer >> 2 + bufferSize * 2, (outbuffer >> 2) + bufferSize * outputChannels)[j]
                        }
                    }
                }
                if(inputChannels > 0){
                    for(let c = 0; c < input.length; ++c){
                        var inChannel = input[c];
                        for(let i = 0, j = c; i < bufferSize; ++i, j += inputChannels){
                            Module.HEAPF32.subarray(inbuffer >> 2, (inbuffer >> 2) + bufferSize * inputChannels)[j] = inChannel[i];
                        }
                    }
                }  
            }
            return true
        }
    }
  // Register the processor as per the audio worklet spec
  registerProcessor('native-passthrough-processor', NativePassthroughProcessor);
}

