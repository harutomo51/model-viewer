const config = require('../config/config');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // エラーをログに記録
    logger.error('エラーが発生しました:', {
        error: err.message,
        stack: config.isDevelopment ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // クライアントへのレスポンス
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 && !config.isDevelopment
        ? 'サーバーエラーが発生しました。'
        : err.message;

    res.status(statusCode).json({
        error: message,
        details: config.isDevelopment ? err.stack : undefined
    });
};

module.exports = errorHandler; 