const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const { propertyCreationLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/upload');
const logActivity = require('../middleware/logger');

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

// Helper: attach images to property rows
const attachImages = async (properties) => {
  if (!properties.length) return properties;
  const ids = properties.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const [imgRows] = await pool.execute(
    `SELECT property_id, image_url FROM property_images WHERE property_id IN (${placeholders}) ORDER BY is_primary DESC, created_at ASC`,
    ids
  );

  const imgMap = {};
  imgRows.forEach((r) => {
    if (!imgMap[r.property_id]) imgMap[r.property_id] = [];
    imgMap[r.property_id].push(r.image_url);
  });

  return properties.map((p) => {
    const imgs = imgMap[p.id] || [];
    return {
      ...p,
      imageUrl: imgs[0] || p.imageUrl || '',
      images: imgs
    };
  });
};

// GET all properties (public, paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM properties');
    const [rows] = await pool.execute(
      'SELECT * FROM properties ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const data = await attachImages(rows);
    res.json(paginate(total, data, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// GET single property (public)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const [data] = await attachImages(rows);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// POST upload property images (admin only)
router.post('/upload', authenticateToken, requireRole(['admin']), upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    const imageUrls = req.files.map((f) => `/uploads/properties/${f.filename}`);
    await logActivity('UPLOAD_IMAGES', `Uploaded ${req.files.length} property images`, req.user.name);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// POST new property (admin only)
router.post('/', authenticateToken, requireRole(['admin']), sanitizeBody, propertyCreationLimiter, async (req, res) => {
  try {
    const id = uuidv4();
    const {
      title, type, price, location, bedrooms, bathrooms, area,
      description, status, imageUrl, features
    } = req.body;

    await pool.execute(
      `INSERT INTO properties (id, title, type, price, location, bedrooms, bathrooms, area, description, status, image_url, features, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        title || '',
        type || 'House',
        parseFloat(price) || 0,
        location || '',
        parseInt(bedrooms) || 0,
        parseInt(bathrooms) || 0,
        parseFloat(area) || 0,
        description || '',
        status || 'available',
        imageUrl || '',
        JSON.stringify(Array.isArray(features) ? features : []),
        req.user.name
      ]
    );

    // Insert images array if provided
    const images = Array.isArray(req.body.images) ? req.body.images : (imageUrl ? [imageUrl] : []);
    for (let i = 0; i < images.length; i++) {
      await pool.execute(
        'INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) VALUES (?, ?, ?, ?, NOW())',
        [uuidv4(), id, images[i], i === 0 ? 1 : 0]
      );
    }

    await logActivity('CREATE_PROPERTY', `Created property: ${title}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [id]);
    const [data] = await attachImages(rows);
    res.status(201).json(data);
  } catch (error) {
    console.error('Failed to create property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// POST new draft property (agent only)
router.post('/draft', authenticateToken, requireRole(['agent']), sanitizeBody, async (req, res) => {
  try {
    const id = uuidv4();
    const {
      title, type, price, location, bedrooms, bathrooms, area,
      description, imageUrl, features
    } = req.body;

    await pool.execute(
      `INSERT INTO properties (id, title, type, price, location, bedrooms, bathrooms, area, description, status, image_url, features, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, NOW(), NOW())`,
      [
        id,
        title || 'Untitled Property',
        type || 'House',
        parseFloat(price) || 0,
        location || '',
        parseInt(bedrooms) || 0,
        parseInt(bathrooms) || 0,
        parseFloat(area) || 0,
        description || '',
        imageUrl || '',
        JSON.stringify(Array.isArray(features) ? features : []),
        req.user.name
      ]
    );

    await logActivity('CREATE_PROPERTY_DRAFT', `Draft property created: ${title || 'Untitled Property'}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [id]);
    const [data] = await attachImages(rows);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create property draft' });
  }
});

// PUT update property (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), sanitizeBody, async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id, title FROM properties WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const fields = [];
    const values = [];

    const allowed = ['title', 'type', 'price', 'location', 'bedrooms', 'bathrooms', 'area', 'description', 'status', 'image_url'];
    const mapping = { imageUrl: 'image_url' };

    Object.keys(req.body).forEach((key) => {
      const col = mapping[key] || key;
      if (allowed.includes(col)) {
        fields.push(`${col} = ?`);
        values.push(req.body[key]);
      }
    });

    if (req.body.features !== undefined) {
      fields.push('features = ?');
      values.push(JSON.stringify(Array.isArray(req.body.features) ? req.body.features : []));
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(req.params.id);
      await pool.execute(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Update images if provided
    if (Array.isArray(req.body.images)) {
      await pool.execute('DELETE FROM property_images WHERE property_id = ?', [req.params.id]);
      for (let i = 0; i < req.body.images.length; i++) {
        await pool.execute(
          'INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) VALUES (?, ?, ?, ?, NOW())',
          [uuidv4(), req.params.id, req.body.images[i], i === 0 ? 1 : 0]
        );
      }
    }

    await logActivity('UPDATE_PROPERTY', `Updated property: ${existing[0].title}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    const [data] = await attachImages(rows);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE property (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT title FROM properties WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await pool.execute('DELETE FROM property_images WHERE property_id = ?', [req.params.id]);
    await pool.execute('DELETE FROM properties WHERE id = ?', [req.params.id]);
    await logActivity('DELETE_PROPERTY', `Deleted property: ${rows[0].title}`, req.user.name);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

module.exports = router;
