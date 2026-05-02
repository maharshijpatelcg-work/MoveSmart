// MoveSmart — Registration Page
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Phone, MapPin, Camera, RefreshCw, CheckSquare, Square, Eye, EyeOff, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function drawCaptcha(canvas, code) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 180;
  canvas.height = 50;
  // Background
  ctx.fillStyle = '#1E2D3D';
  ctx.fillRect(0, 0, 180, 50);
  // Noise lines
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(${Math.random()*100+100},${Math.random()*100+100},${Math.random()*100+150},0.4)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 180, Math.random() * 50);
    ctx.lineTo(Math.random() * 180, Math.random() * 50);
    ctx.stroke();
  }
  // Noise dots
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * 180, Math.random() * 50, 2, 2);
  }
  // Text
  const colors = ['#00C6FF', '#4A9AF5', '#A78BFA', '#00E676', '#FFB74D', '#FF6B6B'];
  for (let i = 0; i < code.length; i++) {
    ctx.save();
    ctx.font = `${600 + Math.random() * 200} ${22 + Math.random() * 6}px Inter, monospace`;
    ctx.fillStyle = colors[i % colors.length];
    ctx.translate(20 + i * 25, 30 + Math.random() * 10);
    ctx.rotate((Math.random() - 0.5) * 0.4);
    ctx.fillText(code[i], 0, 0);
    ctx.restore();
  }
}

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const captchaRef = useRef(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', address: '', mobile: '',
    password: '', confirmPassword: '',
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = useCallback(() => {
    const code = generateCaptcha();
    setCaptchaCode(code);
    setCaptchaInput('');
    setTimeout(() => drawCaptcha(captchaRef.current, code), 50);
  }, []);

  useEffect(() => { refreshCaptcha(); }, [refreshCaptcha]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setProfilePic(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required');
    if (!form.address.trim()) return setError('Address is required');
    if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\s/g, ''))) return setError('Enter a valid 10-digit Indian mobile number');
    if (!profilePic) return setError('Profile photo is required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) { refreshCaptcha(); return setError('CAPTCHA code is incorrect'); }
    if (!isHuman) return setError('Please confirm you are not a robot');

    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}@movesmart.app`,
          phone: form.mobile,
          address: form.address,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      toast.success('Account created successfully! 🎉', { style: { background: '#162231', color: '#00E676', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '12px' } });
      onLogin(data.user || { name: `${form.firstName} ${form.lastName}`, phone: form.mobile }, data.token || 'demo-token');
      navigate('/dashboard');
    } catch (err) {
      // If backend is down, create demo account
      toast.success('Account created! Welcome to MoveSmart 🎉', { style: { background: '#162231', color: '#00E676', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '12px' } });
      onLogin({ name: `${form.firstName} ${form.lastName}`, phone: form.mobile, address: form.address, avatar: profilePreview }, 'demo-token');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <section className="auth" id="register-page">
      <div className="auth__card auth__card--wide">
        <div className="auth__card-header">
          <span className="auth__logo">🚀</span>
          <h1 className="auth__title">Create Account</h1>
          <p className="auth__subtitle">Join MoveSmart for smarter, safer commuting</p>
        </div>

        {error && <div className="auth__error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Profile Photo */}
          <div className="register-photo">
            <div className="register-photo__preview" onClick={() => fileRef.current?.click()}>
              {profilePreview ? (
                <img src={profilePreview} alt="Profile" />
              ) : (
                <div className="register-photo__empty"><Camera size={24} /><span>Upload Photo</span></div>
              )}
              <div className="register-photo__overlay"><Upload size={16} /></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
            <span className="register-photo__hint">Passport size • Max 2MB</span>
          </div>

          {/* Name Row */}
          <div className="register-row">
            <div className="form-group">
              <label htmlFor="reg-firstname"><User size={14} /> First Name</label>
              <input id="reg-firstname" name="firstName" type="text" placeholder="Maharshi" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-lastname"><User size={14} /> Last Name</label>
              <input id="reg-lastname" name="lastName" type="text" placeholder="Patel" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label htmlFor="reg-address"><MapPin size={14} /> Address</label>
            <input id="reg-address" name="address" type="text" placeholder="123, Satellite Road, Ahmedabad, Gujarat" value={form.address} onChange={handleChange} required />
          </div>

          {/* Mobile */}
          <div className="form-group">
            <label htmlFor="reg-mobile"><Phone size={14} /> Mobile Number</label>
            <div className="input-with-prefix">
              <span className="input-prefix">+91</span>
              <input id="reg-mobile" name="mobile" type="tel" placeholder="98765 43210" maxLength="10" value={form.mobile} onChange={handleChange} required />
            </div>
          </div>

          {/* Password Row */}
          <div className="register-row">
            <div className="form-group">
              <label htmlFor="reg-password"><Lock size={14} /> Password</label>
              <div className="input-with-icon">
                <input id="reg-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm"><Lock size={14} /> Confirm Password</label>
              <div className="input-with-icon">
                <input id="reg-confirm" name="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
                <button type="button" className="input-icon-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="register-captcha">
            <label>🔒 Security Verification</label>
            <div className="register-captcha__row">
              <canvas ref={captchaRef} className="register-captcha__canvas"></canvas>
              <button type="button" className="register-captcha__refresh" onClick={refreshCaptcha} title="Refresh CAPTCHA">
                <RefreshCw size={16} />
              </button>
            </div>
            <input type="text" placeholder="Enter the code above" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} required className="register-captcha__input" />
          </div>

          {/* I am not a robot */}
          <div className="register-robot" onClick={() => setIsHuman(!isHuman)}>
            <button type="button" className={`register-robot__checkbox${isHuman ? ' checked' : ''}`}>
              {isHuman ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
            <span>I am not a robot</span>
            <div className="register-robot__badge">
              <svg viewBox="0 0 24 24" width="28" height="28"><path fill="#4A9AF5" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <div><small>MoveSmart</small><small>Security</small></div>
            </div>
          </div>

          <button type="submit" className="btn btn--primary auth__btn" disabled={loading} id="register-submit">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth__footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </section>
  );
}
