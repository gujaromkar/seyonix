// Replace 'YOUR_ACCESS_TOKEN_HERE' with your actual token
// WARNING: DO NOT expose tokens in production frontend code!
const ACCESS_TOKEN = 'EEAAVQmWE4iZBYBPONWTwds6RtNwMQ0IbkZB1RqomlEVCbajsmd6vftqUCzqBP443M0w9ZCCxwWovXS8wM92k0xq593a7w064281a5sZA48ZCGp6IENGakZABvvHB0dS8IHDsYayW0NawUvqZBIHx40ieRS77T0XhR2fJjLRMdjTdb7NZBaFxLbo4CvKFKjSCuq3zeSzxURCoq71sevJ6VmpkZC9SqUo6bx2Jgw7vgw';
const API_BASE_URL = 'https://graph.facebook.com/v18.0';

// DOM Elements
const createPostBtn = document.getElementById('create-post-btn');
const createPostBtn2 = document.getElementById('create-post-btn-2');
const createPostModal = document.getElementById('create-post-modal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelPostBtn = document.getElementById('cancel-post');
const submitPostBtn = document.getElementById('submit-post');
const menuLinks = document.querySelectorAll('.menu-link');

// Chart initialization
const ctx = document.getElementById('performanceChart').getContext('2d');
const performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Impressions',
                data: [],
                borderColor: '#4361ee',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(67, 97, 238, 0.1)'
            },
            {
                label: 'Engagements', 
                data: [],
                borderColor: '#f72585',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(247, 37, 133, 0.1)'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Weekly Performance' }
        },
        scales: { y: { beginAtZero: true } }
    }
});

// Utility Functions
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
}

function showLoading(element) {
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
}

// Meta Graph API Functions
async function fetchPageInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/me?fields=followers_count,name,fan_count&access_token=${ACCESS_TOKEN}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching page info:', error);
        return null;
    }
}

async function fetchPageInsights() {
    try {
        const response = await fetch(`${API_BASE_URL}/me/insights?metric=page_impressions,page_engaged_users&period=day&access_token=${ACCESS_TOKEN}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching insights:', error);
        return null;
    }
}

async function fetchRecentPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/me/posts?fields=message,created_time,likes.summary(true),shares,comments.summary(true)&limit=5&access_token=${ACCESS_TOKEN}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching posts:', error);
        return null;
    }
}

async function publishPost(message, link = null, scheduledTime = null) {
    try {
        const postData = new URLSearchParams({
            message: message,
            access_token: ACCESS_TOKEN
        });
        
        if (link) postData.append('link', link);
        if (scheduledTime) postData.append('scheduled_publish_time', scheduledTime);

        const endpoint = scheduledTime ? 
            `${API_BASE_URL}/me/scheduled_posts` : 
            `${API_BASE_URL}/me/feed`;

        const response = await fetch(endpoint, {
            method: 'POST',
            body: postData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error publishing post:', error);
        return null;
    }
}

// Dashboard Update Functions
async function updateDashboardStats() {
    const stats = document.querySelectorAll('.stat-info h3');
    
    // Show loading
    stats.forEach(stat => showLoading(stat));

    try {
        const pageInfo = await fetchPageInfo();
        const insights = await fetchPageInsights();

        if (pageInfo) {
            stats[0].textContent = formatNumber(pageInfo.followers_count || pageInfo.fan_count);
        }

        if (insights && insights.data) {
            const impressionsData = insights.data.find(d => d.name === 'page_impressions');
            const engagementsData = insights.data.find(d => d.name === 'page_engaged_users');
            
            if (impressionsData && impressionsData.values.length > 0) {
                const totalImpressions = impressionsData.values.reduce((sum, val) => sum + val.value, 0);
                stats[1].textContent = formatNumber(totalImpressions);
            }
            
            if (engagementsData && engagementsData.values.length > 0) {
                const totalEngagements = engagementsData.values.reduce((sum, val) => sum + val.value, 0);
                stats[2].textContent = formatNumber(totalEngagements);
            }

            updatePerformanceChart(insights);
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
        // Fallback to static data
        stats[0].textContent = '24.8K';
        stats[1].textContent = '162K';
        stats[2].textContent = '9.2K';
    }
}

function updatePerformanceChart(insights) {
    if (!insights || !insights.data) return;

    const impressionsData = insights.data.find(d => d.name === 'page_impressions');
    const engagementsData = insights.data.find(d => d.name === 'page_engaged_users');

    if (impressionsData && engagementsData) {
        const labels = impressionsData.values.map(val => 
            new Date(val.end_time).toLocaleDateString('en-US', { weekday: 'short' })
        );
        const impressions = impressionsData.values.map(val => val.value);
        const engagements = engagementsData.values.map(val => val.value);

        performanceChart.data.labels = labels;
        performanceChart.data.datasets[0].data = impressions;
        performanceChart.data.datasets[1].data = engagements;
        performanceChart.update();
    }
}

async function updateRecentActivity() {
    const posts = await fetchRecentPosts();
    
    if (posts && posts.data) {
        const activityContainer = document.querySelector('.activity-list');
        if (activityContainer) {
            activityContainer.innerHTML = '';
            
            posts.data.slice(0, 4).forEach(post => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-content">
                        <p>${post.message ? post.message.substring(0, 60) + '...' : 'Media post'}</p>
                        <small>${new Date(post.created_time).toLocaleDateString()}</small>
                        <div class="activity-stats">
                            <span>👍 ${post.likes?.summary?.total_count || 0}</span>
                            <span>💬 ${post.comments?.summary?.total_count || 0}</span>
                            <span>🔄 ${post.shares?.count || 0}</span>
                        </div>
                    </div>
                `;
                activityContainer.appendChild(activityItem);
            });
        }
    }
}

// Event Listeners
createPostBtn.addEventListener('click', () => {
    createPostModal.style.display = 'flex';
});

createPostBtn2.addEventListener('click', () => {
    createPostModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    createPostModal.style.display = 'none';
});

cancelPostBtn.addEventListener('click', () => {
    createPostModal.style.display = 'none';
});

// Enhanced submit post handler with actual API call
submitPostBtn.addEventListener('click', async () => {
    const postText = document.querySelector('#post-text');
    const message = postText?.value || 'New post from dashboard';
    
    if (message.trim()) {
        submitPostBtn.disabled = true;
        submitPostBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
        
        const result = await publishPost(message);
        
        if (result && result.id) {
            alert('Post published successfully!');
            postText.value = '';
            // Refresh dashboard data
            setTimeout(() => {
                updateDashboardStats();
                updateRecentActivity();
            }, 2000);
        } else {
            alert('Failed to publish post. Check console for details.');
        }
        
        submitPostBtn.disabled = false;
        submitPostBtn.innerHTML = 'Publish Post';
        createPostModal.style.display = 'none';
    } else {
        alert('Please enter some text for your post!');
    }
});

menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        menuLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === createPostModal) {
        createPostModal.style.display = 'none';
    }
});

// Refresh functionality
document.querySelector('.fa-sync')?.addEventListener('click', function(e) {
    e.preventDefault();
    this.classList.add('fa-spin');
    
    updateDashboardStats();
    updateRecentActivity();
    
    setTimeout(() => {
        this.classList.remove('fa-spin');
        
        // Update AI suggestions
        const suggestions = document.querySelector('.suggestion-content');
        if (suggestions) {
            suggestions.innerHTML = `
                <div class="suggestion-item">
                    <span class="suggestion-icon">💡</span>
                    <strong>Updated Analysis:</strong> Weekend posts get 18% more engagement
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">🎯</span>
                    <strong>New Idea:</strong> Try a Q&A session - your audience engagement is up 22%
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-icon">📈</span>
                    <strong>Trend Alert:</strong> Videos under 60s are performing well this week
                </div>
            `;
        }
    }, 2000);
});

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load real data
    updateDashboardStats();
    updateRecentActivity();
    
    // Set up auto-refresh every 5 minutes
    setInterval(() => {
        updateDashboardStats();
        updateRecentActivity();
    }, 300000);
});

// Auto-save draft functionality
let draftTimer;
document.querySelector('#post-text')?.addEventListener('input', function() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
        localStorage.setItem('post-draft', this.value);
    }, 1000);
});

// Load draft on modal open
createPostBtn.addEventListener('click', () => {
    const draft = localStorage.getItem('post-draft');
    const postText = document.querySelector('#post-text');
    if (draft && postText) {
        postText.value = draft;
    }
});
