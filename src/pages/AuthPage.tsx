import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters')
});

const signupSchema = loginSchema.extend({
  username: z.string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
});

const AuthPage = () => {
  const { t } = useLanguage();
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    try {
      // Validate input data
      if (isLogin) {
        const validationResult = loginSchema.safeParse({ email: email.trim(), password });
        if (!validationResult.success) {
          const errors: Record<string, string> = {};
          validationResult.error.errors.forEach((error) => {
            errors[error.path[0] as string] = error.message;
          });
          setValidationErrors(errors);
          setLoading(false);
          return;
        }
        
        const { error } = await signIn(validationResult.data.email, validationResult.data.password);
        if (error) {
          setError(error.message);
        }
      } else {
        const validationResult = signupSchema.safeParse({ 
          email: email.trim(), 
          password, 
          username: username.trim() 
        });
        if (!validationResult.success) {
          const errors: Record<string, string> = {};
          validationResult.error.errors.forEach((error) => {
            errors[error.path[0] as string] = error.message;
          });
          setValidationErrors(errors);
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(
          validationResult.data.email, 
          validationResult.data.password, 
          validationResult.data.username
        );
        if (error) {
          setError(error.message);
        } else {
          setError(t('checkEmailConfirmation'));
        }
      }
    } catch (err) {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

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
                        if (validationErrors.username) {
                          setValidationErrors(prev => ({ ...prev, username: '' }));
                        }
                      }}
                      className={`pl-10 ${validationErrors.username ? 'border-destructive' : ''}`}
                      required={!isLogin}
                    />
                  </div>
                  {validationErrors.username && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.username}</p>
                  )}
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
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>
                )}
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
                      if (validationErrors.password) {
                        setValidationErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                    className={`pl-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.password}</p>
                )}
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
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
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