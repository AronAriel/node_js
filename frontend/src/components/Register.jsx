import { useState } from 'react';
import axios from 'axios';

export default function Register({ switchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Invalid email format');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    const passStrong = /(?=.*[A-Za-z])(?=.*\d)/.test(password);
    if (!passStrong) {
      setError('Password should contain at least one letter and one number');
      return;
    }

    try {
      await axios.post('http://localhost:5000/auth/register', { email, password });
      setSuccess('Registration successful. You can now login.');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="buttons">
          <button type="submit">Register</button>
          <button type="button" onClick={switchToLogin}>Back to Login</button>
        </div>
      </form>
    </div>
  );
}
