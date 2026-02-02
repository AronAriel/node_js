import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ArticleList.css';

export default function ArticleList({ onSelect, workspaceId, currentUser }) {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef();

 useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        let url = 'http://localhost:5000/articles';
        const params = new URLSearchParams();
        if (workspaceId && workspaceId !== 'all') params.append('workspaceId', workspaceId);
        if (query?.trim()) params.append('q', query.trim());
        const qs = params.toString();
        if (qs) url += `?${qs}`;

        const res = await axios.get(url);
        setArticles(res.data);
        setError('');
      } catch (e) {
        console.error(e);
        setError('Failed to fetch articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, 300);

  return () => clearTimeout(debounceRef.current);
}, [workspaceId, query]);


  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input
          aria-label="Search articles"
          placeholder="Search title or content..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ padding: '6px 8px', width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Searching...</p>}

      <ul>
        {articles.length === 0 && !loading && <li>No articles found.</li>}
        {articles.map(article => (
          <li key={article.id}>
            <button onClick={() => onSelect(article.id)}>
              {article.title}
            </button>
            <div style={{ fontSize: 12, color: '#555' }}>
              Created by: {article.User?.email || 'Unknown'} on {new Date(article.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
