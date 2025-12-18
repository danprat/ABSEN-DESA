import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { CameraView } from '@/components/CameraView';
import { AttendanceList } from '@/components/AttendanceList';
import { AttendanceResult } from '@/components/AttendanceResult';
import { Employee, AttendanceRecord } from '@/types/attendance';
import { api, BackendAttendanceTodayItem } from '@/lib/api';
import { toast } from 'sonner';

const DEFAULT_CONFIG = {
  villageName: 'Desa',
  officerName: 'Admin',
  lateThreshold: '08:15',
  logoUrl: null as string | null,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<'camera' | 'list'>('camera');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [capturedEmployee, setCapturedEmployee] = useState<{
    employee: Employee;
    confidence: number;
    attendanceStatus?: 'belum_absen' | 'sudah_check_in' | 'sudah_lengkap';
  } | null>(null);

  // Convert backend response to frontend format
  const convertToAttendanceRecord = (item: BackendAttendanceTodayItem): AttendanceRecord => ({
    id: String(item.id),
    employee: {
      id: String(item.employee_id),
      name: item.employee_name,
      position: item.employee_position,
      photoUrl: item.employee_photo || undefined,
      isActive: true,
      joinDate: '',
    },
    status: item.status,
    timestamp: item.check_in_at ? new Date(item.check_in_at) : undefined,
    checkOut: item.check_out_at ? new Date(item.check_out_at) : undefined,
  });

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        const response = await api.attendance.today();
        const converted = response.items.map(convertToAttendanceRecord);
        setRecords(converted);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
    
    const interval = setInterval(() => {
      if (activeTab === 'list') {
        fetchAttendance();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.public.settings();
        setConfig({
          villageName: settings.village_name,
          officerName: settings.officer_name || 'Admin',
          lateThreshold: settings.today_schedule?.check_in_end || '08:15',
          logoUrl: settings.logo_url || null,
        });
      } catch {
        // Use defaults if settings fetch fails
      }
    };
    fetchSettings();
  }, []);

  const attendanceCount = {
    hadir: records.filter(r => r.status === 'hadir').length,
    terlambat: records.filter(r => r.status === 'terlambat').length,
    belum: records.filter(r => r.status === 'belum').length,
  };

  const isLate = () => {
    const now = new Date();
    const [lateHour, lateMinute] = config.lateThreshold.split(':').map(Number);
    const lateTime = new Date();
    lateTime.setHours(lateHour, lateMinute, 0, 0);
    return now > lateTime;
  };

  const handleCapture = (employee: Employee, confidence: number, attendanceStatus?: 'belum_absen' | 'sudah_check_in' | 'sudah_lengkap') => {
    setCapturedEmployee({ employee, confidence, attendanceStatus });
  };

  const handleConfirmAttendance = async () => {
    if (!capturedEmployee) return;

    try {
      // Call confirm API to actually save attendance
      const result = await api.attendance.confirm(
        parseInt(capturedEmployee.employee.id),
        capturedEmployee.confidence * 100
      );

      toast.success(result.message, {
        description: result.attendance?.status === 'terlambat' ? 'Terlambat' : 'Tepat waktu',
      });

      setCapturedEmployee(null);

      // Refresh attendance list and redirect to list tab
      const response = await api.attendance.today();
      const converted = response.items.map(convertToAttendanceRecord);
      setRecords(converted);
      setActiveTab('list'); // Redirect to attendance list
    } catch (error) {
      console.error('Failed to confirm attendance:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || 'Gagal menyimpan absensi';
      toast.error('Gagal Absen', {
        description: errorMessage,
      });
      setCapturedEmployee(null);
    }
  };

  const handleCancelCapture = () => {
    setCapturedEmployee(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header
        villageName={config.villageName}
        officerName={config.officerName}
        logoUrl={config.logoUrl}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'camera' ? (
            <CameraView key="camera" onCapture={handleCapture} isPaused={!!capturedEmployee} />
          ) : (
            <AttendanceList 
              key="list"
              records={records} 
              onBackToCamera={() => setActiveTab('camera')} 
            />
          )}
        </AnimatePresence>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        attendanceCount={attendanceCount}
      />

      {capturedEmployee && (
        <AttendanceResult
          employee={capturedEmployee.employee}
          confidence={capturedEmployee.confidence}
          onConfirm={handleConfirmAttendance}
          onCancel={handleCancelCapture}
          isLate={isLate()}
          attendanceStatus={capturedEmployee.attendanceStatus}
        />
      )}
    </div>
  );
};

export default Index;
