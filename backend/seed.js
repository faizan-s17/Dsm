// backend/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("./models/courses"); // <-- make sure this path matches your project

const categories = [
  "Udemy",
  "Coursera",
  "edX",
  "Pluralsight",
  "LinkedIn Learning",
  "Udacity",
  "A Cloud Guru",
  "Frontend Masters",
  "freeCodeCamp",
  "Google",
  "Skillshare",
  "MasterClass",
  "Codecademy",
  "Treehouse",
  "Khan Academy",
  "MIT OpenCourseWare",
  "Stanford Online",
  "Harvard Online",
  "FutureLearn",
  "Alison",
  "Coursera Plus",
  "edureka",
  "SimpliLearn",
  "Educative",
  "O'Reilly",
  "Raywenderlich",
  "The Odin Project",
  "Scrimba",
  "CodePen",
  "YouTube Education",
  "Laracasts",
  "egghead.io",
  "Udemy Business",
  "Domestika",
  "CreativeLive",
  "Blinkist",
  "MasterClass Kids",
  "Brilliant",
  "W3Schools",
  "GeeksforGeeks",
  "Tutorialspoint",
  "Academic Earth",
  "Open Culture",
  "Study.com",
  "Coursera for Campus",
  "edX for Business",
  "LinkedIn Corporate",
  "Pluralsight IQ",
  "A Cloud Guru Learning Paths",
  "NobleProg",
  "New Horizons"
];

const thumbnailPool = [
  "/course-images/full-stack.jpg",
  "/course-images/react.jpg",
  "/course-images/node.jpg",
  "/course-images/python.jpg",
  "/course-images/aws.jpg",
  "/course-images/dsa.jpg",
  "/course-images/uiux.jpg",
  "/course-images/docker.jpg",
  "/course-images/sql.jpg",
  "/course-images/ml.jpg",
  "/course-images/java.jpg",
  "/course-images/cpp.jpg",
  "/course-images/csharp.jpg",
  "/course-images/javascript.jpg",
  "/course-images/angular.jpg",
  "/course-images/vue.jpg",
  "/course-images/flutter.jpg",
  "/course-images/swift.jpg",
  "/course-images/kotlin.jpg",
  "/course-images/ruby.jpg",
  "/course-images/php.jpg",
  "/course-images/go.jpg",
  "/course-images/rust.jpg",
  "/course-images/data-science.jpg",
  "/course-images/cybersecurity.jpg",
  "/course-images/blockchain.jpg",
  "/course-images/ai.jpg",
  "/course-images/devops.jpg",
  "/course-images/cloud-computing.jpg",
  "/course-images/web-design.jpg",
  "/course-images/mobile-development.jpg",
  "/course-images/game-development.jpg",
  "/course-images/database.jpg",
  "/course-images/networking.jpg",
  "/course-images/system-design.jpg",
  "/course-images/ecommerce.jpg",
  "/course-images/digital-marketing.jpg",
  "/course-images/seo.jpg",
  "/course-images/social-media.jpg",
  "/course-images/meta-ads.jpg",
  "/course-images/google-ads.jpg",
  "/course-images/analytics.jpg",
  "/course-images/adsense.jpg",
  "/course-images/shopify.jpg",
  "/course-images/woocommerce.jpg",
  "/course-images/magento.jpg",
  "/course-images/big-data.jpg",
  "/course-images/iot.jpg",
  "/course-images/robotics.jpg",
  "/course-images/ar-vr.jpg"
];

const skillPools = {
  "Full Stack": ["MongoDB", "Express", "React", "Node.js", "REST APIs", "PostgreSQL", "GraphQL", "Next.js", "Tailwind CSS"],
  "Frontend": ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Vue.js", "Angular", "SASS", "Webpack", "Jest"],
  "Backend": ["Node.js", "Express", "MongoDB", "SQL", "Authentication", "Redis", "Microservices", "API Design", "Security"],
  "DevOps": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Terraform", "Ansible", "Jenkins", "GitLab CI", "Prometheus"],
  "Cloud": ["AWS", "Azure", "GCP", "Terraform", "Cloud Security", "Lambda", "EC2", "S3", "IAM", "VPC"],
  "Data": ["Python", "SQL", "Pandas", "Data Visualization", "ETL", "Spark", "Hadoop", "Tableau", "Power BI", "Statistics"],
  "AI/ML": ["Python", "Machine Learning", "Deep Learning", "NLP", "MLOps", "TensorFlow", "PyTorch", "Computer Vision", "Scikit-learn"],
  "Mobile": ["Swift", "iOS", "SwiftUI", "Xcode", "APIs", "Flutter", "Dart", "React Native", "Kotlin", "Android Studio"],
  "UI/UX": ["UX Research", "Wireframing", "Figma", "Prototyping", "Design Systems", "Adobe XD", "User Testing", "Interaction Design"],
  "DSA": ["Algorithms", "Data Structures", "Big-O", "Sorting", "Trees", "Graphs", "Dynamic Programming", "Recursion"],
  "Python": ["Python", "Django", "Flask", "FastAPI", "NumPy", "Pandas", "Matplotlib", "Automation", "Web Scraping", "APIs"],
  "Java": ["Java", "Spring Boot", "Hibernate", "Maven", "JUnit", "Microservices", "JVM", "Collections", "Concurrency"],
  "C++": ["C++", "STL", "Object-Oriented Programming", "Memory Management", "Algorithms", "System Programming", "Game Development"],
  "C": ["C", "Embedded Systems", "System Programming", "Pointers", "Memory Management", "Low-Level Programming", "Hardware Interfacing"],
  "C#": ["C#", ".NET", "ASP.NET Core", "Entity Framework", "LINQ", "Xamarin", "Unity", "WPF", "MVVM Pattern"],
  "DevOps Tools": ["Jenkins", "Docker", "Kubernetes", "Terraform", "Ansible", "Chef", "Puppet", "Prometheus", "Grafana", "ELK Stack"],
  "E-commerce": ["Shopify", "WooCommerce", "Magento", "BigCommerce", "Payment Integration", "Inventory Management", "SEO", "Conversion Optimization"],
  "Digital Marketing": ["Meta Ads", "Google Ads", "Facebook Marketing", "Instagram Marketing", "SEO", "Content Marketing", "Email Marketing", "Analytics"],
  "Cybersecurity": ["Network Security", "Ethical Hacking", "Penetration Testing", "Firewalls", "Encryption", "Incident Response", "Risk Assessment"],
  "Blockchain": ["Smart Contracts", "Ethereum", "Solidity", "Bitcoin", "DeFi", "Web3", "DApps", "Cryptocurrency", "Consensus Mechanisms"],
  "Game Development": ["Unity", "Unreal Engine", "C#", "C++", "Game Design", "Physics", "Animation", "AI for Games", "Multiplayer Networking"],
  "IoT": ["Raspberry Pi", "Arduino", "Embedded Programming", "Sensor Networks", "MQTT", "Edge Computing", "Device Security"],
  "AR/VR": ["Unity", "Unreal Engine", "ARKit", "ARCore", "3D Modeling", "Spatial Computing", "Immersive Design", "Tracking Systems"]
};

const titleTemplates = [
  { track: "Full Stack", title: "Full Stack Web Development Bootcamp" },
  { track: "Frontend", title: "Modern React + TypeScript Mastery" },
  { track: "Frontend", title: "JavaScript Deep Dive: From Basics to Advanced" },
  { track: "Backend", title: "Node.js + Express API Development" },
  { track: "Backend", title: "MongoDB for Developers: CRUD to Aggregations" },
  { track: "DevOps", title: "Docker & Kubernetes: DevOps Essentials" },
  { track: "Cloud", title: "AWS Cloud Practitioner to Associate Path" },
  { track: "Cloud", title: "Terraform Infrastructure as Code" },
  { track: "Data", title: "SQL for Data Analysis: Zero to Pro" },
  { track: "AI/ML", title: "Machine Learning Fundamentals with Python" },
  { track: "AI/ML", title: "Deep Learning with TensorFlow & Keras" },
  { track: "Mobile", title: "iOS App Development with SwiftUI" },
  { track: "UI/UX", title: "UX/UI Design Fundamentals" },
  { track: "DSA", title: "Data Structures & Algorithms Masterclass" },
  { track: "Python", title: "Complete Python Developer in 2024" },
  { track: "Java", title: "Java Spring Boot Microservices Architecture" },
  { track: "C++", title: "C++ Programming: From Beginner to Expert" },
  { track: "C", title: "C Programming for Embedded Systems" },
  { track: "C#", title: "C# and .NET Core: Complete Guide" },
  { track: "DevOps Tools", title: "Advanced DevOps Engineering: Jenkins, Docker, Kubernetes" },
  { track: "E-commerce", title: "Complete Shopify Course: Build an Online Store" },
  { track: "Digital Marketing", title: "Meta Ads (Facebook & Instagram) Mastery Course" },
  { track: "Digital Marketing", title: "Google Ads & AdSense: Complete Revenue Course" },
  { track: "Cybersecurity", title: "Ethical Hacking & Penetration Testing" },
  { track: "Blockchain", title: "Blockchain & Smart Contracts with Solidity" },
  { track: "Game Development", title: "Unity Game Development: Create 3 Complete Games" },
  { track: "IoT", title: "Internet of Things (IoT): Arduino & Raspberry Pi" },
  { track: "AR/VR", title: "Augmented Reality App Development with ARKit & ARCore" },
  { track: "Data", title: "Data Science & Analytics: Complete Guide" },
  { track: "Cloud", title: "Microsoft Azure Administrator Certification" },
  { track: "Backend", title: "Go (Golang) Programming: Building RESTful APIs" },
  { track: "Frontend", title: "Vue.js & Nuxt.js: Complete Frontend Development" },
  { track: "Mobile", title: "Flutter & Dart: Building Cross-Platform Apps" },
  { track: "AI/ML", title: "Natural Language Processing with Python" },
  { track: "DevOps", title: "AWS DevOps Engineer Professional Certification" },
  { track: "UI/UX", title: "Figma: UI/UX Design with Prototyping" },
  { track: "DSA", title: "System Design & Architecture Interview Prep" }
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSkills(track) {
  const pool = skillPools[track] || [];
  if (pool.length === 0) {
    // Fallback to a random skill pool if track not found
    const randomTrack = Object.keys(skillPools)[Math.floor(Math.random() * Object.keys(skillPools).length)];
    pool = skillPools[randomTrack];
  }
  // pick 3-5 unique skills
  const count = 3 + Math.floor(Math.random() * 3);
  const actualCount = Math.min(count, pool.length);
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, actualCount);
}

function makeCourse(i) {
  const tpl = pickRandom(titleTemplates);
  const category = pickRandom(categories);
  const durationHours = 10 + Math.floor(Math.random() * 61); // 10..70 hours
  const thumb = pickRandom(thumbnailPool);

  // Add more variation to titles by using a random year and adding unique suffixes
  const years = [2023, 2024, 2025];
  const suffixes = ['Pro', 'Expert', 'Master', 'Ultimate', 'Advanced', 'Premium', 'Comprehensive', 'Complete', 'Essential', 'Professional'];
  
  const randomYear = years[Math.floor(Math.random() * years.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  // Randomly decide whether to modify the title
  let title;
  if (Math.random() > 0.5) {
    title = `${tpl.title} - ${randomSuffix} Edition (${randomYear})`;
  } else {
    title = `${tpl.title} (${randomYear})`;
  }
  
  // Vary the description more to ensure uniqueness
  const descriptors = [
    `An intensive ${tpl.track} course with hands-on projects, quizzes, and real-world challenges. ` +
    `Develop expertise in ${pickSkills(tpl.track).slice(0, 2).join(' & ')}.`,
    
    `A complete ${tpl.track} course with practical exercises, assessments, and portfolio-building assignments. ` +
    `Enhance your abilities in ${pickSkills(tpl.track).slice(0, 2).join(' & ')}.`,
    
    `Master ${tpl.track} skills through interactive lessons, coding challenges, and real projects. ` +
    `Focus on ${pickSkills(tpl.track).slice(0, 2).join(' & ')} fundamentals and advanced concepts.`,
    
    `Comprehensive ${tpl.track} training featuring expert instruction, hands-on labs, and industry-relevant projects. ` +
    `Specialize in ${pickSkills(tpl.track).slice(0, 2).join(' & ')}.`,
    
    `Advance your ${tpl.track} career with guided tutorials, peer collaboration, and practical applications. ` +
    `Strengthen your knowledge in ${pickSkills(tpl.track).slice(0, 2).join(' & ')}.`
  ];
  
  const description = descriptors[Math.floor(Math.random() * descriptors.length)];

  // Link to Coursera homepage with course slug as query parameter
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const courseLink = `https://www.coursera.org/search?query=${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    category,
    duration: `${durationHours} hours`,
    thumbnail: thumb,
    courseLink,
    skills: pickSkills(tpl.track)
  };
}

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected:", mongoose.connection.name);

    // OPTION: clear existing courses (recommended for dev)
    // Comment this out if you want to keep existing courses.
    await Course.deleteMany({});
    console.log("🧹 Cleared courses collection");

    const courses = Array.from({ length: 100 }, (_, i) => makeCourse(i + 1));
    await Course.insertMany(courses);

    console.log(`✅ Inserted ${courses.length} courses`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

run();
