import React, { useState } from 'react';
import { FaGraduationCap, FaUserShield, FaChalkboardTeacher, FaUserGraduate, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom'; 
import { login } from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
        userType: 'student' // Default to student
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setError('');
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
    
        try {
            const { email, password, userType, rememberMe } = formData;
            const response = await login(email, password, userType);
            
            const { token, user } = response;
            
            // Store token and user data
            if (rememberMe) {
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                sessionStorage.setItem('authToken', token);
                sessionStorage.setItem('user', JSON.stringify(user));
            }
    
            // Redirect based on user type
            switch(user.userType) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'staff':
                    navigate('/staff');
                    break;
                case 'student':
                    navigate('/student');
                    break;
                case 'parent':
                    navigate('/parent');
                    break;
                default:
                    navigate('/');
            }
    
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            email: '',
            password: '',
            rememberMe: false,
            userType: 'student'
        });
        setError('');
    };

    return (
        <div className="min-h-screen bg-indigo-100 flex flex-col items-center pt-24 pb-12">
            {/* Header */}
            <div className="flex items-center gap-2 mb-8">
                <FaGraduationCap className="text-4xl text-sky-800" />
                <span className="text-3xl font-bold text-sky-800">EduSpark</span>
            </div>

            {/* Login Form */}
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-sky-800 mb-6">Login to Your Account</h2>

                {/* Error Message Display */}
                {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-2 rounded">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Type Selection */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                            { value: 'student', label: 'Student', icon: <FaUserGraduate className="text-xl" /> },
                            { value: 'staff', label: 'Staff', icon: <FaChalkboardTeacher className="text-xl" /> },
                            { value: 'admin', label: 'Admin', icon: <FaUserShield className="text-xl" /> },
                            { value: 'parent', label: 'Parent', icon: <FaUser className="text-xl" /> }
                        ].map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                    setError('');
                                    setFormData({ ...formData, userType: type.value })
                                }}
                                className={`flex flex-col items-center p-3 rounded-lg transition-all ${formData.userType === type.value ? 'bg-sky-100 text-sky-800 ring-2 ring-sky-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {type.icon}
                                <span className="mt-1 text-sm">{type.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Email Address */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email" id="email" name="email"
                            value={formData.email} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password" id="password" name="password"
                            value={formData.password} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="rememberMe" name="rememberMe" type="checkbox"
                                checked={formData.rememberMe} onChange={handleChange}
                                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                            />
                            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                                Remember me
                            </label>
                        </div>

                        <Link to="/forgot-password" className="text-sm text-sky-600 hover:text-sky-500">
                            Forgot password?
                        </Link>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 bg-sky-800 text-white py-2 px-4 rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-semibold hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;