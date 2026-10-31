import type { ComponentProps } from 'react';
import type { IconType } from 'react-icons';

import {
  HiAcademicCap,
  HiArrowRight,
  HiArrowRightOnRectangle,
  HiArrowUpTray,
  HiBars3,
  HiBolt,
  HiBookOpen,
  HiCalendar,
  HiCamera,
  HiChartBar,
  HiChatBubbleLeft,
  HiCheckCircle,
  HiChevronLeft,
  HiChevronRight,
  HiClipboardDocumentList,
  HiClock,
  HiCpuChip,
  HiEnvelope,
  HiExclamationTriangle,
  HiEye,
  HiEyeSlash,
  HiFlag,
  HiGlobeAlt,
  HiLockClosed,
  HiLockOpen,
  HiMapPin,
  HiPaperAirplane,
  HiPlay,
  HiShieldCheck,
  HiSparkles,
  HiStar,
  HiTag,
  HiTrash,
  HiUser,
  HiUsers,
  HiVideoCamera,
  HiXMark,
} from 'react-icons/hi2';

import { LuCrown, LuGem } from 'react-icons/lu';

import {
  SiDocker,
  SiExpress,
  SiFigma,
  SiFirebase,
  SiGit,
  SiHtml5,
  SiJavascript,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPrisma,
  SiPython,
  SiReact,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVite,
} from 'react-icons/si';

import {
  BsDiscord,
  BsEnvelopeArrowUpFill,
  BsFacebook,
  BsGithub,
  BsInstagram,
  BsLinkedin,
  BsTwitterX,
  BsWhatsapp,
  BsYoutube,
} from 'react-icons/bs';

export const IconMap = {
  ui: {
    arrowRight: HiArrowRight,
    menu: HiBars3,
    close: HiXMark,
    play: HiPlay,
    zap: HiBolt,
    graduationCap: HiAcademicCap,
    brain: HiCpuChip,
    target: HiFlag,
    checkCircle: HiCheckCircle,
    shield: HiShieldCheck,
    star: HiStar,
    message: HiChatBubbleLeft,
    video: HiVideoCamera,
    calendar: HiCalendar,
    clock: HiClock,
    bot: HiCpuChip,
    sparkles: HiSparkles,
    users: HiUsers,
    eye: HiEye,
    eyeOff: HiEyeSlash,
    lock: HiLockClosed,
    mail: HiEnvelope,
    user: HiUser,
    chevronLeft: HiChevronLeft,
    chevronRight: HiChevronRight,
    crown: LuCrown,
    gem: LuGem,
    globe: HiGlobeAlt,
    arrowRightOnRectangle: HiArrowRightOnRectangle,
    send: HiPaperAirplane,
    tag: HiTag,
    alert: HiExclamationTriangle,
    mapPin: HiMapPin,
    camera: HiCamera,
    trash: HiTrash,
    upload: HiArrowUpTray,
    lockOpen: HiLockOpen,
  },
  tech: {
    react: SiReact,
    nextjs: SiNextdotjs,
    typescript: SiTypescript,
    tailwind: SiTailwindcss,
    javascript: SiJavascript,
    nodejs: SiNodedotjs,
    git: SiGit,
    postgresql: SiPostgresql,
    html5: SiHtml5,
    python: SiPython,
    docker: SiDocker,
    mongodb: SiMongodb,
    mysql: SiMysql,
    prisma: SiPrisma,
    supabase: SiSupabase,
    firebase: SiFirebase,
    vercel: SiVercel,
    figma: SiFigma,
    express: SiExpress,
    vite: SiVite,
  },
  social: {
    email: BsEnvelopeArrowUpFill,
    github: BsGithub,
    linkedin: BsLinkedin,
    whatsapp: BsWhatsapp,
    instagram: BsInstagram,
    facebook: BsFacebook,
    youtube: BsYoutube,
    x: BsTwitterX,
    discord: BsDiscord,
  },
  dashboard: {
    bookOpen: HiBookOpen,
    video: HiVideoCamera,
    calendar: HiCalendar,
    message: HiChatBubbleLeft,
    clipboard: HiClipboardDocumentList,
    timer: HiClock,
    users: HiUsers,
    graduationCap: HiAcademicCap,
    userCog: HiUser,
    barChart: HiChartBar,
  },
} as const;

export type IconCategory = keyof typeof IconMap;

/** Tipados específicos por categoría para evitar errores de índice cruzado */
export type UiIconName = keyof (typeof IconMap)['ui'];
export type TechIconName = keyof (typeof IconMap)['tech'];
export type SocialIconName = keyof (typeof IconMap)['social'];
export type DashboardIconName = keyof (typeof IconMap)['dashboard'];

/** Unión global de nombres para compatibilidad general si es requerida */
export type IconName =
  UiIconName | TechIconName | SocialIconName | DashboardIconName;

/* ====================================================
   Helper para renderizar íconos dinámicamente
   ==================================================== */

type AppIconProps = {
  [C in IconCategory]: { category: C; name: keyof (typeof IconMap)[C] };
}[IconCategory] &
  Omit<ComponentProps<'svg'>, 'name'>;

export function AppIcon({ category, name, ...props }: AppIconProps) {
  const icons = IconMap[category] as Record<string, IconType>;
  const Icon = icons[name];
  if (!Icon) return null;

  // Decorativo por defecto; se puede sobrescribir pasando aria-hidden o aria-label
  return <Icon aria-hidden="true" {...props} />;
}
