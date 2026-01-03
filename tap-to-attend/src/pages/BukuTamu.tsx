import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowLeft, Send, Loader2, CheckCircle, User, Building2, FileText, Calendar, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/Header';
import { useSettings } from '@/hooks/useSettings';
import api from '@/lib/api';
import { toast } from 'sonner';

// Kiosk-optimized Guest Book with large touch targets
export function BukuTamu() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    purpose: '',
    visit_date: new Date().toISOString().split('T')[0],
  });

  // Auto-focus name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Countdown and auto-redirect after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nama lengkap harus diisi');
      return;
    }
    if (!formData.institution.trim()) {
      toast.error('Instansi/asal harus diisi');
      return;
    }
    if (!formData.purpose.trim()) {
      toast.error('Keperluan harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.guestBook.submit(formData);
      setIsSuccess(true);
      toast.success('Data berhasil disimpan!');
    } catch (error) {
      console.error('Failed to submit guest book:', error);
      toast.error('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State - Kiosk optimized
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10">
        <Header villageName={settings.villageName} officerName={settings.officerName} logoUrl={settings.logoUrl} />
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8 max-w-lg"
          >
            {/* Success Animation */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30"
            >
              <CheckCircle className="w-16 h-16 text-white" />
            </motion.div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-foreground">Terima Kasih! 🙏</h2>
              <p className="text-xl text-muted-foreground">
                Data kunjungan Anda telah tercatat
              </p>
            </div>

            {/* Countdown */}
            <div className="bg-muted/50 rounded-2xl p-6 space-y-2">
              <p className="text-muted-foreground">Kembali ke beranda dalam</p>
              <div className="text-5xl font-bold text-primary">{countdown}</div>
              <p className="text-sm text-muted-foreground">detik</p>
            </div>

            <Link to="/">
              <Button size="lg" className="h-16 px-12 text-xl rounded-2xl gap-3">
                <Home className="w-6 h-6" />
                Kembali Sekarang
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  // Form State - Kiosk optimized
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10">
      <Header villageName={settings.villageName} officerName={settings.officerName} logoUrl={settings.logoUrl} />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mx-auto"
        >
          {/* Header Card */}
          <div className="text-center mb-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"
            >
              <BookOpen className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Buku Tamu</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Silakan isi data kunjungan Anda
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border-0 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-lg font-medium flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={nameInputRef}
                  id="name"
                  placeholder="Ketik nama lengkap Anda..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  className="h-16 text-xl px-6 rounded-2xl border-2 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              {/* Institution Field */}
              <div className="space-y-3">
                <Label htmlFor="institution" className="text-lg font-medium flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Instansi / Asal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="institution"
                  placeholder="Contoh: Dinas Pendidikan, Masyarakat Umum..."
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  disabled={isSubmitting}
                  className="h-16 text-xl px-6 rounded-2xl border-2 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              {/* Purpose Field */}
              <div className="space-y-3">
                <Label htmlFor="purpose" className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Keperluan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="purpose"
                  placeholder="Jelaskan keperluan kunjungan Anda..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  disabled={isSubmitting}
                  rows={3}
                  className="text-xl px-6 py-4 rounded-2xl border-2 resize-none focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              {/* Date Field */}
              <div className="space-y-3">
                <Label htmlFor="visit_date" className="text-lg font-medium flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Tanggal Kunjungan
                </Label>
                <Input
                  id="visit_date"
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  disabled={isSubmitting}
                  className="h-16 text-xl px-6 rounded-2xl border-2 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full h-16 text-xl rounded-2xl gap-3"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-6 h-6" />
                    Kembali
                  </Button>
                </Link>
                
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 h-16 text-xl rounded-2xl gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Simpan Data
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default BukuTamu;