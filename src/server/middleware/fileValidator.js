const path = require('path');
const config = require('../config/config');

const fileValidator = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'ファイルがアップロードされていません。'
        });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // ファイル形式の検証
    if (!config.allowedFileTypes.includes(fileExtension)) {
        return res.status(400).json({
            error: `許可されているファイル形式は ${config.allowedFileTypes.join(', ')} のみです。`
        });
    }

    // ファイルサイズの検証
    if (req.file.size > config.maxFileSize) {
        return res.status(400).json({
            error: `ファイルサイズは ${config.maxFileSize / 1024 / 1024}MB 以下にしてください。`
        });
    }

    next();
};

module.exports = fileValidator; 