const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// ログフォーマットの定義
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// ログファイルの設定
const logger = winston.createLogger({
    level: config.isDevelopment ? 'debug' : 'info',
    format: logFormat,
    transports: [
        // エラーログ
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error'
        }),
        // 全てのログ
        new winston.transports.File({
            filename: path.join('logs', 'combined.log')
        })
    ]
});

// 開発環境の場合はコンソールにも出力
if (config.isDevelopment) {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger; 