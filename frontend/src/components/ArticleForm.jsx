import { useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ArticleCommonForm.css';

export default function ArticleForm({ onCreated, onBack }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ title: '', content: '' });
  const [success, setSuccess] = useState('');

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
    setFieldErrors({ title: '', content: '' });

    if (!validateForm()) return;

    try {
      const res = await axios.post('http://localhost:5000/articles', { title, content });
      setSuccess('Article created successfully!');
      setTitle('');
      setContent('');
      onCreated(res.data.id);
    } catch (err) {
      setGeneralError(err.response?.data?.error || 'Failed to create article');
    }
  };

  return (
    <div className="create-article-container">
      <h2>Create New Article</h2>

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
            placeholder="Write your article here..."
          />
        </div>
        {fieldErrors.content && <p className="error">{fieldErrors.content}</p>}

        <div className="buttons">
          <button type="submit">Create</button>
          <button type="button" className="back-btn" onClick={onBack}>Back</button>
        </div>
      </form>
    </div>
  );
}
