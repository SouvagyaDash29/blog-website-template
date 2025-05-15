import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlog } from '../hooks/useBlog';

const BlogDetail = () => {
  const { id } = useParams();
  const { blog, blogContent, loading, error } = useBlog(id);

  if (loading) return <div className="loading">Loading blog...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!blog || !blogContent) return <div className="error">Blog not found</div>;

  const renderContent = (content) => {
    switch (content.type) {
      case 'paragraph':
        return <p>{content.data}</p>;
      case 'bullets':
        return (
          <ul>
            {content.data.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        );
      case 'steps':
        return (
          <ol>
            {content.data.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        );
      case 'image':
        return <img src={content.data} alt="" className="content-image" />;
      default:
        return null;
    }
  };

  return (
    <div className="blog-detail">
      <div className="blog-actions">
        <Link to="/" className="back-link">← Back to Blogs</Link>
        <Link to={`/edit/${id}`} className="edit-link">Edit Blog</Link>
      </div>
      
      <header className="blog-header">
        <h1>{blogContent.header.title}</h1>
        <p className="tagline">{blogContent.header.tagline}</p>
        <img 
          src={blogContent.header.coverImage} 
          alt={blogContent.header.title}
          className="cover-image"
        />
      </header>

      <div className="blog-content">
        {blogContent.sections.map((section, index) => (
          <section key={index} className="blog-section">
            {section.title && <h2>{section.title}</h2>}
            {section.subtitle && <h3>{section.subtitle}</h3>}
            <div className="section-content">
              {section.contents.map((content, contentIndex) => (
                <div key={contentIndex} className="content-block">
                  {renderContent(content)}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default BlogDetail;