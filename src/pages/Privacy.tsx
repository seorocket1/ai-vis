import { Eye } from 'lucide-react';

export default function Privacy() {
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
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
          <p className="text-slate-600 mb-8">Last updated: October 8, 2025</p>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-600 leading-relaxed">
                Welcome to BrandTracker. We respect your privacy and are committed to protecting your personal data.
                This privacy policy will inform you about how we look after your personal data when you visit our
                website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We collect and process the following types of information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Identity data: name, username, title</li>
                <li>Contact data: email address, phone number</li>
                <li>Account data: login credentials, preferences</li>
                <li>Usage data: how you use our website and services</li>
                <li>Technical data: IP address, browser type, device information</li>
                <li>Brand tracking data: queries, analysis results, competitors tracked</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use your personal data for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>To provide and maintain our AI brand visibility tracking service</li>
                <li>To notify you about changes to our service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To send you marketing communications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against
                unauthorized or unlawful processing, accidental loss, destruction, or damage. We use industry-standard
                encryption protocols and secure data storage solutions. All data transmission is encrypted using SSL/TLS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Retention</h2>
              <p className="text-slate-600 leading-relaxed">
                We will retain your personal data only for as long as necessary to fulfill the purposes for which we
                collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements.
                When you delete your account, we will delete or anonymize your personal data within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Under data protection laws, you have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>The right to access your personal data</li>
                <li>The right to rectification of inaccurate data</li>
                <li>The right to erasure of your data</li>
                <li>The right to restrict processing</li>
                <li>The right to data portability</li>
                <li>The right to object to processing</li>
                <li>The right to withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Third-Party Services</h2>
              <p className="text-slate-600 leading-relaxed">
                We may employ third-party companies and individuals to facilitate our service, provide service-related
                services, or assist us in analyzing how our service is used. These third parties have access to your
                personal data only to perform these tasks on our behalf and are obligated not to disclose or use it
                for any other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies</h2>
              <p className="text-slate-600 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and hold certain
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is
                being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update our privacy policy from time to time. We will notify you of any changes by posting the
                new privacy policy on this page and updating the "Last updated" date. You are advised to review this
                privacy policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 font-medium">Email: privacy@brandtracker.com</p>
                <p className="text-slate-700 font-medium">Address: 123 AI Street, Tech City, TC 12345</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
