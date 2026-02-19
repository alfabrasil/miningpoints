import React, { useContext, useState, useEffect } from 'react';
import { 
    Users, MessageSquare, Settings, Globe, LogOut, ChevronRight, Copy, Check, 
    Bot, Headphones, User, Clock, ExternalLink, Mail, Camera, Edit3, Key, 
    Wallet, AlertTriangle, Save 
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { AVAILABLE_LANGUAGES } from '../locales';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const MenuView = ({ navigate, initialTab = 'menu' }) => {
    const { state, setState, addNotification, changeLanguage, t } = useContext(AppContext);
    const [subTab, setSubTab] = useState(initialTab);
    const [newUsername, setNewUsername] = useState('');
    const [usernameToken, setUsernameToken] = useState('');
    const [financialPwd, setFinancialPwd] = useState('');
    const [wallets, setWallets] = useState(state.user.wallets);
    const [walletToken, setWalletToken] = useState('');
    const [supportMode, setSupportMode] = useState('main');

    useEffect(() => { setSubTab(initialTab); }, [initialTab]);

    const updateUserField = (field, value) => {
        setState(prev => ({ ...prev, user: { ...prev.user, [field]: value } }));
    };

    const handleSaveWallets = () => {
        if (!walletToken) { alert('Por segurança, insira o token enviado ao seu e-mail.'); return; }
        updateUserField('wallets', wallets);
        addNotification('Carteiras atualizadas com sucesso!', 'success');
        setWalletToken('');
    };

    const handleSaveUsername = () => {
        if (!usernameToken || !newUsername) { alert('Preencha o novo username e o token.'); return; }
        updateUserField('username', newUsername);
        addNotification('Username alterado com sucesso!', 'success');
        setNewUsername(''); setUsernameToken('');
    };

    const handleSaveFinancialPwd = () => {
        if (!financialPwd) return;
        updateUserField('financialPassword', financialPwd);
        addNotification('Senha financeira definida!', 'success');
        setFinancialPwd('');
    };

    if (subTab === 'team') {
        return (
            <div className="px-4 pb-24 animate-fadeIn">
                <Button onClick={() => setSubTab('menu')} variant="secondary" className="mb-4 text-xs py-2">{t('menu.back')}</Button>
                <h2 className="text-xl font-bold text-white mb-4">{t('menu.team')}</h2>
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-gray-800 p-2 rounded text-center"><span className="block text-xl font-bold text-white">124</span><span className="text-[10px] text-gray-400">Total</span></div>
                    <div className="bg-gray-800 p-2 rounded text-center border-b-2 border-green-500"><span className="block text-xl font-bold text-white">45</span><span className="text-[10px] text-gray-400">Ativos</span></div>
                    <div className="bg-gray-800 p-2 rounded text-center"><span className="block text-xl font-bold text-white">79</span><span className="text-[10px] text-gray-400">Inativos</span></div>
                </div>
                <div className="bg-gray-900 p-3 rounded mb-4 flex justify-between items-center"><span className="text-xs text-gray-400 truncate">https://miningpoints.com/ref/{state.user.username}</span><button className="text-purple-400"><Copy size={16}/></button></div>
                <div className="space-y-2"><h3 className="text-sm text-gray-400">Níveis de Rede</h3>{[1,2,3,4,5,6,7].map(lvl => (<div key={lvl} className="flex justify-between text-xs border-b border-gray-800 py-2"><span className="text-white">Nível {lvl}</span><span className="text-green-400">{lvl === 1 ? '10%' : lvl === 2 ? '3%' : '1%'}</span></div>))}</div>
            </div>
        );
    }

    if (subTab === 'language') {
        return (
            <div className="px-4 pb-24 animate-fadeIn">
                <Button onClick={() => setSubTab('menu')} variant="secondary" className="mb-4 text-xs py-2 flex items-center gap-2"><ChevronRight className="rotate-180" size={16}/> {t('menu.back')}</Button>
                <h2 className="text-xl font-bold text-white mb-6">{t('menu.language')}</h2>
                <div className="space-y-2">{AVAILABLE_LANGUAGES.map((lang) => (<button key={lang.code} onClick={() => changeLanguage(lang.code)} className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${state.user.language === lang.code ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}><span className="flex items-center gap-3"><span className="text-2xl">{lang.flag}</span><span className="font-bold text-sm">{lang.name}</span></span>{state.user.language === lang.code && <Check size={18} className="text-purple-400" />}</button>))}</div>
            </div>
        );
    }

    if (subTab === 'support') {
        return (
            <div className="px-4 pb-24 animate-fadeIn">
                <Button onClick={() => { if(supportMode === 'main') setSubTab('menu'); else setSupportMode('main'); }} variant="secondary" className="mb-4 text-xs py-2 flex items-center gap-2"><ChevronRight className="rotate-180" size={16}/> {supportMode === 'main' ? t('menu.title') : t('menu.helpCenterTitle')}</Button>
                {supportMode === 'main' && (<div className="space-y-6"><h2 className="text-xl font-bold text-white mb-4">{t('menu.helpCenterTitle')}</h2><button onClick={() => setSupportMode('ai')} className="w-full bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-xl border border-blue-500 flex flex-col items-center gap-3 active:scale-95 transition"><Bot size={48} className="text-blue-300"/><div className="text-center"><h3 className="text-white font-bold text-lg">{t('menu.supportAI')}</h3><p className="text-blue-200 text-xs mt-1">{t('menu.automaticSupportDesc')}</p></div></button><button onClick={() => setSupportMode('chat')} className="w-full bg-gradient-to-r from-purple-900 to-purple-800 p-6 rounded-xl border border-purple-500 flex flex-col items-center gap-3 active:scale-95 transition"><Headphones size={48} className="text-purple-300"/><div className="text-center"><h3 className="text-white font-bold text-lg">{t('menu.talkToAgentTitle')}</h3><p className="text-purple-200 text-xs mt-1">{t('menu.talkToAgentDesc')}</p></div></button></div>)}
                {supportMode === 'ai' && (<div className="space-y-4"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Bot size={20}/> {t('menu.faqTitle')}</h2>{[{ q: t('menu.howToDepositQ'), a: t('menu.howToDepositA') },{ q: t('menu.howWithdrawalsWorkQ'), a: t('menu.howWithdrawalsWorkA') },{ q: t('menu.standardPlanReturnQ'), a: t('menu.standardPlanReturnA') },{ q: t('menu.premiumPlanDetailsQ'), a: t('menu.premiumPlanDetailsA') },].map((item, idx) => (<details key={idx} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 group"><summary className="p-4 cursor-pointer font-bold text-sm text-gray-200 flex justify-between items-center group-open:text-purple-400">{item.q}<ChevronRight size={16} className="group-open:rotate-90 transition"/></summary><div className="p-4 pt-0 text-xs text-gray-400 leading-relaxed border-t border-gray-800 mt-2">{item.a}</div></details>))}</div>)}
                {supportMode === 'chat' && (<div className="flex flex-col h-[60vh] bg-gray-900 rounded-xl border border-gray-800 overflow-hidden relative"><div className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700"><div className="flex items-center gap-2"><div className="relative"><div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center"><User size={16}/></div><span className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-gray-800"></span></div><div><h4 className="text-xs font-bold text-white">{t('menu.onlineSupportTitle')}</h4><span className="text-[10px] text-red-400 flex items-center gap-1"><Clock size={10}/> {t('menu.busyQueue')}</span></div></div></div><div className="flex-1 p-4 overflow-y-auto space-y-4"><div className="flex justify-start"><div className="bg-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg p-3 max-w-[85%]"><p className="text-xs text-gray-300">{t('menu.welcomeSupport')}</p><span className="text-[10px] text-gray-500 block mt-1 text-right">10:00</span></div></div><div className="flex justify-start"><div className="bg-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg p-3 max-w-[85%] border border-blue-900/50"><p className="text-xs text-gray-300 mb-2">{t('menu.fasterSupport')}</p><a href="#" className="flex items-center gap-2 text-blue-400 text-xs font-bold bg-blue-900/20 p-2 rounded hover:bg-blue-900/40 transition"><ExternalLink size={14}/> {t('menu.officialTelegramGroup')}</a><span className="text-[10px] text-gray-500 block mt-1 text-right">10:00</span></div></div><div className="flex justify-start"><div className="bg-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg p-3 max-w-[85%]"><p className="text-xs text-gray-300">{t('menu.allAgentsBusy').replace('{{queue}}','12')}</p><span className="text-[10px] text-gray-500 block mt-1 text-right">10:01</span></div></div></div><div className="bg-gray-800 p-3 border-t border-gray-700"><input type="text" placeholder={t('menu.typeMessagePlaceholder')} disabled className="w-full bg-black border border-gray-600 rounded-full px-4 py-2 text-xs text-white opacity-50 cursor-not-allowed"/></div></div>)}
            </div>
        );
    }

    if (subTab === 'config') {
        return (
            <div className="px-4 pb-24 animate-fadeIn">
                 <Button onClick={() => setSubTab('menu')} variant="secondary" className="mb-4 text-xs py-2 flex items-center gap-2"><ChevronRight className="rotate-180" size={16}/> Voltar</Button>
                 <h2 className="text-xl font-bold text-white mb-6">Configurações</h2>
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800"><div className="relative group cursor-pointer" onClick={() => alert('Abrir galeria de avatares...')}><div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden border-2 border-purple-500"><User size={40} className="text-gray-400 m-auto mt-2"/></div><div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Camera size={20} className="text-white"/></div></div><div><h3 className="text-white font-bold text-lg">{state.user.username}</h3><p className="text-gray-400 text-xs flex items-center gap-1"><Mail size={12}/> {state.user.email}</p></div></div>
                    <Card><h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Edit3 size={16} className="text-purple-400"/> Alterar Username</h4><div className="space-y-2"><input type="text" placeholder="Novo Username" className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-white" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}/><div className="flex gap-2"><input type="text" placeholder="Token (Enviado ao e-mail)" className="flex-1 bg-black border border-gray-700 rounded p-2 text-xs text-white" value={usernameToken} onChange={(e) => setUsernameToken(e.target.value)}/><button onClick={() => addNotification('Token enviado para ' + state.user.email, 'success')} className="bg-gray-800 text-xs px-3 rounded text-gray-300 whitespace-nowrap">Pedir Token</button></div><Button onClick={handleSaveUsername} className="w-full text-xs py-2 mt-2">Atualizar Username</Button></div></Card>
                    <Card><h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Key size={16} className="text-yellow-400"/> Senha Financeira</h4><input type="password" placeholder="Nova Senha de Transação" className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-white mb-2" value={financialPwd} onChange={(e) => setFinancialPwd(e.target.value)}/><Button onClick={handleSaveFinancialPwd} className="w-full text-xs py-2">Definir Senha</Button></Card>
                    <Card className="border-green-900"><h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Wallet size={16} className="text-green-400"/> Carteiras de Saque</h4><div className="space-y-3">{[{ k: 'usdt_bep20', l: 'USDT (BEP-20)' },{ k: 'usdt_polygon', l: 'USDT (Polygon)' },{ k: 'usdt_trc20', l: 'USDT (TRC-20)' },{ k: 'usdt_arbitrum', l: 'USDT (Arbitrum)' },{ k: 'usdc_arbitrum', l: 'USDC (Arbitrum)' },{ k: 'pix', l: 'Chave PIX' }].map((w) => (<div key={w.k}><label className="text-[10px] text-gray-500 uppercase">{w.l}</label><input type="text" placeholder={`Endereço ${w.l}`} className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-white focus:border-green-500 transition-colors" value={wallets[w.k]} onChange={(e) => setWallets({...wallets, [w.k]: e.target.value})}/></div>))}<div className="bg-yellow-900/20 p-3 rounded border border-yellow-900/50 mt-4"><div className="flex items-start gap-2 mb-2"><AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5"/><p className="text-[10px] text-yellow-200 leading-tight">Para salvar alterações nas carteiras, é necessário um token de segurança enviado pelo suporte.</p></div><div className="flex gap-2"><input type="text" placeholder="Token de Segurança" className="flex-1 bg-black border border-yellow-700 rounded p-2 text-xs text-white" value={walletToken} onChange={(e) => setWalletToken(e.target.value)}/><button onClick={() => addNotification('Token de segurança enviado!', 'success')} className="bg-yellow-700 text-black font-bold text-xs px-3 rounded hover:bg-yellow-600 whitespace-nowrap">Solicitar</button></div></div><Button onClick={handleSaveWallets} variant="success" className="w-full text-xs py-3 flex items-center justify-center gap-2"><Save size={16}/> SALVAR CARTEIRAS</Button></div></Card>
                 </div>
            </div>
        )
    }

    return (
        <div className="px-4 pb-24 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-6 mt-4">{t('menu.title')}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={() => setSubTab('team')} className="bg-gray-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-700 transition"><Users className="text-purple-400" size={32} /><span className="text-white font-bold text-sm">{t('menu.team')}</span></button>
                <button onClick={() => setSubTab('support')} className="bg-gray-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-700 transition"><MessageSquare className="text-blue-400" size={32} /><span className="text-white font-bold text-sm">{t('menu.supportAI')}</span></button>
                <button onClick={() => setSubTab('config')} className="bg-gray-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-700 transition"><Settings className="text-gray-400" size={32} /><span className="text-white font-bold text-sm">{t('menu.settings')}</span></button>
                <button onClick={() => setSubTab('language')} className="bg-gray-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-700 transition"><Globe className="text-green-400" size={32} /><span className="text-white font-bold text-sm">{t('menu.language')}</span></button>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-white text-sm mb-3">{t('menu.langPrefs')}</h3>
                <div className="flex gap-2">
                    {[
                        { label: 'US', code: 'en' },
                        { label: 'BR', code: 'pt-BR' },
                        { label: 'ES', code: 'es' }
                    ].map(lang => {
                        const isActive = state.user.language === lang.code;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`flex-1 py-2 rounded text-xs transition-all border 
                                    ${isActive 
                                        ? 'bg-green-900/40 border-green-400 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.9)]' 
                                        : 'bg-black border-gray-700 text-gray-400 hover:border-purple-500 hover:text-white'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <Button onClick={() => { if(window.confirm('Deseja realmente sair?')) { localStorage.removeItem('mining_points_mvp_v1'); window.location.reload(); }}} variant="secondary" className="w-full mt-6 flex items-center justify-center gap-2 text-red-400 border-red-900 hover:bg-red-900/20"><LogOut size={16}/> {t('menu.logout')}</Button>
        </div>
    );
};
