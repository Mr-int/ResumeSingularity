import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home.jsx';
import CareerCenter from './pages/CareerCenter.jsx';
import Students from "./pages/Students.jsx";
import Resume from "./pages/Resume.jsx";
import Settings from "./pages/Settings.jsx";
import Chats from "./pages/Chats.jsx";
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import FloatingButton from './components/floatingButton/FloatingButton.jsx';
import Auth from './pages/Auth.jsx';
import StatusError from './pages/StatusError.jsx';
import ResumeCreator from './pages/ResumeCreator.jsx';
import StudentOnboarding from './pages/StudentOnboarding.jsx';
import { routerBasename } from './utils/appBase.js';

/** Старые URL → уникальная ссылка /profile/:id */
const ProfileIdRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/profile/${id || ''}`} replace />;
};

/**
 * `/` — новая заглушка CareerCenter.
 * Старый Home.jsx сохранён: /#projects открывает его секцию проектов.
 */
const CareerOrLegacyHome = () => {
  const { hash } = useLocation();
  if (hash === '#projects') {
    return <Home />;
  }
  return <CareerCenter />;
};

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
          <Route path='/' element={<CareerOrLegacyHome />} />
          <Route path='/login' element={<Auth />} />
          <Route path='/registration' element={<Auth />} />
          <Route path='/forgot-password' element={<Auth />} />
          <Route path='/students' element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          } />
          {/* Свой профиль / настройки */}
          <Route path='/profile' element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          {/* Уникальная ссылка на студента: /profile/{uuid} */}
          <Route path='/profile/:id' element={
            <ProtectedRoute>
              <Resume />
            </ProtectedRoute>
          } />
          <Route path='/resume/:id' element={<ProfileIdRedirect />} />
          <Route path='/studentsResume/:id' element={<ProfileIdRedirect />} />
          <Route path='/settings' element={<Navigate to="/profile" replace />} />
          <Route path='/account' element={<Navigate to="/profile" replace />} />
          <Route path='/chats' element={
            <ProtectedRoute>
              <Chats />
            </ProtectedRoute>
          } />
          <Route path='/plug' element={
            <ProtectedRoute>
              <ResumeCreator />
            </ProtectedRoute>
          } />
          <Route path='/onboarding' element={
            <ProtectedRoute>
              <StudentOnboarding />
            </ProtectedRoute>
          } />
          <Route path='/error/:code' element={<StatusError />} />
          <Route path='*' element={<StatusError code="404" />} />
        </Routes>
        <FloatingButton />

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
    <Router basename={routerBasename}>
        <AppRoutes />
    </Router>
  )
}

export default App;
