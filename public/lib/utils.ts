export function createPageUrl(pageName: string): string {
  return '/' + pageName.replace(/ /g, '-');
}
