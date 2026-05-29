/**
 * Shared getUserMedia audio constraints for all mic acquisition paths.
 */

export function buildAudioMediaConstraints(processingOptions, deviceId) {
	const {
		noiseSuppression = false,
		echoCancellation = true,
		autoGainControl = true,
	} = processingOptions || {};

	const audio = {
		noiseSuppression,
		echoCancellation,
		autoGainControl,
	};

	if (deviceId && deviceId !== 'default') {
		audio.deviceId = { exact: deviceId };
	}

	return { audio, video: false };
}

export const DEFAULT_AUDIO_PROCESSING = {
	noiseSuppression: false,
	echoCancellation: true,
	autoGainControl: true,
};
