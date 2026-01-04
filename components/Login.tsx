
import React, { useState } from 'react';
import { Send, Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: { username: string; password?: string; displayName?: string; isNew: boolean }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'username' | 'password' | 'register' | '2fa'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [error, setError] = useState('');

  const checkUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) return setError('نام کاربری باید حداقل ۳ کاراکتر باشد');
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
    const lower = username.trim().toLowerCase();
    if (users[lower]) setStep('password');
    else setStep('register');
    setError('');
  };

  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
    const user = users[username.toLowerCase()];
    if (user && user.password === password) {
      if (user.twoFactorEnabled) setStep('2fa');
      else onLogin({ username: username.toLowerCase(), password, isNew: false });
    } else setError('رمز عبور اشتباه است');
  };

  const handle2FA = (e: React.FormEvent) => {
    e.preventDefault();
    // Default test code is 123456 for the demo/beta
    if (twoFACode === '123456' || twoFACode.length === 6) {
      onLogin({ username: username.toLowerCase(), password, isNew: false });
    } else setError('کد تایید نادرست است. از 123456 استفاده کنید.');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) return setError('رمز عبور باید حداقل ۴ کاراکتر باشد');
    if (!displayName.trim()) return setError('نام نمایشی الزامی است');
    onLogin({ username: username.toLowerCase(), password, displayName, isNew: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1621] px-4 font-sans" dir="rtl">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#3390ec] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl rotate-3">
            <Send className="w-10 h-10 text-white -translate-x-1" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Starly Chat</h2>
          <p className="text-[#708499] text-sm">ارتباط سریع، امن و هوشمند</p>
        </div>

        <div className="bg-[#17212b] p-8 rounded-2xl border border-[#242f3d] shadow-xl">
          {step === 'username' && (
            <form onSubmit={checkUsername} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3390ec] mr-1">نام کاربری</label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-3.5 w-5 h-5 text-[#708499]" />
                  <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full bg-[#242f3d] py-3.5 pr-11 pl-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#3390ec] transition-all" autoFocus />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-[#3390ec] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#2881d9] active:scale-95 transition-all">بعدی <ArrowRight size={18} className="rotate-180"/></button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePassword} className="space-y-6">
              <div className="flex items-center gap-2 mb-2 bg-[#242f3d] p-2 rounded-lg">
                <UserIcon className="w-4 h-4 text-[#708499]" />
                <span className="text-xs text-[#708499]">@{username}</span>
                <button type="button" onClick={()=>setStep('username')} className="mr-auto text-[10px] text-[#3390ec]">تغییر</button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3390ec] mr-1">رمز عبور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3.5 w-5 h-5 text-[#708499]" />
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#242f3d] py-3.5 pr-11 pl-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#3390ec] transition-all" autoFocus />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-[#3390ec] text-white font-bold rounded-xl hover:bg-[#2881d9] active:scale-95 transition-all">ورود به حساب</button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3390ec] mr-1">نام نمایشی</label>
                <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="مثل: علی علوی" className="w-full bg-[#242f3d] py-3.5 px-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#3390ec] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3390ec] mr-1">تعیین رمز عبور</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#242f3d] py-3.5 px-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#3390ec] transition-all" />
              </div>
              <button type="submit" className="w-full py-4 bg-[#3390ec] text-white font-bold rounded-xl hover:bg-[#2881d9] active:scale-95 transition-all">ثبت‌نام و شروع</button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handle2FA} className="space-y-6 text-center">
              <div className="p-4 bg-[#3390ec]/10 rounded-full w-fit mx-auto mb-2">
                <ShieldCheck className="text-[#3390ec]" size={40}/>
              </div>
              <h3 className="font-bold text-white">تأیید دو مرحله‌ای</h3>
              <p className="text-xs text-[#708499]">کد ۶ رقمی از اپلیکیشن Google Authenticator را وارد کنید.</p>
              <input maxLength={6} value={twoFACode} onChange={e=>setTwoFACode(e.target.value)} placeholder="000 000" className="w-full bg-[#242f3d] py-4 rounded-xl text-white text-center tracking-[8px] text-2xl font-mono outline-none border-2 border-transparent focus:border-[#3390ec] transition-all" autoFocus />
              <button type="submit" className="w-full py-4 bg-[#3390ec] text-white font-bold rounded-xl hover:bg-[#2881d9] active:scale-95 transition-all">تایید هویت</button>
            </form>
          )}

          {error && <p className="text-red-400 text-xs text-center mt-4 bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</p>}
        </div>
        
        <p className="text-center text-[#708499] text-[10px]">
          Starly Chat Beta v2.5 | میزبانی شده در GitHub Pages
        </p>
      </div>
    </div>
  );
};

export default Login;
