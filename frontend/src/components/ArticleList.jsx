import { useEffect, useState } from 'react';
import axios from 'axios';
import './ArticleList.css';

export default function ArticleList({ onSelect }) {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/articles')
      .then(res => setArticles(res.data))
      .catch(() => setError('Failed to fetch articles'));
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div>
      <ul>
        {articles.map(article => (
          <li key={article.id}>
            <button onClick={() => onSelect(article.id)}>
              {article.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
