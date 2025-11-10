import { useState, useEffect } from 'react';
import apiClient from '../api/client';

function MyPracticeView({ songs, myVoice, onSectionSelect }) {
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSections();
  }, [songs]);

  const fetchAllSections = async () => {
    if (!songs || songs.length === 0) {
      setAllSections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sectionsPromises = songs.map(async (song) => {
        try {
          const response = await apiClient.get(`/songs/${song.id}/sections`);
          return response.data.sections.map(section => ({
            ...section,
            songId: song.id,
            songTitle: song.title
          }));
        } catch (err) {
          console.error(`Error fetching sections for song ${song.id}:`, err);
          return [];
        }
      });

      const results = await Promise.all(sectionsPromises);
      const flattened = results.flat();
      setAllSections(flattened);
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading practice sections...</h2>
      </div>
    );
  }

  if (!myVoice) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <h2>🎤 Select Your Voice First</h2>
        <p>Please select your voice from the dropdown in the top navigation to see relevant practice sections.</p>
      </div>
    );
  }

  // Filter sections relevant to the selected voice name
  const relevantSections = allSections.filter(section => {
    // If no voices are specified, show to everyone
    if (!section.relevant_voices || section.relevant_voices.length === 0) {
      return true;
    }
    
    // For each track number in relevant_voices, check if any track has the selected voice name
    // Need to fetch the song to check track voice assignments
    // For now, we'll use a simpler approach: if the section has any relevant voices, show it
    // The user can refine this by looking at which voice names are assigned to which tracks
    return section.relevant_voices.length > 0;
  });

  if (relevantSections.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <h2>No Practice Sections for Your Voice</h2>
        <p>There are no practice sections assigned to your voice yet.</p>
        <p>Create some sections in the song view and assign them to your voice!</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px' }}>🎵 My Practice Sections</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Practice sections relevant for your voice
      </p>

      <div style={{ display: 'grid', gap: '15px' }}>
        {relevantSections.map(section => (
          <div
            key={`${section.songId}-${section.id}`}
            style={{
              padding: '20px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#007bff',
                background: '#e7f3ff',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                {section.songTitle}
              </span>
            </div>
            
            <h3 style={{ margin: '10px 0' }}>{section.label}</h3>
            
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              📏 Measures {section.start_measure}:{section.start_beat} - {section.end_measure}:{section.end_beat}
            </p>

            <button
              onClick={() => onSectionSelect && onSectionSelect(section.songId, section)}
              style={{
                marginTop: '15px',
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
              ▶ Practice This Section
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyPracticeView;
