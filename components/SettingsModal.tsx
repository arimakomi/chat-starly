
import React, { useState } from 'react';
import { User } from '../types';
import { X, Shield, Key, Check, Smartphone, Lock, Camera, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updated: User) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | '2fa' | 'security'>('profile');
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [twoFAEnabled, setTwoFAEnabled] = useState(user.twoFactorEnabled || false);

  const handleSave = () => {
    onUpdateUser({ ...user, displayName, bio, twoFactorEnabled: twoFAEnabled });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#17212b] rounded-3xl overflow-hidden border border-[#242f3d] shadow-2xl">
        <div className="p-4 border-b border-[#0e1621] flex items-center justify-between bg-[#242f3d]">
          <h3 className="font-bold text-white">تنظیمات کاربری</h3>
          <button onClick={onClose} className="p-2 text-[#708499] hover:text-white transition-colors"><X /></button>
        </div>

        <div className="flex bg-[#17212b]">
          {['profile', '2fa', 'security'].map((t: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab===t ? 'text-[#3390ec] border-b-2 border-[#3390ec]' : 'text-[#708499] hover:text-white/60'}`}>
              {t === 'profile' ? 'پروفایل' : t === '2fa' ? 'تأیید ۲مرحله‌ای' : 'امنیت'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in slide-in-from-left duration-300">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img src={user.avatar} className="w-20 h-20 rounded-full mb-4 border-2 border-[#3390ec] object-cover group-hover:brightness-50 transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                    <Camera size={20} className="text-white"/>
                  </div>
                </div>
                <h4 className="font-bold text-lg">@{user.username}</h4>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#3390ec] uppercase pr-1">نام نمایشی</label>
                <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="نام نمایشی" className="w-full bg-[#242f3d] p-3 rounded-xl text-white outline-none border border-transparent focus:border-[#3390ec]/40" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#3390ec] uppercase pr-1">درباره شما (Bio)</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="توضیح کوتاهی درباره خودتان بنویسید..." className="w-full bg-[#242f3d] p-3 rounded-xl text-white h-24 resize-none border border-transparent focus:border-[#3390ec]/40 no-scrollbar" />
              </div>
            </div>
          )}

          {activeTab === '2fa' && (
            <div className="space-y-6 text-center animate-in slide-in-from-left duration-300">
              <ShieldAlert className="mx-auto text-yellow-500 mb-2" size={48} />
              <p className="text-sm text-[#708499] leading-relaxed">با فعال‌سازی این قابلیت، امنیت حساب شما دوچندان می‌شود. هنگام ورود مجدد، به کد تایید نیاز خواهید داشت.</p>
              <div className={`p-5 rounded-2xl border-2 transition-all ${twoFAEnabled ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                <p className="font-bold mb-4 text-sm">{twoFAEnabled ? 'تأیید ۲مرحله‌ای فعال است' : 'تأیید ۲مرحله‌ای غیرفعال است'}</p>
                <button onClick={()=>setTwoFAEnabled(!twoFAEnabled)} className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all transform active:scale-95 ${twoFAEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
                  {twoFAEnabled ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                </button>
              </div>
              {!twoFAEnabled && (
                <div className="text-right text-xs bg-black/40 p-4 rounded-xl border border-[#3390ec]/20">
                   <p className="font-bold text-[#3390ec] mb-2 flex items-center gap-2"><Key size={14}/> کد راه‌اندازی (نسخه بتا):</p>
                   <code className="text-white select-all bg-[#17212b] px-3 py-1.5 rounded block text-center font-mono tracking-widest">STARLY-777-BETA</code>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3 animate-in slide-in-from-left duration-300">
               <SecurityItem icon={<Key size={18}/>} label="تغییر رمز عبور" />
               <SecurityItem icon={<Smartphone size={18}/>} label="مدیریت نشست‌های فعال" />
               <SecurityItem icon={<Lock size={18}/>} label="قفل برنامه (Passcode)" />
            </div>
          )}

          <div className="pt-2 border-t border-[#0e1621]">
            <button onClick={handleSave} className="w-full py-4 bg-[#3390ec] hover:bg-[#2881d9] rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl text-white transition-all transform active:scale-95">
              <Check size={20} /> ذخیره و اعمال تغییرات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityItem = ({icon, label}: any) => (
  <div className="flex items-center justify-between p-4 bg-[#242f3d] rounded-xl cursor-pointer hover:bg-[#2b3949] border border-white/5 transition-colors group">
    <div className="flex items-center gap-3">
      <span className="text-[#3390ec] group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <Smartphone size={14} className="text-[#708499] rotate-180 opacity-0 group-hover:opacity-100 transition-all"/>
  </div>
);

export default SettingsModal;
