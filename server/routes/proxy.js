import express from 'express';
import { proxyImage } from '../utils/imageProxy.js';

const router = express.Router();

// GET /api/proxy/image?url=...
router.get('/image', proxyImage);

export default router;
