import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { 
  LogIn, UserPlus, CheckCircle2, XCircle, Eye, EyeOff, 
  Building2, Car, Laptop, Sparkles, ShieldCheck, ArrowRight,
  Mail, Clock, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

function LoginForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [verificationNoticeEmail, setVerificationNoticeEmail] = useState<string | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const isValidEmail = (e: string) => /^[^\s@]+@eosa\.com$/i.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA no está listo todavía');
      return;
    }
    
    try {
      const token = await executeRecaptcha('auth_action');
      if (!token) throw new Error('reCAPTCHA failed');
    } catch {
      toast.error('Error validando reCAPTCHA');
      return;
    }

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
    
    setLoading(true);
    try {
      if (isRegister) {
        const normalizedEmail = email.trim().toLowerCase();
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
        setVerificationNoticeEmail(normalizedEmail);
        setIsVerificationModalOpen(true);
        toast.success('¡Cuenta creada! Revisa las instrucciones para verificar tu correo.', { duration: 6000 });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', userCredential.user.uid);

        // SEC-01 (Retrocompatible): Exigir verificación de email a cuentas nuevas que aún no existan en 'users'
        if (!userCredential.user.emailVerified) {
          const existingDoc = await getDoc(userDocRef);
          if (!existingDoc.exists()) {
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
            setVerificationNoticeEmail(email.trim().toLowerCase());
            setIsVerificationModalOpen(true);
            setError('Tu cuenta aún no está verificada. Te hemos reenviado el enlace de confirmación a tu correo @eosa.com.');
            return;
          }
        }

        try {
          await setDoc(userDocRef, {
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Could not update lastLogin on signIn:", e);
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('El correo o la contraseña son incorrectos.');
      } else {
        setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row items-stretch">
      
      {/* 1. Panel Izquierdo Editorial & Corporativo EOSA (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-linear-to-br from-white via-rose-50/30 to-slate-100/70 p-12 xl:p-16 flex-col justify-between border-r border-gray-200/90 relative overflow-hidden">
        
        {/* Marca de agua geométrica institucional basada en el isotipo de EOSA */}
        <svg
          className="absolute right-0 bottom-0 w-125 h-125 text-brand-red/[0.035] pointer-events-none translate-x-1/4 translate-y-1/4"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="20" width="80" height="80" rx="14" stroke="currentColor" strokeWidth="6" />
          <rect x="60" y="60" width="80" height="80" rx="14" stroke="currentColor" strokeWidth="6" />
          <rect x="100" y="100" width="80" height="80" rx="14" stroke="currentColor" strokeWidth="6" />
        </svg>

        {/* Resplandor cálido de marca */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Header de Marca */}
        <div className="relative z-10">
          <img src="/logo.png" alt="EOSA Estrategia y Organización" className="h-12 w-auto mb-6" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/70 text-[10px] font-bold uppercase tracking-wider text-brand-red mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-red" />
            <span>Estrategia y Organización S.A.</span>
          </div>
          <h1 className="text-2xl xl:text-3xl font-black text-gray-900 tracking-tight leading-snug">
            Plataforma para el equipo de profesionales de EOSA.
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-md">
            Coordina tu jornada presencial, organiza trayectos y gestiona los gadgets de la empresa con agilidad.
          </p>
        </div>

        {/* Bloques de Características de la Plataforma */}
        <div className="relative z-10 space-y-3.5 my-8">
          
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 border border-gray-200/80 shadow-2xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/70">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Puestos y Asistencia</h3>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                Reserva de puestos, mapa visual de oficina y control transparente de ausencias y teletrabajo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 border border-rose-200/60 shadow-2xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-brand-red flex items-center justify-center shrink-0 border border-rose-200/80">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Movilidad Compartida</h3>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                Carpooling entre compañeros para visitas a clientes, desplazamientos de trabajo o viajes diarios.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 border border-gray-200/80 shadow-2xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/70">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Equipos & Gadgets</h3>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                Préstamo ordenado de material informático, monitores y periféricos de trabajo.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Institucional del Panel */}
        <div className="relative z-10 pt-6 border-t border-gray-200/70 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-red" />
            <span className="text-[11px] font-semibold text-gray-600">Acceso exclusivo @eosa.com</span>
          </div>
          <span className="text-[10px] text-gray-400">EOSA · 30 Años</span>
        </div>

      </div>

      {/* 2. Panel Derecho: Formulario de Autenticación */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
        
        {/* Cabecera en Móvil (Logo) */}
        <div className="lg:hidden text-center mb-8">
          <img src="/logo.png" alt="EOSA Logo" className="h-11 w-auto mx-auto mb-2" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Portal EOSA
          </span>
        </div>

        <div className="w-full max-w-md">
          
          {/* Tarjeta de Autenticación */}
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-sm border border-gray-200/90 relative">
            
            {/* Cabecera del formulario */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {isRegister ? 'Registro de nuevo profesional' : 'Acceso al Portal'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {isRegister 
                  ? 'Introduce tus datos corporativos para crear tu cuenta en EOSA.'
                  : 'Identifícate con tu cuenta oficial @eosa.com para acceder.'}
              </p>
            </div>

            {/* Pestañas de Alternancia (Iniciar Sesión / Registro) */}
            <div className="flex mb-6 bg-gray-100 p-1 rounded-2xl border border-gray-200/80">
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className={clsx(
                  "flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  !isRegister 
                    ? "bg-white text-gray-900 shadow-xs" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <LogIn className="w-3.5 h-3.5 text-brand-red" />
                <span>Iniciar sesión</span>
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className={clsx(
                  "flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  isRegister 
                    ? "bg-white text-gray-900 shadow-xs" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <UserPlus className="w-3.5 h-3.5 text-brand-red" />
                <span>Registro</span>
              </button>
            </div>

            {/* Formulario */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Aviso persistente de verificación de correo tras registro */}
              {verificationNoticeEmail && !isRegister && (
                <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-2xl text-xs space-y-2 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-amber-950">
                      <p className="font-bold">
                        Confirma tu correo electrónico antes de entrar
                      </p>
                      <p className="text-[11px] text-amber-900/90 leading-relaxed">
                        Hemos enviado un enlace de verificación a <strong className="font-bold">{verificationNoticeEmail}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="pl-6.5 space-y-1 text-[11px] text-amber-800 border-t border-amber-200/70 pt-2">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span><strong>No es instantáneo:</strong> puede tardar unos minutos en llegar.</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Revisa también tu carpeta de <strong>Spam o Correo no deseado</strong>.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta de Error */}
              {error && (
                <div className="bg-rose-50 text-brand-red p-3.5 rounded-xl text-xs border border-rose-200 font-bold flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Nombre (Solo en Registro) */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Nombre y apellidos
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 focus:bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              )}

              {/* Email Corporativo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email corporativo
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu.nombre@eosa.com"
                    className={clsx(
                      "w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none transition-all placeholder:text-gray-400",
                      email.length > 0 && !isValidEmail(email)
                        ? "border-rose-300 bg-rose-50/50" 
                        : "border-gray-300 bg-gray-50/50 focus:bg-white text-gray-900"
                    )}
                  />
                  {email.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {isValidEmail(email) ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4.5 w-4.5 text-rose-500" />
                      )}
                    </div>
                  )}
                </div>
                {isRegister && (
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    Por seguridad, solo se admiten direcciones con dominio <span className="font-bold text-brand-red">@eosa.com</span>.
                  </p>
                )}
              </div>

              {/* Confirmar Email (Solo en Registro) */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Confirmar email corporativo
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={confirmEmail}
                      onChange={e => setConfirmEmail(e.target.value)}
                      placeholder="tu.nombre@eosa.com"
                      className={clsx(
                        "w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none transition-all placeholder:text-gray-400",
                        confirmEmail.length > 0 && confirmEmail !== email
                          ? "border-rose-300 bg-rose-50/50" 
                          : "border-gray-300 bg-gray-50/50 focus:bg-white text-gray-900"
                      )}
                    />
                    {confirmEmail.length > 0 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {confirmEmail === email && isValidEmail(email) ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4.5 w-4.5 text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contraseña */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Contraseña
                  </label>
                  {!isRegister && (
                    <button 
                      type="button" 
                      onClick={handleResetPasswordClick}
                      className="text-xs font-bold text-brand-red hover:underline cursor-pointer"
                    >
                      ¿Has olvidado tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={clsx(
                      "w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none transition-all pr-12",
                      isRegister && password.length > 0 && password.length < 6 
                        ? "border-rose-300 bg-rose-50/50" 
                        : "border-gray-300 bg-gray-50/50 focus:bg-white text-gray-900"
                    )}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                    {isRegister && password.length > 0 && (
                      <div className="pointer-events-none">
                        {password.length >= 6 ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4.5 w-4.5 text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isRegister && password.length > 0 && password.length < 6 && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold">Debe tener al menos 6 caracteres.</p>
                )}
              </div>

              {/* Confirmar Contraseña (Solo en Registro) */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={clsx(
                        "w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none transition-all pr-12",
                        confirmPassword.length > 0 && confirmPassword !== password 
                          ? "border-rose-300 bg-rose-50/50" 
                          : "border-gray-300 bg-gray-50/50 focus:bg-white text-gray-900"
                      )}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                      {confirmPassword.length > 0 && (
                        <div className="pointer-events-none">
                          {confirmPassword === password && password.length >= 6 ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4.5 w-4.5 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de Envío */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading || (isRegister && (name.trim().length === 0 || email !== confirmEmail || password !== confirmPassword || !isValidEmail(email) || password.length < 6))}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-[#a31b31] transition-all shadow-xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-red/40 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{loading ? 'Procesando...' : (isRegister ? 'Crear mi cuenta' : 'Acceder al Gestor')}</span>
                  {isRegister ? <UserPlus className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                </button>
              </div>

            </form>
          </div>

          {/* Pie de Página */}
          <div className="mt-6 text-center text-xs text-gray-400 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-gray-500">
              <Link to="/aviso-legal" className="hover:text-brand-red transition-colors">Aviso Legal</Link>
              <span>·</span>
              <Link to="/privacidad" className="hover:text-brand-red transition-colors">Privacidad</Link>
              <span>·</span>
              <Link to="/cookies" className="hover:text-brand-red transition-colors">Cookies</Link>
            </div>
            <p>© {new Date().getFullYear()} EOSA (Estrategia y Organización, S.A.) · Portal de uso interno</p>
          </div>

        </div>
      </div>

      {/* Modal de Aviso de Verificación de Correo tras el Registro */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-rose-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-red text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red block">Verificación Obligatoria</span>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">Confirma tu correo electrónico</h2>
                </div>
              </div>
              <button 
                onClick={() => setIsVerificationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Hemos enviado un correo con el enlace de activación a tu dirección corporativa:
                <strong className="text-gray-900 font-bold block mt-1 text-sm bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 font-mono">
                  {verificationNoticeEmail || email}
                </strong>
              </p>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Para completar el registro y poder acceder al <strong className="text-gray-900">Gestor EOSA</strong>, debes abrir ese correo y pulsar en el enlace de confirmación.
              </p>

              <div className="bg-amber-50 border border-amber-200/90 p-4 rounded-2xl space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 text-amber-950">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="font-bold">Ten paciencia, no es instantáneo:</strong> el correo puede tardar <strong>unos minutos</strong> en llegar a tu buzón.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 text-amber-950 border-t border-amber-200/70 pt-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="font-bold">Revisa Spam o Correo no deseado:</strong> si no lo encuentras en tu bandeja de entrada principal, comprueba la carpeta de <strong>Spam / Correo no deseado</strong>, ya que puede llegar ahí.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="w-full py-3 px-4 bg-brand-red text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#a31b31] transition-colors cursor-pointer shadow-xs"
                >
                  Entendido, ir a iniciar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recuperación de Contraseña */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red block mb-0.5">Seguridad EOSA</span>
                <h2 className="text-lg font-bold text-gray-900">Recuperar contraseña</h2>
              </div>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-xs sm:text-sm leading-relaxed">
                Se enviará un enlace seguro de recuperación a la dirección corporativa: <br/>
                <strong className="text-gray-900 font-bold block mt-1">{email}</strong>
              </p>
              <div className="bg-rose-50/60 border border-rose-200/80 p-3 rounded-xl text-[11px] text-brand-red leading-relaxed mb-6">
                Ten en cuenta que el correo de verificación puede tardar un par de minutos. Revisa también la carpeta de correo no deseado.
              </div>
              <div className="flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={confirmResetPassword}
                  className="flex-1 px-4 py-2.5 bg-brand-red text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#a31b31] transition-colors cursor-pointer shadow-xs"
                >
                  Enviar enlace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export function Login() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6Ldeb8wtAAAAAHabAuB8njWHe9gSljJg3OhKPZMl">
      <LoginForm />
    </GoogleReCaptchaProvider>
  );
}
