/**
 * Google Apps Script (GAS) - Employee Sheet → Firestore Sync
 *
 * This script should be added to the Google Sheet via:
 *   Extensions > Apps Script
 *
 * Setup:
 * 1. Copy this entire script into the Apps Script editor
 * 2. Set the script properties (Project Settings > Script Properties):
 *    - CLOUD_FUNCTION_URL: Your Firebase Cloud Function URL
 *      (e.g., https://asia-southeast1-q-train-web.cloudfunctions.net/api)
 *    - EMPLOYEE_SYNC_API_KEY: The API key matching Firebase secret
 * 3. Set up the onEdit trigger:
 *    - Triggers > Add Trigger > onSheetEdit > From spreadsheet > On edit
 *
 * Sheet column mapping (A-K):
 * A: employee_id, B: employee_name, C: department, D: position,
 * E: building, F: line, G: hire_date, H: status, I: updated_at,
 * J: _sync_source, K: _sync_timestamp
 */

// Column indices (1-based)
var COL = {
  EMPLOYEE_ID: 1,     // A
  EMPLOYEE_NAME: 2,   // B
  DEPARTMENT: 3,      // C
  POSITION: 4,        // D
  BUILDING: 5,        // E
  LINE: 6,            // F
  HIRE_DATE: 7,       // G
  STATUS: 8,          // H
  UPDATED_AT: 9,      // I
  SYNC_SOURCE: 10,    // J
  SYNC_TIMESTAMP: 11, // K
};

/**
 * Triggered when a cell is edited in the spreadsheet.
 * Sends the changed employee data to the Cloud Function.
 */
function onSheetEdit(e) {
  var sheet = e.source.getActiveSheet();

  // Only process the "Employees" sheet
  if (sheet.getName() !== 'Employees') return;

  var row = e.range.getRow();

  // Skip header row
  if (row <= 1) return;

  // Check _sync_source column (J) - if 'APP', this change came from Firestore
  // Clear the flag and skip to prevent sync loop
  var syncSource = sheet.getRange(row, COL.SYNC_SOURCE).getValue();
  if (syncSource === 'APP') {
    // Clear the sync flag so future manual edits are detected
    sheet.getRange(row, COL.SYNC_SOURCE).setValue('');
    sheet.getRange(row, COL.SYNC_TIMESTAMP).setValue('');
    return;
  }

  // Get the employee_id - if empty, skip (incomplete row)
  var employeeId = sheet.getRange(row, COL.EMPLOYEE_ID).getValue();
  if (!employeeId) return;

  // Collect row data
  var employee = {
    employee_id: String(employeeId).trim(),
    employee_name: String(sheet.getRange(row, COL.EMPLOYEE_NAME).getValue() || '').trim(),
    department: String(sheet.getRange(row, COL.DEPARTMENT).getValue() || '').trim(),
    position: String(sheet.getRange(row, COL.POSITION).getValue() || '').trim(),
    building: String(sheet.getRange(row, COL.BUILDING).getValue() || '').trim(),
    line: String(sheet.getRange(row, COL.LINE).getValue() || '').trim(),
    hire_date: formatDate(sheet.getRange(row, COL.HIRE_DATE).getValue()),
    status: String(sheet.getRange(row, COL.STATUS).getValue() || 'ACTIVE').trim(),
  };

  // Send to Cloud Function
  try {
    var props = PropertiesService.getScriptProperties();
    var cloudFunctionUrl = props.getProperty('CLOUD_FUNCTION_URL');
    var apiKey = props.getProperty('EMPLOYEE_SYNC_API_KEY');

    if (!cloudFunctionUrl || !apiKey) {
      Logger.log('ERROR: CLOUD_FUNCTION_URL or EMPLOYEE_SYNC_API_KEY not set in script properties');
      return;
    }

    var url = cloudFunctionUrl + '/api/employee-sync/from-sheet';

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
      },
      payload: JSON.stringify({
        action: 'UPDATE',
        employee: employee,
      }),
      muteHttpExceptions: true,
    });

    var responseCode = response.getResponseCode();
    if (responseCode === 200) {
      // Update sync metadata in the sheet
      sheet.getRange(row, COL.UPDATED_AT).setValue(new Date().toISOString());
      sheet.getRange(row, COL.SYNC_SOURCE).setValue('SHEET');
      sheet.getRange(row, COL.SYNC_TIMESTAMP).setValue(new Date().toISOString());
      Logger.log('Synced employee ' + employee.employee_id + ' to Firestore');
    } else {
      Logger.log('ERROR: Cloud Function returned ' + responseCode + ': ' + response.getContentText());
    }
  } catch (error) {
    Logger.log('ERROR syncing employee ' + employee.employee_id + ': ' + error.message);
  }
}

/**
 * Format a date value to YYYY-MM-DD string.
 */
function formatDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    var year = value.getFullYear();
    var month = ('0' + (value.getMonth() + 1)).slice(-2);
    var day = ('0' + value.getDate()).slice(-2);
    return year + '-' + month + '-' + day;
  }
  return String(value).trim();
}

/**
 * Manual full sync trigger - can be run from Apps Script menu or manually.
 * Calls the full-sync endpoint which reads all Sheet data and syncs with Firestore.
 */
function triggerFullSync() {
  var props = PropertiesService.getScriptProperties();
  var cloudFunctionUrl = props.getProperty('CLOUD_FUNCTION_URL');
  var apiKey = props.getProperty('EMPLOYEE_SYNC_API_KEY');

  if (!cloudFunctionUrl || !apiKey) {
    SpreadsheetApp.getUi().alert('Error: CLOUD_FUNCTION_URL or EMPLOYEE_SYNC_API_KEY not set in script properties');
    return;
  }

  var url = cloudFunctionUrl + '/api/employee-sync/full-sync';

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
      },
      muteHttpExceptions: true,
    });

    var responseCode = response.getResponseCode();
    var result = JSON.parse(response.getContentText());

    if (responseCode === 200 && result.success) {
      SpreadsheetApp.getUi().alert(
        'Full Sync Complete!\n\n' +
        'Sheet → Firestore: ' + result.sheet_to_firestore.created + ' created, ' +
        result.sheet_to_firestore.updated + ' updated\n' +
        'Firestore → Sheet: ' + result.firestore_to_sheet.appended + ' appended\n\n' +
        'Total Sheet: ' + result.total_sheet + '\n' +
        'Total Firestore: ' + result.total_firestore
      );
    } else {
      SpreadsheetApp.getUi().alert('Sync failed: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Sync error: ' + error.message);
  }
}

/**
 * Add custom menu to the spreadsheet
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Q-TRAIN Sync')
    .addItem('Full Sync with Firestore', 'triggerFullSync')
    .addToUi();
}
