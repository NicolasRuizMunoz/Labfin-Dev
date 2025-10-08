import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Mail, Lock, User, AlertCircle, Building2, IdCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const signupSchema = loginSchema.extend({
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
});

const AuthPage = () => {
  const { t } = useLanguage();
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgRut, setOrgRut] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
        // signUp(org_name, org_rut, email, password, username)
        const { error } = await signUp(
          parsed.data.org_name,
          parsed.data.org_rut,
          parsed.data.email,
          parsed.data.password,
          parsed.data.username
        );
        if (error) setError(error.message ?? String(error));
        // El AuthContext realiza auto-login tras el registro
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
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? t('welcomeBack') : t('joinLabFin')}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? t('signInToContinue') : t('createAccountToStart')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? t('signIn') : t('signUp')}</CardTitle>
            <CardDescription>
              {isLogin ? t('enterCredentials') : t('fillDetailsToCreate')}
            </CardDescription>
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
                    type="password"
                    placeholder={t('enterPassword')}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                    className={`pl-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {validationErrors.password && <p className="text-sm text-destructive mt-1">{validationErrors.password}</p>}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('processing') : (isLogin ? t('signIn') : t('signUp'))}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
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
