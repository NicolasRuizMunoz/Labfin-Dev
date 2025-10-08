import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const signupSchema = loginSchema.extend({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Si ya hay sesión, redirige (respeta "from" si venía de ruta protegida)
  useEffect(() => {
    if (user) {
      const to = location?.state?.from?.pathname || '/';
      navigate(to, { replace: true });
    }
  }, [user, navigate, location?.state?.from?.pathname]);

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
        const parsed = signupSchema.safeParse({ email: email.trim(), password, username: username.trim() });
        if (!parsed.success) {
          const errs: Record<string, string> = {};
          parsed.error.errors.forEach(er => (errs[er.path[0] as string] = er.message));
          setValidationErrors(errs);
          return;
        }
        const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.username);
        if (error) setError(error.message ?? String(error));
        // Nota: nuestro AuthContext hace auto-login tras signup, por lo que el useEffect redirige.
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
                <div className="space-y-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('enterUsername')}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (validationErrors.username) setValidationErrors(prev => ({ ...prev, username: '' }));
                      }}
                      className={`pl-10 ${validationErrors.username ? 'border-destructive' : ''}`}
                      required={!isLogin}
                    />
                  </div>
                  {validationErrors.username && <p className="text-sm text-destructive mt-1">{validationErrors.username}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('enterEmail')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {validationErrors.email && <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('enterPassword')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: '' }));
                    }}
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