import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, CheckCircle, CalendarCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

const DemoFormDialog = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setSubmitted(false);
    setLoading(false);
    setName('');
    setEmail('');
    setPhone('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contact/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, description }),
      });
      if (!res.ok) throw new Error('Error al enviar');
      setSubmitted(true);
      toast({
        title: 'Solicitud enviada',
        description: 'Nos pondremos en contacto contigo pronto.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTimeout(resetForm, 300); }}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
            Agenda tu demo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Agenda tu demo</DialogTitle>
          <DialogDescription>
            Déjanos tus datos y te contactaremos para una demostración personalizada de Evalitics.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">¡Solicitud enviada!</p>
            <p className="text-sm text-muted-foreground text-center">
              Nos pondremos en contacto contigo pronto.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="demo-name">Nombre</Label>
              <Input
                id="demo-name"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-email">Correo electrónico</Label>
              <Input
                id="demo-email"
                type="email"
                placeholder="tu@empresa.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-phone">Número de teléfono</Label>
              <Input
                id="demo-phone"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-desc">Descripción</Label>
              <Textarea
                id="demo-desc"
                placeholder="Cuéntanos un poco de tu empresa"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar solicitud
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DemoFormDialog;
