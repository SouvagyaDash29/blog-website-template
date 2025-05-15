import React from 'react';
import { useBlogs } from '../hooks/useBlogs';
import { Link } from 'react-router-dom';

const BlogList = () => {
  const { blogs, loading, error } = useBlogs();

  if (loading) return <div className="loading">Loading blogs...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="blog-list">
      <h2>Latest Blogs</h2>
      {blogs.length === 0 ? (
        <p>No blogs found. <Link to="/edit">Create your first blog</Link></p>
      ) : (
        <div className="blog-grid">
          {blogs.map(blog => (
            <article key={blog.id} className="blog-card">
              <Link to={`/blog/${blog.id}`}>
                <img src={blog.coverImage} alt={blog.title} />
                <div className="blog-card-content">
                  <h3>{blog.title}</h3>
                  <p className="blog-date">
                    {blog.publishedAt?.seconds 
                      ? new Date(blog.publishedAt.seconds * 1000).toLocaleDateString()
                      : 'No date'
                    }
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;