import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { LogIn, UserPlus, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@eosa\.com$/i.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) {
      return setError('El correo debe terminar en @eosa.com.');
    }

    if (isRegister && name.trim().length === 0) {
      return setError('Por favor, introduce tu nombre.');
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
        setError('El correo o la contraseña son incorrectos.');
      } else {
        setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleResetPasswordClick = () => {
    if (!email) {
      return setError('Por favor, introduce tu correo electrónico primero para recuperar la contraseña.');
    }
    if (!isValidEmail(email)) {
      return setError('El correo debe terminar en @eosa.com.');
    }
    setError('');
    setIsResetModalOpen(true);
  };

  const confirmResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setIsResetModalOpen(false);
      toast.success('Se ha enviado un enlace de recuperación a tu correo.');
    } catch (err: any) {
      setIsResetModalOpen(false);
      if (err.code === 'auth/user-not-found') {
        setError('No existe ninguna cuenta con este correo.');
      } else {
        setError('Error al enviar el correo de recuperación. Inténtalo de nuevo más tarde.');
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
              {isRegister && (
                <p className="mt-2 text-xs text-gray-500">
                  Por seguridad, solo se permiten cuentas de correo que terminen en <span className="font-bold text-brand-red">@eosa.com</span>.
                </p>
              )}
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700">Contraseña</label>
                  {!isRegister && (
                    <button 
                      type="button" 
                      onClick={handleResetPasswordClick}
                      className="text-sm font-medium text-brand-red hover:text-[#A31C30] hover:bg-red-50 hover:underline px-2 py-1 rounded-md transition-all -mr-2"
                    >
                      ¿Has olvidado tu contraseña?
                    </button>
                  )}
                </div>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={clsx(
                    "appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors pr-20",
                    isRegister && password.length > 0 && password.length < 6 ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 focus:bg-white text-gray-900"
                  )}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {isRegister && password.length > 0 && (
                    <div className="pointer-events-none">
                      {password.length >= 6 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
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
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={clsx(
                      "appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors pr-20",
                      confirmPassword.length > 0 && confirmPassword !== password ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 focus:bg-white text-gray-900"
                    )}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    {confirmPassword.length > 0 && (
                      <div className="pointer-events-none">
                        {confirmPassword === password && password.length >= 6 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
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

      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Recuperar contraseña</h2>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Se enviará un correo con un enlace de recuperación a <strong>{email}</strong>. 
                <br/><br/>
                Ten en cuenta que el correo <strong>puede tardar varios minutos en llegar</strong>. Revisa también tu carpeta de correo no deseado.
              </p>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={confirmResetPassword}
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-[#A31C30] transition-colors"
                >
                  Enviar correo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
