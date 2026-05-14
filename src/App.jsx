import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home.jsx';
import Students from "./pages/Students.jsx";
import Resume from "./pages/Resume.jsx";
import Account from "./pages/Account.jsx";
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
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
          <Route path='/students' element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          } />
          <Route path='/studentsResume/:id' element={
            <ProtectedRoute>
              <Resume />
            </ProtectedRoute>
          } />
          <Route path='/account' element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } />
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
    <Router>
        <AppRoutes />
    </Router>
  )
}

export default App;