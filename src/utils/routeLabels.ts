/**
 * Route segment to i18n key mapping for Breadcrumbs
 */

const routeLabelMap: Record<string, string> = {
  dashboard: 'nav.dashboard',
  programs: 'nav.programs',
  progress: 'nav.progress',
  schedule: 'nav.schedule',
  attendance: 'nav.attendance',
  results: 'nav.results',
  employees: 'nav.employees',
  retraining: 'nav.retraining',
  certificates: 'nav.certificates',
  reports: 'nav.reports',
  trainers: 'nav.trainers',
  'training-plan': 'nav.trainingPlan',
  'audit-log': 'nav.auditLog',
  notifications: 'nav.notifications',
  evaluation: 'nav.evaluation',
  materials: 'nav.materials',
  executive: 'nav.executive',
  audit: 'nav.audit',
  // New TQC
  'new-tqc': 'sidebar.newTQC',
  trainees: 'nav.newTQC.trainees',
  meetings: 'nav.newTQC.meetings',
  resignations: 'nav.newTQC.resignations',
  settings: 'nav.newTQC.settings',
  // Projects
  projects: 'sidebar.projects',
  members: 'nav.projects.members',
  tasks: 'nav.projects.tasks',
  calendar: 'nav.projects.calendar',
  // CAPA
  capa: 'sidebar.capa',
  new: 'nav.capa.new',
  // Competency & Skill Gap
  competency: 'nav.competency',
  'skill-gap': 'nav.skillGap',
  // Data Sync & Department
  'data-sync': 'nav.dataSync',
  department: 'nav.department',
  // 5PRS
  'five-prs': 'nav.fivePrs.dashboard',
  'training-recommendations': 'nav.fivePrs.trainingRecommendations',
  // TQC sub-routes
  'final-result': 'nav.newTQC.finalResult',
  // Inspection Training
  inspection: 'sidebar.inspection',
  result: 'nav.inspection.result',
  enrollments: 'nav.inspection.enrollments',
  history: 'nav.inspection.history',
  // AQL
  aql: 'nav.aql.dashboard',
  // Metal Detector
  equipment: 'sidebar.equipmentCompliance',
  'metal-detector': 'nav.equipment.mdDashboard',
  input: 'nav.equipment.mdInput',
  report: 'nav.equipment.mdReport',
  // Quality Blog
  'quality-blog': 'nav.qualityBlog',
  // Executive Report
  'executive-report': 'nav.executiveReport',
  // Inspector Stickers
  'inspector-stickers': 'nav.inspectorStickers',
  // System Feedback
  'system-feedback': 'nav.systemFeedback',
  // HR Sync
  'hr-sync': 'nav.hrSync',
  // HR Analytics
  'hr-analytics': 'nav.hrAnalytics',
  // Program Intro
  'program-intro': 'nav.programIntro',
};

export function getRouteLabel(segment: string): string | null {
  return routeLabelMap[segment] ?? null;
}

/**
 * Check if a segment looks like a dynamic param (e.g., UUID, numeric ID)
 */
export function isDynamicSegment(segment: string): boolean {
  // UUIDs, numeric IDs, or common patterns
  return /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment) || segment === 'edit';
}
