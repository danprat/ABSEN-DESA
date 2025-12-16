import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Clock, UserX, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, BackendAttendanceTodayAdminResponse, BackendAuditLog } from '@/lib/api';

interface DashboardStats {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  sick: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
    sick: 0,
  });
  const [activityLogs, setActivityLogs] = useState<BackendAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch attendance today with summary
        const attendanceData: BackendAttendanceTodayAdminResponse = await api.admin.attendance.today();
        
        setStats({
          totalEmployees: attendanceData.summary.total_employees,
          present: attendanceData.summary.present,
          late: attendanceData.summary.late,
          absent: attendanceData.summary.absent,
          onLeave: attendanceData.summary.on_leave,
          sick: attendanceData.summary.sick,
        });
        
        // Fetch recent activity logs
        const logsData = await api.admin.auditLogs.list({ page_size: 5 });
        setActivityLogs(logsData.items);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const statsCards = [
    {
      label: 'Total Pegawai',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-primary',
    },
    {
      label: 'Hadir Hari Ini',
      value: stats.present,
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      label: 'Terlambat',
      value: stats.late,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Tidak Hadir',
      value: stats.absent + stats.onLeave + stats.sick,
      icon: UserX,
      color: 'bg-red-500',
    },
  ];

  const attendanceRate = stats.totalEmployees > 0
    ? Math.round(((stats.present + stats.late) / stats.totalEmployees) * 100)
    : 0;

  // Weekly data placeholder - will show current day stats
  const weeklyData = [
    { day: 'Sen', hadir: 0, terlambat: 0, tidakHadir: 0 },
    { day: 'Sel', hadir: 0, terlambat: 0, tidakHadir: 0 },
    { day: 'Rab', hadir: 0, terlambat: 0, tidakHadir: 0 },
    { day: 'Kam', hadir: 0, terlambat: 0, tidakHadir: 0 },
    { day: 'Jum', hadir: 0, terlambat: 0, tidakHadir: 0 },
    { day: 'Sab', hadir: 0, terlambat: 0, tidakHadir: 0 },
  ];

  // Update current day in weekly data
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 5 : today - 1; // Convert to Mon=0, Sun=5
  if (dayIndex >= 0 && dayIndex < 6) {
    weeklyData[dayIndex] = {
      day: weeklyData[dayIndex].day,
      hadir: stats.present,
      terlambat: stats.late,
      tidakHadir: stats.absent + stats.onLeave + stats.sick,
    };
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan kehadiran hari ini</p>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Grafik Kehadiran Minggu Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="hadir" fill="#22c55e" name="Hadir" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="terlambat" fill="#eab308" name="Terlambat" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tidakHadir" fill="#ef4444" name="Tidak Hadir" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Rate */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Tingkat Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="12"
                    strokeDasharray={`${attendanceRate * 4.4} 440`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">{attendanceRate}%</span>
                  <span className="text-sm text-muted-foreground">Hari Ini</span>
                </div>
              </div>
              
              {/* Detail breakdown */}
              <div className="mt-4 w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Izin</span>
                  <span className="font-medium">{stats.onLeave}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sakit</span>
                  <span className="font-medium">{stats.sick}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alfa</span>
                  <span className="font-medium">{stats.absent}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada aktivitas tercatat
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.performed_by} • {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
