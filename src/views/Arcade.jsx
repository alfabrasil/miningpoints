import React, { useContext, useState } from 'react';
import { AlertTriangle, History } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CyberRunnerGame } from '../components/games/CyberRunner';
import { CryptoCatcherGame } from '../components/games/CryptoCatcher';

export const ArcadeView = () => {
    const [game, setGame] = useState(null); // 'runner', 'catcher'
    const [showCreditModal, setShowCreditModal] = useState(false);
    const { state, addNotification, addGameResult, consumeDailyCredit, buyCredits, t } = useContext(AppContext);
    
    // Simulação simplificada de games para o MVP (Catcher continua simples)
    const finishCatcherGame = (score) => {
        const earnedMPH = Math.floor(score / 10);
        addGameResult('Crypto Catcher', earnedMPH);
        addNotification(`Arcade: +${earnedMPH} MPH ganhos!`, 'game');
        setGame(null);
    };

    const handlePlayRequest = (gameType) => {
        if (consumeDailyCredit()) {
            setGame(gameType);
        } else {
            setShowCreditModal(true);
        }
    };

    const closeRunner = (finalScore) => {
        const earnedMPH = finalScore / 10;
        if (earnedMPH > 0) {
            addGameResult('Cyber Runner', earnedMPH);
            addNotification(`Corrida finalizada: +${earnedMPH.toFixed(1)} MPH`, 'success');
        }
        setGame(null);
    };

    const closeCatcher = (finalScore) => {
        const earnedMPH = finalScore / 5; // Scoring ratio for Catcher
        if (earnedMPH > 0) {
            addGameResult('Crypto Catcher', earnedMPH);
            addNotification(`Catcher finalizado: +${earnedMPH.toFixed(1)} MPH`, 'success');
        }
        setGame(null);
    };

    return (
        <div className="px-4 pb-24 animate-fadeIn">
            
            {/* Renderização Condicional do Jogo Real */}
            {game === 'runner_wrapper' && (
                <CyberRunnerGame 
                    onGameOver={(score) => {}} // Lógica interna cuida da exibição
                    onExit={(finalScore) => closeRunner(finalScore || 0)}
                />
            )}

            {game === 'catcher' && (
                <CryptoCatcherGame 
                    onGameOver={(score) => {}} 
                    onExit={(finalScore) => closeCatcher(finalScore || 0)}
                />
            )}

            {/* Modal de Créditos Insuficientes */}
            {showCreditModal && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur">
                    <Card className="max-w-xs w-full text-center border-red-500">
                        <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                        <h3 className="text-xl font-bold text-white mb-2">{t('arcade.noCreditsTitle')}</h3>
                        <p className="text-gray-400 text-sm mb-6">{t('arcade.noCreditsText')}</p>
                        <div className="space-y-3">
                            <Button onClick={() => { 
                                if(buyCredits(5, 500)) setShowCreditModal(false); // 5 créditos por 500 MPH
                            }} variant="success" className="w-full text-xs">
                                {t('arcade.buyCredits')}
                            </Button>
                            <Button onClick={() => setShowCreditModal(false)} variant="secondary" className="w-full text-xs">
                                {t('arcade.comeBack')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            <div className="text-center py-6">
                <h2 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">{t('arcade.title')}</h2>
                <p className="text-gray-400 text-xs mt-2">{t('arcade.subtitle')}</p>
                <div className="inline-block bg-gray-800 px-3 py-1 rounded-full mt-2 text-xs border border-green-500 text-green-400">
                    {t('arcade.dailyCreditsLabel')} {state.user.dailyCredits}/3
                </div>
            </div>

            <div className="space-y-6">
                {/* JOGO 1: CYBER RUNNER */}
                <Card className="relative overflow-hidden group p-0 border-[#ff00ff]" highlight>
                    <div className="h-32 bg-black relative">
                        {/* Imagem de fundo pixel art simulada com CSS */}
                        <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-vector/pixel-art-mystical-background_52683-87349.jpg')] bg-cover bg-center opacity-60"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        <div className="absolute bottom-2 left-4">
                            <h3 className="text-xl font-bold text-white font-mono drop-shadow-md">{t('arcade.runnerTitle')}</h3>
                            <p className="text-[10px] text-gray-300">{t('arcade.runnerDesc')}</p>
                        </div>
                    </div>
                    <div className="p-3 bg-[#111111]">
                        <Button 
                            onClick={() => handlePlayRequest('runner_wrapper')} 
                            className="w-full text-xs py-3 font-mono bg-purple-700 hover:bg-purple-600 shadow-[0_0_10px_#a855f7]"
                        >
                            {t('arcade.playNow')}
                        </Button>
                    </div>
                </Card>

                {/* JOGO 2: CRYPTO CATCHER */}
                <Card className="relative overflow-hidden group p-0 border-purple-900">
                     <div className="h-32 bg-black relative">
                        <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-vector/pixel-rain-abstract-background_23-2148364537.jpg')] bg-cover bg-center opacity-40"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        <div className="absolute bottom-2 left-4">
                            <h3 className="text-xl font-bold text-white font-mono">{t('arcade.catcherTitle')}</h3>
                            <p className="text-[10px] text-gray-300">{t('arcade.catcherDesc')}</p>
                        </div>
                    </div>
                    <div className="p-3 bg-[#111111]">
                        <Button onClick={() => handlePlayRequest('catcher')} variant="outline" className="w-full text-xs py-3 font-mono">
                            {t('arcade.playNow')}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* HISTÓRICO DE JOGADAS */}
            <div className="mt-8">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <History size={16} className="text-gray-400"/> {t('arcade.historyTitle')}
                </h3>
                <div className="space-y-2">
                    {state.gameHistory && state.gameHistory.length > 0 ? (
                        state.gameHistory.map((entry) => (
                            <div key={entry.id} className="bg-gray-900 p-3 rounded flex justify-between items-center text-xs border-l-2 border-purple-500">
                                <div>
                                    <p className="font-bold text-white">{entry.game}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(entry.time).toLocaleString()}</p>
                                </div>
                                <span className="text-green-400 font-bold font-mono">+{entry.amount.toFixed(2)} MPH</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600 text-xs text-center py-4 bg-gray-900/50 rounded border border-gray-800 border-dashed">
                            {t('arcade.historyEmpty')}
                        </p>
                    )}
                </div>
            </div>

            {/* Wrapper removido pois agora temos o componente real */}
        </div>
    );
};
