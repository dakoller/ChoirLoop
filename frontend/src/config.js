const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173',
  
  // Helper to get the API server base (without /api)
  getApiServerUrl: function() {
    return this.apiBaseUrl.replace('/api', '');
  },
  
  // Helper for deeplinks (future feature)
  createDeeplink: function(songId, sectionId = null) {
    if (sectionId) {
      return `${this.appBaseUrl}/song/${songId}/section/${sectionId}`;
    }
    return `${this.appBaseUrl}/song/${songId}`;
  }
};

export default config;
