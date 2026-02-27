import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Min 6 characters';
    if (mode === 'signup' && !name) errs.name = 'Name is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    try {
      if (mode === 'signup') {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1400);
    } catch (error) {
      setErrors({ auth: error.message });
    } finally {
      if (!success) setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-bg" />
      <div className="signin-gradient" />

      <div className="signin-card">
        <Link to="/" className="signin-logo">laura<span>.</span></Link>

        {success ? (
          <div className="signin-success">
            <div className="signin-success-icon">✓</div>
            <h3>Welcome{name ? `, ${name}` : ''}!</h3>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '1px', marginTop: '8px' }}>
              Taking you to the stream...
            </p>
          </div>
        ) : (
          <>
            <div className="signin-title">{mode === 'signin' ? 'SIGN IN' : 'JOIN'}</div>
            <div className="signin-sub">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</div>

            {errors.auth && <div className="form-error" style={{ marginBottom: '15px', color: '#ff4444', background: '#331111', padding: '10px', borderRadius: '4px' }}>{errors.auth}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className={`form-input${errors.name ? ' error' : ''}`}
                    placeholder="What should we call you?"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-input${errors.email ? ' error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className={`form-input${errors.password ? ' error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>

              {mode === 'signin' && (
                <div className="form-row">
                  <label className="form-remember">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="form-forgot">Forgot Password?</a>
                </div>
              )}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
              </button>
            </form>

            <div className="signin-divider"><span>or</span></div>

            <button type="button" className="signin-alt" onClick={() => navigate('/')}>
              Continue as Guest
            </button>

            <div className="signin-footer">
              {mode === 'signin' ? (
                <>
                  New to laura?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setErrors({}); }}>
                    Create an account
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setMode('signin'); setErrors({}); }}>
                    Sign in
                  </a>
                </>
              )}
              <br />
              By signing in you agree to our{' '}
              <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
