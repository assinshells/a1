import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

import AuthForm from "../components/auth/AuthForm";
import AuthInput from "../components/auth/AuthInput";
import Button from "../components/common/Button";

const ForgotPassword = () => {
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await authAPI.forgotPassword(identifier);
            setSuccess(true);
            setIdentifier('');
        } catch (err) {
            setError(err.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm>
            <div className="text-center mb-4">
                <i className="bi bi-key-fill text-primary fs-1 mb-3"></i>
                <h4>Forgot Password?</h4>
                <p className="text-muted small">
                    Enter your username or email and we'll send you a password reset link
                </p>
            </div>

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    If the account exists, a password reset link has been sent.
                    Please check your email (or console in dev mode).
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <AuthInput
                    label="Username or Email"
                    icon="bi bi-person"
                    type="text"
                    name="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your username or email"
                    required
                />

                <Button loading={loading}>
                    <i className="bi bi-send me-2"></i>
                    Send Reset Link
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

export default ForgotPassword;