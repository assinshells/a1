import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import AuthForm from "../components/auth/AuthForm";
import AuthInput from "../components/auth/AuthInput";
import AuthPasswordInput from "../components/auth/AuthPasswordInput";
import Button from "../components/common/Button";

const Login = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.identifier, formData.password);
            navigate('/chat');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm>
            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <AuthInput
                    label="Username or Email"
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder="Username or email address"
                    required
                />

                <AuthPasswordInput
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                />

                <Button loading={loading}>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Log In
                </Button>

                <div className="text-center mb-3">
                    <Link to="/forgot-password" className="text-decoration-none">
                        Forgot password?
                    </Link>
                </div>

                <hr />

                <div className="d-grid">
                    <Link to="/register" className="btn btn-success">
                        Create new Account
                    </Link>
                </div>
            </form>
        </AuthForm>
    );
};

export default Login;