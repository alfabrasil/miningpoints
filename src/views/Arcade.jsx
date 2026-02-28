import React, { useContext, useState } from 'react';
import { AlertTriangle, History, Swords, Trophy, Users, Check, X, Share2, Copy, Volume2, VolumeX } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CyberRunnerGame } from '../components/games/CyberRunner';
import { CryptoCatcherGame } from '../components/games/CryptoCatcher';
import { HashHarvestGame } from '../components/games/HashHarvest';
import { SoundManager } from '../utils/soundManager';

export const ArcadeView = () => {
    const [tab, setTab] = useState('daily'); // 'daily', 'pvp'
    const [game, setGame] = useState(null); // 'runner', 'catcher'
    const [pvpState, setPvpState] = useState('lobby'); // 'lobby', 'waiting_room', 'playing', 'result'
    const [pvpConfig, setPvpConfig] = useState({ bet: 100, char: 'mp_p1' });
    const [pvpResult, setPvpResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [waitingTimer, setWaitingTimer] = useState(0); // Timer for waiting room
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Estado de Mute
    const { state, setState, addNotification, addGameResult, consumeDailyCredit, buyCredits, t } = useContext(AppContext);
    
    // Áudio BGM (Gerenciado pelo SoundManager)
    React.useEffect(() => {
        // Limpa áudio ao desmontar
        return () => {
            SoundManager.stopMusic();
        };
    }, []);

    const toggleMute = () => {
        setIsMuted(prev => {
            const newState = !prev;
            if (newState) {
                SoundManager.stopMusic();
            } else if (pvpState === 'playing') {
                SoundManager.startMusic();
            }
            return newState;
        });
    };

    const startBgm = () => {
        if (!isMuted) {
            SoundManager.startMusic();
        }
    };

    const stopBgm = () => {
        SoundManager.stopMusic();
    };

    const playResultSound = (outcome) => {
        if (isMuted) return;

        if (outcome === 'win') {
            SoundManager.playSfx('victory');
        } else if (outcome === 'loss') {
            SoundManager.playSfx('defeat');
        }
    };

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

    // --- LÓGICA PVP ---

    // Lista de jogos abertos (Mock)
    const [openGames, setOpenGames] = useState([
        { id: 'g1', player: 'CyberNinja', bet: 100, avatar: 'mp_p2' },
        { id: 'g2', player: 'CryptoKing', bet: 500, avatar: 'mp_p3' },
        { id: 'g3', player: 'MinerX', bet: 100, avatar: 'mp_p4' },
    ]);

    const handleCreateGame = () => {
        if (state.wallet.mph < pvpConfig.bet) {
            addNotification(t('arcade.insufficientFunds'), 'danger');
            return;
        }

        startBgm(); // Start BGM on user interaction

        // Debita aposta antecipadamente
        setState(prev => ({
            ...prev,
            wallet: { ...prev.wallet, mph: prev.wallet.mph - pvpConfig.bet }
        }));
        
        // Adiciona ao Book (Simulação)
        const myGameId = `g_${Date.now()}`;
        const newGame = { 
            id: myGameId, 
            player: state.user.username || 'Player1', 
            bet: pvpConfig.bet, 
            avatar: pvpConfig.char 
        };
        
        setOpenGames(prev => [newGame, ...prev]);
        setPvpConfig(prev => ({ ...prev, gameId: myGameId })); // Salva ID para cancelar depois

        setPvpState('waiting_room');
        setWaitingTimer(45); // 45 segundos de espera
    };

    const handleCancelGame = () => {
        if (window.confirm(t('arcade.cancelConfirm'))) {
            stopBgm(); // Stop BGM on cancel

            // Remove do Book
            if (pvpConfig.gameId) {
                setOpenGames(prev => prev.filter(g => g.id !== pvpConfig.gameId));
            }

            // Reembolsa aposta
            setState(prev => ({
                ...prev,
                wallet: { ...prev.wallet, mph: prev.wallet.mph + pvpConfig.bet }
            }));
            setPvpState('lobby');
        }
    };

    // Timer da Sala de Espera
    React.useEffect(() => {
        let interval;
        if (pvpState === 'waiting_room' && waitingTimer > 0) {
            interval = setInterval(() => {
                setWaitingTimer(prev => prev - 1);
                
                // Simula entrada de oponente aleatoriamente
                if (Math.random() > 0.95) { 
                    addNotification(t('arcade.opponentFound'), 'success');
                    // Remove do book ao iniciar
                    if (pvpConfig.gameId) {
                        setOpenGames(prev => prev.filter(g => g.id !== pvpConfig.gameId));
                    }
                    setPvpState('playing');
                }
            }, 1000);
        } else if (pvpState === 'waiting_room' && waitingTimer === 0) {
            // Timeout - Ninguém entrou
            addNotification(t('arcade.noHumanFound'), 'info');
            // Remove do book ao iniciar contra bot
            if (pvpConfig.gameId) {
                setOpenGames(prev => prev.filter(g => g.id !== pvpConfig.gameId));
            }
            setPvpState('playing');
        }
        return () => clearInterval(interval);
    }, [pvpState, waitingTimer]);

    const handleJoinGame = (gameId, betAmount) => {
        if (state.wallet.mph < betAmount) {
            addNotification(t('arcade.insufficientToJoin'), 'danger');
            return;
        }
        
        startBgm(); // Start BGM on user interaction

        // Configura para jogar contra esse "oponente" (na verdade inicia o jogo normal)
        setPvpConfig(prev => ({ ...prev, bet: betAmount }));
        
        // Debita aposta
        setState(prev => ({
            ...prev,
            wallet: { ...prev.wallet, mph: prev.wallet.mph - betAmount }
        }));

        addNotification(t('arcade.challengeAccepted'), 'success');
        setTimeout(() => setPvpState('playing'), 1000);
    };

    const handlePvpGameOver = (finalScore) => {
        stopBgm(); // Stop BGM on Game Over

        // Cálculo de resultado
        // Se Player > Bot: Ganha Aposta * 2 * 0.9 (10% taxa de cada)
        // Se Empate: Devolve Aposta * 0.9 (Taxa da casa)
        // Se Perde: 0

        let outcome = 'loss';
        let prize = 0;

        if (finalScore.player > finalScore.bot) {
            outcome = 'win';
            prize = pvpConfig.bet * 2 * 0.9;
        } else if (finalScore.player === finalScore.bot) {
            outcome = 'draw';
            prize = pvpConfig.bet * 0.9; // Devolve com taxa
        }

        playResultSound(outcome); // Play result sound (already blessed)

        if (prize > 0) {
            // Vitória ou Empate:
            // Histórico: Lucro (Prêmio - Aposta)
            // Carteira: Recebe o Prêmio (já que a aposta foi descontada no início)
            addGameResult('PvP Arena', prize - pvpConfig.bet, prize); 
        } else {
            // Derrota:
            // Histórico: Prejuízo (-Aposta)
            // Carteira: 0 (não desconta novamente, pois já foi descontado no início)
            addGameResult('PvP Arena', -pvpConfig.bet, 0);
        }

        setPvpResult({ outcome, prize, score: finalScore });
        setPvpState('result');
    };

    const handleShareLink = () => {
        const link = `${window.location.origin}/pvp/join/${pvpConfig.gameId || 'invite'}`;
        navigator.clipboard.writeText(link);
        addNotification(t('arcade.linkCopied'), 'success');
    };

    return (
        <div className="px-4 pb-24 animate-fadeIn">
            
            {/* Cabeçalho Arcade */}
            <div className="text-center py-6">
                <h2 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">{t('arcade.title')}</h2>
                <p className="text-gray-400 text-xs mt-2">{t('arcade.subtitle')}</p>
            </div>

            {/* Abas */}
            <div className="flex p-1 bg-gray-900 rounded-xl mb-6 border border-gray-800">
                <button 
                    onClick={() => setTab('daily')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'daily' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {t('arcade.dailyGames')}
                </button>
                <button 
                    onClick={() => setTab('pvp')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'pvp' ? 'bg-purple-600 text-white shadow' : 'text-purple-400 hover:text-purple-300'}`}
                >
                    <Swords size={14} /> {t('arcade.pvpArena')}
                </button>
            </div>
            
            {/* Botão de Mute Flutuante */}
                <Button 
                    onClick={toggleMute}
                    className="absolute top-24 right-4 z-50 bg-black/50 hover:bg-black/70 p-2 rounded-full border border-gray-600"
                    size="sm"
                >
                    {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-green-400" />}
                </Button>

                {/* Conteúdo das Abas */}
            {tab === 'daily' && (
                <>
                    {/* Renderização Condicional do Jogo Real */}
                    {game === 'runner_wrapper' && (
                        <div className="fixed inset-0 z-50 bg-black flex flex-col">
                            <Button onClick={() => setGame(null)} className="absolute top-4 right-4 z-50 bg-red-600/80 p-2 rounded-full w-auto h-auto"><X size={20}/></Button>
                            <CyberRunnerGame 
                                onGameOver={(score) => {}} // Lógica interna cuida da exibição
                                onExit={(finalScore) => closeRunner(finalScore || 0)}
                            />
                        </div>
                    )}

                    {game === 'catcher' && (
                        <div className="fixed inset-0 z-50 bg-black flex flex-col">
                            <Button onClick={() => setGame(null)} className="absolute top-4 right-4 z-50 bg-red-600/80 p-2 rounded-full w-auto h-auto"><X size={20}/></Button>
                            <CryptoCatcherGame 
                                onGameOver={(score) => {}} 
                                onExit={(finalScore) => closeCatcher(finalScore || 0)}
                            />
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <div className="inline-block bg-gray-800 px-3 py-1 rounded-full text-xs border border-green-500 text-green-400">
                            {t('arcade.dailyCreditsLabel')} {state.user.dailyCredits}/3
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* JOGO 1: CYBER RUNNER */}
                        <Card className="relative overflow-hidden group p-0 border-[#ff00ff]" highlight>
                            <div className="h-32 bg-black relative">
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
                </>
            )}

            {tab === 'pvp' && (
                <>
                    {pvpState === 'lobby' && (
                        <PvpLobby 
                            pvpConfig={pvpConfig} 
                            setPvpConfig={setPvpConfig} 
                            onCreate={handleCreateGame} 
                            onJoin={handleJoinGame}
                            userBalance={state.wallet?.mph || 0}
                            isSearching={isSearching}
                            openGames={openGames}
                            t={t}
                        />
                    )}
                    
                    {pvpState === 'waiting_room' && (
                        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 animate-fadeIn">
                            <div className="text-center w-full max-w-md">
                                <div className="mb-6 relative inline-block">
                                    <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl animate-pulse opacity-50"></div>
                                    <img src={`/assets/persona/${pvpConfig.char}.svg`} alt="You" className="w-32 h-32 relative z-10 drop-shadow-lg" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 animate-pulse">{t('arcade.waitingChallenger')}</h3>
                                <p className="text-gray-400 mb-6">{t('arcade.yourBet')} <span className="text-green-400 font-mono font-bold">{pvpConfig.bet} MPH</span></p>
                                
                                <div className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700">
                                    <p className="text-xs text-gray-400 mb-2">{t('arcade.shareLink')}</p>
                                    <div className="flex gap-2">
                                        <div className="bg-black/50 p-2 rounded text-xs text-gray-300 font-mono flex-1 truncate border border-gray-600">
                                            {`${window.location.origin}/pvp/join/${pvpConfig.gameId || '...'}`}
                                        </div>
                                        <Button onClick={handleShareLink} size="sm" className="bg-blue-600 px-3">
                                            <Copy size={14} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="text-4xl font-mono font-bold text-yellow-400 mb-8">
                                    00:{waitingTimer < 10 ? `0${waitingTimer}` : waitingTimer}
                                </div>

                                <p className="text-xs text-gray-500 mb-8 max-w-xs mx-auto">
                                    {t('arcade.visibleInBook')}
                                </p>

                                <Button onClick={handleCancelGame} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10 w-full">
                                    {t('arcade.cancelRefund')}
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {pvpState === 'playing' && (
                        <div className="fixed inset-0 z-50 bg-black flex flex-col p-4">
                            <Button onClick={() => { if(window.confirm(t('arcade.exitConfirm'))) setPvpState('lobby'); }} className="absolute top-4 right-4 z-50 bg-red-600/80 p-2 rounded-full w-auto h-auto"><X size={20}/></Button>
                            <div className="flex-1 flex items-center justify-center">
                                <HashHarvestGame 
                                    onGameOver={handlePvpGameOver}
                                    betAmount={pvpConfig.bet}
                                    playerChar={pvpConfig.char}
                                    botChar={openGames.find(g => g.id !== pvpConfig.gameId)?.avatar || 'mp_p6'}
                                    isMuted={isMuted}
                                />
                            </div>
                        </div>
                    )}

                    {pvpState === 'result' && (
                        <PvpResult 
                            pvpResult={pvpResult} 
                            onLobby={() => setPvpState('lobby')} 
                            onRematch={handleCreateGame}
                            t={t}
                        />
                    )}
                </>
            )}

            {/* Modal de Créditos Insuficientes (Apenas para Daily) */}
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

            {/* HISTÓRICO DE JOGADAS (Comum) */}
            <div className="mt-8">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <History size={16} className="text-gray-400"/> {t('arcade.historyTitle')}
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {state.gameHistory && state.gameHistory.filter(entry => entry.game === 'PvP Arena').length > 0 ? (
                        state.gameHistory
                            .filter(entry => entry.game === 'PvP Arena') // Filtra apenas jogos PvP Arena
                            .map((entry) => (
                            <div key={entry.id} className="bg-gray-900 p-3 rounded flex justify-between items-center text-xs border-l-2 border-purple-500">
                                <div>
                                    <p className="font-bold text-white">{entry.game}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(entry.time).toLocaleString()}</p>
                                </div>
                                <span className={`font-bold font-mono ${entry.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {entry.amount >= 0 ? '+' : ''}{entry.amount.toFixed(2)} MPH
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600 text-xs text-center py-4 bg-gray-900/50 rounded border border-gray-800 border-dashed">
                            {t('arcade.historyEmpty')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const PvpLobby = ({ pvpConfig, setPvpConfig, onCreate, onJoin, userBalance, isSearching, openGames = [], t }) => {
    const playClick = () => {
        SoundManager.playSfx('click');
    };

    return (
    <div className="animate-fadeIn pb-24">
        {/* SESSÃO 1: CRIAR PARTIDA */}
        <Card className="mb-6 border-purple-500 bg-purple-900/10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Swords className="text-purple-400" /> {t('arcade.setupMatch')}
                </h3>
                <div className="text-right">
                    <p className="text-[10px] text-gray-400">{t('arcade.yourBalance')}</p>
                    <p className={`font-mono font-bold ${userBalance < pvpConfig.bet ? 'text-red-400' : 'text-green-400'}`}>
                        {(userBalance || 0).toFixed(2)} MPH
                    </p>
                </div>
            </div>
            
            <div className="mb-6">
                <label className="text-xs text-gray-400 block mb-2">{t('arcade.chooseChar')}</label>
                <div className="grid grid-cols-4 gap-3">
                    {['mp_p1', 'mp_p2', 'mp_p3', 'mp_p4', 'mp_p5', 'mp_p6', 'mp_p7', 'mp_p8'].map(char => (
                        <button 
                            key={char}
                            onClick={() => { playClick(); setPvpConfig({...pvpConfig, char}); }}
                            className={`relative w-full aspect-square rounded-xl border-2 flex items-center justify-center bg-black/40 transition-all ${pvpConfig.char === char ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] scale-105 z-10' : 'border-gray-700 opacity-60'}`}
                        >
                            <img src={`/assets/persona/${char}.svg`} alt={char} className="w-4/5 h-4/5 object-contain" />
                            {pvpConfig.char === char && <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-0.5"><Check size={12} className="text-black"/></div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="text-xs text-gray-400 block mb-2">{t('arcade.betAmount')}</label>
                <div className="grid grid-cols-3 gap-3">
                    {[100, 500, 1000].map(amt => (
                        <button
                            key={amt}
                            onClick={() => { playClick(); setPvpConfig({...pvpConfig, bet: amt}); }}
                            className={`py-3 rounded-lg border font-mono font-bold transition-all ${pvpConfig.bet === amt ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                        >
                            {amt}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">{t('arcade.systemFee')}</p>
            </div>

            <Button 
                onClick={() => { playClick(); onCreate(); }}
                disabled={isSearching}
                className={`w-full py-4 text-lg font-black bg-gradient-to-r from-purple-600 to-pink-600 border-0 shadow-lg hover:scale-[1.02] transition-transform ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isSearching ? t('arcade.creating') : t('arcade.createRoom')}
            </Button>
        </Card>

        {/* SESSÃO 2: BOOK DE OFERTAS (Batalhas Disponíveis) */}
        <div className="mb-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Users size={16} className="text-blue-400"/> {t('arcade.availableBattles')}
            </h3>
            
            <div className="space-y-3">
                {openGames.map(game => (
                    <div key={game.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black/50 rounded-lg p-1 border border-gray-600">
                                <img src={`/assets/persona/${game.avatar}.svg`} alt="p" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">{game.player}</p>
                                <p className="text-[10px] text-green-400 font-mono">{t('arcade.betLabel')} {game.bet} MPH</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => { playClick(); onJoin(game.id, game.bet); }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-500 text-xs px-4"
                            disabled={userBalance < game.bet}
                        >
                            {t('arcade.challenge')}
                        </Button>
                    </div>
                ))}
                
                {openGames.length === 0 && (
                    <p className="text-gray-500 text-xs text-center py-4 border border-dashed border-gray-700 rounded-lg">
                        {t('arcade.noBattles')}
                    </p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                <Trophy className="mx-auto text-yellow-500 mb-2" />
                <p className="text-xs text-gray-400">{t('arcade.totalPaid')}</p>
                <p className="text-lg font-bold text-white">1.2M MPH</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                <Users className="mx-auto text-blue-500 mb-2" />
                <p className="text-xs text-gray-400">{t('arcade.online')}</p>
                <p className="text-lg font-bold text-white">428</p>
            </div>
        </div>
    </div>
    );
};

const PvpResult = ({ pvpResult, onLobby, onRematch, t }) => {
    React.useEffect(() => {
        // Auto-scroll to top when result screen appears
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
    <div className="animate-fadeIn text-center py-8">
        <div className="mb-6">
            {pvpResult.outcome === 'win' && <Trophy size={64} className="mx-auto text-yellow-400 animate-bounce" />}
            {pvpResult.outcome === 'loss' && <AlertTriangle size={64} className="mx-auto text-red-400" />}
            {pvpResult.outcome === 'draw' && <Users size={64} className="mx-auto text-gray-400" />}
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2">
            {pvpResult.outcome === 'win' ? t('arcade.victory') : pvpResult.outcome === 'loss' ? t('arcade.defeat') : t('arcade.draw')}
        </h2>
        
        <p className="text-gray-400 mb-6">
            {pvpResult.outcome === 'win' ? t('arcade.victoryDesc') : t('arcade.tryAgain')}
        </p>

        <div className="bg-gray-900 rounded-xl p-4 mb-6 max-w-xs mx-auto border border-gray-800">
            <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400">{t('arcade.finalScore')}</span>
                <span className="text-xs font-bold text-white">{pvpResult.score.player} x {pvpResult.score.bot}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                <span className="text-xs text-gray-400">{t('arcade.prizeReceived')}</span>
                <span className={`text-xl font-mono font-bold ${pvpResult.prize > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                    +{pvpResult.prize.toFixed(0)} MPH
                </span>
            </div>
        </div>

        <div className="flex gap-3">
            <Button onClick={onLobby} variant="secondary" className="flex-1">{t('arcade.lobby')}</Button>
            <Button onClick={onRematch} className="flex-1">{t('arcade.rematch')}</Button>
        </div>
    </div>
    );
};
