/**
 * Optional send-side Web Audio processing between getUserMedia and RTCRtpSender.
 * Modes: off (passthrough), light (high-pass + compressor), rnnoise (light + worklet pilot).
 */

import coreSDKLogger from './coreSDKLogger.js';

const logger = coreSDKLogger;

const activePipelines = new WeakMap();

const RNNOISE_WORKLET_CODE = `
class RnnoisePilotProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._gateOpen = false;
    this._smoothedRms = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }
    const inCh = input[0];
    const outCh = output[0];
    let sumSq = 0;
    for (let i = 0; i < inCh.length; i++) {
      sumSq += inCh[i] * inCh[i];
    }
    const rms = Math.sqrt(sumSq / inCh.length);
    this._smoothedRms = this._smoothedRms * 0.9 + rms * 0.1;
    const openThreshold = 0.008;
    const closeThreshold = 0.004;
    if (this._smoothedRms > openThreshold) {
      this._gateOpen = true;
    } else if (this._smoothedRms < closeThreshold) {
      this._gateOpen = false;
    }
    const gain = this._gateOpen ? 1 : 0.15;
    for (let i = 0; i < inCh.length; i++) {
      outCh[i] = inCh[i] * gain;
    }
    return true;
  }
}
registerProcessor('rnnoise-pilot-processor', RnnoisePilotProcessor);
`;

let rnnoiseWorkletLoaded = false;

async function ensureRnnoiseWorklet(audioCtx) {
	if (rnnoiseWorkletLoaded) {
		return true;
	}
	try {
		const blob = new Blob([RNNOISE_WORKLET_CODE], { type: 'application/javascript' });
		const url = URL.createObjectURL(blob);
		await audioCtx.audioWorklet.addModule(url);
		URL.revokeObjectURL(url);
		rnnoiseWorkletLoaded = true;
		return true;
	} catch (error) {
		logger.log('audioProcessingPipeline: rnnoise worklet load failed', error?.message);
		return false;
	}
}

function teardownPipeline(rawStream) {
	const pipeline = activePipelines.get(rawStream);
	if (!pipeline) {
		return;
	}
	try {
		pipeline.source?.disconnect();
		pipeline.nodes?.forEach((node) => node.disconnect());
		pipeline.destination?.disconnect();
	} catch (_e) {
		// ignore disconnect errors during teardown
	}
	activePipelines.delete(rawStream);
}

/**
 * @param {MediaStream} rawStream - stream from getUserMedia
 * @param {{ enabled?: boolean, mode?: string }} config
 * @param {AudioContext} webAudioCtx
 * @returns {Promise<MediaStream>}
 */
export async function createProcessedStream(rawStream, config, webAudioCtx) {
	if (!rawStream || !config?.enabled || !config.mode || config.mode === 'off') {
		return rawStream;
	}
	if (!webAudioCtx) {
		logger.log('audioProcessingPipeline: no AudioContext, returning raw stream');
		return rawStream;
	}

	teardownPipeline(rawStream);

	if (webAudioCtx.state === 'suspended') {
		try {
			await webAudioCtx.resume();
		} catch (error) {
			logger.log('audioProcessingPipeline: AudioContext resume failed', error?.message);
		}
	}

	const source = webAudioCtx.createMediaStreamSource(rawStream);
	const destination = webAudioCtx.createMediaStreamDestination();
	const nodes = [];

	const highPass = webAudioCtx.createBiquadFilter();
	highPass.type = 'highpass';
	highPass.frequency.value = 100;
	highPass.Q.value = 0.7;
	nodes.push(highPass);

	const compressor = webAudioCtx.createDynamicsCompressor();
	compressor.threshold.value = -24;
	compressor.knee.value = 12;
	compressor.ratio.value = 3;
	compressor.attack.value = 0.003;
	compressor.release.value = 0.25;
	nodes.push(compressor);

	let lastNode = source;
	lastNode.connect(highPass);
	lastNode = highPass;
	lastNode.connect(compressor);
	lastNode = compressor;

	if (config.mode === 'rnnoise') {
		const workletReady = await ensureRnnoiseWorklet(webAudioCtx);
		if (workletReady) {
			try {
				const rnnoiseNode = new AudioWorkletNode(webAudioCtx, 'rnnoise-pilot-processor');
				nodes.push(rnnoiseNode);
				lastNode.connect(rnnoiseNode);
				lastNode = rnnoiseNode;
				logger.log('audioProcessingPipeline: rnnoise pilot worklet active (RMS gate; replace with WASM for production)');
			} catch (error) {
				logger.log('audioProcessingPipeline: rnnoise node failed, using light mode only', error?.message);
			}
		}
	}

	lastNode.connect(destination);

	activePipelines.set(rawStream, { source, nodes, destination });

	const processed = destination.stream;
	processed.getAudioTracks().forEach((track) => {
		track.addEventListener('ended', () => teardownPipeline(rawStream));
	});

	return processed;
}

export function stopProcessedStream(rawStream) {
	teardownPipeline(rawStream);
}
