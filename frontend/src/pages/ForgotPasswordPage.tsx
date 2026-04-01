import React, { useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Mail, Lock, Eye, EyeOff, Check, X, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import * as authApi from '@/services/auth';

const PASSWORD_RULES = [
  { key: 'length', label: 'Al menos 8 caracteres',  test: (p: string) => p.length >= 8 },
  { key: 'upper',  label: 'Al menos 1 mayúscula',   test: (p: string) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Al menos 1 número',      test: (p: string) => /[0-9]/.test(p) },
  { key: 'symbol', label: 'Al menos 1 símbolo',     test: (p: string) => /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]/.test(p) },
];

const CODE_LENGTH = 6;

type Step = 'email' | 'code' | 'password' | 'done';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [code, setCode]               = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [resetToken, setResetToken]   = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [pwdFocused, setPwdFocused]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map(r => ({ ...r, passed: r.test(password) })),
    [password],
  );
  const allRulesPassed  = passwordChecks.every(r => r.passed);
  const passwordsMatch  = password.length > 0 && password === confirmPwd;
  const codeValue       = code.join('');

  /* ── Step 1: solicitar código ─────────────────────────────── */
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    try {
      await authApi.requestPasswordReset({ email: trimmed });
      setStep('code');
    } catch (err: any) {
      const msg = err?.detail || err?.message || 'No se pudo enviar el código.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 2: verificar código ─────────────────────────────── */
  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (codeValue.length !== CODE_LENGTH || !/^\d+$/.test(codeValue)) {
      setError('El código debe ser de 6 dígitos numéricos.');
      return;
    }
    setLoading(true);
    try {
      const { token } = await authApi.verifyResetCode({ email: email.trim(), code: codeValue });
      setResetToken(token);
      setStep('password');
    } catch {
      setError('Código incorrecto o expirado. Revisa tu correo e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 3: nueva contraseña ─────────────────────────────── */
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!allRulesPassed || !passwordsMatch) return;
    setLoading(true);
    try {
      await authApi.resetPassword({ token: resetToken, password });
      setStep('done');
    } catch {
      setError('No se pudo cambiar la contraseña. El código puede haber expirado.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Entrada del código OTP digit-a-digit ─────────────────── */
  function handleCodeInput(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < CODE_LENGTH - 1) {
      codeRefs.current[idx + 1]?.focus();
    }
  }

  function handleCodeKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = [...code];
    pasted.split('').forEach((d, i) => { if (i < CODE_LENGTH) next[i] = d; });
    setCode(next);
    codeRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleResend() {
    setError('');
    setLoading(true);
    try { await authApi.requestPasswordReset({ email: email.trim() }); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  /* ── Contenido por paso ───────────────────────────────────── */
  const stepContent = {

    email: (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10"
              required
              autoFocus
            />
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar código de verificación'}
        </Button>
      </form>
    ),

    code: (
      <form onSubmit={handleCodeSubmit} className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enviamos un código de 6 dígitos a{' '}
            <span className="font-medium text-foreground">{email}</span>.
            Revisa tu bandeja de entrada (y spam).
          </p>
          <div className="flex justify-center gap-2 pt-1" onPaste={handleCodePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { codeRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleCodeInput(idx, e.target.value)}
                onKeyDown={e => handleCodeKeyDown(idx, e)}
                className={`
                  w-11 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  transition-colors
                  ${digit ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}
                `}
              />
            ))}
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || codeValue.length !== CODE_LENGTH}
        >
          {loading ? 'Verificando...' : 'Verificar código'}
        </Button>
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            ¿No recibiste el código? Reenviar
          </button>
        </div>
      </form>
    ),

    password: (
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Ingresa tu nueva contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPwdFocused(true)}
              onBlur={() => setPwdFocused(false)}
              className="pl-10 pr-10"
              required
              autoFocus
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwdFocused && password.length > 0 && (
            <ul className="space-y-1 mt-2">
              {passwordChecks.map(r => (
                <li key={r.key} className="flex items-center gap-2 text-xs">
                  {r.passed
                    ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    : <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                  <span className={r.passed ? 'text-emerald-600' : 'text-muted-foreground'}>{r.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPwd">Confirmar contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPwd"
              type={showPwd ? 'text' : 'password'}
              placeholder="Repite tu nueva contraseña"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              className={`pl-10 pr-10 ${confirmPwd && !passwordsMatch ? 'border-destructive' : ''}`}
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPwd.length > 0 && (
            <p className={`text-xs flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600' : 'text-destructive'}`}>
              {passwordsMatch
                ? <><Check className="h-3.5 w-3.5" /> Las contraseñas coinciden</>
                : <><X className="h-3.5 w-3.5" /> Las contraseñas no coinciden</>}
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !allRulesPassed || !passwordsMatch}
        >
          {loading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
        </Button>
      </form>
    ),

    done: (
      <div className="text-center space-y-4 py-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">¡Contraseña actualizada!</p>
          <p className="text-sm text-muted-foreground">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <Button className="w-full" onClick={() => navigate('/auth')}>
          Ir al inicio de sesión
        </Button>
      </div>
    ),
  };

  const stepMeta: Record<Step, { title: string; icon: React.ReactNode }> = {
    email:    { title: '¿Olvidaste tu contraseña?',   icon: <KeyRound className="w-8 h-8 text-white" /> },
    code:     { title: 'Revisa tu correo',             icon: <Mail className="w-8 h-8 text-white" /> },
    password: { title: 'Nueva contraseña',             icon: <Lock className="w-8 h-8 text-white" /> },
    done:     { title: 'Todo listo',                   icon: <ShieldCheck className="w-8 h-8 text-white" /> },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-6">
      <div className="container max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            {stepMeta[step].icon}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {stepMeta[step].title}
          </h1>
          {step === 'email' && (
            <p className="text-muted-foreground">
              Te enviaremos un código de verificación a tu correo.
            </p>
          )}
          {step === 'code' && (
            <p className="text-muted-foreground">
              Ingresa el código de 6 dígitos que te enviamos.
            </p>
          )}
          {step === 'password' && (
            <p className="text-muted-foreground">
              Elige una contraseña segura para tu cuenta.
            </p>
          )}
        </div>

        {/* Progress dots */}
        {step !== 'done' && (
          <div className="flex justify-center gap-2 mb-6">
            {(['email', 'code', 'password'] as const).map((s, i) => {
              const steps: Step[] = ['email', 'code', 'password'];
              const current = steps.indexOf(step);
              return (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= current ? 'bg-primary w-8' : 'bg-border w-4'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Card */}
        <Card className="border-border/50 shadow-elevated">
          <CardContent className="pt-6">
            {stepContent[step]}
          </CardContent>
        </Card>

        {/* Back link */}
        {step !== 'done' && (
          <div className="mt-6 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
