import common from './common';
import nav from './nav';
import auth from './auth';
import employee from './employee';
import dashboard from './dashboard';
import lockers from './lockers';
import cars from './cars';
import toasts from './toasts';

/** Każdy moduł daje prefiks klucza: t('nav.pulpit'), t('common.save'). */
export const MESSAGE_MODULES = {
  toasts,
  cars,
  lockers,
  dashboard,
  employee,
  auth,
  common,
  nav,
};

type Modules = typeof MESSAGE_MODULES;

export type TranslationKey = {
  [M in keyof Modules]: `${M & string}.${keyof Modules[M]['pl'] & string}`;
}[keyof Modules];
