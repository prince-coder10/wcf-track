import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";

export interface DashboardStats {
  week: {
    evangelized: number;
    assigned: number;
    unassignedWaiting: number;
    contacted: number;
    contactedPercentage: number;
    integrated: number;
  };
  month: {
    evangelized: number;
    assigned: number;
    unassignedWaiting: number;
    contacted: number;
    contactedPercentage: number;
    integrated: number;
  };
}

export interface UnassignedQueueItem {
  id: string;
  name: string;
  hall: string;
  daysAgo: number;
}

export interface OverdueItem {
  id: string;
  name: string;
  assignee: string;
  days: number;
}

export interface DayBarData {
  day: string;
  value: number;
}

export async function getDashboardData() {
  await connectDB();

  const now = new Date();

  // Start of current week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  // 7 days ago threshold for overdue check-ins
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Execute database queries in parallel
  const [
    // Week queries
    evangelizedWeek,
    assignedWeek,
    contactedWeek,
    integratedWeek,

    // Month queries
    evangelizedMonth,
    assignedMonth,
    contactedMonth,
    integratedMonth,

    // Current global pending
    unassignedWaiting,

    // Unassigned list
    unassignedDocs,

    // Overdue list
    overdueDocs,

    // Past 7 days evangelism count (Mon-Sun of current week)
    dailyCounts,
  ] = await Promise.all([
    // Week
    Person.countDocuments({ evangelizedAt: { $gte: startOfWeek } }),
    Person.countDocuments({
      status: { $in: ["assigned", "contacted", "integrated"] },
      assignedAt: { $gte: startOfWeek },
    }),
    Person.countDocuments({
      status: { $in: ["contacted", "integrated"] },
      lastContactAt: { $gte: startOfWeek },
    }),
    Person.countDocuments({
      status: "integrated",
      integratedAt: { $gte: startOfWeek },
    }),

    // Month
    Person.countDocuments({ evangelizedAt: { $gte: startOfMonth } }),
    Person.countDocuments({
      status: { $in: ["assigned", "contacted", "integrated"] },
      assignedAt: { $gte: startOfMonth },
    }),
    Person.countDocuments({
      status: { $in: ["contacted", "integrated"] },
      lastContactAt: { $gte: startOfMonth },
    }),
    Person.countDocuments({
      status: "integrated",
      integratedAt: { $gte: startOfMonth },
    }),

    // Unassigned count
    Person.countDocuments({ assignedTo: null }),

    // Unassigned queue (up to 7 items)
    Person.find({ assignedTo: null })
      .sort({ evangelizedAt: -1 })
      .limit(7)
      .select("fullName hall evangelizedAt")
      .lean(),

    // Overdue items (assigned, but no contact in 7+ days or lastContactAt < 7 days ago)
    Person.find({
      assignedTo: { $ne: null },
      status: { $in: ["assigned", "contacted"] },
      $or: [
        { lastContactAt: { $lt: sevenDaysAgo } },
        { lastContactAt: null, assignedAt: { $lt: sevenDaysAgo } },
      ],
    })
      .populate<{ assignedTo: { fullName: string } }>("assignedTo", "fullName")
      .sort({ lastContactAt: 1, assignedAt: 1 })
      .limit(5)
      .lean(),

    // Aggregation for 7 days of the current week
    Person.aggregate<{ _id: number; count: number }>([
      {
        $match: {
          evangelizedAt: { $gte: startOfWeek, $lte: now },
        },
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$evangelizedAt" }, // 1=Sun, 2=Mon... 7=Sat
        },
      },
      {
        $group: {
          _id: "$dayOfWeek",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stats: DashboardStats = {
    week: {
      evangelized: evangelizedWeek,
      assigned: assignedWeek,
      unassignedWaiting,
      contacted: contactedWeek,
      contactedPercentage:
        assignedWeek > 0 ? Math.round((contactedWeek / assignedWeek) * 100) : 0,
      integrated: integratedWeek,
    },
    month: {
      evangelized: evangelizedMonth,
      assigned: assignedMonth,
      unassignedWaiting,
      contacted: contactedMonth,
      contactedPercentage:
        assignedMonth > 0 ? Math.round((contactedMonth / assignedMonth) * 100) : 0,
      integrated: integratedMonth,
    },
  };

  const queue: UnassignedQueueItem[] = unassignedDocs.map((doc) => {
    const daysAgo = Math.max(
      0,
      Math.floor(
        (now.getTime() - new Date(doc.evangelizedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    return {
      id: String(doc._id),
      name: doc.fullName,
      hall: doc.hall || "Unknown Hall",
      daysAgo,
    };
  });

  const overdueList: OverdueItem[] = overdueDocs.map((doc) => {
    const refDate = doc.lastContactAt || doc.assignedAt || doc.evangelizedAt;
    const days = Math.max(
      0,
      Math.floor((now.getTime() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      id: String(doc._id),
      name: doc.fullName,
      assignee: doc.assignedTo?.fullName || "Unassigned",
      days,
    };
  });

  // Map daily counts for Mon-Sun
  const daysOrder = [
    { day: "Mon", dayOfWeekIndex: 2 },
    { day: "Tue", dayOfWeekIndex: 3 },
    { day: "Wed", dayOfWeekIndex: 4 },
    { day: "Thu", dayOfWeekIndex: 5 },
    { day: "Fri", dayOfWeekIndex: 6 },
    { day: "Sat", dayOfWeekIndex: 7 },
    { day: "Sun", dayOfWeekIndex: 1 },
  ];

  const chartData: DayBarData[] = daysOrder.map(({ day, dayOfWeekIndex }) => {
    const found = dailyCounts.find((d) => d._id === dayOfWeekIndex);
    return {
      day,
      value: found ? found.count : 0,
    };
  });

  return {
    stats,
    queue,
    overdueList,
    chartData,
  };
}
