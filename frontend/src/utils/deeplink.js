/**
 * Deeplink utility for creating and parsing shareable practice session links
 */

import config from '../config';

/**
 * Creates a deeplink URL from current practice settings
 * @param {Object} settings - Practice session settings
 * @param {string} settings.songId - Song ID
 * @param {string} settings.voiceId - Selected voice track number
 * @param {string} settings.sectionId - Selected practice section ID (optional)
 * @param {number} settings.tempo - Tempo percentage (50-150)
 * @param {Object} settings.volumes - Track volumes object {trackNumber: volumeDb}
 * @param {string} settings.practiceMode - Practice mode ('manual' or 'guided')
 * @param {number} settings.guidedStep - Guided step (1-3) if in guided mode
 * @param {Object} settings.enabledTracks - Enabled tracks object {trackNumber: boolean}
 * @returns {string} Complete deeplink URL
 */
export function createDeeplink(settings) {
  const params = new URLSearchParams();
  
  // Required: song ID
  if (settings.songId) {
    params.set('song', settings.songId);
  }
  
  // Optional: selected voice
  if (settings.voiceId) {
    params.set('voice', settings.voiceId);
  }
  
  // Optional: practice section
  if (settings.sectionId) {
    params.set('section', settings.sectionId);
  }
  
  // Optional: tempo (only if not default 100)
  if (settings.tempo && settings.tempo !== 100) {
    params.set('tempo', settings.tempo);
  }
  
  // Optional: practice mode (only if not default 'manual')
  if (settings.practiceMode && settings.practiceMode !== 'manual') {
    params.set('mode', settings.practiceMode);
  }
  
  // Optional: guided step (only if in guided mode)
  if (settings.practiceMode === 'guided' && settings.guidedStep) {
    params.set('step', settings.guidedStep);
  }
  
  // Optional: volume settings (compact format)
  if (settings.volumes && Object.keys(settings.volumes).length > 0) {
    const volumeStr = Object.entries(settings.volumes)
      .map(([track, vol]) => `${track}:${vol}`)
      .join(',');
    params.set('volumes', volumeStr);
  }
  
  // Optional: enabled tracks (only include disabled ones for compact format)
  if (settings.enabledTracks) {
    const disabledTracks = Object.entries(settings.enabledTracks)
      .filter(([_, enabled]) => !enabled)
      .map(([track, _]) => track)
      .join(',');
    if (disabledTracks) {
      params.set('disabled', disabledTracks);
    }
  }
  
  const baseUrl = config.appBaseUrl;
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parses a deeplink URL to extract practice settings
 * @param {string} url - Full URL or search params string
 * @returns {Object|null} Parsed settings or null if invalid
 */
export function parseDeeplink(url = window.location.search) {
  try {
    const params = new URLSearchParams(url);
    
    const settings = {};
    
    // Parse song ID (required)
    if (params.has('song')) {
      settings.songId = params.get('song');
    } else {
      return null; // No song ID means invalid deeplink
    }
    
    // Parse voice
    if (params.has('voice')) {
      settings.voiceId = params.get('voice');
    }
    
    // Parse section
    if (params.has('section')) {
      settings.sectionId = params.get('section');
    }
    
    // Parse tempo
    if (params.has('tempo')) {
      const tempo = parseInt(params.get('tempo'));
      if (!isNaN(tempo) && tempo >= 50 && tempo <= 150) {
        settings.tempo = tempo;
      }
    }
    
    // Parse practice mode
    if (params.has('mode')) {
      const mode = params.get('mode');
      if (mode === 'manual' || mode === 'guided') {
        settings.practiceMode = mode;
      }
    }
    
    // Parse guided step
    if (params.has('step')) {
      const step = parseInt(params.get('step'));
      if (!isNaN(step) && step >= 1 && step <= 3) {
        settings.guidedStep = step;
      }
    }
    
    // Parse volumes
    if (params.has('volumes')) {
      const volumesStr = params.get('volumes');
      const volumes = {};
      volumesStr.split(',').forEach(entry => {
        const [track, vol] = entry.split(':');
        const trackNum = parseInt(track);
        const volNum = parseInt(vol);
        if (!isNaN(trackNum) && !isNaN(volNum)) {
          volumes[trackNum] = volNum;
        }
      });
      if (Object.keys(volumes).length > 0) {
        settings.volumes = volumes;
      }
    }
    
    // Parse disabled tracks
    if (params.has('disabled')) {
      const disabledStr = params.get('disabled');
      const enabledTracks = {};
      disabledStr.split(',').forEach(track => {
        const trackNum = parseInt(track);
        if (!isNaN(trackNum)) {
          enabledTracks[trackNum] = false;
        }
      });
      if (Object.keys(enabledTracks).length > 0) {
        settings.enabledTracks = enabledTracks;
      }
    }
    
    return settings;
  } catch (err) {
    console.error('Failed to parse deeplink:', err);
    return null;
  }
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
