import { describe, expect, it } from 'vitest';
import { appHelpAnswer, isAppHelpQuestion } from './assistant-help';
describe('app help', () => {
  it('uses the current active employees screen for adding a person', () => {
    expect(appHelpAnswer('Jak dodać pracownika?')).toContain('Aktywni');
    expect(appHelpAnswer('Jak dodać pracownika?')).toContain('Dodaj pracownika');
  });
  it('does not invent unsupported instructions', () => {
    expect(appHelpAnswer('Jak skonfigurować integrację z bankiem?')).toContain('Nie mam potwierdzonej instrukcji');
  });
  it('keeps questions about application data on the data path', () => {
    expect(isAppHelpQuestion('Jakie auta są w aplikacji?')).toBe(false);
    expect(isAppHelpQuestion('Jak wyglądała frekwencja w piątek?')).toBe(false);
    expect(isAppHelpQuestion('Gdzie pracuje Anna Kowalska?')).toBe(false);
    expect(isAppHelpQuestion('Gdzie jest harmonogram?')).toBe(true);
  });
});
