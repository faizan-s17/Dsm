const fs = require('fs');
const path = require('path');

// Create course-images directory if it doesn't exist
const thumbnailDir = path.join(__dirname, 'course-images');
if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
    console.log('Created course-images directory');
}

// List of thumbnail filenames to create
const thumbnails = [
    'full-stack.jpg',
    'react.jpg',
    'node.jpg',
    'python.jpg',
    'aws.jpg',
    'dsa.jpg',
    'uiux.jpg',
    'docker.jpg',
    'sql.jpg',
    'ml.jpg',
    'java.jpg',
    'cpp.jpg',
    'csharp.jpg',
    'javascript.jpg',
    'angular.jpg',
    'vue.jpg',
    'flutter.jpg',
    'swift.jpg',
    'kotlin.jpg',
    'ruby.jpg',
    'php.jpg',
    'go.jpg',
    'rust.jpg',
    'data-science.jpg',
    'cybersecurity.jpg',
    'blockchain.jpg',
    'ai.jpg',
    'devops.jpg',
    'cloud-computing.jpg',
    'web-design.jpg',
    'mobile-development.jpg',
    'game-development.jpg',
    'database.jpg',
    'networking.jpg',
    'system-design.jpg',
    'ecommerce.jpg',
    'digital-marketing.jpg',
    'seo.jpg',
    'social-media.jpg',
    'meta-ads.jpg',
    'google-ads.jpg',
    'analytics.jpg',
    'adsense.jpg',
    'shopify.jpg',
    'woocommerce.jpg',
    'magento.jpg',
    'big-data.jpg',
    'iot.jpg',
    'robotics.jpg',
    'ar-vr.jpg'
];

// Create placeholder text files to simulate image files
thumbnails.forEach(filename => {
    const filePath = path.join(thumbnailDir, filename);
    if (!fs.existsSync(filePath)) {
        // Create a simple placeholder file
        fs.writeFileSync(filePath, `Placeholder for ${filename}`, 'utf8');
        console.log(`Created placeholder: ${filename}`);
    } else {
        console.log(`Already exists: ${filename}`);
    }
});

console.log('Thumbnail generation complete!');