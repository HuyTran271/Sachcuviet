import { books } from '../data/books';

export const SAVED_KEY = 'sachcuviet_saved_books';

export function readSavedBooks() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY));
    return Array.isArray(value) ? value.filter((id) => books.some((book) => book.id === id)) : [];
  } catch { return []; }
}
