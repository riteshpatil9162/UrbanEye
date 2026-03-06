import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Award, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getVouchers, redeemVoucher } from '../../services/voucherService';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const RewardsPage = () => {
  const { user, updateUserPoints } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    getVouchers()
      .then((res) => setVouchers(res.data.vouchers))
      .catch(() => toast.error('Failed to load vouchers.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = async (voucher) => {
    setRedeeming(voucher._id);
    try {
      const res = await redeemVoucher(voucher._id);
      toast.success(`Voucher redeemed! Remaining points: ${res.data.remainingPoints}`);
      updateUserPoints(res.data.remainingPoints);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Redemption failed.');
    } finally {
      setRedeeming(null);
    }
  };

  const categoryColors = {
    Food: 'bg-orange-100 text-orange-700',
    Transport: 'bg-blue-100 text-blue-700',
    Shopping: 'bg-pink-100 text-pink-700',
    Healthcare: 'bg-green-100 text-green-700',
    Education: 'bg-purple-100 text-purple-700',
    Other: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Rewards & Vouchers</h1>
        <p className="page-subtitle">Redeem your points for exclusive city offers</p>
      </div>

      {/* Points Card */}
      <div className="card p-5 mb-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm mb-1">Your Reward Balance</p>
            <p className="text-4xl font-bold">{user?.points || 0}</p>
            <p className="text-primary-200 text-xs mt-1">points</p>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary-500">
          <p className="text-xs text-primary-200">
            Earn 50 points for every resolved issue you confirm.
          </p>
        </div>
      </div>

      {/* Vouchers */}
      <h2 className="section-heading">Available Vouchers</h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="card p-12 text-center">
          <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No vouchers available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((voucher, i) => {
            const canRedeem = (user?.points || 0) >= voucher.pointsRequired;
            return (
              <motion.div
                key={voucher._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[voucher.category]}`}>
                    {voucher.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{voucher.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{voucher.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expires {formatDate(voucher.expiryDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary-600">{voucher.pointsRequired} pts</span>
                  <button
                    onClick={() => handleRedeem(voucher)}
                    disabled={!canRedeem || redeeming === voucher._id}
                    className={`text-xs py-1.5 px-4 rounded-lg font-medium transition-colors ${
                      canRedeem
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {redeeming === voucher._id ? 'Redeeming...' : canRedeem ? 'Redeem' : 'Insufficient Points'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
