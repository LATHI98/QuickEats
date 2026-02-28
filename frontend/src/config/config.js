// Frontend configuration
const config = {
  // API URL - Update this to match your backend server URL
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // Other configuration options can be added here
  // For example:
  // MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  // SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif']
};

export default config;
