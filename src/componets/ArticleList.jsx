import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';

const ArticleList = ({ type }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        console.log('Fetching articles for type:', type);
        
        // First, let's fetch all articles to see what categories exist
        const allArticlesQuery = query(collection(db, 'articles_metadata'));
        const allSnapshot = await getDocs(allArticlesQuery);
        
        // Log all unique categories
        const categories = new Set();
        allSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.category) {
            categories.add(data.category);
          }
        });
        console.log('All categories in database:', Array.from(categories));
        
        // Now fetch articles for the specific type
        const articlesQuery = query(
          collection(db, 'articles_metadata'),
          where('category', '==', type)
        );
        
        const snapshot = await getDocs(articlesQuery);
        console.log('Query snapshot size:', snapshot.size);
        
        let articlesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Articles data:', articlesData);

        // Sort the articles by publishedAt date in memory
        articlesData.sort((a, b) => {
          const dateA = a.publishedAt?.seconds || 0;
          const dateB = b.publishedAt?.seconds || 0;
          return dateB - dateA; // Sort in descending order (newest first)
        });
        
        setArticles(articlesData);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [type]);

  // Debug log for render
  console.log('Current type:', type, 'Articles count:', articles.length);

  if (loading) return <div className="loading">Loading {type}...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="article-list">
      <div className="article-header">
        <h2>{type === 'news' ? 'Latest News' : 'Upcoming Events'}</h2>
        <Link to={`/add-article?type=${type}`} className="add-btn">
          Add {type === 'news' ? 'News' : 'Event'}
        </Link>
      </div>

      {articles.length === 0 ? (
        <p>No {type} found. <Link to={`/add-article?type=${type}`}>Create your first {type === 'news' ? 'news article' : 'event'}</Link></p>
      ) : (
        <div className="article-grid">
          {articles.map(article => (
            <article key={article.id} className="article-card">
              <Link to={`/${type}/${article.id}`}>
                <img src={article.coverImage} alt={article.title} />
                <div className="article-card-content">
                  <h3>{article.title}</h3>
                  <p className="article-tagline">{article.tagline}</p>
                  <p className="article-date">
                    {article.publishedAt?.seconds 
                      ? new Date(article.publishedAt.seconds * 1000).toLocaleDateString()
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

export default ArticleList; 