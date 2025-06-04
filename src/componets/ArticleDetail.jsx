import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const [metadataDoc, contentDoc] = await Promise.all([
          getDoc(doc(db, 'articles_metadata', id)),
          getDoc(doc(db, 'articles_content', id))
        ]);

        if (metadataDoc.exists() && contentDoc.exists()) {
          setArticle({ id: metadataDoc.id, ...metadataDoc.data() });
          setContent(contentDoc.data());
        } else {
          setError('Article not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) return <div className="loading">Loading article...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!article || !content) return <div className="error">Article not found</div>;

  const renderContent = (content) => {
    switch (content.type) {
      case 'paragraph':
        return <p>{content.data}</p>;
      case 'richText':
        return <div dangerouslySetInnerHTML={{ __html: content.data }} />;
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
    <div className="article-detail">
      <div className="article-actions">
        <Link to={`/${article.category}`} className="back-link">← Back to {article.category === 'news' ? 'News' : 'Events'}</Link>
        <Link to={`/edit-article/${id}`} className="edit-link">Edit Article</Link>
      </div>
      
      <header className="article-header">
        <h1>{content.header.title}</h1>
        <p className="tagline">{content.header.tagline}</p>
        <img 
          src={content.header.coverImage} 
          alt={content.header.title}
          className="cover-image"
        />
      </header>

      <div className="article-content">
        {content.sections.map((section, index) => (
          <section key={index} className="article-section">
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

export default ArticleDetail; 