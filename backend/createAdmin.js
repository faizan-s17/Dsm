const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
const dotenv = require('dotenv'); // Add this line at the top
dotenv.config(); // This loads the variables from the .env file

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  const email = "faizan.shahzad2002@gmail.com".trim().toLowerCase();
  const password = "faiz43210";

  const hashedPassword = await bcrypt.hash(password, 10);

  await Admin.deleteMany({ email });

  const admin = new Admin({ email, password: hashedPassword });
  await admin.save();

  console.log("✅ Admin account created correctly!");

  mongoose.disconnect();
})
.catch(err => console.error("⚠️ Error:", err));
