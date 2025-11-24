// ArticleView.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import './ArticleView.css';

export default function ArticleView({ id, onBack, onEdit, onDeleteSuccess }) {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    axios
      .get(`http://localhost:5000/articles/${id}`)
      .then(res => setArticle(res.data))
      .catch(() => setError('Article not found'));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await axios.delete(`http://localhost:5000/articles/${id}`);
      alert('Article deleted successfully!');
      onDeleteSuccess();
    } catch (err) {
      alert('Failed to delete article');
    }
  };

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

    {article.attachments && article.attachments.length > 0 && (
      <div className="attachments attachments-top">
        <h3>Attachments</h3>
        <div className="attachment-list">
          {article.attachments.map(file => (
            <a
              key={file.fileName}
              href={`http://localhost:5000${file.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="attachment-card"
            >
              <div className="attachment-icon">
                {file.mime.includes('image') ? '🖼️' : '📄'}
              </div>
              <div className="attachment-name">{file.originalName}</div>
            </a>
          ))}
        </div>
      </div>
    )}
    <div
      className="article-content"
      dangerouslySetInnerHTML={{ __html: article.content }}
    />

    <div className="buttons">
      <button onClick={onBack}>Back</button>
      <button onClick={() => onEdit(article.id)}>Edit</button>
      <button className="delete-btn" onClick={handleDelete}>Delete</button>
    </div>

  </div>
);

}
