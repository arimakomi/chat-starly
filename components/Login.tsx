
import React, { useState, useEffect } from 'react';
import { Send, Lock, User as UserIcon, ArrowRight, UserPlus } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: { username: string; password?: string; displayName?: string; isNew: boolean }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'username' | 'password' | 'register'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const checkUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) return setError('یوزرنیم باید حداقل ۳ کاراکتر باشد');
    
    const users = JSON.parse(localStorage.getItem('gram_users') || '{}');
    if (users[username.toLowerCase()]) {
      setStep('password');
    } else {
      setStep('register');
    }
    setError('');
  };

  const handleFinalAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'password') {
      const users = JSON.parse(localStorage.getItem('gram_users') || '{}');
      if (users[username.toLowerCase()].password === password) {
        onLogin({ username, password, isNew: false });
      } else {
        setError('رمز عبور اشتباه است');
      }
    } else {
      if (password.length < 4 || displayName.length < 2) {
        return setError('اطلاعات را کامل وارد کنید');
      }
      onLogin({ username, password, displayName, isNew: true });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1621] px-4 font-sans" dir="rtl">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="w-24 h-24 bg-[#2b5278] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform">
            <Send className="w-12 h-12 text-white -translate-x-1" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">جمینی‌گرام</h2>
          <p className="text-[#708499]">نسل جدید پیام‌رسان هوشمند</p>
        </div>

        <div className="bg-[#17212b] p-8 rounded-2xl shadow-xl border border-[#242f3d]">
          {step === 'username' && (
            <form onSubmit={checkUsername} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[#3390ec] text-sm font-medium">نام کاربری</label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-3 w-5 h-5 text-[#708499]" />
                  <input
                    type="text"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#242f3d] border-none rounded-xl py-3 pr-10 pl-4 text-white placeholder-[#708499] focus:ring-2 focus:ring-[#3390ec] transition-all"
                    placeholder="Username"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-[#3390ec] hover:bg-[#2881d9] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                بعدی <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </form>
          )}

          {(step === 'password' || step === 'register') && (
            <form onSubmit={handleFinalAction} className="space-y-6 animate-in slide-in-from-left-4">
              <div className="flex items-center gap-2 text-[#708499] mb-4 bg-[#242f3d] p-2 rounded-lg">
                <UserIcon className="w-4 h-4" />
                <span className="text-sm">@{username}</span>
                <button type="button" onClick={() => setStep('username')} className="mr-auto text-[#3390ec] text-xs">تغییر</button>
              </div>

              {step === 'register' && (
                <div className="space-y-2">
                  <label className="text-[#3390ec] text-sm font-medium">نام نمایشی</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#242f3d] border-none rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-[#3390ec]"
                    placeholder="مثل: علی علوی"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[#3390ec] text-sm font-medium">رمز عبور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 w-5 h-5 text-[#708499]" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#242f3d] border-none rounded-xl py-3 pr-10 pl-4 text-white focus:ring-2 focus:ring-[#3390ec]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <button type="submit" className="w-full py-3 bg-[#3390ec] hover:bg-[#2881d9] text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {step === 'password' ? 'ورود' : 'ثبت‌نام و ورود'}
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center text-[#708499] text-xs">
          بدون نیاز به شماره موبایل یا ایمیل
        </p>
      </div>
    </div>
  );
};

export default Login;
