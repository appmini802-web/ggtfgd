import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronLeft, Youtube, MessageCircle, Twitter, Globe, Bot } from 'lucide-react';
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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/adsgram-tasks');
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks);
        }
      } catch (err) {
        console.error("Failed to fetch Adsgram tasks", err);
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
    
    // Open the external link
    if (window.Telegram?.WebApp) {
       window.Telegram.WebApp.openLink(link);
    } else {
       window.open(link, '_blank');
    }

    setLoadingTask(taskId);

    // Simulate verification delay (e.g. 5 seconds)
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
        }
      } catch (err) {
        console.error("Failed to verify task", err);
      } finally {
        setLoadingTask(null);
      }
    }, 5000);
  };

  return (
    <div className="flex flex-col h-full w-full p-6 space-y-6">
      
      <div className="pt-2 pb-2">
        <h2 className="text-xl font-bold text-white mb-2">تسک‌های Adsgram</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          تمامی تسک‌های زیر، اعم از عضویت در کانال‌ها و ... مستقیما توسط سرویس تبلیغاتی <span className="font-bold text-cyan-400">Adsgram</span> تامین می‌شوند و ما هیچگونه تسک اسپانسری نداریم.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {loadingTasks ? (
          <div className="flex justify-center items-center py-10">
             <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-white/50 text-center text-sm">هیچ تسکی برای نمایش وجود ندارد.</p>
        ) : (
          tasks.map((task, index) => {
            const isCompleted = userData?.tasksCompleted?.includes(task.id);
            const isLoading = loadingTask === task.id;
            const Icon = getTaskIcon(task.type);

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={task.id}
                onClick={() => handleTaskClick(task.id, task.link, task.reward)}
                className={`
                  backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4
                  ${isCompleted ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-white/15 active:scale-[0.98]'}
                  transition-all
                `}
              >
                <div className="flex items-center flex-1 gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-white/5 text-white/50' : 'bg-cyan-500/20 text-cyan-400'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                    <p className="text-[11px] text-white/50 mt-1">پاداش: <span className="text-yellow-400 font-bold">{task.reward} سکه</span></p>
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                     <button className="px-4 py-2 bg-white/10 rounded-lg text-xs text-white" disabled>انجام شد</button>
                  ) : isLoading ? (
                    <div className="px-5 py-2 bg-cyan-500/50 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : (
                    <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-xs font-bold text-white shadow-md shadow-cyan-500/20 pointer-events-none">شروع</button>
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
