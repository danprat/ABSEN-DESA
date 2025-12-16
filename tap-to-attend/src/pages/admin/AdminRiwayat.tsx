import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Loader2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, BackendMonthlyReportItem } from '@/lib/api';
import { toast } from 'sonner';

const months = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export function AdminRiwayat() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
  const [reportData, setReportData] = useState<BackendMonthlyReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const response = await api.admin.reports.monthly({
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
      });
      setReportData(response.items);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await api.admin.reports.export({
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-absensi-${months.find((m) => m.value === selectedMonth)?.label}-${selectedYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('File CSV berhasil diunduh');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  const totalStats = reportData.reduce(
    (acc, r) => ({
      hadir: acc.hadir + r.present_days,
      terlambat: acc.terlambat + r.late_days,
      izin: acc.izin + r.leave_days,
      sakit: acc.sakit + r.sick_days,
      alfa: acc.alfa + r.absent_days,
    }),
    { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alfa: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat & Laporan</h1>
          <p className="text-muted-foreground">Rekap absensi bulanan</p>
        </div>
        <Button onClick={handleExport} disabled={isExporting || reportData.length === 0}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Ekspor CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-32">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{totalStats.hadir}</p>
            <p className="text-xs text-muted-foreground">Total Hadir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{totalStats.terlambat}</p>
            <p className="text-xs text-muted-foreground">Total Terlambat</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{totalStats.izin}</p>
            <p className="text-xs text-muted-foreground">Total Izin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{totalStats.sakit}</p>
            <p className="text-xs text-muted-foreground">Total Sakit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{totalStats.alfa}</p>
            <p className="text-xs text-muted-foreground">Total Alfa</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Rekap Bulan {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pegawai</TableHead>
                  <TableHead className="text-center">Hadir</TableHead>
                  <TableHead className="text-center">Terlambat</TableHead>
                  <TableHead className="text-center">Izin</TableHead>
                  <TableHead className="text-center">Sakit</TableHead>
                  <TableHead className="text-center">Alfa</TableHead>
                  <TableHead className="text-center">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data untuk periode ini
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.map((recap) => (
                    <TableRow key={recap.employee_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{recap.employee_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {recap.employee_nip || '-'} • {recap.employee_position}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          {recap.present_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          {recap.late_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-blue-500 text-blue-500">
                          {recap.leave_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          {recap.sick_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          {recap.absent_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium ${
                            recap.attendance_percentage >= 90
                              ? 'text-green-500'
                              : recap.attendance_percentage >= 70
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}
                        >
                          {recap.attendance_percentage}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
