const express = require('express');
const router = express.Router();
const { createVoucher, getVouchers, redeemVoucher, deleteVoucher } = require('../controllers/voucherController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getVouchers);
router.post('/', protect, authorize('officer'), createVoucher);
router.post('/:id/redeem', protect, authorize('citizen'), redeemVoucher);
router.delete('/:id', protect, authorize('officer'), deleteVoucher);

module.exports = router;
