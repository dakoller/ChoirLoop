import { useState } from 'react';
import apiClient from '../api/client';

function FileUpload({ songId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    const endpoint = `/songs/${songId}/upload/${type}`;
    
    if (type === 'midi') {
      formData.append('midi_file', file);
    } else if (type === 'score') {
      formData.append('score_file', file);
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(response.data.message);
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      // Reset file input
      event.target.value = '';
    } catch (err) {
      setError(`Upload failed: ${err.response?.data?.message || err.message}`);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '15px 20px', background: '#f9f9f9', borderRadius: '8px', marginTop: '20px', border: '1px solid #ddd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>📁 Upload Files</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '6px 12px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          {error && (
            <div style={{ color: 'red', padding: '10px', marginTop: '15px', marginBottom: '10px', background: '#fee', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ color: 'green', padding: '10px', marginTop: '15px', marginBottom: '10px', background: '#efe', borderRadius: '4px' }}>
              {success}
            </div>
          )}

          <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
            {/* MIDI Upload */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                MIDI File (.mid, .midi)
              </label>
              <input
                type="file"
                accept=".mid,.midi"
                onChange={(e) => handleFileUpload(e, 'midi')}
                disabled={uploading}
                style={{ padding: '8px', width: '100%' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Max size: 10MB - Required for playback
              </div>
            </div>

            {/* MusicXML Score Upload */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                MusicXML Score (.xml, .musicxml, .mxl)
              </label>
              <input
                type="file"
                accept=".xml,.musicxml,.mxl"
                onChange={(e) => handleFileUpload(e, 'score')}
                disabled={uploading}
                style={{ padding: '8px', width: '100%' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Max size: 10MB - Shows your voice's notation during practice
              </div>
            </div>
          </div>

          {uploading && (
            <div style={{ marginTop: '15px', color: '#007bff', fontWeight: 'bold' }}>
              Uploading...
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FileUpload;
