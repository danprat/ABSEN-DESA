interface HeaderProps {
  villageName: string;
  officerName: string;
}

export function Header({ villageName, officerName }: HeaderProps) {
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
        <div>
          <h1 className="text-lg font-semibold text-foreground">{villageName}</h1>
          <p className="text-sm text-muted-foreground">{dateString}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground tabular-nums">{timeString}</p>
          <p className="text-xs text-muted-foreground">{officerName}</p>
        </div>
      </div>
    </header>
  );
}