import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { UserData } from '../types';

interface HomeProps {
  userId: string;
  userData: UserData | null;
  onReward: (amount: number) => void;
}

export default function Home({ userId, userData, onReward }: HomeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_DAILY_ADS = 20;
  const [adsWatched, setAdsWatched] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const rawBlockId = import.meta.env.VITE_ADSGRAM_BLOCK_ID;
  const isSetup = rawBlockId && rawBlockId !== 'xxxx-xxxx-xxxx-xxxx' && rawBlockId !== '';
  const blockId = isSetup ? rawBlockId : 'test-block-id';

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const awardAdReward = async () => {
    try {
      const response = await fetch('/api/reward/ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: 100 }),
      });
      const data = await response.json();
      if (data.success) {
        onReward(100);
        setAdsWatched(prev => prev + 1);
        setCooldown(30);
      } else {
        setError(data.error || 'خطا در ثبت پاداش');
      }
    } catch (err) {
      console.error('خطای API', err);
      setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleWatchAd = async () => {
    if (isPlaying || cooldown > 0) return;

    if (adsWatched >= MAX_DAILY_ADS) {
      setError('سقف تماشای روزانه تکمیل شده است. فردا دوباره امتحان کنید.');
      return;
    }

    setError(null);

    if (!isSetup) {
      // حالت دمو — بدون Block ID واقعی
      setIsPlaying(true);
      setTimeout(async () => {
        await awardAdReward();
        setIsPlaying(false);
      }, 2000);
      return;
    }

    if (!window.Adsgram) {
      setError('کتابخانه تبلیغات هنوز بارگذاری نشده است. لطفاً صفحه را رفرش کنید.');
      return;
    }

    try {
      setIsPlaying(true);
      const AdController = window.Adsgram.init({ block: blockId });
      await AdController.show();
      await awardAdReward();
    } catch (err) {
      console.error(err);
      setError('تماشای تبلیغ لغو شد یا خطایی رخ داد.');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col p-6 space-y-6 h-full w-full items-center">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col gap-5 pb-8"
      >
        {/* کارت موجودی */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center mt-4 shadow-xl">
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            {(userData?.balance ?? 0).toLocaleString('fa-IR')}
          </div>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1 font-bold">موجودی سکه</p>
        </div>

        {/* آمار تماشا */}
        <div className="flex gap-4">
          <div className="flex-1 backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] text-white/60 font-bold">بازدید امروز</span>
            </div>
            <div className="text-xl font-bold text-white">{adsWatched} / {MAX_DAILY_ADS}</div>
            <div className="w-full bg-white/10 h-1.5 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all"
                style={{ width: `${(adsWatched / MAX_DAILY_ADS) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-[0.7] backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center">
            <span className="text-[10px] text-white/60 font-bold mb-1">پاداش هر بازدید</span>
            <div className="text-xl font-bold text-yellow-400 flex items-center gap-1">
              <span className="text-xs">+</span>۱۰۰
            </div>
          </div>
        </div>

        {/* کارت تبلیغات */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          {!isSetup && (
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl z-10">
              حالت آزمایشی
            </div>
          )}
          <div className="mb-6 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">تبلیغات Adsgram</h3>
              <span className={`px-2 py-1 text-[10px] rounded border ${
                cooldown > 0
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-green-500/20 text-green-400 border-green-500/30'
              }`}>
                {cooldown > 0 ? `${cooldown} ثانیه صبر کنید` : 'آماده نمایش'}
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              با تماشای هر ویدیو تبلیغاتی، بلافاصله{' '}
              <span className="font-bold text-yellow-400">۱۰۰ سکه</span>{' '}
              به کیف پول شما اضافه می‌شود.
            </p>
          </div>

          <button
            onClick={handleWatchAd}
            disabled={isPlaying || cooldown > 0 || adsWatched >= MAX_DAILY_ADS}
            className={`w-full py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all text-white flex items-center justify-center gap-2
              ${(isPlaying || cooldown > 0 || adsWatched >= MAX_DAILY_ADS)
                ? 'bg-white/5 border border-white/10 text-white/40 shadow-none cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/20 hover:scale-[1.02]'}
            `}
          >
            {isPlaying ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : cooldown > 0 ? (
              <Clock className="w-5 h-5 text-white/40" />
            ) : (
              <Play className="w-5 h-5 fill-white" />
            )}
            <span>
              {isPlaying
                ? 'در حال بارگذاری...'
                : cooldown > 0
                ? `${cooldown} ثانیه صبر کنید`
                : adsWatched >= MAX_DAILY_ADS
                ? 'سقف روزانه تکمیل شد'
                : 'تماشای ویدیو و کسب سکه'}
            </span>
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-xs justify-center bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center leading-relaxed"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
}
