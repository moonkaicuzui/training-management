import { state } from './state.js';
import { processData } from './dataProcessor.js';
import * as fileHandler from './fileHandler.js';
import * as ui from './uiController.js';
import { initGoogleDriveLoader } from './googleDriveLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeLanguage();
        initializeFileUpload();
        initializeLanguageSelector();
        initializePeriodSelector();
        initializeTabSelector();
        initializeFilters();
        initializePdfExport();
        initializeModal();
        initializeDynamicContentEvents();
        initializeErrorHandlers();
        initializeErrorCloseButton();

        // Google Drive 로더 초기화 (main.js 초기화 완료 후 실행)
        setTimeout(() => initGoogleDriveLoader(), 100);
    } catch (error) {
        console.error('Application init error:', error);
        showErrorMessage('애플리케이션 초기화 중 오류가 발생했습니다.');
    }
});

function initializeLanguage() {
    ui.changeLanguageUI();
}

function initializeFileUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.querySelector('.upload-area');

    if (!uploadBtn || !fileInput || !uploadArea) return;

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => fileHandler.handleFileSelect(e));
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => fileHandler.handleDragOver(e));
    uploadArea.addEventListener('dragleave', (e) => fileHandler.handleDragLeave(e));
    uploadArea.addEventListener('drop', (e) => fileHandler.handleDrop(e));
}

function initializeLanguageSelector() {
    const langButtons = document.querySelectorAll('.lang-btn');
    if (langButtons.length === 0) return;

    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            try {
                const newLang = e.currentTarget.dataset.langCode;

                document.querySelector('.lang-btn.active')?.classList.remove('active');
                e.currentTarget.classList.add('active');
                state.currentLanguage = newLang;
                ui.changeLanguageUI();

                if (state.rawData && state.rawData.length > 0) {
                    ui.updateDashboard();
                }
            } catch (error) {
                console.error('Language change error:', error);
            }
        });
    });
}

function initializePeriodSelector() {
    const periodButtons = document.querySelectorAll('.period-btn');
    if (periodButtons.length === 0) return;

    periodButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            try {
                const newPeriod = e.currentTarget.dataset.period;

                document.querySelector('.period-btn.active')?.classList.remove('active');
                e.currentTarget.classList.add('active');
                state.currentPeriod = newPeriod;

                if (state.rawData && state.rawData.length > 0) {
                    processData();
                    ui.updateDashboard();
                }
            } catch (error) {
                console.error('Period change error:', error);
            }
        });
    });
}

function initializeTabSelector() {
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length === 0) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            try {
                const newTab = e.currentTarget.dataset.tab;

                document.querySelector('.tab-button.active')?.classList.remove('active');
                document.querySelector('.tab-panel.active')?.classList.remove('active');

                e.currentTarget.classList.add('active');

                const tabPanel = document.getElementById(`${newTab}-panel`);
                if (tabPanel) {
                    tabPanel.classList.add('active');
                }

                if (state.rawData && state.rawData.length > 0) {
                    ui.updateAllChartsAndTables();
                }
            } catch (error) {
                console.error('Tab change error:', error);
            }
        });
    });
}

function initializeFilters() {
    const tabSpecificFilters = [
        'trainingDefectFilter',
        'defectTypeDetailFilter',
        'modelFilter',
        'modelDefectTypeFilter',
        'defectsBuildingFilter',
        'overviewBuildingFilter',
        'sustainabilityTqcBuildingFilter'
    ];

    const commonFilters = document.querySelectorAll('.filter-select');

    commonFilters.forEach(select => {
        if (!tabSpecificFilters.includes(select.id)) {
            select.addEventListener('change', () => {
                try {
                    if (state.rawData && state.rawData.length > 0) {
                        ui.updateAllChartsAndTables();
                    }
                } catch (error) {
                    console.error('Filter change error:', error);
                }
            });
        }
    });
}

function initializePdfExport() {
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (!exportPdfBtn) return;

    exportPdfBtn.addEventListener('click', () => {
        try {
            if (typeof ui.exportToPDF === 'function') {
                ui.exportToPDF();
            } else {
                showInfoMessage('PDF 다운로드 기능은 곧 제공될 예정입니다.');
            }
        } catch (error) {
            console.error('PDF export error:', error);
            showErrorMessage('PDF 다운로드 중 오류가 발생했습니다.');
        }
    });
}

function initializeModal() {
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const detailModal = document.getElementById('detailModal');
    if (!modalCloseBtn || !detailModal) return;

    modalCloseBtn.addEventListener('click', () => ui.closeModal());

    detailModal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            ui.closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailModal.classList.contains('show')) {
            ui.closeModal();
        }
    });
}

function initializeDynamicContentEvents() {
    initializeTqcTableEvents();
    initializeDefectsHeatmapEvents();
    initializeTqcHeatmapEvents();
    initializeRiskAnalysisEvents();
    initializeActionsEvents();
}

function initializeTqcTableEvents() {
    const tqcTableBody = document.getElementById('tqcTableBody');
    if (!tqcTableBody) return;

    tqcTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('.tqc-row');
        if (row && row.dataset.tqcKey) {
            ui.showTQCDetail(row.dataset.tqcKey);
        }
    });
}

function initializeDefectsHeatmapEvents() {
    const defectsPanel = document.getElementById('defects-panel');
    if (!defectsPanel) return;

    defectsPanel.addEventListener('click', (e) => {
        const cell = e.target.closest('.heatmap-cell');
        if (cell && cell.dataset.type) {
            ui.showHeatmapDetail(cell.dataset.type, cell.dataset.item, cell.dataset.defect);
        }
    });
}

function initializeTqcHeatmapEvents() {
    const tqcPanel = document.getElementById('tqc-panel');
    if (!tqcPanel) return;

    tqcPanel.addEventListener('click', (e) => {
        const cell = e.target.closest('.heatmap-cell');
        if (cell && cell.dataset.type === 'tqc-defect') {
            ui.showTqcHeatmapDetail(cell.dataset.tqcKey, cell.dataset.defect);
        }
    });
}

function initializeRiskAnalysisEvents() {
    const riskPanel = document.getElementById('risk-panel');
    if (!riskPanel) return;

    riskPanel.addEventListener('click', e => {
        const item = e.target.closest('.risk-item');
        if (item && item.dataset.type && item.dataset.name) {
            ui.showRiskDetail(item.dataset.type, item.dataset.name);
        }
    });
}

function initializeActionsEvents() {
    const actionsPanel = document.getElementById('actions-panel');
    if (!actionsPanel) return;

    actionsPanel.addEventListener('click', e => {
        const item = e.target.closest('.risk-item');
        if (!item) return;

        const type = item.dataset.type;
        const name = item.dataset.name;

        if (type === 'TQC') {
            ui.showTQCDetail(name);
        } else if (type === 'PO') {
            ui.showRiskDetail('po', name);
        }
    });
}

function initializeErrorHandlers() {
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled rejection:', e.reason);
    });
}

function initializeErrorCloseButton() {
    const errorCloseBtn = document.getElementById('errorCloseBtn');
    if (errorCloseBtn) {
        errorCloseBtn.addEventListener('click', () => {
            const container = document.getElementById('errorContainer');
            if (container) container.style.display = 'none';
        });
    }
}

function showErrorMessage(message) {
    const container = document.getElementById('errorContainer');
    const text = document.getElementById('errorText');
    if (container && text) {
        text.textContent = message;
        container.style.display = 'block';
        setTimeout(() => { container.style.display = 'none'; }, 8000);
    }
}

function showInfoMessage(message) {
    const container = document.getElementById('errorContainer');
    const text = document.getElementById('errorText');
    if (container && text) {
        text.textContent = message;
        container.style.display = 'block';
        setTimeout(() => { container.style.display = 'none'; }, 5000);
    }
}
