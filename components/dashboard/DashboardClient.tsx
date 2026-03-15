'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Globe,
  Phone,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsWeek: number;
  newLeadsMonth: number;
  qualifiedLeads: number;
  completedQA: number;
  sentQAPolls: number;
  pendingQA: number;
  statusBreakdown: Record<string, number>;
  qualityBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  conversionRates: {
    toQualified: string;
    toBooked: string;
    toCustomer: string;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    company: string | null;
    status: string;
    quality: string;
    score: number;
    created: string;
  }>;
  bookedLeads: number;
  customerLeads: number;
  changes?: {
    totalLeads: number;
    newLeadsToday: number;
    qualifiedLeads: number;
    pendingQA: number;
  };
}

interface DashboardClientProps {
  initialStats: DashboardStats;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-700 border-blue-200',
  qualified: 'bg-emerald-500/20 text-emerald-700 border-emerald-200',
  booked: 'bg-purple-500/20 text-purple-700 border-purple-200',
  customer: 'bg-amber-500/20 text-amber-700 border-amber-200',
  lost: 'bg-red-500/20 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  new: 'Yeni',
  qualified: 'Nitelikli',
  booked: 'Randevu',
  customer: 'Müşteri',
  lost: 'Kayıp',
};

const qualityColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  qualified: 'bg-emerald-100 text-emerald-700',
  followup: 'bg-amber-100 text-amber-700',
};

const qualityLabels: Record<string, string> = {
  pending: 'Beklemede',
  qualified: 'Nitelikli',
  followup: 'Takip',
};

const sourceIcons: Record<string, React.ReactNode> = {
  web_form: <Globe className="h-4 w-4" />,
  api: <FileText className="h-4 w-4" />,
  manual: <Users className="h-4 w-4" />,
  whatsapp: <Phone className="h-4 w-4" />,
};

const sourceLabels: Record<string, string> = {
  web_form: 'Web Formu',
  api: 'API',
  manual: 'Manuel',
  whatsapp: 'WhatsApp',
};

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  delay,
}: {
  title: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon: React.ElementType;
  gradient: string;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}s` }}
      className={`animate-slide-up relative overflow-hidden rounded-2xl p-6 ${gradient} shadow-lg`}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {change && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                {change.isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-300" />
                )}
                <span className={change.isPositive ? 'text-emerald-300' : 'text-red-300'}>
                  {Math.abs(change.value)}%
                </span>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-white/20 p-3">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {value} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          style={{ width: `${percentage}%` }}
          className={`h-full animate-expand ${color}`}
        />
      </div>
    </div>
  );
}

export function DashboardClient({ initialStats }: DashboardClientProps) {
  const [stats] = useState<DashboardStats>(initialStats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Hoş geldiniz! İşte bugünkü özetiniz.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Lead"
          value={stats.totalLeads}
          change={
            stats.changes?.totalLeads !== undefined
              ? { value: Math.round(stats.changes.totalLeads), isPositive: stats.changes.totalLeads >= 0 }
              : undefined
          }
          icon={Users}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
          delay={0}
        />
        <StatCard
          title="Bugünün Lead'leri"
          value={stats.newLeadsToday}
          change={
            stats.changes?.newLeadsToday !== undefined
              ? { value: Math.round(stats.changes.newLeadsToday), isPositive: stats.changes.newLeadsToday >= 0 }
              : undefined
          }
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0.1}
        />
        <StatCard
          title="Nitelikli Lead"
          value={stats.qualifiedLeads}
          change={
            stats.changes?.qualifiedLeads !== undefined
              ? { value: Math.round(stats.changes.qualifiedLeads), isPositive: stats.changes.qualifiedLeads >= 0 }
              : undefined
          }
          icon={Target}
          gradient="bg-gradient-to-br from-violet-500 to-violet-600"
          delay={0.2}
        />
        <StatCard
          title="Bekleyen Anket"
          value={stats.pendingQA}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversion Funnel */}
        <div
          style={{ animationDelay: '0.4s' }}
          className="animate-slide-up lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dönüşüm Hunisi</h3>
          <div className="space-y-4">
            <ProgressBar
              value={stats.statusBreakdown.new || 0}
              max={stats.totalLeads}
              color="bg-blue-500"
              label="Yeni Lead'ler"
            />
            <ProgressBar
              value={stats.qualifiedLeads}
              max={stats.totalLeads}
              color="bg-emerald-500"
              label="Nitelikli"
            />
            <ProgressBar
              value={stats.bookedLeads}
              max={stats.totalLeads}
              color="bg-purple-500"
              label="Randevu Almış"
            />
            <ProgressBar
              value={stats.customerLeads}
              max={stats.totalLeads}
              color="bg-amber-500"
              label="Müşteri Olmuş"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{stats.conversionRates.toQualified}%</p>
                <p className="text-xs text-gray-500 mt-1">Nitelikleme</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{stats.conversionRates.toBooked}%</p>
                <p className="text-xs text-gray-500 mt-1">Randevu</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.conversionRates.toCustomer}%</p>
                <p className="text-xs text-gray-500 mt-1">Müşteri</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div
          style={{ animationDelay: '0.5s' }}
          className="animate-slide-up lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Durum Dağılımı</h3>
          <div className="space-y-3">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {statusLabels[status] || status}
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Distribution */}
        <div
          style={{ animationDelay: '0.6s' }}
          className="animate-slide-up lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kaynak Dağılımı</h3>
          <div className="space-y-3">
            {Object.entries(stats.sourceBreakdown).map(([source, count]) => (
              <div
                key={source}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2 text-gray-600 group-hover:bg-gray-200 transition-colors">
                    {sourceIcons[source] || <FileText className="h-4 w-4" />}
                  </div>
                  <span className="font-medium text-gray-700">
                    {sourceLabels[source] || source}
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div
        style={{ animationDelay: '0.7s' }}
        className="animate-slide-up rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Son Lead'ler</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentLeads.map((lead, index) => (
            <div
              key={lead.id}
              style={{ animationDelay: `${0.8 + index * 0.05}s` }}
              className="animate-slide-in-left"
            >
              <Link
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {lead.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {lead.company && (
                        <span className="text-sm text-gray-500 truncate">{lead.company}</span>
                      )}
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(lead.created), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      statusColors[lead.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {statusLabels[lead.status] || lead.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      qualityColors[lead.quality] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {qualityLabels[lead.quality] || lead.quality}
                  </span>
                  {lead.score > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50">
                      <Target className="h-3 w-3 text-indigo-600" />
                      <span className="text-xs font-semibold text-indigo-600">{lead.score}</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
        {stats.recentLeads.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Henüz lead bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
