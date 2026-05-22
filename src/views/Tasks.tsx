import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, MessageCircle, Globe, Bot } from 'lucide-react';
import { UserData } from '../types';

interface TasksProps {
  userId: string;
  userData: UserData | null;
  onReward: (amount: number, taskId: string) => void;
}

interface AdsgramTask {
  id: string;
  title: string;
  type: string;
  reward: number;
  link: string;
}

export default function Tasks({ userId, userData, onReward }: TasksProps) {
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AdsgramTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/adsgram-tasks');
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks);
        }
      } catch (err) {
        console.error('خطا در دریافت وظایف:', err);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'channel': return MessageCircle;
      case 'bot': return Bot;
      case 'web': return Globe;
      default: return MessageCircle;
    }
  };

  const handleTaskClick = async (taskId: string, link: string, reward: number) => {
    if (userData?.tasksCompleted?.includes(taskId)) return;
    if (loadingTask) return;

    // باز کردن لینک
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(link);
    } else {
      window.open(link, '_blank');
    }

    setLoadingTask(taskId);
    setMessage(null);

    // تأخیر ۵ ثانیه برای تأیید
    setTimeout(async () => {
      try {
        const response = await fetch('/api/reward/task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, taskId, amount: reward }),
        });
        const data = await response.json();

        if (data.success) {
          onReward(reward, taskId);
          setMessage({ text: `${reward.toLocaleString('fa-IR')} سکه به حساب شما اضافه شد!`, type: 'success' });
        } else {
          setMessage({ text: data.error || 'خطا در ثبت وظیفه', type: 'error' });
        }
      } catch (err) {
        console.error('خطا در تأیید وظیفه:', err);
        setMessage({ text: 'خطا در ارتباط با سرور', type: 'error' });
      } finally {
        setLoadingTask(null);
      }
    }, 5000);
  };

  const completedCount = tasks.filter(t => userData?.tasksCompleted?.includes(t.id)).length;

  return (
    <div className="flex flex-col h-full w-full p-6 space-y-5">

      {/* هدر */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-white mb-1">وظایف روزانه</h2>
        <p className="text-white/50 text-xs leading-relaxed">
          با انجام وظایف زیر سکه کسب کنید. وظایف توسط{' '}
          <span className="font-bold text-cyan-400">Adsgram</span> تأمین می‌شوند.
        </p>
        {tasks.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all"
                style={{ width: `${(completedCount / tasks.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 font-mono">{completedCount}/{tasks.length}</span>
          </div>
        )}
      </div>

      {/* پیام موفقیت/خطا */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 text-xs p-3 rounded-xl border text-center justify-center ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}
        >
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <span className="text-base">⚠️</span>
          }
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* لیست وظایف */}
      <div className="flex flex-col gap-3">
        {loadingTasks ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">📋</span>
            <p className="text-white/40 text-sm">در حال حاضر وظیفه‌ای موجود نیست.</p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const isCompleted = userData?.tasksCompleted?.includes(task.id);
            const isLoading = loadingTask === task.id;
            const Icon = getTaskIcon(task.type);

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                key={task.id}
                onClick={() => !isCompleted && !isLoading && handleTaskClick(task.id, task.link, task.reward)}
                className={`
                  backdrop-blur-md bg-white/10 border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all
                  ${isCompleted
                    ? 'opacity-60 cursor-default border-white/5'
                    : isLoading
                    ? 'cursor-wait border-cyan-500/30'
                    : 'cursor-pointer hover:bg-white/15 active:scale-[0.98] border-white/10'}
                `}
              >
                <div className="flex items-center flex-1 gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {isCompleted
                      ? <CheckCircle2 className="w-6 h-6" />
                      : <Icon className="w-6 h-6" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold truncate ${isCompleted ? 'text-white/50 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-white/40 mt-1">
                      پاداش:{' '}
                      <span className="text-yellow-400 font-bold">
                        {task.reward.toLocaleString('fa-IR')} سکه
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400 font-bold">
                      انجام شد ✓
                    </span>
                  ) : isLoading ? (
                    <div className="px-4 py-2 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : (
                    <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-xs font-bold text-white shadow-md shadow-cyan-500/20 pointer-events-none">
                      شروع
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
