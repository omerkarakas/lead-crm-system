'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { useLeadsStore } from '@/lib/stores/leads';
import { LeadStatus, Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { LeadSearch } from '@/components/leads/LeadSearch';
import { LeadFilter } from '@/components/leads/LeadFilter';
import { LeadList } from '@/components/leads/LeadList';
import { LeadModal } from '@/components/leads/LeadModal';
import { useSearchParams } from 'next/navigation';

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, checkAuth } = useAuthStore();
  const {
    leads,
    loading,
    pagination,
    filters,
    fetchLeads,
    setFilters,
    clearError,
  } = useLeadsStore();

  const [sortField, setSortField] = useState<string>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Extract unique tags from leads
  const availableTags = useMemo(() => {
    const allTags = leads.flatMap((lead) => lead.tags);
    return Array.from(new Set(allTags)).sort();
  }, [leads]);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const statusParam = searchParams.get('status') as LeadStatus | null;
    const tagParam = searchParams.get('tag');
    const pageParam = searchParams.get('page');

    if (searchParam || statusParam || tagParam || pageParam) {
      setFilters({
        search: searchParam || '',
        status: statusParam || undefined,
        tags: tagParam ? [tagParam] : undefined,
      });
    }
  }, [searchParams, setFilters]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    fetchLeads({
      page,
      sort: `${sortOrder === 'asc' ? '' : '-'}${sortField}`,
    });
  }, [filters, sortField, sortOrder, searchParams, fetchLeads]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters({ search: value });
  }, [setFilters]);

  const handleStatusChange = useCallback((status: LeadStatus | undefined) => {
    setFilters({ status });
  }, [setFilters]);

  const handleTagChange = useCallback((tag: string | undefined) => {
    setFilters({ tags: tag ? [tag] : undefined });
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: undefined,
      tags: undefined,
    });
  }, [setFilters]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    const newUrl = `/leads${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl);
  }, [searchParams, router]);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const handleAddLead = useCallback(() => {
    setEditingLead(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  }, []);

  const handleEditLead = useCallback((lead: Lead) => {
    setEditingLead(lead);
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLead(undefined);
  }, []);

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    (filters.tags && filters.tags.length > 0)
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Müşteri Adayları</h1>
          <p className="text-muted-foreground">
            Leadlerinizi görüntüleyin, arayın ve filtreleyin.
          </p>
        </div>
        <Button onClick={handleAddLead}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <LeadSearch
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="İsim, telefon veya e-posta ile ara..."
          />
        </div>
        <LeadFilter
          statusFilter={filters.status}
          onStatusChange={handleStatusChange}
          tagFilter={filters.tags?.[0]}
          availableTags={availableTags}
          onTagChange={handleTagChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <LeadList
        leads={leads}
        loading={loading}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        onPageChange={handlePageChange}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        onEditLead={handleEditLead}
      />

      <LeadModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        lead={editingLead}
        mode={modalMode}
      />
    </div>
  );
}
