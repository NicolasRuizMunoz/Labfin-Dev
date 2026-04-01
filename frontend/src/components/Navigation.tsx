import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, FileText, ClipboardList, Menu, LogIn, LogOut, User, Building2, ShieldCheck, FlaskConical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isEvalitics } from '@/auth/roles';

const evaliticsLogo = '/evalitics-logo.png';

const baseNavItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'File Manager', href: '/files', icon: FileText },
  { name: 'Licitaciones', href: '/tenders', icon: ClipboardList },
  { name: 'Escenarios', href: '/escenarios', icon: FlaskConical },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    if (user && isEvalitics(user.role)) {
      items.push({ name: 'Admin', href: '/admin', icon: ShieldCheck });
    }
    return items;
  }, [user]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const displayName = user?.username || user?.email?.split('@')[0] || 'Usuario';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl mx-auto items-center px-4 gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 mr-6 shrink-0">
          <img src={evaliticsLogo} alt="Evalitics" className="w-7 h-7 object-contain" />
          <span className="hidden md:inline-block font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Evalitics</span>
        </Link>

        {/* Desktop nav items — left (solo si está autenticado) */}
        <div className="hidden lg:flex items-center space-x-1">
          {user && navItems.map(({ name, href, icon: Icon }) => (
            <Button
              key={href}
              variant={isActive(href) ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 text-xs h-8 ${isActive(href) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
              asChild
            >
              <Link to={href} className="flex items-center space-x-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{name}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop right side */}
        <div className="hidden lg:flex items-center space-x-2">
          {!user ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="w-3 h-3 mr-1" />
              Ingresar
            </Button>
          ) : (
            <>
              {/* Avatar + username → profile dropdown (4th item) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 px-2 h-8">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    {user.organization_id && (
                      <span className="text-xs font-normal text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        Org #{user.organization_id}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    <User className="w-3 h-3 mr-2" />
                    Configuración de cuenta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Salir */}
              <Button variant="outline" size="sm" className="h-8" onClick={signOut}>
                <LogOut className="w-3 h-3 mr-1" />
                Salir
              </Button>
            </>
          )}
        </div>

        {/* Mobile / Tablet */}
        <div className="lg:hidden flex items-center space-x-2">
          {user && (
            <Avatar className="h-7 w-7">
              <AvatarImage src={undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 z-50">
              <div className="flex flex-col space-y-2 mt-6">
                {user && navItems.map(({ name, href, icon: Icon }) => (
                  <Button
                    key={href}
                    variant={isActive(href) ? 'default' : 'ghost'}
                    size="sm"
                    className="justify-start"
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to={href} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{name}</span>
                    </Link>
                  </Button>
                ))}

                <div className="pt-2 border-t">
                  {!user ? (
                    <Button
                      variant="outline" size="sm" className="w-full justify-start"
                      onClick={() => { setIsOpen(false); navigate('/auth'); }}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Ingresar
                    </Button>
                  ) : (
                    <>
                      <div className="px-3 py-2 text-xs text-muted-foreground">{user.email}</div>
                      <Button
                        variant="outline" size="sm" className="w-full justify-start"
                        onClick={() => { setIsOpen(false); signOut(); }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Salir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  );
};

export default Navigation;
