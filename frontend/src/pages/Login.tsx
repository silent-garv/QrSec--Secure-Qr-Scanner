import { useState } from "react";
import { Shield, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { signInWithGoogle, saveUserData } from "@/lib/firebase";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/scan';

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.user) {
        await saveUserData({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
      }
      // redirect back to where user intended (or to /scan)
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login failed:', err);
      alert(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full shadow-glow animate-pulse-glow">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              QrSec
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to access your security dashboard
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Secure Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Please use your Google account to sign in</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Enhanced Security</p>
                <p className="text-muted-foreground">
                  Your connection is encrypted and your data is protected with industry-standard security measures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Login Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Demo: Use any email and password to continue</p>
        </div>
      </div>
    </div>
  );
};

export default Login;