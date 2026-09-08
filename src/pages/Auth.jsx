import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal.jsx';
import { isAuthenticated } from '../services/authApi.js';

const Auth = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (isAuthenticated()) {
        const from = location.state?.from;
        const dest = from && from !== '/login' && from !== '/registration' ? from : '/students';
        return <Navigate to={dest} replace />;
    }

    const handleSuccess = () => {
        const from = location.state?.from;
        const dest = from && from !== '/login' && from !== '/registration' ? from : '/students';
        navigate(dest, { replace: true });
    };

    return <LoginModal onClose={() => navigate('/')} onSuccess={handleSuccess} />;
};

export default Auth;
