import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import BlogList from './componets/BlogList';
import BlogDetail from './componets/BlogDetails';
import BlogForm from './componets/BlogForm';
import NewsEventsList from './componets/NewsEventsList';
import NewsEventDetail from './componets/NewsEventDetail';
import NewsEventForm from './componets/NewsEventForm';

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav>
      <a href="/" className={currentPath === '/' ? 'active' : ''}>Blogs</a>
      <a href="/news-events" className={currentPath === '/news-events' ? 'active' : ''}>News & Events</a>
      <a href="/news-events/new" className={currentPath === '/news-events/new' ? 'active' : ''}>Add News/Event</a>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1>Blog Website</h1>
            <Navigation />
          </div>
        </header>
        <main className="app-main">
          <div className="container">
            <Routes>
              {/* Blog Routes */}
              <Route path="/" element={<BlogList />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/edit/:id?" element={<BlogForm />} />
              
              {/* News & Events Routes */}
              <Route path="/news-events" element={<NewsEventsList />} />
              <Route path="/news-events/:id" element={<NewsEventDetail />} />
              <Route path="/news-events/new" element={<NewsEventForm />} />
              <Route path="/news-events/edit/:id" element={<NewsEventForm />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;