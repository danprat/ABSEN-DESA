import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, Edit2, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, BackendAttendanceTodayItem, BackendAttendanceSummary } from '@/lib/api';
import { toast } from 'sonner';

type AttendanceStatus = 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alfa';

const statusOptions: { value: AttendanceStatus; label: string }[] = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'terlambat', label: 'Terlambat' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alfa', label: 'Alfa' },
];

const statusColors: Record<AttendanceStatus, string> = {
  hadir: 'bg-green-500 text-white',
  terlambat: 'bg-yellow-500 text-white',
  izin: 'bg-blue-500 text-white',
  sakit: 'bg-orange-500 text-white',
  alfa: 'bg-red-500 text-white',
};

export function AdminAbsensi() {
  const [records, setRecords] = useState<BackendAttendanceTodayItem[]>([]);
  const [summary, setSummary] = useState<BackendAttendanceSummary>({
    total_employees: 0,
    present: 0,
    late: 0,
    absent: 0,
    on_leave: 0,
    sick: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<BackendAttendanceTodayItem | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('hadir');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const response = await api.admin.attendance.today();
      setRecords(response.items);
      setSummary(response.summary);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Gagal memuat data absensi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCorrection = async () => {
    if (!editingRecord) return;

    setIsSubmitting(true);
    try {
      await api.admin.attendance.correct(editingRecord.id, {
        status: correctionStatus,
        correction_notes: correctionNotes,
      });
      
      toast.success('Koreksi absensi berhasil disimpan');
      setEditingRecord(null);
      setCorrectionNotes('');
      fetchAttendance();
    } catch (error) {
      console.error('Failed to correct attendance:', error);
      toast.error('Gagal menyimpan koreksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCorrection = (record: BackendAttendanceTodayItem) => {
    setEditingRecord(record);
    setCorrectionStatus(record.status);
    setCorrectionNotes('');
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && records.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat data absensi...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Absensi Harian</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {today}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.total_employees}</p>
            <p className="text-xs text-muted-foreground">Total Pegawai</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{summary.present}</p>
            <p className="text-xs text-muted-foreground">Hadir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{summary.late}</p>
            <p className="text-xs text-muted-foreground">Terlambat</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{summary.on_leave}</p>
            <p className="text-xs text-muted-foreground">Izin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{summary.sick}</p>
            <p className="text-xs text-muted-foreground">Sakit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{summary.absent}</p>
            <p className="text-xs text-muted-foreground">Alfa</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kehadiran</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pegawai</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Pulang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Koreksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada data absensi hari ini
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.employee_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.employee_position}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(record.check_in_at)}</TableCell>
                    <TableCell>{formatTime(record.check_out_at)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[record.status]}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCorrection(record)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Koreksi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Correction Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Koreksi Absensi</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary">
                <p className="font-medium">{editingRecord.employee_name}</p>
                <p className="text-sm text-muted-foreground">
                  {editingRecord.employee_position}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status Baru</Label>
                <Select
                  value={correctionStatus}
                  onValueChange={(v) => setCorrectionStatus(v as AttendanceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Textarea
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder="Alasan koreksi..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingRecord(null)} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button onClick={handleCorrection} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Simpan Koreksi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
