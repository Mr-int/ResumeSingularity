import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home.jsx';
import Students from "./pages/Students.jsx";
import Resume from "./pages/Resume.jsx";
import Settings from "./pages/Settings.jsx";
import Chats from "./pages/Chats.jsx";
import OnboardingResume from './pages/OnboardingResume.jsx';
import OnboardingVacancy from './pages/OnboardingVacancy.jsx';
import Vacancies from './pages/Vacancies.jsx';
import VacancyDetail from './pages/VacancyDetail.jsx';
import MyVacancies from './pages/MyVacancies.jsx';
import MyApplications from './pages/MyApplications.jsx';
import ProjectsPage from './pages/Projects.jsx';
import { ProjectModalProvider } from './context/ProjectModalContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import ApprovedRoute from './components/auth/ApprovedRoute.jsx';
import GlobalAuthPrompt from './components/auth/GlobalAuthPrompt.jsx';
import PendingApprovalBanner from './components/common/PendingApprovalBanner.jsx';
import FloatingButton from './components/floatingButton/FloatingButton.jsx';
import { useAnalyticsTracker } from './hooks/useAnalyticsTracker.js';

const AppRoutes = () => {
  const location = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const isFirstRender = useRef(true);
  useAnalyticsTracker();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsRouteLoading(true);
    const timeoutId = window.setTimeout(() => {
      setIsRouteLoading(false);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  return (
      <>
        <PendingApprovalBanner />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/projects' element={
            <ApprovedRoute>
              <ProjectsPage />
            </ApprovedRoute>
          } />
          <Route path='/students' element={
            <ApprovedRoute>
              <Students />
            </ApprovedRoute>
          } />
          <Route path='/studentsResume/:id' element={
            <ApprovedRoute>
              <Resume />
            </ApprovedRoute>
          } />
          <Route path='/onboarding/resume' element={
            <ProtectedRoute skipOnboardingCheck>
              <OnboardingResume />
            </ProtectedRoute>
          } />
          <Route path='/onboarding/vacancy' element={
            <ProtectedRoute skipOnboardingCheck>
              <OnboardingVacancy />
            </ProtectedRoute>
          } />
          <Route path='/vacancies' element={
            <ApprovedRoute>
              <Vacancies />
            </ApprovedRoute>
          } />
          <Route path='/vacancies/mine' element={
            <ProtectedRoute>
              <MyVacancies />
            </ProtectedRoute>
          } />
          <Route path='/vacancies/applications/mine' element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          } />
          <Route path='/vacancies/:id' element={
            <ApprovedRoute>
              <VacancyDetail />
            </ApprovedRoute>
          } />
          <Route path='/settings' element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path='/chats' element={
            <ProtectedRoute>
              <Chats />
            </ProtectedRoute>
          } />
          <Route path='/account' element={<Navigate to="/settings" replace />} />
        </Routes>
        <FloatingButton />
        <GlobalAuthPrompt />

        {isRouteLoading && (
            <div className="appRouteLoader" aria-label="Загрузка страницы">
              <div className="appRouteLoader__spinner"></div>
            </div>
        )}
      </>
  );
};

function App() {
  return (
    <Router>
      <ProjectModalProvider>
        <AppRoutes />
      </ProjectModalProvider>
    </Router>
  )
}

export default App;
