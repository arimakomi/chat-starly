
import React, { useState } from 'react';
import { Send, User as UserIcon, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: { username: string; password?: string; displayName?: string; isNew: boolean }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'username' | 'password' | 'register' | '2fa'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const checkUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    if (cleanUser.length < 3) return setError('نام کاربری باید حداقل ۳ حرف باشد');
    
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
    if (users[cleanUser]) {
      setStep('password');
    } else {
      setStep('register');
    }
    setError('');
  };

  const handleFinal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');

    if (step === 'password') {
      if (users[cleanUser].password === password) {
        onLogin({ username: cleanUser, isNew: false });
      } else setError('رمز عبور اشتباه است');
    } else {
      if (password.length < 4) return setError('رمز عبور باید حداقل ۴ کاراکتر باشد');
      if (!displayName.trim()) return setError('نام نمایشی نمی‌تواند خالی باشد');
      onLogin({ username: cleanUser, password, displayName, isNew: true });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1621] p-6 text-white overflow-hidden font-['Vazirmatn']" dir="rtl">
      <div className="w-full max-w-sm space-y-8 animate-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#3390ec] rounded-[28px] mx-auto mb-6 flex items-center justify-center shadow-2xl rotate-3 transform hover:rotate-0 transition-transform">
            <Send size={40} className="text-white -translate-x-1" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">استارلی چت</h1>
          <p className="text-[#708499] text-sm">پیام‌رسان سریع و امن، بدون نیاز به شماره</p>
        </div>

        <div className="bg-[#17212b] p-8 rounded-3xl border border-white/5 shadow-2xl relative">
          {step !== 'username' && (
            <button onClick={() => setStep('username')} className="absolute top-4 left-4 p-2 hover:bg-white/5 rounded-full transition-colors text-[#708499]"><ArrowLeft size={18}/></button>
          )}

          <form onSubmit={step === 'username' ? checkUsername : handleFinal} className="space-y-6">
            {step === 'username' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#3390ec] uppercase ml-1">نام کاربری</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 text-[#708499]" size={20} />
                    <input 
                      value={username} onChange={e=>setUsername(e.target.value)}
                      placeholder="نام کاربری خود را وارد کنید..." 
                      className="w-full bg-[#242f3d] py-3.5 pl-11 pr-4 rounded-xl outline-none border border-transparent focus:border-[#3390ec] transition-all text-left placeholder:text-right"
                      autoFocus
                      dir="ltr"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-[#3390ec] rounded-xl font-bold hover:bg-[#2881d9] active:scale-95 transition-all shadow-lg shadow-[#3390ec]/20">مرحله بعد</button>
              </div>
            )}

            {(step === 'password' || step === 'register') && (
              <div className="space-y-4 animate-in">
                {step === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#3390ec] uppercase ml-1">نام نمایشی (در چت)</label>
                    <input 
                      value={displayName} onChange={e=>setDisplayName(e.target.value)}
                      placeholder="مثال: علی محمدی" 
                      className="w-full bg-[#242f3d] py-3.5 px-4 rounded-xl outline-none border border-transparent focus:border-[#3390ec] transition-all"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#3390ec] uppercase ml-1">رمز عبور</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-[#708499]" size={20} />
                    <input 
                      type="password" value={password} onChange={e=>setPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید..." 
                      className="w-full bg-[#242f3d] py-3.5 pl-11 pr-4 rounded-xl outline-none border border-transparent focus:border-[#3390ec] transition-all text-left placeholder:text-right"
                      autoFocus
                      dir="ltr"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-[#3390ec] rounded-xl font-bold hover:bg-[#2881d9] active:scale-95 transition-all">
                  {step === 'password' ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
                </button>
              </div>
            )}

            {error && <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</p>}
          </form>
        </div>
        
        <div className="text-center opacity-30 text-[10px] space-y-1" dir="ltr">
          <p>© 2025 Starly Messenger Pro</p>
          <p>Powered by Gemini 3.0 AI Engine</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
