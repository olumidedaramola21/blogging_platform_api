const mongoose = require("mongoose")

// Define the structure of the article schema
const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Article title is required"],
        trim: true,  // removes any extra  whitespace
        maxLength: [200, "Title cannot exceed 200 characters"]
    },
    content: {
        type: String,
        required: [true, "Article content is required"],
        minLength: [10, "Content must be at least 10 characters long"]
    },
    author: {
        type: String,
        required: [true, "Author name is required"],
        trim: true,  
    },
    tags: [{
        type: String,
        trim: true,  
        lowercase: true,
    }],
    publishedDate: {
        type: Date,
        default: Date.now(), 
    },
    isPublished: {
        type: Boolean,     
        default: true,  
    },
    
}, {
    timestamps: true    // Automatically adds createdAt and updatedAt fields
})

// Create indexes for better query performance
articleSchema.index({title: 1});
articleSchema.index({publishedDate: -1})
articleSchema.index({tags: 1});


module.exports = mongoose.model("Article", articleSchema)
