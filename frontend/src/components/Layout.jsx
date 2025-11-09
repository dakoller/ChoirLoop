import { useState } from 'react';

function Layout({ 
  songs, 
  selectedSong, 
  onSongSelect, 
  onCreateSong,
  selectedVoice,
  onVoiceSelect,
  availableVoices,
  children 
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSong, setNewSong] = useState({ title: '', description: '' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateSong(newSong);
    setNewSong({ title: '', description: '' });
    setShowCreateForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Navigation */}
      <div style={{ 
        padding: '15px 20px', 
        background: '#007bff', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🎵 ChoirLoop</h1>
        
        {availableVoices && availableVoices.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 'bold' }}>🎤 My Voice:</label>
            <select
              value={selectedVoice || ''}
              onChange={(e) => onVoiceSelect(e.target.value || null)}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                borderRadius: '4px',
                border: 'none',
                minWidth: '150px',
                fontWeight: 'bold'
              }}
            >
              <option value="">Select your part...</option>
              {availableVoices.map((voice) => (
                <option key={voice.track_number} value={voice.track_number}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Song List */}
        <div style={{ 
          width: isSidebarCollapsed ? '50px' : '300px', 
          background: '#f8f9fa', 
          borderRight: '1px solid #ddd',
          overflow: isSidebarCollapsed ? 'hidden' : 'auto',
          padding: isSidebarCollapsed ? '10px' : '20px',
          transition: 'width 0.3s ease, padding 0.3s ease'
        }}>
          {/* Toggle Button */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Expand song list' : 'Collapse song list'}
              style={{
                width: '100%',
                padding: '10px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '18px'
              }}
            >
              {isSidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {showCreateForm ? '✖ Cancel' : '+ Create New Song'}
                </button>
              </div>
            </>
          )}

          {!isSidebarCollapsed && (
            <>
              {showCreateForm && (
                <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
                  <input
                    type="text"
                    placeholder="Song Title"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <textarea
                    placeholder="Description"
                    value={newSong.description}
                    onChange={(e) => setNewSong({ ...newSong, description: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px' }}
                  />
                  <button 
                    type="submit"
                    style={{ width: '100%', padding: '8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Create
                  </button>
                </form>
              )}

              <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#333' }}>Songs ({songs.length})</h3>
              
              {songs.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>No songs yet. Create one above!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {songs.map(song => (
                    <div
                      key={song.id}
                      onClick={() => onSongSelect(song.id)}
                      style={{
                        padding: '12px',
                        background: selectedSong === song.id ? '#007bff' : 'white',
                        color: selectedSong === song.id ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: selectedSong === song.id ? '2px solid #0056b3' : '1px solid #ddd',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{song.title}</div>
                      {song.description && (
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>{song.description}</div>
                      )}
                      <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.7 }}>
                        {new Date(song.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
