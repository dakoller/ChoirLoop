import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import FileUpload from './FileUpload';
import PracticeSections from './PracticeSections';
import AudioPlayer from './AudioPlayer';
import VoiceConfiguration from './VoiceConfiguration';

function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSong, setNewSong] = useState({ title: '', description: '' });
  const [selectedSong, setSelectedSong] = useState(null);
  const [songDetails, setSongDetails] = useState(null);
  const [selectedPracticeSection, setSelectedPracticeSection] = useState(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    if (selectedSong) {
      fetchSongDetails(selectedSong);
    }
  }, [selectedSong]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/songs');
      setSongs(response.data.songs);
      setError(null);
    } catch (err) {
      setError('Failed to fetch songs: ' + err.message);
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSongDetails = async (songId) => {
    try {
      const response = await apiClient.get(`/songs/${songId}`);
      setSongDetails(response.data.song);
    } catch (err) {
      setError('Failed to fetch song details: ' + err.message);
      console.error('Error fetching song details:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/songs', newSong);
      setNewSong({ title: '', description: '' });
      fetchSongs();
    } catch (err) {
      setError('Failed to create song: ' + err.message);
      console.error('Error creating song:', err);
    }
  };

  const handleDelete = async (songId) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      await apiClient.delete(`/songs/${songId}`);
      if (selectedSong === songId) {
        setSelectedSong(null);
        setSongDetails(null);
      }
      fetchSongs();
    } catch (err) {
      setError('Failed to delete song: ' + err.message);
      console.error('Error deleting song:', err);
    }
  };

  const handleViewDetails = (songId) => {
    setSelectedSong(songId);
  };

  const handleBackToList = () => {
    setSelectedSong(null);
    setSongDetails(null);
    setSelectedPracticeSection(null);
  };

  const handleSectionSelect = (section) => {
    setSelectedPracticeSection(section);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading songs...</div>;

  // Detail view
  if (selectedSong && songDetails) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <button 
          onClick={handleBackToList}
          style={{ padding: '8px 16px', marginBottom: '20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Songs
        </button>

        <h1>{songDetails.title}</h1>
        {songDetails.description && <p style={{ color: '#666' }}>{songDetails.description}</p>}
        
        <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Song Information</h3>
          <p><strong>ID:</strong> {songDetails.id}</p>
          <p><strong>MIDI File:</strong> {songDetails.midi_file || 'Not uploaded'}</p>
          <p><strong>Score:</strong> {songDetails.score_file || 'Not uploaded'}</p>
          <p><strong>Voices:</strong> {songDetails.voices.length > 0 ? songDetails.voices.join(', ') : 'None configured'}</p>
          <p><strong>Practice Sections:</strong> {songDetails.practice_sections?.length || 0}</p>
        </div>

        <FileUpload 
          songId={selectedSong} 
          onUploadComplete={() => fetchSongDetails(selectedSong)} 
        />

        {songDetails.midi_file && (
          <VoiceConfiguration 
            songId={selectedSong}
            songDetails={songDetails}
            onConfigurationSaved={() => fetchSongDetails(selectedSong)}
          />
        )}

        <AudioPlayer 
          songId={selectedSong} 
          songDetails={songDetails}
          selectedSection={selectedPracticeSection}
          onSectionChange={setSelectedPracticeSection}
        />

        <PracticeSections 
          songId={selectedSong}
          onSectionSelect={handleSectionSelect}
        />

        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => handleDelete(songDetails.id)}
            style={{ 
              padding: '10px 20px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Delete Song
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>ChoirLoop - Song Management</h1>
      
      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '20px', background: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Add New Song</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Song Title"
              value={newSong.title}
              onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Description (optional)"
              value={newSong.description}
              onChange={(e) => setNewSong({ ...newSong, description: e.target.value })}
              style={{ width: '100%', padding: '8px', fontSize: '16px', minHeight: '80px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <button 
            type="submit"
            style={{ padding: '10px 20px', fontSize: '16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Create Song
          </button>
        </form>
      </div>

      <h2>Songs ({songs.length})</h2>
      
      {songs.length === 0 ? (
        <p>No songs yet. Create one above!</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {songs.map(song => (
            <div 
              key={song.id} 
              style={{ 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                background: 'white'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{song.title}</h3>
              {song.description && <p style={{ color: '#666', margin: '0 0 10px 0' }}>{song.description}</p>}
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                Updated: {new Date(song.updated_at).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleViewDetails(song.id)}
                  style={{ 
                    padding: '6px 12px', 
                    background: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleDelete(song.id)}
                  style={{ 
                    padding: '6px 12px', 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SongList;
