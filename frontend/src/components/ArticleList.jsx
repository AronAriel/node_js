import { useEffect, useState } from 'react';
import axios from 'axios';
import './ArticleList.css';

export default function ArticleList({ onSelect, workspaceId, currentUser }) {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');

 useEffect(() => {
  let url = 'http://localhost:5000/articles';
  if (workspaceId && workspaceId !== 'all') {
    url += `?workspaceId=${workspaceId}`;
  }

  axios.get(url)
    .then(res => setArticles(res.data))
    .catch(() => setError('Failed to fetch articles'));
}, [workspaceId]);

  if (error) return <p>{error}</p>;

  return (
    <div>
      <ul>
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
