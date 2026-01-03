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
              {/* Overview Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Responses */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{stats.total_responses}</p>
                        <p className="text-sm text-muted-foreground">Total Responden</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Satisfaction Score */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <span className="text-2xl">😊</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {stats.total_responses > 0 
                            ? Math.round(((stats.rating_distribution['sangat_puas'] || 0) + (stats.rating_distribution['puas'] || 0)) / stats.total_responses * 100)
                            : 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Puas & Sangat Puas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Self-filled */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.by_filled_by.sendiri}
                        </p>
                        <p className="text-sm text-muted-foreground">Mengisi Sendiri</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Representative */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {stats.by_filled_by.diwakilkan}
                        </p>
                        <p className="text-sm text-muted-foreground">Diwakilkan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pie Chart - Satisfaction Overview */}
              <Card className="border-none shadow-lg bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-amber-500" />
                    Distribusi Tingkat Kepuasan
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Berdasarkan rata-rata penilaian setiap responden</p>
                </CardHeader>
                <CardContent className="pt-4">
                  {stats.total_responses > 0 ? (
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Pie Chart */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-64 h-64">
                          <svg viewBox="0 0 200 200" className="transform -rotate-90">
                            {(() => {
                              let currentAngle = 0;
                              const colors = {
                                sangat_puas: '#10b981',
                                puas: '#3b82f6',
                                cukup_puas: '#f59e0b',
                                tidak_puas: '#ef4444',
                              };
                              
                              return satisfactionOrder.map((rating) => {
                                const count = stats.rating_distribution[rating] || 0;
                                const percentage = getPercentage(count, stats.total_responses);
                                const angle = (percentage / 100) * 360;
                                
                                if (percentage === 0) return null;
                                
                                const startAngle = currentAngle;
                                const endAngle = currentAngle + angle;
                                currentAngle = endAngle;
                                
                                const startRad = (startAngle * Math.PI) / 180;
                                const endRad = (endAngle * Math.PI) / 180;
                                
                                const x1 = 100 + 80 * Math.cos(startRad);
                                const y1 = 100 + 80 * Math.sin(startRad);
                                const x2 = 100 + 80 * Math.cos(endRad);
                                const y2 = 100 + 80 * Math.sin(endRad);
                                
                                const largeArc = angle > 180 ? 1 : 0;
                                
                                return (
                                  <motion.path
                                    key={rating}
                                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                    fill={colors[rating]}
                                    stroke="white"
                                    strokeWidth="2"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                );
                              });
                            })()}
                            {/* Center circle for donut effect */}
                            <circle cx="100" cy="100" r="50" fill="hsl(var(--card))" />
                            <text
                              x="100"
                              y="95"
                              textAnchor="middle"
                              className="fill-foreground text-2xl font-bold"
                              transform="rotate(90 100 100)"
                            >
                              {stats.total_responses}
                            </text>
                            <text
                              x="100"
                              y="110"
                              textAnchor="middle"
                              className="fill-muted-foreground text-xs"
                              transform="rotate(90 100 100)"
                            >
                              Responden
                            </text>
                          </svg>
                        </div>
                        
                        {/* Legend */}
                        <div className="mt-6 space-y-2 w-full">
                          {satisfactionOrder.map((rating) => {
                            const count = stats.rating_distribution[rating] || 0;
                            const percentage = getPercentage(count, stats.total_responses);
                            const colorMap = {
                              sangat_puas: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                              puas: { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
                              cukup_puas: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
                              tidak_puas: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
                            };
                            const colors = colorMap[rating];
                            
                            return (
                              <div key={rating} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                                  <span className="text-sm font-medium">{SATISFACTION_LABELS[rating]}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${colors.text}`}>{percentage}%</span>
                                  <span className="text-xs text-muted-foreground">({count})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Bar Chart */}
                      <div className="space-y-5">
                        {satisfactionOrder.map((rating) => {
                          const count = stats.rating_distribution[rating] || 0;
                          const percentage = getPercentage(count, stats.total_responses);
                          const colorMap = {
                            sangat_puas: { bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
                            puas: { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
                            cukup_puas: { bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
                            tidak_puas: { bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
                          };
                          const colors = colorMap[rating];
                          
                          return (
                            <div key={rating} className="group">
                              <div className="flex items-center gap-4 mb-2">
                                <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center shrink-0`}>
                                  <span className="text-xl">{SATISFACTION_ICONS[rating]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-foreground">
                                      {SATISFACTION_LABELS[rating]}
                                    </span>
                                    <span className={`font-bold ${colors.text}`}>
                                      {percentage}%
                                    </span>
                                  </div>
                                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                      className={`h-full ${colors.bg} rounded-full`}
                                    />
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full ${colors.light} ${colors.text} text-sm font-semibold shrink-0`}>
                                  {count} orang
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada data kepuasan pada periode ini</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Type Statistics - Enhanced */}
              {stats.by_service_type.length > 0 && (
                <Card className="border-none shadow-lg bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                      Statistik Per Jenis Layanan
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Perbandingan kepuasan untuk setiap jenis layanan</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-6">
                      {stats.by_service_type.map((item) => {
                        // Calculate satisfaction percentage for this service
                        const satisfiedCount = (item.rating_distribution['sangat_puas'] || 0) + (item.rating_distribution['puas'] || 0);
                        const satisfactionPercent = item.total > 0 ? Math.round(satisfiedCount / item.total * 100) : 0;
                        
                        // Determine satisfaction level color
                        let satisfactionColor = 'bg-red-500';
                        let satisfactionTextColor = 'text-red-600 dark:text-red-400';
                        let satisfactionBg = 'bg-red-50 dark:bg-red-900/20';
                        if (satisfactionPercent >= 80) {
                          satisfactionColor = 'bg-emerald-500';
                          satisfactionTextColor = 'text-emerald-600 dark:text-emerald-400';
                          satisfactionBg = 'bg-emerald-50 dark:bg-emerald-900/20';
                        } else if (satisfactionPercent >= 60) {
                          satisfactionColor = 'bg-blue-500';
                          satisfactionTextColor = 'text-blue-600 dark:text-blue-400';
                          satisfactionBg = 'bg-blue-50 dark:bg-blue-900/20';
                        } else if (satisfactionPercent >= 40) {
                          satisfactionColor = 'bg-amber-500';
                          satisfactionTextColor = 'text-amber-600 dark:text-amber-400';
                          satisfactionBg = 'bg-amber-50 dark:bg-amber-900/20';
                        }
                        
                        return (
                          <div key={item.service_type_id} className={`p-5 rounded-xl ${satisfactionBg} transition-all hover:scale-[1.01]`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl ${satisfactionBg} border-2 border-current flex items-center justify-center`}>
                                  <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg text-foreground">{item.service_type_name}</p>
                                  <p className="text-sm text-muted-foreground">{item.total} responden</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-3xl font-bold ${satisfactionTextColor}`}>
                                  {satisfactionPercent}%
                                </p>
                                <p className="text-xs text-muted-foreground">tingkat kepuasan</p>
                              </div>
                            </div>
                            
                            {/* Horizontal stacked bar */}
                            <div className="mb-4">
                              <div className="flex gap-0.5 h-4 rounded-full overflow-hidden bg-muted/30">
                                {satisfactionOrder.map((rating) => {
                                  const count = item.rating_distribution[rating] || 0;
                                  const percent = item.total > 0 ? (count / item.total) * 100 : 0;
                                  return (
                                    <motion.div
                                      key={rating}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percent}%` }}
                                      transition={{ duration: 0.6 }}
                                      className={`${SATISFACTION_COLORS[rating]}`}
                                      title={`${SATISFACTION_LABELS[rating]}: ${Math.round(percent)}%`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Detailed breakdown */}
                            <div className="grid grid-cols-2 gap-2">
                              {satisfactionOrder.map((rating) => {
                                const count = item.rating_distribution[rating] || 0;
                                const percent = item.total > 0 ? Math.round((count / item.total) * 100) : 0;
                                const colorMap = {
                                  sangat_puas: 'text-emerald-600 dark:text-emerald-400',
                                  puas: 'text-blue-600 dark:text-blue-400',
                                  cukup_puas: 'text-amber-600 dark:text-amber-400',
                                  tidak_puas: 'text-red-600 dark:text-red-400',
                                };
                                
                                return (
                                  <div key={rating} className="flex items-center gap-2 text-xs">
                                    <span className="text-lg">{SATISFACTION_ICONS[rating]}</span>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{SATISFACTION_LABELS[rating]}</div>
                                      <div className={`font-bold ${colorMap[rating]}`}>
                                        {count} ({percent}%)
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Timeline Chart - Responses over time (if we have daily data) */}
              {stats.total_responses > 0 && (
                <Card className="border-none shadow-lg bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Ringkasan Statistik
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Average satisfaction score */}
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 rounded-xl">
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                          {(() => {
                            const total = stats.total_responses;
                            if (total === 0) return '0.0';
                            const weighted = 
                              (stats.rating_distribution['sangat_puas'] || 0) * 4 +
                              (stats.rating_distribution['puas'] || 0) * 3 +
                              (stats.rating_distribution['cukup_puas'] || 0) * 2 +
                              (stats.rating_distribution['tidak_puas'] || 0) * 1;
                            return (weighted / total).toFixed(1);
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Rata-rata Skor</div>
                        <div className="text-xs text-muted-foreground">(dari 4.0)</div>
                      </div>
                      
                      {/* Most common rating */}
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl">
                        <div className="text-2xl mb-1">
                          {(() => {
                            const max = Math.max(...satisfactionOrder.map(r => stats.rating_distribution[r] || 0));
                            const mostCommon = satisfactionOrder.find(r => stats.rating_distribution[r] === max);
                            return SATISFACTION_ICONS[mostCommon || 'puas'];
                          })()}
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {(() => {
                            const max = Math.max(...satisfactionOrder.map(r => stats.rating_distribution[r] || 0));
                            const mostCommon = satisfactionOrder.find(r => stats.rating_distribution[r] === max);
                            return SATISFACTION_LABELS[mostCommon || 'puas'];
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Paling Banyak</div>
                      </div>
                      
                      {/* Self-filled percentage */}
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10 rounded-xl">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {stats.total_responses > 0 ? Math.round((stats.by_filled_by.sendiri / stats.total_responses) * 100) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Mengisi Sendiri</div>
                      </div>
                      
                      {/* Service types count */}
                      <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl">
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                          {stats.by_service_type.length}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Jenis Layanan</div>
                        <div className="text-xs text-muted-foreground">Digunakan</div>
                      </div>
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
