import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Calendar, Building2, User, Loader2, Plus, Trash2, Lock, Upload } from 'lucide-react';
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
import { api, BackendWorkSettings, BackendHoliday, BackendDailySchedule } from '@/lib/api';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function AdminPengaturan() {
  const [settings, setSettings] = useState<BackendWorkSettings | null>(null);
  const [holidays, setHolidays] = useState<BackendHoliday[]>([]);
  const [schedules, setSchedules] = useState<BackendDailySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

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
      const [settingsData, holidaysData, schedulesData] = await Promise.all([
        api.admin.settings.get(),
        api.admin.settings.holidays.list({ year: new Date().getFullYear() }),
        api.admin.settings.schedules.list(),
      ]);

      setSettings(settingsData);
      setHolidays(holidaysData.items);
      setSchedules(schedulesData);
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

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error('Semua field harus diisi');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.auth.changePassword(passwordData);
      toast.success('Password berhasil diubah');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Gagal mengubah password. Pastikan password lama benar.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error('Pilih file logo terlebih dahulu');
      return;
    }

    try {
      setIsUploadingLogo(true);
      await api.admin.settings.uploadLogo(logoFile);
      toast.success('Logo berhasil diupload');
      setLogoFile(null);
      fetchData();
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error('Gagal mengupload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Yakin ingin menghapus logo?')) return;

    try {
      setIsDeletingLogo(true);
      await api.admin.settings.deleteLogo();
      toast.success('Logo berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Failed to delete logo:', error);
      toast.error('Gagal menghapus logo');
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days[dayOfWeek] || '';
  };

  const handleScheduleChange = (dayOfWeek: number, field: keyof BackendDailySchedule, value: boolean | string) => {
    setSchedules(prevSchedules =>
      prevSchedules.map(schedule =>
        schedule.day_of_week === dayOfWeek
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  const handleSaveSchedules = async () => {
    setIsSavingSchedules(true);
    try {
      const schedulesToUpdate = schedules.map(s => ({
        day_of_week: s.day_of_week,
        is_workday: s.is_workday,
        check_in_start: s.check_in_start,
        check_in_end: s.check_in_end,
        check_out_start: s.check_out_start,
      }));

      await api.admin.settings.schedules.update(schedulesToUpdate);
      toast.success('Jadwal kerja berhasil disimpan');
      fetchData();
    } catch (error) {
      console.error('Failed to save schedules:', error);
      toast.error('Gagal menyimpan jadwal kerja');
    } finally {
      setIsSavingSchedules(false);
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
        <p className="text-muted-foreground">Konfigurasi sistem absensi</p>
      </div>

      <Tabs defaultValue="umum" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="umum">Umum</TabsTrigger>
          <TabsTrigger value="jam-kerja">Jam Kerja</TabsTrigger>
          <TabsTrigger value="hari-libur">Hari Libur</TabsTrigger>
          <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
        </TabsList>

        {/* Tab 1: Umum - Informasi Organisasi + Logo */}
        <TabsContent value="umum" className="space-y-6">
          {/* Card: Informasi Organisasi */}
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

              {/* Logo Upload Section */}
              <div className="space-y-2">
                <Label>Logo Organisasi</Label>

                {/* Current Logo Preview */}
                {settings?.logo_url && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-secondary/30">
                    <img
                      src={`${API_BASE_URL}${settings.logo_url}`}
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Logo saat ini</p>
                      <p className="text-xs text-muted-foreground">
                        {settings.logo_url.split('/').pop()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteLogo}
                      disabled={isDeletingLogo}
                    >
                      {isDeletingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Upload New Logo */}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleUploadLogo}
                    disabled={!logoFile || isUploadingLogo}
                    size="sm"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: JPG, PNG, atau SVG. Maksimal 2MB.
                </p>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Pengaturan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Jam Kerja - Global Settings + Daily Schedule */}
        <TabsContent value="jam-kerja" className="space-y-6">
          {/* Card: Pengaturan Umum Jam Kerja */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Pengaturan Umum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan
              </Button>
            </CardContent>
          </Card>

          {/* Card: Jadwal Kerja Mingguan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Jadwal Kerja Mingguan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desktop: Table layout */}
              <div className="hidden md:block space-y-2">
                <div className="grid grid-cols-5 gap-3 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div>Hari</div>
                  <div className="text-center">Hari Kerja</div>
                  <div className="text-center">Jam Masuk</div>
                  <div className="text-center">Batas Masuk</div>
                  <div className="text-center">Jam Pulang</div>
                </div>

                {schedules.sort((a, b) => a.day_of_week - b.day_of_week).map((schedule) => (
                  <div key={schedule.day_of_week} className="grid grid-cols-5 gap-3 items-center py-2 border-b last:border-0">
                    <div className="font-medium">{getDayName(schedule.day_of_week)}</div>

                    <div className="flex justify-center">
                      <Switch
                        checked={schedule.is_workday}
                        onCheckedChange={(checked) => handleScheduleChange(schedule.day_of_week, 'is_workday', checked)}
                      />
                    </div>

                    <Input
                      type="time"
                      value={schedule.check_in_start}
                      onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_start', e.target.value)}
                      disabled={!schedule.is_workday}
                      className="h-8 text-sm"
                    />

                    <Input
                      type="time"
                      value={schedule.check_in_end}
                      onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_end', e.target.value)}
                      disabled={!schedule.is_workday}
                      className="h-8 text-sm"
                    />

                    <Input
                      type="time"
                      value={schedule.check_out_start}
                      onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_out_start', e.target.value)}
                      disabled={!schedule.is_workday}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>

              {/* Mobile: Card layout */}
              <div className="md:hidden space-y-3">
                {schedules.sort((a, b) => a.day_of_week - b.day_of_week).map((schedule) => (
                  <div key={schedule.day_of_week} className="p-3 border rounded-lg bg-secondary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{getDayName(schedule.day_of_week)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Hari Kerja</span>
                        <Switch
                          checked={schedule.is_workday}
                          onCheckedChange={(checked) => handleScheduleChange(schedule.day_of_week, 'is_workday', checked)}
                        />
                      </div>
                    </div>

                    {schedule.is_workday && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Masuk</Label>
                          <Input
                            type="time"
                            value={schedule.check_in_start}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_start', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Batas</Label>
                          <Input
                            type="time"
                            value={schedule.check_in_end}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_end', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Pulang</Label>
                          <Input
                            type="time"
                            value={schedule.check_out_start}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_out_start', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveSchedules} disabled={isSavingSchedules} className="w-full">
                {isSavingSchedules ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Jadwal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Hari Libur */}
        <TabsContent value="hari-libur">
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
        </TabsContent>

        {/* Tab 4: Keamanan */}
        <TabsContent value="keamanan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Ganti Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Password Lama</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="Masukkan password lama"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Password Baru</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Ulangi password baru"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Ubah Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
