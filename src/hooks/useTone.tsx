import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

type SampleName = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'rim' | 'cowbell' | 'cymbal';

interface UseToneOptions {
  onReady?: () => void;
}

export function useTone({ onReady }: UseToneOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [masterVolume, setMasterVolume] = useState(-15);
  const samplers = useRef<Record<SampleName, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth>>({} as any);
  const customSamplers = useRef<Record<number, Tone.Player>>({});
  const delays = useRef<Record<number, { delay: Tone.FeedbackDelay; channel: Tone.Channel; delayChannel: Tone.Channel }>>({});
  const masterCompressor = useRef<Tone.Compressor>();

  // Initialize Tone.js context and set initial volume
  useEffect(() => {
    // Create master compressor with subtle settings
    masterCompressor.current = new Tone.Compressor({
      threshold: -24,    // Start compressing at -24dB
      ratio: 2.5,       // Gentle compression ratio
      attack: 0.003,    // Fast attack to catch transients
      release: 0.25,    // Medium release to maintain groove
      knee: 12          // Soft knee for smooth compression
    }).toDestination();

    // Set initial master volume through a gain node
    const masterGain = new Tone.Gain(Tone.dbToGain(masterVolume)).connect(masterCompressor.current);
    masterCompressor.current.connect(Tone.Destination);

    if (Tone.context.state === 'suspended') {
      const handleInteraction = async () => {
        await Tone.start();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      };
      
      document.addEventListener('click', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
      
      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      };
    }
  }, []);

  // Initialize samplers
  useEffect(() => {
    const samples: Record<SampleName, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth> = {
      'kick': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      }).connect(masterCompressor.current!),
      'snare': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0
        }
      }).connect(masterCompressor.current!),
      'hihat': new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.01
        }
      }).connect(masterCompressor.current!),
      'clap': new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: {
          attack: 0.001,
          decay: 0.3,
          sustain: 0
        }
      }).connect(masterCompressor.current!),
      'tom': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      }).connect(masterCompressor.current!),
      'rim': new Tone.MetalSynth({
        harmonicity: 3.1,
        modulationIndex: 16,
        resonance: 8000,
        octaves: 0.5,
        envelope: {
          attack: 0.001,
          decay: 0.05,
          release: 0.01
        }
      }).connect(masterCompressor.current!),
      'cowbell': new Tone.MetalSynth({
        harmonicity: 4.1,
        modulationIndex: 8,
        resonance: 2000,
        octaves: 0.7,
        envelope: {
          attack: 0.001,
          decay: 0.4,
          release: 0.01
        }
      }).connect(masterCompressor.current!),
      'cymbal': new Tone.MetalSynth({
        harmonicity: 8,
        modulationIndex: 40,
        resonance: 500,
        octaves: 2,
        envelope: {
          attack: 0.001,
          decay: 1,
          release: 0.3
        }
      }).connect(masterCompressor.current!)
    };
    
    samplers.current = samples;
    setIsLoaded(true);
    
    if (onReady) {
      onReady();
    }
    
    return () => {
      Object.values(samples).forEach(sampler => sampler.dispose());
      Object.values(delays.current).forEach(setup => {
        setup.delay.dispose();
        setup.channel.dispose();
        setup.delayChannel.dispose();
      });
      masterCompressor.current?.dispose();
    };
  }, [onReady]);

  // Update the master volume when it changes
  useEffect(() => {
    if (masterCompressor.current) {
      Tone.Destination.volume.value = masterVolume;
      console.log('Master volume set to:', masterVolume, 'dB');
    }
  }, [masterVolume]);

  const getOrCreateDelay = (trackId: number, delayTime: number, feedback: number, mix: number) => {
    if (!delays.current[trackId]) {
      // Create a parallel signal chain
      const channel = new Tone.Channel().connect(masterCompressor.current!);
      const delayChannel = new Tone.Channel({ volume: 0 }).connect(masterCompressor.current!);
      
      const delay = new Tone.FeedbackDelay({
        delayTime: Math.min(delayTime, 1), // Cap at 1 second for stability
        feedback,
        wet: 1, // Always full wet for delay channel
      }).connect(delayChannel);
      
      // Store both channels and delay
      delays.current[trackId] = {
        delay,
        channel,
        delayChannel,
      };
      
      // Set the mix through channel volumes
      channel.volume.value = Tone.gainToDb(1 - mix); // Dry signal
      delayChannel.volume.value = Tone.gainToDb(mix); // Wet signal
      
      return delays.current[trackId];
    }
    
    const setup = delays.current[trackId];
    setup.delay.delayTime.value = Math.min(delayTime, 1);
    setup.delay.feedback.value = feedback;
    
    // Update mix through channel volumes
    setup.channel.volume.value = Tone.gainToDb(1 - mix);
    setup.delayChannel.volume.value = Tone.gainToDb(mix);
    
    return setup;
  };

  // Function to load and create a custom sampler
  const createCustomSampler = async (trackId: number, buffer: AudioBuffer) => {
    // Dispose of existing sampler if it exists
    if (customSamplers.current[trackId]) {
      customSamplers.current[trackId].dispose();
    }

    // Create new player with the buffer
    const player = new Tone.Player({
      url: buffer,
      loop: false,
    }).connect(masterCompressor.current!);

    // Store the player
    customSamplers.current[trackId] = player;
    
    return player;
  };

  // Function to load an audio file
  const loadSample = async (file: File): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const playSound = (
    sampleName: SampleName,
    duration: number = 0.5,
    volume: number = -10,
    pitch: number = 0,
    trackId?: number,
    delayOptions?: {
      enabled: boolean;
      time: number;
      feedback: number;
      mix: number;
    },
    customSample?: {
      buffer: AudioBuffer;
      originalPitch: number;
    }
  ) => {
    if (!customSample && !samplers.current[sampleName]) return;

    if (customSample) {
      // Handle custom sample playback
      let player = customSamplers.current[trackId!];
      if (!player || player.buffer.get() !== customSample.buffer) {
        // Create new player if needed
        createCustomSampler(trackId!, customSample.buffer);
        player = customSamplers.current[trackId!];
      }

      // Set up the player
      player.playbackRate = Math.pow(2, (pitch) / 12); // Adjust pitch
      player.volume.value = volume;

      // Disconnect from previous destinations
      player.disconnect();

      // Set up delay if enabled
      if (delayOptions?.enabled && trackId !== undefined) {
        const setup = getOrCreateDelay(
          trackId,
          delayOptions.time,
          delayOptions.feedback,
          delayOptions.mix
        );
        
        // Connect player to both channels for parallel processing
        player.connect(setup.channel); // Dry signal
        player.connect(setup.delay);   // Wet signal
      } else {
        player.connect(masterCompressor.current!);
      }

      // Start playback from beginning
      player.start();
    } else {
      // Handle built-in synth playback (existing code)
      const synth = samplers.current[sampleName];
      synth.disconnect();
      
      if (delayOptions?.enabled && trackId !== undefined) {
        const setup = getOrCreateDelay(
          trackId,
          delayOptions.time,
          delayOptions.feedback,
          delayOptions.mix
        );
        
        synth.connect(setup.channel);
        synth.connect(setup.delay);
      } else {
        synth.connect(masterCompressor.current!);
      }
      
      // For longer delay times, schedule multiple delayed triggers
      if (delayOptions?.enabled && delayOptions.time > 1) {
        const numRepeats = Math.floor(delayOptions.time);
        const baseVolume = volume + Tone.gainToDb(delayOptions.mix);
        
        for (let i = 1; i <= numRepeats; i++) {
          const delayedVolume = baseVolume + Tone.gainToDb(Math.pow(delayOptions.feedback, i));
          setTimeout(() => {
            if (synth instanceof Tone.MembraneSynth) {
              const baseNote = sampleName === 'kick' ? 32.70 : 65.41;
              synth.triggerAttackRelease(baseNote * Math.pow(2, pitch / 12), duration, `+${i}`, delayedVolume);
            } else if (synth instanceof Tone.MetalSynth) {
              synth.triggerAttackRelease('16n', `+${i}`, delayedVolume);
            } else if (synth instanceof Tone.NoiseSynth) {
              synth.triggerAttackRelease('16n', `+${i}`, delayedVolume);
            }
          }, i * 1000);
        }
      }
      
      synth.volume.value = volume;
      
      const pitchMultiplier = Math.pow(2, pitch / 12);
      
      if (synth instanceof Tone.MembraneSynth) {
        const baseNote = sampleName === 'kick' ? 32.70 : 65.41;
        synth.frequency.value = baseNote * pitchMultiplier;
        synth.triggerAttackRelease(baseNote * pitchMultiplier, duration);
      } else if (synth instanceof Tone.MetalSynth) {
        const baseFreqs = {
          'hihat': 4000,
          'rim': 8000,
          'cowbell': 2000,
          'cymbal': 500
        };
        const baseFreq = baseFreqs[sampleName] || 200;
        synth.frequency.value = baseFreq * pitchMultiplier;
        synth.harmonicity = 3 + (pitch / 12);
        synth.triggerAttackRelease('16n', duration);
      } else if (synth instanceof Tone.NoiseSynth) {
        const adjustedDuration = duration / pitchMultiplier;
        synth.envelope.decay = adjustedDuration;
        synth.triggerAttackRelease('16n');
      } else {
        const baseFreq = 130.81;
        synth.frequency.value = baseFreq * pitchMultiplier;
        synth.triggerAttackRelease(baseFreq * pitchMultiplier, duration);
      }
    }
  };

  const setBpm = (bpm: number) => {
    Tone.Transport.bpm.value = bpm;
  };

  const startTransport = () => {
    Tone.Transport.start();
  };

  const stopTransport = () => {
    Tone.Transport.stop();
  };

  const getCurrentTime = () => {
    return Tone.now();
  };

  return {
    isLoaded,
    playSound,
    setBpm,
    startTransport,
    stopTransport,
    getCurrentTime,
    masterVolume,
    setMasterVolume,
    loadSample, // Export the sample loading function
    createCustomSampler, // Export the sampler creation function
  };
}

export default useTone;
