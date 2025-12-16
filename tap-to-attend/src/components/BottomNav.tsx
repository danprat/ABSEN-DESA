import { Camera, List } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'camera' | 'list';
  onTabChange: (tab: 'camera' | 'list') => void;
  attendanceCount: { hadir: number; terlambat: number; belum: number };
}

export function BottomNav({ activeTab, onTabChange, attendanceCount }: BottomNavProps) {
  const totalPresent = attendanceCount.hadir + attendanceCount.terlambat;
  const total = totalPresent + attendanceCount.belum;

  return (
    <nav className="bg-card border-t border-border px-4 py-3">
      <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
        <button
          onClick={() => onTabChange('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 ${
            activeTab === 'camera'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="font-medium">Absen</span>
        </button>
        
        <button
          onClick={() => onTabChange('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 relative ${
            activeTab === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="font-medium">Daftar</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            activeTab === 'list' 
              ? 'bg-primary-foreground/20 text-primary-foreground' 
              : 'bg-primary/10 text-primary'
          }`}>
            {totalPresent}/{total}
          </span>
        </button>
      </div>
    </nav>
  );
}