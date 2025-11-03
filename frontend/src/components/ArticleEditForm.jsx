import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ArticleEditForm.css';

export default function ArticleEditForm({ id, onEdited, onBack }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ title: '', content: '' });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    axios
      .get(`http://localhost:5000/articles/${id}`)
      .then(res => {
        setTitle(res.data.title);
        setContent(res.data.content);
      })
      .catch(() => setGeneralError('Failed to load article'));
  }, [id]);

const validateForm = () => {
    const errs = { title: '', content: '' };

    if (!title.trim()) {
      errs.title = 'Title is required.';
    }

    const plainText = content.replace(/<[^>]+>/g, '').trim();
    if (!plainText) {
      errs.content = 'Content cannot be empty.';
    }

    setFieldErrors(errs);

    return !errs.title && !errs.content;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccess('');
    if (!validateForm()) return;

    try {
      const res = await axios.put(`http://localhost:5000/articles/${id}`, { title, content });
      setSuccess('Article updated successfully!');
      onEdited(res.data.id);
    } catch (err) {
      setGeneralError(err.response?.data?.error || 'Failed to update article');
    }
  };

  return (
    <div className="create-article-container">
      <h2>Edit Article</h2>

      {generalError && <p className="error">{generalError}</p>}
      {success && <p className="success">{success}</p>}

      <form onSubmit={handleSubmit} className="create-article-form" noValidate>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          placeholder="Enter article title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={fieldErrors.title ? 'input-error' : ''}
        />
        {fieldErrors.title && <p className="error">{fieldErrors.title}</p>}

        <label>Content</label>
        <div className={`quill-wrapper ${fieldErrors.content ? 'input-error' : ''}`}>
          <ReactQuill
            value={content}
            onChange={setContent}
            className="quill-editor"
            placeholder="Edit your article here..."
          />
        </div>
        {fieldErrors.content && <p className="error">{fieldErrors.content}</p>}

        <div className="buttons">
          <button type="submit">Update</button>
          <button type="button" className="back-btn" onClick={onBack}>Back</button>
        </div>
      </form>
    </div>
  );
}
