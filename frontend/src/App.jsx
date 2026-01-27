import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import ArticleForm from './components/ArticleForm';
import Login from './components/Login';
import Register from './components/Register';
import UserManagement from './components/UserManagement';
import axios from 'axios';
import './App.css';

function App() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [notification, setNotification] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('http://localhost:5000/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        setCurrentUser(res.data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common.Authorization;
        setIsAuthenticated(false);
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    axios.get('http://localhost:5000/workspaces')
      .then(res => setWorkspaces(res.data))
      .catch(() => console.error('Failed to load workspaces'));
  }, [isAuthenticated]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(null, err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common.Authorization;
        setIsAuthenticated(false);
        setCurrentUser(null);
        setView('list');
      }
      return Promise.reject(err);
    });
    return () => axios.interceptors.response.eject(interceptor);
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

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setView('list');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
    setIsAuthenticated(false);
    setCurrentUser(null);
    setView('list');
  };

  const goToUsers = () => setView('users');

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

  if (!isAuthenticated) {
    return (
      <div className="container">
        {authView === 'login' ? (
          <Login onLogin={handleLogin} switchToRegister={() => setAuthView('register')} />
        ) : (
          <Register switchToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="container">
      {notification && <div className="notification">{notification}</div>}
      <div className="user-profile-box">
        <div className="profile-label">User profile</div>
        {currentUser && <div className="email-badge">{currentUser.email}</div>}
        {currentUser?.role === 'admin' && (
          <button className="logout-btn" onClick={goToUsers}>User Management</button>
        )}
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

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
    currentUser={currentUser}
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
          currentUser={currentUser}
        />
      )}

      {view === 'create' && (
        <ArticleForm
          mode="create"
          onSuccess={handleCreated}
          onBack={handleBack}
          workspaces={workspaces}
          setWorkspaces={setWorkspaces}
          currentUser={currentUser}
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
          currentUser={currentUser}
        />
      )}
      {view === 'users' && currentUser?.role === 'admin' && (
        <UserManagement onBack={() => setView('list')} />
      )}
    </div>
  );
}

export default App;
