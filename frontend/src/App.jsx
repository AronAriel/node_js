import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import ArticleForm from './components/ArticleForm';

function App() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [notification, setNotification] = useState('');

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
            <h2>All Articles</h2>
            <ArticleList onSelect={handleSelect} />
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
        <ArticleForm mode="create" onSuccess={handleCreated} onBack={handleBack} />
      )}

      {view === 'edit' && (
        <ArticleForm mode="edit" id={selectedId} onSuccess={handleEdited} onBack={handleBack} />
      )}
    </div>
  );
}

export default App;
