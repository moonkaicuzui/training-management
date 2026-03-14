/**
 * Playwright 스크립트 - MD 모듈 스크린샷 일괄 캡쳐
 * 실행: node scripts/captureScreenshots.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:5180';

// 스크린샷 폴더 생성
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  const shot = async (name) => {
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: false });
    console.log(`  captured: ${name}.png`);
  };

  const shotFull = async (name) => {
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
    console.log(`  captured: ${name}.png (full)`);
  };

  try {
    // ====== 1. LOGIN ======
    console.log('1. Login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    await shot('01_login_page');

    // 로그인
    await page.fill('input[type="text"], input[placeholder*="email" i], input[placeholder*="hsvin" i]', 'ksmoon@hsvina.com');
    await page.fill('input[type="password"]', 'ksmoon1!');
    await shot('02_login_filled');

    await page.click('button:has-text("nhập"), button:has-text("Login"), button:has-text("로그인")');
    await page.waitForTimeout(5000);

    // 대시보드 로드 대기
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    } catch {
      console.log('  Dashboard URL not reached, current:', page.url());
    }
    await page.waitForTimeout(2000);
    await shot('03_main_dashboard');

    // ====== 2. 영어로 전환 (매뉴얼이 영어이므로) ======
    console.log('2. Switch to English...');
    // 언어 변경 시도 (헤더의 언어 선택 버튼)
    try {
      const langBtn = page.locator('button:has-text("🇻🇳"), button:has-text("🇰🇷"), button:has-text("Tiếng"), button:has-text("한국어")').first();
      if (await langBtn.isVisible()) {
        await langBtn.click();
        await page.waitForTimeout(500);
        // English 옵션 클릭
        const engOption = page.locator('text=English, text=🇺🇸').first();
        if (await engOption.isVisible()) {
          await engOption.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch {
      console.log('  Language switch skipped');
    }

    // ====== 3. 사이드바 메뉴 - Metal Detector 진입 ======
    console.log('3. Navigate to Metal Detector...');
    await page.goto(`${BASE_URL}/equipment/metal-detector`);
    await page.waitForTimeout(3000);
    await shot('04_md_dashboard_empty');

    // ====== 4. MD Dashboard (주차 선택) ======
    console.log('4. MD Dashboard...');
    await shotFull('05_md_dashboard_full');

    // ====== 5. MD Input Form - Quick Entry ======
    console.log('5. MD Input Form - Quick Entry...');
    await page.goto(`${BASE_URL}/equipment/metal-detector/input`);
    await page.waitForTimeout(2000);
    await shot('06_md_input_quick_empty');

    // 공장 A 선택
    try {
      const factoryA = page.locator('button:has-text("A")').first();
      await factoryA.click();
      await page.waitForTimeout(300);
    } catch { console.log('  Factory A click failed'); }
    await shot('07_md_input_factory_selected');

    // 라인 입력
    try {
      const lineInput = page.locator('input[placeholder*="A-1"], input[placeholder*="-1"]').first();
      if (await lineInput.isVisible()) {
        await lineInput.fill('4-1');
      }
    } catch { console.log('  Line input failed'); }

    // 장비 ID 입력
    try {
      const machineInput = page.locator('input[placeholder*="D210103"]').first();
      if (await machineInput.isVisible()) {
        await machineInput.fill('A410201');
      }
    } catch { console.log('  Machine ID input failed'); }
    await shot('08_md_input_line_machine');

    // 감도 입력
    try {
      const numberInputs = page.locator('input[type="number"]');
      const count = await numberInputs.count();
      if (count >= 3) {
        await numberInputs.nth(0).fill('1.5');
        await numberInputs.nth(1).fill('2.0');
        await numberInputs.nth(2).fill('2.5');
      }
    } catch { console.log('  Sensitivity input failed'); }
    await shot('09_md_input_sensitivity_filled');

    // 결과 PASS 선택 (이미 기본값)
    await shot('10_md_input_ready_to_save');

    // FAIL 선택해서 실패 폼 보이기
    try {
      const failBtn = page.locator('button:has-text("FAIL")').first();
      await failBtn.click();
      await page.waitForTimeout(500);
    } catch { console.log('  FAIL click failed'); }
    await shot('11_md_input_fail_selected');

    // PASS로 복원
    try {
      const passBtn = page.locator('button:has-text("PASS")').first();
      await passBtn.click();
      await page.waitForTimeout(300);
    } catch {}

    // ====== 6. Detailed Entry 탭 ======
    console.log('6. Detailed Entry tab...');
    try {
      const detailedTab = page.locator('button:has-text("Detailed"), button:has-text("상세")').first();
      if (await detailedTab.isVisible()) {
        await detailedTab.click();
        await page.waitForTimeout(500);
      }
    } catch { console.log('  Detailed tab click failed'); }
    await shot('12_md_input_detailed_mode');

    // ====== 7. MD History ======
    console.log('7. MD History...');
    await page.goto(`${BASE_URL}/equipment/metal-detector/history`);
    await page.waitForTimeout(3000);
    await shot('13_md_history');
    await shotFull('14_md_history_full');

    // ====== 8. MD Report ======
    console.log('8. MD Report...');
    await page.goto(`${BASE_URL}/equipment/metal-detector/report`);
    await page.waitForTimeout(3000);
    await shot('15_md_report');

    // ====== 9. 사이드바 네비게이션 캡쳐 ======
    console.log('9. Sidebar navigation...');
    await page.goto(`${BASE_URL}/equipment/metal-detector`);
    await page.waitForTimeout(2000);
    // 사이드바가 보이는 상태로 캡쳐
    await shot('16_sidebar_navigation');

    console.log('\nAll screenshots captured!');
    console.log(`Files: ${fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length} images`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

capture();
