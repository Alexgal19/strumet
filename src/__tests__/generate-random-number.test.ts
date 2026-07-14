import { generateRandomNumber } from "../lib/utils";

describe('generateRandomNumber', () => {
  it('should generate a random number within the default range (0-100)', () => {
    const randomNumber = generateRandomNumber();
    expect(randomNumber).toBeGreaterThanOrEqual(0);
    expect(randomNumber).toBeLessThanOrEqual(100);
    expect(Number.isInteger(randomNumber)).toBe(true);
  });

  it('should generate a random number within a specified range', () => {
    const min = 10;
    const max = 20;
    const randomNumber = generateRandomNumber(min, max);
    expect(randomNumber).toBeGreaterThanOrEqual(min);
    expect(randomNumber).toBeLessThanOrEqual(max);
    expect(Number.isInteger(randomNumber)).toBe(true);
  });

  it('should generate a random number when min and max are negative', () => {
    const min = -20;
    const max = -10;
    const randomNumber = generateRandomNumber(min, max);
    expect(randomNumber).toBeGreaterThanOrEqual(min);
    expect(randomNumber).toBeLessThanOrEqual(max);
    expect(Number.isInteger(randomNumber)).toBe(true);
  });

  it('should generate the min value when min and max are the same', () => {
    const min = 50;
    const max = 50;
    const randomNumber = generateRandomNumber(min, max);
    expect(randomNumber).toBe(50);
  });

  it('should handle large ranges', () => {
    const min = 1000;
    const max = 10000;
    const randomNumber = generateRandomNumber(min, max);
    expect(randomNumber).toBeGreaterThanOrEqual(min);
    expect(randomNumber).toBeLessThanOrEqual(max);
    expect(Number.isInteger(randomNumber)).toBe(true);
  });
});
