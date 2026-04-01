import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Mail, Lock, User, AlertCircle, Building2, IdCard, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

const DEV_BYPASS_PASSWORDS = import.meta.env.DEV ? new Set(['qwerty']) : new Set<string>();

const PASSWORD_RULES = [
  { key: 'length', label: 'Al menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'Al menos 1 mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'upper', label: 'Al menos 1 BorjaComment', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Al menos 1 número', test: (p: string) => /[0-9]/.test(p) },
  { key: 'symbol', label: 'Al menos 1 símbolo', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]/.test(p) },
];

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

const signupSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128)
    .refine((p) => DEV_BYPASS_PASSWORDS.has(p) || p.length >= 8, 'Mínimo 8 caracteres')
    .refine((p) => DEV_BYPASS_PASSWORDS.has(p) || /[A-Z]/.test(p), 'Debe contener al menos 1 mayúscula')
    .refine((p) => DEV_BYPASS_PASSWORDS.has(p) || /[0-9]/.test(p), 'Debe contener al menos 1 número')
    .refine((p) => DEV_BYPASS_PASSWORDS.has(p) || /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]/.test(p), 'Debe contener al menos 1 símbolo'),
  confirmPassword: z.string(),
  username: z.string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  org_name: z.string().trim().min(2, 'Organization name is required').max(100),
  org_rut: z.string()
    .trim()
    .min(3, 'RUT is required')
    .max(20)
    .regex(/^[0-9kK.\-A-Za-z]+$/, 'Invalid RUT format'),
}).refine((data) => DEV_BYPASS_PASSWORDS.has(data.password) || data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const AuthPage = () => {
  const { t } = useLanguage();
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgRut, setOrgRut] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );
  const isDevBypass = DEV_BYPASS_PASSWORDS.has(password);
  const allPasswordRulesPassed = isDevBypass || passwordChecks.every((r) => r.passed);
  const passwordsMatch = password.length > 0 && (isDevBypass || password === confirmPassword);

  useEffect(() => {
    if (user) {
      const to = location?.state?.from?.pathname || '/';
      navigate(to, { replace: true });
    }
  }, [user, navigate, location?.state?.from?.pathname]);

  function clearFieldError(field: string) {
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const parsed = loginSchema.safeParse({ email: email.trim(), password });
        if (!parsed.success) {
          const errs: Record<string, string> = {};
          parsed.error.errors.forEach(er => (errs[er.path[0] as string] = er.message));
          setValidationErrors(errs);
          return;
        }
        const { error } = await signIn(parsed.data.email, parsed.data.password);
        if (error) setError(error.message ?? String(error));
      } else {
        const parsed = signupSchema.safeParse({
          email: email.trim(),
          password,
          confirmPassword,
          username: username.trim(),
          org_name: orgName.trim(),
          org_rut: orgRut.trim(),
        });
        if (!parsed.success) {
          const errs: Record<string, string> = {};
          parsed.error.errors.forEach(er => (errs[er.path[0] as string] = er.message));
          setValidationErrors(errs);
          return;
        }
        const { error } = await signUp(
          parsed.data.org_name,
          parsed.data.org_rut,
          parsed.data.email,
          parsed.data.password,
          parsed.data.username
        );
        if (error) setError(error.message ?? String(error));
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-6">
      <div className="container max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? t('welcomeBack') : 'Únete a Evalitics'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? t('signInToContinue') : t('createAccountToStart')}
          </p>
        </div>

        <Card className="border-border/50 shadow-elevated">
          <CardHeader>
            <CardTitle>{isLogin ? t('enterCredentials') : t('fillDetailsToCreate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {!isLogin && (
                <>
                  {/* Organization name */}
                  <div className="space-y-2">
                    <Label htmlFor="org_name">{t('organizationName') || 'Organization name'}</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="org_name"
                        type="text"
                        placeholder={t('enterOrganizationName') || 'Enter organization name'}
                        value={orgName}
                        onChange={(e) => { setOrgName(e.target.value); clearFieldError('org_name'); }}
                        className={`pl-10 ${validationErrors.org_name ? 'border-destructive' : ''}`}
                        required={!isLogin}
                      />
                    </div>
                    {validationErrors.org_name && <p className="text-sm text-destructive mt-1">{validationErrors.org_name}</p>}
                  </div>

                  {/* RUT */}
                  <div className="space-y-2">
                    <Label htmlFor="org_rut">{t('organizationRut') || 'Organization RUT'}</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="org_rut"
                        type="text"
                        placeholder={t('enterRut') || '12.345.678-9'}
                        value={orgRut}
                        onChange={(e) => { setOrgRut(e.target.value); clearFieldError('org_rut'); }}
                        className={`pl-10 ${validationErrors.org_rut ? 'border-destructive' : ''}`}
                        required={!isLogin}
                      />
                    </div>
                    {validationErrors.org_rut && <p className="text-sm text-destructive mt-1">{validationErrors.org_rut}</p>}
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('username')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder={t('enterUsername')}
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); clearFieldError('username'); }}
                        className={`pl-10 ${validationErrors.username ? 'border-destructive' : ''}`}
                        required={!isLogin}
                      />
                    </div>
                    {validationErrors.username && <p className="text-sm text-destructive mt-1">{validationErrors.username}</p>}
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('enterEmail')}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                    className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {validationErrors.email && <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('enterPassword')}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`pl-10 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && <p className="text-sm text-destructive mt-1">{validationErrors.password}</p>}

                {isLogin && (
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                )}

                {/* Password strength rules (solo en signup, con foco, ocultas si bypass dev) */}
                {!isLogin && passwordFocused && password.length > 0 && !isDevBypass && (
                  <ul className="space-y-1 mt-2">
                    {passwordChecks.map((r) => (
                      <li key={r.key} className="flex items-center gap-2 text-xs">
                        {r.passed
                          ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          : <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                        <span className={r.passed ? 'text-emerald-600' : 'text-muted-foreground'}>
                          {r.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password (solo en signup) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                      className={`pl-10 pr-10 ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.confirmPassword}</p>
                  )}
                  {confirmPassword.length > 0 && !validationErrors.confirmPassword && (
                    <p className={`text-xs mt-1 flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600' : 'text-destructive'}`}>
                      {passwordsMatch
                        ? <><Check className="h-3.5 w-3.5" /> Las contraseñas coinciden</>
                        : <><X className="h-3.5 w-3.5" /> Las contraseñas no coinciden</>}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || (!isLogin && (!allPasswordRulesPassed || !passwordsMatch))}
              >
                {loading ? t('processing') : (isLogin ? t('signIn') : t('signUp'))}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setValidationErrors({}); setConfirmPassword(''); }}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
