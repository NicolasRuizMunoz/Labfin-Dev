import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TrendingUp, Home, CreditCard, PiggyBank, Menu, Brain } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/', icon: Brain },
    { name: 'Markets', href: '/markets', icon: TrendingUp },
    { name: 'Real Estate', href: '/real-estate', icon: Home },
    { name: 'Credit', href: '/credit', icon: CreditCard },
    { name: 'Retirement', href: '/retirement', icon: PiggyBank, disabled: true },
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
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline-block font-bold text-xl text-foreground">
            FinanceLearn
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex ml-auto space-x-1">
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
        <div className="md:hidden ml-auto">
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