import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface Tag {
  path: string;
  title: string;
}

const navLookup: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/users': 'User Search',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/deposits': 'Deposits',
  '/dashboard/withdrawals': 'Withdrawals',
  '/dashboard/gift-codes': 'Gift Codes',
  '/dashboard/agency': 'Agency',
  '/dashboard/vip-config': 'VIP Config',
  '/dashboard/turnover-config': 'Turnover Config',
  '/dashboard/logs': 'Admin Logs',
  '/dashboard/create-bet': 'Create Bet',
  '/dashboard/game-bets': 'Game Bets',
  '/dashboard/move-game': 'Move Game Bal',
  '/dashboard/wingo': 'Wingo',
};

const getTitle = (path: string) => navLookup[path] || path.split('/').pop() || path;

const TagsView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem('tagsView');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch {}
    }
    return [{ path: '/dashboard', title: 'Dashboard' }];
  });

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('tagsView', JSON.stringify(tags));
  }, [tags]);

  const addTag = useCallback((path: string) => {
    if (path === '/') return;
    setTags((prev) => {
      if (prev.some((t) => t.path === path)) return prev;
      return [...prev, { path, title: getTitle(path) }];
    });
  }, []);

  useEffect(() => {
    addTag(location.pathname);
  }, [location.pathname, addTag]);

  useEffect(() => {
    const handler = () => setCtxMenu(null);
    window.addEventListener('click', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, []);

  const removeTag = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setTags((prev) => {
      const next = prev.filter((t) => t.path !== path);
      if (next.length === 0) return [{ path: '/dashboard', title: 'Dashboard' }];
      if (path === location.pathname) {
        const idx = prev.findIndex((t) => t.path === path);
        const target = next[Math.min(idx, next.length - 1)];
        navigate(target.path);
      }
      return next;
    });
    setCtxMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, path });
  };

  const closeTag = (path: string) => {
    setTags((prev) => {
      const next = prev.filter((t) => t.path !== path);
      if (next.length === 0) return [{ path: '/dashboard', title: 'Dashboard' }];
      if (path === location.pathname) {
        const idx = prev.findIndex((t) => t.path === path);
        navigate(next[Math.min(idx, next.length - 1)].path);
      }
      return next;
    });
    setCtxMenu(null);
  };

  const closeOthers = (path: string) => {
    setTags((prev) => {
      const target = prev.find((t) => t.path === path);
      if (!target) return prev;
      if (!prev.some((t) => t.path === location.pathname && t.path !== path)) {
        navigate(target.path);
      }
      return [target];
    });
    setCtxMenu(null);
  };

  const closeAll = () => {
    navigate('/dashboard');
    setTags([{ path: '/dashboard', title: 'Dashboard' }]);
    setCtxMenu(null);
  };

  const refresh = () => {
    const { pathname } = location;
    navigate('/dashboard', { replace: true });
    setTimeout(() => navigate(pathname, { replace: true }), 0);
    setCtxMenu(null);
  };

  const scrollToTag = useCallback((path: string) => {
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-path="${path}"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, []);

  useEffect(() => {
    scrollToTag(location.pathname);
  }, [location.pathname, scrollToTag]);

  return (
    <div className="tags-view-container" ref={containerRef}>
      <style>{`
        .tags-view-container {
          height: 34px;
          width: 100%;
          background: hsl(var(--card));
          border-bottom: 1px solid hsl(var(--border));
          box-shadow: 0 1px 3px 0 rgba(0,0,0,.12), 0 0 3px 0 rgba(0,0,0,.04);
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          display: flex;
          align-items: flex-start;
          padding-left: 4px;
        }
        .tags-view-container::-webkit-scrollbar { height: 0; }
        .tags-view-item {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          height: 26px;
          line-height: 26px;
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          background: hsl(var(--card));
          padding: 0 8px;
          font-size: 12px;
          margin-left: 5px;
          margin-top: 4px;
          flex-shrink: 0;
          user-select: none;
          transition: all 0.15s;
        }
        .tags-view-item:hover { color: #42b983; }
        .tags-view-item.active {
          background-color: #42b983;
          color: #fff;
          border-color: #42b983;
        }
        .tags-view-item.active .tag-close:hover { background: #fff; color: #42b983; }
        .tag-close {
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-left: 4px;
          transition: all 0.15s;
        }
        .tag-close:hover { background: hsl(var(--muted-foreground) / 0.3); color: hsl(var(--foreground)); }
        .contextmenu {
          position: fixed;
          z-index: 9999;
          list-style: none;
          padding: 5px 0;
          margin: 0;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 400;
          color: hsl(var(--foreground));
          box-shadow: 2px 2px 3px 0 rgba(0,0,0,.3);
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          min-width: 120px;
        }
        .contextmenu li {
          padding: 6px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .contextmenu li:hover { background: hsl(var(--secondary)); color: #42b983; }
        .contextmenu li.disabled { color: hsl(var(--muted-foreground)); cursor: not-allowed; }
        .contextmenu li.disabled:hover { background: transparent; color: hsl(var(--muted-foreground)); }
      `}</style>

      {tags.map((tag) => (
        <span
          key={tag.path}
          data-path={tag.path}
          className={`tags-view-item${tag.path === location.pathname ? ' active' : ''}`}
          onClick={() => navigate(tag.path)}
          onContextMenu={(e) => handleContextMenu(e, tag.path)}
        >
          {tag.title}
          {tag.path !== '/dashboard' && (
            <span className="tag-close" onClick={(e) => removeTag(e, tag.path)}>
              <X className="w-3 h-3" />
            </span>
          )}
        </span>
      ))}

      {ctxMenu && (
        <ul className="contextmenu" style={{ left: ctxMenu.x, top: ctxMenu.y }}>
          <li onClick={refresh}>Refresh</li>
          <li
            className={ctxMenu.path === '/dashboard' ? 'disabled' : ''}
            onClick={ctxMenu.path === '/dashboard' ? undefined : () => closeTag(ctxMenu.path)}
          >
            Close
          </li>
          <li onClick={() => closeOthers(ctxMenu.path)}>Close Others</li>
          <li onClick={closeAll}>Close All</li>
        </ul>
      )}
    </div>
  );
};

export default TagsView;