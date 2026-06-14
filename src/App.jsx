import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home.jsx';
import Students from "./pages/Students.jsx";
import Resume from "./pages/Resume.jsx";
import Settings from "./pages/Settings.jsx";
import Chats from "./pages/Chats.jsx";
import Vacancies from './pages/Vacancies.jsx';
import VacancyDetail from './pages/VacancyDetail.jsx';
import StudentProjects from './pages/StudentProjects.jsx';
import MyVacancies from './pages/MyVacancies.jsx';
import VacancyForm from './pages/VacancyForm.jsx';
import MyApplications from './pages/MyApplications.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import ApprovedRoute from './components/auth/ApprovedRoute.jsx';
import GlobalAuthPrompt from './components/auth/GlobalAuthPrompt.jsx';
import FloatingButton from './components/floatingButton/FloatingButton.jsx';

const AppRoutes = () => {
  const location = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const isFirstRender = useRef(true);

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
        <Routes>
          <Route path='/' element={<Home />} />
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
          <Route path='/vacancies/new' element={
            <ProtectedRoute>
              <VacancyForm />
            </ProtectedRoute>
          } />
          <Route path='/vacancies/:id/edit' element={
            <ProtectedRoute>
              <VacancyForm />
            </ProtectedRoute>
          } />
          <Route path='/vacancies/applications/mine' element={
            <ApprovedRoute>
              <MyApplications />
            </ApprovedRoute>
          } />
          <Route path='/vacancies/:id' element={
            <ApprovedRoute>
              <VacancyDetail />
            </ApprovedRoute>
          } />
          <Route path='/student-projects' element={<StudentProjects />} />
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
        <AppRoutes />
    </Router>
  )
}

export default App;