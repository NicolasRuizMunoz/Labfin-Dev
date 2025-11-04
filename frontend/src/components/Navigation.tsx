import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  Home,
  CreditCard,
  PiggyBank,
  Menu,
  Brain,
  CheckCircle2,
  Globe,
  Calendar,
  Building2,
  LogIn,
  LogOut,
  FileText,
  FolderOpen,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const labfinLogo = '/lovable-uploads/12094485-6192-4e4a-89bc-352de1dd8110.png';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: t('home'), href: '/', icon: Brain },
    { name: 'LF Business', href: '/business', icon: Building2 },
    { name: 'File Manager', href: '/files', icon: FileText },
    { name: 'Batches', href: '/batches', icon: FolderOpen },
    { name: t('markets'), href: '/markets', icon: TrendingUp },
    { name: t('realEstate'), href: '/real-estate', icon: Home },
    { name: t('credit'), href: '/credit', icon: CreditCard },
    { name: t('selfAssessment'), href: '/assessment', icon: CheckCircle2 },
    { name: t('dailyTest'), href: '/daily-test', icon: Calendar },
    { name: t('retirement'), href: '/retirement', icon: PiggyBank, disabled: true },
  ];

  const isActive = (href: string) => (href === '/' ? location.pathname === '/' : location.pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl mx-auto items-center px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 mr-4">
          <img src={labfinLogo} alt="LabFin Logo" className="w-7 h-7 object-contain" />
          <span className="hidden lg:inline-block font-bold text-lg text-primary">LabFin</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex ml-auto items-center space-x-0.5">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 px-2 text-xs">
                <Globe className="w-3 h-3" />
                <span className="font-medium">{language.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent' : ''}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('es')} className={language === 'es' ? 'bg-accent' : ''}>
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant={isActive(item.href) ? 'default' : 'ghost'}
                size="sm"
                className={`
                  px-2 py-1 text-xs h-8
                  ${isActive(item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                asChild={!item.disabled}
                disabled={item.disabled}
              >
                {item.disabled ? (
                  <span className="flex items-center space-x-1">
                    <Icon className="w-3 h-3" />
                    <span className="hidden xl:inline whitespace-nowrap">{item.name}</span>
                  </span>
                ) : (
                  <Link to={item.href} className="flex items-center space-x-1">
                    <Icon className="w-3 h-3" />
                    <span className="hidden xl:inline whitespace-nowrap">{item.name}</span>
                  </Link>
                )}
              </Button>
            );
          })}

          {/* Auth (desktop) */}
          {!user ? (
            <Button variant="outline" size="sm" className="ml-2" onClick={() => navigate('/auth')}>
              <LogIn className="w-3 h-3 mr-1" />
              Ingresar
            </Button>
          ) : (
            <>
              <span className="text-xs opacity-70 ml-2 hidden xl:inline">{user.email}</span>
              <Button variant="outline" size="sm" className="ml-2" onClick={signOut}>
                <LogOut className="w-3 h-3 mr-1" />
                Salir
              </Button>
            </>
          )}
        </div>

        {/* Mobile / Tablet */}
        <div className="lg:hidden ml-auto flex items-center space-x-2">
          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent' : ''}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('es')} className={language === 'es' ? 'bg-accent' : ''}>
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Drawer */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 z-50">
              <div className="flex flex-col space-y-2 mt-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.name}
                      variant={isActive(item.href) ? 'default' : 'ghost'}
                      size="sm"
                      className={`justify-start ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      asChild={!item.disabled}
                      disabled={item.disabled}
                      onClick={() => !item.disabled && setIsOpen(false)}
                    >
                      {item.disabled ? (
                        <span className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </span>
                      ) : (
                        <Link to={item.href} className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      )}
                    </Button>
                  );
                })}

                {/* Auth (mobile) */}
                {!user ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/auth');
                    }}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Ingresar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Salir
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;