import { useState, useEffect } from 'react';
import apiClient from '../api/client';

function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSong, setNewSong] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchSongs();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/songs', newSong);
      setNewSong({ title: '', description: '' });
      fetchSongs(); // Refresh the list
    } catch (err) {
      setError('Failed to create song: ' + err.message);
      console.error('Error creating song:', err);
    }
  };

  const handleDelete = async (songId) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      await apiClient.delete(`/songs/${songId}`);
      fetchSongs(); // Refresh the list
    } catch (err) {
      setError('Failed to delete song: ' + err.message);
      console.error('Error deleting song:', err);
    }
  };

  if (loading) return <div>Loading songs...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>ChoirLoop - Song Management</h1>
      
      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '20px', background: '#fee' }}>
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
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Description (optional)"
              value={newSong.description}
              onChange={(e) => setNewSong({ ...newSong, description: e.target.value })}
              style={{ width: '100%', padding: '8px', fontSize: '16px', minHeight: '80px' }}
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
          ))}
        </div>
      )}
    </div>
  );
}

export default SongList;
