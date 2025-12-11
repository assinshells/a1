import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultRoom } from '../config/rooms';

import AuthForm from "../components/auth/AuthForm";
import AuthInput from "../components/auth/AuthInput";
import AuthPasswordInput from "../components/auth/AuthPasswordInput";
import RoomSelector from "../components/auth/RoomSelector";
import Button from "../components/common/Button";
import Logo from "../components/common/Logo";

const Login = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '', selectedRoom: getDefaultRoom().id });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
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
            <Logo />
            {error && (
                <div className="alert alert-danger">
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
                <RoomSelector
                    selectedRoom={formData.selectedRoom}
                    onRoomChange={handleRoomChange}
                />
                <Button loading={loading}>
                    Log In
                </Button>


                <div className="d-flex justify-content-between">
                    <Link to="/forgot-password" className="text-decoration-none">
                        Forgot password?
                    </Link>
                    <Link to="/register" className="text-decoration-none">
                        Create new Account
                    </Link>
                </div>
            </form>
        </AuthForm>
    );
};

export default Login;