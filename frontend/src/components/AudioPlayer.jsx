import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import config from '../config';

function AudioPlayer({ songId, songDetails, selectedSection, onSectionChange, myVoice, onPlayingChange, deeplinkSettings, onStateChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempo, setTempo] = useState(100); // percentage
  const [loopCount, setLoopCount] = useState(3);
  const [currentLoop, setCurrentLoop] = useState(0);
  const [error, setError] = useState(null);
  const [midiData, setMidiData] = useState(null);
  const [trackVolumes, setTrackVolumes] = useState({});
  const [enabledTracks, setEnabledTracks] = useState({});
  const [practiceMode, setPracticeMode] = useState('manual'); // 'manual' or 'guided'
  const [guidedStep, setGuidedStep] = useState(1); // 1: focus, 2: together, 3: without me
  const [deeplinkApplied, setDeeplinkApplied] = useState(false);
  const [generatingMp3, setGeneratingMp3] = useState(false);
  const [mp3Hash, setMp3Hash] = useState(null);

  const synthsRef = useRef([]);
  const partsRef = useRef([]);
  const baseTempo = useRef(120);
  const timeSignature = useRef({ beatsPerMeasure: 4, beatUnit: 4 });
  const loopTimeoutRef = useRef(null);
  const loopScheduleIdsRef = useRef([]);
  const completionCheckRef = useRef(null);

  useEffect(() => {
    // Load MIDI file when component mounts or songDetails changes
    if (songDetails?.midi_file) {
      loadMidiFile();
    }

    return () => {
      cleanup();
    };
  }, [songId, songDetails?.midi_file]);

  // Pre-build audio when section changes
  useEffect(() => {
    if (midiData && !isPlaying) {
      setupAudio(midiData, selectedSection);
    }
  }, [selectedSection, midiData]);

  // Apply deeplink settings when MIDI is loaded and settings are available
  useEffect(() => {
    if (midiData && deeplinkSettings && !deeplinkApplied) {
      applyDeeplinkSettings();
      setDeeplinkApplied(true);
    }
  }, [midiData, deeplinkSettings, deeplinkApplied]);

  // Report state changes to parent
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        tempo,
        volumes: trackVolumes,
        practiceMode,
        guidedStep,
        enabledTracks,
        sectionId: selectedSection?.id
      });
    }
  }, [tempo, trackVolumes, practiceMode, guidedStep, enabledTracks, selectedSection, onStateChange]);

  const cleanup = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    // Clear any scheduled loop events
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    
    loopScheduleIdsRef.current.forEach(id => Tone.Transport.clear(id));
    loopScheduleIdsRef.current = [];
    
    partsRef.current.forEach(part => part?.dispose());
    synthsRef.current.forEach(synth => synth?.dispose());
    
    partsRef.current = [];
    synthsRef.current = [];
  };

  const loadMidiFile = async () => {
    console.log('[AudioPlayer] Starting MIDI load...');
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AudioPlayer] Fetching MIDI file from:', `${config.getApiServerUrl()}/api/songs/${songId}/midi`);
      const fetchStart = performance.now();
      const response = await fetch(`${config.getApiServerUrl()}/api/songs/${songId}/midi`);
      console.log('[AudioPlayer] MIDI fetch took:', (performance.now() - fetchStart).toFixed(2), 'ms');
      
      if (!response.ok) {
        throw new Error('Failed to load MIDI file');
      }

      console.log('[AudioPlayer] Reading array buffer...');
      const bufferStart = performance.now();
      const arrayBuffer = await response.arrayBuffer();
      console.log('[AudioPlayer] Array buffer read took:', (performance.now() - bufferStart).toFixed(2), 'ms');
      
      console.log('[AudioPlayer] Parsing MIDI with Tone.js...');
      const parseStart = performance.now();
      const midi = new Midi(arrayBuffer);
      console.log('[AudioPlayer] MIDI parsing took:', (performance.now() - parseStart).toFixed(2), 'ms');
      console.log('[AudioPlayer] MIDI tracks:', midi.tracks.length, 'Duration:', midi.duration, 's');
      
      setMidiData(midi);
      baseTempo.current = midi.header.tempos[0]?.bpm || 120;
      console.log('[AudioPlayer] Base tempo:', baseTempo.current, 'BPM');
      
      // Initialize volume settings and enabled tracks for each voice
      console.log('[AudioPlayer] Initializing voice settings for', songDetails.voices.length, 'voices');
      const initialVolumes = {};
      const initialEnabled = {};
      songDetails.voices.forEach((voice) => {
        initialVolumes[voice.track_number] = -10; // dB
        initialEnabled[voice.track_number] = true; // All enabled by default
      });
      setTrackVolumes(initialVolumes);
      setEnabledTracks(initialEnabled);

      // Setup synths and parts
      console.log('[AudioPlayer] Setting up audio...');
      const setupStart = performance.now();
      setupAudio(midi);
      console.log('[AudioPlayer] Audio setup took:', (performance.now() - setupStart).toFixed(2), 'ms');
      
      console.log('[AudioPlayer] Total MIDI load time:', (performance.now() - startTime).toFixed(2), 'ms');
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load MIDI: ' + err.message);
      console.error('[AudioPlayer] MIDI load error:', err);
      setIsLoading(false);
    }
  };

  const setupAudio = (midi, section = null) => {
    console.log('[AudioPlayer] setupAudio called, section:', section ? section.label : 'full song');
    const setupStart = performance.now();
    
    cleanup();

    let startTime = 0;
    let endTime = midi.duration;
    
    // Calculate section times if provided
    if (section) {
      startTime = calculateSectionTime(section.start_measure, section.start_beat);
      endTime = calculateSectionTime(section.end_measure, section.end_beat);
      console.log('[AudioPlayer] Section times:', startTime, 'to', endTime, 'seconds');
    }

    console.log('[AudioPlayer] Creating synths for', midi.tracks.length, 'tracks');
    const synthStart = performance.now();
    synthsRef.current = midi.tracks.map(() => {
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      return synth;
    });
    console.log('[AudioPlayer] Synth creation took:', (performance.now() - synthStart).toFixed(2), 'ms');

    console.log('[AudioPlayer] Creating parts...');
    const partsStart = performance.now();
    partsRef.current = midi.tracks.map((track, trackIndex) => {
      // Filter notes to only include those in the section range
      let notes = track.notes;
      if (section) {
        notes = track.notes.filter(note => 
          note.time >= startTime && note.time < endTime
        );
      }
      
      const formattedNotes = notes.map(note => ({
        time: section ? note.time - startTime : note.time, // Adjust timing for section
        note: note.name,
        duration: note.duration,
        velocity: note.velocity
      }));

      const part = new Tone.Part((time, note) => {
        synthsRef.current[trackIndex]?.triggerAttackRelease(
          note.note,
          note.duration,
          time,
          note.velocity
        );
      }, formattedNotes);

      return part;
    });
    console.log('[AudioPlayer] Parts creation took:', (performance.now() - partsStart).toFixed(2), 'ms');
    console.log('[AudioPlayer] Total setupAudio took:', (performance.now() - setupStart).toFixed(2), 'ms');
  };

  const calculateSectionTime = (measure, beat) => {
    // Calculate time in seconds based on measure and beat
    // Assumes 4/4 time signature by default
    const beatsPerMeasure = timeSignature.current.beatsPerMeasure;
    const secondsPerBeat = 60 / (baseTempo.current * (tempo / 100));
    
    const totalBeats = ((measure - 1) * beatsPerMeasure) + (beat - 1);
    return totalBeats * secondsPerBeat;
  };

  const scheduleLoop = (loopNumber, startOffset) => {
    // Calculate durations
    let sectionDuration = selectedSection 
      ? calculateSectionTime(selectedSection.end_measure, selectedSection.end_beat) - 
        calculateSectionTime(selectedSection.start_measure, selectedSection.start_beat)
      : midiData.duration;
    
    const beatDuration = 60 / Tone.Transport.bpm.value;
    const countInDuration = beatDuration * timeSignature.current.beatsPerMeasure;
    const breakDuration = beatDuration * timeSignature.current.beatsPerMeasure; // 1 measure break
    
    // Schedule count-in clicks
    for (let i = 0; i < timeSignature.current.beatsPerMeasure; i++) {
      const clickTime = startOffset + (i * beatDuration);
      const scheduleId = Tone.Transport.schedule((time) => {
        const clickSynth = new Tone.Synth().toDestination();
        clickSynth.volume.value = -5;
        clickSynth.triggerAttackRelease(i === 0 ? 'C6' : 'C5', '32n', time);
      }, clickTime);
      loopScheduleIdsRef.current.push(scheduleId);
    }
    
    // Start parts at the appropriate time
    partsRef.current.forEach(part => {
      if (part) {
        part.loop = false; // Disable built-in looping
        part.start(startOffset + countInDuration);
      }
    });
    
    // Update loop counter display
    const displayTime = (startOffset + countInDuration) * 1000;
    setTimeout(() => {
      setCurrentLoop(loopNumber);
    }, displayTime);
    
    // Return the total time for this loop iteration
    return countInDuration + sectionDuration + breakDuration;
  };

  const handlePlay = async () => {
    console.log('[AudioPlayer] ▶ Play button clicked');
    const playStart = performance.now();
    
    try {
      console.log('[AudioPlayer] Starting Tone.js audio context...');
      const toneStart = performance.now();
      await Tone.start();
      console.log('[AudioPlayer] Tone.start() took:', (performance.now() - toneStart).toFixed(2), 'ms');
      
      // Reduce audio latency
      Tone.context.lookAhead = 0.01; // Reduce from default 0.1 seconds
      console.log('[AudioPlayer] Audio context lookAhead set to:', Tone.context.lookAhead);
      
      if (!isPlaying) {
        console.log('[AudioPlayer] Applying volume settings...');
        const volumeStart = performance.now();
        // Apply volume settings and mute disabled tracks
        songDetails.voices.forEach((voice) => {
          const isEnabled = enabledTracks[voice.track_number] !== false;
          const volume = isEnabled ? (trackVolumes[voice.track_number] ?? -10) : -100;
          
          if (synthsRef.current[voice.track_number]) {
            synthsRef.current[voice.track_number].volume.value = volume;
          }
        });
        console.log('[AudioPlayer] Volume settings applied, took:', (performance.now() - volumeStart).toFixed(2), 'ms');

        // Set tempo
        console.log('[AudioPlayer] Setting tempo to', tempo, '% =', baseTempo.current * (tempo / 100), 'BPM');
        Tone.Transport.bpm.value = baseTempo.current * (tempo / 100);

        // Schedule loops with breaks
        console.log('[AudioPlayer] Scheduling loops, count:', loopCount);
        const scheduleStart = performance.now();
        if (loopCount === 0) {
          // Infinite looping - use Tone.js built-in loop
          const beatDuration = 60 / Tone.Transport.bpm.value;
          const countInDuration = beatDuration * timeSignature.current.beatsPerMeasure;
          
          let sectionDuration = selectedSection 
            ? calculateSectionTime(selectedSection.end_measure, selectedSection.end_beat) - 
              calculateSectionTime(selectedSection.start_measure, selectedSection.start_beat)
            : midiData.duration;
          
          // Schedule count-in clicks for first iteration only
          for (let i = 0; i < timeSignature.current.beatsPerMeasure; i++) {
            const clickTime = i * beatDuration;
            Tone.Transport.schedule((time) => {
              const clickSynth = new Tone.Synth().toDestination();
              clickSynth.volume.value = -5;
              clickSynth.triggerAttackRelease(i === 0 ? 'C6' : 'C5', '32n', time);
            }, clickTime);
          }
          
          console.log('[AudioPlayer] Infinite loop mode, count-in duration:', countInDuration, 's');
          partsRef.current.forEach(part => {
            if (part) {
              part.loop = true;
              part.loopEnd = sectionDuration;
              part.start(countInDuration);
            }
          });
        } else {
          console.log('[AudioPlayer] Finite loop mode, loops:', loopCount);
          // Finite looping - custom scheduling
          let currentOffset = 0;
          
          for (let i = 1; i <= loopCount; i++) {
            // Rebuild parts for each loop iteration
            if (i > 1) {
              setupAudio(midiData, selectedSection);
              
              // Reapply volume settings
              songDetails.voices.forEach((voice) => {
                const isEnabled = enabledTracks[voice.track_number] !== false;
                const volume = isEnabled ? (trackVolumes[voice.track_number] ?? -10) : -100;
                
                if (synthsRef.current[voice.track_number]) {
                  synthsRef.current[voice.track_number].volume.value = volume;
                }
              });
            }
            
            currentOffset += scheduleLoop(i, currentOffset);
          }
          
          // Schedule automatic stop after all loops complete
          const totalDuration = currentOffset * 1000;
          loopTimeoutRef.current = setTimeout(() => {
            handleStop();
          }, totalDuration);
        }
        console.log('[AudioPlayer] Loop scheduling took:', (performance.now() - scheduleStart).toFixed(2), 'ms');
        
        console.log('[AudioPlayer] Starting Tone.Transport...');
        const transportStart = performance.now();
        Tone.Transport.start();
        console.log('[AudioPlayer] Transport.start() took:', (performance.now() - transportStart).toFixed(2), 'ms');
        
        setIsPlaying(true);
        setCurrentLoop(1);
        if (onPlayingChange) onPlayingChange(true);
        
        console.log('[AudioPlayer] ✅ Total play button to start took:', (performance.now() - playStart).toFixed(2), 'ms');
      } else {
        console.log('[AudioPlayer] Pausing playback');
        Tone.Transport.pause();
        setIsPlaying(false);
        if (onPlayingChange) onPlayingChange(false);
      }
    } catch (err) {
      setError('Playback error: ' + err.message);
      console.error('[AudioPlayer] ❌ Audio error:', err);
      console.log('[AudioPlayer] Error occurred at:', (performance.now() - playStart).toFixed(2), 'ms after play button click');
    }
  };

  const handleStop = () => {
    Tone.Transport.stop();
    partsRef.current.forEach(part => part?.stop());
    setIsPlaying(false);
    setCurrentLoop(0);
    if (onPlayingChange) onPlayingChange(false);
  };

  const handleTempoChange = (newTempo) => {
    setTempo(newTempo);
    Tone.Transport.bpm.value = baseTempo.current * (newTempo / 100);
  };

  const handleVolumeChange = (trackNumber, newVolume) => {
    setTrackVolumes(prev => ({
      ...prev,
      [trackNumber]: newVolume
    }));
    
    if (synthsRef.current[trackNumber]) {
      synthsRef.current[trackNumber].volume.value = newVolume;
    }
  };

  const handleGenerateMp3 = async () => {
    setGeneratingMp3(true);
    setError(null);
    
    try {
      const apiClient = (await import('../api/client')).default;
      
      const response = await apiClient.post(`/songs/${songId}/generate-mp3`, {
        tempo,
        track_volumes: Object.fromEntries(
          Object.entries(trackVolumes).map(([k, v]) => [String(k), v])
        ),
        enabled_tracks: Object.fromEntries(
          Object.entries(enabledTracks).map(([k, v]) => [String(k), v])
        ),
        section_id: selectedSection?.id || null,
        start_measure: selectedSection?.start_measure || null,
        start_beat: selectedSection?.start_beat || null,
        end_measure: selectedSection?.end_measure || null,
        end_beat: selectedSection?.end_beat || null
      });
      
      setMp3Hash(response.data.settings_hash);
      alert(response.data.cached ? 'MP3 already exists!' : 'MP3 generated successfully!');
    } catch (err) {
      setError('Failed to generate MP3: ' + (err.response?.data?.detail || err.message));
      console.error('MP3 generation error:', err);
    } finally {
      setGeneratingMp3(false);
    }
  };

  const handleDownloadMp3 = () => {
    if (mp3Hash) {
      const downloadUrl = `${config.getApiServerUrl()}/api/songs/${songId}/download-mp3/${mp3Hash}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const applyDeeplinkSettings = () => {
    console.log('Applying deeplink settings:', deeplinkSettings);
    
    // Apply tempo
    if (deeplinkSettings.tempo) {
      setTempo(deeplinkSettings.tempo);
    }
    
    // Apply practice mode
    if (deeplinkSettings.practiceMode) {
      setPracticeMode(deeplinkSettings.practiceMode);
    }
    
    // Apply guided step
    if (deeplinkSettings.guidedStep) {
      setGuidedStep(deeplinkSettings.guidedStep);
    }
    
    // Apply volumes
    if (deeplinkSettings.volumes) {
      setTrackVolumes(deeplinkSettings.volumes);
    }
    
    // Apply enabled tracks (note: deeplink only stores disabled tracks)
    if (deeplinkSettings.enabledTracks) {
      setEnabledTracks(prev => ({
        ...prev,
        ...deeplinkSettings.enabledTracks
      }));
    }
    
    // Apply section if specified
    if (deeplinkSettings.sectionId && songDetails?.practice_sections) {
      const section = songDetails.practice_sections.find(s => s.id === deeplinkSettings.sectionId);
      if (section && onSectionChange) {
        onSectionChange(section);
      }
    }
    
    // If in guided mode with a step, apply it
    if (deeplinkSettings.practiceMode === 'guided' && deeplinkSettings.guidedStep) {
      setTimeout(() => {
        applyGuidedMode(deeplinkSettings.guidedStep);
      }, 100);
    }
  };

  const applyGuidedMode = (step) => {
    if (!myVoice) return;

    const newVolumes = {};
    const newEnabled = {};

    songDetails.voices.forEach((voice) => {
      const isMyVoice = voice.track_number === parseInt(myVoice);

      switch (step) {
        case 1: // Focus on own voice
          newEnabled[voice.track_number] = true;
          if (isMyVoice) {
            newVolumes[voice.track_number] = -5; // Loud
          } else {
            newVolumes[voice.track_number] = -30; // Soft background
          }
          break;

        case 2: // All voices together
          newEnabled[voice.track_number] = true;
          newVolumes[voice.track_number] = -10; // Equal volume
          break;

        case 3: // Without own voice
          if (isMyVoice) {
            newEnabled[voice.track_number] = false; // Mute my voice
            newVolumes[voice.track_number] = -100;
          } else {
            newEnabled[voice.track_number] = true;
            newVolumes[voice.track_number] = -10; // Normal volume
          }
          break;
      }
    });

    setTrackVolumes(newVolumes);
    setEnabledTracks(newEnabled);
  };

  if (!songDetails?.midi_file) {
    return (
      <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
        <p style={{ margin: 0, color: '#856404' }}>
          ⚠️ No MIDI file uploaded yet. Upload a MIDI file to enable playback.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', background: '#e7f3ff', borderRadius: '8px' }}>
        <p style={{ margin: 0 }}>Loading MIDI file...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{ marginBottom: '15px' }}>🎵 Audio Player</h3>

      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '15px', background: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {selectedSection && (
        <div style={{ marginBottom: '15px', padding: '12px', background: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
          <strong>🎯 Playing Section:</strong> {selectedSection.label}
          <span style={{ marginLeft: '10px', fontSize: '13px', color: '#0c5460' }}>
            (Measures {selectedSection.start_measure}:{selectedSection.start_beat} - {selectedSection.end_measure}:{selectedSection.end_beat})
          </span>
          {onSectionChange && (
            <button
              onClick={() => onSectionChange(null)}
              style={{
                marginLeft: '15px',
                padding: '4px 10px',
                fontSize: '12px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Section
            </button>
          )}
        </div>
      )}

      {midiData && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f0f0', borderRadius: '4px', fontSize: '14px' }}>
          <strong>MIDI Info:</strong> {midiData.tracks.length} tracks, {Math.round(midiData.duration)}s duration, {Math.round(baseTempo.current)} BPM
        </div>
      )}

      {/* Two Column Layout for Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column */}
        <div>
          {/* Playback Controls */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={handlePlay}
              disabled={isLoading || !midiData}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '16px',
                background: isPlaying ? '#ffc107' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={handleStop}
              disabled={!isPlaying}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isPlaying ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              ⏹ Stop
            </button>
          </div>

          {/* Loop Settings */}
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Loop Settings
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                <input
                  type="radio"
                  checked={loopCount !== 0}
                  onChange={() => setLoopCount(3)}
                  disabled={isPlaying}
                />
                Repeat
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={loopCount || 3}
                onChange={(e) => setLoopCount(parseInt(e.target.value))}
                disabled={isPlaying || loopCount === 0}
                style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                <input
                  type="radio"
                  checked={loopCount === 0}
                  onChange={() => setLoopCount(0)}
                  disabled={isPlaying}
                />
                Loop Forever
              </label>
            </div>
            {isPlaying && loopCount > 0 && (
              <div style={{ color: '#007bff', fontSize: '14px' }}>
                Current loop: {currentLoop} of {loopCount}
              </div>
            )}
          </div>

          {/* Tempo Control */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Tempo: {tempo}% ({Math.round(baseTempo.current * (tempo / 100))} BPM)
            </label>
            <input
              type="range"
              min="50"
              max="150"
              value={tempo}
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
              disabled={isPlaying}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginTop: '5px' }}>
              <span>50% (Slower)</span>
              <span>100%</span>
              <span>150% (Faster)</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Practice Mode Selection */}
          <div style={{ marginBottom: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px', border: '2px solid #007bff' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>🎯 Practice Mode</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <label style={{ 
                padding: '10px',
                background: practiceMode === 'manual' ? '#007bff' : 'white',
                color: practiceMode === 'manual' ? 'white' : '#333',
                border: '2px solid #007bff',
                borderRadius: '6px',
                cursor: isPlaying ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                <input
                  type="radio"
                  value="manual"
                  checked={practiceMode === 'manual'}
                  onChange={(e) => setPracticeMode(e.target.value)}
                  disabled={isPlaying}
                  style={{ marginRight: '6px' }}
                />
                🎚️ Manual
              </label>
              
              <label style={{ 
                padding: '10px',
                background: practiceMode === 'guided' ? '#28a745' : 'white',
                color: practiceMode === 'guided' ? 'white' : '#333',
                border: '2px solid #28a745',
                borderRadius: '6px',
                cursor: isPlaying ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                <input
                  type="radio"
                  value="guided"
                  checked={practiceMode === 'guided'}
                  onChange={(e) => setPracticeMode(e.target.value)}
                  disabled={isPlaying}
                  style={{ marginRight: '6px' }}
                />
                📚 Guided
              </label>
            </div>

            {practiceMode === 'guided' && (
              <div style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #28a745' }}>
                {!myVoice && (
                  <div style={{ padding: '10px', marginBottom: '10px', background: '#fff3cd', borderRadius: '4px', fontSize: '13px', color: '#856404' }}>
                    ⚠️ Select your voice first
                  </div>
                )}
                
                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setGuidedStep(1);
                      applyGuidedMode(1);
                    }}
                    disabled={!myVoice || isPlaying}
                    style={{
                      padding: '10px',
                      background: guidedStep === 1 ? '#28a745' : '#f8f9fa',
                      color: guidedStep === 1 ? 'white' : '#333',
                      border: guidedStep === 1 ? '2px solid #1e7e34' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: !myVoice || isPlaying ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontWeight: guidedStep === 1 ? 'bold' : 'normal',
                      fontSize: '13px'
                    }}
                  >
                    <strong>1:</strong> 🎯 Focus
                  </button>

                  <button
                    onClick={() => {
                      setGuidedStep(2);
                      applyGuidedMode(2);
                    }}
                    disabled={!myVoice || isPlaying}
                    style={{
                      padding: '10px',
                      background: guidedStep === 2 ? '#28a745' : '#f8f9fa',
                      color: guidedStep === 2 ? 'white' : '#333',
                      border: guidedStep === 2 ? '2px solid #1e7e34' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: !myVoice || isPlaying ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontWeight: guidedStep === 2 ? 'bold' : 'normal',
                      fontSize: '13px'
                    }}
                  >
                    <strong>2:</strong> 👥 Together
                  </button>

                  <button
                    onClick={() => {
                      setGuidedStep(3);
                      applyGuidedMode(3);
                    }}
                    disabled={!myVoice || isPlaying}
                    style={{
                      padding: '10px',
                      background: guidedStep === 3 ? '#28a745' : '#f8f9fa',
                      color: guidedStep === 3 ? 'white' : '#333',
                      border: guidedStep === 3 ? '2px solid #1e7e34' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: !myVoice || isPlaying ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontWeight: guidedStep === 3 ? 'bold' : 'normal',
                      fontSize: '13px'
                    }}
                  >
                    <strong>3:</strong> 🔇 Solo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Voice Selection - Full Width */}
      {practiceMode === 'manual' && songDetails?.voices && songDetails.voices.length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>🎼 Select Voices to Play</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {songDetails.voices.map((voice) => (
              <label 
                key={voice.track_number}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px',
                  background: enabledTracks[voice.track_number] !== false ? '#e7f3ff' : 'white',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                <input
                  type="checkbox"
                  checked={enabledTracks[voice.track_number] !== false}
                  onChange={(e) => setEnabledTracks(prev => ({
                    ...prev,
                    [voice.track_number]: e.target.checked
                  }))}
                  disabled={isPlaying}
                  style={{ width: '16px', height: '16px', cursor: isPlaying ? 'not-allowed' : 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', flex: 1 }}>
                  {(voice.names || (voice.name ? [voice.name] : [`Track ${voice.track_number + 1}`])).join('/')}
                </span>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  T{voice.track_number + 1}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* MP3 Generation Section - Only in Manual Mode */}
      {practiceMode === 'manual' && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>💿 Generate MP3</h4>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#856404' }}>
            Create an MP3 file with your current settings (tempo, volumes, enabled tracks, section)
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleGenerateMp3}
              disabled={generatingMp3 || isPlaying}
              style={{
                flex: 1,
                padding: '10px 20px',
                background: '#ffc107',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: generatingMp3 || isPlaying ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {generatingMp3 ? '⏳ Generating...' : '🎵 Generate MP3'}
            </button>
            {mp3Hash && (
              <button
                onClick={handleDownloadMp3}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ⬇️ Download MP3
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voice Volume Controls - Full Width, Only in Manual Mode */}
      {practiceMode === 'manual' && songDetails?.voices && songDetails.voices.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>🎚️ Voice Volume Controls</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {songDetails.voices.map((voice) => {
              const isEnabled = enabledTracks[voice.track_number] !== false;
              return (
                <div 
                  key={voice.track_number} 
                  style={{ 
                    opacity: isEnabled ? 1 : 0.5
                  }}
                >
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                    {(voice.names || (voice.name ? [voice.name] : [`Track ${voice.track_number + 1}`])).join('/')}: {trackVolumes[voice.track_number] ?? -10} dB
                    {!isEnabled && <span style={{ color: '#999', fontWeight: 'normal' }}> (Off)</span>}
                  </label>
                  <input
                    type="range"
                    min="-60"
                    max="0"
                    value={trackVolumes[voice.track_number] ?? -10}
                    onChange={(e) => handleVolumeChange(voice.track_number, parseInt(e.target.value))}
                    disabled={isPlaying || !isEnabled}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
                    <span>Silent</span>
                    <span>Loud</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;
