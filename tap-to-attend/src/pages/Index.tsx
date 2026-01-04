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
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      <Header
        villageName={settings.villageName}
        officerName={settings.officerName}
        logoUrl={settings.logoUrl}
      />
      
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl flex flex-col justify-center h-full"
        >
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-3 sm:mb-4 md:mb-6 lg:mb-8 landscape:mb-4"
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Sistem Absensi Desa
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Pilih menu layanan</p>
          </motion.div>

          {/* Menu Grid - Responsive: 1 col mobile, 2 cols tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto w-full">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                className="h-full"
              >
                <Link to={item.to}>
                  <div className={`group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br ${item.color} p-3 sm:p-4 md:p-6 lg:p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] h-24 sm:h-32 md:h-40 lg:h-48 landscape:h-40 flex flex-col justify-between cursor-pointer`}>
                    {/* New Badge */}
                    {item.isNew && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 md:top-3 md:right-3"
                      >
                        <span className="bg-white/30 backdrop-blur-sm text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
                          BARU
                        </span>
                      </motion.div>
                    )}

                    {/* Icon */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl md:rounded-2xl ${item.iconBg} backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-8 lg:h-8 text-white" strokeWidth={2} />
                    </div>

                    {/* Text */}
                    <div className="space-y-0">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold leading-tight">{item.title}</h3>
                      <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-base font-medium">{item.subtitle}</p>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 md:-bottom-8 md:-right-8 w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
                    <div className="absolute top-1/2 -left-3 sm:-left-4 md:-left-6 w-12 h-12 sm:w-14 sm:h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full bg-white/5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-1.5 sm:p-2 md:p-3 text-center landscape:py-1">
        <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
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
