import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue, useDebouncedCallback } from '@/hooks/use-debounced-value';
import { vi } from 'vitest';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should update the value only after the delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: 'first', delay: 500 },
    });

    expect(result.current).toBe('first');

    rerender({ value: 'second', delay: 500 });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });

  it('should reset the timer if the value changes within the delay period', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: 'a', delay: 500 },
    });

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('a');

    rerender({ value: 'c', delay: 500 });
    // After this rerender, the timer is reset. We need to advance time again.
    expect(result.current).toBe('a'); 
    
    act(() => {
      vi.advanceTimersByTime(499);
    });
    // Still 'a' because the full new 500ms delay for 'c' hasn't passed.
    expect(result.current).toBe('a'); 

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // Now the 500ms for 'c' has passed.
    expect(result.current).toBe('c');
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call the callback immediately', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('test');
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should call the callback after the delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('test');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should only call the callback with the latest arguments if called multiple times', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('first');
      vi.advanceTimersByTime(200);
      result.current('second');
      vi.advanceTimersByTime(200);
      result.current('third');
    });

    expect(callback).not.toHaveBeenCalled();

    // Advance time to trigger the debounce with the last call's arguments
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });
});
