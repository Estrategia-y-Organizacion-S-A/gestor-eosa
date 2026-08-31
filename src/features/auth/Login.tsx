import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { LogIn, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

export function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegister && name.trim().length === 0) {
      return setError('Por favor, introduce tu nombre.');
    }

    if (!isValidEmail(email)) {
      return setError('Por favor, introduce un correo electrónico válido.');
    }

    if (isRegister) {
      if (email !== confirmEmail) {
        return setError('Los correos electrónicos no coinciden.');
      }
      if (password !== confirmPassword) {
        return setError('Las contraseñas no coinciden.');
      }
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }
    
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
        // Sincronizar también con la colección users manualmente para que no quede null en el primer registro
        try {
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userDocRef, { displayName: name.trim() }, { merge: true });
        } catch (e) {
          console.warn("Could not sync name to firestore:", e);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Error de autenticación. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual flair */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="EOSA Logo" className="h-14" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Gestor EOSA
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Tabs Selectors */}
          <div className="flex mb-8 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200">
            <button 
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={clsx(
                "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                !isRegister ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              )}
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </button>
            <button 
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={clsx(
                "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                isRegister ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              )}
            >
              <UserPlus className="w-4 h-4" />
              Registro
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 font-medium flex items-start gap-2">
                <span className="block mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre completo</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email corporativo</label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@eosa.com"
                  className={clsx(
                    "appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors",
                    email.length > 0 && !isValidEmail(email) ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 focus:bg-white text-gray-900"
                  )}
                />
                {email.length > 0 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isValidEmail(email) ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirmar Email</label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    required
                    value={confirmEmail}
                    onChange={e => setConfirmEmail(e.target.value)}
                    placeholder="ejemplo@eosa.com"
                    className={clsx(
                      "appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors",
                      confirmEmail.length > 0 && confirmEmail !== email ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 focus:bg-white text-gray-900"
                    )}
                  />
                  {confirmEmail.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {confirmEmail === email && isValidEmail(email) ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Contraseña</label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={clsx(
                    "appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors",
                    isRegister && password.length > 0 && password.length < 6 ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 focus:bg-white text-gray-900"
                  )}
                />
                {isRegister && password.length > 0 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {password.length >= 6 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {isRegister && password.length > 0 && password.length < 6 && (
                <p className="mt-2 text-xs text-red-500">Debe tener al menos 6 caracteres.</p>
              )}
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirmar Contraseña</label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={clsx(
                      "appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors",
                      confirmPassword.length > 0 && confirmPassword !== password ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 focus:bg-white text-gray-900"
                    )}
                  />
                  {confirmPassword.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {confirmPassword === password && password.length >= 6 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isRegister && (name.trim().length === 0 || email !== confirmEmail || password !== confirmPassword || !isValidEmail(email) || password.length < 6)}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-brand-red hover:bg-[#A31C30] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isRegister ? 'Crear mi cuenta' : 'Acceder al Gestor'}
                {isRegister ? <UserPlus className="w-5 h-5 ml-2" /> : <LogIn className="w-5 h-5 ml-2" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
