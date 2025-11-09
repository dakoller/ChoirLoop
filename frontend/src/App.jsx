import { useState, useEffect } from 'react';
import apiClient from './api/client';
import Layout from './components/Layout';
import PracticeView from './components/PracticeView';
import DeeplinkDisplay from './components/DeeplinkDisplay';
import { parseDeeplink } from './utils/deeplink';
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songDetails, setSongDetails] = useState(null);
  const [myVoice, setMyVoice] = useState(null);
  const [error, setError] = useState(null);
  const [deeplinkSettings, setDeeplinkSettings] = useState(null);
  const [audioPlayerState, setAudioPlayerState] = useState(null);

  useEffect(() => {
    // Check for deeplink parameters
    const parsedSettings = parseDeeplink();
    if (parsedSettings) {
      setDeeplinkSettings(parsedSettings);
      // Pre-select song from deeplink
      if (parsedSettings.songId) {
        setSelectedSong(parsedSettings.songId);
      }
      // Pre-select voice from deeplink
      if (parsedSettings.voiceId) {
        setMyVoice(parsedSettings.voiceId);
      }
    }
    
    fetchSongs();
  }, []);

  useEffect(() => {
    if (selectedSong) {
      fetchSongDetails(selectedSong);
    } else {
      setSongDetails(null);
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

  const handleCreateSong = async (newSongData) => {
    try {
      const response = await apiClient.post('/songs', newSongData);
      await fetchSongs();
      // Auto-select the newly created song
      setSelectedSong(response.data.song.id);
    } catch (err) {
      setError('Failed to create song: ' + err.message);
      console.error('Error creating song:', err);
    }
  };

  const handleDeleteSong = async (songId) => {
    try {
      await apiClient.delete(`/songs/${songId}`);
      if (selectedSong === songId) {
        setSelectedSong(null);
      }
      await fetchSongs();
    } catch (err) {
      setError('Failed to delete song: ' + err.message);
      console.error('Error deleting song:', err);
    }
  };

  const handleSongUpdate = () => {
    if (selectedSong) {
      fetchSongDetails(selectedSong);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading ChoirLoop...</h2>
      </div>
    );
  }

  return (
    <Layout
      songs={songs}
      selectedSong={selectedSong}
      onSongSelect={setSelectedSong}
      onCreateSong={handleCreateSong}
      selectedVoice={myVoice}
      onVoiceSelect={setMyVoice}
      availableVoices={songDetails?.voices}
    >
      {error && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          background: '#fee', 
          color: '#c00',
          borderRadius: '8px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      <PracticeView
        songId={selectedSong}
        songDetails={songDetails}
        onSongUpdate={handleSongUpdate}
        onDelete={handleDeleteSong}
        myVoice={myVoice}
        deeplinkSettings={deeplinkSettings}
        onAudioPlayerStateChange={setAudioPlayerState}
      />
      
      <DeeplinkDisplay 
        songId={selectedSong}
        voiceId={myVoice}
        sectionId={audioPlayerState?.sectionId}
        tempo={audioPlayerState?.tempo}
        volumes={audioPlayerState?.volumes}
        practiceMode={audioPlayerState?.practiceMode}
        guidedStep={audioPlayerState?.guidedStep}
        enabledTracks={audioPlayerState?.enabledTracks}
      />
    </Layout>
  );
}

export default App;
