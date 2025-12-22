import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Calendar, Building2, User, Loader2, Plus, Trash2, Lock, Upload, RefreshCw, Undo2 } from 'lucide-react';
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
  const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [excludedHolidays, setExcludedHolidays] = useState<BackendHoliday[]>([]);
  const [isExcludedDialogOpen, setIsExcludedDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    village_name: '',
    officer_name: '',
    late_threshold_minutes: 15,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, holidaysData, schedulesData] = await Promise.all([
        api.admin.settings.get(),
        api.admin.settings.holidays.list({ year: selectedYear }),
        api.admin.settings.schedules.list(),
      ]);

      setSettings(settingsData);
      setHolidays(holidaysData.items);
      setSchedules(schedulesData);
      setFormData({
        village_name: settingsData.village_name,
        officer_name: settingsData.officer_name || '',
        late_threshold_minutes: settingsData.late_threshold_minutes,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHolidays = async (year: number) => {
    try {
      const holidaysData = await api.admin.settings.holidays.list({ year });
      setHolidays(holidaysData.items);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      toast.error('Gagal memuat hari libur');
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

  const handleSyncHolidays = async () => {
    try {
      setIsSyncingHolidays(true);
      const result = await api.admin.settings.holidays.sync(selectedYear);
      toast.success(result.message);
      fetchHolidays(selectedYear);
    } catch (error) {
      console.error('Failed to sync holidays:', error);
      toast.error('Gagal sync hari libur dari API');
    } finally {
      setIsSyncingHolidays(false);
    }
  };

  const fetchExcludedHolidays = async () => {
    try {
      const data = await api.admin.settings.holidays.listExcluded({ year: selectedYear });
      setExcludedHolidays(data.items);
    } catch (error) {
      console.error('Failed to fetch excluded holidays:', error);
    }
  };

  const handleRestoreHoliday = async (id: number) => {
    try {
      await api.admin.settings.holidays.restore(id);
      toast.success('Hari libur berhasil dikembalikan');
      fetchHolidays(selectedYear);
      fetchExcludedHolidays();
    } catch (error) {
      console.error('Failed to restore holiday:', error);
      toast.error('Gagal mengembalikan hari libur');
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
      className="max-w-5xl mx-auto space-y-8 pb-10"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">Konfigurasi sistem absensi</p>
      </div>

      <Tabs defaultValue="umum" className="space-y-6">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6 overflow-x-auto">
          <TabsTrigger
            value="umum"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium transition-all hover:text-primary whitespace-nowrap"
          >
            Umum
          </TabsTrigger>
          <TabsTrigger
            value="jam-kerja"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium transition-all hover:text-primary whitespace-nowrap"
          >
            Jam Kerja
          </TabsTrigger>
          <TabsTrigger
            value="hari-libur"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium transition-all hover:text-primary whitespace-nowrap"
          >
            Hari Libur
          </TabsTrigger>
          <TabsTrigger
            value="keamanan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium transition-all hover:text-primary whitespace-nowrap"
          >
            Keamanan
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Umum - Informasi Organisasi + Logo */}
        <TabsContent value="umum">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="w-5 h-5 text-primary" />
                Informasi Organisasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="village_name">Nama Desa / Organisasi</Label>
                  <Input
                    id="village_name"
                    value={formData.village_name}
                    onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                    placeholder="Contoh: Desa Sukamaju"
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officer_name">Nama Petugas</Label>
                  <Input
                    id="officer_name"
                    value={formData.officer_name}
                    onChange={(e) => setFormData({ ...formData, officer_name: e.target.value })}
                    placeholder="Contoh: Pak Budi"
                    className="max-w-md"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-4">
                <Label>Logo Organisasi</Label>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Current Logo Preview */}
                  {settings?.logo_url ? (
                    <div className="relative group overflow-hidden rounded-lg border bg-background w-32 h-32 flex items-center justify-center">
                      <img
                        src={`${API_BASE_URL}${settings.logo_url}`}
                        alt="Logo"
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={handleDeleteLogo}
                          disabled={isDeletingLogo}
                          className="h-8 w-8"
                        >
                          {isDeletingLogo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground bg-secondary/10">
                      <span className="text-xs">Tidak ada logo</span>
                    </div>
                  )}

                  <div className="flex-1 max-w-sm space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="flex-1 file:text-primary"
                      />
                    </div>
                    <Button
                      onClick={handleUploadLogo}
                      disabled={!logoFile || isUploadingLogo}
                      size="sm"
                      variant="secondary"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Logo Baru
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Format: JPG, PNG, atau SVG. Maksimal file size 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Jam Kerja - Global Settings + Daily Schedule */}
        <TabsContent value="jam-kerja" className="space-y-8">
          {/* Pengaturan Umum Jam Kerja */}
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-5 h-5 text-primary" />
                Pengaturan Umum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                <div className="space-y-2 max-w-md w-full">
                  <Label htmlFor="late_threshold">Toleransi Terlambat (menit)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Waktu toleransi sebelum status dianggap 'Terlambat' setelah jam masuk.
                  </p>
                  <Input
                    id="late_threshold"
                    type="number"
                    min={0}
                    max={60}
                    value={formData.late_threshold_minutes}
                    onChange={(e) => setFormData({ ...formData, late_threshold_minutes: Number(e.target.value) })}
                    className="max-w-[150px]"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSave} disabled={isSaving} className="min-w-[100px]">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Simpan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jadwal Kerja Mingguan */}
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-5 h-5 text-primary" />
                Jadwal Kerja Mingguan
              </CardTitle>
              <Button onClick={handleSaveSchedules} disabled={isSavingSchedules}>
                {isSavingSchedules ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Jadwal
              </Button>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border bg-background overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[15%]">Hari</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground w-[15%]">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Jam Masuk</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Batas Masuk</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Jam Pulang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {schedules.sort((a, b) => a.day_of_week - b.day_of_week).map((schedule) => (
                      <tr key={schedule.day_of_week} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{getDayName(schedule.day_of_week)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <Switch
                              checked={schedule.is_workday}
                              onCheckedChange={(checked) => handleScheduleChange(schedule.day_of_week, 'is_workday', checked)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="time"
                            value={schedule.check_in_start}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_start', e.target.value)}
                            disabled={!schedule.is_workday}
                            className="h-8 text-center mx-auto max-w-[100px] bg-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="time"
                            value={schedule.check_in_end}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_end', e.target.value)}
                            disabled={!schedule.is_workday}
                            className="h-8 text-center mx-auto max-w-[100px] bg-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="time"
                            value={schedule.check_out_start}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_out_start', e.target.value)}
                            disabled={!schedule.is_workday}
                            className="h-8 text-center mx-auto max-w-[100px] bg-transparent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {schedules.sort((a, b) => a.day_of_week - b.day_of_week).map((schedule) => (
                  <div key={schedule.day_of_week} className={`p-4 rounded-lg border ${schedule.is_workday ? 'bg-card' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold">{getDayName(schedule.day_of_week)}</span>
                      <Switch
                        checked={schedule.is_workday}
                        onCheckedChange={(checked) => handleScheduleChange(schedule.day_of_week, 'is_workday', checked)}
                      />
                    </div>

                    {schedule.is_workday && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Masuk</Label>
                          <Input
                            type="time"
                            value={schedule.check_in_start}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_start', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Batas</Label>
                          <Input
                            type="time"
                            value={schedule.check_in_end}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_in_end', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Pulang</Label>
                          <Input
                            type="time"
                            value={schedule.check_out_start}
                            onChange={(e) => handleScheduleChange(schedule.day_of_week, 'check_out_start', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hari-libur" className="space-y-6">
          {/* Year Selector */}
          <div className="flex justify-center mb-6 md:mb-8 px-2">
            <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-muted/20 rounded-full border border-border/50 backdrop-blur-sm shadow-sm ring-1 ring-border/50 overflow-x-auto max-w-full">
              {(() => {
                const currentYear = new Date().getFullYear();
                const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
                return years.map((year) => {
                  const isSelected = selectedYear === year;
                  const isCurrent = year === currentYear;
                  return (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        fetchHolidays(year);
                      }}
                      className={`relative px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors z-10 whitespace-nowrap ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeYear"
                          className="absolute inset-0 bg-primary rounded-full -z-10 shadow-sm"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative flex items-center gap-1 sm:gap-1.5">
                        {year}
                        {isCurrent && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
                        )}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{holidays.length}</p>
              <p className="text-sm text-blue-700/70 dark:text-blue-300/70">Total Libur</p>
            </div>
            <div className="p-4 rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{holidays.filter(h => h.is_auto).length}</p>
              <p className="text-sm text-purple-700/70 dark:text-purple-300/70">Dari API</p>
            </div>
            <div className="p-4 rounded-xl border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{holidays.filter(h => !h.is_auto).length}</p>
              <p className="text-sm text-green-700/70 dark:text-green-300/70">Manual</p>
            </div>
            <div className="p-4 rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{holidays.filter(h => h.is_cuti).length}</p>
              <p className="text-sm text-orange-700/70 dark:text-orange-300/70">Cuti Bersama</p>
            </div>
          </div>

          {/* Main Card */}
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="w-5 h-5 text-primary" />
                  Hari Libur {selectedYear}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Kelola hari libur nasional dan cuti bersama
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncHolidays}
                  disabled={isSyncingHolidays}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  {isSyncingHolidays ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync dari API
                </Button>
                <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Manual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tambah Hari Libur Manual</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
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
                        <Label htmlFor="holiday_name">Nama/Keterangan</Label>
                        <Input
                          id="holiday_name"
                          value={newHoliday.name}
                          onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                          placeholder="Contoh: Cuti Khusus Kantor"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button onClick={handleAddHoliday}>
                          Simpan
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isExcludedDialogOpen} onOpenChange={(open) => {
                  setIsExcludedDialogOpen(open);
                  if (open) fetchExcludedHolidays();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-muted-foreground">
                      <Undo2 className="w-4 h-4 mr-2" />
                      Yang Dihapus
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Hari Libur yang Dihapus ({selectedYear})</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                      {excludedHolidays.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Undo2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p>Tidak ada hari libur yang dihapus</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {excludedHolidays.map((holiday) => (
                            <div
                              key={holiday.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div>
                                <p className="font-medium">{holiday.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(holiday.date).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                  })}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreHoliday(holiday.id)}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <Undo2 className="w-4 h-4 mr-1" />
                                Kembalikan
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">Belum ada hari libur</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Klik "Sync dari API" untuk mengambil hari libur nasional
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleSyncHolidays}
                    disabled={isSyncingHolidays}
                  >
                    {isSyncingHolidays ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync Sekarang
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-xl border overflow-hidden bg-background">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tanggal</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Keterangan</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Sumber</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {holidays.map((holiday) => (
                          <tr key={holiday.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {new Date(holiday.date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(holiday.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium">{holiday.name}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {holiday.is_auto ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                  <RefreshCw className="w-3 h-3" />
                                  API
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                  <User className="w-3 h-3" />
                                  Manual
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {holiday.is_cuti ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                                  Cuti Bersama
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Libur Nasional</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteHoliday(holiday.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {holidays.map((holiday) => (
                      <div key={holiday.id} className="p-4 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{holiday.name}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {new Date(holiday.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {holiday.is_auto ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                  API
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                  Manual
                                </span>
                              )}
                              {holiday.is_cuti ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                                  Cuti Bersama
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  Libur Nasional
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="hover:text-destructive h-8 w-8 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Keamanan */}
        <TabsContent value="keamanan">
          <Card className="border-none shadow-sm bg-card/50 max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="w-5 h-5 text-primary" />
                Ganti Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
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
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="min-w-[140px]"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Ubah Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </motion.div >
  );
}
