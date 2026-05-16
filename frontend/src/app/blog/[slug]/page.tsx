import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';

async function getPost(slug: string) {
  try {
    const res = await fetch(`http://localhost:8000/api/blog/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const response = await getPost(slug);

  if (!response || !response.data) notFound();

  const post = response.data;

  // Parse markdown-style body: ##, **, plain paragraphs
  const renderBody = (body: string) => {
    return body.split('\n\n').map((block, i) => {
      if (block.startsWith('## ')) {
        return <h2 key={i}>{block.slice(3)}</h2>;
      }
      // Handle **inline bold**
      const parts = block.split(/(\*\*[^*]+\*\*)/);
      return (
        <p key={i}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-brand-500 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
      </div>

      {/* Cover Image */}
      <div className="relative h-72 sm:h-96 mt-6 overflow-hidden">
        <img
          src={post.featured_image_url?.startsWith('http') ? post.featured_image_url : `http://localhost:8000${post.featured_image_url}`}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>

      {/* Article body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {(post.tags || []).map((tag: string) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full text-brand-400"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm pb-10 border-b mb-10" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          <Calendar className="h-4 w-4" />
          <span>{post.published_at}</span>
          <span>·</span>
          <span>By <strong style={{ color: 'var(--text-primary)' }}>{post.author_name}</strong></span>
        </div>

        {/* Article Content */}
        <div className="blog-prose max-w-none">
          {renderBody(post.body)}
        </div>

        {/* Back CTA */}
        <div className="mt-16 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> More City Guides
          </Link>
        </div>
      </div>

    </div>
  );
}
