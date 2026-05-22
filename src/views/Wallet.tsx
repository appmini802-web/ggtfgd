import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, ArrowUpRight, History, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { UserData, Withdrawal } from '../types';

interface WalletProps {
  userId: string;
  userData: UserData | null;
  onBalanceChange: (newBalance: number) => void;
}

export default function Wallet({ userId, userData, onBalanceChange }: WalletProps) {
  const [address, setAddress] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(10000);
  const [minWithdraw, setMinWithdraw] = useState(50000);
  const [dollarRate, setDollarRate] = useState(5.0);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok && data.success) {
        setExchangeRate(data.settings.exchangeRate || 10000);
        setMinWithdraw(data.settings.minWithdraw || 50000);
        setDollarRate(data.settings.dollarRate || 5.0);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/withdrawals/${userId}`);
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals.sort((a: Withdrawal, b: Withdrawal) => b.timestamp - a.timestamp));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleWithdraw = async () => {
    setError(null);
    setSuccess(null);
    const amount = parseInt(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setError("مبلغ نامعتبر است.");
      return;
    }
    if (amount < minWithdraw) {
      setError(`حداقل برداشت ${minWithdraw.toLocaleString()} سکه است.`);
      return;
    }
    if ((userData?.balance || 0) < amount) {
      setError("موجودی شما کافی نیست.");
      return;
    }
    if (!address.trim() || address.length < 10) {
      setError("آدرس کیف پول TON نامعتبر است.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          address: address.trim(),
          method: 'TON'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("درخواست برداشت با موفقیت ثبت شد.");
        setAmountStr('');
        setAddress('');
        onBalanceChange(data.balance);
        fetchHistory();
      } else {
        setError(data.error || "خطایی رخ داد.");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'approved': return 'تایید شده';
      case 'rejected': return 'رد شده / برگشت';
      default: return 'در حال بررسی';
    }
  };

  const currentBalance = userData?.balance || 0;
  const tonEquivalent = (currentBalance / exchangeRate).toFixed(2);
  const dollarEquivalent = ((currentBalance / exchangeRate) * dollarRate).toFixed(2);

  const inputAmount = parseInt(amountStr) || 0;
  const inputTon = (inputAmount / exchangeRate).toFixed(2);
  const inputDollar = ((inputAmount / exchangeRate) * dollarRate).toFixed(2);

  return (
    <div className="flex flex-col p-6 space-y-6 h-full w-full overflow-y-auto items-center pb-20">
      
      <div className="w-full max-w-sm flex flex-col gap-6">
        
        {/* Balance Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <WalletIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">کیف پول</h2>
                <p className="text-white/60 text-[10px]">موجودی قابل برداشت</p>
              </div>
            </div>
            <div className="flex flex-col items-end text-[10px] text-white/50 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
              <span>هر {exchangeRate.toLocaleString()} سکه</span>
              <span className="text-yellow-400 font-bold">= 1 TON (~ {dollarRate}$)</span>
            </div>
          </div>
          
          <div className="flex flex-col mt-3 bg-black/20 p-4 rounded-2xl border border-white/5">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {currentBalance.toLocaleString()} <span className="text-sm text-white/50 font-medium">سکه</span>
            </span>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/60 font-mono">
              <span>≈ {tonEquivalent} TON</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-emerald-400">≈ ${dollarEquivalent}</span>
            </div>
          </div>
        </div>

        {/* Withdraw Form */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <h3 className="text-md font-bold text-white mb-4">درخواست برداشت (وضیعت در 24h)</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs text-white/60">مقدار سکه (حداقل {minWithdraw.toLocaleString()})</label>
                {inputAmount > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono">≈ ${inputDollar}</span>
                )}
              </div>
              <input 
                type="number"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                placeholder="50000"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                dir="ltr"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/60 px-1">آدرس کیف پول شما شبکه TON</label>
              <input 
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="UQ..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm font-mono"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs justify-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs justify-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button 
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-sm text-white shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5" />
                  <span>ثبت درخواست</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 flex flex-col mb-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-md font-bold text-white">تاریخچه برداشت</h3>
          </div>
          
          <div className="space-y-3">
             {loadingHistory ? (
               <div className="flex justify-center py-4">
                 <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
               </div>
             ) : withdrawals.length === 0 ? (
               <p className="text-white/40 text-xs text-center py-4">تاریخچه ای وجود ندارد.</p>
             ) : (
               withdrawals.map(w => (
                 <div key={w.id} className="bg-black/20 rounded-xl p-3 flex flex-col border border-white/5 gap-2">
                   <div className="flex items-center justify-between">
                     <span className="text-white font-bold">{w.amount.toLocaleString()} سکه</span>
                     <div className="flex items-center gap-1">
                       {getStatusIcon(w.status)}
                       <span className="text-xs text-white/60">{getStatusText(w.status)}</span>
                     </div>
                   </div>
                   <div className="flex justify-between items-center text-[10px] text-white/40">
                     <span className="font-mono truncate max-w-[150px]" dir="ltr">{w.address}</span>
                     <span>{new Date(w.timestamp).toLocaleDateString('fa-IR')}</span>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
