import { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import VoiceConfiguration from './VoiceConfiguration';
import AudioPlayer from './AudioPlayer';
import PracticeSections from './PracticeSections';
import ScoreViewer from './ScoreViewer';

function PracticeView({ songId, songDetails, onSongUpdate, onDelete, myVoice, deeplinkSettings, onAudioPlayerStateChange }) {
  const [selectedPracticeSection, setSelectedPracticeSection] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayerState, setAudioPlayerState] = useState(null);

  // Report audio player state changes to parent
  useEffect(() => {
    if (onAudioPlayerStateChange && audioPlayerState) {
      onAudioPlayerStateChange(audioPlayerState);
    }
  }, [audioPlayerState, onAudioPlayerStateChange]);

  if (!songDetails) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <h2>Select a song from the left sidebar to start practicing</h2>
        <p>Or create a new song to get started!</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Song Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>{songDetails.title}</h1>
        {songDetails.description && (
          <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>{songDetails.description}</p>
        )}
      </div>

      {songDetails.midi_file && (
        <>
          {/* Audio Player and Practice Sections - Side by Side */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: '20px', 
            marginBottom: '30px',
            '@media (max-width: 968px)': {
              gridTemplateColumns: '1fr'
            }
          }}>
            <div>
              <AudioPlayer 
                songId={songId} 
                songDetails={songDetails}
                selectedSection={selectedPracticeSection}
                onSectionChange={setSelectedPracticeSection}
                myVoice={myVoice}
                onPlayingChange={setIsPlaying}
                deeplinkSettings={deeplinkSettings}
                onStateChange={setAudioPlayerState}
              />
            </div>
            <div>
              <PracticeSections 
                songId={songId}
                onSectionSelect={setSelectedPracticeSection}
              />
              
              <VoiceConfiguration 
                songId={songId}
                songDetails={songDetails}
                onConfigurationSaved={onSongUpdate}
              />
            </div>
          </div>

          <ScoreViewer
            songId={songId}
            scoreFile={songDetails.score_file}
            myVoice={myVoice}
            songDetails={songDetails}
            isPlaying={isPlaying}
          />
        </>
      )}

      {/* Song Info Summary */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '15px', 
        background: '#f0f0f0', 
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px'
      }}>
        <div>
          <strong>MIDI File:</strong> {songDetails.midi_file ? '✅ Uploaded' : '❌ Not uploaded'}
        </div>
        <div>
          <strong>MusicXML Score:</strong> {songDetails.score_file ? '✅ Uploaded' : '❌ Not uploaded'}
        </div>
        <div>
          <strong>Voices:</strong> {songDetails.voices?.length || 0} configured
        </div>
        <div>
          <strong>Sections:</strong> {songDetails.practice_sections?.length || 0} defined
        </div>
      </div>

      {/* File Upload Section */}
      {!songDetails.midi_file && (
        <div style={{ marginBottom: '30px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>⚠️ Upload MIDI File to Start</h3>
          <p style={{ margin: '0 0 15px 0', color: '#856404' }}>
            Upload a MIDI file to enable playback and voice configuration.
          </p>
        </div>
      )}

      <FileUpload 
        songId={songId} 
        onUploadComplete={onSongUpdate} 
      />

      {/* Delete Button */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #ddd' }}>
        <button 
          onClick={() => {
            if (confirm('Delete this song? This cannot be undone.')) {
              onDelete(songDetails.id);
            }
          }}
          style={{ 
            padding: '10px 20px', 
            background: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          🗑️ Delete Song
        </button>
      </div>
    </div>
  );
}

export default PracticeView;
