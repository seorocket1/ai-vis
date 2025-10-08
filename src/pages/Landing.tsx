import { useEffect, useRef } from 'react';
import {
  TrendingUp,
  Eye,
  Target,
  BarChart3,
  Zap,
  Shield,
  Users,
  Globe,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  LineChart,
  MessageSquare,
  Bell,
  Brain
} from 'lucide-react';

export default function Landing() {
  const navigate = (path: string) => {
    window.location.href = path;
  };
  const logoScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGSAP = async () => {
      try {
        const gsap = (await import('gsap')).default;

        const heroBadge = document.querySelector('.hero-badge');
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroCta = document.querySelector('.hero-cta');
        const heroImage = document.querySelector('.hero-image');

        if (heroBadge) {
          gsap.from(heroBadge, {
            opacity: 0,
            scale: 0.8,
            duration: 0.6,
            ease: 'back.out(1.7)'
          });
        }

        if (heroTitle) {
          gsap.from(heroTitle, {
            opacity: 0,
            y: 50,
            duration: 1,
            delay: 0.2,
            ease: 'power3.out'
          });
        }

        if (heroSubtitle) {
          gsap.from(heroSubtitle, {
            opacity: 0,
            y: 30,
            duration: 1,
            delay: 0.5,
            ease: 'power3.out'
          });
        }

        if (heroCta) {
          gsap.from(heroCta, {
            opacity: 0,
            y: 30,
            duration: 1,
            delay: 0.8,
            ease: 'power3.out'
          });
        }

        if (heroImage) {
          gsap.from(heroImage, {
            opacity: 0,
            x: 100,
            duration: 1.2,
            delay: 0.4,
            ease: 'power3.out'
          });
        }

        if (logoScrollRef.current) {
          gsap.to(logoScrollRef.current, {
            x: '-50%',
            duration: 20,
            ease: 'none',
            repeat: -1,
          });
        }
      } catch (error) {
        console.error('GSAP loading error:', error);
      }
    };

    const timer = setTimeout(() => {
      loadGSAP();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const aiPlatforms = [
    { name: 'ChatGPT', color: 'from-green-500 to-teal-500' },
    { name: 'Claude', color: 'from-orange-500 to-amber-500' },
    { name: 'Gemini', color: 'from-blue-500 to-indigo-500' },
    { name: 'Perplexity', color: 'from-purple-500 to-pink-500' },
    { name: 'Copilot', color: 'from-cyan-500 to-blue-500' },
    { name: 'Meta AI', color: 'from-blue-600 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">BrandTracker</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                Get Started
              </button>
            </nav>

            <button className="md:hidden p-2">
              <div className="w-6 h-0.5 bg-slate-900 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-slate-900 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-slate-900"></div>
            </button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="hero-badge inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Brand Intelligence</span>
              </div>

              <h1 className="hero-title text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Track Your Brand's
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  AI Visibility
                </span>
              </h1>

              <p className="hero-subtitle text-xl text-slate-600 mb-8 leading-relaxed">
                Monitor how AI platforms like ChatGPT, Claude, and Gemini mention your brand.
                Get actionable insights to boost your visibility in the AI era.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row gap-4 mb-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold border-2 border-slate-200 hover:border-blue-600 hover:shadow-lg transition-all duration-300">
                  Book Free Demo
                </button>
              </div>

              <p className="text-sm text-slate-500">No credit card required • Free forever plan available</p>
            </div>

            <div className="hero-image relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Brand Visibility</p>
                        <p className="text-2xl font-bold text-slate-900">+127%</p>
                      </div>
                    </div>
                    <div className="text-green-500 text-2xl font-bold">↑</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-sm text-slate-600">AI Mentions</p>
                      <p className="text-xl font-bold text-slate-900">1,234</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <Target className="w-8 h-8 text-cyan-600 mb-2" />
                      <p className="text-sm text-slate-600">Share of Voice</p>
                      <p className="text-xl font-bold text-slate-900">42%</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Sentiment Score</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-right text-sm text-green-700 mt-1">85% Positive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Tracking All Major AI Platforms</h3>
            <p className="text-slate-600">Real-time monitoring across the AI ecosystem</p>
          </div>
        </div>
        <div className="relative">
          <div className="flex overflow-hidden">
            <div ref={logoScrollRef} className="flex space-x-12 px-6">
              {[...aiPlatforms, ...aiPlatforms].map((platform, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 flex items-center space-x-3 bg-white px-8 py-4 rounded-2xl border-2 border-slate-200 shadow-sm"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center`}>
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-slate-900 whitespace-nowrap">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="stat-item text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">
                10K+
              </div>
              <p className="text-slate-600 font-medium">Brands Tracked</p>
            </div>
            <div className="stat-item text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">
                5M+
              </div>
              <p className="text-slate-600 font-medium">AI Queries Analyzed</p>
            </div>
            <div className="stat-item text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">
                98%
              </div>
              <p className="text-slate-600 font-medium">Accuracy Rate</p>
            </div>
            <div className="stat-item text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">
                24/7
              </div>
              <p className="text-slate-600 font-medium">Real-time Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      <section className="usp-section py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Why Choose BrandTracker?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              The only platform built specifically for tracking brand visibility across AI platforms
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="usp-card bg-gradient-to-br from-slate-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Lightning Fast</h3>
              <p className="text-slate-600 leading-relaxed">
                Get instant insights across multiple AI platforms in seconds. No more manual checking or waiting for reports.
              </p>
            </div>

            <div className="usp-card bg-gradient-to-br from-slate-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Enterprise Security</h3>
              <p className="text-slate-600 leading-relaxed">
                Bank-level encryption and security standards. Your data is safe and never shared with third parties.
              </p>
            </div>

            <div className="usp-card bg-gradient-to-br from-slate-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Multi-Platform Coverage</h3>
              <p className="text-slate-600 leading-relaxed">
                Track your brand across ChatGPT, Claude, Gemini, Perplexity, and more AI platforms simultaneously.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features-section py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to dominate AI search results and track your brand visibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card bg-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <Eye className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Brand Visibility Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                Monitor how often AI platforms mention your brand across different queries and contexts in real-time.
              </p>
            </div>

            <div className="feature-card bg-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <Target className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Competitor Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                See how you stack up against competitors and identify opportunities to improve your market position.
              </p>
            </div>

            <div className="feature-card bg-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <BarChart3 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Advanced Analytics</h3>
              <p className="text-slate-600 leading-relaxed">
                Deep insights into sentiment analysis, share of voice, and performance trends over time.
              </p>
            </div>

            <div className="feature-card bg-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <LineChart className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Trend Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Identify emerging trends and patterns in how AI platforms perceive and recommend your brand.
              </p>
            </div>

            <div className="feature-card bg-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <Bell className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Alerts</h3>
              <p className="text-slate-600 leading-relaxed">
                Get notified instantly when there are significant changes in your brand visibility or sentiment.
              </p>
            </div>

            <div className="feature-card bg-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Team Collaboration</h3>
              <p className="text-slate-600 leading-relaxed">
                Share insights with your team and collaborate on strategies to improve brand visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="step-item text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Create Your Profile</h3>
              <p className="text-slate-300 leading-relaxed">
                Sign up in seconds and add your brand details. Tell us what you want to track and who your competitors are.
              </p>
            </div>

            <div className="step-item text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Run Your First Analysis</h3>
              <p className="text-slate-300 leading-relaxed">
                We query multiple AI platforms instantly to see how they respond to queries related to your brand and industry.
              </p>
            </div>

            <div className="step-item text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Get Actionable Insights</h3>
              <p className="text-slate-300 leading-relaxed">
                Review detailed analytics, sentiment scores, and personalized recommendations to improve your AI visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Start free, upgrade when you need more. No hidden fees or surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="pricing-card bg-slate-50 p-8 rounded-2xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-slate-600 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">$0</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">5 AI queries per month</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Basic analytics dashboard</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">1 brand profile</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Email support</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-3 bg-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
              >
                Get Started
              </button>
            </div>

            <div className="pricing-card bg-gradient-to-br from-blue-600 to-cyan-500 p-8 rounded-2xl border-2 border-blue-600 relative transform md:scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-blue-100 mb-6">For growing businesses</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$250</span>
                <span className="text-blue-100">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white font-medium">500 AI queries per month</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white">Advanced analytics & reporting</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white">5 brand profiles</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white">Competitor tracking</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white">Priority support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white">Custom alerts</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Start Free Trial
              </button>
            </div>

            <div className="pricing-card bg-slate-50 p-8 rounded-2xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-600 mb-6">For large organizations</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Unlimited AI queries</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Custom integrations & API</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Unlimited brand profiles</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">White-label options</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Dedicated account manager</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">24/7 phone support</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-300 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to dominate AI search?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of brands already tracking their AI visibility and staying ahead of the competition
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Create Free Account
            </button>
            <button className="px-8 py-4 bg-transparent text-white rounded-xl font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300">
              Book Free Demo
            </button>
          </div>
          <p className="mt-4 text-blue-100">No credit card required • Setup in under 5 minutes</p>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">BrandTracker</span>
              </div>
              <p className="text-sm leading-relaxed">
                The leading AI brand visibility tracking platform for modern businesses.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2025 BrandTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
