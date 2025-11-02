import { useState, useRef, useCallback, useEffect } from "react";
import { Shield, Scan, Link2, QrCode, AlertTriangle, CheckCircle, XCircle, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Html5Qrcode } from "html5-qrcode";
import { addScan, auth, isFirebaseConfigured } from "@/lib/firebase";
import { checkLinkBackend } from "@/lib/linkCheck";

interface ScanResult {
  url: string;
  status: 'safe' | 'warning' | 'danger';
  score: number;
  details: string;
}

const SecurityScanner = () => {
  const [inputUrl, setInputUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Cleanup function to stop camera stream
  useEffect(() => {
    // start scanner when camera dialog opens
    if (isCameraOpen) {
      startCamera();
    }
    return () => {
      // cleanup
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOpen]);

  const handleScan = async () => {
    if (!inputUrl.trim()) return;
    setScanning(true);
    setResult(null);

    // Notify if Firebase isn't configured - can still scan but won't save history
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured - scan history will not be saved');
    }

    let status: ScanResult['status'] = 'safe';
    let details = '';
    let score = 95;
    let serviceUsed = '';

    // Use backend for link check
    const backendResult = await checkLinkBackend(inputUrl);
    if (backendResult.error) {
      details = `Error: ${backendResult.error}`;
      status = 'warning';
      score = 50;
    } else if (backendResult.service === 'VirusTotal') {
      serviceUsed = 'VirusTotal';
      const vtData = backendResult.result.data?.attributes?.last_analysis_stats;
      if (vtData) {
        if (vtData.malicious > 0) {
          status = 'danger';
          score = 10;
          details += `VirusTotal: ${vtData.malicious} engines flagged as malicious.\n`;
        } else if (vtData.suspicious > 0) {
          status = 'warning';
          score = 60;
          details += `VirusTotal: ${vtData.suspicious} engines flagged as suspicious.\n`;
        } else {
          details += 'VirusTotal: No threats detected.\n';
        }
      }
    } else if (backendResult.service === 'Google Safe Browsing') {
      serviceUsed = 'Google Safe Browsing';
      const gsData = backendResult.result.matches;
      if (gsData && gsData.length > 0) {
        status = 'danger';
        score = 5;
        details += 'Google Safe Browsing: Threat detected!\n';
      } else {
        details += 'Google Safe Browsing: No threats detected.\n';
      }
    } else {
      details = 'Unknown result from backend.';
      status = 'warning';
      score = 50;
    }

    const scanResult: ScanResult = {
      url: inputUrl,
      status,
      score,
      details: details + `\nChecked using: ${serviceUsed}`,
    };
    setResult(scanResult);
    setScanning(false);

    // Save scan to Firestore for authenticated users only if Firebase is configured
    if (isFirebaseConfigured()) {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          await addScan(userId, inputUrl, status, score, 'url');
        } catch (err) {
          console.error('Failed to save scan', err);
        }
      }
    }
  };

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const startCamera = async () => {
    try {
      // Initialize Html5Qrcode scanner in the element with id 'qr-reader'
      const readerId = 'qr-reader';

      // Wait for the DOM element to be mounted (Dialog may mount via portal/animation)
      const waitForElement = (id: string, timeout = 2000) => new Promise<HTMLElement>((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
          const el = document.getElementById(id) as HTMLElement | null;
          if (el) return resolve(el);
          if (Date.now() - start > timeout) return reject(new Error('Element not found'));
          setTimeout(tick, 50);
        };
        tick();
      });

      await waitForElement(readerId, 2000);
      const html5QrCode = new Html5Qrcode(readerId);
      html5QrcodeRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras();
      const cameraId = (cameras && cameras.length) ? cameras[0].id : undefined;

      await html5QrCode.start(
        { facingMode: 'environment' } as any,
        {
          fps: 10,
          qrbox: 250,
        },
        async (decodedText) => {
          // On success: close camera, analyze URL immediately
          setIsCameraOpen(false);
          setInputUrl(decodedText);
          
          // Stop scanner first
          try { await html5QrCode.stop(); } catch(e){}
          
          // Then analyze the URL
          setScanning(true);
          setResult(null);
          
          try {
            const backendResult = await checkLinkBackend(decodedText);
            let status: ScanResult['status'] = 'safe';
            let details = '';
            let score = 95;
            let serviceUsed = '';

            if (backendResult.error) {
              details = `Error: ${backendResult.error}`;
              status = 'warning';
              score = 50;
            } else if (backendResult.service === 'VirusTotal') {
              serviceUsed = 'VirusTotal';
              const vtData = backendResult.result.data?.attributes?.last_analysis_stats;
              if (vtData) {
                if (vtData.malicious > 0) {
                  status = 'danger';
                  score = 10;
                  details += `VirusTotal: ${vtData.malicious} engines flagged as malicious.\n`;
                } else if (vtData.suspicious > 0) {
                  status = 'warning';
                  score = 60;
                  details += `VirusTotal: ${vtData.suspicious} engines flagged as suspicious.\n`;
                } else {
                  details += 'VirusTotal: No threats detected.\n';
                }
              }
            } else if (backendResult.service === 'Google Safe Browsing') {
              serviceUsed = 'Google Safe Browsing';
              const gsData = backendResult.result.matches;
              if (gsData && gsData.length > 0) {
                status = 'danger';
                score = 5;
                details += 'Google Safe Browsing: Threat detected!\n';
              } else {
                details += 'Google Safe Browsing: No threats detected.\n';
              }
            }

            // Update UI with results
            setResult({
              url: decodedText,
              status,
              score,
              details: details + `\nChecked using: ${serviceUsed}`,
            });

            // Save scan if user is authenticated
            const userId = auth.currentUser?.uid;
            if (userId) {
              await addScan(userId, decodedText, status, score, 'qr');
            }
          } catch (err) {
            console.error('Failed to analyze or save scan:', err);
          } finally {
            setScanning(false);
          }
        },
        (errorMessage) => {
          // parse errors while scanning
          // console.debug('QR scan error', errorMessage);
        }
      );

    } catch (error) {
      console.error('Error initializing QR scanner:', error);
      alert('Unable to access camera or start QR scanner.');
    }
  };

  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping html5Qrcode', err);
      }
      try { html5QrcodeRef.current.clear(); } catch(e){}
      html5QrcodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleQRScan = () => {
    setIsCameraOpen(true);
    // start after dialog opens (useEffect below will detect isCameraOpen change)
  };

  const handleCloseCamera = async () => {
    await stopCamera();
    setIsCameraOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'danger': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'success';
      case 'warning': return 'warning';
      case 'danger': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-4 shadow-glow">
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            QrSec
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Protect yourself from malicious links and QR codes. Get instant security analysis powered by VirusTotal.
          </p>
        </div>

        {/* Scanner Interface */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary" />
              URL Security Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manual URL Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Enter URL to scan
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              {/* QR Code Scanner */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Scan QR Code
                </label>
                <Button 
                  variant="outline" 
                  onClick={handleQRScan}
                  className="w-full border-primary/30 hover:border-primary"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Open QR Scanner
                </Button>
              </div>
            </div>

            {/* Scan Button */}
            <Button
              onClick={handleScan}
              disabled={!inputUrl.trim() || scanning}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow"
              size="lg"
            >
              {scanning ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Scanning...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Analyze Security
                </>
              )}
            </Button>

            {/* Scanning Animation */}
            {scanning && (
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-y-0 w-full bg-gradient-scanner animate-scan-line" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className={`border-2 ${
            result.status === 'safe' ? 'border-success/50 shadow-success' :
            result.status === 'warning' ? 'border-warning/50' :
            'border-destructive/50 shadow-danger'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  Security Analysis Complete
                </div>
                <Badge variant={getStatusColor(result.status) as any}>
                  Score: {result.score}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Analyzed URL:</p>
                <p className="font-mono text-sm break-all">{result.url}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Security Score</span>
                    <span className="font-medium">{result.score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        result.status === 'safe' ? 'bg-gradient-success' :
                        result.status === 'warning' ? 'bg-warning' :
                        'bg-gradient-danger'
                      }`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{result.details}</p>

              {result.status === 'safe' && (
                <div className="flex flex-col items-center gap-2 text-success">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Safe to proceed</span>
                  </div>
                  <Button
                    className="mt-2 bg-success text-white"
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    Go to Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real-time Protection</h3>
              <p className="text-sm text-muted-foreground">
                Instant security analysis using VirusTotal's comprehensive database
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <QrCode className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="font-semibold mb-2">QR Code Scanner</h3>
              <p className="text-sm text-muted-foreground">
                Safely scan QR codes and analyze their destinations
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Scan className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Detailed Reports</h3>
              <p className="text-sm text-muted-foreground">
                Get comprehensive security insights and threat analysis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Camera Dialog */}
        <Dialog open={isCameraOpen} onOpenChange={(open) => setIsCameraOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                QR Code Scanner
              </DialogTitle>
            </DialogHeader>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <div id="qr-reader" className="w-full h-full" />
              {/* QR Code Scanning Frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary" />
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-scan-line" />
                </div>
              </div>
              {/* Helper text */}
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full inline-block">
                  Point your camera at a QR code
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCloseCamera} variant="outline" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Close Camera
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SecurityScanner;