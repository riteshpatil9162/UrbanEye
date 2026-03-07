import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Shield, Zap, BarChart2, Award, Bell,
  ArrowRight, CheckCircle, Users, AlertCircle, TrendingUp
} from 'lucide-react';

const features = [
  {
    icon: AlertCircle,
    title: 'Smart Issue Reporting',
    desc: 'Citizens report municipal issues with geo-tagged images. AI instantly verifies authenticity.',
    color: 'text-primary-600 bg-primary-50',
  },
  {
    icon: Zap,
    title: 'AI-Powered Analysis',
    desc: 'Groq AI verifies image authenticity, detects fraud, and provides confidence scores for every report.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: MapPin,
    title: 'Google Maps Integration',
    desc: 'Real-time issue mapping, heatmaps, route optimization for workers, and dustbin location management.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: BarChart2,
    title: 'Analytics Dashboard',
    desc: 'Officers get deep insights into area-wise issue trends, worker performance, and resolution rates.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Award,
    title: 'Reward System',
    desc: 'Citizens earn 50 points per resolved issue. Redeem points for city-offered vouchers and discounts.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Bell,
    title: 'Real-Time Notifications',
    desc: 'Socket.io powered live updates on issue status, area notifications, and instant alerts.',
    color: 'text-blue-600 bg-blue-50',
  },
];

const workflow = [
  { step: '01', role: 'Citizen', title: 'Report Issue', desc: 'Select issue type, upload image, pin location on map.' },
  { step: '02', role: 'AI', title: 'Verify Authenticity', desc: 'AI analyzes image and description for fraud detection.' },
  { step: '03', role: 'Officer', title: 'Assign Worker', desc: 'Officer reviews, assigns to nearest available worker.' },
  { step: '04', role: 'Worker', title: 'Resolve Issue', desc: 'Worker navigates, resolves, and uploads proof image.' },
  { step: '05', role: 'Officer', title: 'Verify Resolution', desc: 'Officer confirms resolution via AI before/after comparison.' },
  { step: '06', role: 'Citizen', title: 'Confirm & Earn', desc: 'Citizen confirms resolution and earns 50 reward points.' },
];

const stats = [
  { value: '50K+', label: 'Issues Resolved', icon: CheckCircle },
  { value: '12K+', label: 'Active Citizens', icon: Users },
  { value: '94%', label: 'Resolution Rate', icon: TrendingUp },
  { value: '48h', label: 'Avg. Resolution Time', icon: Zap },
];

const LandingPage = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white min-h-[88vh] flex items-center">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glassmorphism blobs */}
        <div className="absolute top-20 right-20 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                AI-Powered Smart City Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Report. Track.
                <br />
                <span className="text-primary-400">Resolve.</span>
              </h1>
              <p className="mt-5 text-lg text-gray-300 max-w-lg leading-relaxed mx-auto lg:mx-0">
                UrbanEye empowers citizens to report municipal issues, enables officers to manage them efficiently, and uses AI to ensure transparent resolution.
              </p>
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mt-8">
                <Link to="/register" className="btn-primary text-base py-3 px-6 justify-center">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-600 text-white hover:border-gray-400 transition-colors text-base font-medium"
                >
                  Officer Login
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 mt-8">
                {[
                  { label: 'No Credit Card' },
                  { label: 'Free for Citizens' },
                  { label: 'Open API' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Hero visual - issue card mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-300">New Report</p>
                        <p className="text-sm font-semibold text-white">Pothole on MG Road</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending</span>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg h-32 flex items-center justify-center mb-4 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=200&fit=crop"
                      alt="Issue"
                      className="w-full h-full object-cover rounded-lg opacity-80"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">AI Authenticity Score</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full w-4/5 bg-green-400 rounded-full" />
                        </div>
                        <span className="text-xs text-green-400 font-medium">87%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Location</span>
                      <span className="text-xs text-gray-200">Kothrud, Pune</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Likes</span>
                      <span className="text-xs text-primary-300">4/5 · Auto-assign soon</span>
                    </div>
                  </div>
                </div>
                {/* Floating notification */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Issue Resolved</p>
                      <p className="text-xs text-gray-500">+50 pts earned</p>
                    </div>
                  </div>
                </motion.div>
                {/* Floating stat */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Area Alert Sent</p>
                      <p className="text-xs text-gray-500">48 citizens notified</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Platform Features</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">Everything you need to manage your city</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">
                A comprehensive ecosystem for citizens, officers, and workers — powered by AI and real-time technology.
              </p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="card-hover p-6 group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Workflow</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">End-to-end issue lifecycle</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              From report to resolution — a transparent, AI-verified process that ensures accountability.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workflow.map(({ step, role, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative card p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl font-black text-primary-100">{step}</div>
                  <div>
                    <span className="text-xs font-semibold text-primary-600 uppercase">{role}</span>
                    <h3 className="text-sm font-semibold text-gray-900 mt-0.5 mb-1.5">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Start reporting issues in your city today
            </h2>
            <p className="text-primary-100 mb-8 text-sm max-w-lg mx-auto">
              Join thousands of citizens making their cities better. Report issues, earn rewards, and see real change.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors text-sm"
              >
                Register as Citizen <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary-400 text-white font-medium hover:bg-primary-700 transition-colors text-sm"
              >
                Officer / Worker Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
