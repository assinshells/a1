// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultRoom } from '../config/rooms';

import AuthForm from "../components/auth/AuthForm";
import AuthInput from "../components/auth/AuthInput";
import AuthPasswordInput from "../components/auth/AuthPasswordInput";
import RoomSelector from "../components/auth/RoomSelector";
import Button from "../components/common/Button";

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        selectedRoom: getDefaultRoom().id
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoomChange = (roomId) => {
        setFormData({ ...formData, selectedRoom: roomId });
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
            await register(
                formData.username,
                formData.email || undefined,
                formData.password
            );
            
            // ✅ ИСПРАВЛЕНО: Сохраняем выбранную комнату
            localStorage.setItem('selectedRoom', formData.selectedRoom);
            
            // ✅ ИСПРАВЛЕНО: Перенаправляем с параметром комнаты
            navigate(`/chat?room=${formData.selectedRoom}`);
        } catch (err) {
            setError(err.message || 'Registration failed');
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
                    label="Username"
                    icon="bi bi-person"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="username"
                    minLength="3"
                    required
                />

                <AuthInput
                    label="Email (optional)"
                    icon="bi bi-envelope"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com (optional)"
                />

                <small className="text-muted mb-3 d-block">
                    Email is optional. If provided, you can use it for login and password recovery.
                </small>

                <AuthPasswordInput
                    label="Password"
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
                
                <RoomSelector
                    selectedRoom={formData.selectedRoom}
                    onRoomChange={handleRoomChange}
                />
                
                <Button loading={loading}>
                    <i className="bi bi-person-plus me-2"></i>
                    Sign Up
                </Button>

                <div className="text-center">
                    <span className="text-muted">Already have an account? </span>
                    <Link to="/login">Log in</Link>
                </div>
            </form>
        </AuthForm>
    );
};

export default Register;