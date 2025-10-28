// pages/api/polymarket.js

export default async function handler(req, res) {
  const { identifier, type = 'slug' } = req.query;
  
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Market identifier is required' });
  }
  
  try {
    let url;
    if (type === 'slug') {
      url = `https://gamma-api.polymarket.com/markets?slug=${identifier}`;
    } else {
      url = `https://gamma-api.polymarket.com/markets?id=${identifier}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: `Polymarket API error: ${response.status}` 
      });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Polymarket proxy error:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch Polymarket market: ${error.message}` 
    });
  }
}