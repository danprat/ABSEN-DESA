import { motion } from 'framer-motion';
import { Check, Clock, Minus, Camera, Calendar, Thermometer, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttendanceRecord, AttendanceStatus } from '@/types/attendance';

interface AttendanceListProps {
  records: AttendanceRecord[];
  onBackToCamera: () => void;
}

const statusConfig: Record<AttendanceStatus, { 
  icon: typeof Check; 
  label: string; 
  textClass: string;
  bgClass: string;
}> = {
  hadir: { 
    icon: Check, 
    label: 'Hadir', 
    textClass: 'text-success',
    bgClass: 'bg-success'
  },
  terlambat: { 
    icon: Clock, 
    label: 'Terlambat', 
    textClass: 'text-warning',
    bgClass: 'bg-warning'
  },
  belum: { 
    icon: Minus, 
    label: 'Belum', 
    textClass: 'text-muted-foreground',
    bgClass: 'bg-muted-foreground'
  },
  izin: { 
    icon: Calendar, 
    label: 'Izin', 
    textClass: 'text-primary',
    bgClass: 'bg-primary'
  },
  sakit: { 
    icon: Thermometer, 
    label: 'Sakit', 
    textClass: 'text-orange-500',
    bgClass: 'bg-orange-500'
  },
  alfa: { 
    icon: XCircle, 
    label: 'Alfa', 
    textClass: 'text-destructive',
    bgClass: 'bg-destructive'
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function AttendanceList({ records, onBackToCamera }: AttendanceListProps) {
  const grouped = {
    hadir: records.filter(r => r.status === 'hadir'),
    terlambat: records.filter(r => r.status === 'terlambat'),
    izin: records.filter(r => r.status === 'izin'),
    sakit: records.filter(r => r.status === 'sakit'),
    belum: records.filter(r => r.status === 'belum'),
    alfa: records.filter(r => r.status === 'alfa'),
  };

  const renderEmployee = (record: AttendanceRecord, index: number) => {
    const config = statusConfig[record.status];
    const Icon = config.icon;

    return (
      <motion.div 
        key={record.id}
        variants={itemVariants}
        className="flex items-center gap-3 py-3 border-b border-border last:border-0"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgClass}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{record.employee.name}</p>
          <p className="text-sm text-muted-foreground truncate">{record.employee.position}</p>
        </div>
        {record.timestamp && (
          <p className={`text-sm font-medium ${config.textClass}`}>
            {record.timestamp.toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex-1 flex flex-col overflow-hidden bg-background"
    >
      {/* Summary */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 py-4 border-b border-border"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm"><strong>{grouped.hadir.length}</strong> Hadir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm"><strong>{grouped.terlambat.length}</strong> Terlambat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-sm"><strong>{grouped.belum.length}</strong> Belum</span>
          </div>
        </div>
      </motion.div>

      {/* List */}
      <motion.div 
        className="flex-1 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hadir section */}
        {grouped.hadir.length > 0 && (
          <div className="px-6 py-2">
            {grouped.hadir.map((record, i) => renderEmployee(record, i))}
          </div>
        )}
        
        {/* Terlambat section */}
        {grouped.terlambat.length > 0 && (
          <div className="px-6 py-2">
            {grouped.terlambat.map((record, i) => renderEmployee(record, i))}
          </div>
        )}
        
        {/* Belum section */}
        {grouped.belum.length > 0 && (
          <div className="px-6 py-2">
            {grouped.belum.map((record, i) => renderEmployee(record, i))}
          </div>
        )}
      </motion.div>

      {/* Back button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 py-4 border-t border-border"
      >
        <Button
          onClick={onBackToCamera}
          className="w-full"
          size="lg"
        >
          <Camera className="w-5 h-5" />
          Kembali Absen
        </Button>
      </motion.div>
    </motion.div>
  );
}
