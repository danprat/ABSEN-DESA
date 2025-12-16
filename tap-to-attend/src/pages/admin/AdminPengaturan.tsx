import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Calendar, Building2, User, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api, BackendWorkSettings, BackendHoliday } from '@/lib/api';
import { toast } from 'sonner';

export function AdminPengaturan() {
  const [settings, setSettings] = useState<BackendWorkSettings | null>(null);
  const [holidays, setHolidays] = useState<BackendHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  const [formData, setFormData] = useState({
    village_name: '',
    officer_name: '',
    check_in_start: '07:00',
    check_in_end: '08:00',
    late_threshold_minutes: 15,
    check_out_start: '16:00',
    min_work_hours: 8,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, holidaysData] = await Promise.all([
        api.admin.settings.get(),
        api.admin.settings.holidays.list({ year: new Date().getFullYear() }),
      ]);
      
      setSettings(settingsData);
      setHolidays(holidaysData.items);
      setFormData({
        village_name: settingsData.village_name,
        officer_name: settingsData.officer_name || '',
        check_in_start: settingsData.check_in_start,
        check_in_end: settingsData.check_in_end,
        late_threshold_minutes: settingsData.late_threshold_minutes,
        check_out_start: settingsData.check_out_start,
        min_work_hours: settingsData.min_work_hours,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.admin.settings.update(formData);
      toast.success('Pengaturan berhasil disimpan');
      fetchData();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      toast.error('Tanggal dan nama libur harus diisi');
      return;
    }

    try {
      await api.admin.settings.holidays.create(newHoliday);
      toast.success('Hari libur berhasil ditambahkan');
      setNewHoliday({ date: '', name: '' });
      setIsHolidayDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add holiday:', error);
      toast.error('Gagal menambahkan hari libur');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm('Yakin ingin menghapus hari libur ini?')) return;

    try {
      await api.admin.settings.holidays.delete(id);
      toast.success('Hari libur berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast.error('Gagal menghapus hari libur');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">Konfigurasi jam kerja dan hari libur</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Informasi Organisasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="village_name">Nama Desa / Organisasi</Label>
                <Input
                  id="village_name"
                  value={formData.village_name}
                  onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                  placeholder="Contoh: Desa Sukamaju"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officer_name">Nama Petugas</Label>
                <Input
                  id="officer_name"
                  value={formData.officer_name}
                  onChange={(e) => setFormData({ ...formData, officer_name: e.target.value })}
                  placeholder="Contoh: Pak Budi"
                />
              </div>
            </CardContent>
          </Card>

          {/* Work Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Pengaturan Jam Kerja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in_start">Jam Masuk Mulai</Label>
                  <Input
                    id="check_in_start"
                    type="time"
                    value={formData.check_in_start}
                    onChange={(e) => setFormData({ ...formData, check_in_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_in_end">Jam Masuk Berakhir</Label>
                  <Input
                    id="check_in_end"
                    type="time"
                    value={formData.check_in_end}
                    onChange={(e) => setFormData({ ...formData, check_in_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="late_threshold">Toleransi Terlambat (menit)</Label>
                  <Input
                    id="late_threshold"
                    type="number"
                    min={0}
                    max={60}
                    value={formData.late_threshold_minutes}
                    onChange={(e) => setFormData({ ...formData, late_threshold_minutes: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out_start">Jam Pulang</Label>
                  <Input
                    id="check_out_start"
                    type="time"
                    value={formData.check_out_start}
                    onChange={(e) => setFormData({ ...formData, check_out_start: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_work_hours">Minimal Jam Kerja per Hari</Label>
                <Input
                  id="min_work_hours"
                  type="number"
                  min={1}
                  max={12}
                  value={formData.min_work_hours}
                  onChange={(e) => setFormData({ ...formData, min_work_hours: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Pengaturan
          </Button>
        </div>

        {/* Right Column - Holidays */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Hari Libur {new Date().getFullYear()}
            </CardTitle>
            <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Hari Libur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="holiday_date">Tanggal</Label>
                    <Input
                      id="holiday_date"
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holiday_name">Nama Libur</Label>
                    <Input
                      id="holiday_name"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                      placeholder="Contoh: Hari Raya Idul Fitri"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleAddHoliday}>
                      Tambah
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada hari libur terdaftar
              </p>
            ) : (
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30"
                  >
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(holiday.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
