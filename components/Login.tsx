
import React, { useState } from 'react';
import { backendService } from '../services/backendService';

interface LoginProps {
  onLogin: (email: string, password?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'SUCCESS'>('LOGIN');
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [regData, setRegData] = useState({
    email: '',
    password: '',
    companyName: '',
    jib: '',
    pdv: '',
    address: '',
    city: '',
    zip: '',
    phone: ''
  });

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await backendService.login(email, password);
    setLoading(false);
    if (result.user) {
      onLogin(email, password);
    } else {
      setError(result.error || 'Neuspješna prijava.');
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    const result = await backendService.register(
      { email: regData.email, password: regData.password },
      { 
        name: regData.companyName, 
        jib: regData.jib, 
        pdvNumber: regData.pdv, 
        address: regData.address, 
        city: regData.city, 
        zip: regData.zip,
        phone: regData.phone,
        email: regData.email
      }
    );
    setLoading(false);
    if (result.success) {
      setMode('SUCCESS');
    } else {
      setError(result.error || 'Greška pri registraciji.');
    }
  };

  if (mode === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
        <div className="bg-white/10 backdrop-blur-2xl p-12 rounded-[2rem] border border-white/20 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-green-500/50">✅</div>
           <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Zahtjev primljen</h2>
           <p className="text-blue-100/70 text-sm font-medium leading-relaxed mb-8 text-balance">
             Vaša registracija za Bratts ERP je uspješno poslana. Super Admin će pregledati podatke i odobriti pristup.
           </p>
           <button onClick={() => setMode('LOGIN')} className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-2xl tracking-widest text-xs">Povratak na prijavu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

      <div className="bg-white/10 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-lg relative z-10 transition-all">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/50">🏢</div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Bratts ERP <br/><span className="text-blue-500 text-sm tracking-normal">Lite 1.0</span></h2>
          <p className="text-blue-200/40 text-[9px] font-black tracking-[0.3em] uppercase mt-4">Enterprise Control</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {mode === 'LOGIN' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">E-mail adresa</label>
              <input 
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-white/20"
                placeholder="email@kompanija.ba"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Lozinka</label>
              <input 
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-white/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/40 disabled:opacity-50"
            >
              {loading ? 'Provjera...' : 'Prijavi se'}
            </button>
            <p className="text-center text-white/40 text-xs font-medium">
              Nova firma? <button onClick={() => setMode('REGISTER')} className="text-blue-400 font-bold hover:underline">Registracija</button>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 mb-6">
              {[1, 2].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-500' : 'bg-white/10'}`}></div>
              ))}
            </div>

            {step === 1 ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Email adresa</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Lozinka</label>
                  <input type="password" placeholder="Min. 8 karaktera" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})}/>
                </div>
                <button onClick={() => setStep(2)} disabled={!regData.email || !regData.password} className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-2xl text-xs tracking-widest disabled:opacity-50">Nastavi na podatke firme</button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Naziv Firme</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={regData.companyName} onChange={e => setRegData({...regData, companyName: e.target.value})}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">JIB</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={regData.jib} onChange={e => setRegData({...regData, jib: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Grad</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={regData.city} onChange={e => setRegData({...regData, city: e.target.value})}/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Adresa</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={regData.address} onChange={e => setRegData({...regData, address: e.target.value})}/>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(1)} className="flex-1 border border-white/10 text-white font-black uppercase py-4 rounded-2xl text-[10px] tracking-widest">Nazad</button>
                  <button onClick={handleRegister} disabled={loading} className="flex-[2] bg-blue-600 text-white font-black uppercase py-4 rounded-2xl text-[10px] tracking-widest shadow-lg shadow-blue-900/40">Registruj firmu</button>
                </div>
              </div>
            )}
            <button onClick={() => { setMode('LOGIN'); setStep(1); }} className="w-full text-white/40 text-[10px] font-bold hover:text-white transition uppercase tracking-widest">Već imam nalog? Prijavi se</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
