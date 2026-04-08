import { useNavigate } from 'react-router-dom';
import { Home, ImageOff } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        <Home className="h-4 w-4" /> Go home
      </button>
    </div>
  );
}
