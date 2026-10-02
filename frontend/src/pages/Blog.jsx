import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import posts from '../data/posts';

function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}

function Blog() {
    const { t, i18n } = useTranslation();
    const sortedPosts = [...posts].sort((a, b) => parseDate(b.date) - parseDate(a.date));

    return (
        <div className="page-blog" style={{ paddingTop: '120px' }}>
            <div className="container">
                <div className="section-header">
                    <h1 className="section-title">{t('blog.title')}</h1>
                    <p className="section-description">{t('blog.subtitle')}</p>
                </div>

                {sortedPosts.length === 0 ? (
                    <div className="blog-empty">
                        <p>{t('blog.empty')}</p>
                    </div>
                ) : (
                    <div className="blog-list">
                        {sortedPosts.map((post) => {
                            const title = i18n.language === 'en' ? (post.title_en || post.title) : post.title;
                            const summary = i18n.language === 'en' ? (post.summary_en || post.summary) : post.summary;
                            return (
                                <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-item">
                                    <div className="blog-item-meta">
                                        <span className="blog-category">{post.category}</span>
                                        <span className="blog-date">{post.date}</span>
                                    </div>
                                    <h2 className="blog-item-title">{title}</h2>
                                    <p className="blog-item-summary">{summary}</p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Blog;
