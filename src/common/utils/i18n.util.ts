import { I18nContext, I18nService } from 'nestjs-i18n';

export function translate(i18n: I18nService, key: string): string {
  return i18n.t(key, { lang: I18nContext.current()?.lang });
}
