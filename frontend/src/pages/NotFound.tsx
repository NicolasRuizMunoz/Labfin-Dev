import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <p className="text-xl text-foreground font-medium mb-2">Página no encontrada</p>
        <p className="text-muted-foreground mb-8">
          La ruta <code className="px-1.5 py-0.5 rounded bg-muted text-sm">{location.pathname}</code> no existe.
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
