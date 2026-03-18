import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

/**
 * Fetch dashboard statistics
 */
export async function fetchDashboardStats() {
  const pb = new PocketBase(PB_URL);

  // Load auth from cookie if available
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";");
    const pbCookie = cookies.find((c) => c.trim().startsWith("pb_auth="));
    if (pbCookie) {
      try {
        pb.authStore.loadFromCookie(pbCookie.trim());
      } catch (e) {
        console.warn("Failed to load auth from cookie:", e);
      }
    }
  }

  try {
    // Get today's date range (start of day to end of day)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Get this week's date range
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all leads with pagination (handle large datasets)
    let allLeads: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await pb.collection("leads").getList(page, 100, {
        sort: "-created",
      });

      allLeads = [...allLeads, ...response.items];
      hasMore = response.items.length === 100;
      page++;
    }

    // Calculate statistics
    const totalLeads = allLeads.length;

    // New leads today
    const newLeadsToday = allLeads.filter((lead) => {
      const createdAt = new Date(lead.created);
      return createdAt >= new Date(startOfDay) && createdAt < new Date(endOfDay);
    }).length;

    // New leads this week
    const newLeadsWeek = allLeads.filter((lead) => {
      const createdAt = new Date(lead.created);
      return createdAt >= startOfWeek;
    }).length;

    // New leads this month
    const newLeadsMonth = allLeads.filter((lead) => {
      const createdAt = new Date(lead.created);
      return createdAt >= new Date(startOfMonth);
    }).length;

    // Leads by status
    const statusBreakdown = allLeads.reduce((acc, lead) => {
      const status = lead.status || "new";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Leads by quality
    const qualityBreakdown = allLeads.reduce((acc, lead) => {
      const quality = lead.quality || "pending";
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Qualified leads (quality = 'qualified')
    const qualifiedLeads = allLeads.filter((lead) => lead.quality === "qualified").length;

    // Completed QA
    const completedQA = allLeads.filter((lead) => lead.qa_completed).length;

    // Sent QA polls
    const sentQAPolls = allLeads.filter((lead) => lead.qa_sent).length;

    // Pending QA responses
    const pendingQA = sentQAPolls - completedQA;

    // Conversion rate (new -> qualified -> booked -> customer)
    const bookedLeads = statusBreakdown["booked"] || 0;
    const customerLeads = statusBreakdown["customer"] || 0;

    const toQualifiedRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0";
    const toBookedRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : "0";
    const toCustomerRate = totalLeads > 0 ? ((customerLeads / totalLeads) * 100).toFixed(1) : "0";

    // Recent activity (last 10 leads)
    const recentLeads = allLeads.slice(0, 10).map((lead) => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      status: lead.status,
      quality: lead.quality,
      score: lead.total_score || lead.score || 0,
      created: lead.created,
    }));

    // Leads by source
    const sourceBreakdown = allLeads.reduce((acc, lead) => {
      const source = lead.source || "manual";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLeads,
      newLeadsToday,
      newLeadsWeek,
      newLeadsMonth,
      qualifiedLeads,
      completedQA,
      sentQAPolls,
      pendingQA,
      statusBreakdown,
      qualityBreakdown,
      sourceBreakdown,
      conversionRates: {
        toQualified: toQualifiedRate,
        toBooked: toBookedRate,
        toCustomer: toCustomerRate,
      },
      recentLeads,
      bookedLeads,
      customerLeads,
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    throw error;
  }
}

/**
 * Fetch statistics for server-side rendering
 */
export async function fetchDashboardStatsServer(pb: any) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Yesterday's date range
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // This week's date range
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Last week's date range
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);

    // This month's date range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Last month's date range
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Count total leads
    const totalLeads = await pb.collection("leads").getList(1, 1);
    const totalCount = totalLeads.totalItems;

    // Count new leads today
    const newLeadsToday = await pb.collection("leads").getList(1, 1, {
      filter: `created >= "${startOfDay}" && created < "${endOfDay}"`,
    });

    // Count new leads yesterday
    const newLeadsYesterday = await pb.collection("leads").getList(1, 1, {
      filter: `created >= "${startOfYesterday}" && created < "${endOfYesterday}"`,
    });

    // Calculate today's change percentage (vs yesterday)
    const todayChange =
      newLeadsYesterday.totalItems > 0
        ? ((newLeadsToday.totalItems - newLeadsYesterday.totalItems) / newLeadsYesterday.totalItems) * 100
        : newLeadsToday.totalItems > 0
        ? 100
        : 0;

    // Count new leads this week
    const newLeadsWeek = await pb.collection("leads").getList(1, 1, {
      filter: `created >= "${startOfWeek.toISOString()}"`,
    });

    // Count new leads last week
    const newLeadsLastWeek = await pb.collection("leads").getList(1, 1, {
      filter: `created >= "${startOfLastWeek.toISOString()}" && created < "${endOfLastWeek.toISOString()}"`,
    });

    // Calculate week change percentage
    const weekChange =
      newLeadsLastWeek.totalItems > 0
        ? ((newLeadsWeek.totalItems - newLeadsLastWeek.totalItems) / newLeadsLastWeek.totalItems) * 100
        : newLeadsWeek.totalItems > 0
        ? 100
        : 0;

    // Count new leads this month
    const newLeadsMonth = await pb.collection("leads").getList(1, 1, {
      filter: `created >= "${startOfMonth}"`,
    });

    // Count new leads last month
    const newLeadsLastMonth = await pb.collection("leads").getList(1, 1, {
      filter: `created >= "${startOfLastMonth}" && created < "${endOfLastMonth}"`,
    });

    // Calculate month change percentage
    const monthChange =
      newLeadsLastMonth.totalItems > 0
        ? ((newLeadsMonth.totalItems - newLeadsLastMonth.totalItems) / newLeadsLastMonth.totalItems) * 100
        : newLeadsMonth.totalItems > 0
        ? 100
        : 0;

    // Status breakdown
    const statusCounts = {
      new: (await pb.collection("leads").getList(1, 1, { filter: 'status = "new"' })).totalItems,
      qualified: (await pb.collection("leads").getList(1, 1, { filter: 'status = "qualified"' }))
        .totalItems,
      booked: (await pb.collection("leads").getList(1, 1, { filter: 'status = "booked"' })).totalItems,
      customer: (await pb.collection("leads").getList(1, 1, { filter: 'status = "customer"' }))
        .totalItems,
      lost: (await pb.collection("leads").getList(1, 1, { filter: 'status = "lost"' })).totalItems,
    };

    // Quality breakdown
    const qualityCounts = {
      pending: (await pb.collection("leads").getList(1, 1, { filter: 'quality = "pending"' }))
        .totalItems,
      qualified: (await pb.collection("leads").getList(1, 1, { filter: 'quality = "qualified"' }))
        .totalItems,
      followup: (await pb.collection("leads").getList(1, 1, { filter: 'quality = "followup"' }))
        .totalItems,
    };

    // QA stats
    const completedQA = (await pb.collection("leads").getList(1, 1, { filter: "qa_completed = true" }))
      .totalItems;
    const sentQAPolls = (await pb.collection("leads").getList(1, 1, { filter: "qa_sent = true" }))
      .totalItems;

    // Recent leads
    const recentLeadsData = await pb.collection("leads").getList(1, 10, {
      sort: "-created",
    });

    const recentLeads = recentLeadsData.items.map((lead: any) => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      status: lead.status,
      quality: lead.quality,
      score: lead.total_score || lead.score || 0,
      created: lead.created,
    }));

    // Source breakdown
    const sourceCounts = {
      web_form: (await pb.collection("leads").getList(1, 1, { filter: 'source = "web_form"' }))
        .totalItems,
      api: (await pb.collection("leads").getList(1, 1, { filter: 'source = "api"' })).totalItems,
      manual: (await pb.collection("leads").getList(1, 1, { filter: 'source = "manual"' })).totalItems,
      whatsapp: (await pb.collection("leads").getList(1, 1, { filter: 'source = "whatsapp"' }))
        .totalItems,
    };

    const toQualifiedRate = totalCount > 0 ? ((qualityCounts.qualified / totalCount) * 100).toFixed(1) : "0";
    const toBookedRate = totalCount > 0 ? ((statusCounts.booked / totalCount) * 100).toFixed(1) : "0";
    const toCustomerRate = totalCount > 0 ? ((statusCounts.customer / totalCount) * 100).toFixed(1) : "0";

    // Calculate total leads change (this month vs last month)
    const totalLeadsChange = monthChange;

    // Calculate qualified leads change (using quality = 'qualified')
    // Get last month's qualified leads
    const qualifiedLeadsLastMonth = await pb.collection("leads").getList(1, 1, {
      filter: `quality = "qualified" && created >= "${startOfLastMonth}" && created < "${endOfLastMonth}"`,
    });
    const qualifiedLeadsThisMonth = await pb.collection("leads").getList(1, 1, {
      filter: `quality = "qualified" && created >= "${startOfMonth}"`,
    });
    const qualifiedChange =
      qualifiedLeadsLastMonth.totalItems > 0
        ? ((qualifiedLeadsThisMonth.totalItems - qualifiedLeadsLastMonth.totalItems) /
            qualifiedLeadsLastMonth.totalItems) *
          100
        : qualifiedLeadsThisMonth.totalItems > 0
        ? 100
        : 0;

    // Calculate pending QA trend (response rate)
    const responseRate = sentQAPolls > 0 ? (completedQA / sentQAPolls) * 100 : 0;
    const pendingChange = 0; // No historical comparison for now

    return {
      totalLeads: totalCount,
      newLeadsToday: newLeadsToday.totalItems,
      newLeadsWeek: newLeadsWeek.totalItems,
      newLeadsMonth: newLeadsMonth.totalItems,
      qualifiedLeads: qualityCounts.qualified,
      completedQA,
      sentQAPolls,
      pendingQA: sentQAPolls - completedQA,
      statusBreakdown: statusCounts,
      qualityBreakdown: qualityCounts,
      sourceBreakdown: sourceCounts,
      conversionRates: {
        toQualified: toQualifiedRate,
        toBooked: toBookedRate,
        toCustomer: toCustomerRate,
      },
      recentLeads,
      bookedLeads: statusCounts.booked,
      customerLeads: statusCounts.customer,
      // Add change percentages
      changes: {
        totalLeads: totalLeadsChange,
        newLeadsToday: todayChange,
        qualifiedLeads: qualifiedChange,
        pendingQA: pendingChange,
      },
    };
  } catch (error) {
    console.error("Dashboard stats server error:", error);
    throw error;
  }
}
