import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

import AuthForm from "../components/auth/AuthForm";
import AuthPasswordInput from "../components/auth/AuthPasswordInput";
import Button from "../components/common/Button";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (!tokenFromUrl) {
            setError('Invalid reset link. Please request a new password reset.');
        } else {
            setToken(tokenFromUrl);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword(token, formData.password);

            // Показываем успешное сообщение
            alert('Password reset successful! You can now log in with your new password.');
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !error) {
        return (
            <AuthForm>
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </AuthForm>
        );
    }

    return (
        <AuthForm>
            <div className="text-center mb-4">
                <i className="bi bi-shield-lock-fill text-primary fs-1 mb-3"></i>
                <h4>Reset Password</h4>
                <p className="text-muted small">
                    Enter your new password
                </p>
            </div>

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <AuthPasswordInput
                    label="New Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength="6"
                    required
                />

                <AuthPasswordInput
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                />

                <Button loading={loading} disabled={!token}>
                    <i className="bi bi-check-circle me-2"></i>
                    Reset Password
                </Button>

                <div className="text-center">
                    <Link to="/login" className="text-decoration-none">
                        <i className="bi bi-arrow-left me-1"></i>
                        Back to Login
                    </Link>
                </div>
            </form>
        </AuthForm>
    );
};

export default ResetPassword;