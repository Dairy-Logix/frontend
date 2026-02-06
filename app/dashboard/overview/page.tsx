"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  ShoppingBag,
  FileText,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  Clock,
  Globe,
  MousePointer,
  UserCheck,
  UserPlus,
  Chrome,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  mockDashboardStats,
  mockRecentUsers,
  mockChartData,
  mockActivities,
} from "@/lib/mock-data/dashboard";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";

// Browser usage data
const browserData = [
  {
    name: "Chrome",
    sessions: 23379,
    traffic: 65,
    bounce: 2.5,
    trend: "up",
    color: "#4285F4",
  },
  {
    name: "Safari",
    sessions: 78973,
    traffic: 25,
    bounce: 2.5,
    trend: "up",
    color: "#000000",
  },
  {
    name: "Firefox",
    sessions: 6135,
    traffic: 55,
    bounce: 2.5,
    trend: "down",
    color: "#FF7139",
  },
  {
    name: "Edge",
    sessions: 8570,
    traffic: 35,
    bounce: 2.5,
    trend: "up",
    color: "#0078D4",
  },
  {
    name: "Opera",
    sessions: 12457,
    traffic: 85,
    bounce: 2.5,
    trend: "down",
    color: "#FF1B2D",
  },
];

// Session metrics
const sessionMetrics = [
  {
    title: "Session Time",
    value: "3m 45s",
    icon: Clock,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    title: "Geo Area",
    value: "USA",
    subtitle: "Top Location",
    icon: Globe,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Bounce Rate",
    value: "45%",
    icon: MousePointer,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Returning Visitors",
    value: "1,250",
    icon: UserCheck,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "New Users",
    value: "500",
    icon: UserPlus,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "New Clicks",
    value: "800",
    icon: MousePointer,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
];

// Impression data for donut chart
const impressionData = [
  { name: "Email", value: 1800, color: "#8b5cf6" },
  { name: "Search", value: 987, color: "#3b82f6" },
  { name: "Social", value: 752, color: "#f59e0b" },
  { name: "Direct", value: 368, color: "#10b981" },
];

export default function OverviewPage() {
  const stats = mockDashboardStats;

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      growth: stats.usersGrowth,
      icon: Users,
      gradient: "bg-gradient-primary",
      href: "/dashboard/users",
    },
    {
      title: "Products",
      value: stats.totalProducts.toLocaleString(),
      growth: stats.productsGrowth,
      icon: ShoppingBag,
      gradient: "bg-gradient-secondary",
      href: "/dashboard/products",
    },
    {
      title: "Articles",
      value: stats.totalArticles.toLocaleString(),
      growth: stats.articlesGrowth,
      icon: FileText,
      gradient: "bg-gradient-accent",
      href: "/dashboard/articles",
    },
    {
      title: "Files",
      value: stats.totalFiles.toLocaleString(),
      growth: stats.filesGrowth,
      icon: FolderOpen,
      gradient: "bg-gradient-secondary",
      href: "/dashboard/files",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back! Here's what's happening with your application."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.growth >= 0;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass hover-glow-primary transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.gradient} h-10 w-10 rounded-lg flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={isPositive ? "text-green-500" : "text-red-500"}>
                      {Math.abs(stat.growth).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Metrics */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Activity Metrics</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {sessionMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className={`${metric.bgColor} h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{metric.title}</p>
                    <p className="text-lg font-bold">{metric.value}</p>
                    {metric.subtitle && (
                      <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Original Revenue Chart + Impression Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart - ORIGINAL */}
        <Card className="col-span-4 glass">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockChartData.revenue.datasets[0].data.map((value, index) => ({
                month: mockChartData.revenue.labels[index],
                value,
              }))}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Impression Overview - NEW */}
        <Card className="col-span-3 glass">
          <CardHeader>
            <CardTitle>Impression Overview</CardTitle>
            <CardDescription>Traffic sources breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={impressionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {impressionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {impressionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                    <p className="text-sm font-semibold">{item.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience Overview Chart - NEW */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Audience Overview</CardTitle>
          <CardDescription>Monthly views and engagement trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockChartData.revenue.datasets[0].data.map((value, index) => ({
              month: mockChartData.revenue.labels[index],
              views: value,
              followers: mockChartData.users.datasets[0].data[index],
            }))}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="views" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="followers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Browser Usage & Recent Users */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Browser Usage - NEW */}
        <Card className="col-span-4 glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Browser Usage</CardTitle>
                <CardDescription>Traffic statistics by browser</CardDescription>
              </div>
              <Button variant="link" className="text-primary">
                View All →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {browserData.map((browser, index) => (
                <motion.div
                  key={browser.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${browser.color}15` }}
                    >
                      <Chrome className="h-5 w-5" style={{ color: browser.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{browser.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {browser.sessions.toLocaleString()}{" "}
                          {browser.trend === "up" ? "↑" : "↓"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={browser.traffic} className="h-2" />
                        </div>
                        <span className="text-xs text-muted-foreground w-12">
                          {browser.traffic}%
                        </span>
                        <Badge
                          variant={browser.bounce > 3 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {browser.bounce}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users - ORIGINAL */}
        <Card className="col-span-3 glass">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {user.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Users
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts - ORIGINAL */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockChartData.users.datasets[0].data.map((value, index) => ({
                month: mockChartData.users.labels[index],
                value,
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Weekly Traffic</CardTitle>
            <CardDescription>Visitors in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockChartData.traffic.datasets[0].data.map((value, index) => ({
                day: mockChartData.traffic.labels[index],
                value,
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - ORIGINAL */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {activity.type.replace(/_/g, " ")}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
