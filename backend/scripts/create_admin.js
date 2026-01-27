require('dotenv').config();
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const db = require('../models');

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const p = args.find(a => a.startsWith(`--${name}=`));
    return p ? p.split('=')[1] : undefined;
  };

  const email = getArg('email') || process.env.ADMIN_EMAIL;
  const password = getArg('password') || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Usage: node create_admin.js --email=... --password=...');
    process.exit(1);
  }

  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    const existing = await db.User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      existing.role = 'admin';
      if (password) {
        existing.passwordHash = await bcrypt.hash(password, 10);
      }
      await existing.save();
      console.log(`Promoted existing user ${email} to admin.`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await db.User.create({ email: email.toLowerCase(), passwordHash: hash, role: 'admin' });
    console.log(`Created admin user ${user.email} (id=${user.id}).`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }
}

main();
