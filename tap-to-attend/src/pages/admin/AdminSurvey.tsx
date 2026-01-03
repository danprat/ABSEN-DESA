import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Download, Loader2, Calendar, BarChart3, MessageSquare, 
  Settings2, Plus, Trash2, GripVertical, Edit, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  BackendServiceType,
  BackendSurveyQuestion,
  BackendSurveyStats,
  SatisfactionRating,
  SATISFACTION_LABELS,
  SATISFACTION_ICONS,
  SATISFACTION_COLORS,
} from '@/types/survey';

export function AdminSurvey() {
  const [activeTab, setActiveTab] = useState('laporan');
  
  // Laporan state
  const [stats, setStats] = useState<BackendSurveyStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter state
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  
  // Questions state
  const [questions, setQuestions] = useState<BackendSurveyQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BackendSurveyQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'rating' as 'rating' | 'text' | 'multiple_choice',
    is_required: true,
  });
  
  // Service types state
  const [serviceTypes, setServiceTypes] = useState<BackendServiceType[]>([]);
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(true);
  const [isServiceTypeDialogOpen, setIsServiceTypeDialogOpen] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<BackendServiceType | null>(null);
  const [newServiceTypeName, setNewServiceTypeName] = useState('');

  // Fetch stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await api.admin.survey.responses.stats({
        start_date: startDate,
        end_date: endDate,
        service_type_id: filterServiceType !== 'all' ? parseInt(filterServiceType) : undefined,
      });
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Gagal memuat statistik survey');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch questions
  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const data = await api.admin.survey.questions.list(true);
      setQuestions(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Gagal memuat pertanyaan');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Fetch service types
  const fetchServiceTypes = async () => {
    setIsLoadingServiceTypes(true);
    try {
      const data = await api.admin.survey.serviceTypes.list();
      setServiceTypes(data);
    } catch (error) {
      console.error('Failed to fetch service types:', error);
      toast.error('Gagal memuat jenis layanan');
    } finally {
      setIsLoadingServiceTypes(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchQuestions();
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    if (activeTab === 'laporan') {
      fetchStats();
    }
  }, [startDate, endDate, filterServiceType]);

  // Export handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.admin.survey.responses.export({
        start_date: startDate,
        end_date: endDate,
        service_type_id: filterServiceType !== 'all' ? parseInt(filterServiceType) : undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-kepuasan_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Berhasil export data survey');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Gagal export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Question handlers
  const handleSaveQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      toast.error('Teks pertanyaan harus diisi');
      return;
    }

    try {
      if (editingQuestion) {
        await api.admin.survey.questions.update(editingQuestion.id, {
          question_text: newQuestion.question_text,
          is_required: newQuestion.is_required,
        });
        toast.success('Pertanyaan berhasil diperbarui');
      } else {
        await api.admin.survey.questions.create(newQuestion);
        toast.success('Pertanyaan berhasil ditambahkan');
      }
      
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      setNewQuestion({ question_text: '', question_type: 'rating', is_required: true });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      toast.error('Gagal menyimpan pertanyaan');
    }
  };

  const handleToggleQuestion = async (question: BackendSurveyQuestion) => {
    try {
      await api.admin.survey.questions.update(question.id, {
        is_active: !question.is_active,
      });
      toast.success(question.is_active ? 'Pertanyaan dinonaktifkan' : 'Pertanyaan diaktifkan');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to toggle question:', error);
      toast.error('Gagal mengubah status pertanyaan');
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await api.admin.survey.questions.delete(id);
      toast.success('Pertanyaan berhasil dihapus');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      toast.error('Gagal menghapus pertanyaan');
    }
  };

  // Service type handlers
  const handleSaveServiceType = async () => {
    if (!newServiceTypeName.trim()) {
      toast.error('Nama jenis layanan harus diisi');
      return;
    }

    try {
      if (editingServiceType) {
        await api.admin.survey.serviceTypes.update(editingServiceType.id, {
          name: newServiceTypeName,
        });
        toast.success('Jenis layanan berhasil diperbarui');
      } else {
        await api.admin.survey.serviceTypes.create({ name: newServiceTypeName });
        toast.success('Jenis layanan berhasil ditambahkan');
      }
      
      setIsServiceTypeDialogOpen(false);
      setEditingServiceType(null);
      setNewServiceTypeName('');
      fetchServiceTypes();
    } catch (error) {
      console.error('Failed to save service type:', error);
      toast.error('Gagal menyimpan jenis layanan');
    }
  };

  const handleToggleServiceType = async (serviceType: BackendServiceType) => {
    try {
      await api.admin.survey.serviceTypes.update(serviceType.id, {
        is_active: !serviceType.is_active,
      });
      toast.success(serviceType.is_active ? 'Jenis layanan dinonaktifkan' : 'Jenis layanan diaktifkan');
      fetchServiceTypes();
    } catch (error) {
      console.error('Failed to toggle service type:', error);
      toast.error('Gagal mengubah status');
    }
  };

  const handleDeleteServiceType = async (id: number) => {
    try {
      await api.admin.survey.serviceTypes.delete(id);
      toast.success('Jenis layanan berhasil dihapus');
      fetchServiceTypes();
    } catch (error) {
      console.error('Failed to delete service type:', error);
      toast.error('Gagal menghapus jenis layanan');
    }
  };

  // Calculate percentages
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const satisfactionOrder: SatisfactionRating[] = ['sangat_puas', 'puas', 'cukup_puas', 'tidak_puas'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Survey Kepuasan</h1>
        <p className="text-muted-foreground">Kelola survey dan lihat hasil</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
          <TabsTrigger
            value="laporan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Laporan
          </TabsTrigger>
          <TabsTrigger
            value="pertanyaan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Kelola Pertanyaan
          </TabsTrigger>
          <TabsTrigger
            value="layanan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Jenis Layanan
          </TabsTrigger>
        </TabsList>

        {/* TAB: Laporan */}
        <TabsContent value="laporan" className="space-y-6">
          {/* Filters */}
          <Card className="border-none shadow-sm bg-card/50">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-[200px]">
                  <Label className="text-xs text-muted-foreground">Jenis Layanan</Label>
                  <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Layanan</SelectItem>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} disabled={isExporting} variant="outline">
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : stats ? (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-4">
                    <p className="text-3xl font-bold text-primary">{stats.total_responses}</p>
                    <p className="text-sm text-muted-foreground">Total Responden</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10">
                  <CardContent className="p-4">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {getPercentage(stats.rating_distribution['sangat_puas'] || 0, stats.total_responses)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Sangat Puas</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10">
                  <CardContent className="p-4">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.by_filled_by.sendiri}
                    </p>
                    <p className="text-sm text-muted-foreground">Isi Sendiri</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10">
                  <CardContent className="p-4">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.by_filled_by.diwakilkan}
                    </p>
                    <p className="text-sm text-muted-foreground">Diwakilkan</p>
                  </CardContent>
                </Card>
              </div>

              {/* Rating distribution */}
              <Card className="border-none shadow-sm bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-amber-500" />
                    Distribusi Kepuasan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {satisfactionOrder.map((rating) => {
                      const count = stats.rating_distribution[rating] || 0;
                      const percentage = getPercentage(count, stats.total_responses);
                      return (
                        <div key={rating} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="text-xl">{SATISFACTION_ICONS[rating]}</span>
                              {SATISFACTION_LABELS[rating]}
                            </span>
                            <span className="font-medium">{percentage}% ({count})</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${SATISFACTION_COLORS[rating]} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Per service type */}
              {stats.by_service_type.length > 0 && (
                <Card className="border-none shadow-sm bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                      Per Jenis Layanan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.by_service_type.map((item) => {
                        const dominantRating = satisfactionOrder.reduce((prev, curr) =>
                          (item.rating_distribution[curr] || 0) > (item.rating_distribution[prev] || 0) ? curr : prev
                        );
                        const dominantPercent = getPercentage(
                          item.rating_distribution[dominantRating] || 0,
                          item.total
                        );
                        return (
                          <div key={item.service_type_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div>
                              <p className="font-medium">{item.service_type_name}</p>
                              <p className="text-sm text-muted-foreground">{item.total} responden</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {dominantPercent}% {SATISFACTION_LABELS[dominantRating]}
                              </p>
                              <p className="text-xl">{SATISFACTION_ICONS[dominantRating]}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data survey</p>
            </div>
          )}
        </TabsContent>

        {/* TAB: Kelola Pertanyaan */}
        <TabsContent value="pertanyaan" className="space-y-6">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
                Daftar Pertanyaan Survey
              </CardTitle>
              <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingQuestion(null);
                      setNewQuestion({ question_text: '', question_type: 'rating', is_required: true });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Pertanyaan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Teks Pertanyaan</Label>
                      <Input
                        value={newQuestion.question_text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                        placeholder="Contoh: Bagaimana kepuasan Anda?"
                      />
                    </div>
                    {!editingQuestion && (
                      <div className="space-y-2">
                        <Label>Tipe Pertanyaan</Label>
                        <Select
                          value={newQuestion.question_type}
                          onValueChange={(value) => setNewQuestion({ ...newQuestion, question_type: value as 'rating' | 'text' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rating">Rating (Sangat Puas - Tidak Puas)</SelectItem>
                            <SelectItem value="text">Teks Bebas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label>Wajib Diisi</Label>
                      <Switch
                        checked={newQuestion.is_required}
                        onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, is_required: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleSaveQuestion}>
                      {editingQuestion ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada pertanyaan survey</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${
                        question.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'
                      }`}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {index + 1}. {question.question_text}
                              {question.is_required && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Tipe: {question.question_type === 'rating' ? 'Rating' : 'Teks'}
                              {!question.is_active && ' • Nonaktif'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={question.is_active}
                              onCheckedChange={() => handleToggleQuestion(question)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingQuestion(question);
                                setNewQuestion({
                                  question_text: question.question_text,
                                  question_type: question.question_type,
                                  is_required: question.is_required,
                                });
                                setIsQuestionDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Pertanyaan?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Pertanyaan ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Jenis Layanan */}
        <TabsContent value="layanan" className="space-y-6">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-primary" />
                Jenis Layanan
              </CardTitle>
              <Dialog open={isServiceTypeDialogOpen} onOpenChange={setIsServiceTypeDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingServiceType(null);
                      setNewServiceTypeName('');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Layanan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingServiceType ? 'Edit Jenis Layanan' : 'Tambah Jenis Layanan'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nama Jenis Layanan</Label>
                      <Input
                        value={newServiceTypeName}
                        onChange={(e) => setNewServiceTypeName(e.target.value)}
                        placeholder="Contoh: Kependudukan"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsServiceTypeDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleSaveServiceType}>
                      {editingServiceType ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingServiceTypes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : serviceTypes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada jenis layanan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        type.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{type.name}</p>
                        {!type.is_active && (
                          <p className="text-sm text-muted-foreground">Nonaktif</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={type.is_active}
                          onCheckedChange={() => handleToggleServiceType(type)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingServiceType(type);
                            setNewServiceTypeName(type.name);
                            setIsServiceTypeDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Jenis Layanan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Jenis layanan "{type.name}" akan dihapus. Pastikan tidak ada survey yang menggunakan jenis layanan ini.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteServiceType(type.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
