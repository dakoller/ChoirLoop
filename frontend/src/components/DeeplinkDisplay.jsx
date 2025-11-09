import { useState, useEffect } from 'react';
import { createDeeplink, copyToClipboard } from '../utils/deeplink';

function DeeplinkDisplay({ 
  songId, 
  voiceId, 
  sectionId, 
  tempo, 
  volumes, 
  practiceMode, 
  guidedStep, 
  enabledTracks 
}) {
  const [deeplink, setDeeplink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!songId) {
      setDeeplink('');
      return;
    }

    const settings = {
      songId,
      voiceId,
      sectionId,
      tempo,
      volumes,
      practiceMode,
      guidedStep,
      enabledTracks
    };

    const link = createDeeplink(settings);
    setDeeplink(link);
  }, [songId, voiceId, sectionId, tempo, volumes, practiceMode, guidedStep, enabledTracks]);

  const handleCopy = async () => {
    const success = await copyToClipboard(deeplink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!deeplink) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#2c3e50',
      color: 'white',
      padding: '12px 20px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
          🔗 Share Link:
        </span>
        <input
          type="text"
          value={deeplink}
          readOnly
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#34495e',
            color: 'white',
            border: '1px solid #4a5f7f',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace'
          }}
          onClick={(e) => e.target.select()}
        />
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: '8px 20px',
          background: copied ? '#28a745' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          transition: 'background 0.3s ease'
        }}
      >
        {copied ? '✓ Copied!' : '📋 Copy'}
      </button>
    </div>
  );
}

export default DeeplinkDisplay;
