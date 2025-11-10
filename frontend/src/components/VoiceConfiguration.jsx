import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import apiClient from '../api/client';
import config from '../config';

function VoiceConfiguration({ songId, songDetails, onConfigurationSaved }) {
  const [midiData, setMidiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [voices, setVoices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const synthRef = useRef(null);
  const partRef = useRef(null);

  const voiceOptions = [
    'Soprano',
    'Alto',
    'Tenor 1',
    'Tenor 2',
    'Bass 1',
    'Bass 2',
    'Solo',
    'Piano',
    'Organ',
    'Accompaniment',
    'Drums',
    'Other'
  ];

  useEffect(() => {
    loadMidiFile();
    
    return () => {
      cleanup();
    };
  }, [songId]);

  useEffect(() => {
    // Initialize voices from songDetails if available
    if (songDetails?.voices && songDetails.voices.length > 0) {
      setVoices(songDetails.voices.map(v => ({
        track_number: v.track_number,
        names: v.names || (v.name ? [v.name] : [`Track ${v.track_number + 1}`]),  // Support both old and new format
        original_track_name: v.original_track_name || `Track ${v.track_number + 1}`,
        note_count: v.note_count || 0,
        channel: v.channel
      })));
      // Don't auto-expand if voices already configured
      setIsExpanded(false);
    } else if (midiData) {
      // Initialize from MIDI data - expand by default for new configuration
      const initialVoices = midiData.tracks.map((track, index) => ({
        track_number: index,
        names: [track.name || `Track ${index + 1}`],
        original_track_name: track.name || `Track ${index + 1}`,
        note_count: track.notes.length,
        channel: track.channel
      }));
      setVoices(initialVoices);
      setIsExpanded(true); // Expand for first-time configuration
    }
  }, [midiData, songDetails]);

  const cleanup = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
  };

  const loadMidiFile = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${config.getApiServerUrl()}/api/songs/${songId}/midi`);
      if (!response.ok) {
        throw new Error('Failed to load MIDI file');
      }

      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      setMidiData(midi);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load MIDI:', err);
      setLoading(false);
    }
  };

  const handlePlayTrack = async (trackIndex) => {
    try {
      await Tone.start();

      // Stop if already playing
      if (playingTrack === trackIndex) {
        cleanup();
        setPlayingTrack(null);
        return;
      }

      // Stop any currently playing track
      cleanup();

      // Create synth for this track
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
      synthRef.current.volume.value = -5;

      const track = midiData.tracks[trackIndex];
      const notes = track.notes.map(note => ({
        time: note.time,
        note: note.name,
        duration: note.duration,
        velocity: note.velocity
      }));

      partRef.current = new Tone.Part((time, note) => {
        synthRef.current?.triggerAttackRelease(
          note.note,
          note.duration,
          time,
          note.velocity
        );
      }, notes);

      partRef.current.loop = true;
      partRef.current.loopEnd = midiData.duration;
      partRef.current.start(0);

      Tone.Transport.start();
      setPlayingTrack(trackIndex);
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  const handleStopAll = () => {
    cleanup();
    setPlayingTrack(null);
  };

  const handleVoiceToggle = (trackIndex, voiceName) => {
    setVoices(prev => prev.map((voice, idx) => {
      if (idx !== trackIndex) return voice;
      
      const currentNames = voice.names || [];
      const isSelected = currentNames.includes(voiceName);
      
      return {
        ...voice,
        names: isSelected
          ? currentNames.filter(n => n !== voiceName)
          : [...currentNames, voiceName]
      };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update song with new voice configuration
      await apiClient.put(`/songs/${songId}`, {
        voices: voices
      });
      
      if (onConfigurationSaved) {
        onConfigurationSaved();
      }
      
      alert('Voice configuration saved successfully!');
    } catch (err) {
      console.error('Failed to save configuration:', err);
      alert('Failed to save configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading MIDI tracks...</div>;
  }

  if (!midiData) {
    return null;
  }

  const isConfigured = songDetails?.voices && songDetails.voices.length > 0;

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: '#fff', borderRadius: '8px', border: '2px solid #007bff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '20px' : '0' }}>
        <div>
          <h3 style={{ margin: 0 }}>🎼 Voice Configuration</h3>
          {isConfigured && !isExpanded && (
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
              {voices.length} tracks configured
            </p>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isExpanded ? '▲ Collapse' : '▼ Expand to Edit'}
        </button>
      </div>

      {isExpanded && (
        <>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Listen to each track and assign it to the correct voice (Soprano, Alto, Tenor, Bass, etc.)
          </p>

          <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
        {voices.map((voice, index) => (
          <div 
            key={index}
            style={{ 
              padding: '15px', 
              background: playingTrack === index ? '#e7f3ff' : '#f9f9f9',
              borderRadius: '8px',
              border: playingTrack === index ? '2px solid #007bff' : '1px solid #ddd'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '15px', alignItems: 'center' }}>
              {/* Track Info */}
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Track {index + 1}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {voice.original_track_name}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {voice.note_count} notes
                </div>
              </div>

              {/* Voice Selection - Multi-select */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>
                  Assign to Voice(s): {voice.names && voice.names.length > 0 && (
                    <span style={{ fontWeight: 'normal', color: '#007bff' }}>
                      ({voice.names.join(', ')})
                    </span>
                  )}
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '8px',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  maxHeight: '120px',
                  overflow: 'auto'
                }}>
                  {voiceOptions.map(option => (
                    <label 
                      key={option}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(voice.names || []).includes(option)}
                        onChange={() => handleVoiceToggle(index, option)}
                        style={{ marginRight: '5px' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Play Button */}
              <button
                onClick={() => handlePlayTrack(index)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  background: playingTrack === index ? '#ffc107' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  minWidth: '80px'
                }}
              >
                {playingTrack === index ? '⏸ Stop' : '▶ Play'}
              </button>
            </div>
          </div>
        ))}
      </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
            <button
              onClick={handleStopAll}
              disabled={playingTrack === null}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: playingTrack === null ? 'not-allowed' : 'pointer'
              }}
            >
              ⏹ Stop All
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px',
                fontSize: '16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {saving ? 'Saving...' : '💾 Save Voice Configuration'}
            </button>
          </div>

          <div style={{ marginTop: '15px', padding: '12px', background: '#fff3cd', borderRadius: '4px', fontSize: '13px', color: '#856404' }}>
            <strong>💡 Tip:</strong> Click "Play" on each track to hear it individually, then assign it to the appropriate voice. 
            The configuration will be used for volume controls during practice.
          </div>
        </>
      )}
    </div>
  );
}

export default VoiceConfiguration;
