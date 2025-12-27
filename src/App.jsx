import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Students from "./pages/Students.jsx";
import Resume from "./pages/Resume.jsx";
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import FloatingButton from './components/floatingButton/FloatingButton.jsx';

function App() {
  return (
    <Router>
        <Routes>
            <Route path='/' element={< Home />} />
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
        </Routes>
        <FloatingButton />
    </Router>
  )
}

export default App;