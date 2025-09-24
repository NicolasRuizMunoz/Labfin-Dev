import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TrendingUp, Home, CreditCard, PiggyBank, Menu, Brain, CheckCircle2, Globe, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
const labfinLogo = '/lovable-uploads/12094485-6192-4e4a-89bc-352de1dd8110.png';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { name: t('home'), href: '/', icon: Brain },
    { name: t('markets'), href: '/markets', icon: TrendingUp },
    { name: t('realEstate'), href: '/real-estate', icon: Home },
    { name: t('credit'), href: '/credit', icon: CreditCard },
    { name: t('selfAssessment'), href: '/assessment', icon: CheckCircle2 },
    { name: t('dailyTest'), href: '/daily-test', icon: Calendar },
    { name: t('retirement'), href: '/retirement', icon: PiggyBank, disabled: true },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-6xl mx-auto items-center px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src={labfinLogo} 
            alt="LabFin Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="hidden sm:inline-block font-bold text-xl text-primary">
            LabFin
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex ml-auto items-center space-x-1">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{language.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'bg-accent' : ''}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage('es')}
                className={language === 'es' ? 'bg-accent' : ''}
              >
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant={isActive(item.href) ? "default" : "ghost"}
                size="sm"
                className={`
                  ${isActive(item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                asChild={!item.disabled}
                disabled={item.disabled}
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
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden ml-auto flex items-center space-x-2">
          {/* Mobile Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'bg-accent' : ''}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage('es')}
                className={language === 'es' ? 'bg-accent' : ''}
              >
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-2 mt-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.name}
                      variant={isActive(item.href) ? "default" : "ghost"}
                      size="sm"
                      className={`
                        justify-start
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;