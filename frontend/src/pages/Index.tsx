import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store on window so other components (e.g., Navbar) can access it
      (window as any).__deferredPrompt = e;
      // Notify other components that install is available
      window.dispatchEvent(new CustomEvent('pwa-installable'));
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      // Optionally track accepted/dismissed
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      // Clear global prompt and notify others
      (window as any).__deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-install-closed'));
    } catch (err) {
      console.warn('Install prompt failed', err);
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-primary rounded-full shadow-glow">
            <Shield className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">QrSec</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            <span className="font-semibold text-primary">Your shield against QR code threats.</span><br/>
            QrSec is a modern security app designed to protect you from malicious links and unsafe QR codes. With real-time analysis powered by VirusTotal, you can scan, verify, and track every QR code and URL you encounter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-card/70 rounded-xl p-6 shadow-lg text-left">
            <h2 className="text-2xl font-bold mb-2 text-primary">Why QR Security Matters</h2>
            <ul className="list-disc ml-6 text-base text-muted-foreground space-y-2">
              <li>QR codes are everywhere—from payments to websites to event check-ins.</li>
              <li>Malicious QR codes can steal your data, install malware, or trick you into unsafe actions.</li>
              <li>Most devices scan QR codes without warning you about hidden risks.</li>
            </ul>
          </div>
          <div className="bg-card/70 rounded-xl p-6 shadow-lg text-left">
            <h2 className="text-2xl font-bold mb-2 text-primary">How QrSec Protects You</h2>
            <ul className="list-disc ml-6 text-base text-muted-foreground space-y-2">
              <li>Instantly scans QR codes and URLs for known threats using VirusTotal.</li>
              <li>Shows clear safety ratings and details for every scan.</li>
              <li>Keeps a private history of your scans so you can review and report suspicious activity.</li>
              <li>Works on any device—install as a PWA for offline access and quick scanning.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/scan">
            <button className="px-8 py-4 bg-gradient-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-glow hover:scale-105 transition">Start Scanning</button>
          </Link>
          <Link to="/signup">
            <button className="px-8 py-4 border border-border rounded-xl text-lg text-muted-foreground font-semibold hover:bg-card/30 transition">Create Account</button>
          </Link>
        </div>

        {/* PWA install prompt dialog */}
        <Dialog open={showInstallPrompt} onOpenChange={(open) => setShowInstallPrompt(open)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Install QrSec</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-muted-foreground">Install QrSec to your device for quick access and offline support.</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleInstall} className="w-full">Install App</Button>
              <Button variant="outline" onClick={() => setShowInstallPrompt(false)} className="w-full">Dismiss</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card/60 rounded-lg shadow text-center">
            <h3 className="font-semibold text-lg mb-2">Real-time Protection</h3>
            <p className="text-sm text-muted-foreground">Instant security analysis using VirusTotal's global threat database.</p>
          </div>
          <div className="p-6 bg-card/60 rounded-lg shadow text-center">
            <h3 className="font-semibold text-lg mb-2">QR Code Scanner</h3>
            <p className="text-sm text-muted-foreground">Scan QR codes safely with camera support and instant threat detection.</p>
          </div>
          <div className="p-6 bg-card/60 rounded-lg shadow text-center">
            <h3 className="font-semibold text-lg mb-2">Scan History</h3>
            <p className="text-sm text-muted-foreground">Save and review your scans on your dashboard. Stay informed and protected.</p>
          </div>
        </div>
        <div className="mt-10 text-center text-muted-foreground text-sm max-w-2xl mx-auto">
          <p>
            <span className="font-semibold text-primary">QrSec</span> is free to use and respects your privacy. Your scan history is stored securely and never shared. <br/>
            Ready to take control of your QR code safety? Get started now!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
