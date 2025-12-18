import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, UserPlus, Edit2, Trash2, Settings, RefreshCw, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, BackendAuditLog } from '@/lib/api';

const actionConfig: Record<string, { label: string; color: string; icon: typeof UserPlus }> = {
  create: { label: 'Tambah', color: 'bg-green-500', icon: UserPlus },
  update: { label: 'Edit', color: 'bg-blue-500', icon: Edit2 },
  delete: { label: 'Hapus', color: 'bg-red-500', icon: Trash2 },
  correct: { label: 'Koreksi', color: 'bg-yellow-500', icon: RefreshCw },
};

const entityConfig: Record<string, string> = {
  employee: 'Pegawai',
  attendance: 'Absensi',
  settings: 'Pengaturan',
  holiday: 'Hari Libur',
};

export function AdminLog() {
  const [logs, setLogs] = useState<BackendAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: { action?: string; entity_type?: string; page_size?: number } = {
        page_size: 50,
      };
      if (filterAction !== 'all') params.action = filterAction;
      if (filterEntity !== 'all') params.entity_type = filterEntity;
      
      const response = await api.admin.auditLogs.list(params);
      setLogs(response.items);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.performed_by.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat log aktivitas...</p>
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Log Aktivitas</h1>
        <p className="text-muted-foreground">Riwayat aksi admin dan perubahan sistem</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari aktivitas..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="create">Tambah</SelectItem>
                  <SelectItem value="update">Edit</SelectItem>
                  <SelectItem value="delete">Hapus</SelectItem>
                  <SelectItem value="correct">Koreksi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter Entitas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Entitas</SelectItem>
                  <SelectItem value="employee">Pegawai</SelectItem>
                  <SelectItem value="attendance">Absensi</SelectItem>
                  <SelectItem value="settings">Pengaturan</SelectItem>
                  <SelectItem value="holiday">Hari Libur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada aktivitas ditemukan
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const config = actionConfig[log.action] || { label: log.action, color: 'bg-gray-500', icon: FileText };
                  const Icon = config.icon;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 py-2 hover:bg-secondary/30 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full ${config.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{log.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{log.performed_by}</span>
                          <span>•</span>
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {config.label}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {entityConfig[log.entity_type] || log.entity_type}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
