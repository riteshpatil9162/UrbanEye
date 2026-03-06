import { Link } from 'react-router-dom';
import { MapPin, Github, Twitter, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Urban<span className="text-primary-400">Eye</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              AI-powered smart municipal issue reporting & management ecosystem.
              Empowering citizens to build better cities.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="mailto:support@urbaneye.in" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Report Issue', href: '/citizen/report' },
                { label: 'Track Issues', href: '/citizen' },
                { label: 'Rewards', href: '/citizen/rewards' },
                { label: 'Officer Dashboard', href: '/officer' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                support@urbaneye.in
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                1800-URBAN-EYE
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                Pune, Maharashtra
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} UrbanEye. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2 py-1 bg-primary-900/50 text-primary-400 rounded-full border border-primary-800/50">
              DKTE Hackathon Project
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
