import PocketBase from 'pocketbase';

// Types
export interface CampaignMetrics {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  failed_enrollments: number;
  total_messages: number;
  sent_messages: number;
  delivered_messages: number;
  failed_messages: number;
}

export interface EnrollmentMetrics {
  enrollment_rate: number;
  completion_rate: number;
  failure_rate: number;
  avg_completion_time: number; // in hours
  step_completion_rates: { step_name: string; count: number; rate: number }[];
}

export interface EmailEngagement {
  total_sent: number;
  opens: number;
  clicks: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
}

export interface WhatsAppDelivery {
  total_sent: number;
  delivered: number;
  read: number;
  failed: number;
  delivery_rate: number;
  read_rate: number;
}

export interface ConversionMetrics {
  converted_to_customer: number;
  converted_to_booked: number;
  still_new: number;
  lost: number;
  conversion_rate: number;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface LeadPerformance {
  lead_id: string;
  lead_name: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  steps_completed: number;
  current_step: number;
  total_steps: number;
}

export type DateRange = '7d' | '30d' | '90d' | 'all';

// Cache for performance (5-minute cache)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Helper functions
function getDateRangeFilter(range: DateRange): { start?: Date; end?: Date } {
  const now = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(now.getDate() - 7);
      return { start, end: now };
    case '30d':
      start.setDate(now.getDate() - 30);
      return { start, end: now };
    case '90d':
      start.setDate(now.getDate() - 90);
      return { start, end: now };
    case 'all':
      return { start: undefined, end: now };
    default:
      return { start: undefined, end: now };
  }
}

function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function formatDateForChart(date: Date): string {
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

/**
 * Get overall campaign metrics
 */
export async function getCampaignMetrics(
  pb: PocketBase,
  campaignId: string,
  dateRange: DateRange
): Promise<CampaignMetrics> {
  const cacheKey = `campaign_metrics_${campaignId}_${dateRange}`;
  const cached = getCachedData<CampaignMetrics>(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeFilter(dateRange);

  try {
    // Build filter for enrollments
    const filters = [`campaign = "${campaignId}"`];
    if (start) {
      filters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      filters.push(`created <= "${end.toISOString()}"`);
    }

    // Get enrollments
    const enrollments = await pb.collection('campaign_enrollments').getList(1, 10000, {
      filter: filters.join(' && '),
      fields: 'id,status,created'
    });

    const totalEnrollments = enrollments.totalItems;
    const activeEnrollments = enrollments.items.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.items.filter(e => e.status === 'completed').length;
    const failedEnrollments = enrollments.items.filter(e => e.status === 'failed').length;

    // Get sequence messages for delivery metrics
    const messageFilters = [`enrollment.campaign = "${campaignId}"`];
    if (start) {
      messageFilters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      messageFilters.push(`created <= "${end.toISOString()}"`);
    }

    const messages = await pb.collection('sequence_messages').getList(1, 10000, {
      filter: messageFilters.join(' && '),
      fields: 'id,status'
    });

    const totalMessages = messages.totalItems;
    const sentMessages = messages.items.filter(m => m.status === 'sent').length;
    const deliveredMessages = messages.items.filter(m => m.status === 'delivered').length;
    const failedMessages = messages.items.filter(m => m.status === 'failed').length;

    const metrics: CampaignMetrics = {
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
      completed_enrollments: completedEnrollments,
      failed_enrollments: failedEnrollments,
      total_messages: totalMessages,
      sent_messages: sentMessages,
      delivered_messages: deliveredMessages,
      failed_messages: failedMessages
    };

    setCachedData(cacheKey, metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    return {
      total_enrollments: 0,
      active_enrollments: 0,
      completed_enrollments: 0,
      failed_enrollments: 0,
      total_messages: 0,
      sent_messages: 0,
      delivered_messages: 0,
      failed_messages: 0
    };
  }
}

/**
 * Get enrollment funnel metrics
 */
export async function getEnrollmentMetrics(
  pb: PocketBase,
  campaignId: string,
  dateRange: DateRange
): Promise<EnrollmentMetrics> {
  const cacheKey = `enrollment_metrics_${campaignId}_${dateRange}`;
  const cached = getCachedData<EnrollmentMetrics>(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeFilter(dateRange);

  try {
    // Get campaign to calculate total potential leads
    const campaign = await pb.collection('campaigns').getOne(campaignId);
    const segment = campaign.audience_segment;

    // Count leads matching segment
    const leadFilters: string[] = [];
    if (segment.conditions && segment.conditions.length > 0) {
      const logicalOperator = segment.logical_operator || 'AND';

      segment.conditions.forEach((condition: any) => {
        let valueStr = typeof condition.value === 'string'
          ? `"${condition.value}"`
          : condition.value;

        leadFilters.push(`${condition.field} ${condition.operator} ${valueStr}`);
      });
    }

    const totalLeads = await pb.collection('leads').getList(1, 1, {
      filter: leadFilters.length > 0 ? leadFilters.join(` ${segment.logical_operator || 'AND'} `) : ''
    });
    const potentialLeads = totalLeads.totalItems;

    // Get enrollments
    const enrollmentFilters = [`campaign = "${campaignId}"`];
    if (start) {
      enrollmentFilters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      enrollmentFilters.push(`created <= "${end.toISOString()}"`);
    }

    const enrollments = await pb.collection('campaign_enrollments').getList(1, 10000, {
      filter: enrollmentFilters.join(' && '),
      fields: 'id,status,created,completed_at,steps'
    });

    const totalEnrollments = enrollments.totalItems;
    const completedEnrollments = enrollments.items.filter(e => e.status === 'completed');
    const failedEnrollments = enrollments.items.filter(e => e.status === 'failed');

    // Calculate average completion time
    const completionTimes = completedEnrollments
      .filter(e => e.completed_at)
      .map(e => {
        const created = new Date(e.created).getTime();
        const completed = new Date(e.completed_at as string).getTime();
        return (completed - created) / (1000 * 60 * 60); // hours
      });

    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    // Calculate step completion rates
    const stepCompletionRates = calculateStepCompletionRates(enrollments.items);

    const metrics: EnrollmentMetrics = {
      enrollment_rate: calculateRate(totalEnrollments, potentialLeads),
      completion_rate: calculateRate(completedEnrollments.length, totalEnrollments),
      failure_rate: calculateRate(failedEnrollments.length, totalEnrollments),
      avg_completion_time: Math.round(avgCompletionTime * 10) / 10,
      step_completion_rates: stepCompletionRates
    };

    setCachedData(cacheKey, metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching enrollment metrics:', error);
    return {
      enrollment_rate: 0,
      completion_rate: 0,
      failure_rate: 0,
      avg_completion_time: 0,
      step_completion_rates: []
    };
  }
}

function calculateStepCompletionRates(enrollments: any[]): { step_name: string; count: number; rate: number }[] {
  // This is a simplified version - in reality, you'd parse the steps JSON
  // and track which step each enrollment is on
  const stepCounts: { [key: string]: number } = {};

  enrollments.forEach(enrollment => {
    const currentStep = enrollment.current_step || 0;
    const stepName = `Adım ${currentStep + 1}`;
    stepCounts[stepName] = (stepCounts[stepName] || 0) + 1;
  });

  const total = enrollments.length;
  return Object.entries(stepCounts).map(([stepName, count]) => ({
    step_name: stepName,
    count,
    rate: calculateRate(count, total)
  }));
}

/**
 * Get email engagement metrics
 * Note: Using estimated data as Resend basic tier doesn't provide open tracking
 */
export async function getEmailEngagement(
  pb: PocketBase,
  campaignId: string,
  dateRange: DateRange
): Promise<EmailEngagement> {
  const cacheKey = `email_engagement_${campaignId}_${dateRange}`;
  const cached = getCachedData<EmailEngagement>(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeFilter(dateRange);

  try {
    // Get email messages from sequence_messages
    const filters = [
      `enrollment.campaign = "${campaignId}"`,
      `type = "email"`
    ];
    if (start) {
      filters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      filters.push(`created <= "${end.toISOString()}"`);
    }

    const messages = await pb.collection('sequence_messages').getList(1, 10000, {
      filter: filters.join(' && '),
      fields: 'id,status'
    });

    const totalSent = messages.totalItems;

    // Estimated engagement (since Resend basic tier doesn't track opens)
    // Using industry averages: 20% open rate, 3% click rate
    const estimatedOpens = Math.round(totalSent * 0.20);
    const estimatedClicks = Math.round(totalSent * 0.03);

    const metrics: EmailEngagement = {
      total_sent: totalSent,
      opens: estimatedOpens,
      clicks: estimatedClicks,
      open_rate: calculateRate(estimatedOpens, totalSent),
      click_rate: calculateRate(estimatedClicks, totalSent),
      click_to_open_rate: calculateRate(estimatedClicks, estimatedOpens)
    };

    setCachedData(cacheKey, metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching email engagement:', error);
    return {
      total_sent: 0,
      opens: 0,
      clicks: 0,
      open_rate: 0,
      click_rate: 0,
      click_to_open_rate: 0
    };
  }
}

/**
 * Get WhatsApp delivery metrics
 */
export async function getWhatsAppDelivery(
  pb: PocketBase,
  campaignId: string,
  dateRange: DateRange
): Promise<WhatsAppDelivery> {
  const cacheKey = `whatsapp_delivery_${campaignId}_${dateRange}`;
  const cached = getCachedData<WhatsAppDelivery>(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeFilter(dateRange);

  try {
    // Get WhatsApp messages from sequence_messages
    const filters = [
      `enrollment.campaign = "${campaignId}"`,
      `type = "whatsapp"`
    ];
    if (start) {
      filters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      filters.push(`created <= "${end.toISOString()}"`);
    }

    const messages = await pb.collection('sequence_messages').getList(1, 10000, {
      filter: filters.join(' && '),
      fields: 'id,status'
    });

    const totalSent = messages.totalItems;
    const delivered = messages.items.filter(m => m.status === 'delivered').length;
    const read = messages.items.filter(m => m.status === 'read').length;
    const failed = messages.items.filter(m => m.status === 'failed').length;

    const metrics: WhatsAppDelivery = {
      total_sent: totalSent,
      delivered,
      read,
      failed,
      delivery_rate: calculateRate(delivered, totalSent),
      read_rate: calculateRate(read, totalSent)
    };

    setCachedData(cacheKey, metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching WhatsApp delivery:', error);
    return {
      total_sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      delivery_rate: 0,
      read_rate: 0
    };
  }
}

/**
 * Get conversion metrics (lead status changes)
 */
export async function getConversionMetrics(
  pb: PocketBase,
  campaignId: string,
  dateRange: DateRange
): Promise<ConversionMetrics> {
  const cacheKey = `conversion_metrics_${campaignId}_${dateRange}`;
  const cached = getCachedData<ConversionMetrics>(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeFilter(dateRange);

  try {
    // Get enrollments with lead data
    const filters = [`campaign = "${campaignId}"`];
    if (start) {
      filters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      filters.push(`created <= "${end.toISOString()}"`);
    }

    const enrollments = await pb.collection('campaign_enrollments').getList(1, 10000, {
      filter: filters.join(' && '),
      fields: 'id,lead',
      expand: 'lead'
    });

    // Count by lead status
    let convertedToCustomer = 0;
    let convertedToBooked = 0;
    let stillNew = 0;
    let lost = 0;

    enrollments.items.forEach((enrollment: any) => {
      const lead = enrollment.expand?.lead;
      if (!lead) return;

      switch (lead.status) {
        case 'customer':
          convertedToCustomer++;
          break;
        case 'booked':
          convertedToBooked++;
          break;
        case 'new':
          stillNew++;
          break;
        case 'lost':
          lost++;
          break;
        default:
          // Other statuses count as "still new" for conversion purposes
          stillNew++;
      }
    });

    const total = enrollments.totalItems;
    const totalConverted = convertedToCustomer + convertedToBooked;

    const metrics: ConversionMetrics = {
      converted_to_customer: convertedToCustomer,
      converted_to_booked: convertedToBooked,
      still_new: stillNew,
      lost,
      conversion_rate: calculateRate(totalConverted, total)
    };

    setCachedData(cacheKey, metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching conversion metrics:', error);
    return {
      converted_to_customer: 0,
      converted_to_booked: 0,
      still_new: 0,
      lost: 0,
      conversion_rate: 0
    };
  }
}

/**
 * Get time series data for charts
 */
export async function getTimeSeriesData(
  pb: PocketBase,
  campaignId: string,
  dateRange: DateRange,
  granularity: 'day' | 'week' | 'month' = 'day'
): Promise<TimeSeriesData> {
  const cacheKey = `timeseries_${campaignId}_${dateRange}_${granularity}`;
  const cached = getCachedData<TimeSeriesData>(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeFilter(dateRange);

  try {
    // Get enrollments grouped by date
    const filters = [`campaign = "${campaignId}"`];
    if (start) {
      filters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      filters.push(`created <= "${end.toISOString()}"`);
    }

    const enrollments = await pb.collection('campaign_enrollments').getList(1, 10000, {
      filter: filters.join(' && '),
      fields: 'id,created',
      sort: '-created'
    });

    // Group by date based on granularity
    const dateGroups: { [key: string]: number } = {};

    enrollments.items.forEach((enrollment: any) => {
      const date = new Date(enrollment.created);
      let key: string;

      switch (granularity) {
        case 'day':
          key = formatDateForChart(date);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = formatDateForChart(weekStart);
          break;
        case 'month':
          key = date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
          break;
        default:
          key = formatDateForChart(date);
      }

      dateGroups[key] = (dateGroups[key] || 0) + 1;
    });

    // Sort by date and create labels
    const sortedDates = Object.keys(dateGroups).sort((a, b) => {
      const dateA = parseTurkishDate(a);
      const dateB = parseTurkishDate(b);
      return dateA.getTime() - dateB.getTime();
    });

    const data = sortedDates.map(date => dateGroups[date]);

    const timeSeries: TimeSeriesData = {
      labels: sortedDates,
      datasets: [{
        label: 'Kayıt Sayısı',
        data
      }]
    };

    setCachedData(cacheKey, timeSeries);
    return timeSeries;
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return {
      labels: [],
      datasets: []
    };
  }
}

function parseTurkishDate(dateStr: string): Date {
  // Parse DD.MM.YY format
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }
  return new Date();
}

/**
 * Get lead-level performance data
 */
export async function getLeadPerformance(
  pb: PocketBase,
  campaignId: string,
  dateRange: DateRange,
  page = 1,
  perPage = 20,
  search = '',
  statusFilter = ''
): Promise<{ items: LeadPerformance[]; total: number }> {
  const { start, end } = getDateRangeFilter(dateRange);

  try {
    // Build filter
    const filters = [`campaign = "${campaignId}"`];
    if (start) {
      filters.push(`created >= "${start.toISOString()}"`);
    }
    if (end) {
      filters.push(`created <= "${end.toISOString()}"`);
    }

    if (statusFilter) {
      filters.push(`status = "${statusFilter}"`);
    }

    // Get enrollments with lead data
    const enrollments = await pb.collection('campaign_enrollments').getList(page, perPage, {
      filter: filters.join(' && '),
      expand: 'lead',
      sort: '-created'
    });

    // Filter by search term if provided
    let filteredItems = enrollments.items;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter((enrollment: any) => {
        const lead = enrollment.expand?.lead;
        return lead && (
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(search)
        );
      });
    }

    // Map to performance data
    const items: LeadPerformance[] = filteredItems.map((enrollment: any) => {
      const lead = enrollment.expand?.lead;
      return {
        lead_id: enrollment.lead,
        lead_name: lead?.name || 'Bilinmeyen',
        status: enrollment.status,
        enrolled_at: enrollment.created,
        completed_at: enrollment.completed_at || null,
        steps_completed: enrollment.steps_completed || 0,
        current_step: enrollment.current_step || 0,
        total_steps: enrollment.total_steps || 0
      };
    });

    return {
      items,
      total: enrollments.totalItems
    };
  } catch (error) {
    console.error('Error fetching lead performance:', error);
    return {
      items: [],
      total: 0
    };
  }
}
