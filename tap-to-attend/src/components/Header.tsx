const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface HeaderProps {
  villageName: string;
  officerName: string;
  logoUrl?: string | null;
}

export function Header({ villageName, officerName, logoUrl }: HeaderProps) {
  const now = new Date();
  const timeString = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateString = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="px-6 py-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              src={`${API_BASE_URL}${logoUrl}`}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">{villageName}</h1>
            <p className="text-sm text-muted-foreground">{dateString}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground tabular-nums">{timeString}</p>
          <p className="text-xs text-muted-foreground">{officerName}</p>
        </div>
      </div>
    </header>
  );
}