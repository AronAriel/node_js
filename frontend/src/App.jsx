import { useState } from 'react';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import ArticleForm from './components/ArticleForm';

function App() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);

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
