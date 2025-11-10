import { useState, useEffect } from 'react';
import apiClient from '../api/client';

function PracticeSections({ songId, songDetails, onSectionSelect }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newSection, setNewSection] = useState({
    label: '',
    start_measure: 1,
    start_beat: 1,
    end_measure: 1,
    end_beat: 1,
    relevant_voices: []
  });

  useEffect(() => {
    fetchSections();
  }, [songId]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/songs/${songId}/sections`);
      setSections(response.data.sections);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sections: ' + err.message);
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/songs/${songId}/sections`, newSection);
      setNewSection({
        label: '',
        start_measure: 1,
        start_beat: 1,
        end_measure: 1,
        end_beat: 1,
        relevant_voices: []
      });
      setShowForm(false);
      fetchSections();
    } catch (err) {
      setError('Failed to create section: ' + err.message);
      console.error('Error creating section:', err);
    }
  };

  const handleDelete = async (sectionId) => {
    if (!confirm('Delete this practice section?')) return;
    
    try {
      await apiClient.delete(`/songs/${songId}/sections/${sectionId}`);
      fetchSections();
    } catch (err) {
      setError('Failed to delete section: ' + err.message);
      console.error('Error deleting section:', err);
    }
  };

  if (loading) return <div>Loading practice sections...</div>;

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Practice Sections ({sections.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ 
            padding: '8px 16px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {showForm ? 'Cancel' : '+ Add Section'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px', background: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Section Label (e.g., "Chorus", "Verse 1")
            </label>
            <input
              type="text"
              value={newSection.label}
              onChange={(e) => setNewSection({ ...newSection, label: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Start Measure
              </label>
              <input
                type="number"
                min="1"
                value={newSection.start_measure}
                onChange={(e) => setNewSection({ ...newSection, start_measure: parseInt(e.target.value) })}
                required
                style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Start Beat
              </label>
              <input
                type="number"
                min="1"
                max="16"
                value={newSection.start_beat}
                onChange={(e) => setNewSection({ ...newSection, start_beat: parseInt(e.target.value) })}
                required
                style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                End Measure
              </label>
              <input
                type="number"
                min="1"
                value={newSection.end_measure}
                onChange={(e) => setNewSection({ ...newSection, end_measure: parseInt(e.target.value) })}
                required
                style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                End Beat
              </label>
              <input
                type="number"
                min="1"
                max="16"
                value={newSection.end_beat}
                onChange={(e) => setNewSection({ ...newSection, end_beat: parseInt(e.target.value) })}
                required
                style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          {songDetails?.voices && songDetails.voices.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Relevant for voices (optional)
              </label>
              <div style={{ 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                background: '#f9f9f9',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '8px'
              }}>
                {songDetails.voices.map((voice) => {
                  // Handle both old format (name) and new format (names array)
                  const voiceNames = voice.names || (voice.name ? [voice.name] : [`Track ${voice.track_number + 1}`]);
                  const displayName = voiceNames.join('/');
                  
                  return (
                    <label key={voice.track_number} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newSection.relevant_voices.includes(voice.track_number)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSection({
                              ...newSection,
                              relevant_voices: [...newSection.relevant_voices, voice.track_number]
                            });
                          } else {
                            setNewSection({
                              ...newSection,
                              relevant_voices: newSection.relevant_voices.filter(t => t !== voice.track_number)
                            });
                          }
                        }}
                        style={{ marginRight: '5px' }}
                      />
                      {displayName}
                    </label>
                  );
                })}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Select which voices this section is relevant for
              </div>
            </div>
          )}

          <button 
            type="submit"
            style={{ padding: '10px 20px', fontSize: '14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Create Section
          </button>
        </form>
      )}

      {sections.length === 0 ? (
        <p style={{ color: '#666' }}>No practice sections defined yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {sections.map(section => (
            <div 
              key={section.id}
              style={{ 
                padding: '12px', 
                background: 'white', 
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>{section.label}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                    Measures {section.start_measure}:{section.start_beat} - {section.end_measure}:{section.end_beat}
                  </p>
                  {section.relevant_voices && section.relevant_voices.length > 0 && songDetails?.voices && (
                    <p style={{ margin: 0, fontSize: '12px', color: '#007bff' }}>
                      🎵 For: {section.relevant_voices.map(trackNum => {
                        const voice = songDetails.voices.find(v => v.track_number === trackNum);
                        if (!voice) return `Track ${trackNum}`;
                        // Handle both old format (name) and new format (names array)
                        const voiceNames = voice.names || (voice.name ? [voice.name] : [`Track ${trackNum}`]);
                        return voiceNames.join('/');
                      }).join(', ')}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => onSectionSelect && onSectionSelect(section)}
                    style={{ 
                      padding: '4px 10px', 
                      background: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ▶ Play
                  </button>
                  <button 
                    onClick={() => handleDelete(section.id)}
                    style={{ 
                      padding: '4px 10px', 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PracticeSections;
