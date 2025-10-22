const API_BASE_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Store securely!

async function fetchPageInsights() {
    const response = await fetch(`${API_BASE_URL}/me/insights/page_impressions,page_engaged_users?access_token=${ACCESS_TOKEN}`);
    return response.json();
}

async function fetchPageInfo() {
    const response = await fetch(`${API_BASE_URL}/me?fields=followers_count,name&access_token=${ACCESS_TOKEN}`);
    return response.json();
}

async function fetchRecentPosts() {
    const response = await fetch(`${API_BASE_URL}/me/posts?fields=message,created_time,likes.summary(true),shares&access_token=${ACCESS_TOKEN}`);
    return response.json();
}
