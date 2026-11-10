import common from './common';
import nav from './nav';
import auth from './auth';
import employee from './employee';
import dashboard from './dashboard';
import lockers from './lockers';
import cars from './cars';
import toasts from './toasts';
import schedule from './schedule';
import stats from './stats';
import recruit from './recruit';
import calendar from './calendar';
import notes from './notes';
import attendance from './attendance';
import ops from './ops';
import settings from './settings';
import email from './email';
import importx from './importx';
import dialogs from './dialogs';

/** Każdy moduł daje prefiks klucza: t('nav.pulpit'), t('common.save'). */
export const MESSAGE_MODULES = {
  dialogs,
  importx,
  email,
  settings,
  ops,
  attendance,
  notes,
  calendar,
  recruit,
  stats,
  schedule,
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
