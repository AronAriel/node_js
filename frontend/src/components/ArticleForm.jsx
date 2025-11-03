import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ArticleForm.css';

export default function ArticleForm({ 
  mode = 'create',  
  id, 
  onSuccess, 
  onBack 
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ title: '', content: '' });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (mode === 'edit' && id) {
      axios
        .get(`http://localhost:5000/articles/${id}`)
        .then(res => {
          setTitle(res.data.title);
          setContent(res.data.content);
        })
        .catch(() => setGeneralError('Failed to load article'));
    }
  }, [mode, id]);

  const validateForm = () => {
    const errs = { title: '', content: '' };

    if (!title.trim()) errs.title = 'Title is required.';

    const plainText = content.replace(/<[^>]+>/g, '').trim();
    if (!plainText) errs.content = 'Content cannot be empty.';

    setFieldErrors(errs);
    return !errs.title && !errs.content;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      if (mode === 'create') {
        const res = await axios.post('http://localhost:5000/articles', { title, content });
        setSuccess('Article created successfully!');
        setTitle('');
        setContent('');
        onSuccess?.(res.data.id);
      } else {
        const res = await axios.put(`http://localhost:5000/articles/${id}`, { title, content });
        setSuccess('Article updated successfully!');
        onSuccess?.(res.data.id);
      }
    } catch (err) {
      setGeneralError(err.response?.data?.error || 'Failed to save article');
    }
  };

  return (
    <div className="create-article-container">
      <h2>{mode === 'create' ? 'Create New Article' : 'Edit Article'}</h2>

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
            placeholder={mode === 'create' ? 'Write your article here...' : 'Edit your article here...'}
          />
        </div>
        {fieldErrors.content && <p className="error">{fieldErrors.content}</p>}

        <div className="buttons">
          <button type="submit">{mode === 'create' ? 'Create' : 'Update'}</button>
          <button type="button" className="back-btn" onClick={onBack}>Back</button>
        </div>
      </form>
    </div>
  );
}
