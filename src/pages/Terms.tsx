import { Eye } from 'lucide-react';

export default function Terms() {
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
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Terms of Service</h1>
          <p className="text-slate-600 mb-8">Last updated: October 8, 2025</p>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using BrandTracker's services, you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed">
                BrandTracker provides an AI-powered brand visibility tracking platform that monitors how AI platforms
                mention and respond to queries about your brand. Our service includes analytics, competitor analysis,
                sentiment tracking, and reporting features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Account Registration</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                To use our service, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be at least 18 years of age or have parental consent</li>
                <li>Not share your account with others</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Subscription and Payment</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our service is offered through various subscription plans:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Free Plan: Limited features with 5 AI queries per month</li>
                <li>Pro Plan: $250/month with 500 AI queries and advanced features</li>
                <li>Enterprise Plan: Custom pricing with unlimited queries</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                Payments are processed securely through our payment providers. You agree to provide current, complete,
                and accurate billing information. Subscriptions automatically renew unless cancelled before the renewal date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Acceptable Use</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any malicious code or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Use automated systems to access the service without permission</li>
                <li>Resell or redistribute the service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Intellectual Property</h2>
              <p className="text-slate-600 leading-relaxed">
                The service and its original content, features, and functionality are owned by BrandTracker and are
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                You retain ownership of your brand data and tracking queries. We may use aggregated, anonymized data
                to improve our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Service Availability</h2>
              <p className="text-slate-600 leading-relaxed">
                We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the service. We may
                suspend or terminate the service for maintenance, updates, or in case of security issues. We are not
                liable for any temporary unavailability of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Data and Analytics</h2>
              <p className="text-slate-600 leading-relaxed">
                The AI tracking results and analytics provided by our service are for informational purposes only.
                While we strive for accuracy, we do not guarantee the completeness or accuracy of the data. You are
                responsible for verifying and interpreting the results for your business decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                To the maximum extent permitted by law, BrandTracker shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
                directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from
                your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Cancellation and Refunds</h2>
              <p className="text-slate-600 leading-relaxed">
                You may cancel your subscription at any time through your account settings. Cancellations take effect
                at the end of the current billing period. We offer a 30-day money-back guarantee for first-time Pro
                plan subscribers. No refunds are provided for partial months or unused queries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Modifications to Service</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify or discontinue the service at any time, with or without notice. We may
                also update these terms from time to time. Continued use of the service after changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Termination</h2>
              <p className="text-slate-600 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for any reason, including
                breach of these terms. Upon termination, your right to use the service will cease immediately. All
                provisions that should survive termination shall survive, including ownership provisions, warranty
                disclaimers, and limitations of liability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Governing Law</h2>
              <p className="text-slate-600 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                BrandTracker operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Contact Information</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 font-medium">Email: legal@brandtracker.com</p>
                <p className="text-slate-700 font-medium">Address: 123 AI Street, Tech City, TC 12345</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
