const router = require('express').Router();
const authRoutes = require('./auth');
const videoRoutes = require('./video');
const profileRoutes = require('./profile');
const plansRoutes = require('./plans');
const historyRoutes = require('./history');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

router.use('/auth', authRoutes);
router.use('/video', videoRoutes);
router.use('/profile', profileRoutes);
router.use('/plans', plansRoutes);
router.use('/history', historyRoutes);

module.exports = router;