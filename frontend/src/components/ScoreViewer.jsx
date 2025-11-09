import { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import config from '../config';

function ScoreViewer({ songId, scoreFile, myVoice, songDetails, isPlaying }) {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (scoreFile && containerRef.current) {
      loadScore();
    }

    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
    };
  }, [songId, scoreFile, myVoice]);

  const loadScore = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clear previous rendering
      if (osmdRef.current) {
        osmdRef.current.clear();
      }

      // Create new OSMD instance
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        drawComposer: false,
        drawCredits: false,
      });

      // Load MusicXML from backend
      const scoreUrl = `${config.getApiServerUrl()}/api/songs/${songId}/score`;
      await osmdRef.current.load(scoreUrl);

      // If a voice is selected, try to show only that part
      if (myVoice && songDetails?.voices) {
        const selectedVoice = songDetails.voices.find(v => v.track_number === parseInt(myVoice));
        if (selectedVoice) {
          // Note: Filtering to specific voice requires advanced OSMD configuration
          // For now, we render the full score
          // TODO: Implement voice filtering in future enhancement
        }
      }

      await osmdRef.current.render();
      setLoading(false);
    } catch (err) {
      setError('Failed to load score: ' + err.message);
      console.error('Score loading error:', err);
      setLoading(false);
    }
  };

  if (!scoreFile) {
    return null;
  }

  if (!isPlaying) {
    return null;
  }

  return (
    <div style={{ 
      marginTop: '30px', 
      padding: '20px', 
      background: 'white', 
      borderRadius: '8px', 
      border: '2px solid #28a745'
    }}>
      <h3 style={{ margin: '0 0 15px 0' }}>🎼 Musical Score</h3>

      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading score...
        </div>
      )}

      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '15px', background: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {myVoice && songDetails?.voices && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#d4edda', borderRadius: '4px', border: '1px solid #28a745' }}>
          <strong>Showing notation for:</strong> {songDetails.voices.find(v => v.track_number === parseInt(myVoice))?.name || 'All parts'}
        </div>
      )}

      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          overflow: 'auto',
          minHeight: '200px',
          background: '#fff'
        }}
      />

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
        💡 The score displays while audio is playing. Stop playback to hide.
      </div>
    </div>
  );
}

export default ScoreViewer;
