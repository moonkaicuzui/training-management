// ============================================================
// Q-TRAIN Google Sheets ↔ Firestore Sync - Configuration
// ============================================================

const CONFIG = {
  FIREBASE_PROJECT_ID: 'q-train-web',
  SPREADSHEET_ID: '1Rv0v_xxe86Hr0ptFphnZKyZZ_7CwmXOkuerd4o7BqOg',
  SYNC_API_KEY: PropertiesService.getScriptProperties().getProperty('SYNC_API_KEY'),
  FIRESTORE_BASE: 'https://firestore.googleapis.com/v1',
};

// 6개 컬렉션 동기화 설정
const COLLECTIONS = {
  employees: {
    sheetName: 'Employees',
    collection: 'employees',
    pk: 'employee_id',
    headers: ['employee_id','employee_name','department','position','building','line','hire_date','status','updated_at'],
    arrayFields: [],
    numberFields: [],
    booleanFields: [],
    syncMode: 'bidirectional',
  },
  training_programs: {
    sheetName: 'Training_Programs',
    collection: 'training_programs',
    pk: 'program_code',
    headers: ['program_code','program_name','program_name_vn','program_name_kr','category','tags','target_positions','evaluation_type','passing_score','grade_aa','grade_a','grade_b','duration_hours','validity_months','training_level','training_type','is_active','created_at','updated_at'],
    arrayFields: ['tags','target_positions'],
    numberFields: ['passing_score','grade_aa','grade_a','grade_b','duration_hours','validity_months'],
    booleanFields: ['is_active'],
    syncMode: 'bidirectional',
  },
  training_sessions: {
    sheetName: 'Training_Sessions',
    collection: 'training_sessions',
    pk: 'session_id',
    headers: ['session_id','program_code','session_date','session_time','trainer_name','trainer','location','max_attendees','status','training_level','training_type','notes','created_by','created_at','attendees'],
    arrayFields: ['attendees'],
    numberFields: ['max_attendees'],
    booleanFields: [],
    syncMode: 'bidirectional',
  },
  training_results: {
    sheetName: 'Training_Results',
    collection: 'training_results',
    pk: 'result_id',
    headers: ['result_id','session_id','employee_id','program_code','training_date','score','grade','result','needs_retraining','evaluated_by','remarks','test_attempt','trainer_name','stop_working_date','created_at','updated_at','updated_by'],
    arrayFields: [],
    numberFields: ['score','test_attempt'],
    booleanFields: ['needs_retraining'],
    syncMode: 'append_only',
  },
  program_change_logs: {
    sheetName: 'Program_Change_Log',
    collection: 'program_change_logs',
    pk: 'log_id',
    headers: ['log_id','program_code','action','changed_by','before_data','after_data','changed_at'],
    arrayFields: [],
    numberFields: [],
    booleanFields: [],
    syncMode: 'firestore_to_sheets',
  },
  result_edit_logs: {
    sheetName: 'Result_Edit_Log',
    collection: 'result_edit_logs',
    pk: 'log_id',
    headers: ['log_id','result_id','before_data','after_data','edit_reason','edited_by','edited_at'],
    arrayFields: [],
    numberFields: [],
    booleanFields: [],
    syncMode: 'firestore_to_sheets',
  },
};
