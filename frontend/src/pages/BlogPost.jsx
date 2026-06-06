import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import posts from '../data/posts';

function BlogPost() {
    const { slug } = useParams();
    const { i18n } = useTranslation();

    const post = posts.find(p => p.slug === slug);

    if (!post) {
        return (
            <div className="container" style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>{i18n.language === 'pt' ? 'Artigo não encontrado' : 'Article not found'}</h2>
                <Link to="/blog" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
                    ← Blog
                </Link>
            </div>
        );
    }

    const title = i18n.language === 'en' ? (post.title_en || post.title) : post.title;
    const content = i18n.language === 'en' ? (post.content_en || post.content) : post.content;

    return (
        <div className="page-blog-post" style={{ paddingTop: '120px' }}>
            <div className="container">
                <Link to="/blog" className="back-link">← Blog</Link>

                <article className="blog-post-content">
                    <header className="blog-post-header">
                        <div className="blog-item-meta">
                            <span className="blog-category">{post.category}</span>
                            <span className="blog-date">{post.date}</span>
                        </div>
                        <h1>{title}</h1>
                    </header>

                    <div
                        className="blog-post-body"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </article>
            </div>
        </div>
    );
}

export default BlogPost;
