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
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      axios
        .get(`http://localhost:5000/articles/${id}`)
        .then(res => {
          setTitle(res.data.title);
          setContent(res.data.content);
          setUploadedFiles(res.data.attachments || []);
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
      let article;
      if (mode === 'create') {
        const res = await axios.post('http://localhost:5000/articles', { title, content });
        article = res.data;
        setSuccess('Article created successfully!');
        setTitle('');
        setContent('');
        onSuccess?.(article.id);
      } else {
        const res = await axios.put(`http://localhost:5000/articles/${id}`, { title, content });
        article = res.data;
        setSuccess('Article updated successfully!');
        onSuccess?.(article.id);
      }

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const resFiles = await axios.post(
          `http://localhost:5000/articles/${article.id}/attachments`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        setUploadedFiles(resFiles.data.attachments);
        setFiles([]);
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
        <label>Attachments (JPG, PNG, PDF)</label>
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={e => setFiles(Array.from(e.target.files))}
        />

       {uploadedFiles.length > 0 && (
  <div className="attachments">
    <h3>Attachments</h3>
    <div className="attachment-list">
      {uploadedFiles.map(file => (
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

        <div className="buttons">
          <button type="submit">{mode === 'create' ? 'Create' : 'Update'}</button>
          <button type="button" className="back-btn" onClick={onBack}>Back</button>
        </div>
      </form>
    </div>
  );
}
