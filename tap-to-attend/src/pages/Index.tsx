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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-background overflow-x-hidden">
      <Header
        villageName={settings.villageName}
        officerName={settings.officerName}
        logoUrl={settings.logoUrl}
      />
      
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          {/* Title */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-4 sm:mb-6 md:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Sistem Absensi Desa
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">Pilih menu layanan</p>
          </motion.div>

          {/* Menu Grid - Responsive: 1 col mobile, 2 cols tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
              >
                <Link to={item.to}>
                  <div className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${item.color} p-4 sm:p-6 md:p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] h-32 sm:h-40 md:h-48 flex flex-col justify-between`}>
                    {/* New Badge */}
                    {item.isNew && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3"
                      >
                        <span className="bg-white/30 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
                          BARU
                        </span>
                      </motion.div>
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl ${item.iconBg} backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <item.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" strokeWidth={2} />
                    </div>

                    {/* Text */}
                    <div className="space-y-0 sm:space-y-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{item.title}</h3>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium">{item.subtitle}</p>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
                    <div className="absolute top-1/2 -left-4 sm:-left-6 w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-white/5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-2 sm:p-3 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
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
