
import React, { useState } from 'react';
import { User } from '../types';
import { X, Shield, Key, Check, Smartphone, Lock, Camera, LogOut, ChevronLeft, Eye, Clock, Monitor, User as UserIcon, ArrowRight, Copy, QrCode } from 'lucide-react';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updated: User) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUpdateUser }) => {
  const [tab, setTab] = useState<'profile' | 'security'>('profile');
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [otherSessions, setOtherSessions] = useState(true);

  // 2FA Setup State
  const [twoFactorStep, setTwoFactorStep] = useState<0 | 1 | 2>(0); // 0: off, 1: guide, 2: scan & verify
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [verify2FACode, setVerify2FACode] = useState('');
  const [error2FA, setError2FA] = useState('');

  const save = (changes: Partial<User>) => {
    const updatedUser = { ...user, ...changes };
    onUpdateUser(updatedUser);
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
    if (users[user.username]) {
      users[user.username] = { ...users[user.username], ...changes };
      localStorage.setItem('starly_users', JSON.stringify(users));
    }
  };

  const handleAvatarChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev: any) => save({ avatar: ev.target.result });
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const togglePrivacy = (field: 'showStatus' | 'showAvatar') => {
    const current = user.privacy[field];
    const next = current === 'all' ? 'none' : 'all';
    save({ privacy: { ...user.privacy, [field]: next } });
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const start2FASetup = () => {
    if (user.twoFactorEnabled) {
      if(confirm('آیا مطمئن هستید که می‌خواهید تایید دو مرحله‌ای را غیرفعال کنید؟')) {
        save({ twoFactorEnabled: false });
      }
    } else {
      setTwoFactorSecret(generateSecret());
      setTwoFactorStep(1);
    }
  };

  const handle2FAVerify = () => {
    setError2FA('');
    // Mock verification: Check if it's 6 digits
    // In a real app, we would verify the TOTP code against the secret here.
    if (!/^\d{6}$/.test(verify2FACode)) {
      return setError2FA('کد وارد شده باید ۶ رقم باشد.');
    }
    
    // Success
    save({ twoFactorEnabled: true });
    alert('تایید دو مرحله‌ای با موفقیت فعال شد!');
    setTwoFactorStep(0);
    setVerify2FACode('');
    setTwoFactorSecret('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#17212b] rounded-3xl overflow-hidden border border-white/5 shadow-2xl animate-in zoom-in h-[85vh] flex flex-col relative">
        
        {/* 2FA Wizard Overlay */}
        {twoFactorStep > 0 && (
          <div className="absolute inset-0 bg-[#17212b] z-50 flex flex-col animate-in slide-in-from-right overflow-y-auto no-scrollbar">
             <div className="p-4 flex items-center gap-4 border-b border-white/5 shrink-0">
                <button onClick={() => { 
                  if(twoFactorStep === 1) setTwoFactorStep(0);
                  else setTwoFactorStep(1);
                  setError2FA('');
                }} className="p-2 hover:bg-white/5 rounded-full text-[#708499]"><ArrowRight/></button>
                <h3 className="font-bold text-white">تنظیم Google Authenticator</h3>
             </div>
             
             <div className="flex-1 p-6 flex flex-col items-center text-center space-y-6">
                {twoFactorStep === 1 && (
                  <div className="space-y-6 animate-in fade-in py-10">
                    <div className="w-24 h-24 bg-[#3390ec]/20 rounded-full flex items-center justify-center mx-auto text-[#3390ec] mb-4">
                       <Shield size={48}/>
                    </div>
                    <h2 className="text-xl font-bold text-white">تایید دو مرحله‌ای (2FA)</h2>
                    <p className="text-sm text-[#708499] leading-loose">
                      برای افزایش امنیت حساب خود، از برنامه‌هایی مانند <span className="text-white font-bold">Google Authenticator</span> استفاده کنید. این برنامه‌ها کدهای یک‌بار مصرف تولید می‌کنند که برای ورود به آن نیاز خواهید داشت.
                    </p>
                    <div className="bg-[#242f3d] p-4 rounded-xl text-xs text-[#708499] border border-white/5 w-full text-right">
                       <p className="mb-2 font-bold text-[#3390ec]">مراحل فعال‌سازی:</p>
                       <ul className="list-disc list-inside space-y-1">
                          <li>برنامه Google Authenticator را نصب کنید.</li>
                          <li>در مرحله بعد QR Code را اسکن کنید.</li>
                          <li>کد ۶ رقمی نمایش داده شده را وارد کنید.</li>
                       </ul>
                    </div>
                    <button onClick={() => setTwoFactorStep(2)} className="w-full py-3 bg-[#3390ec] rounded-xl font-bold text-white shadow-lg mt-8">شروع فعال‌سازی</button>
                  </div>
                )}

                {twoFactorStep === 2 && (
                   <div className="w-full space-y-6 animate-in fade-in">
                     <div className="bg-white p-4 rounded-2xl mx-auto w-fit shadow-xl">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`otpauth://totp/StarlyChat:${user.username}?secret=${twoFactorSecret}&issuer=StarlyChat`)}`} 
                          className="w-44 h-44"
                          alt="QR Code"
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <p className="text-xs text-[#708499]">اگر نمی‌توانید اسکن کنید، کد زیر را دستی وارد کنید:</p>
                        <div onClick={() => navigator.clipboard.writeText(twoFactorSecret)} className="bg-[#242f3d] p-3 rounded-xl font-mono text-[#3390ec] tracking-widest text-center cursor-pointer hover:bg-[#2b3949] transition-colors border border-dashed border-[#3390ec]/30 flex items-center justify-center gap-2 group">
                           {twoFactorSecret}
                           <Copy size={14} className="opacity-50 group-hover:opacity-100"/>
                        </div>
                     </div>

                     <div className="w-full h-px bg-white/10 my-4"/>

                     <div className="space-y-3 w-full">
                        <h3 className="font-bold text-white text-sm">کد تایید را وارد کنید</h3>
                        <input 
                          type="number" 
                          value={verify2FACode} 
                          onChange={e=>setVerify2FACode(e.target.value.slice(0,6))}
                          placeholder="کد ۶ رقمی (مثال: 123456)" 
                          className="w-full bg-[#242f3d] p-4 rounded-xl text-center text-white text-lg tracking-[0.5em] outline-none focus:border-[#3390ec] border border-transparent transition-all placeholder:tracking-normal placeholder:text-sm"
                          autoFocus
                          dir="ltr"
                        />
                        {error2FA && <p className="text-red-400 text-xs">{error2FA}</p>}
                     </div>
                     
                     <button onClick={handle2FAVerify} className="w-full py-3 bg-[#3390ec] rounded-xl font-bold text-white shadow-lg">بررسی و فعال‌سازی</button>
                   </div>
                )}
             </div>
          </div>
        )}

        <div className="flex p-4 border-b border-white/5 bg-[#242f3d] shrink-0">
          <h3 className="font-bold flex-1 text-white">تنظیمات استارلی چت</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-[#708499]"><X/></button>
        </div>
        
        <div className="flex border-b border-white/5 bg-[#17212b] shrink-0">
          {['profile', 'security'].map((t: any) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-4 text-xs font-bold transition-all relative ${tab===t?'text-[#3390ec]':'text-[#708499]'}`}>
              {t === 'profile' ? 'حساب کاربری' : 'حریم خصوصی و امنیت'}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3390ec] rounded-t-full"/>}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar bg-[#17212b] flex-1">
          {tab === 'profile' && (
            <div className="space-y-6 animate-in slide-in-from-left">
              <div className="text-center group relative w-28 h-28 mx-auto">
                <img src={user.avatar} className="w-28 h-28 rounded-full border-4 border-[#3390ec] object-cover shadow-2xl transition-transform group-hover:scale-105 bg-[#242f3d]"/>
                <div onClick={handleAvatarChange} className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Camera size={32} className="text-white"/>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                   <div className="bg-[#242f3d] p-3 rounded-xl flex items-center gap-3 border border-white/5">
                      <div className="p-2 bg-[#3390ec]/20 rounded-full text-[#3390ec]"><UserIcon size={20}/></div>
                      <div className="flex-1">
                         <p className="text-xs text-[#708499]">نام کاربری</p>
                         <p className="text-sm font-bold text-white" dir="ltr">@{user.username}</p>
                      </div>
                   </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3390ec] mr-1 uppercase tracking-widest">نام نمایشی</label>
                  <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full bg-[#242f3d] p-4 rounded-xl outline-none border border-white/5 focus:border-[#3390ec] transition-all text-white"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3390ec] mr-1 uppercase tracking-widest">بایوگرافی (درباره شما)</label>
                  <textarea value={bio} onChange={e=>setBio(e.target.value)} className="w-full bg-[#242f3d] p-4 rounded-xl outline-none border border-white/5 h-24 resize-none no-scrollbar focus:border-[#3390ec] transition-all text-white"/>
                </div>
                <button onClick={() => save({displayName, bio})} className="w-full py-4 bg-[#3390ec] rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-[#2881d9] active:scale-95 transition-all text-white"><Check size={20}/> ذخیره پروفایل</button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-left pb-10">
               
               {/* Active Sessions */}
               <section className="space-y-3">
                  <h4 className="text-[#3390ec] font-bold text-xs uppercase tracking-widest px-1">نشست‌های فعال</h4>
                  <div className="bg-[#242f3d] rounded-2xl overflow-hidden border border-white/5">
                     <div className="p-4 border-b border-white/5 flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#3390ec] rounded-full flex items-center justify-center"><Smartphone className="text-white"/></div>
                        <div className="flex-1">
                           <h5 className="font-bold text-white text-sm">این دستگاه (Web)</h5>
                           <p className="text-[10px] text-green-400">آنلاین • استارلی چت وب</p>
                        </div>
                     </div>
                     {otherSessions && (
                       <div className="p-4 flex items-center gap-4 opacity-50 animate-in fade-in">
                          <div className="w-10 h-10 bg-[#17212b] rounded-full flex items-center justify-center border border-white/10"><Monitor className="text-[#708499]"/></div>
                          <div className="flex-1">
                             <h5 className="font-bold text-white text-sm">Windows 11</h5>
                             <p className="text-[10px] text-[#708499]">آخرین بازدید: ۲ ساعت پیش • شیراز، ایران</p>
                          </div>
                       </div>
                     )}
                     {otherSessions ? (
                        <button onClick={() => setOtherSessions(false)} className="w-full p-3 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors">بستن همه نشست‌های دیگر</button>
                     ) : (
                        <div className="w-full p-3 text-green-400 text-xs font-bold text-center bg-green-500/10">سایر نشست‌ها بسته شدند.</div>
                     )}
                  </div>
               </section>

               {/* Privacy */}
               <section className="space-y-2">
                  <h4 className="text-[#3390ec] font-bold text-xs uppercase tracking-widest px-1">حریم خصوصی</h4>
                  <SecurityItem 
                    icon={<Clock/>} 
                    label="آخرین بازدید و آنلاین" 
                    extra={user.privacy.showStatus === 'all' ? 'همه' : 'هیچکس'} 
                    onClick={() => togglePrivacy('showStatus')}
                  />
                  <SecurityItem 
                    icon={<Camera/>} 
                    label="تصویر پروفایل" 
                    extra={user.privacy.showAvatar === 'all' ? 'همه' : 'هیچکس'} 
                    onClick={() => togglePrivacy('showAvatar')}
                  />
               </section>

               {/* Advanced Security */}
               <section className="space-y-2">
                  <h4 className="text-[#3390ec] font-bold text-xs uppercase tracking-widest px-1">امنیت پیشرفته</h4>
                  <SecurityItem 
                    icon={<QrCode/>} label="تأیید دو مرحله‌ای (2FA)" 
                    onClick={start2FASetup} 
                    extra={user.twoFactorEnabled ? 'فعال' : 'غیرفعال'} 
                    isActive={user.twoFactorEnabled}
                  />
                  <SecurityItem 
                    icon={<Lock/>} label="قفل برنامه (Passcode)" 
                    onClick={() => {
                      const code = prompt('کد جدید ۴ رقمی برای قفل برنامه:');
                      if(code) save({passcode: code});
                      else if(user.passcode && confirm('آیا رمز عبور حذف شود؟')) save({passcode: undefined});
                    }} 
                    extra={user.passcode ? 'فعال' : 'غیرفعال'}
                    isActive={!!user.passcode}
                  />
               </section>

               <div className="pt-4">
                 <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95 border border-red-500/20">
                   <LogOut size={18}/> خروج از حساب
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SecurityItem = ({icon, label, onClick, extra, isActive}: any) => (
  <div onClick={onClick} className="flex items-center justify-between p-4 bg-[#242f3d] rounded-2xl cursor-pointer hover:bg-[#2b3949] transition-all border border-white/5 group shadow-sm select-none">
    <div className="flex items-center gap-4">
      <span className={`transition-colors p-2 rounded-lg ${isActive ? 'bg-[#3390ec]/20 text-[#3390ec]' : 'bg-white/5 text-[#708499]'}`}>{icon}</span>
      <span className="text-sm font-medium text-white">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {extra && <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-[#708499]'}`}>{extra}</span>}
      <ChevronLeft size={16} className="text-[#708499] group-hover:translate-x-[-4px] transition-all"/>
    </div>
  </div>
);

export default SettingsModal;
