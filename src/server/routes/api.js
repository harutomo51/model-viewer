const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const fileValidator = require('../middleware/fileValidator');
const logger = require('../utils/logger');

// アップロードディレクトリの絶対パスを取得
const uploadDir = path.join(__dirname, '../../../', config.uploadDir);

// multerの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // ディレクトリの存在を確認
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.maxFileSize
    }
});

// ファイルアップロードエンドポイント
router.post('/upload', upload.single('model'), fileValidator, async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('ファイルのアップロードに失敗しました。');
        }

        // ファイルのURLを生成
        const fileUrl = `/uploads/${req.file.filename}`;

        // ログ記録
        logger.info('ファイルがアップロードされました', {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path
        });

        res.json({
            message: 'ファイルのアップロードが完了しました。',
            url: fileUrl
        });
    } catch (error) {
        logger.error('アップロードエラー:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router; 