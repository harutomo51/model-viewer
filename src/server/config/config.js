require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.glb'],
    isDevelopment: process.env.NODE_ENV === 'development'
}; 