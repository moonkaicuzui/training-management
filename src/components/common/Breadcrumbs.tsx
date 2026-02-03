import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { getRouteLabel, isDynamicSegment } from '@/utils/routeLabels';

export function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on dashboard (root)
  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
    return null;
  }

  const crumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const labelKey = getRouteLabel(segment);
    const isLast = index === pathSegments.length - 1;
    const isDynamic = isDynamicSegment(segment);

    let label: string;
    if (labelKey) {
      label = t(labelKey);
    } else if (isDynamic) {
      label = segment === 'edit' ? t('common.edit') : `#${segment}`;
    } else {
      label = segment;
    }

    return { path, label, isLast, isDynamic };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">{t('nav.dashboard')}</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {crumb.isLast ? (
              <span className="font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
