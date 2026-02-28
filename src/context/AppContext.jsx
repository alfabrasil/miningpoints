import React, { createContext, useState, useEffect } from 'react';
import { AVAILABLE_LANGUAGES, LOCALES } from '../locales';

export const AppContext = createContext();

const MINING_META_KEY = 'mining_points_mvp_v1_mining_meta';

const INITIAL_STATE = {
  user: {
    username: "investor_01",
    email: "investor@email.com",
    avatar: "default",
    joinedAt: new Date().toISOString(),
    team: 0,
    language: "pt-BR", // Default
    dailyCredits: 3, // Créditos diários
    financialPassword: "", 
    wallets: { 
        usdt_bep20: "",
        usdt_polygon: "",
        usdt_trc20: "",
        usdt_arbitrum: "",
        usdc_arbitrum: "",
        pix: ""
    }
  },
  wallet: {
    usd: 0,
    mph: 0,
    deposited: 0,
    totalEarnings: 0,
    withdrawn: 0
  },
  plans: [], 
  notifications: [],
  miningHistory: [],
  gameHistory: [], // Histórico de partidas
  lastLogin: new Date().toISOString()
};

export const AppProvider = ({ children }) => {
  console.log("AppProvider mounted");
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('mining_points_mvp_v1');
    if (!saved) return INITIAL_STATE;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('mining_points_mvp_v1');
      return INITIAL_STATE;
    }
  });

  const [miningTimer, setMiningTimer] = useState(900); 
  const [miningStatus, setMiningStatus] = useState('searching'); 
  const [popup, setPopup] = useState(null);

  // Persistência
  useEffect(() => {
    localStorage.setItem('mining_points_mvp_v1', JSON.stringify(state));
  }, [state]);

  const addNotification = (msg, type = 'info') => {
    const notif = { 
        id: Date.now(), 
        msg, 
        type, 
        read: false, 
        time: new Date().toISOString() 
    };
    
    setState(prev => ({ ...prev, notifications: [notif, ...prev.notifications] }));
    
    setPopup({ msg, type });
    setTimeout(() => setPopup(null), 3000);
  };

  const processMiningPayout = () => {
    if (state.plans.length === 0) return;

    let cycleProfit = 0;
    const newHistoryEntry = {
      id: Date.now(),
      time: new Date().toISOString(),
      details: []
    };

    const updatedPlans = state.plans.map(plan => {
      if (!plan.active) return plan;
      
      const dailyRate = plan.type === 'standard' ? 0.01 : 0.013;
      const baseCycleReturn = (plan.amount * dailyRate) / 96; 
      
      const variation = (Math.random() * 0.25) - 0.10;
      const actualReturn = baseCycleReturn * (1 + variation);
      
      cycleProfit += actualReturn;
      
      newHistoryEntry.details.push({
        planId: plan.id,
        profit: actualReturn,
        hash: `HASH-${Math.floor(Math.random()*9999)}`,
        status: actualReturn > 0 ? 'profit' : 'loss' 
      });

      return plan;
    });

    if (cycleProfit > 0) {
      addNotification(`Rendimento Hash: +$${cycleProfit.toFixed(4)} creditado.`, 'profit');
      
      if (Math.random() > 0.8) { 
          const teamBonus = cycleProfit * 0.05;
          addNotification(`Bônus de Equipe: +$${teamBonus.toFixed(4)} recebido.`, 'team');
          cycleProfit += teamBonus;
      }

      setState(prev => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          usd: prev.wallet.usd + cycleProfit,
          totalEarnings: prev.wallet.totalEarnings + cycleProfit
        },
        miningHistory: [newHistoryEntry, ...prev.miningHistory].slice(0, 50)
      }));
    }
  };

  const syncMiningFromMeta = () => {
    try {
      const raw = localStorage.getItem(MINING_META_KEY);
      if (!raw) {
        const initialMeta = { timer: 900, lastUpdate: new Date().toISOString() };
        localStorage.setItem(MINING_META_KEY, JSON.stringify(initialMeta));
        setMiningTimer(900);
        return;
      }

      const meta = JSON.parse(raw);
      if (!meta || typeof meta.timer !== 'number' || !meta.lastUpdate) {
        throw new Error('invalid meta');
      }

      const last = new Date(meta.lastUpdate).getTime();
      const now = Date.now();
      if (Number.isNaN(last)) throw new Error('invalid date');

      const delta = Math.max(0, Math.floor((now - last) / 1000));
      let timer = meta.timer;
      let cyclesToRun = 0;

      if (delta >= timer) {
        const timeAfterFirst = delta - timer;
        cyclesToRun = 1 + Math.floor(timeAfterFirst / 900);
        const remainingAfterLast = timeAfterFirst % 900;
        timer = 900 - remainingAfterLast;
      } else {
        timer = timer - delta;
      }

      timer = Math.max(1, Math.min(900, timer));

      if (cyclesToRun > 0 && state.plans.some(p => p.active)) {
        for (let i = 0; i < cyclesToRun; i++) {
          processMiningPayout();
        }
      }

      setMiningTimer(timer);
      localStorage.setItem(
        MINING_META_KEY,
        JSON.stringify({ timer, lastUpdate: new Date().toISOString() })
      );
    } catch {
      const resetMeta = { timer: 900, lastUpdate: new Date().toISOString() };
      localStorage.setItem(MINING_META_KEY, JSON.stringify(resetMeta));
      setMiningTimer(900);
    }
  };

  useEffect(() => {
    if (state.notifications.length === 0) {
        addNotification("Bem-vindo ao MiningPoints! Se precisar de ajuda, acesse o Suporte.", "support");
    }
  }, []);

  useEffect(() => {
    syncMiningFromMeta();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncMiningFromMeta();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === MINING_META_KEY) {
        syncMiningFromMeta();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setMiningTimer(prev => {
        let next = prev;

        if (prev <= 1) {
          processMiningPayout();
          next = 900;
        } else {
          next = prev - 1;
        }

        localStorage.setItem(
          MINING_META_KEY,
          JSON.stringify({ timer: next, lastUpdate: new Date().toISOString() })
        );

        const elapsedInCycle = 900 - next;
        const cycleDuration = 60; // 5s + 5s + 50s
        const phase = elapsedInCycle % cycleDuration;
        
        if (phase < 5) setMiningStatus('searching');
        else if (phase < 10) setMiningStatus('analyzing');
        else setMiningStatus('executing');

        return next;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const markAllNotificationsRead = () => {
      setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, read: true }))
      }));
  };

  const clearNotifications = () => {
      if(window.confirm('Limpar todas as notificações?')) {
          setState(prev => ({ ...prev, notifications: [] }));
      }
  };

  const updateWallet = (amount, type, currency = 'usd') => {
    setState(prev => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        [currency]: prev.wallet[currency] + amount,
        deposited: type === 'deposit' ? prev.wallet.deposited + amount : prev.wallet.deposited,
        withdrawn: type === 'withdraw' ? prev.wallet.withdrawn + Math.abs(amount) : prev.wallet.withdrawn
      }
    }));
  };

  const consumeDailyCredit = () => {
      if (state.user.dailyCredits > 0) {
          setState(prev => ({
              ...prev,
              user: {
                  ...prev.user,
                  dailyCredits: prev.user.dailyCredits - 1
              }
          }));
          return true;
      }
      return false;
  };

  const buyCredits = (amount, cost) => {
      if (state.wallet.mph >= cost) {
          setState(prev => ({
              ...prev,
              user: { ...prev.user, dailyCredits: prev.user.dailyCredits + amount },
              wallet: { ...prev.wallet, mph: prev.wallet.mph - cost }
          }));
          addNotification(`${amount} Créditos comprados com sucesso!`, 'success');
          return true;
      } else {
          addNotification('MPH insuficiente para comprar créditos.', 'danger');
          return false;
      }
  };

  const addGameResult = (gameName, historyAmount, walletAmount = null) => {
      const amountToAdd = walletAmount !== null ? walletAmount : historyAmount;
      
      const newEntry = {
          id: Date.now(),
          game: gameName,
          amount: historyAmount,
          time: new Date().toISOString()
      };
      
      setState(prev => ({
          ...prev,
          wallet: { ...prev.wallet, mph: prev.wallet.mph + amountToAdd },
          gameHistory: [newEntry, ...prev.gameHistory].slice(0, 20) // Guarda os últimos 20 jogos
      }));
  };

  const addPlan = (planType, amount) => {
    if (state.wallet.usd < amount) {
      addNotification("Saldo insuficiente para contratação.", "danger");
      return false;
    }

    const newPlan = {
      id: Date.now(),
      type: planType, // 'standard' or 'premium'
      amount: parseFloat(amount),
      active: true,
      startDate: new Date().toISOString(),
      roi: 0
    };

    setState(prev => ({
      ...prev,
      wallet: { ...prev.wallet, usd: prev.wallet.usd - amount },
      plans: [...prev.plans, newPlan]
    }));
    addNotification(`Contrato ${planType.toUpperCase()} ativado: -$${amount}`, "plan");
    return true;
  };

  const resetAppData = () => {
    if (window.confirm('Tem certeza? Isso apagará TODO o progresso e saldo da aplicação.')) {
        localStorage.removeItem('mining_points_mvp_v1');
        localStorage.removeItem(MINING_META_KEY);
        setState(INITIAL_STATE);
        window.location.reload();
    }
  };

  const changeLanguage = (lang) => {
    setState(prev => ({ ...prev, user: { ...prev.user, language: lang } }));
    addNotification(`Idioma alterado para: ${AVAILABLE_LANGUAGES.find(l => l.code === lang)?.name}`, 'success');
  };

  const dict = LOCALES[state.user.language] || LOCALES['pt-BR'];
  const t = (path) => {
    try {
      return path.split('.').reduce((acc, k) => acc && acc[k], dict) || path;
    } catch {
      return path;
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, setState, miningTimer, miningStatus, 
      addNotification, updateWallet, addPlan, changeLanguage, popup,
      markAllNotificationsRead, clearNotifications, addGameResult, consumeDailyCredit, buyCredits, t, resetAppData
    }}>
      {children}
    </AppContext.Provider>
  );
};
