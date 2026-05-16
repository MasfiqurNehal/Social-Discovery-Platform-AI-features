import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, Tag } from 'lucide-react';
import PaginationLinks from '@/components/shared/PaginationLinks';

async function getBlogPosts(searchParams?: Record<string, string | string[] | undefined>) {
  try {
    const query = new URLSearchParams(searchParams as Record<string, string>).toString();
    const res = await fetch(`http://localhost:8000/api/blog${query ? `?${query}` : ''}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { data: [], meta: { current_page: 1, last_page: 1 } };
  }
}

export const metadata = {
  title: 'Blog & Guides | VibeSpot',
  description: 'Curated city guides, neighbourhood spotlights, and editorial features about Dhaka.',
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const { data: posts, meta } = await getBlogPosts(resolvedParams);

  // Find the post marked as featured, fallback to the latest if none exists
  const featured = posts?.find((p: any) => p.is_featured) || posts?.[0];
  
  // All other posts excluding the featured one
  const rest = posts?.filter((p: any) => p.id !== featured?.id) || [];

  return (
    <div className="pb-24" style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-500 mb-4">
            <BookOpen className="h-4 w-4" />
            Editorial
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            City Guides & Stories
          </h1>
          <p className="text-lg max-w-xl" style={{ color: 'var(--text-muted)' }}>
            In-depth guides, neighbourhood spotlights, and insider tips curated by the VibeSpot team.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">

        {/* Featured Post */}
        {featured && (
          <section>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-6">Featured Story</div>
            <Link href={`/blog/${featured.slug}`}>
              <div
                className="group grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="relative h-72 lg:h-auto overflow-hidden">
                  <img
                    src={featured.featured_image_url?.startsWith('http') ? featured.featured_image_url : `http://localhost:8000${featured.featured_image_url}`}
                    alt={featured.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center gap-5">
                  <div className="flex flex-wrap gap-2">
                    {(featured.tags || []).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1 rounded-full font-medium text-brand-400"
                        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {featured.title}
                  </h2>
                  <p className="text-base leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <Calendar className="h-4 w-4" />
                      <span>{featured.published_at}</span>
                      <span>·</span>
                      <span>{featured.author_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-brand-500">
                      Read More <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* All Posts Grid */}
        {rest.length > 0 && (
          <section>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-6">More Guides</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article
                    className="group rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.featured_image_url?.startsWith('http') ? post.featured_image_url : `http://localhost:8000${post.featured_image_url}`}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(post.tags || []).slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-brand-400"
                            style={{ backgroundColor: 'var(--bg-elevated)' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-bold text-base leading-snug group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {post.title}
                      </h3>
                      <p className="text-sm line-clamp-2 flex-grow" style={{ color: 'var(--text-muted)' }}>
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs pt-2 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                        <Calendar className="h-3 w-3" />
                        <span>{post.published_at}</span>
                        <span>·</span>
                        <span>{post.author_name}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        <PaginationLinks
          basePath="/blog"
          currentPage={meta?.current_page || 1}
          lastPage={meta?.last_page || 1}
          searchParams={resolvedParams}
        />

        {(!posts || posts.length === 0) && (
          <div className="text-center py-32 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No blog posts found. Make sure the backend is running.</p>
          </div>
        )}

      </div>
    </div>
  );
}

