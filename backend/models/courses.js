const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: String, required: true },
    thumbnail: { type: String }, // Stores image filename or URL
    courseLink: { type: String }, // Stores the link to the course (e.g., Udemy, etc.)
    youtubeUrl: { type: String }, // Stores the YouTube video URL
    skills: [{ type: String, required: true }] // Array of skills covered in the course
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
