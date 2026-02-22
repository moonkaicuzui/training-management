/**
 * AI Briefing Module - Gemini AI 품질 브리핑 팝업
 */

import { state } from './state.js';

const DISMISS_KEY = '5prs_ai_briefing_dismissed_at';
const DISMISS_DURATION = 60 * 60 * 1000;
const API_ENDPOINT = '/api/ai/briefing';
const FETCH_TIMEOUT_MS = 30000;

// ============================================================
// HTML Escaping (XSS prevention)
// ============================================================

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// Data Extraction
// ============================================================

function extractBriefingData() {
    const pd = state.processedData;
    if (!pd || typeof pd.totalValidation !== 'number' || pd.totalValidation === 0) return null;

    const today = new Date().toISOString().slice(0, 10);

    const dates = Object.keys(pd.dailyData || {})
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort();
    if (dates.length === 0) return null;

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const dateParts = lastDate.split('-');
    const yearMonth = `${dateParts[0]}_${dateParts[1]}`;

    const tqcEntries = Object.values(pd.tqcData || {})
        .filter(t => t && typeof t.totalValidation === 'number' && t.totalValidation >= 100 && t.totalReject > 0)
        .map(t => ({
            ...t,
            rejectRate: t.totalValidation > 0 ? (t.totalReject / t.totalValidation) * 100 : 0,
        }))
        .sort((a, b) => b.rejectRate - a.rejectRate)
        .slice(0, 5);

    const topTqcIssues = tqcEntries.map(t => {
        const defects = t.defectCounts || t.defects || {};
        const sortedDefects = Object.entries(defects)
            .sort(([, a], [, b]) => (b || 0) - (a || 0))
            .slice(0, 3)
            .map(([type, count]) => ({ type: String(type), count: Math.round(count || 0) }));
        return {
            name: String(t.name || 'Unknown'),
            id: String(t.id || 'N/A'),
            rejectRate: parseFloat((t.rejectRate || 0).toFixed(2)),
            totalReject: parseInt(t.totalReject || 0),
            totalValidation: parseInt(t.totalValidation || 0),
            buildings: Array.from(t.buildings || []).map(String),
            defects: sortedDefects,
            mainDefect: sortedDefects[0]?.type || 'N/A',
        };
    });

    const totalDefects = Object.values(pd.defectTypes || {})
        .reduce((sum, d) => sum + (typeof d === 'number' ? d : (d?.count || 0)), 0);

    const topDefects = Object.entries(pd.defectTypes || {})
        .filter(([, d]) => (typeof d === 'number' && d > 0) || (d && typeof d.count === 'number'))
        .map(([type, d]) => {
            const count = typeof d === 'number' ? d : (d.count || 0);
            return { type: String(type), count: Math.round(count), ratio: totalDefects > 0 ? parseFloat(((count / totalDefects) * 100).toFixed(1)) : 0 };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const buildingIssues = Object.entries(pd.buildingData || {})
        .filter(([, b]) => b && typeof b.totalValidation === 'number' && b.totalValidation > 0)
        .map(([building, b]) => ({
            building: String(building),
            rejectRate: parseFloat(((b.totalReject / b.totalValidation) * 100).toFixed(2)),
            totalValidation: parseInt(b.totalValidation || 0),
        }))
        .sort((a, b) => b.rejectRate - a.rejectRate);

    // Model-defect data
    const modelDefects = Object.entries(pd.modelData || {})
        .filter(([, m]) => m && m.totalReject > 0)
        .map(([model, m]) => {
            const rate = m.totalValidation > 0 ? (m.totalReject / m.totalValidation) * 100 : 0;
            const sortedDefects = Object.entries(m.defects || {})
                .sort(([, a], [, b]) => (b || 0) - (a || 0))
                .slice(0, 3)
                .map(([type, count]) => ({ type: String(type), count: Math.round(count || 0) }));
            return {
                model: String(model),
                rejectRate: parseFloat(rate.toFixed(2)),
                totalReject: parseInt(m.totalReject || 0),
                totalValidation: parseInt(m.totalValidation || 0),
                defects: sortedDefects,
            };
        })
        .sort((a, b) => b.rejectRate - a.rejectRate)
        .slice(0, 8);

    // Defect-to-model mapping (top 5 defects → which models)
    const defectModelMap = {};
    for (const [model, m] of Object.entries(pd.modelData || {})) {
        for (const [defect, count] of Object.entries(m.defects || {})) {
            if (!defectModelMap[defect]) defectModelMap[defect] = [];
            defectModelMap[defect].push({ model: String(model), count: Math.round(count || 0) });
        }
    }
    const topDefectModels = topDefects.slice(0, 5).map(d => ({
        type: d.type,
        models: (defectModelMap[d.type] || [])
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(m => ({ model: m.model, count: m.count })),
    }));

    const highRiskPOs = Object.entries(pd.poData || {})
        .filter(([, p]) => p && p.totalValidation > 0 && (p.totalReject / p.totalValidation) * 100 > 5)
        .sort(([, a], [, b]) => (b.totalReject / b.totalValidation) - (a.totalReject / a.totalValidation))
        .slice(0, 5)
        .map(([po]) => String(po));

    const highRiskBuildings = buildingIssues
        .filter(b => b.rejectRate > 3)
        .slice(0, 5)
        .map(b => b.building);

    const highRiskLines = Object.entries(pd.lineData || {})
        .filter(([, l]) => l && l.totalValidation > 0 && (l.totalReject / l.totalValidation) * 100 > 5)
        .sort(([, a], [, b]) => (b.totalReject / b.totalValidation) - (a.totalReject / a.totalValidation))
        .slice(0, 5)
        .map(([line]) => String(line));

    return {
        date: today,
        yearMonth,
        firstDate,
        lastDate,
        lang: state.currentLanguage || 'ko',
        stats: {
            totalValidation: parseInt(pd.totalValidation || 0),
            totalReject: parseInt(pd.totalReject || 0),
            totalRejectRate: parseFloat((pd.totalRejectRate || 0).toFixed(2)),
            avgDailyValidation: parseInt(pd.avgDailyValidation || 0),
        },
        topTqcIssues,
        topDefects,
        topDefectModels,
        modelDefects,
        buildingIssues: buildingIssues.slice(0, 10),
        riskItems: { highRiskPOs, highRiskBuildings, highRiskLines },
    };
}

// ============================================================
// API Call with timeout + retry
// ============================================================

async function fetchAiBriefing(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.success || !result.briefing) {
            throw new Error('Invalid AI response');
        }

        return result.briefing;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ============================================================
// Popup UI (XSS-safe rendering)
// ============================================================

function formatBriefingHtml(text) {
    // Escape HTML first, then apply safe markdown formatting
    let escaped = escapeHtml(text);
    return escaped
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.+)$/gm, '<h4 class="ai-heading">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 class="ai-heading">$1</h3>')
        .replace(/^[*\u2022\-]\s+/gm, '<span class="ai-bullet">&#8226;</span>')
        .replace(/^\d+\.\s+/gm, (m) => `<span class="ai-number">${escapeHtml(m.trim())}</span>`)
        .replace(/\n/g, '<br>');
}

function buildKpiCards(data) {
    const stats = data.stats;
    const lang = data.lang || 'ko';

    const labels = {
        ko: { validation: '총 검증량', rejectRate: '불량률', highRiskTqc: '고위험 TQC', topDefect: '최다 불량' },
        en: { validation: 'Total Validation', rejectRate: 'Reject Rate', highRiskTqc: 'High Risk TQC', topDefect: 'Top Defect' },
        vi: { validation: 'Tổng kiểm tra', rejectRate: 'Tỷ lệ lỗi', highRiskTqc: 'TQC rủi ro cao', topDefect: 'Lỗi hàng đầu' },
    };
    const l = labels[lang] || labels.ko;

    const highRiskCount = (data.topTqcIssues || []).filter(t => t.rejectRate > 5).length;
    const topDefectName = escapeHtml(data.topDefects?.[0]?.type || 'N/A');
    const rateClass = stats.totalRejectRate > 3 ? 'ai-kpi-danger' : stats.totalRejectRate > 1.5 ? 'ai-kpi-warning' : 'ai-kpi-good';

    return `
        <div class="ai-kpi-cards">
            <div class="ai-kpi-card">
                <div class="ai-kpi-label">${escapeHtml(l.validation)}</div>
                <div class="ai-kpi-value">${(stats.totalValidation || 0).toLocaleString()}</div>
            </div>
            <div class="ai-kpi-card ${rateClass}">
                <div class="ai-kpi-label">${escapeHtml(l.rejectRate)}</div>
                <div class="ai-kpi-value">${stats.totalRejectRate}%</div>
            </div>
            <div class="ai-kpi-card ${highRiskCount > 0 ? 'ai-kpi-danger' : 'ai-kpi-good'}">
                <div class="ai-kpi-label">${escapeHtml(l.highRiskTqc)}</div>
                <div class="ai-kpi-value">${highRiskCount}</div>
            </div>
            <div class="ai-kpi-card">
                <div class="ai-kpi-label">${escapeHtml(l.topDefect)}</div>
                <div class="ai-kpi-value ai-kpi-value-sm">${topDefectName}</div>
            </div>
        </div>
    `;
}

function showBriefingPopup(briefingText, data) {
    const modal = document.getElementById('aiBriefingModal');
    if (!modal) return;

    const lang = data.lang || 'ko';
    const titles = { ko: 'AI 품질 브리핑', en: 'AI Quality Briefing', vi: 'Tóm tắt chất lượng AI' };
    const dateLabels = { ko: '데이터 기준', en: 'Data Period', vi: 'Khoảng dữ liệu' };
    const dismissLabels = { ko: '1시간 후 다시 보기', en: 'Remind in 1 hour', vi: 'Nhắc sau 1 giờ' };
    const closeLabels = { ko: '확인', en: 'OK', vi: 'OK' };

    const yearMonth = data.yearMonth?.replace('_', '년 ') + '월' || '';
    const dateRange = (data.firstDate && data.lastDate) ? `${data.firstDate} ~ ${data.lastDate}` : '';

    const titleEl = modal.querySelector('.ai-briefing-title-text');
    if (titleEl) titleEl.textContent = titles[lang] || titles.ko;

    const dateEl = modal.querySelector('.ai-briefing-date');
    if (dateEl) dateEl.textContent = `${dateLabels[lang] || dateLabels.ko}: ${yearMonth} | ${dateRange}`;

    const kpiContainer = modal.querySelector('.ai-kpi-container');
    if (kpiContainer) kpiContainer.innerHTML = buildKpiCards(data);

    const contentEl = modal.querySelector('.ai-analysis-content');
    if (contentEl) contentEl.innerHTML = formatBriefingHtml(briefingText);

    const dismissBtn = document.getElementById('aiBriefingDismiss');
    if (dismissBtn) dismissBtn.textContent = dismissLabels[lang] || dismissLabels.ko;

    const closeBtn = document.getElementById('aiBriefingClose');
    if (closeBtn) closeBtn.textContent = closeLabels[lang] || closeLabels.ko;

    modal.style.display = 'flex';
    modal.classList.add('ai-briefing-show');
}

function hideBriefingPopup() {
    const modal = document.getElementById('aiBriefingModal');
    if (modal) {
        modal.classList.remove('ai-briefing-show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

function showLoadingState() {
    const modal = document.getElementById('aiBriefingModal');
    if (!modal) return;

    const contentEl = modal.querySelector('.ai-analysis-content');
    if (contentEl) {
        contentEl.innerHTML = `
            <div class="ai-loading">
                <div class="ai-loading-spinner"></div>
                <span class="ai-loading-text">AI 분석 중...</span>
            </div>
        `;
    }

    const kpiContainer = modal.querySelector('.ai-kpi-container');
    if (kpiContainer) kpiContainer.innerHTML = '';

    modal.style.display = 'flex';
    modal.classList.add('ai-briefing-show');
}

function showErrorState(errorMsg) {
    const contentEl = document.querySelector('#aiBriefingModal .ai-analysis-content');
    if (contentEl) {
        contentEl.innerHTML = `
            <div class="ai-error">
                <span class="ai-error-icon">&#9888;</span>
                <span>${escapeHtml(errorMsg)}</span>
            </div>
        `;
    }
}

// ============================================================
// Initialization
// ============================================================

function setupEventListeners() {
    const closeBtn = document.getElementById('aiBriefingClose');
    if (closeBtn) closeBtn.addEventListener('click', hideBriefingPopup);

    const dismissBtn = document.getElementById('aiBriefingDismiss');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
            hideBriefingPopup();
        });
    }

    const closeX = document.querySelector('.ai-briefing-close');
    if (closeX) closeX.addEventListener('click', hideBriefingPopup);

    const modal = document.getElementById('aiBriefingModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideBriefingPopup();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideBriefingPopup();
    });
}

async function initAiBriefing() {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) return;

    const data = extractBriefingData();
    if (!data) return;

    try {
        showLoadingState();
        const briefingText = await fetchAiBriefing(data);
        showBriefingPopup(briefingText, data);
    } catch (error) {
        console.error('AI briefing error:', error.message);
        showErrorState(error.name === 'AbortError' ? 'Request timed out' : 'AI 분석을 불러올 수 없습니다');
    }
}

document.addEventListener('dashboardDataLoaded', () => {
    setTimeout(() => initAiBriefing(), 1500);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
    setupEventListeners();
}
