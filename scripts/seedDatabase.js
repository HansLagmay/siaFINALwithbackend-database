require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  try {
    console.log('🌱 Seeding database...');

    // --- Users ---
    const users = [
      { email: 'admin@tesproperty.com', password: 'admin123', name: 'Admin User', role: 'admin', phone: '09001234567' },
      { email: 'maria@tesproperty.com', password: 'agent123', name: 'Maria Santos', role: 'agent', phone: '09112345678' },
      { email: 'juan@tesproperty.com', password: 'agent123', name: 'Juan Dela Cruz', role: 'agent', phone: '09223456789' }
    ];

    const userIds = {};
    for (const u of users) {
      const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length > 0) {
        userIds[u.email] = existing[0].id;
        console.log(`  ⚠️  User ${u.email} already exists, skipping.`);
        continue;
      }
      const id = uuidv4();
      const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
      await connection.execute(
        'INSERT INTO users (id, email, password, name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [id, u.email, hashed, u.name, u.role, u.phone]
      );
      userIds[u.email] = id;
      console.log(`  ✅ Created user: ${u.email}`);
    }

    // --- Properties ---
    const properties = [
      {
        title: 'Modern 3BR House in Quezon City',
        type: 'House',
        price: 4500000,
        location: 'Quezon City, Metro Manila',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        description: 'Beautiful modern house in a quiet subdivision with covered parking and garden.',
        status: 'available',
        imageUrl: '/uploads/properties/sample1.jpg',
        features: ['Parking', 'Garden', 'CCTV', 'Air Conditioning'],
        images: ['/uploads/properties/sample1.jpg', '/uploads/properties/sample1b.jpg']
      },
      {
        title: 'Cozy 2BR Condo in BGC',
        type: 'Condo',
        price: 6800000,
        location: 'Bonifacio Global City, Taguig',
        bedrooms: 2,
        bathrooms: 1,
        area: 65,
        description: 'Modern condo unit on the 12th floor with stunning city views.',
        status: 'available',
        imageUrl: '/uploads/properties/sample2.jpg',
        features: ['Pool', 'Gym', 'Security', 'City View'],
        images: ['/uploads/properties/sample2.jpg']
      },
      {
        title: 'Commercial Space in Makati',
        type: 'Commercial',
        price: 12000000,
        location: 'Makati City, Metro Manila',
        bedrooms: 0,
        bathrooms: 2,
        area: 200,
        description: 'Prime commercial space suitable for office or retail use.',
        status: 'available',
        imageUrl: '/uploads/properties/sample3.jpg',
        features: ['24/7 Access', 'CCTV', 'Loading Bay'],
        images: ['/uploads/properties/sample3.jpg', '/uploads/properties/sample3b.jpg']
      },
      {
        title: 'Beachfront Lot in Batangas',
        type: 'Lot',
        price: 3200000,
        location: 'Nasugbu, Batangas',
        bedrooms: 0,
        bathrooms: 0,
        area: 500,
        description: 'Titled beachfront lot perfect for vacation house development.',
        status: 'reserved',
        imageUrl: '/uploads/properties/sample4.jpg',
        features: ['Beachfront', 'Titled', 'Road Access'],
        images: ['/uploads/properties/sample4.jpg']
      }
    ];

    const propIds = [];
    for (const p of properties) {
      const [existing] = await connection.execute('SELECT id FROM properties WHERE title = ?', [p.title]);
      if (existing.length > 0) {
        propIds.push(existing[0].id);
        console.log(`  ⚠️  Property "${p.title}" already exists, skipping.`);
        continue;
      }
      const id = uuidv4();
      await connection.execute(
        `INSERT INTO properties (id, title, type, price, location, bedrooms, bathrooms, area, description, status, image_url, features, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Admin User', NOW(), NOW())`,
        [id, p.title, p.type, p.price, p.location, p.bedrooms, p.bathrooms, p.area, p.description, p.status, p.imageUrl, JSON.stringify(p.features)]
      );

      for (let i = 0; i < p.images.length; i++) {
        await connection.execute(
          'INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) VALUES (?, ?, ?, ?, NOW())',
          [uuidv4(), id, p.images[i], i === 0 ? 1 : 0]
        );
      }

      propIds.push(id);
      console.log(`  ✅ Created property: ${p.title}`);
    }

    // --- Inquiries ---
    const year = new Date().getFullYear();
    const inquiries = [
      {
        name: 'Ana Reyes',
        email: 'ana.reyes@example.com',
        phone: '09331234567',
        message: 'I am interested in viewing this property. Please contact me.',
        propertyIdx: 0,
        status: 'new'
      },
      {
        name: 'Pedro Bautista',
        email: 'pedro.bautista@example.com',
        phone: '09442345678',
        message: 'Can you provide more details on the price and payment terms?',
        propertyIdx: 1,
        status: 'claimed',
        assignedEmail: 'maria@tesproperty.com'
      },
      {
        name: 'Jose Torres',
        email: 'jose.torres@example.com',
        phone: '09553456789',
        message: 'Is this property still available? I want to schedule a site visit.',
        propertyIdx: 2,
        status: 'assigned',
        assignedEmail: 'juan@tesproperty.com'
      }
    ];

    for (let i = 0; i < inquiries.length; i++) {
      const inq = inquiries[i];
      const ticketNumber = `INQ-${year}-${String(i + 1).padStart(3, '0')}`;
      const [existing] = await connection.execute('SELECT id FROM inquiries WHERE ticket_number = ?', [ticketNumber]);
      if (existing.length > 0) {
        console.log(`  ⚠️  Inquiry ${ticketNumber} already exists, skipping.`);
        continue;
      }

      const propTitle = properties[inq.propertyIdx]?.title || null;
      const propPrice = properties[inq.propertyIdx]?.price || null;
      const propLocation = properties[inq.propertyIdx]?.location || null;
      const propId = propIds[inq.propertyIdx] || null;
      const assignedTo = inq.assignedEmail ? userIds[inq.assignedEmail] : null;

      await connection.execute(
        `INSERT INTO inquiries (id, ticket_number, name, email, phone, message, property_id, property_title, property_price, property_location, status, assigned_to, claimed_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          uuidv4(), ticketNumber, inq.name, inq.email, inq.phone, inq.message,
          propId, propTitle, propPrice, propLocation,
          inq.status, assignedTo, assignedTo
        ]
      );
      console.log(`  ✅ Created inquiry: ${ticketNumber}`);
    }

    // --- Calendar Events ---
    const agentIds = [userIds['maria@tesproperty.com'], userIds['juan@tesproperty.com']];
    const now = new Date();

    const events = [
      {
        title: 'Property Viewing - QC House',
        type: 'viewing',
        start: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        duration: 60,
        agentEmail: 'maria@tesproperty.com'
      },
      {
        title: 'Client Meeting - BGC Condo',
        type: 'meeting',
        start: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        duration: 90,
        agentEmail: 'juan@tesproperty.com'
      },
      {
        title: 'Site Inspection - Makati Commercial',
        type: 'inspection',
        start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        duration: 120,
        agentEmail: 'maria@tesproperty.com'
      }
    ];

    for (const ev of events) {
      const id = uuidv4();
      const startDb = ev.start.toISOString().slice(0, 19).replace('T', ' ');
      const endDb = new Date(ev.start.getTime() + ev.duration * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      const agentId = userIds[ev.agentEmail];

      await connection.execute(
        "INSERT INTO calendar_events (id, title, type, start_time, end_time, agent_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Admin User', NOW())",
        [id, ev.title, ev.type, startDb, endDb, agentId]
      );
      console.log(`  ✅ Created event: ${ev.title}`);
    }

    // --- Activity Log entries ---
    await connection.execute(
      "INSERT INTO activity_log (id, action, description, performed_by, timestamp) VALUES (?, 'SEED', 'Database seeded with initial data', 'System', NOW())",
      [uuidv4()]
    );

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDefault credentials:');
    console.log('  admin@tesproperty.com / admin123');
    console.log('  maria@tesproperty.com / agent123');
    console.log('  juan@tesproperty.com  / agent123');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
