import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface AppSettings {
  villageName: string;
  officerName: string;
  logoUrl: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  villageName: 'Desa',
  officerName: 'Admin',
  logoUrl: null,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.public.settings();
        setSettings({
          villageName: data.village_name,
          officerName: data.officer_name || 'Admin',
          logoUrl: data.logo_url || null,
        });
      } catch {
        // Use defaults if settings fetch fails
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return { settings, isLoading };
}
