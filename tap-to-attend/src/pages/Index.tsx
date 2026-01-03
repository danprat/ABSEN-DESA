import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ClipboardList, BookOpen, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { useSettings } from '@/hooks/useSettings';

const menuItems = [
  {
    id: 'absen',
    title: 'Absen',
    subtitle: 'Pegawai',
    icon: User,
    to: '/absen',
    color: 'from-primary to-primary/80',
    iconBg: 'bg-primary/20',
  },
  {
    id: 'daftar',
    title: 'Daftar',
    subtitle: 'Hadir',
    icon: ClipboardList,
    to: '/daftar-hadir',
    color: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/20',
  },
  {
    id: 'buku-tamu',
    title: 'Buku',
    subtitle: 'Tamu',
    icon: BookOpen,
    to: '/buku-tamu',
    color: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-500/20',
    isNew: true,
  },
  {
    id: 'survey',
    title: 'Survey',
    subtitle: 'Kepuasan',
    icon: Star,
    to: '/survey',
    color: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-500/20',
    isNew: true,
  },
];

const Index = () => {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        villageName={settings.villageName}
        officerName={settings.officerName}
        logoUrl={settings.logoUrl}
      />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Sistem Absensi Desa</h1>
            <p className="text-muted-foreground">Pilih menu layanan</p>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={item.to}>
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.color} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}>
                    {/* New Badge */}
                    {item.isNew && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          BARU
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center mb-4`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="text-lg font-bold leading-tight">{item.title}</h3>
                      <p className="text-white/80 text-sm">{item.subtitle}</p>
                    </div>

                    {/* Decorative circle */}
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Dibuat oleh <span className="font-medium text-foreground">Dany Pratmanto</span> · 
          <a
            href="https://wa.me/628974041777"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-primary hover:underline"
          >
            WA 0897 4041 777
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Index;
