// Buku Tamu Types

export interface GuestBookEntry {
  id: number;
  name: string;
  institution: string;
  purpose: string;
  visitDate: Date;
  createdAt: Date;
}

export interface GuestBookFormData {
  name: string;
  institution: string;
  purpose: string;
  visit_date: string; // YYYY-MM-DD format
}

// Backend response types
export interface BackendGuestBookEntry {
  id: number;
  name: string;
  institution: string;
  purpose: string;
  visit_date: string;
  created_at: string;
}

export interface BackendGuestBookListResponse {
  items: BackendGuestBookEntry[];
  total: number;
  page: number;
  per_page: number;
}
