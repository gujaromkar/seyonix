const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/socialai', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

// User Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    socialAccounts: [{
        platform: {
            type: String,
            enum: ['instagram', 'facebook'],
            required: true
        },
        accessToken: {
            type: String,
            required: true
        },
        username: String,
        userId: String,
        pageId: String, // For Facebook pages
        connected: {
            type: Boolean,
            default: false
        }
    }],
    preferences: {
        autoReply: {
            type: Boolean,
            default: true
        },
        toxicityFilter: {
            type: Boolean,
            default: true
        },
        humanApproval: {
            type: Boolean,
            default: false
        },
        aiCaption: {
            type: Boolean,
            default: true
        },
        aiHashtags: {
            type: Boolean,
            default: true
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'pro', 'business'],
            default: 'free'
        },
        validUntil: Date,
        limits: {
            scheduledPosts: {
                type: Number,
                default: 10
            },
            connectedAccounts: {
                type: Number,
                default: 1
            }
        }
    }
}, {
    timestamps: true
});

// Post Schema
const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    platforms: [{
        type: String,
        enum: ['instagram', 'facebook'],
        required: true
    }],
    type: {
        type: String,
        enum: ['image', 'video', 'story', 'text', 'reel'],
        required: true
    },
    mediaUrl: String,
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'published', 'failed'],
        default: 'draft'
    },
    scheduledTime: Date,
    publishedTime: Date,
    aiGenerated: {
        caption: {
            type: Boolean,
            default: false
        },
        hashtags: [String]
    },
    metrics: {
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        reach: {
            type: Number,
            default: 0
        },
        impressions: {
            type: Number,
            default: 0
        },
        engagement: {
            type: Number,
            default: 0
        }
    },
    platformIds: {
        instagram: String,
        facebook: String
    }
}, {
    timestamps: true
});

// Analytics Schema
const AnalyticsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    platform: {
        type: String,
        enum: ['instagram', 'facebook', 'all'],
        required: true
    },
    followers: {
        type: Number,
        default: 0
    },
    impressions: {
        type: Number,
        default: 0
    },
    reach: {
        type: Number,
        default: 0
    },
    engagement: {
        type: Number,
        default: 0
    },
    profileViews: {
        type: Number,
        default: 0
    },
    websiteClicks: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Comment Schema (for engagement tracking)
const CommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    platform: {
        type: String,
        enum: ['instagram', 'facebook'],
        required: true
    },
    platformCommentId: String,
    author: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral'
    },
    toxicityScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    needsReply: {
        type: Boolean,
        default: false
    },
    replied: {
        type: Boolean,
        default: false
    },
    replyContent: String,
    replyTime: Date
}, {
    timestamps: true
});

// Create models
const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);
const Analytics = mongoose.model('Analytics', AnalyticsSchema);
const Comment = mongoose.model('Comment', CommentSchema);

// Create indexes
const createIndexes = async () => {
    try {
        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        
        // Post indexes
        await Post.collection.createIndex({ userId: 1 });
        await Post.collection.createIndex({ scheduledTime: 1 });
        await Post.collection.createIndex({ status: 1 });
        
        // Analytics indexes
        await Analytics.collection.createIndex({ userId: 1, date: 1, platform: 1 });
        
        // Comment indexes
        await Comment.collection.createIndex({ postId: 1 });
        await Comment.collection.createIndex({ platformCommentId: 1 }, { unique: true, sparse: true });
        await Comment.collection.createIndex({ needsReply: 1 });
        
        console.log('Indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error.message);
    }
};

// Create sample data
const createSampleData = async () => {
    try {
        // Check if sample data already exists
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('Sample data already exists, skipping...');
            return;
        }

        // Create sample user
        const hashedPassword = await bcrypt.hash('password123', 12);
        const user = new User({
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            preferences: {
                autoReply: true,
                toxicityFilter: true,
                humanApproval: false,
                aiCaption: true,
                aiHashtags: true
            },
            subscription: {
                plan: 'pro',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                limits: {
                    scheduledPosts: 100,
                    connectedAccounts: 3
                }
            }
        });

        const savedUser = await user.save();
        console.log('Sample user created:', savedUser.email);

        // Create sample posts
        const posts = [
            {
                userId: savedUser._id,
                content: 'Check out our new product! #innovation #tech',
                platforms: ['instagram', 'facebook'],
                type: 'image',
                status: 'published',
                publishedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                aiGenerated: {
                    caption: true,
                    hashtags: ['innovation', 'tech', 'newproduct']
                },
                metrics: {
                    likes: 245,
                    comments: 32,
                    shares: 18,
                    reach: 12500,
                    impressions: 18700,
                    engagement: 4.2
                }
            },
            {
                userId: savedUser._id,
                content: 'Behind the scenes at our studio! #makingmagic #creative',
                platforms: ['instagram'],
                type: 'video',
                status: 'scheduled',
                scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                aiGenerated: {
                    caption: true,
                    hashtags: ['makingmagic', 'creative', 'behindthescenes']
                }
            },
            {
                userId: savedUser._id,
                content: 'Weekly tip: Consistency is key to social media growth!',
                platforms: ['facebook'],
                type: 'text',
                status: 'draft',
                aiGenerated: {
                    caption: false,
                    hashtags: ['socialmediatips', 'growth', 'consistency']
                }
            }
        ];

        const savedPosts = await Post.insertMany(posts);
        console.log(`${savedPosts.length} sample posts created`);

        // Create sample analytics
        const analytics = [
            {
                userId: savedUser._id,
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
                platform: 'instagram',
                followers: 12450,
                impressions: 28700,
                reach: 15600,
                engagement: 5.2,
                profileViews: 245,
                websiteClicks: 38
            },
            {
                userId: savedUser._id,
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
                platform: 'facebook',
                followers: 8700,
                impressions: 15300,
                reach: 9800,
                engagement: 3.8,
                profileViews: 120,
                websiteClicks: 25
            },
            {
                userId: savedUser._id,
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                platform: 'instagram',
                followers: 12300,
                impressions: 24500,
                reach: 14200,
                engagement: 4.8,
                profileViews: 210,
                websiteClicks: 32
            }
        ];

        const savedAnalytics = await Analytics.insertMany(analytics);
        console.log(`${savedAnalytics.length} sample analytics records created`);

        // Create sample comments
        const comments = [
            {
                postId: savedPosts[0]._id,
                userId: savedUser._id,
                platform: 'instagram',
                author: 'jane_smith',
                content: 'Love this product! When will it be available in Europe?',
                sentiment: 'positive',
                toxicityScore: 0.1,
                needsReply: true
            },
            {
                postId: savedPosts[0]._id,
                userId: savedUser._id,
                platform: 'facebook',
                author: 'Mike Johnson',
                content: 'This is exactly what I needed for my business!',
                sentiment: 'positive',
                toxicityScore: 0.05,
                needsReply: false,
                replied: true,
                replyContent: 'Glad to hear it, Mike! Let us know if you have any questions.',
                replyTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                postId: savedPosts[0]._id,
                userId: savedUser._id,
                platform: 'instagram',
                author: 'toxic_user',
                content: 'This is the worst product ever! Complete garbage!',
                sentiment: 'negative',
                toxicityScore: 0.87,
                needsReply: false
            }
        ];

        const savedComments = await Comment.insertMany(comments);
        console.log(`${savedComments.length} sample comments created`);

        console.log('Sample data creation completed successfully');
    } catch (error) {
        console.error('Error creating sample data:', error.message);
    }
};

// Main migration function
const migrate = async () => {
    try {
        console.log('Starting database migration...');
        
        // Connect to database
        await connectDB();
        
        // Create indexes
        await createIndexes();
        
        // Create sample data
        await createSampleData();
        
        console.log('Database migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
};

// Run migration if called directly
if (require.main === module) {
    migrate();
}

module.exports = {
    User,
    Post,
    Analytics,
    Comment,
    migrate
};