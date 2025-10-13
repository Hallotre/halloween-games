'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Search, 
  Trophy, 
  Clock, 
  Shield, 
  Smartphone,
  Globe,
  BarChart3,
  Calendar,
  Eye,
  MousePointer,
  Target
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  totalEvents: number;
  topGames: Array<{ game_name: string; vote_count: number; view_count: number }>;
  recentActivity: Array<{
    id: string;
    user_id?: string;
    session_id: string;
    event_type: string;
    event_data: Record<string, any>;
    page_url: string;
    created_at: string;
  }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    averageSessionDuration: number;
  };
  popularSearches: Array<{ query: string; count: number }>;
  // Enhanced analytics from secure views
  eventSummary?: Array<{
    event_type: string;
    count: number;
    unique_users: number;
    sessions: number;
    unique_sessions: number;
    avg_events_per_user: number;
    last_24h_count: number;
    last_7d_count: number;
    suspicious_events: number;
  }>;
  dailyActivity?: Array<{
    date: string;
    total_events: number;
    daily_active_users: number;
    daily_sessions: number;
    page_views: number;
    votes: number;
    searches: number;
    game_submissions: number;
  }>;
  engagementMetrics?: Array<{
    metric: string;
    value: number;
  }>;
  securityMetrics?: Array<{
    metric: string;
    value: number;
  }>;
  // Enhanced analytics
  hourlyActivity?: Array<{
    hour: string;
    total_events: number;
    unique_users: number;
    unique_sessions: number;
    page_views: number;
    votes: number;
    searches: number;
    game_submissions: number;
    tab_switches: number;
    sorting_changes: number;
    avg_events_24h: number;
    avg_events_per_session: number;
  }>;
  weeklyActivity?: Array<{
    week_start: string;
    total_events: number;
    unique_users: number;
    unique_sessions: number;
    page_views: number;
    votes: number;
    searches: number;
    game_submissions: number;
    avg_daily_events: number;
    avg_daily_users: number;
    avg_events_per_session: number;
  }>;
  userBehaviorMetrics?: Array<{
    metric_category: string;
    metric_name: string;
    value: number;
  }>;
  performanceMetrics?: Array<{
    metric_category: string;
    metric_name: string;
    value: number;
  }>;
  conversionFunnel?: Array<{
    metric_category: string;
    metric_name: string;
    value: number;
  }>;
  topPerformingContent?: Array<{
    content_name: string;
    event_type: string;
    event_count: number;
    unique_users: number;
    unique_sessions: number;
    avg_events_per_user: number;
    user_engagement_rate: number;
  }>;
  geographicAnalytics?: Array<{
    metric_category: string;
    metric_name: string;
    value: number;
  }>;
  deviceAnalytics?: Array<{
    metric_category: string;
    metric_name: string;
    value: number;
  }>;
  sessionAnalytics?: Array<{
    metric_category: string;
    metric_name: string;
    value: number;
  }>;
}

interface AnalyticsDashboardProps {
  isAdmin: boolean;
}

export default function AnalyticsDashboard({ isAdmin }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      
      const response = await fetch(`/api/analytics?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
      
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, dateRange]);

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl font-bold mb-2">Ingen tilgang</h3>
            <p className="text-muted-foreground">Du har ikke tilgang til analytics dashboardet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Laster analytics data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-2">Feil ved lasting</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>
              Prøv igjen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl font-bold mb-2">Ingen data tilgjengelig</h3>
            <p className="text-muted-foreground mb-4">Analytics data kunne ikke lastes</p>
            <Button onClick={fetchAnalytics}>
              Last data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Prepare chart data
  const dailyActivityData = analyticsData.dailyActivity?.slice(0, 7).map(day => ({
    date: new Date(day.date).toLocaleDateString('no-NO', { month: 'short', day: 'numeric' }),
    users: day.daily_active_users || 0,
    events: day.total_events || 0,
    votes: day.votes || 0,
    searches: day.searches || 0
  })) || [];

  const hourlyActivityData = analyticsData.hourlyActivity?.slice(0, 24).map(hour => ({
    hour: new Date(hour.hour).toLocaleTimeString('no-NO', { hour: '2-digit' }),
    events: hour.total_events || 0,
    users: hour.unique_users || 0
  })) || [];

  const eventSummaryData = analyticsData.eventSummary?.map(event => ({
    name: event.event_type?.replace('_', ' ').toUpperCase() || 'UNKNOWN',
    value: event.count || 0,
    uniqueUsers: event.unique_users || 0
  })) || [];

  const topGamesData = analyticsData.topGames?.slice(0, 10).map((game, index) => ({
    name: game.game_name,
    votes: game.vote_count || 0,
    rank: index + 1
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-lg">
                Oversikt over brukeraktivitet og engasjement
              </CardDescription>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-auto"
              />
              <span className="text-muted-foreground">til</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-auto"
              />
              <Button onClick={fetchAnalytics}>
                Oppdater
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="spooky-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalUsers || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Unike brukere totalt
            </p>
          </CardContent>
        </Card>

        <Card className="spooky-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale sesjoner</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalSessions || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Brukersesjoner totalt
            </p>
          </CardContent>
        </Card>

        <Card className="spooky-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale hendelser</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalEvents || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Sporingshendelser totalt
            </p>
          </CardContent>
        </Card>

        <Card className="spooky-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daglige aktive</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.userEngagement?.dailyActiveUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aktive brukere i dag
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 border border-border/50">
          <TabsTrigger value="overview" className="data-[state=active]:spooky-pulse">Oversikt</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:spooky-pulse">Aktivitet</TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:spooky-pulse">Spill</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:spooky-pulse">Brukere</TabsTrigger>
          <TabsTrigger value="technical" className="data-[state=active]:spooky-pulse">Teknisk</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <Card className="spooky-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daglig aktivitet (siste 7 dager)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
                    <XAxis dataKey="date" stroke="rgba(139, 92, 246, 0.6)" />
                    <YAxis stroke="rgba(139, 92, 246, 0.6)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(8, 8, 8, 0.9)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                      }}
                    />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#8b5cf6" fill="url(#usersGradient)" />
                    <Area type="monotone" dataKey="events" stackId="1" stroke="#ea580c" fill="url(#eventsGradient)" />
                    <defs>
                      <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Event Summary Chart */}
            <Card className="spooky-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Hendelsestyper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventSummaryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
                    <XAxis dataKey="name" stroke="rgba(139, 92, 246, 0.6)" />
                    <YAxis stroke="rgba(139, 92, 246, 0.6)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(8, 8, 8, 0.9)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                      }}
                    />
                    <Bar dataKey="value" fill="url(#barGradient)" />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Games Table */}
          <Card className="spooky-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Mest populære spill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rang</TableHead>
                    <TableHead>Spillnavn</TableHead>
                    <TableHead className="text-right">Stemmer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topGamesData.map((game) => (
                    <TableRow key={game.name} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge variant={game.rank <= 3 ? "default" : "secondary"} className={game.rank <= 3 ? "spooky-pulse" : ""}>
                          #{game.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{game.name}</TableCell>
                      <TableCell className="text-right">{formatNumber(game.votes)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timevis aktivitet (siste 24 timer)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="events" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Popular Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Populære søk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {(analyticsData.popularSearches || []).map((search, index) => (
                      <div key={search.query} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                        <span className="font-medium">{search.query}</span>
                        <Badge variant="outline">{search.count} søk</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Nylig aktivitet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {(analyticsData.recentActivity || []).slice(0, 20).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {activity.event_type?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        {activity.event_data?.game_name && (
                          <span className="text-sm text-muted-foreground">
                            - {activity.event_data.game_name}
                          </span>
                        )}
                        {activity.event_data?.query && (
                          <span className="text-sm text-muted-foreground">
                            - "{activity.event_data.query}"
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString('no-NO')}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Content */}
            {analyticsData.topPerformingContent && analyticsData.topPerformingContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Beste innhold
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {analyticsData.topPerformingContent.slice(0, 10).map((content, index) => (
                        <div key={`${content.content_name}-${content.event_type}`} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                          <div className="flex items-center gap-3">
                            <Badge variant={index < 3 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                            <div>
                              <div className="font-medium">{content.content_name}</div>
                              <div className="text-sm text-muted-foreground capitalize">{content.event_type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{content.event_count || 0}</div>
                            <div className="text-sm text-muted-foreground">{content.unique_users || 0} users</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Game Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Spillstatistikk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Totale spill</span>
                    <span className="text-2xl font-bold">{analyticsData.topGames?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Totale stemmer</span>
                    <span className="text-2xl font-bold">
                      {formatNumber(analyticsData.topGames?.reduce((sum, game) => sum + (game.vote_count || 0), 0) || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gjennomsnitt stemmer per spill</span>
                    <span className="text-2xl font-bold">
                      {analyticsData.topGames?.length ? 
                        Math.round(analyticsData.topGames.reduce((sum, game) => sum + (game.vote_count || 0), 0) / analyticsData.topGames.length) : 0
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement Metrics */}
            {analyticsData.engagementMetrics && analyticsData.engagementMetrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Brukerengasjement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {analyticsData.engagementMetrics.map((metric, index) => (
                      <div key={`${metric.metric}-${index}`} className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {metric.metric?.replace(/_/g, ' ') || 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Behavior Metrics */}
            {analyticsData.userBehaviorMetrics && analyticsData.userBehaviorMetrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5" />
                    Brukeratferd
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.userBehaviorMetrics.map((metric, index) => (
                      <div key={`${metric.metric_name}-${index}`} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{metric.metric_name?.replace(/_/g, ' ') || 'Unknown'}</span>
                          <span className="font-medium">
                            {metric.value ? (typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value) : '0'}
                            {metric.metric_name?.includes('rate') || metric.metric_name?.includes('percentage') ? '%' : ''}
                          </span>
                        </div>
                        <Progress value={typeof metric.value === 'number' ? Math.min(metric.value, 100) : 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Session Analytics */}
          {analyticsData.sessionAnalytics && analyticsData.sessionAnalytics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sesjonsanalytikk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.sessionAnalytics.map((metric) => (
                    <div key={metric.metric_name} className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">
                        {metric.value ? (typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value) : '0'}
                        {metric.metric_name?.includes('minutes') ? ' min' : ''}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {metric.metric_name?.replace(/_/g, ' ') || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            {analyticsData.performanceMetrics && analyticsData.performanceMetrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ytelsesmetrikker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.performanceMetrics.map((metric, index) => (
                      <div key={`${metric.metric_name}-${index}`} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{metric.metric_name?.replace(/_/g, ' ') || 'Unknown'}</span>
                          <span className="font-medium">
                            {metric.value ? (typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value) : '0'}
                            {metric.metric_name?.includes('rate') || metric.metric_name?.includes('percentage') ? '%' : ''}
                            {metric.metric_name?.includes('minutes') ? ' min' : ''}
                          </span>
                        </div>
                        <Progress value={typeof metric.value === 'number' ? Math.min(metric.value, 100) : 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Analytics */}
            {analyticsData.securityMetrics && analyticsData.securityMetrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sikkerhetsanalytikk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {analyticsData.securityMetrics.map((metric, index) => (
                      <div key={`${metric.metric}-${index}`} className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {metric.metric?.replace(/_/g, ' ') || 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Device & Geographic Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Analytics */}
            {analyticsData.deviceAnalytics && analyticsData.deviceAnalytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Enhetsanalytikk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.deviceAnalytics.map((metric, index) => (
                      <div key={`${metric.metric_name}-${index}`} className="flex justify-between p-2 rounded-lg bg-muted">
                        <span className="capitalize">{metric.metric_name?.replace(/_/g, ' ') || 'Unknown'}</span>
                        <span className="font-medium">{formatNumber(metric.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Geographic Analytics */}
            {analyticsData.geographicAnalytics && analyticsData.geographicAnalytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Geografisk analytikk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.geographicAnalytics.map((metric, index) => (
                      <div key={`${metric.metric_name}-${index}`} className="flex justify-between p-2 rounded-lg bg-muted">
                        <span className="capitalize">{metric.metric_name?.replace(/_/g, ' ') || 'Unknown'}</span>
                        <span className="font-medium">{formatNumber(metric.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conversion Funnel */}
          {analyticsData.conversionFunnel && analyticsData.conversionFunnel.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Konverteringskanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.conversionFunnel.map((step, index) => (
                    <div key={step.metric_name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium capitalize">
                          {step.metric_name?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {step.value ? formatNumber(step.value) : '0'}
                        </div>
                        {step.metric_name?.includes('rate') && (
                          <div className="text-sm text-muted-foreground">konverteringsrate</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
