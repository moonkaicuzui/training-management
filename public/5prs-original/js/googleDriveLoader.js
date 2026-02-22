/**
 * Google Drive Loader - Cloud Functions를 통한 Google Drive 데이터 로딩
 */

import { state } from './state.js';
import { processData } from './dataProcessor.js';
import { initializeDashboard } from './uiController.js';

const API_BASE = '/api/drive';

// ============================================================
// Column Name Mapping
// ============================================================

const COLUMN_MAPPING = {
    'Inspection Date': ['Inspection Date', 'inspection date', 'Date'],
    'Inspector ID': ['Inspector ID', 'inspector id', 'Auditor ID'],
    'Inspector Name': ['Inspector Name', 'inspector name', 'Auditor Name'],
    'Time': ['Time', 'time', 'Shift'],
    'Building': ['Building', 'building', 'Area'],
    'Line': ['Line', 'line', 'Production Line'],
    'PO No': ['PO No', 'PO Number', 'po no', 'PO'],
    'PO Item': ['PO Item', 'po item'],
    'Model': ['Model', 'model', 'Style'],
    'TQC ID': ['TQC ID', 'tqc id', 'QC ID'],
    'TQC Name': ['TQC Name', 'tqc name', 'QC Name'],
    'Validation Qty': ['Validation Qty', 'Valiation Qty', 'validation qty', 'Validated Qty'],
    'Pass Qty': ['Pass Qty', 'pass qty', 'Passed Qty'],
    'Reject Qty': ['Reject Qty', 'reject qty', 'Rejected Qty'],
    'Error': ['Error', 'error', 'Defect', 'Defect Type']
};

function mapColumnNames(data) {
    const findKeyInRow = (rowObject, possibleNames) => {
        for (const key in rowObject) {
            if (Object.prototype.hasOwnProperty.call(rowObject, key)) {
                const trimmedKey = key.trim();
                if (possibleNames.includes(trimmedKey)) {
                    return key;
                }
            }
        }
        return null;
    };

    return data.map(row => {
        const newRow = {};
        for (const [standardName, possibleNames] of Object.entries(COLUMN_MAPPING)) {
            const key = findKeyInRow(row, possibleNames);
            if (key) {
                newRow[standardName] = row[key];
            }
        }
        return newRow;
    });
}

// ============================================================
// UI Helpers
// ============================================================

function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const container = document.getElementById('errorContainer');
    const text = document.getElementById('errorText');
    if (container && text) {
        text.textContent = message;
        container.style.display = 'block';
        setTimeout(() => { container.style.display = 'none'; }, 8000);
    }
    console.error('Google Drive Loader:', message);
}

function updateDriveStatus(message, type = 'info') {
    const statusEl = document.getElementById('driveStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `drive-status drive-status-${type}`;
    }
}

// ============================================================
// API Functions
// ============================================================

export async function loadAvailableMonths() {
    try {
        const response = await fetch(`${API_BASE}/months`);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load months');
        }

        const selector = document.getElementById('driveMonthSelector');
        if (selector) {
            selector.innerHTML = '';

            const latestOption = document.createElement('option');
            latestOption.value = 'latest';
            latestOption.textContent = '최신 데이터';
            selector.appendChild(latestOption);

            for (const month of result.months) {
                const option = document.createElement('option');
                option.value = month.year_month;
                option.textContent = month.label;
                selector.appendChild(option);
            }
        }

        updateDriveStatus(`${result.total}개 월 데이터 사용 가능`, 'success');
        return result.months;

    } catch (error) {
        console.error('Failed to load months:', error);
        updateDriveStatus('월 목록 조회 실패', 'error');
        return [];
    }
}

/**
 * @param {string} yearMonth - "YYYY_MM" or "latest"
 */
export async function loadGoogleDriveData(yearMonth = 'latest') {
    showLoading(true);
    updateDriveStatus('데이터 로딩 중...', 'loading');

    try {
        const endpoint = yearMonth === 'latest'
            ? `${API_BASE}/latest`
            : `${API_BASE}/data/${yearMonth}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.success || !result.data || result.data.length === 0) {
            throw new Error(result.error || '데이터가 없습니다');
        }

        const mappedData = mapColumnNames(result.data);

        state.rawData = mappedData;
        processData();
        initializeDashboard();

        document.dispatchEvent(new CustomEvent('dashboardDataLoaded', {
            detail: { year: result.year, month: result.month }
        }));

        const selector = document.getElementById('driveMonthSelector');
        if (selector) {
            const ym = `${result.year}_${String(result.month).padStart(2, '0')}`;
            selector.value = ym;
        }

        updateDriveStatus(`${result.year}년 ${result.month}월 데이터 로드 완료 (${result.row_count}행)`, 'success');

    } catch (error) {
        console.error('Data load failed:', error);
        showError(`데이터 로드 실패: ${error.message}`);
        updateDriveStatus('데이터 로드 실패', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================================
// Initialization
// ============================================================

export async function initGoogleDriveLoader() {
    await loadAvailableMonths();

    const selector = document.getElementById('driveMonthSelector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            loadGoogleDriveData(e.target.value);
        });
    }

    const loadBtn = document.getElementById('driveLoadBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const sel = document.getElementById('driveMonthSelector');
            loadGoogleDriveData(sel ? sel.value : 'latest');
        });
    }

    await loadGoogleDriveData('latest');
}
