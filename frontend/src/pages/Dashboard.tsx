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
  LogOut
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
import { getRecentScans, auth, signOut, listenToScans } from "@/lib/firebase";


interface ScanHistory {
  id: string;
  url: string;
  status: 'safe' | 'warning' | 'danger';
  score: number;
  timestamp: string;
  type: 'url' | 'qr';
}

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

  const handleNewScan = () => {
    navigate("/scan");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg shadow-glow">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  QrSec Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleNewScan} className="bg-gradient-primary hover:opacity-90">
                <Shield className="h-4 w-4 mr-2" />
                New Scan
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                  <p className="text-3xl font-bold">{scanHistory.length}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Safe Links</p>
                  <p className="text-3xl font-bold text-success">{safeCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                  <p className="text-3xl font-bold text-warning">{warningCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Threats</p>
                  <p className="text-3xl font-bold text-destructive">{dangerCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan History */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Scan History
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search URLs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-input/50"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
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
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scan.status)}
                        <Badge variant="outline" className="text-xs">
                          {scan.type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{scan.url}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(scan.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Score: {scan.score}/100</p>
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              scan.status === 'safe' ? 'bg-success' :
                              scan.status === 'warning' ? 'bg-warning' :
                              'bg-destructive'
                            }`}
                            style={{ width: `${scan.score}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
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