const fs = require('fs');
const path = require('path');

// ディレクトリパスの設定
const sourceDir = path.join(__dirname, '../node_modules/@google/model-viewer/dist');
const targetDir = path.join(__dirname, '../src/public/js/model-viewer');

// ターゲットディレクトリの作成
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 必要なファイルをコピー
const filesToCopy = ['model-viewer.min.js'];

filesToCopy.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file} to ${targetPath}`);
}); 