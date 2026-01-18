import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ArticleView.css';

export default function ArticleView({ id, onBack, onEdit, onDeleteSuccess }) {
  const [article, setArticle] = useState(null);
  const [versions, setVersions] = useState([]);
  const [viewingVersion, setViewingVersion] = useState(null); 
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [error, setError] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  const [authorError, setAuthorError] = useState('');
  const [commentError, setCommentError] = useState('');

  const commentsEndRef = useRef(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/articles/${id}`);
        setArticle(res.data);
        setComments(res.data.Comments || []);
      } catch (err) {
        setError('Article not found');
      }
    };

    fetchArticle();
    const fetchVersions = async () => {
      try {
        const vres = await axios.get(`http://localhost:5000/articles/${id}/versions`);
        setVersions(vres.data || []);
      } catch (e) {

      }
    };

    fetchVersions();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

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

  const openVersion = async (versionId) => {
    try {
      const res = await axios.get(`http://localhost:5000/articles/${id}/versions/${versionId}`);
      setViewingVersion(res.data);
    } catch (e) {
      alert('Failed to load version');
    }
  };

  const closeVersion = () => {
    setViewingVersion(null);
  };

  const handleAddComment = async () => {
    setAuthorError('');
    setCommentError('');

    let hasError = false;

    if (!commentAuthor.trim()) {
      setAuthorError('Name is required');
      hasError = true;
    }

    if (!commentText.trim()) {
      setCommentError('Comment text is required');
      hasError = true;
    }

    if (hasError) return;

    setLoadingComment(true);
    try {
      const res = await axios.post(`http://localhost:5000/comments/${id}`, {
        author: commentAuthor.trim(),
        text: commentText.trim()
      });
      setComments(prev => [...prev, res.data]);
      setCommentText('');
      setCommentAuthor('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setLoadingComment(false);
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
      <h2 className="article-title">{viewingVersion ? viewingVersion.title : article.title}</h2>

      {viewingVersion && (
        <div className="version-indicator">
          Viewing version {viewingVersion.versionNumber} from {new Date(viewingVersion.createdAt).toLocaleString()} (read-only)
        </div>
      )}

      {(viewingVersion ? viewingVersion.attachments : article.attachments)?.length > 0 && (
        <div className="attachments attachments-top">
          <h3>Attachments</h3>
          <div className="attachment-list">
            {(viewingVersion ? viewingVersion.attachments : article.attachments).map(file => (
              <a
                key={file.filename}
                href={`http://localhost:5000${file.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-card"
              >
                <div className="attachment-icon">
                  {file.filename.match(/\.(jpg|jpeg|png)$/i) ? '🖼️' : '📄'}
                </div>
                <div className="attachment-name">{file.filename}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: viewingVersion ? viewingVersion.content : article.content }}
      />

      <div className="buttons">
        <button onClick={onBack}>Back</button>
        {!viewingVersion && <button onClick={() => onEdit(article.id)}>Edit</button>}
        {!viewingVersion && <button className="delete-btn" onClick={handleDelete}>Delete</button>}
        <button onClick={() => setVersionsOpen ? null : null} style={{ visibility: 'hidden' }} />
      </div>

      <div className="versions-section">
        <h3>Versions</h3>
        {versions.length === 0 && <p>No previous versions.</p>}
        {versions.length > 0 && (
          <ul className="version-list">
            {versions.map(v => (
              <li key={v.id}>
                <button onClick={() => openVersion(v.id)}>
                  Version {v.versionNumber}: {v.title} — {new Date(v.createdAt).toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
        )}
        {viewingVersion && <button onClick={closeVersion}>Back to current</button>}
      </div>

      <div className="comments-section">
        <h3>Comments ({comments.length})</h3>
        {comments.length === 0 && <p>No comments yet.</p>}
        <ul className="comment-list">
          {comments.map(c => (
            <li key={c.id}>
              <strong>{c.author}:</strong> {c.text}{' '}
              <em>({new Date(c.createdAt).toLocaleString()})</em>
            </li>
          ))}
          <div ref={commentsEndRef} />
        </ul>

        <div className="comment-form">
          <input
            type="text"
            placeholder="Your name"
            value={commentAuthor}
            onChange={e => setCommentAuthor(e.target.value)}
            disabled={!!viewingVersion}
          />
          {authorError && <p className="error">{authorError}</p>}

          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            disabled={!!viewingVersion}
          />
          {commentError && <p className="error">{commentError}</p>}

          <button disabled={loadingComment || !!viewingVersion} onClick={handleAddComment}>
            {loadingComment ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}
