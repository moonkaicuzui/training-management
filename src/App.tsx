import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/layout/Layout';
import { Toaster } from './components/common/Toaster';
import { ErrorBoundary, PageErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { DevProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

// 페이지 레이지 로딩으로 초기 번들 크기 감소
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Programs = lazy(() => import('./pages/Programs'));
const Progress = lazy(() => import('./pages/Progress'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Results = lazy(() => import('./pages/Results'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail'));
const Retraining = lazy(() => import('./pages/Retraining'));

// Phase 1-3 새 기능 페이지
const Attendance = lazy(() => import('./pages/Attendance'));
const Reports = lazy(() => import('./pages/Reports'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Trainers = lazy(() => import('./pages/Trainers'));
const TrainingPlan = lazy(() => import('./pages/TrainingPlan'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Evaluation = lazy(() => import('./pages/Evaluation'));
const Materials = lazy(() => import('./pages/Materials'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const AuditCompliance = lazy(() => import('./pages/AuditCompliance'));
const DataSync = lazy(() => import('./pages/DataSync'));
const DepartmentDashboard = lazy(() => import('./pages/DepartmentDashboard'));

// Competency Matrix & Skill Gap Analysis 페이지
const Competency = lazy(() => import('./pages/Competency'));
const SkillGap = lazy(() => import('./pages/SkillGap'));

// New TQC (신입 TQC 교육) 페이지
const NewTQCDashboard = lazy(() => import('./pages/new-tqc/NewTQCDashboard'));
const NewTQCTrainees = lazy(() => import('./pages/new-tqc/NewTQCTrainees'));
const NewTQCTraineeDetail = lazy(() => import('./pages/new-tqc/NewTQCTraineeDetail'));
const NewTQCMeetings = lazy(() => import('./pages/new-tqc/NewTQCMeetings'));
const NewTQCResignations = lazy(() => import('./pages/new-tqc/NewTQCResignations'));
const NewTQCFinalResult = lazy(() => import('./pages/new-tqc/NewTQCFinalResult'));
const NewTQCCertificates = lazy(() => import('./pages/new-tqc/NewTQCCertificates'));
const NewTQCSettings = lazy(() => import('./pages/new-tqc/NewTQCSettings'));

// 프로젝트 관리 (품질 부서 협업 시스템) 페이지
const ProjectsDashboard = lazy(() => import('./pages/projects/ProjectsDashboard'));
const ProjectsMembers = lazy(() => import('./pages/projects/ProjectsMembers'));
const ProjectsTasks = lazy(() => import('./pages/projects/ProjectsTasks'));
const ProjectsCalendar = lazy(() => import('./pages/projects/ProjectsCalendar'));
const ProjectsSettings = lazy(() => import('./pages/projects/ProjectsSettings'));

// CAPA (Corrective and Preventive Action) 페이지
const CAPADashboard = lazy(() => import('./pages/capa/CAPADashboard'));
const CAPAForm = lazy(() => import('./pages/capa/CAPAForm'));
const CAPADetail = lazy(() => import('./pages/capa/CAPADetail'));

// 5PRS (검사 평가) 페이지 - 원본 대시보드 iframe
const FivePrsOriginalDashboard = lazy(() => import('./pages/five-prs/FivePrsOriginalDashboard'));
const TrainingRecommendations = lazy(() => import('./pages/five-prs/TrainingRecommendations'));

// AQL (검사 품질 수준) 페이지
const AqlDashboard = lazy(() => import('./pages/aql/AqlDashboard'));
const AqlTrainingRecommendations = lazy(() => import('./pages/aql/AqlTrainingRecommendations'));

// 교육 프로그램 소개
const ProgramIntro = lazy(() => import('./pages/ProgramIntro'));

// 검사 교육 (Inspection Training) 페이지
const InspectionDashboard = lazy(() => import('./pages/inspection/InspectionDashboard'));
const InspectionResultForm = lazy(() => import('./pages/inspection/InspectionResultForm'));
const InspectionEnrollments = lazy(() => import('./pages/inspection/InspectionEnrollments'));
const InspectionHistory = lazy(() => import('./pages/inspection/InspectionHistory'));

// 품질 블로그
const QualityBlog = lazy(() => import('./pages/QualityBlog'));

// AI 경영진 보고서
const ExecutiveReport = lazy(() => import('./pages/ExecutiveReport'));

// Metal Detector Inspection (금속 탐지기 점검)
const MDDashboard = lazy(() => import('./pages/metal-detector/MDDashboard'));
const MDInputForm = lazy(() => import('./pages/metal-detector/MDInputForm'));
const MDHistory = lazy(() => import('./pages/metal-detector/MDHistory'));
const MDReport = lazy(() => import('./pages/metal-detector/MDReport'));


// Metal Shoe Cases (금속 발견 신발)
const MetalShoeDashboard = lazy(() => import('./pages/metal-shoes/MetalShoeDashboard'));
const MetalShoeRegister = lazy(() => import('./pages/metal-shoes/MetalShoeRegister'));
const MetalShoeTracking = lazy(() => import('./pages/metal-shoes/MetalShoeTracking'));
const MetalShoeReport = lazy(() => import('./pages/metal-shoes/MetalShoeReport'));

// TECH / NEW MODEL 페이지
const TechModelList = lazy(() => import('./pages/tech/TechModelList'));
const TechReviewGuidelines = lazy(() => import('./pages/tech/TechReviewGuidelines'));

// 검사원 스티커 관리
const InspectorStickers = lazy(() => import('./pages/InspectorStickers'));

// 트레이너 일일 업무 지시
const TrainerDirectives = lazy(() => import('./pages/TrainerDirectives'));

// 시스템 피드백 (이슈 등록 / 개선 요청)
const SystemFeedback = lazy(() => import('./pages/SystemFeedback'));

// HR V2 직원 데이터 동기화
const HRSync = lazy(() => import('./pages/HRSync'));

// HR V2 연계 분석 대시보드
const HRAnalytics = lazy(() => import('./pages/HRAnalytics'));

// 테스트 페이지
const PptxTestPage = lazy(() => import('./pages/test/PptxTestPage'));

// 로딩 컴포넌트
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * 모듈별 라우트 그룹을 감싸는 ErrorBoundary 래퍼
 * PageErrorBoundary 내부에 Outlet을 렌더링하여 자식 라우트에서 발생하는 에러를 캐치
 */
function ModuleErrorBoundary() {
  return (
    <PageErrorBoundary>
      <Outlet />
    </PageErrorBoundary>
  );
}

function App() {
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);

  // Initialize Firebase auth state listener on app mount
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
            <Routes>
              {/* Public route - Login */}
              <Route path="/login" element={
                <Suspense fallback={<PageLoader />}>
                  <Login />
                </Suspense>
              } />

              {/* Protected routes */}
              <Route path="/" element={
                <DevProtectedRoute>
                  <Layout />
                </DevProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Dashboard />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="programs" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Programs />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="progress" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Progress />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="schedule" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Schedule />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="results" element={
                  <DevProtectedRoute requiredPermission="canEditResults">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <Results />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />
                <Route path="employees" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Employees />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="employees/:id" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <EmployeeDetail />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="retraining" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Retraining />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                {/* Phase 1-3 새 기능 라우트 */}
                <Route path="attendance" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Attendance />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="reports" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Reports />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="certificates" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Certificates />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="trainers" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <Trainers />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />
                <Route path="training-plan" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <TrainingPlan />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="audit-log" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <AuditLog />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />
                <Route path="notifications" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Notifications />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="evaluation" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Evaluation />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="materials" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Materials />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="executive" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <ExecutiveDashboard />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />
                <Route path="audit" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <AuditCompliance />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />
                <Route path="data-sync" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <DataSync />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />
                <Route path="department" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <DepartmentDashboard />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="competency" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Competency />
                    </Suspense>
                  </PageErrorBoundary>
                } />
                <Route path="skill-gap" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <SkillGap />
                    </Suspense>
                  </PageErrorBoundary>
                } />

                {/* New TQC (신입 TQC 교육) 라우트 */}
                <Route path="new-tqc" element={<ModuleErrorBoundary />}>
                  <Route index element={<Navigate to="/new-tqc/dashboard" replace />} />
                  <Route path="dashboard" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCDashboard />
                    </Suspense>
                  } />
                  <Route path="trainees" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCTrainees />
                    </Suspense>
                  } />
                  <Route path="trainees/new" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCTrainees />
                    </Suspense>
                  } />
                  <Route path="trainees/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCTraineeDetail />
                    </Suspense>
                  } />
                  <Route path="meetings" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCMeetings />
                    </Suspense>
                  } />
                  <Route path="final-result" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCFinalResult />
                    </Suspense>
                  } />
                  <Route path="certificates" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCCertificates />
                    </Suspense>
                  } />
                  <Route path="resignations" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCResignations />
                    </Suspense>
                  } />
                  <Route path="settings" element={
                    <DevProtectedRoute requiredPermission="canManageUsers">
                      <Suspense fallback={<PageLoader />}>
                        <NewTQCSettings />
                      </Suspense>
                    </DevProtectedRoute>
                  } />
                </Route>

                {/* 프로젝트 관리 (품질 부서 협업 시스템) 라우트 */}
                <Route path="projects" element={<ModuleErrorBoundary />}>
                  <Route index element={<Navigate to="/projects/dashboard" replace />} />
                  <Route path="dashboard" element={
                    <Suspense fallback={<PageLoader />}>
                      <ProjectsDashboard />
                    </Suspense>
                  } />
                  <Route path="members" element={
                    <Suspense fallback={<PageLoader />}>
                      <ProjectsMembers />
                    </Suspense>
                  } />
                  <Route path="tasks" element={
                    <Suspense fallback={<PageLoader />}>
                      <ProjectsTasks />
                    </Suspense>
                  } />
                  <Route path="calendar" element={
                    <Suspense fallback={<PageLoader />}>
                      <ProjectsCalendar />
                    </Suspense>
                  } />
                  <Route path="settings" element={
                    <DevProtectedRoute requiredPermission="canManageUsers">
                      <Suspense fallback={<PageLoader />}>
                        <ProjectsSettings />
                      </Suspense>
                    </DevProtectedRoute>
                  } />
                </Route>

                {/* CAPA (Corrective and Preventive Action) 라우트 */}
                <Route path="capa" element={<ModuleErrorBoundary />}>
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <CAPADashboard />
                    </Suspense>
                  } />
                  <Route path="new" element={
                    <Suspense fallback={<PageLoader />}>
                      <CAPAForm />
                    </Suspense>
                  } />
                  <Route path=":id" element={
                    <Suspense fallback={<PageLoader />}>
                      <CAPADetail />
                    </Suspense>
                  } />
                  <Route path=":id/edit" element={
                    <Suspense fallback={<PageLoader />}>
                      <CAPAForm />
                    </Suspense>
                  } />
                </Route>

                {/* 5PRS (검사 평가) 라우트 */}
                <Route path="five-prs" element={<ModuleErrorBoundary />}>
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <FivePrsOriginalDashboard />
                    </Suspense>
                  } />
                  <Route path="training-recommendations" element={
                    <DevProtectedRoute requiredPermission="canEditResults">
                      <Suspense fallback={<PageLoader />}>
                        <TrainingRecommendations />
                      </Suspense>
                    </DevProtectedRoute>
                  } />
                </Route>

                {/* AQL (검사 품질 수준) 라우트 */}
                <Route path="aql" element={<ModuleErrorBoundary />}>
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <AqlDashboard />
                    </Suspense>
                  } />
                  <Route path="training-recommendations" element={
                    <DevProtectedRoute requiredPermission="canEditResults">
                      <Suspense fallback={<PageLoader />}>
                        <AqlTrainingRecommendations />
                      </Suspense>
                    </DevProtectedRoute>
                  } />
                </Route>

                {/* 교육 프로그램 소개 */}
                <Route path="program-intro" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <ProgramIntro />
                    </Suspense>
                  </PageErrorBoundary>
                } />

                {/* 검사 교육 (Inspection Training) 라우트 */}
                <Route path="inspection" element={<ModuleErrorBoundary />}>
                  <Route index element={<Navigate to="/inspection/dashboard" replace />} />
                  <Route path="dashboard" element={
                    <Suspense fallback={<PageLoader />}>
                      <InspectionDashboard />
                    </Suspense>
                  } />
                  <Route path="result" element={
                    <DevProtectedRoute requiredPermission="canEditResults">
                      <Suspense fallback={<PageLoader />}>
                        <InspectionResultForm />
                      </Suspense>
                    </DevProtectedRoute>
                  } />
                  <Route path="enrollments" element={
                    <Suspense fallback={<PageLoader />}>
                      <InspectionEnrollments />
                    </Suspense>
                  } />
                  <Route path="history" element={
                    <Suspense fallback={<PageLoader />}>
                      <InspectionHistory />
                    </Suspense>
                  } />
                </Route>

                {/* 품질 블로그 */}
                <Route path="quality-blog" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <QualityBlog />
                    </Suspense>
                  </PageErrorBoundary>
                } />

                {/* AI 경영진 보고서 */}
                <Route path="executive-report" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <ExecutiveReport />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />

                {/* Metal Detector Inspection (금속 탐지기 점검) */}
                <Route path="equipment/metal-detector" element={<ModuleErrorBoundary />}>
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <MDDashboard />
                    </Suspense>
                  } />
                  <Route path="input" element={
                    <Suspense fallback={<PageLoader />}>
                      <MDInputForm />
                    </Suspense>
                  } />
                  <Route path="history" element={
                    <Suspense fallback={<PageLoader />}>
                      <MDHistory />
                    </Suspense>
                  } />
                  <Route path="report" element={
                    <Suspense fallback={<PageLoader />}>
                      <MDReport />
                    </Suspense>
                  } />
                </Route>

                {/* Metal Shoe Cases (금속 발견 신발) */}
                <Route path="equipment/metal-shoes" element={<ModuleErrorBoundary />}>
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <MetalShoeDashboard />
                    </Suspense>
                  } />
                  <Route path="register" element={
                    <Suspense fallback={<PageLoader />}>
                      <MetalShoeRegister />
                    </Suspense>
                  } />
                  <Route path="tracking" element={
                    <Suspense fallback={<PageLoader />}>
                      <MetalShoeTracking />
                    </Suspense>
                  } />
                  <Route path="report" element={
                    <Suspense fallback={<PageLoader />}>
                      <MetalShoeReport />
                    </Suspense>
                  } />
                </Route>

                {/* TECH / NEW MODEL */}
                <Route path="tech" element={<ModuleErrorBoundary />}>
                  <Route path="models" element={
                    <DevProtectedRoute requiredEmail="ksmoon@hsvina.com">
                      <Suspense fallback={<PageLoader />}><TechModelList /></Suspense>
                    </DevProtectedRoute>
                  } />
                  <Route path="review-guidelines" element={
                    <DevProtectedRoute requiredEmail="ksmoon@hsvina.com">
                      <Suspense fallback={<PageLoader />}><TechReviewGuidelines /></Suspense>
                    </DevProtectedRoute>
                  } />
                </Route>

                {/* 검사원 스티커 설정 */}
                <Route path="inspector-stickers" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <InspectorStickers />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />

                {/* 트레이너 일일 업무 지시 */}
                <Route path="trainer-directives" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <TrainerDirectives />
                    </Suspense>
                  </PageErrorBoundary>
                } />

                {/* HR V2 직원 데이터 동기화 (관리자 전용) */}
                <Route path="hr-sync" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <HRSync />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />

                {/* HR V2 연계 분석 대시보드 (관리자 전용) */}
                <Route path="hr-analytics" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <HRAnalytics />
                      </Suspense>
                    </PageErrorBoundary>
                  </DevProtectedRoute>
                } />

                {/* 시스템 피드백 (이슈 등록 / 개선 요청) */}
                <Route path="system-feedback" element={
                  <PageErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <SystemFeedback />
                    </Suspense>
                  </PageErrorBoundary>
                } />

                {/* 테스트 페이지 (DEV only) */}
                {import.meta.env.DEV && (
                  <Route path="test/pptx" element={
                    <PageErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <PptxTestPage />
                      </Suspense>
                    </PageErrorBoundary>
                  } />
                )}

                {/* 404 catch-all: 존재하지 않는 경로 → 대시보드로 리다이렉트 */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
            <Toaster />
          </BrowserRouter>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
