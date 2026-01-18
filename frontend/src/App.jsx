import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import ArticleForm from './components/ArticleForm';
import axios from 'axios';
import './App.css';

function App() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [notification, setNotification] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');

  useEffect(() => {
  axios.get('http://localhost:5000/workspaces')
    .then(res => setWorkspaces(res.data))
    .catch(() => console.error('Failed to load workspaces'));
}, []);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('articleUpdated', ({ id, title }) => {
      setNotification(`Article "${title}" was updated`);
      setTimeout(() => setNotification(''), 5000);
    });

    socket.on('attachmentAdded', ({ id, attachments }) => {
      const names = attachments.map(a => a.originalName).join(', ');
      setNotification(`New attachments added: ${names}`);
      setTimeout(() => setNotification(''), 5000);
    });

    return () => socket.disconnect();
  }, []);

  const handleSelect = (id) => {
    setSelectedId(id);
    setView('view');
  };

  const handleBack = () => setView('list');

  const handleCreated = (id) => {
    setSelectedId(id);
    setView('view');
  };

  const handleEdited = (id) => {
    setSelectedId(id);
    setView('view');
  };

  return (
    <div className="container">
      {notification && <div className="notification">{notification}</div>}

      {view === 'list' && (
        <>


          <div className="block create-block">
            <h2>Create a new Article</h2>
            <button onClick={() => setView('create')}>Create</button>
          </div>

        <div className="block list-block">
        <div className="workspace-filter">
            <label>Workspace:</label>
            <select
                    value={selectedWorkspace || 'all'}
                    onChange={e => setSelectedWorkspace(e.target.value)}
              >
              <option value="all">All Workspaces</option>
            {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
        </div>

  <h2>All Articles</h2>

  <ArticleList
    onSelect={handleSelect}
    workspaceId={selectedWorkspace}
  />
</div>

        </>
      )}

      {view === 'view' && (
        <ArticleView
          id={selectedId}
          onBack={handleBack}
          onEdit={(id) => {
            setSelectedId(id);
            setView('edit');
          }}
          onDeleteSuccess={handleBack}
        />
      )}

      {view === 'create' && (
        <ArticleForm
          mode="create"
          onSuccess={handleCreated}
          onBack={handleBack}
          workspaces={workspaces}
          setWorkspaces={setWorkspaces}
        />
      )}

      {view === 'edit' && (
        <ArticleForm
          mode="edit"
          id={selectedId}
          onSuccess={handleEdited}
          onBack={handleBack}
          workspaces={workspaces}
          setWorkspaces={setWorkspaces}
        />
      )}
    </div>
  );
}

export default App;
