require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Voucher = require('../models/Voucher');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Issue.deleteMany({});
  await Voucher.deleteMany({});
  console.log('Existing data cleared.');

  // Create users
  const users = await User.create([
    {
      name: 'Admin Officer',
      email: 'officer@urbaneye.in',
      password: 'Officer@123',
      role: 'officer',
      area: 'Kolhapur',
      phone: '9876543210',
    },
    {
      name: 'Rahul Patil',
      email: 'citizen@urbaneye.in',
      password: 'Citizen@123',
      role: 'citizen',
      area: 'Kolhapur',
      phone: '9876543211',
    },
    {
      name: 'Priya Desai',
      email: 'citizen2@urbaneye.in',
      password: 'Citizen@123',
      role: 'citizen',
      area: 'Ichalkaranji',
      phone: '9876543212',
    },
    {
      name: 'Suresh Jadhav',
      email: 'worker@urbaneye.in',
      password: 'Worker@123',
      role: 'worker',
      area: 'Kolhapur',
      phone: '9876543213',
      isAvailable: true,
      location: { lat: 16.7050, lng: 74.2433 },
    },
    {
      name: 'Amit Shinde',
      email: 'worker2@urbaneye.in',
      password: 'Worker@123',
      role: 'worker',
      area: 'Ichalkaranji',
      phone: '9876543214',
      isAvailable: true,
      location: { lat: 16.6939, lng: 74.4600 },
    },
  ]);

  console.log('Users created.');

  const officer = users[0];
  const citizen1 = users[1];
  const citizen2 = users[2];
  const worker1 = users[3];

  // Create sample issues
  await Issue.create([
    {
      title: 'Large Pothole on Kolhapur-Pune Highway',
      description: 'There is a large pothole near the MSRTC bus stop on the highway which has caused multiple accidents this week.',
      issueType: 'Pothole',
      image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
      beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
      location: { lat: 16.7050, lng: 74.2433 },
      area: 'Kolhapur',
      reportedBy: citizen1._id,
      status: 'pending',
      likes: 4,
      aiAuthenticityScore: 87,
      aiFraudProbability: 13,
    },
    {
      title: 'Overflowing Garbage Near Rankala Lake',
      description: 'The dustbin near Rankala Lake has been overflowing for 5 days. Very unhygienic for tourists and locals.',
      issueType: 'Waste Overflow',
      image: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
      beforeImage: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
      location: { lat: 16.7100, lng: 74.2380 },
      area: 'Kolhapur',
      reportedBy: citizen1._id,
      assignedTo: worker1._id,
      status: 'in-progress',
      likes: 7,
      autoAssigned: true,
      aiAuthenticityScore: 92,
    },
    {
      title: 'Water Pipeline Burst Near Ichalkaranji Market',
      description: 'Municipal water pipeline burst near the main market in Ichalkaranji. Water flooding the street.',
      issueType: 'Water Leakage',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      location: { lat: 16.6939, lng: 74.4600 },
      area: 'Ichalkaranji',
      reportedBy: citizen2._id,
      status: 'resolved',
      likes: 12,
      aiAuthenticityScore: 95,
      resolvedAt: new Date(),
    },
    {
      title: 'Street Light Not Working in Panhala',
      description: 'Multiple street lights on the road leading to Panhala Fort are non-functional since the past 2 weeks.',
      issueType: 'Electricity Fault',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      location: { lat: 16.8119, lng: 74.1108 },
      area: 'Panhala',
      reportedBy: citizen1._id,
      status: 'verified',
      likes: 2,
      aiAuthenticityScore: 78,
    },
    {
      title: 'Sewage Overflow in Kagal Residential Area',
      description: 'Sewage is overflowing onto the residential street near the Housing Society in Kagal.',
      issueType: 'Sewage Blockage',
      image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400',
      location: { lat: 16.5733, lng: 74.3183 },
      area: 'Kagal',
      reportedBy: citizen2._id,
      status: 'pending',
      likes: 1,
      aiAuthenticityScore: 83,
    },
  ]);

  console.log('Issues created.');

  // Create sample vouchers
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  await Voucher.create([
    {
      title: 'Free MSRTC Bus Pass (1 Day)',
      description: 'Redeem for a free MSRTC bus pass valid for one day within Kolhapur district.',
      pointsRequired: 50,
      expiryDate,
      createdBy: officer._id,
      category: 'Transport',
    },
    {
      title: 'Grocery Discount Coupon 10%',
      description: '10% off at participating grocery stores in Kolhapur district.',
      pointsRequired: 100,
      expiryDate,
      createdBy: officer._id,
      category: 'Shopping',
    },
    {
      title: 'Health Checkup Voucher',
      description: 'Free basic health checkup at participating clinics in Kolhapur.',
      pointsRequired: 200,
      expiryDate,
      createdBy: officer._id,
      category: 'Healthcare',
    },
  ]);

  console.log('Vouchers created.');

  console.log('\n Seed data inserted successfully!\n');
  console.log('=== TEST CREDENTIALS ===');
  console.log('Officer:  officer@urbaneye.in / Officer@123');
  console.log('Citizen:  citizen@urbaneye.in / Citizen@123');
  console.log('Citizen2: citizen2@urbaneye.in / Citizen@123');
  console.log('Worker:   worker@urbaneye.in / Worker@123');
  console.log('Worker2:  worker2@urbaneye.in / Worker@123');
  console.log('========================\n');

  await mongoose.disconnect();
  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seed Error:', err);
  process.exit(1);
});
