import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { auth, onAuthChange, signOut } from "@/lib/firebase";

// Types for window global
declare global {
  interface Window {
    __deferredPrompt?: any;
  }
}

const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (onAuthChange) {
      const unsub = onAuthChange((u) => {
        setUser(u);
      });
      return () => unsub && typeof unsub === 'function' && unsub();
    }
    return;
  }, []);

  // PWA install availability
  const [installAvailable, setInstallAvailable] = useState<boolean>(false);

  useEffect(() => {
    const check = () => {
      setInstallAvailable(!!(window as any).__deferredPrompt);
    };
    const onAvailable = () => setInstallAvailable(true);
    const onClosed = () => setInstallAvailable(false);
    // initial check
    check();
    window.addEventListener('pwa-installable', onAvailable as EventListener);
    window.addEventListener('pwa-install-closed', onClosed as EventListener);
    // Always check global flag on mount
    setInstallAvailable(!!(window as any).__deferredPrompt);
    return () => {
      window.removeEventListener('pwa-installable', onAvailable as EventListener);
      window.removeEventListener('pwa-install-closed', onClosed as EventListener);
      // No beforeHandler to clean up
    };
  }, []);

  // detect iOS standalone availability
  const [isIosInstall, setIsIosInstall] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isInStandalone = (window as any).navigator?.standalone || window.matchMedia('(display-mode: standalone)').matches;
    setIsIosInstall(isIOS && !isInStandalone);
  }, []);

  const handleSignOut = async () => {
    try {
      const res = await signOut();
      if (res.error) {
        console.error('Sign out error', res.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      navigate('/login');
      setMenuOpen(false);
    }
  };

  return (
  <header className="w-full header-navbar border-b border-border/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-semibold text-lg brand">QrSec</Link>
            <nav className="hidden sm:flex gap-2">
              <Button 
                variant="link" 
                className="text-sm nav-link hover:opacity-90 p-0 h-auto"
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: '/scan' } });
                  } else {
                    navigate('/scan');
                  }
                }}
              >
                Scan
              </Button>
              <Link to="/dashboard" className="text-sm nav-link hover:opacity-90">Dashboard</Link>
              <Button 
                variant="link" 
                className="text-sm nav-link hover:opacity-90 p-0 h-auto"
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: '/learn' } });
                  } else {
                    navigate('/learn');
                  }
                }}
              >
                Security Guide
              </Button>
            </nav>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {/* Always show install button for debug/testing */}
            <Button size="sm" variant="outline" className="nav-btn" onClick={async () => {
              const dp = (window as any).__deferredPrompt;
              console.log('DEBUG: deferredPrompt', dp);
              if (dp) {
                try {
                  await dp.prompt();
                  await dp.userChoice;
                } catch (err) {
                  console.warn('PWA install failed', err);
                }
                (window as any).__deferredPrompt = null;
                setInstallAvailable(false);
                window.dispatchEvent(new CustomEvent('pwa-install-closed'));
                return;
              }
              // Fallback for iOS: show simple instructions
              if (isIosInstall) {
                try {
                  alert('To install this app on iOS: tap the Share button in Safari and choose "Add to Home Screen".');
                } catch (e) {
                  console.warn(e);
                }
              } else {
                alert('Install prompt is not available. If you are on Chrome/Edge, make sure you are not in incognito, not already installed, and have a valid manifest and service worker.');
              }
            }}>Install App</Button>
            {/* Dark/Light mode toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="ml-2 nav-btn"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
            {user ? (
              <>
                <span className="text-sm nav-link">{user.displayName ?? user.email}</span>
                <Button variant="ghost" size="sm" className="nav-btn" onClick={handleSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" className="nav-btn">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="ghost" size="sm" className="nav-btn">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((s) => !s)}
              className="p-2 rounded-md hover:bg-muted/10"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border/50 header-navbar">
          <div className="px-4 pt-3 pb-4 space-y-2">
            <Button 
              variant="link" 
              className="block text-sm nav-link hover:opacity-90 p-0 h-auto w-full text-left"
              onClick={() => {
                setMenuOpen(false);
                if (!user) {
                  navigate('/login', { state: { from: '/scan' } });
                } else {
                  navigate('/scan');
                }
              }}
            >
              Scan
            </Button>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm nav-link hover:opacity-90">Dashboard</Link>
            <Button 
              variant="link" 
              className="block text-sm nav-link hover:opacity-90 p-0 h-auto w-full text-left"
              onClick={() => {
                setMenuOpen(false);
                if (!user) {
                  navigate('/login', { state: { from: '/learn' } });
                } else {
                  navigate('/learn');
                }
              }}
            >
              Security Guide
            </Button>
            <div className="pt-2">
              {user ? (
                <>
                  <div className="text-sm nav-link mb-2">{user.displayName ?? user.email}</div>
                  <Button size="sm" className="w-full nav-btn" onClick={handleSignOut}>Sign Out</Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full nav-btn">Sign In</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full nav-btn">Sign Up</Button>
                  </Link>
                </div>
              )}
              {/* Dark/Light mode toggle for mobile */}
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full nav-btn"
                  onClick={toggleTheme}
                  aria-label="Toggle dark mode"
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
              </div>
              {installAvailable && (
                <div className="pt-2">
                  <Button size="sm" className="w-full nav-btn" onClick={async () => {
                    const dp = (window as any).__deferredPrompt;
                    if (!dp) return;
                    try {
                      await dp.prompt();
                      await dp.userChoice;
                    } catch (err) {
                      console.warn('PWA install failed', err);
                    }
                    (window as any).__deferredPrompt = null;
                    setInstallAvailable(false);
                    window.dispatchEvent(new CustomEvent('pwa-install-closed'));
                    setMenuOpen(false);
                  }}>Install App</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
