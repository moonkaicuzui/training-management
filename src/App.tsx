import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/layout/Layout';
import { Toaster } from './components/common/Toaster';
import { Loader2 } from 'lucide-react';

// 페이지 레이지 로딩으로 초기 번들 크기 감소
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Programs = lazy(() => import('./pages/Programs'));
const Progress = lazy(() => import('./pages/Progress'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Results = lazy(() => import('./pages/Results'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail'));
const Retraining = lazy(() => import('./pages/Retraining'));

// 로딩 컴포넌트
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename="/training-management">
        <Routes>
          <Route path="/" element={<Layout />}>
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
              <Suspense fallback={<PageLoader />}>
                <Results />
              </Suspense>
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
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
