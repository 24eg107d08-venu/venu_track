import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Edit2, Plus, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');

  useEffect(() => {
    if (!user) return;

    // Fetch initial tasks
    const fetchTasks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/tasks', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();

    // Setup Socket.io
    const socket = io('http://localhost:5000', {
      auth: { token: user.token }
    });

    socket.on('taskCreated', (task) => {
      setTasks(prev => [task, ...prev]);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    });

    socket.on('taskDeleted', (taskId) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    });

    return () => socket.disconnect();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = { title, description, status };

      if (editingTask) {
        await axios.put(`http://localhost:5000/api/tasks/${editingTask._id}`, payload, config);
      } else {
        await axios.post('http://localhost:5000/api/tasks', payload, config);
      }
      
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
    } else {
      setEditingTask(null);
      setTitle('');
      setDescription('');
      setStatus('todo');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Task Board</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.username}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="glass-button" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Task
          </button>
          <button className="glass-button danger" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="task-grid">
        {tasks.map(task => (
          <div key={task._id} className="glass-panel task-card">
            <div className="task-header">
              <h3 className="task-title">{task.title}</h3>
              <span className={`task-status status-${task.status}`}>{task.status.replace('-', ' ')}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', minHeight: '40px' }}>
              {task.description || 'No description provided.'}
            </p>
            <div className="task-actions">
              <button className="icon-button" onClick={() => openModal(task)}>
                <Edit2 size={18} />
              </button>
              <button className="icon-button delete" onClick={() => handleDelete(task._id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2 style={{ marginBottom: '1.5rem' }}>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="glass-input" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  className="glass-input" 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="glass-button" style={{ flex: 1 }}>Save</button>
                <button type="button" className="glass-button" style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)' }} onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
