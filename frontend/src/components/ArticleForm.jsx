import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ArticleForm.css';

export default function ArticleForm({ 
  mode = 'create',  
  id, 
  onSuccess, 
  onBack,
  workspaces,
  setWorkspaces
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ title: '', content: '', workspace: '' });
  const [success, setSuccess] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  useEffect(() => {
    if (mode === 'edit' && id) {
      axios
        .get(`http://localhost:5000/articles/${id}`)
        .then(res => {
          setTitle(res.data.title);
          setContent(res.data.content);
          setUploadedFiles(res.data.attachments || []);
          setSelectedWorkspace(res.data.workspaceId || (workspaces[0]?.id || ''));
        })
        .catch(() => setGeneralError('Failed to load article'));
    }
  }, [mode, id, workspaces]);

  const validateForm = () => {
    const errs = { title: '', content: '', workspace: '' };
    if (!title.trim()) errs.title = 'Title is required.';
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    if (!plainText) errs.content = 'Content cannot be empty.';
    if (!selectedWorkspace || (selectedWorkspace === 'new' && !newWorkspaceName.trim())) {
      errs.workspace = 'Workspace is required.';
    }
    setFieldErrors(errs);
    return !errs.title && !errs.content && !errs.workspace;
  };

  const handleFileSelect = (e) => {
    setFileError('');
    const selected = Array.from(e.target.files);
    const invalid = selected.find(f => !allowedTypes.includes(f.type));
    if (invalid) {
      setFileError('Invalid file type. Allowed: JPG, PNG, PDF.');
      return;
    }
    setFiles(selected);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setGeneralError('');
  setSuccess('');
  setFileError('');

  if (!validateForm()) return;

  try {
    let workspaceIdToSend = selectedWorkspace;

    if (selectedWorkspace === 'new') {
      const wsRes = await axios.post('http://localhost:5000/workspaces', {
        name: newWorkspaceName.trim()
      });
      workspaceIdToSend = wsRes.data.id;
      setWorkspaces(prev => [...prev, wsRes.data]);
      setNewWorkspaceName('');
      setSelectedWorkspace(wsRes.data.id);
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('workspaceId', workspaceIdToSend);

    files.forEach(f => formData.append('attachments', f));

    let res;
    if (mode === 'create') {
      res = await axios.post('http://localhost:5000/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Article created successfully!');
      setTitle('');
      setContent('');
      setFiles([]);
      setSelectedWorkspace(workspaces[0]?.id || '');
    } else {
      res = await axios.put(`http://localhost:5000/articles/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Article updated successfully!');
      setFiles([]);
    }

    const article = res.data;

    setUploadedFiles(article.attachments || []);

    onSuccess?.(article.id);

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

        <label>Workspace</label>
        <select 
          value={selectedWorkspace || ''} 
          onChange={e => setSelectedWorkspace(e.target.value)}
          className={fieldErrors.workspace ? 'input-error' : ''}
        >
          <option value="">-- Select workspace --</option>
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
          <option value="new">+ Create New Workspace</option>
        </select>
        {selectedWorkspace === 'new' && (
          <input 
            type="text" 
            placeholder="New workspace name" 
            value={newWorkspaceName} 
            onChange={e => setNewWorkspaceName(e.target.value)}
          />
        )}
        {fieldErrors.workspace && <p className="error">{fieldErrors.workspace}</p>}

        <label>Attachments (JPG, PNG, PDF)</label>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
        />
        {fileError && <p className="error">{fileError}</p>}

        {uploadedFiles.length > 0 && (
          <div className="attachments">
            <h3>Attachments</h3>
            <div className="attachment-list">
              {uploadedFiles.map(file => (
                <a
                  key={file.filename || file.fileName}
                  href={`http://localhost:5000${file.path || file.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-card"
                >
                  <div className="attachment-icon">
                    {/\.(jpg|jpeg|png)$/i.test(file.filename || file.fileName) ? '🖼️' : '📄'}
                  </div>
                  <div className="attachment-name">{file.filename || file.originalName}</div>
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
