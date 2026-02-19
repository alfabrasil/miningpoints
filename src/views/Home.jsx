import React, { useContext } from 'react';
import { Cpu, Activity, Zap } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { THEME } from '../utils/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Ticker } from '../components/Ticker';

export const HomeView = ({ navigate }) => {
  const { state, miningTimer, miningStatus, t } = useContext(AppContext);
  const totalInvested = state.plans.reduce((acc, p) => p.active ? acc + p.amount : acc, 0);
  const formattedTime = new Date(miningTimer * 1000).toISOString().substr(14, 5);

  // Cálculo de projeção visual do lucro (não afeta o lucro real do backend)
  // Fórmula: Total Investido * (Taxa Diária Média / Ciclos por Dia) * (Tempo Decorrido / Tempo Total do Ciclo)
  // Taxa Diária: ~1.0% | Ciclos: 96 | Ciclo: 900s
  const dailyRateAvg = 0.01; 
  const cycleReturn = totalInvested * dailyRateAvg / 96;
  const currentProgress = cycleReturn * ((900 - miningTimer) / 900);

  return (
    <div className="pb-24 space-y-4 animate-fadeIn">
      <Ticker />
      
      {/* 4 Cards Principais */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <Card className="flex flex-col items-center justify-center text-center">
          <span className="text-xs text-gray-400 uppercase">{t('home.deposit')}</span>
          <span className={`text-lg font-bold ${THEME.accent}`}>${state.wallet.deposited.toFixed(2)}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <span className="text-xs text-gray-400 uppercase">{t('home.team')}</span>
          <span className="text-lg font-bold text-blue-400">${(state.wallet.totalEarnings * 0.15).toFixed(2)}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center border-l-4 border-purple-500">
          <span className="text-xs text-gray-400 uppercase">{t('home.applied')}</span>
          <span className="text-lg font-bold text-white">${totalInvested.toFixed(2)}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center border-l-4 border-[#ff00ff]">
          <span className="text-xs text-gray-400 uppercase">{t('home.hash_profit')}</span>
          <span className="text-lg font-bold text-green-400 animate-pulse">${state.wallet.totalEarnings.toFixed(4)}</span>
        </Card>
      </div>

      {/* Simulador de Mineração */}
      <div className="px-4">
        <Card highlight className="relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
            <h3 className={`${THEME.accent} font-bold text-sm flex items-center gap-2`}>
              <Cpu size={16} /> {t('home.section_title')}
            </h3>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">{t('home.next_cycle')}</span>
              <span className="font-mono text-xl text-white">{formattedTime}</span>
            </div>
          </div>

          <div className="h-32 bg-black rounded-lg border border-gray-800 p-2 relative mb-4 font-mono text-xs overflow-hidden">
            <div className="absolute top-2 right-2 flex gap-1">
              <div className={`w-2 h-2 rounded-full ${miningStatus === 'searching' ? 'bg-yellow-500 animate-ping' : 'bg-gray-700'}`}></div>
              <div className={`w-2 h-2 rounded-full ${miningStatus === 'analyzing' ? 'bg-blue-500 animate-ping' : 'bg-gray-700'}`}></div>
              <div className={`w-2 h-2 rounded-full ${miningStatus === 'executing' ? 'bg-green-500 animate-ping' : 'bg-gray-700'}`}></div>
            </div>
            
            <div className="space-y-1 text-gray-400">
              <p>{t('home.start_protocol')}</p>
              {miningStatus === 'searching' && <p className="text-yellow-400">{t('home.searching')}</p>}
              {miningStatus === 'analyzing' && <p className="text-blue-400">{t('home.analyzing')}</p>}
              {miningStatus === 'executing' && (
                <>
                  <p className="text-green-400">{t('home.executing1')}</p>
                  <p className="text-green-400">{t('home.executing2')}</p>
                </>
              )}
              <div className="mt-2 grid grid-cols-3 gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className={`h-8 border border-gray-700 rounded flex items-center justify-center ${miningStatus === 'executing' ? 'bg-green-900/30 border-green-500' : ''}`}>
                    <Activity size={12} className={miningStatus === 'executing' ? 'animate-bounce text-green-400' : 'text-gray-600'} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-900 p-2 rounded mb-4">
            <div>
              <span className="text-[10px] text-gray-500 block">{t('home.unrealized_profit')}</span>
              <span className="text-white font-mono">
                ${currentProgress.toFixed(5)}
              </span>
            </div>
            <span className="text-xs text-red-400 flex items-center">{t('home.fee_label')}</span>
          </div>

          <Button onClick={() => navigate('invest')} className="w-full flex items-center justify-center gap-2">
             {t('home.upgrade_button')} <Zap size={16} />
          </Button>
        </Card>
      </div>

      {/* Histórico Hash */}
      <div className="px-4">
        <h3 className="text-gray-400 text-sm mb-2 px-1">{t('home.history_title')}</h3>
        <div className="max-h-64 overflow-y-auto pr-1">
          {state.miningHistory.length === 0 ? (
            <div className="text-center text-gray-600 text-xs py-4">{t('home.await_cycle')}</div>
          ) : (
            <div className="space-y-2">
              {state.miningHistory.map((entry) => (
                <div key={entry.id} className="bg-gray-900 p-3 rounded border-l-2 border-purple-500 flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-400">{new Date(entry.time).toLocaleTimeString()}</span>
                    <span className="text-gray-500">Hash ID: {entry.details[0]?.hash}</span>
                  </div>
                  <span className="text-green-400 font-bold">+${entry.details.reduce((a,b) => a + b.profit, 0).toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
