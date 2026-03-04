'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarPlus } from 'lucide-react';
import { AppointmentFilters, AppointmentFilters as FiltersType } from '@/components/appointments/AppointmentFilters';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { fetchAppointments, updateAppointmentStatus, sendAppointmentConfirmation } from '@/lib/api/appointments';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, checkAuth } = useAuthStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<FiltersType['AppointmentFilters']>({});
  const [isFilterInitialized, setIsFilterInitialized] = useState(false);

  // Detail modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment & { expand?: { lead_id?: any } } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const statusParam = searchParams.get('status') as AppointmentStatus | null;
    const searchParam = searchParams.get('search');
    const pageParam = searchParams.get('page');

    const newFilters: FiltersType['AppointmentFilters'] = {};

    if (startParam) newFilters.startDate = startParam;
    if (endParam) newFilters.endDate = endParam;
    if (statusParam) newFilters.status = statusParam;
    if (searchParam) newFilters.search = searchParam;

    setFilters(newFilters);
    setIsFilterInitialized(true);

    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10));
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch appointments when filters or page changes
  const fetchAppointmentsData = useCallback(async () => {
    if (!isFilterInitialized) return;

    setLoading(true);
    try {
      const response = await fetchAppointments({
        page: currentPage,
        perPage: 20,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        search: filters.search,
        sort: '-scheduled_at',
      });

      // Expand lead data for each appointment
      const appointmentsWithLeads = await Promise.all(
        response.items.map(async (apt) => {
          if (apt.lead_id) {
            try {
              // Fetch lead data
              const leadResponse = await fetch(`/api/leads/${apt.lead_id}`).then(r => r.json());
              return { ...apt, expand: { lead_id: leadResponse } };
            } catch (error) {
              console.error('Error fetching lead for appointment:', error);
              return apt;
            }
          }
          return apt;
        })
      );

      setAppointments(appointmentsWithLeads);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, isFilterInitialized]);

  useEffect(() => {
    fetchAppointmentsData();
  }, [fetchAppointmentsData]);

  // Update URL when filters change
  useEffect(() => {
    if (!isFilterInitialized) return;

    const params = new URLSearchParams();

    if (filters.startDate) params.set('start', filters.startDate);
    if (filters.endDate) params.set('end', filters.endDate);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const queryString = params.toString();
    const newUrl = `/appointments${queryString ? '?' + queryString : ''}`;

    // Only update if different to avoid infinite loops
    if (window.location.search !== (queryString ? `?${queryString}` : '')) {
      router.replace(newUrl);
    }
  }, [filters, currentPage, isFilterInitialized, router]);

  const handleFilterChange = useCallback((newFilters: FiltersType['AppointmentFilters']) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDetail = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment as Appointment & { expand?: { lead_id?: any } });
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedAppointment(null);
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    setActionLoading(true);
    try {
      await updateAppointmentStatus(id, status);
      // Refresh appointments
      const response = await fetchAppointments({
        page: currentPage,
        perPage: 20,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        search: filters.search,
        sort: '-scheduled_at',
      });
      setAppointments(response.items as any[]);
      handleCloseDetailModal();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [currentPage, filters, handleCloseDetailModal]);

  const handleSendConfirmation = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      await sendAppointmentConfirmation(id);
      // Refresh appointments
      const response = await fetchAppointments({
        page: currentPage,
        perPage: 20,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        search: filters.search,
        sort: '-scheduled_at',
      });
      setAppointments(response.items as any[]);
    } catch (error) {
      console.error('Error sending confirmation:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [currentPage, filters]);

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false); // Close detail modal when opening edit
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingAppointment(null);
  }, []);

  // Active filter badges
  const activeFilters = useMemo(() => {
    const badges: { key: string; label: string; value: string }[] = [];
    if (filters.startDate) badges.push({ key: 'startDate', label: 'Başlangıç', value: filters.startDate });
    if (filters.endDate) badges.push({ key: 'endDate', label: 'Bitiş', value: filters.endDate });
    if (filters.status) badges.push({ key: 'status', label: 'Durum', value: filters.status });
    if (filters.search) badges.push({ key: 'search', label: 'Arama', value: filters.search });
    return badges;
  }, [filters]);

  const hasActiveFilters = activeFilters.length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Randevular</h1>
          <p className="text-muted-foreground">
            Randevularınızı görüntüleyin, arayın ve filtreleyin.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Yeni Randevu
        </Button>
      </div>

      {/* Filters */}
      <AppointmentFilters
        onFilterChange={handleFilterChange}
        loading={loading}
        initialFilters={filters}
      />

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="gap-1">
              {filter.label}: {filter.value}
              <button
                onClick={() => {
                  const newFilters = { ...filters };
                  delete newFilters[filter.key as keyof FiltersType['AppointmentFilters']];
                  handleFilterChange(newFilters);
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Tümünü Temizle
          </Button>
        </div>
      )}

      {/* Appointment List */}
      <AppointmentList
        appointments={appointments}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onDetail={handleDetail}
      />

      {/* Detail Modal */}
      <AppointmentDetailModal
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        appointment={selectedAppointment}
        onEdit={handleOpenEditModal}
        onUpdateStatus={handleUpdateStatus}
        onSendConfirmation={handleSendConfirmation}
        loading={actionLoading}
      />

      {/* Create Modal */}
      <AppointmentModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchAppointmentsData}
      />

      {/* Edit Modal */}
      <AppointmentModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={fetchAppointmentsData}
        appointment={editingAppointment || undefined}
      />
    </div>
  );
}
