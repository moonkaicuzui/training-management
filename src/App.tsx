import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/layout/Layout';
import { Toaster } from './components/common/Toaster';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { DevProtectedRoute } from './components/auth';
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

// New TQC (신입 TQC 교육) 페이지
const NewTQCDashboard = lazy(() => import('./pages/new-tqc/NewTQCDashboard'));
const NewTQCTrainees = lazy(() => import('./pages/new-tqc/NewTQCTrainees'));
const NewTQCTraineeDetail = lazy(() => import('./pages/new-tqc/NewTQCTraineeDetail'));
const NewTQCMeetings = lazy(() => import('./pages/new-tqc/NewTQCMeetings'));
const NewTQCResignations = lazy(() => import('./pages/new-tqc/NewTQCResignations'));
const NewTQCSettings = lazy(() => import('./pages/new-tqc/NewTQCSettings'));

// 로딩 컴포넌트
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
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
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                } />
                <Route path="programs" element={
                  <Suspense fallback={<PageLoader />}>
                    <Programs />
                  </Suspense>
                } />
                <Route path="progress" element={
                  <Suspense fallback={<PageLoader />}>
                    <Progress />
                  </Suspense>
                } />
                <Route path="schedule" element={
                  <Suspense fallback={<PageLoader />}>
                    <Schedule />
                  </Suspense>
                } />
                <Route path="results" element={
                  <DevProtectedRoute requiredPermission="canEditResults">
                    <Suspense fallback={<PageLoader />}>
                      <Results />
                    </Suspense>
                  </DevProtectedRoute>
                } />
                <Route path="employees" element={
                  <Suspense fallback={<PageLoader />}>
                    <Employees />
                  </Suspense>
                } />
                <Route path="employees/:id" element={
                  <Suspense fallback={<PageLoader />}>
                    <EmployeeDetail />
                  </Suspense>
                } />
                <Route path="retraining" element={
                  <Suspense fallback={<PageLoader />}>
                    <Retraining />
                  </Suspense>
                } />
                {/* Phase 1-3 새 기능 라우트 */}
                <Route path="attendance" element={
                  <Suspense fallback={<PageLoader />}>
                    <Attendance />
                  </Suspense>
                } />
                <Route path="reports" element={
                  <Suspense fallback={<PageLoader />}>
                    <Reports />
                  </Suspense>
                } />
                <Route path="certificates" element={
                  <Suspense fallback={<PageLoader />}>
                    <Certificates />
                  </Suspense>
                } />
                <Route path="trainers" element={
                  <Suspense fallback={<PageLoader />}>
                    <Trainers />
                  </Suspense>
                } />
                <Route path="training-plan" element={
                  <Suspense fallback={<PageLoader />}>
                    <TrainingPlan />
                  </Suspense>
                } />
                <Route path="audit-log" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <Suspense fallback={<PageLoader />}>
                      <AuditLog />
                    </Suspense>
                  </DevProtectedRoute>
                } />
                <Route path="notifications" element={
                  <Suspense fallback={<PageLoader />}>
                    <Notifications />
                  </Suspense>
                } />
                <Route path="evaluation" element={
                  <Suspense fallback={<PageLoader />}>
                    <Evaluation />
                  </Suspense>
                } />
                <Route path="materials" element={
                  <Suspense fallback={<PageLoader />}>
                    <Materials />
                  </Suspense>
                } />
                <Route path="executive" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <Suspense fallback={<PageLoader />}>
                      <ExecutiveDashboard />
                    </Suspense>
                  </DevProtectedRoute>
                } />
                <Route path="audit" element={
                  <DevProtectedRoute requiredPermission="canManageUsers">
                    <Suspense fallback={<PageLoader />}>
                      <AuditCompliance />
                    </Suspense>
                  </DevProtectedRoute>
                } />

                {/* New TQC (신입 TQC 교육) 라우트 */}
                <Route path="new-tqc">
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
                  <Route path="resignations" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCResignations />
                    </Suspense>
                  } />
                  <Route path="settings" element={
                    <Suspense fallback={<PageLoader />}>
                      <NewTQCSettings />
                    </Suspense>
                  } />
                </Route>
              </Route>
            </Routes>
            <Toaster />
          </BrowserRouter>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
