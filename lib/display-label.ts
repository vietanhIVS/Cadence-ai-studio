/** Shorten card labels without changing the saved name or splitting a character. */
export function cardLabel(name: string, limit: number): string {
  const characters = Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(name), part => part.segment);
  return characters.length > limit ? characters.slice(0, limit - 1).join('') + '…' : name;
}
