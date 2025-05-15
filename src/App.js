import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import BlogList from './componets/BlogList';
import BlogDetail from './componets/BlogDetails';
import BlogForm from './componets/BlogForm';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1>Blog Website</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/edit">Add Blog</a>
            </nav>
          </div>
        </header>
        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<BlogList />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/edit/:id?" element={<BlogForm />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;