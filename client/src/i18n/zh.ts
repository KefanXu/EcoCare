import { ZH_CASE } from './zh/case';
import { ZH_CHAT } from './zh/chat';
import { ZH_CORE } from './zh/core';
import { ZH_GUIDE } from './zh/guide';
import { ZH_MAP } from './zh/map';
import { ZH_ONBOARDING } from './zh/onboarding';
import { ZH_STUDY } from './zh/study';

/** Simplified Chinese, keyed by the exact English text used in the code. */
export const ZH: Record<string, string> = {
  ...ZH_CORE,
  ...ZH_GUIDE,
  ...ZH_MAP,
  ...ZH_CHAT,
  ...ZH_CASE,
  ...ZH_ONBOARDING,
  ...ZH_STUDY,
};
