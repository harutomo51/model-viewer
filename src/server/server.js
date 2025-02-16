const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const config = require('./config/config');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// アップロードディレクトリの確認と作成
const uploadDir = path.join(__dirname, '../../', config.uploadDir);

// アップロードディレクトリ内のファイルを削除する関数
const cleanUploadDirectory = () => {
    if (fs.existsSync(uploadDir)) {
        fs.readdirSync(uploadDir).forEach(file => {
            // .gitkeepファイルは削除しない
            if (file !== '.gitkeep') {
                const filePath = path.join(uploadDir, file);
                fs.unlinkSync(filePath);
                logger.info(`ファイルを削除しました: ${file}`);
            }
        });
        logger.info('アップロードディレクトリをクリーンアップしました');
    }
};

// アップロードディレクトリの初期化
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`アップロードディレクトリを作成しました: ${uploadDir}`);
} else {
    // 既存のアップロードディレクトリをクリーンアップ
    cleanUploadDirectory();
}

// ミドルウェアの設定
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// アップロードされたファイルへのアクセス設定
app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
    setHeaders: (res, filePath, stat) => {
        // CORS関連のヘッダー
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
        res.set('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
        
        // セキュリティ関連のヘッダー
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Cross-Origin-Embedder-Policy', 'require-corp');
        res.set('Cross-Origin-Opener-Policy', 'same-origin');
        
        // キャッシュと範囲リクエスト
        res.set('Accept-Ranges', 'bytes');
        res.set('Cache-Control', 'public, max-age=31536000');
        
        // コンテンツタイプの設定
        if (filePath.endsWith('.glb')) {
            res.set('Content-Type', 'model/gltf-binary');
        }
    },
    maxAge: '1y',
    etag: true,
    lastModified: true
}));

// APIルート
app.use('/api', apiRoutes);

// エラーハンドリング
app.use(errorHandler);

// サーバーの起動
const server = app.listen(config.port, () => {
    logger.info(`サーバーが起動しました - http://localhost:${config.port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`ポート ${config.port} は既に使用されています。`);
        process.exit(1);
    } else {
        logger.error('サーバー起動時にエラーが発生しました:', err);
        process.exit(1);
    }
}); 