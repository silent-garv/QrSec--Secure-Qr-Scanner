import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  Search,
  Download,
  LogOut,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  FileJson,
  FileSpreadsheet,
  AreaChart as AreaChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
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
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { getRecentScans, auth, signOut, listenToScans } from "@/lib/firebase";


interface ScanHistory {
  id: string;
  url: string;
  status: 'safe' | 'warning' | 'danger';
  score: number;
  timestamp: string;
  type: 'url' | 'qr';
}

type ExportFormat = 'csv' | 'excel' | 'json';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }
    unsub = listenToScans(user.uid, (scans) => {
      const mapped = scans.map((r: any) => ({
        id: r.id,
        url: r.url || '',
        status: r.status || 'safe',
        score: r.score || 0,
        timestamp: r.createdAt ? (r.createdAt.seconds ? new Date(r.createdAt.seconds * 1000).toISOString() : r.createdAt) : new Date().toISOString(),
        type: r.type || 'url'
      }));
      setScanHistory(mapped);
    }, 50);
    return () => { if (unsub) unsub(); };
  }, [navigate]);

  const filteredHistory = scanHistory.filter(scan =>
    scan.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const safeCount = scanHistory.filter(s => s.status === 'safe').length;
  const warningCount = scanHistory.filter(s => s.status === 'warning').length;
  const dangerCount = scanHistory.filter(s => s.status === 'danger').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'danger': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.error) {
      console.error('Error signing out:', result.error);
      return;
    }
    navigate("/login");
  };

  const handleExport = (format: ExportFormat) => {
    const fileName = `qrsec-scan-history-${new Date().toISOString().split('T')[0]}`;
    const data = filteredHistory.map(scan => ({
      url: scan.url,
      status: scan.status,
      score: scan.score,
      type: scan.type,
      timestamp: scan.timestamp
    }));

    let content: string;
    let type: string;
    let extension: string;

    switch (format) {
      case 'csv':
        content = [
          ['URL', 'Status', 'Score', 'Type', 'Timestamp'],
          ...data.map(item => [
            item.url,
            item.status,
            item.score,
            item.type,
            item.timestamp
          ])
        ].map(row => row.map(item => `"${item}"`).join(',')).join('\n');
        type = 'text/csv;charset=utf-8;';
        extension = 'csv';
        break;

      case 'excel':
        content = [
          ['URL', 'Status', 'Score', 'Type', 'Timestamp'],
          ...data.map(item => [
            item.url,
            item.status,
            item.score,
            item.type,
            item.timestamp
          ])
        ].map(row => row.join('\t')).join('\n');
        type = 'application/vnd.ms-excel;charset=utf-8;';
        extension = 'xls';
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        type = 'application/json;charset=utf-8;';
        extension = 'json';
        break;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNewScan = () => {
    navigate("/scan");
  };

  // Prepare chart data
  const dailyScans = scanHistory.reduce((acc: any, scan) => {
    const date = new Date(scan.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { safe: 0, warning: 0, danger: 0, total: 0 };
    }
    acc[date][scan.status]++;
    acc[date].total++;
    return acc;
  }, {});

  const chartData = Object.entries(dailyScans).map(([date, counts]: [string, any]) => ({
    date,
    ...counts
  })).slice(-7); // Last 7 days

  const pieData = [
    { name: 'Safe', value: safeCount, color: '#22c55e' },
    { name: 'Warning', value: warningCount, color: '#f59e0b' },
    { name: 'Danger', value: dangerCount, color: '#ef4444' }
  ];



  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-9 h-9 bg-gradient-primary rounded-lg shadow-glow">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="hidden sm:block text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                QrSec Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleNewScan} 
                size="sm"
                className="bg-gradient-primary hover:opacity-90 hidden sm:flex"
              >
                <Shield className="h-4 w-4 mr-2" />
                New Scan
              </Button>
              <Button 
                onClick={handleNewScan}
                size="icon"
                className="bg-gradient-primary hover:opacity-90 sm:hidden"
              >
                <Shield className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{scanHistory.length}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '100%' }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5 hover:shadow-sm transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Safe Links</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 text-success">{safeCount}</p>
                </div>
                <div className="p-2 bg-success/10 rounded-full">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-success/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success" 
                  style={{ width: `${(safeCount / scanHistory.length) * 100}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5 hover:shadow-sm transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 text-warning">{warningCount}</p>
                </div>
                <div className="p-2 bg-warning/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-warning/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning" 
                  style={{ width: `${(warningCount / scanHistory.length) * 100}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5 hover:shadow-sm transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Threats</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 text-destructive">{dangerCount}</p>
                </div>
                <div className="p-2 bg-destructive/10 rounded-full">
                  <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-destructive/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-destructive" 
                  style={{ width: `${(dangerCount / scanHistory.length) * 100}%` }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AreaChartIcon className="h-5 w-5 text-primary" />
                Scan Activity Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{fill: 'currentColor'}}
                    />
                    <YAxis className="text-xs" tick={{fill: 'currentColor'}} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="safe" 
                      stackId="1"
                      stroke="#22c55e" 
                      fill="url(#safeGradient)" 
                      name="Safe"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="warning" 
                      stackId="1"
                      stroke="#f59e0b" 
                      fill="url(#warningGradient)" 
                      name="Warning"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="danger" 
                      stackId="1"
                      stroke="#ef4444" 
                      fill="url(#dangerGradient)" 
                      name="Danger"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Security Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan Activity Bar Chart */}
        <Card className="border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-primary" />
              Daily Scan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs" 
                    tick={{fill: 'currentColor'}}
                  />
                  <YAxis className="text-xs" tick={{fill: 'currentColor'}} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="safe" name="Safe" fill="#22c55e" stackId="a" />
                  <Bar dataKey="warning" name="Warning" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="danger" name="Danger" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Scan History */}
  <Card className="border-border/50 bg-scan-history">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Scan History
              </CardTitle>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search URLs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-input/50"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      <FileJson className="h-4 w-4 mr-2" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scans found matching your search.</p>
                </div>
              ) : (
                filteredHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="group relative flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(scan.status)}
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {scan.type.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="hidden sm:block text-muted-foreground/50">•</span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {formatDate(scan.timestamp)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm truncate flex-1">{scan.url}</p>
                          <span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(scan.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                scan.status === 'safe' ? 'bg-success' :
                                scan.status === 'warning' ? 'bg-warning' :
                                'bg-destructive'
                              }`}
                              style={{ width: `${scan.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {scan.score}/100
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="font-semibold mb-2">Security Trends</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View detailed analytics and security insights for your scanned URLs.
                  </p>
                  <Button variant="outline" size="sm">
                    View Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Shield className="h-12 w-12 text-accent" />
                <div>
                  <h3 className="font-semibold mb-2">Security Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure your security preferences and notification settings.
                  </p>
                  <Button variant="outline" size="sm">
                    Manage Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;