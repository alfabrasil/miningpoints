import React, { useContext, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Coins, X, AlertTriangle } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const WalletView = ({ navigate }) => {
  const { state, updateWallet, addNotification, setState, t } = useContext(AppContext);
  const [mode, setMode] = useState('main'); // main, deposit, withdraw, transfer, swap
  const [inputValue, setInputValue] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT (BEP-20)');
  const [swapDir, setSwapDir] = useState('usd_to_mph'); // usd_to_mph | mph_to_usd
  const [transferUser, setTransferUser] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('usdt_bep20');
  const [withdrawPwd, setWithdrawPwd] = useState('');

  const wallets = (state.user && state.user.wallets) || {};
  const withdrawAddress = wallets[withdrawMethod] || '';

  const withdrawLabels = {
    usdt_bep20: 'USDT (BEP-20)',
    usdt_polygon: 'USDT (Polygon)',
    usdt_trc20: 'USDT (TRC-20)',
    usdt_arbitrum: 'USDT (Arbitrum)',
    usdc_arbitrum: 'USDC (Arbitrum)',
    pix: 'PIX'
  };

  const handleAction = () => {
    const rawVal = parseFloat(inputValue);
    const val = Number.isFinite(rawVal) ? Math.abs(rawVal) : 0;
    if (!val || val <= 0) return;

    if (mode === 'deposit') {
      if (val < 20) return alert("Mínimo $20");
      updateWallet(val, 'deposit');
      addNotification(`Depósito confirmado: +$${val}`, 'deposit');
      setMode('main');
    }
    
    if (mode === 'withdraw') {
      if (val < 20) return alert("Mínimo $20");
      if (state.wallet.usd < val) return alert("Saldo insuficiente");
      if (!withdrawMethod) return alert("Selecione o método de saque");

      if (!withdrawAddress) {
        const goConfig = window.confirm("Carteira não cadastrada para este método. Deseja ir para Configurações para cadastrar?");
        if (goConfig && navigate) navigate('menu:config');
        return;
      }

      if (!state.user.financialPassword) {
        const goConfig = window.confirm("Defina sua Senha Financeira em Configurações para habilitar saques. Ir para Configurações agora?");
        if (goConfig && navigate) navigate('menu:config');
        return;
      }

      if (!withdrawPwd) return alert("Informe a senha financeira");
      if (withdrawPwd !== state.user.financialPassword) return alert("Senha financeira incorreta");

      const today = new Date().getDay();
      const tax = today === 4 ? 0 : 0.06;
      const final = val * (1 - tax);

      updateWallet(-val, 'withdraw');
      addNotification(
        `Solicitação de Saque: -$${val.toFixed(2)} via ${withdrawLabels[withdrawMethod]} (Receber: $${final.toFixed(2)})`,
        'withdraw'
      );
      setMode('main');
      setInputValue('');
      setWithdrawPwd('');
      return;
    }

    if (mode === 'transfer') {
      const username = transferUser.trim();
      if (!username) return alert("Informe o username de destino");
      if (val < 1) return alert("Valor mínimo $1");
      if (state.wallet.usd < val) return alert("Saldo insuficiente");
      const email = `${username}@miningpoints.io`;
      updateWallet(-val, 'transfer');
      addNotification(`Transferência interna: -$${val} para ${username} (${email})`, 'transfer');
      setMode('main');
      setInputValue('');
      setTransferUser('');
    }

    if (mode === 'swap') {
        if (swapDir === 'usd_to_mph') {
            if (state.wallet.usd < val) return alert("Saldo insuficiente em USD");
            const mphAmount = val * 1000;
            setState(prev => ({
                ...prev,
                wallet: {
                    ...prev.wallet,
                    usd: prev.wallet.usd - val,
                    mph: prev.wallet.mph + mphAmount
                }
            }));
            addNotification(`Swap USDT -> MPH: -$${val} / +${mphAmount} MPH`, 'swap');
        } else {
            // mph_to_usd
            const mphVal = val; // input em MPH
            if (state.wallet.mph < mphVal) return alert("Saldo insuficiente em MPH");
            const usdCredit = mphVal / 1000;
            setState(prev => ({
                ...prev,
                wallet: {
                    ...prev.wallet,
                    mph: prev.wallet.mph - mphVal,
                    usd: prev.wallet.usd + usdCredit
                }
            }));
            addNotification(`Swap MPH -> USDT: -${mphVal} MPH / +$${usdCredit.toFixed(2)}`, 'swap');
        }
        setMode('main');
    }
  };

  return (
    <div className="px-4 pb-24 animate-fadeIn">
      {/* Cards de Saldo */}
      <div className="grid grid-cols-2 gap-4 my-6">
        <div className="bg-gradient-to-br from-purple-900 to-black p-4 rounded-xl border border-purple-500">
          <p className="text-xs text-purple-200 mb-1">{t('wallet.balance_usd')}</p>
          <h2 className="text-2xl font-bold text-white">${state.wallet.usd.toFixed(2)}</h2>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black p-4 rounded-xl border border-[#ff00ff]">
          <p className="text-xs text-pink-200 mb-1">{t('wallet.balance_mph')}</p>
          <h2 className="text-2xl font-bold text-[#ff00ff]">{state.wallet.mph.toFixed(2)}</h2>
        </div>
      </div>

      {mode === 'main' && (
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setMode('deposit')} className="flex flex-col items-center py-4 gap-2">
            <ArrowDownCircle /> {t('wallet.deposit')}
          </Button>
          <Button onClick={() => setMode('withdraw')} variant="outline" className="flex flex-col items-center py-4 gap-2">
            <ArrowUpCircle /> {t('wallet.withdraw')}
          </Button>
          <Button onClick={() => setMode('transfer')} variant="secondary" className="flex flex-col items-center py-4 gap-2">
            <RefreshCw /> {t('wallet.transfer')}
          </Button>
           <Button onClick={() => setMode('swap')} variant="secondary" className="flex flex-col items-center py-4 gap-2">
            <Coins /> {t('wallet.swap')}
          </Button>
        </div>
      )}

      {mode !== 'main' && (
        <Card className="animate-slideUp">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold uppercase">{mode}</h3>
            <button onClick={() => setMode('main')} className="text-gray-400"><X size={20}/></button>
          </div>
          
          <div className="mb-4">
            {mode === 'transfer' && (
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-2">{t('wallet.transfer_username')}</label>
                <input
                  type="text"
                  value={transferUser}
                  onChange={(e) => setTransferUser(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm outline-none focus:ring-2 ring-purple-500"
                  placeholder="ex: investor_02"
                />
                {transferUser.trim() && (
                  <div className="mt-2 bg-gray-900 border border-gray-700 rounded p-2 text-[11px] text-gray-300">
                    <p>Usuário: <span className="text-white font-semibold">{transferUser.trim()}</span></p>
                    <p>{t('wallet.transfer_user_email')} <span className="text-purple-300">{`${transferUser.trim()}@miningpoints.io`}</span></p>
                  </div>
                )}
              </div>
            )}

            {mode === 'swap' ? (
              <div className="mb-3">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => { setSwapDir('usd_to_mph'); setInputValue(''); }}
                    className={`flex-1 px-3 py-2 rounded text-xs border ${swapDir === 'usd_to_mph' ? 'bg-purple-700 text-white border-purple-500' : 'bg-gray-900 text-gray-300 border-gray-700'}`}
                  >
                    {t('wallet.swap_usd_to_mph')}
                  </button>
                  <button
                    onClick={() => { setSwapDir('mph_to_usd'); setInputValue(''); }}
                    className={`flex-1 px-3 py-2 rounded text-xs border ${swapDir === 'mph_to_usd' ? 'bg-purple-700 text-white border-purple-500' : 'bg-gray-900 text-gray-300 border-gray-700'}`}
                  >
                    {t('wallet.swap_mph_to_usd')}
                  </button>
                </div>
                <label className="text-xs text-gray-500 block mb-2">
                  {swapDir === 'usd_to_mph' ? t('wallet.value_usd') : t('wallet.value_mph')}
                </label>
                <input 
                  type="number" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace('-', ''))}
                  inputMode="numeric"
                  min="0"
                  className="w-full bg-black border border-purple-500 rounded p-3 text-white text-lg outline-none focus:ring-2 ring-purple-500"
                  placeholder={swapDir === 'usd_to_mph' ? '0.00' : '0'}
                />
                <div className="text-[11px] text-gray-400 mt-2">
                  {t('wallet.swap_rate_prefix')} 
                  {(() => {
                    const v = Math.max(0, parseFloat(inputValue || '0') || 0);
                    return swapDir === 'usd_to_mph' 
                      ? ` +${(v * 1000).toFixed(0)} MPH` 
                      : ` +$${(v / 1000).toFixed(2)}`;
                  })()}
                </div>
              </div>
            ) : (
              <>
                <label className="text-xs text-gray-500 block mb-2">{t('wallet.value_usd')}</label>
                <input 
                  type="number" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace('-', ''))}
                  inputMode="decimal"
                  min="0"
                  className="w-full bg-black border border-purple-500 rounded p-3 text-white text-lg outline-none focus:ring-2 ring-purple-500"
                  placeholder="0.00"
                />
              </>
            )}
            {mode === 'deposit' && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {[20, 50, 100, 500, 1000].map(v => (
                        <button key={v} onClick={() => setInputValue(v)} className="bg-gray-800 text-xs px-3 py-1 rounded text-gray-300 hover:bg-gray-700">${v}</button>
                    ))}
                </div>
            )}
          </div>

          {mode === 'deposit' && (
            <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-2">{t('wallet.method')}</label>
                <select 
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                >
                    <option>USDT (BEP-20)</option>
                    <option>USDT (TRC-20)</option>
                    <option>USDC (Arbitrum)</option>
                    <option>PIX (Brasil)</option>
                    <option>Bitcoin (BTC)</option>
                </select>
                {selectedCrypto.includes('PIX') && (
                    <div className="mt-2 p-2 bg-white rounded text-center">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913MiningPoints6008Brasilia62070503***63041234" className="mx-auto w-32 h-32" alt="QR Code PIX"/>
                        <p className="text-xs text-black mt-1 font-mono">Copia e Cola: 000201... (Simulado)</p>
                    </div>
                )}
            </div>
          )}

          {mode === 'withdraw' && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-2">{t('wallet.withdraw_method')}</label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                >
                  <option value="usdt_bep20">USDT (BEP-20)</option>
                  <option value="usdt_polygon">USDT (Polygon)</option>
                  <option value="usdt_trc20">USDT (TRC-20)</option>
                  <option value="usdt_arbitrum">USDT (Arbitrum)</option>
                  <option value="usdc_arbitrum">USDC (Arbitrum)</option>
                  <option value="pix">Chave PIX</option>
                </select>
                <div className="mt-2 text-[11px] text-gray-400">
                  {withdrawAddress ? (
                    <span>{t('wallet.wallet_registered')} <span className="text-purple-300 break-all">{withdrawAddress}</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate && navigate('menu:config')}
                      className="text-purple-400 underline"
                    >
                      {t('wallet.register_wallet')}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">{t('wallet.financial_password')}</label>
                <input
                  type="password"
                  value={withdrawPwd}
                  onChange={(e) => setWithdrawPwd(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm outline-none focus:ring-2 ring-purple-500"
                  placeholder={t('wallet.financial_password_placeholder')}
                />
                {!state.user.financialPassword && (
                  <p className="text-[11px] text-yellow-400 mt-1">
                    {t('wallet.financial_password_hint')}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button onClick={handleAction} className="w-full">
            {{
              deposit: t('wallet.confirm_deposit'),
              withdraw: t('wallet.confirm_withdraw'),
              transfer: t('wallet.confirm_transfer'),
              swap: t('wallet.confirm_swap')
            }[mode]}
          </Button>
        </Card>
      )}
    </div>
  );
};
