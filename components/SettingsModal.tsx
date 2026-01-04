
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { X, Camera, Save, LogOut, Shield, Bell, HelpCircle, User as UserIcon, Check, Eye, EyeOff, Lock } from 'lucide-react';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar);
  // Fix: Explicitly type the privacy state to match the User's privacy definition and prevent type widening of string literals.
  const [privacy, setPrivacy] = useState<NonNullable<User['privacy']>>(
    user.privacy || { showStatus: 'all', showAvatar: 'all', showBio: 'all' }
  );
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser({ ...user, displayName, bio, avatar, privacy });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[450px] bg-[#17212b] rounded-3xl overflow-hidden shadow-2xl border border-[#242f3d]">
        <div className="p-4 border-b border-[#0e1621] flex items-center justify-between bg-[#242f3d]">
          <h3 className="font-bold text-lg text-white">تنظیمات استارلی جت</h3>
          <button onClick={onClose} className="p-2 text-[#708499]"><X /></button>
        </div>

        <div className="flex border-b border-[#0e1621]">
            <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 font-bold ${activeTab==='profile' ? 'text-[#3390ec] border-b-2 border-[#3390ec]' : 'text-[#708499]'}`}>پروفایل</button>
            <button onClick={() => setActiveTab('privacy')} className={`flex-1 py-3 font-bold ${activeTab==='privacy' ? 'text-[#3390ec] border-b-2 border-[#3390ec]' : 'text-[#708499]'}`}>حریم خصوصی</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] no-scrollbar">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
                <div className="flex flex-col items-center">
                    <div className="relative group cursor-pointer mb-4" onClick={() => avatarInputRef.current?.click()}>
                        <img src={avatar} className="w-24 h-24 rounded-full border-2 border-[#3390ec] object-cover" />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"><Camera className="text-white" /></div>
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => {const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onloadend=()=>setAvatar(r.result as string); r.readAsDataURL(f);}}} />
                    </div>
                    <h4 className="text-xl font-bold">{displayName}</h4>
                    <p className="text-[#3390ec]">@{user.username}</p>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-[#708499] font-bold">نام نمایشی</label>
                        <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-[#242f3d] p-3 rounded-xl border-none text-white focus:ring-1 focus:ring-[#3390ec]" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-[#708499] font-bold">بایوگرافی</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-[#242f3d] p-3 rounded-xl border-none text-white h-24 resize-none" />
                    </div>
                </div>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="p-4 bg-[#242f3d] rounded-2xl flex items-center gap-4 text-[#3390ec]"><Shield size={32}/><p className="text-sm font-medium">امنیت شما در استارلی جت اولویت ماست. تمامی پیام‌ها رمزنگاری می‌شوند.</p></div>
                <div className="space-y-4">
                    <PrivacyOption icon={<Eye/>} label="نمایش وضعیت آنلاین" value={privacy.showStatus} onChange={v => setPrivacy({...privacy, showStatus: v})} />
                    <PrivacyOption icon={<UserIcon/>} label="نمایش عکس پروفایل" value={privacy.showAvatar} onChange={v => setPrivacy({...privacy, showAvatar: v})} />
                    <PrivacyOption icon={<HelpCircle/>} label="نمایش بیوگرافی" value={privacy.showBio} onChange={v => setPrivacy({...privacy, showBio: v})} />
                </div>
                <button className="w-full py-3 bg-[#242f3d] rounded-xl flex items-center justify-center gap-2 font-bold text-white"><Lock size={18}/> فعال‌سازی تایید دو مرحله‌ای</button>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button onClick={handleSave} className="flex-1 py-3 bg-[#3390ec] rounded-xl font-bold flex items-center justify-center gap-2"><Check /> ذخیره</button>
            <button onClick={onLogout} className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrivacyOption: React.FC<{icon:any, label:string, value:string, onChange:(v:any)=>void}> = ({icon, label, value, onChange}) => (
    <div className="space-y-2">
        <div className="flex items-center gap-3 text-[#708499] mb-1">{icon}<span className="text-sm font-bold">{label}</span></div>
        <div className="flex bg-[#242f3d] rounded-xl p-1">
            {['all', 'contacts', 'none'].map(v => (
                <button key={v} onClick={() => onChange(v)} className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${value===v ? 'bg-[#3390ec] text-white shadow-lg' : 'text-[#708499]'}`}>
                    {v === 'all' ? 'همه' : v === 'contacts' ? 'مخاطبین' : 'هیچکس'}
                </button>
            ))}
        </div>
    </div>
);

export default SettingsModal;
