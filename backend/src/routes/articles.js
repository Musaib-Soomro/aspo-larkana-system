const express = require('express');
const router = express.Router();
const { listEntries, getEntry, upsertEntry, deleteEntry } = require('../controllers/articlesController');
const {
  listVPArticles, getVPArticle, createVPArticle, updateVPArticle, deleteVPArticle,
  listLateDeliveries, createLateDelivery, deleteLateDelivery,
} = require('../controllers/vpArticlesController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Daily register
router.get('/entry', getEntry);
router.get('/', listEntries);
router.post('/entry', upsertEntry);
router.delete('/entry', deleteEntry);

// VP / COD register
router.get('/vp', listVPArticles);
router.get('/vp/:id', getVPArticle);
router.post('/vp', createVPArticle);
router.put('/vp/:id', updateVPArticle);
router.delete('/vp/:id', deleteVPArticle);

// Late deliveries
router.get('/late', listLateDeliveries);
router.post('/late', createLateDelivery);
router.delete('/late/:id', deleteLateDelivery);

module.exports = router;
