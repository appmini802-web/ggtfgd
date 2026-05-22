import React from 'react';
import { motion } from 'motion/react';
import { Users, Copy, Share2 } from 'lucide-react';
import { UserData } from '../types';

interface FriendsProps {
  userId: string;
  userData: UserData | null;
}

export default function Friends({ userId, userData }: FriendsProps) {
  // Use startapp for Telegram Mini Apps to natively pass start_param
  const referralLink = `https://t.me/hfgsqhve_bot?startapp=${userId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('لینک کپی شد!');
    } else {
      alert('لینک کپی شد!');
    }
  };

  const handleShare = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('به من بپیوندید و سکه رایگان دریافت کنید!')}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-6 space-y-6 items-center">
      
      <div className="flex flex-col items-center text-center space-y-4 mt-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 flex items-center justify-center border border-white/10 backdrop-blur-md">
          <Users className="w-10 h-10 text-cyan-400" />
        </div>
        <p className="text-white/60 text-sm max-w-xs leading-relaxed">
          دوستان خود را دعوت کنید و برای هر دوستی که به ربات می‌پیوندد، <span className="text-yellow-400 font-bold">1000 سکه</span> پاداش بگیرید.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col mt-2 shadow-xl">
          <h3 className="text-md font-bold mb-4 text-white">سیستم زیرمجموعه</h3>
          <div className="text-center py-2 flex-1">
            <p className="text-[11px] text-white/60 mb-2">لینک اختصاصی دعوت شما</p>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-[12px] font-mono break-all mb-4 text-white/80" dir="ltr">
              {referralLink}
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={handleCopy}
                className="w-full py-3 border border-purple-500/50 rounded-xl text-sm hover:bg-purple-500/20 text-white transition-colors"
              >
                کپی لینک
              </button>
              <button 
                onClick={handleShare}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                ارسال دعوت نامه
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 mx-2">
            <div className="flex justify-between text-xs text-white/80">
              <span>دوستان دعوت شده:</span>
              <span className="text-purple-400 font-bold">{(userData?.referralsCount || 0).toLocaleString()} نفر</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
