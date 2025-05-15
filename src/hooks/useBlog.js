import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useBlog = (id) => {
  const [blog, setBlog] = useState(null);
  const [blogContent, setBlogContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchBlog = async () => {
      try {
        const [blogDoc, contentDoc] = await Promise.all([
          getDoc(doc(db, 'blogs', id)),
          getDoc(doc(db, 'blogs_content', id))
        ]);

        if (blogDoc.exists()) {
          setBlog({ id: blogDoc.id, ...blogDoc.data() });
        }
        
        if (contentDoc.exists()) {
          setBlogContent(contentDoc.data());
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  return { blog, blogContent, loading, error };
};