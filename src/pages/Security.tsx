import { Eye, Shield, Lock, Key, Database, Cloud, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Security() {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => navigate('/')} className="flex items-center space-x-2 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">BrandTracker</span>
            </button>

            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => navigate('/')}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Back to Home
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Security</h1>
            <p className="text-xl text-slate-600">
              Your data security is our top priority. Learn how we protect your information.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Security Commitment</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              At BrandTracker, we implement industry-leading security practices to protect your brand data and
              personal information. Our security infrastructure is designed to meet the highest standards and
              compliance requirements.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">SOC 2 Type II Certified</h3>
                  <p className="text-sm text-slate-600">Independently audited security controls</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">GDPR Compliant</h3>
                  <p className="text-sm text-slate-600">Full compliance with data protection regulations</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">ISO 27001 Certified</h3>
                  <p className="text-sm text-slate-600">Information security management standards</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">99.9% Uptime SLA</h3>
                  <p className="text-sm text-slate-600">Reliable and available service guarantee</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Data Encryption</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                All data is encrypted both in transit and at rest:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>TLS 1.3 encryption for all data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>End-to-end encryption for sensitive brand data</li>
                <li>Encrypted backups with separate encryption keys</li>
                <li>Regular key rotation and management</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Access Control</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                We implement strict access controls to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Multi-factor authentication (MFA) for all accounts</li>
                <li>Role-based access control (RBAC) for team members</li>
                <li>Single sign-on (SSO) support for enterprise customers</li>
                <li>IP whitelisting and access restrictions</li>
                <li>Regular access reviews and audit logs</li>
                <li>Automatic session timeout and re-authentication</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Infrastructure Security</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our infrastructure is built on secure, enterprise-grade platforms:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Hosted on secure, SOC 2 compliant cloud infrastructure</li>
                <li>Isolated database instances with private networking</li>
                <li>DDoS protection and Web Application Firewall (WAF)</li>
                <li>Automated security patching and updates</li>
                <li>Network segmentation and firewall rules</li>
                <li>Intrusion detection and prevention systems</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Backup and Recovery</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                We maintain comprehensive backup and disaster recovery procedures:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Automated daily backups with 30-day retention</li>
                <li>Geo-redundant backup storage across multiple regions</li>
                <li>Point-in-time recovery capabilities</li>
                <li>Regular disaster recovery testing</li>
                <li>Business continuity planning and documentation</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Security Monitoring</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                We continuously monitor our systems for security threats:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>24/7 security operations center (SOC) monitoring</li>
                <li>Real-time threat detection and alerting</li>
                <li>Automated vulnerability scanning</li>
                <li>Regular penetration testing by third parties</li>
                <li>Security incident response team and procedures</li>
                <li>Comprehensive audit logging and analysis</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Employee Security</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our team follows strict security protocols:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Background checks for all employees</li>
                <li>Regular security awareness training</li>
                <li>Strict data access policies and procedures</li>
                <li>Non-disclosure agreements (NDAs)</li>
                <li>Principle of least privilege access</li>
                <li>Secure device management and policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Third-Party Security</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We carefully vet all third-party service providers:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Security assessments of all vendors</li>
                <li>Data processing agreements (DPAs)</li>
                <li>Regular security audits of third parties</li>
                <li>Limited data sharing on need-to-know basis</li>
                <li>Vendor security compliance monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Compliance</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We maintain compliance with major security and privacy regulations:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>SOC 2 Type II</li>
                <li>ISO/IEC 27001</li>
                <li>HIPAA compliance for healthcare customers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Security Bug Bounty</h2>
              <p className="text-slate-600 leading-relaxed">
                We operate a responsible disclosure program and welcome security researchers to report vulnerabilities.
                If you discover a security issue, please email us at security@brandtracker.com with details.
                We commit to responding within 24 hours and working with you to resolve the issue promptly.
              </p>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions About Security?</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our security team is available to answer your questions and provide additional information about our
                security practices. Enterprise customers can request detailed security documentation and compliance reports.
              </p>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 font-medium">Email: security@brandtracker.com</p>
                <p className="text-slate-700 font-medium">Security Portal: security.brandtracker.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
