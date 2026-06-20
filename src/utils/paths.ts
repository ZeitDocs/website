const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export function withBase(path: string) {
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('mailto:') ||
    path.startsWith('#')
  ) {
    return path;
  }

  if (path === '/') {
    return base;
  }

  if (path.startsWith('/')) {
    return `${base}${path.slice(1)}`;
  }

  return path;
}
