import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowLeft, Send, Loader2, CheckCircle, User, Building2, FileText, Calendar, Home, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/Header';
import { useSettings } from '@/hooks/useSettings';
import api from '@/lib/api';
import { toast } from 'sonner';

// Mock data flag
const USE_MOCK_DATA = true;

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center justify-center gap-2 mb-4">
    {Array.from({ length: totalSteps }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: i * 0.05 }}
        className={`h-2 rounded-full transition-all duration-500 ${
          i === currentStep 
            ? 'w-10 bg-emerald-500' 
            : i < currentStep 
              ? 'w-2 bg-emerald-400' 
              : 'w-2 bg-muted'
        }`}
      />
    ))}
  </div>
);

// Kiosk-optimized Guest Book with large touch targets
export function BukuTamu() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [currentStep, setCurrentStep] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const totalSteps = 4; // Name, Institution, Purpose, Date
  
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    purpose: '',
    visit_date: new Date().toISOString().split('T')[0],
  });

  // Auto-focus name input on mount
  useEffect(() => {
    if (currentStep === 0 && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentStep]);

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

  const canProceed = () => {
    if (currentStep === 0) return formData.name.trim() !== '';
    if (currentStep === 1) return formData.institution.trim() !== '';
    if (currentStep === 2) return formData.purpose.trim() !== '';
    if (currentStep === 3) return formData.visit_date !== '';
    return true;
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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
      if (USE_MOCK_DATA) {
        // Simulasi submit
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSuccess(true);
        toast.success('Data berhasil disimpan!');
      } else {
        await api.guestBook.submit(formData);
        setIsSuccess(true);
        toast.success('Data berhasil disimpan!');
      }
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
      <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10 overflow-hidden">
        <Header villageName={settings.villageName} officerName={settings.officerName} logoUrl={settings.logoUrl} />
        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 max-w-xl"
          >
            {/* Success Animation */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
              className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40"
            >
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h2 className="text-3xl font-bold text-foreground">Terima Kasih! 🙏</h2>
              <p className="text-lg text-muted-foreground">
                Data kunjungan Anda telah tercatat
              </p>
            </motion.div>

            {/* Countdown */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-3xl p-4 space-y-1 border border-emerald-500/20"
            >
              <p className="text-muted-foreground font-medium">Kembali ke beranda dalam</p>
              <div className="text-4xl font-bold bg-gradient-to-br from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                {countdown}
              </div>
              <p className="text-sm text-muted-foreground">detik</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/">
                <Button size="lg" className="h-12 px-10 text-lg rounded-2xl gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all">
                  <Home className="w-5 h-5" />
                  Kembali Sekarang
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  const renderStepContent = () => {
    // Step 0: Name
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 mx-auto mb-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Nama Lengkap</h2>
            <p className="text-sm text-muted-foreground">Siapa nama Anda?</p>
          </div>
          
          <div>
            <Input
              ref={nameInputRef}
              placeholder="Ketik nama lengkap Anda..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-14 text-lg px-5 rounded-xl border-2 focus:border-emerald-500 focus:ring-emerald-500/20 text-center"
              onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
            />
          </div>
        </div>
      );
    }

    // Step 1: Institution
    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 mx-auto mb-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Instansi / Asal</h2>
            <p className="text-sm text-muted-foreground">Dari mana Anda berasal?</p>
          </div>
          
          <div>
            <Input
              placeholder="Contoh: Dinas Pendidikan, Masyarakat Umum..."
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="h-14 text-lg px-5 rounded-xl border-2 focus:border-emerald-500 focus:ring-emerald-500/20 text-center"
              onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
            />
          </div>
        </div>
      );
    }

    // Step 2: Purpose
    if (currentStep === 2) {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 mx-auto mb-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Keperluan</h2>
            <p className="text-sm text-muted-foreground">Apa keperluan kunjungan Anda?</p>
          </div>
          
          <div>
            <Textarea
              placeholder="Jelaskan keperluan kunjungan Anda..."
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={4}
              className="text-lg px-5 py-4 rounded-xl border-2 resize-none focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      );
    }

    // Step 3: Date
    if (currentStep === 3) {
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = formData.visit_date === todayStr;
      
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 mx-auto mb-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Tanggal Kunjungan</h2>
            <p className="text-sm text-muted-foreground">Kapan Anda berkunjung?</p>
          </div>
          
          <div className="space-y-2">
            <Input
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              className="h-14 text-lg px-5 rounded-xl border-2 focus:border-emerald-500 focus:ring-emerald-500/20 text-center"
            />
            {isToday && (
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Hari ini
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  // Form State - Survey-like UX
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10 overflow-hidden">
      <Header villageName={settings.villageName} officerName={settings.officerName} logoUrl={settings.logoUrl} />
      
      <main className="flex-1 flex flex-col px-4 py-3 overflow-hidden">
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="text-center mb-2">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"
            >
              <BookOpen className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Buku Tamu</h1>
            {USE_MOCK_DATA && (
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Mode Demo • Data tidak disimpan
              </p>
            )}
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

          {/* Content Card */}
          <div className="flex-1 bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border-0 p-4 md:p-6 flex flex-col min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              {currentStep === 0 ? (
                <Link to="/" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-lg rounded-xl gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali
                  </Button>
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handlePrev}
                  className="flex-1 h-12 text-lg rounded-xl gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Sebelumnya
                </Button>
              )}

              {isLastStep ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed()}
                  className="flex-1 h-12 text-lg rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Kirim Data
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 h-12 text-lg rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                >
                  Selanjutnya
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BukuTamu;