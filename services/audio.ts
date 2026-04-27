import { Audio } from 'expo-av';

let currentRecording: Audio.Recording | null = null;
let isBusy = false;

export const AudioService = {
  async startRecording() {
    if (isBusy || currentRecording) {
      console.log("[AudioService] Already recording or busy.");
      return null;
    }

    try {
      isBusy = true;
      
      // Aggressive reset
      if (currentRecording) {
        try { await currentRecording.stopAndUnloadAsync(); } catch (e) {}
        currentRecording = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldRouteAudioToReceiverIOS: false,
        interruptionModeIOS: 1, // DoNotMix
        playThroughEarpieceAndroid: false,
        interruptionModeAndroid: 1, // DoNotMix
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      currentRecording = recording;
      return recording;
    } catch (error) {
      console.error("[AudioService] Start Error:", error);
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch(e) {}
      currentRecording = null;
      throw error;
    } finally {
      isBusy = false;
    }
  },

  async stopRecording() {
    if (isBusy || !currentRecording) return null;

    try {
      isBusy = true;
      const rec = currentRecording;
      currentRecording = null;

      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      return uri;
    } catch (error) {
      console.error("[AudioService] Stop Error:", error);
      currentRecording = null;
      throw error;
    } finally {
      isBusy = false;
    }
  },

  async hardReset() {
    console.log("[AudioService] Performing Hard Reset...");
    isBusy = true;
    try {
      if (currentRecording) {
        try { await currentRecording.stopAndUnloadAsync(); } catch (e) {}
        currentRecording = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (e) {
      console.error("[AudioService] Reset Error:", e);
    } finally {
      isBusy = false;
    }
  },

  isRecording() {
    return !!currentRecording;
  },

  isBusy() {
    return isBusy;
  }
};
