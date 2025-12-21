import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import Progress from './pages/Progress';
import Schedule from './pages/Schedule';
import Results from './pages/Results';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Retraining from './pages/Retraining';
import { Toaster } from './components/common/Toaster';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename="/training-management">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="programs" element={<Programs />} />
            <Route path="progress" element={<Progress />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="results" element={<Results />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="retraining" element={<Retraining />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
