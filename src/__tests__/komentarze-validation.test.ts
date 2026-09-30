import { commentKey, validateKomentarz, MAX_COMMENT_LEN } from '@/lib/komentarze-validation';

const DEPTS = ['DZIAŁ_A', 'DZIAŁ_B'];
const JOBS = ['Spawacz MIG/MAG', 'Szlifierz'];

describe('komentarze-validation', () => {
  describe('commentKey', () => {
    it('buduje stabilny klucz', () => {
      expect(commentKey('DZIAŁ_A', 'Spawacz MIG/MAG')).toBe('DZIAŁ_A___Spawacz MIG_MAG');
    });

    it('usuwa znaki zabronione w RTDB', () => {
      expect(commentKey('DZIAŁ.A', 'A/B[C]D$E#F')).toBe('DZIAŁ_A___A_B_C_D_E_F');
    });
  });

  describe('validateKomentarz', () => {
    it('akceptuje poprawny komentarz', () => {
      expect(
        validateKomentarz({ department: 'DZIAŁ_A', jobTitle: 'Szlifierz', text: '  Czekamy na agencję  ' }, DEPTS, JOBS)
      ).toEqual({
        ok: true,
        value: { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', text: 'Czekamy na agencję' },
      });
    });

    it('pusty tekst = usunięcie (ok)', () => {
      expect(
        validateKomentarz({ department: 'DZIAŁ_A', jobTitle: 'Szlifierz', text: '   ' }, DEPTS, JOBS)
      ).toEqual({
        ok: true,
        value: { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', text: '' },
      });
    });

    it('odrzuca za długi tekst', () => {
      const res = validateKomentarz(
        { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', text: 'x'.repeat(MAX_COMMENT_LEN + 1) },
        DEPTS,
        JOBS
      );
      expect(res).toEqual({ ok: false, error: `Komentarz może mieć maks. ${MAX_COMMENT_LEN} znaków.` });
    });

    it('odrzuca dział/stanowisko spoza listy', () => {
      expect(
        validateKomentarz({ department: 'X', jobTitle: 'Szlifierz', text: 'ok' }, DEPTS, JOBS)
      ).toEqual({ ok: false, error: 'Wybierz dział z listy.' });
      expect(
        validateKomentarz({ department: 'DZIAŁ_A', jobTitle: 'X', text: 'ok' }, DEPTS, JOBS)
      ).toEqual({ ok: false, error: 'Wybierz stanowisko z listy.' });
    });
  });
});
