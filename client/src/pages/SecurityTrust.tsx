import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Key, Eye, Server, Users, AlertTriangle, CheckCircle, Calendar } from "lucide-react";

export default function SecurityTrust() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h1 className="text-4xl font-bold mb-4">Security & Trust</h1>
          <p className="text-slate-400">How we protect your data and earn your trust</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Effective Date: January 7, 2026
            </span>
            <span>|</span>
            <span>Last Updated: January 7, 2026</span>
            <span>|</span>
            <span>Version: v1.0</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-green-900/20 border-green-700 text-center">
            <CardContent className="p-6">
              <Lock className="w-10 h-10 mx-auto mb-3 text-green-400" />
              <div className="text-2xl font-bold text-green-400">256-bit</div>
              <div className="text-sm text-slate-400">AES Encryption</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-900/20 border-blue-700 text-center">
            <CardContent className="p-6">
              <Shield className="w-10 h-10 mx-auto mb-3 text-blue-400" />
              <div className="text-2xl font-bold text-blue-400">TLS 1.3</div>
              <div className="text-sm text-slate-400">In Transit Security</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-900/20 border-purple-700 text-center">
            <CardContent className="p-6">
              <Key className="w-10 h-10 mx-auto mb-3 text-purple-400" />
              <div className="text-2xl font-bold text-purple-400">MFA</div>
              <div className="text-sm text-slate-400">Multi-Factor Auth</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="w-5 h-5 text-green-400" />
                Data Encryption
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-semibold">At Rest</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    All stored data is encrypted using AES-256 encryption, the same standard used by banks and government agencies.
                  </p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-semibold">In Transit</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    All data transmitted between your device and our servers uses TLS 1.3 encryption.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Server className="w-5 h-5 text-blue-400" />
                Secure Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Enterprise-Grade Hosting</span>
                    <p className="text-sm text-slate-400">Hosted on SOC 2 compliant cloud infrastructure with 99.9% uptime</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Automated Backups</span>
                    <p className="text-sm text-slate-400">Daily encrypted backups with point-in-time recovery capabilities</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">DDoS Protection</span>
                    <p className="text-sm text-slate-400">Enterprise-level protection against distributed denial-of-service attacks</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Web Application Firewall</span>
                    <p className="text-sm text-slate-400">Real-time protection against common web vulnerabilities</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-purple-400" />
                Access Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Role-Based Access</span>
                    <p className="text-sm text-slate-400">Employees only access data necessary for their job function</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Multi-Factor Authentication</span>
                    <p className="text-sm text-slate-400">Required for all administrative access to systems</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Limited Employee Access</span>
                    <p className="text-sm text-slate-400">Customer data access is restricted to essential personnel only</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Session Management</span>
                    <p className="text-sm text-slate-400">Automatic session timeout and secure token handling</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5 text-amber-400" />
                Audit & Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Comprehensive Audit Logging</span>
                    <p className="text-sm text-slate-400">All system access and data changes are logged with timestamps</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Signature Audit Trail</span>
                    <p className="text-sm text-slate-400">Legal compliance tracking for all electronic signatures with IP, device, and timestamp records</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">24/7 Monitoring</span>
                    <p className="text-sm text-slate-400">Continuous security monitoring for suspicious activity</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">Incident Response</span>
                    <p className="text-sm text-slate-400">Documented procedures for security incident handling</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/30 border-amber-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-5 h-5" />
                Report a Vulnerability
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                We take security seriously. If you discover a security vulnerability, please report it responsibly:
              </p>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p><strong>Email:</strong> strategicservicesavers@gmail.com</p>
                <p className="text-sm text-slate-400 mt-2">
                  Please include detailed steps to reproduce the vulnerability. We will acknowledge receipt within 48 hours 
                  and work with you to understand and address the issue.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>We retain data for the following periods:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="font-semibold">Account Data</div>
                  <div className="text-sm text-slate-400">While account is active + 7 years</div>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="font-semibold">Call Recordings</div>
                  <div className="text-sm text-slate-400">90 days (unless legally required longer)</div>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="font-semibold">Claim Documentation</div>
                  <div className="text-sm text-slate-400">7 years after claim closure</div>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="font-semibold">Signature Audit Logs</div>
                  <div className="text-sm text-slate-400">7 years (legal compliance)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>Security or privacy questions?</p>
              <p className="mt-2">
                <strong>Email:</strong> strategicservicesavers@gmail.com<br />
                <strong>Phone:</strong> +1 (877) 378-5143<br />
                <strong>Website:</strong> strategicservicesavers.org
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Strategic Services Savers | strategicservicesavers.org</p>
        </div>
      </div>
    </div>
  );
}
