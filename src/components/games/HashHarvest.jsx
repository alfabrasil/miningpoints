import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Cpu, Zap, Battery, Shield, Trophy, Timer } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const GRID_SIZE = 6;
const GAME_DURATION = 60; // segundos

// Itens com pontuação
const ITEMS = [
    { id: 'cpu', icon: Cpu, color: 'text-blue-400', points: 10 },
    { id: 'gpu', icon: Zap, color: 'text-yellow-400', points: 20 },
    { id: 'battery', icon: Battery, color: 'text-green-400', points: 5 },
    { id: 'shield', icon: Shield, color: 'text-purple-400', points: 15 }
];

export const HashHarvestGame = React.memo(({ onGameOver, betAmount, playerChar, botChar = 'mp_p2', isMuted = false }) => {
    const [gameState, setGameState] = useState('playing'); 
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState({ player: 0, bot: 0 });
    const [grid, setGrid] = useState([]);
    
    // Hit effects
    const [hitTarget, setHitTarget] = useState(null); // 'player' or 'bot'
    
    // Refs para estado mutável acessível no loop sem re-renderizar/reiniciar efeitos
    const gameStateRef = useRef('playing');
    const playerPosRef = useRef({ x: 0, y: 0 });
    const botPosRef = useRef({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
    const gridRef = useRef([]);

    // Estados visuais para renderização (sincronizados com refs)
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [playerFlip, setPlayerFlip] = useState(false); // false = direita (padrão), true = esquerda
    const [botPos, setBotPos] = useState({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
    const [botFlip, setBotFlip] = useState(true); // bot começa na direita olhando pra esquerda

    // Sons otimizados
    const punchSoundRef = useRef(new Audio('https://www.myinstants.com/media/sounds/roblox-punch-sound.mp3')); // Som de soco mais "seco" e rápido
    
    // BGM agora é gerenciado pelo ArcadeView para compatibilidade com iOS (autoplay policy)

    useEffect(() => {
        // Preload SFX
        punchSoundRef.current.load();
        punchSoundRef.current.volume = 1.0;
    }, []);

    const playPunchSound = () => {
        if (isMuted) return;
        try {
            // Clona o áudio para permitir sons sobrepostos rápidos
            const sound = punchSoundRef.current.cloneNode();
            sound.volume = 0.8;
            sound.play().catch(e => console.warn("Audio play failed", e));
        } catch (e) {
            console.warn("Audio error", e);
        }
    };

    const triggerHitEffect = (target) => {
        setHitTarget(target);
        setTimeout(() => setHitTarget(null), 300);
    };

    const checkCollection = (x, y, who) => {
        const currentGrid = gridRef.current;
        if (currentGrid[y] && currentGrid[y][x]) {
            const item = currentGrid[y][x];
            setScore(s => ({ ...s, [who]: s[who] + item.points }));
            
            const newGrid = currentGrid.map(row => [...row]);
            newGrid[y][x] = null;
            gridRef.current = newGrid;
            setGrid(newGrid);
        }
    };

    // Inicializa Grid e Estado
    useEffect(() => {
        const initialGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        // Force spawn 8 items initially to ensure grid is not empty
        for(let i=0; i<8; i++) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 20) {
                const x = Math.floor(Math.random() * GRID_SIZE);
                const y = Math.floor(Math.random() * GRID_SIZE);
                if (!initialGrid[y][x]) {
                    const itemType = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                    initialGrid[y][x] = { ...itemType, uid: Date.now() + Math.random() + i };
                    placed = true;
                }
                attempts++;
            }
        }
        
        setGrid(initialGrid);
        gridRef.current = initialGrid;
        gameStateRef.current = 'playing';

        // START GAME LOOP only after initialization
        const loop = setInterval(() => {
            if (gameStateRef.current !== 'playing') return;

            // 1. Timer
            setTimeLeft(prev => {
                if (prev <= 1) {
                    gameStateRef.current = 'finished';
                    setGameState('finished');
                    return 0;
                }
                return prev - 1;
            });

        }, 1000);

        const botLoop = setInterval(() => {
            if (gameStateRef.current !== 'playing') return;
            moveBot();
        }, 800);

        const spawnLoop = setInterval(() => {
            if (gameStateRef.current !== 'playing') return;
            // Safety check: ensure gridRef.current is valid array
            if (!gridRef.current || !gridRef.current.length) return;

            const newGrid = gridRef.current.map(row => [...row]);
            spawnItem(newGrid);
            setGrid(newGrid);
            gridRef.current = newGrid;
        }, 2000);

        return () => {
            clearInterval(loop);
            clearInterval(botLoop);
            clearInterval(spawnLoop);
        };
    }, []);

    // Remove separate loops from previous implementation to avoid race conditions
    // ...

    // End Game Check
    useEffect(() => {
        if (gameState === 'finished') {
            setTimeout(() => {
                onGameOver(score);
            }, 1500);
        }
    }, [gameState]);

    const spawnItem = (currentGrid) => {
        if (!currentGrid) return;
        let attempts = 0;
        while (attempts < 10) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            
            const pPos = playerPosRef.current;
            const bPos = botPosRef.current;

            // Safe access check
            if (currentGrid[y] && !currentGrid[y][x] && !(x === pPos.x && y === pPos.y) && !(x === bPos.x && y === bPos.y)) {
                const itemType = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                currentGrid[y][x] = { ...itemType, uid: Date.now() + Math.random() };
                break;
            }
            attempts++;
        }
    };

    const moveBot = () => {
        const currentBotPos = botPosRef.current;
        const currentGrid = gridRef.current;
        
        let target = null;
        let minDist = Infinity;

        // Find closest item
        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                if (currentGrid[y] && currentGrid[y][x]) {
                    const dist = Math.abs(x - currentBotPos.x) + Math.abs(y - currentBotPos.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = { x, y };
                    }
                }
            }
        }

        let nextX = currentBotPos.x;
        let nextY = currentBotPos.y;

        if (target) {
            if (target.x > currentBotPos.x) { nextX++; setBotFlip(false); }
            else if (target.x < currentBotPos.x) { nextX--; setBotFlip(true); }
            else if (target.y > currentBotPos.y) nextY++;
            else if (target.y < currentBotPos.y) nextY--;
        } else {
            const moves = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
            const move = moves[Math.floor(Math.random() * moves.length)];
            nextX = Math.max(0, Math.min(GRID_SIZE-1, currentBotPos.x + move.x));
            nextY = Math.max(0, Math.min(GRID_SIZE-1, currentBotPos.y + move.y));
            
            if (nextX > currentBotPos.x) setBotFlip(false);
            if (nextX < currentBotPos.x) setBotFlip(true);
        }
        
        // Update Bot Ref and State
        const playerPos = playerPosRef.current;
        
        // COLLISION WITH PLAYER
        if (nextX === playerPos.x && nextY === playerPos.y) {
            playPunchSound();
            triggerHitEffect('player');
            
            const dx = nextX - currentBotPos.x;
            const dy = nextY - currentBotPos.y;
            const knockbackX = playerPos.x + dx;
            const knockbackY = playerPos.y + dy;
            
            // Push Player if valid
            if (knockbackX >= 0 && knockbackX < GRID_SIZE && knockbackY >= 0 && knockbackY < GRID_SIZE) {
                // Move Player
                playerPosRef.current = { x: knockbackX, y: knockbackY };
                setPlayerPos({ x: knockbackX, y: knockbackY });
                checkCollection(knockbackX, knockbackY, 'player'); // Player collects item if pushed into it

                // Move Bot
                botPosRef.current = { x: nextX, y: nextY };
                setBotPos({ x: nextX, y: nextY });
                checkCollection(nextX, nextY, 'bot');
            } else {
                // Blocked by wall - Bot stays, Player gets hit but doesn't move
            }
        } else {
            // Normal Move
            botPosRef.current = { x: nextX, y: nextY };
            setBotPos({ x: nextX, y: nextY });
            checkCollection(nextX, nextY, 'bot');
        }
    };

    const handlePlayerMove = (dx, dy) => {
        if (gameStateRef.current !== 'playing') return;
        
        const currentPos = playerPosRef.current;
        const targetX = currentPos.x + dx;
        const targetY = currentPos.y + dy;
        
        // Bounds Check
        if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) return;
        
        // Atualiza direção do sprite
        if (dx > 0) setPlayerFlip(false);
        if (dx < 0) setPlayerFlip(true);

        // COLLISION WITH BOT
        const botPos = botPosRef.current;
        if (targetX === botPos.x && targetY === botPos.y) {
            playPunchSound();
            triggerHitEffect('bot');
            
            const knockbackX = botPos.x + dx;
            const knockbackY = botPos.y + dy;
            
            // Push Bot if valid
            if (knockbackX >= 0 && knockbackX < GRID_SIZE && knockbackY >= 0 && knockbackY < GRID_SIZE) {
                // Move Bot
                botPosRef.current = { x: knockbackX, y: knockbackY };
                setBotPos({ x: knockbackX, y: knockbackY });
                checkCollection(knockbackX, knockbackY, 'bot'); // Bot collects item if pushed into it

                // Move Player
                playerPosRef.current = { x: targetX, y: targetY };
                setPlayerPos({ x: targetX, y: targetY });
                checkCollection(targetX, targetY, 'player');
            } else {
                // Blocked by wall
                // Player stays, Bot gets hit but doesn't move
            }
            return;
        }

        // Normal Move
        playerPosRef.current = { x: targetX, y: targetY };
        setPlayerPos({ x: targetX, y: targetY });
        checkCollection(targetX, targetY, 'player');
    };

    // Cálculos de posição CSS para movimento suave
    const getPosStyle = (pos) => ({
        left: `${(pos.x / GRID_SIZE) * 100}%`,
        top: `${(pos.y / GRID_SIZE) * 100}%`,
        width: `${100 / GRID_SIZE}%`,
        height: `${100 / GRID_SIZE}%`,
    });

    // Adiciona controles de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameStateRef.current !== 'playing') return;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    handlePlayerMove(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    handlePlayerMove(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    handlePlayerMove(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    handlePlayerMove(1, 0);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col items-center justify-between h-full w-full max-w-md mx-auto relative">
            
            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-4 px-2">
                <Card className="p-2 w-24 text-center border-green-500 bg-green-900/20">
                    <p className="text-[10px] text-green-400 font-bold uppercase">VOCÊ</p>
                    <p className="text-xl font-black text-white">{score.player}</p>
                </Card>

                <div className="flex flex-col items-center">
                    <div className="bg-gray-800 px-4 py-1 rounded-full border border-purple-500 flex items-center gap-2 mb-1">
                        <Timer size={14} className="text-purple-400" />
                        <span className="text-xl font-mono font-bold text-white">{timeLeft}s</span>
                    </div>
                    <span className="text-[10px] text-gray-500">APOSTA: {betAmount} MPH</span>
                </div>

                <Card className="p-2 w-24 text-center border-red-500 bg-red-900/20">
                    <p className="text-[10px] text-red-400 font-bold uppercase">RIVAL</p>
                    <p className="text-xl font-black text-white">{score.bot}</p>
                </Card>
            </div>

            {/* AREA DO JOGO */}
            <div className="w-full aspect-square relative bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
                
                {/* GRID (Fundo e Itens) */}
                <div 
                    className="absolute inset-0"
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, 
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                    }}
                >
                    {grid.map((row, y) => (
                        row.map((item, x) => (
                            <div key={`${x}-${y}`} className="border border-gray-800/30 flex items-center justify-center">
                                {item && (
                                    <item.icon size={24} className={`${item.color} animate-pulse drop-shadow-lg`} />
                                )}
                            </div>
                        ))
                    ))}
                </div>

                {/* JOGADORES (Camada Superior - Movimento Suave) */}
                
                {/* Player */}
                <div 
                    className="absolute transition-all duration-200 ease-out flex items-center justify-center z-10"
                    style={getPosStyle(playerPos)}
                >
                    <img 
                        src={`/assets/persona/${playerChar}.svg`} 
                        alt="P1" 
                        className={`w-4/5 h-4/5 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-transform duration-200 ${playerFlip ? '-scale-x-100' : 'scale-x-100'} ${hitTarget === 'player' ? 'brightness-200 saturate-200 animate-pulse' : ''}`} 
                    />
                    {hitTarget === 'player' && (
                        <span className="absolute -top-6 text-yellow-400 font-black text-2xl animate-bounce drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-50">POW!</span>
                    )}
                </div>

                {/* Bot */}
                <div 
                    className="absolute transition-all duration-200 ease-out flex items-center justify-center z-10"
                    style={getPosStyle(botPos)}
                >
                    <img 
                        src={`/assets/persona/${botChar}.svg`} 
                        alt="Bot" 
                        className={`w-4/5 h-4/5 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] grayscale transition-transform duration-200 ${botFlip ? '-scale-x-100' : 'scale-x-100'} ${hitTarget === 'bot' ? 'brightness-200 saturate-200 animate-pulse' : ''}`} 
                    />
                    {hitTarget === 'bot' && (
                        <span className="absolute -top-6 text-red-500 font-black text-2xl animate-bounce drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-50">SMASH!</span>
                    )}
                </div>

                {/* Tela de Fim de Jogo */}
                {gameState === 'finished' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                        <Trophy size={48} className="text-yellow-400 mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold text-white mb-2">FIM DE JOGO!</h2>
                        <p className="text-gray-300 mb-4">Calculando resultados...</p>
                    </div>
                )}
            </div>

            {/* CONTROLES */}
            <div className="grid grid-cols-3 gap-2 mt-4 w-full max-w-[200px]">
                <div></div>
                <Button onClick={() => handlePlayerMove(0, -1)} className="h-14 flex items-center justify-center bg-gray-800 active:bg-purple-600 active:scale-95 transition-all"><ArrowUp size={28}/></Button>
                <div></div>
                <Button onClick={() => handlePlayerMove(-1, 0)} className="h-14 flex items-center justify-center bg-gray-800 active:bg-purple-600 active:scale-95 transition-all"><ArrowLeft size={28}/></Button>
                <Button onClick={() => handlePlayerMove(0, 1)} className="h-14 flex items-center justify-center bg-gray-800 active:bg-purple-600 active:scale-95 transition-all"><ArrowDown size={28}/></Button>
                <Button onClick={() => handlePlayerMove(1, 0)} className="h-14 flex items-center justify-center bg-gray-800 active:bg-purple-600 active:scale-95 transition-all"><ArrowRight size={28}/></Button>
            </div>
        </div>
    );
});
