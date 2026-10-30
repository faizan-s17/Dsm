import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import { Book, Search, Trash2, Upload, AlertCircle, BookOpen, Clock, Folder, Plus, X, Edit, Save, Youtube, Video } from "lucide-react";
import "./Manage-Courses.css";

const ManageCourses = () => {
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCourseId, setCurrentCourseId] = useState(null);
    const [stats, setStats] = useState({
        totalCourses: 0,
        categories: 0,
        totalDuration: 0
    });
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        duration: "",
        thumbnail: null,
        courseLink: "",
        youtubeUrl: "",
        skills: []
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showVideo, setShowVideo] = useState(null);
    const [currentSkill, setCurrentSkill] = useState("");

    useEffect(() => {
        fetchCourses();
    }, []);

    // Extract YouTube video ID from URL
    const getYoutubeVideoId = (url) => {
        if (!url) return null;
        
        // Regular expressions to match different YouTube URL formats
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Generate YouTube embed URL
    const getYoutubeEmbedUrl = (url) => {
        const videoId = getYoutubeVideoId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    // Add a function to get YouTube thumbnail URL
    const getYoutubeThumbnailUrl = (url) => {
        const videoId = getYoutubeVideoId(url);
        return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
    };

    // Resolve course thumbnail URLs to backend absolute path when needed
    const getThumbnailUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        // Ensure backend base URL matches your server config
        return `http://localhost:5000${path}`;
    };

    // Fetch Courses from Backend
    const fetchCourses = async () => {
        try {
            setLoading(true);
            
            // Get admin auth token
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error("Authentication required. Please log in again.");
                setLoading(false);
                return;
            }
            
            // Try admin-specific endpoint first
            try {
                const response = await axios.get("http://localhost:5000/api/admin/courses", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                const coursesData = response.data.courses || response.data || [];
                
                if (!Array.isArray(coursesData)) {
                    throw new Error("Invalid data format received");
                }
                
                setCourses(coursesData);
                
                // Calculate stats
                const uniqueCategories = new Set(coursesData.map(course => course.category));
                const totalDuration = coursesData.reduce((acc, course) => {
                    const duration = parseInt(course.duration) || 0;
                    return acc + duration;
                }, 0);
                
                setStats({
                    totalCourses: coursesData.length,
                    categories: uniqueCategories.size,
                    totalDuration: totalDuration
                });
            } catch (adminError) {
                console.log("Admin endpoint failed, trying general endpoint:", adminError);
                
                // Fallback to general endpoint
                const fallbackResponse = await axios.get("http://localhost:5000/api/courses", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                const fallbackData = fallbackResponse.data || [];
                
                if (!Array.isArray(fallbackData)) {
                    throw new Error("Invalid data format received from fallback");
                }
                
                setCourses(fallbackData);
                
                // Calculate stats
                const uniqueCategories = new Set(fallbackData.map(course => course.category));
                const totalDuration = fallbackData.reduce((acc, course) => {
                    const duration = parseInt(course.duration) || 0;
                    return acc + duration;
                }, 0);
                
                setStats({
                    totalCourses: fallbackData.length,
                    categories: uniqueCategories.size,
                    totalDuration: totalDuration
                });
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            setCourses([]);
            setStats({
                totalCourses: 0,
                categories: 0,
                totalDuration: 0
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle Input Change
    const handleChange = (e) => {
        if (e.target.name === "thumbnail") {
            const file = e.target.files[0];
            setFormData({ ...formData, thumbnail: file });
            
            // Create preview URL
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setPreviewUrl(null);
            }
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    // Handle skill input
    const handleSkillInput = (e) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault(); // Prevent form submission
            if (!formData.skills.includes(currentSkill.trim())) {
                setFormData({
                    ...formData,
                    skills: [...formData.skills, currentSkill.trim()]
                });
            }
            setCurrentSkill('');
        }
    };

    // Remove skill
    const removeSkill = (skillToRemove) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter(skill => skill !== skillToRemove)
        });
    };

    // Handle Course Upload
    const handleUpload = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.title || !formData.description || !formData.category || !formData.duration) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        if (formData.skills.length === 0) {
            toast.error('Please add at least one skill for the course');
            return;
        }

        try {
            setLoading(true);
            const formDataToSend = new FormData();
            
            // Append all form data
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('duration', formData.duration);
            formDataToSend.append('courseLink', formData.courseLink);
            formDataToSend.append('youtubeUrl', formData.youtubeUrl);
            formDataToSend.append('skills', JSON.stringify(formData.skills));
            
            // Append file if exists
            if (formData.thumbnail) {
                formDataToSend.append('thumbnail', formData.thumbnail);
            }
            
            // Get auth token
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required. Please log in again.');
                setLoading(false);
                return;
            }

            // Try admin-specific endpoint first
            try {
                const response = await axios.post(
                    "http://localhost:5000/api/admin/courses", 
                    formDataToSend,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (response.data) {
                    toast.success('Course uploaded successfully!');
                    fetchCourses();
                    resetForm();
                    setShowForm(false);
                }
            } catch (adminError) {
                console.log("Admin endpoint failed, trying general endpoint:", adminError);
                
                // Try fallback endpoint
                const fallbackResponse = await axios.post(
                    "http://localhost:5000/api/courses", 
                    formDataToSend,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (fallbackResponse.data) {
                    toast.success('Course uploaded successfully!');
                    fetchCourses();
                    resetForm();
                    setShowForm(false);
                }
            }
        } catch (error) {
            console.error("Error uploading course:", error);
            let errorMessage = 'Error uploading course. Please try again.';
            
            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
                console.error('Error response:', error.response.data);
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.';
                console.error('Error request:', error.request);
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle Course Update
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        try {
            // Validate required fields
            if (!formData.title || !formData.description || !formData.category || !formData.duration) {
                toast.error('Please fill in all required fields');
                return;
            }
            
            // Validate skills array
            if (!formData.skills || formData.skills.length === 0) {
                toast.error('Please add at least one skill');
                return;
            }
            
            setLoading(true);
            const formDataToSend = new FormData();
            
            // Append all form data
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('duration', formData.duration);
            formDataToSend.append('courseLink', formData.courseLink);
            formDataToSend.append('youtubeUrl', formData.youtubeUrl);
            
            // Append skills array as JSON string
            formDataToSend.append('skills', JSON.stringify(formData.skills || []));
            
            // Append file if exists and is new
            if (formData.thumbnail && typeof formData.thumbnail !== 'string') {
                formDataToSend.append('thumbnail', formData.thumbnail);
            }
            
            // Get auth token
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required. Please log in again.');
                setLoading(false);
                return;
            }

            // Try admin-specific endpoint first
            try {
                const response = await axios.put(
                    `http://localhost:5000/api/admin/courses/${currentCourseId}`, 
                    formDataToSend,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (response.data) {
                    toast.success('Course updated successfully!');
                    fetchCourses();
                    resetForm();
                    setShowForm(false);
                    setIsEditMode(false);
                    setCurrentCourseId(null);
                }
            } catch (adminError) {
                console.log("Admin update endpoint failed, trying general endpoint:", adminError);
                
                // Try fallback endpoint
                const fallbackResponse = await axios.put(
                    `http://localhost:5000/api/courses/${currentCourseId}`, 
                    formDataToSend,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (fallbackResponse.data) {
                    toast.success('Course updated successfully!');
                    fetchCourses();
                    resetForm();
                    setShowForm(false);
                    setIsEditMode(false);
                    setCurrentCourseId(null);
                }
            }
        } catch (error) {
            console.error("Error updating course:", error);
            let errorMessage = 'Error updating course. Please try again.';
            
            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
                console.error('Error response:', error.response.data);
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.';
                console.error('Error request:', error.request);
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Reset Form
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            category: "",
            duration: "",
            thumbnail: null,
            courseLink: "",
            youtubeUrl: "",
            skills: []
        });
        setPreviewUrl(null);
        setIsEditMode(false);
        setCurrentCourseId(null);
        setCurrentSkill('');
    };

    // Handle Edit Course
    const handleEdit = (course) => {
        setIsEditMode(true);
        setCurrentCourseId(course._id);
        setFormData({
            title: course.title,
            description: course.description,
            category: course.category,
            duration: course.duration,
            thumbnail: course.thumbnail,
            courseLink: course.courseLink || "",
            youtubeUrl: course.youtubeUrl || "",
            skills: course.skills || []
        });
        setPreviewUrl(getThumbnailUrl(course.thumbnail));
        setShowForm(true);
    };

    // Handle Course Deletion
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                // Get auth token
                const token = localStorage.getItem('authToken');
                if (!token) {
                    toast.error('Authentication required. Please log in again.');
                    return;
                }
                
                // Try admin-specific endpoint first
                try {
                    await axios.delete(`http://localhost:5000/api/admin/courses/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    toast.success('Course deleted successfully!');
                    fetchCourses();
                } catch (adminError) {
                    console.log("Admin delete endpoint failed, trying general endpoint:", adminError);
                    
                    // Try fallback endpoint
                    await axios.delete(`http://localhost:5000/api/courses/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    toast.success('Course deleted successfully!');
                    fetchCourses();
                }
            } catch (error) {
                console.error("Error deleting course:", error);
                toast.error('Error deleting course. Please try again.');
            }
        }
    };

    // Toggle video display
    const toggleVideoDisplay = (courseId) => {
        setShowVideo(showVideo === courseId ? null : courseId);
    };

    // Filter courses based on search and category
    const filteredCourses = courses.filter(course => {
        const matchesSearch = 
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        return selectedCategory === "all" ? matchesSearch : 
            (matchesSearch && course.category.toLowerCase() === selectedCategory.toLowerCase());
    });

    // Get unique categories
    const categories = ["all", ...new Set(courses.map(course => course.category))];

    return (
        <div className="manage-courses-container">
            {/* Stats Section */}
            <div className="stats-container">
                <div className="stat-card">
                    <BookOpen size={24} className="stat-icon" />
                    <div className="stat-number">{stats.totalCourses}</div>
                    <div className="stat-label">Total Courses</div>
                </div>
                <div className="stat-card">
                    <Folder size={24} className="stat-icon" />
                    <div className="stat-number">{stats.categories}</div>
                    <div className="stat-label">Categories</div>
                </div>
                <div className="stat-card">
                    <Clock size={24} className="stat-icon" />
                    <div className="stat-number">{stats.totalDuration}</div>
                    <div className="stat-label">Total Hours</div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar">
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search courses by title, category, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-options">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="category-select"
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="add-button" onClick={() => {
                    resetForm();
                    setShowForm(true);
                }}>
                    <Plus size={20} />
                    Add Course
                </button>
            </div>

            {/* Course Form Modal (Add/Edit) */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{isEditMode ? "Update Course" : "Add New Course"}</h3>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                            }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form className="course-form" onSubmit={isEditMode ? handleUpdate : handleUpload}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Course Title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <textarea
                                    name="description"
                                    placeholder="Course Description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="Category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        name="duration"
                                        placeholder="Duration (hours)"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="courseLink"
                                    placeholder="Course Link (optional)"
                                    value={formData.courseLink}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="youtubeUrl"
                                    placeholder="YouTube Video URL (optional)"
                                    value={formData.youtubeUrl}
                                    onChange={handleChange}
                                />
                                {formData.youtubeUrl && getYoutubeVideoId(formData.youtubeUrl) && (
                                    <div className="youtube-preview">
                                        <img 
                                            src={getYoutubeThumbnailUrl(formData.youtubeUrl)} 
                                            alt="YouTube Thumbnail" 
                                            className="youtube-thumbnail-preview"
                                        />
                                        <button 
                                            type="button"
                                            className="preview-video-btn"
                                            onClick={() => window.open(formData.youtubeUrl, '_blank')}
                                        >
                                            <Video size={20} />
                                            <span>Preview on YouTube</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="file-label">
                                    <input
                                        type="file"
                                        name="thumbnail"
                                        onChange={handleChange}
                                        accept="image/*"
                                        className="file-input"
                                        required={!isEditMode && !previewUrl && !formData.youtubeUrl}
                                    />
                                    <span>
                                        <Upload size={16} />
                                        {isEditMode ? "Change Thumbnail" : "Upload Thumbnail"}
                                    </span>
                                </label>
                                {previewUrl && !formData.youtubeUrl && (
                                    <div className="thumbnail-preview">
                                        <img src={previewUrl} alt="Thumbnail Preview" />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Course Skills</label>
                                <div className="skills-input-container">
                                    <div className="skills-tags">
                                        {formData.skills.map((skill, index) => (
                                            <span key={index} className="skill-tag">
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="remove-skill"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Type a skill and press Enter"
                                        value={currentSkill}
                                        onChange={(e) => setCurrentSkill(e.target.value)}
                                        onKeyPress={handleSkillInput}
                                        className="skill-input"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        "Processing..."
                                    ) : isEditMode ? (
                                        <>
                                            <Save size={16} />
                                            Update Course
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            Add Course
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Course List */}
            {loading && !showForm ? (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading courses...</p>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <h3>No courses found</h3>
                    <p>Try adjusting your search or add a new course.</p>
                </div>
            ) : (
                <div className="course-list">
                    {filteredCourses.map((course) => (
                        <div className="course-card" key={course._id}>
                            <div className="course-thumbnail">
                                {course.youtubeUrl && getYoutubeVideoId(course.youtubeUrl) ? (
                                    showVideo === course._id ? (
                                        <div className="youtube-embed">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={getYoutubeEmbedUrl(course.youtubeUrl)}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    ) : (
                                        <>
                                            <img 
                                                src={getYoutubeThumbnailUrl(course.youtubeUrl)} 
                                                alt={course.title} 
                                                className="youtube-thumbnail"
                                            />
                                            <button 
                                                className="play-video-btn"
                                                onClick={() => toggleVideoDisplay(course._id)}
                                            >
                                                <Video size={24} />
                                            </button>
                                            <div className="video-badge">
                                                <Youtube size={16} />
                                                <span>Video</span>
                                            </div>
                                        </>
                                    )
                                ) : (
                                    course.thumbnail ? (
                                        <img src={getThumbnailUrl(course.thumbnail)} alt={course.title} />
                                    ) : (
                                        <div className="thumbnail-placeholder">
                                            <Book size={32} />
                                        </div>
                                    )
                                )}
                                <span className="category-badge">{course.category}</span>
                            </div>
                            <div className="course-info">
                                <h3>{course.title}</h3>
                                <p className="course-description">{course.description}</p>
                                {course.skills && course.skills.length > 0 && (
                                    <div className="course-skills">
                                        <h4>Skills Covered:</h4>
                                        <div className="skills-list">
                                            {course.skills.map((skill, index) => (
                                                <span key={index} className="skill-badge">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="course-meta">
                                    <span className="meta-item">
                                        <Clock size={16} />
                                        {course.duration} hours
                                    </span>
                                </div>
                                {course.courseLink && (
                                    <a
                                        href={course.courseLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="course-link"
                                    >
                                        View Course
                                    </a>
                                )}
                            </div>
                            <div className="course-actions">
                                <button 
                                    className="edit-button"
                                    onClick={() => handleEdit(course)}
                                >
                                    <Edit size={16} />
                                    Update
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDelete(course._id)}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageCourses;
