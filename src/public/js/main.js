class ModelViewer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadThemePreference();
        this.loadEnvironmentPreference();
    }

    initializeElements() {
        // DOM要素の取得
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = this.uploadProgress.querySelector('.progress-fill');
        this.progressText = this.uploadProgress.querySelector('.progress-text');
        this.modelViewer = document.getElementById('modelViewer');
        this.viewerSection = document.querySelector('.viewer-section');
        this.resetCameraBtn = document.getElementById('resetCamera');
        this.notification = document.getElementById('notification');
        this.notificationMessage = this.notification.querySelector('.notification-message');
        this.notificationClose = this.notification.querySelector('.notification-close');

        // テーマ切り替え要素
        this.themeToggle = document.getElementById('themeToggle');

        // 露光コントロール要素
        this.exposureSlider = document.getElementById('exposureSlider');
        this.exposureInput = document.getElementById('exposureInput');

        // 環境マップ選択要素
        this.environmentSelect = document.getElementById('environmentSelect');
    }

    bindEvents() {
        // ドラッグ&ドロップイベント
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));

        // ファイル選択イベント
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // カメラリセットイベント
        this.resetCameraBtn.addEventListener('click', this.resetCamera.bind(this));

        // 通知閉じるイベント
        this.notificationClose.addEventListener('click', () => this.hideNotification());

        // テーマ切り替えイベント
        this.themeToggle.addEventListener('change', this.handleThemeChange.bind(this));

        // 露光コントロールイベント
        this.exposureSlider.addEventListener('input', this.handleExposureChange.bind(this));
        this.exposureInput.addEventListener('change', this.handleExposureChange.bind(this));
        this.exposureInput.addEventListener('input', this.validateExposureInput.bind(this));

        // 環境マップ変更イベント
        this.environmentSelect.addEventListener('change', this.handleEnvironmentChange.bind(this));
    }

    loadThemePreference() {
        // ローカルストレージからテーマ設定を読み込む
        const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
        this.themeToggle.checked = isDarkTheme;
        this.applyTheme(isDarkTheme);
    }

    loadEnvironmentPreference() {
        // ローカルストレージから環境マップ設定を読み込む（デフォルトをneutralに変更）
        const savedEnvironment = localStorage.getItem('environment') || 'neutral';
        this.environmentSelect.value = savedEnvironment;
        this.applyEnvironment(savedEnvironment);
    }

    handleThemeChange(e) {
        const isDarkTheme = e.target.checked;
        this.applyTheme(isDarkTheme);
        localStorage.setItem('darkTheme', isDarkTheme);
    }

    applyTheme(isDarkTheme) {
        if (isDarkTheme) {
            this.modelViewer.style.backgroundColor = '#1a1a1a';
        } else {
            this.modelViewer.style.backgroundColor = '#f0f0f0';
        }
    }

    handleEnvironmentChange(e) {
        const environment = e.target.value;
        this.applyEnvironment(environment);
        localStorage.setItem('environment', environment);
    }

    applyEnvironment(environment) {
        // 環境マップを直接適用（すべて定義済みの値）
        this.modelViewer.environmentImage = environment;
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        this.processFile(file);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        this.processFile(file);
    }

    processFile(file) {
        if (!file) return;

        // ファイル形式の検証
        if (!file.name.toLowerCase().endsWith('.glb')) {
            this.showNotification('GLB形式のファイルのみアップロード可能です。', 'error');
            return;
        }

        // ファイルサイズの検証（10MB制限）
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('ファイルサイズは10MB以下にしてください。', 'error');
            return;
        }

        this.uploadFile(file);
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('model', file);

        this.uploadProgress.hidden = false;
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    this.updateProgress(progress);
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'アップロードに失敗しました。');
            }

            const data = await response.json();
            console.log('アップロード成功:', data);
            
            if (!data.url) {
                throw new Error('サーバーからモデルのURLが返されませんでした。');
            }

            this.showModel(data.url);
            this.showNotification('ファイルのアップロードが完了しました。', 'success');
        } catch (error) {
            console.error('アップロードエラー:', error);
            this.showNotification(`アップロードエラー: ${error.message}`, 'error');
        } finally {
            this.uploadProgress.hidden = true;
            this.resetProgress();
        }
    }

    updateProgress(progress) {
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${Math.round(progress)}%`;
    }

    resetProgress() {
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '0%';
    }

    showModel(url) {
        // URLが相対パスの場合、絶対URLに変換
        const absoluteUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
        console.log('モデルを読み込み中:', absoluteUrl);

        // ビューアーセクションを表示
        this.viewerSection.hidden = false;

        // イベントリスナーを設定
        this.modelViewer.addEventListener('error', (error) => {
            console.error('Model Viewer エラー:', error.detail);
            this.showNotification('モデルの読み込みに失敗しました。', 'error');
        });

        this.modelViewer.addEventListener('load', () => {
            console.log('モデルの読み込みが完了しました');
            this.showNotification('モデルの読み込みが完了しました', 'success');
        });

        this.modelViewer.addEventListener('progress', (event) => {
            const progress = event.detail.totalProgress * 100;
            console.log(`モデル読み込み進捗: ${progress.toFixed(2)}%`);
        });

        // モデルのURLを設定
        this.modelViewer.src = absoluteUrl;
    }

    resetCamera() {
        this.modelViewer.cameraOrbit = '0deg 75deg 105%';
        this.modelViewer.fieldOfView = '30deg';
        
        // 露光をリセット
        this.exposureSlider.value = 1;
        this.exposureInput.value = 1;
        this.modelViewer.exposure = 1;
    }

    showNotification(message, type = 'success') {
        this.notificationMessage.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.hidden = false;

        // 3秒後に自動的に閉じる
        setTimeout(() => this.hideNotification(), 3000);
    }

    hideNotification() {
        this.notification.hidden = true;
    }

    handleExposureChange(e) {
        const value = parseFloat(e.target.value);
        if (isNaN(value) || value < 0 || value > 2) return;

        // 両方の入力を同期
        this.exposureSlider.value = value;
        this.exposureInput.value = value;

        // モデルビューアーの露光を更新
        this.modelViewer.exposure = value;
    }

    validateExposureInput(e) {
        let value = parseFloat(e.target.value);
        if (isNaN(value)) return;

        // 範囲内に収める
        value = Math.max(0, Math.min(2, value));
        e.target.value = value;
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new ModelViewer();
}); 