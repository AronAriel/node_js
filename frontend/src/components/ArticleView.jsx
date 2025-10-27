import { useEffect, useState } from 'react';
import axios from 'axios';
import './ArticleView.css';

export default function ArticleView({ id, onBack }) {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    axios
      .get(`http://localhost:5000/articles/${id}`)
      .then(res => setArticle(res.data))
      .catch(() => setError('Article not found'));
  }, [id]);

  if (error) {
    return (
      <div className="article-view-container">
        <p className="error">{error}</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-view-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="article-view-container">
      <h2 className="article-title">{article.title}</h2>
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
      <div className="buttons">
        <button onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
