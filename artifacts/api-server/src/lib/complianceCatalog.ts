export type TemplateRecurrence = "one_time" | "monthly" | "quarterly" | "annually";
export type TemplateCategory =
  | "employment"
  | "health_safety"
  | "data_privacy"
  | "licensing"
  | "tax"
  | "other";

export type ComplianceTemplate = {
  title: string;
  description: string;
  category: TemplateCategory;
  recurrence: TemplateRecurrence;
  industries?: string[];
  /**
   * Optional regulator-aware due-date function. When omitted, falls back to
   * a generic 30/60/90-day offset based on `recurrence`.
   */
  nextDue?: () => string;
};

type Jurisdiction = {
  country: string;
  state?: string;
  templates: ComplianceTemplate[];
};

export type SupportedCountry = {
  code: string;
  name: string;
  states: { code: string; name: string }[];
};

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    code: "US",
    name: "United States",
    states: [
      { code: "CA", name: "California" },
      { code: "NY", name: "New York" },
      { code: "TX", name: "Texas" },
      { code: "FL", name: "Florida" },
      { code: "IL", name: "Illinois" },
      { code: "WA", name: "Washington" },
      { code: "OTHER", name: "Other state" },
    ],
  },
  {
    code: "IN",
    name: "India",
    states: [
      { code: "MH", name: "Maharashtra" },
      { code: "KA", name: "Karnataka" },
      { code: "DL", name: "Delhi" },
      { code: "TN", name: "Tamil Nadu" },
      { code: "GJ", name: "Gujarat" },
      { code: "WB", name: "West Bengal" },
      { code: "UP", name: "Uttar Pradesh" },
      { code: "OTHER", name: "Other state" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    states: [
      { code: "ENG", name: "England" },
      { code: "SCT", name: "Scotland" },
      { code: "WLS", name: "Wales" },
      { code: "NIR", name: "Northern Ireland" },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    states: [
      { code: "BY", name: "Bayern" },
      { code: "BE", name: "Berlin" },
      { code: "NW", name: "Nordrhein-Westfalen" },
      { code: "OTHER", name: "Other Bundesland" },
    ],
  },
  {
    code: "FR",
    name: "France",
    states: [
      { code: "IDF", name: "Île-de-France" },
      { code: "ARA", name: "Auvergne-Rhône-Alpes" },
      { code: "OTHER", name: "Other région" },
    ],
  },
  {
    code: "JP",
    name: "Japan",
    states: [
      { code: "13", name: "Tokyo" },
      { code: "27", name: "Osaka" },
      { code: "OTHER", name: "Other prefecture" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    states: [
      { code: "NSW", name: "New South Wales" },
      { code: "VIC", name: "Victoria" },
      { code: "QLD", name: "Queensland" },
      { code: "WA", name: "Western Australia" },
      { code: "OTHER", name: "Other state/territory" },
    ],
  },
  { code: "OTHER", name: "Other country", states: [] },
];

export const SUPPORTED_INDUSTRIES: { code: string; name: string }[] = [
  { code: "retail", name: "Retail" },
  { code: "restaurant", name: "Restaurant / F&B" },
  { code: "salon", name: "Salon / Spa" },
  { code: "services", name: "Professional Services" },
  { code: "other", name: "Other" },
];

// ─── Date helpers (regulator-aware) ────────────────────────────
function toYmd(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Last calendar day of the given (year, 0-indexed month). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Build a Date clamped so that `day > daysInMonth` collapses to the last day. */
function clampedDate(year: number, monthZero: number, day: number): Date {
  const last = lastDayOfMonth(year, monthZero);
  return new Date(year, monthZero, Math.min(day, last));
}

/** Next occurrence of an annual deadline at month/day (1-indexed month). */
function nextAnnual(month: number, day: number): string {
  const today = new Date();
  const monthZero = month - 1;
  let candidate = clampedDate(today.getFullYear(), monthZero, day);
  if (candidate <= today) {
    candidate = clampedDate(today.getFullYear() + 1, monthZero, day);
  }
  return toYmd(candidate);
}

/** Next occurrence of a monthly deadline on the given day of the month (clamped). */
function nextMonthDay(day: number): string {
  const today = new Date();
  let year = today.getFullYear();
  let monthZero = today.getMonth();
  let candidate = clampedDate(year, monthZero, day);
  if (candidate <= today) {
    monthZero += 1;
    if (monthZero > 11) {
      monthZero = 0;
      year += 1;
    }
    candidate = clampedDate(year, monthZero, day);
  }
  return toYmd(candidate);
}

/** Next quarter end (Mar/Jun/Sep/Dec) plus N calendar days (e.g. BAS = +28). */
function nextQuarterEndPlus(daysAfter: number): string {
  const today = new Date();
  const year = today.getFullYear();
  const quarterEnds = [
    new Date(year, 2, 31), // Mar 31
    new Date(year, 5, 30), // Jun 30
    new Date(year, 8, 30), // Sep 30
    new Date(year, 11, 31), // Dec 31
    new Date(year + 1, 2, 31), // Mar 31 next year
  ];
  for (const qe of quarterEnds) {
    const due = new Date(qe);
    due.setDate(due.getDate() + daysAfter);
    if (due > today) return toYmd(due);
  }
  // Unreachable, but keep deterministic
  const fallback = new Date(year + 1, 5, 30);
  fallback.setDate(fallback.getDate() + daysAfter);
  return toYmd(fallback);
}

const GLOBAL: ComplianceTemplate[] = [
  {
    title: "Workplace safety risk review",
    description: "Walk through your premises and document hazards, near-misses and corrective actions.",
    category: "health_safety",
    recurrence: "annually",
  },
  {
    title: "First aid kit restocking",
    description: "Check and restock all first aid kits in the workplace.",
    category: "health_safety",
    recurrence: "quarterly",
  },
  {
    title: "Fire extinguisher / fire safety inspection",
    description: "Ensure all fire extinguishers and alarms are inspected, tagged and within service date.",
    category: "health_safety",
    recurrence: "annually",
  },
  {
    title: "Customer & employee data inventory",
    description: "Audit what personal data is collected, where it is stored and who has access.",
    category: "data_privacy",
    recurrence: "annually",
  },
];

const JURISDICTIONS: Jurisdiction[] = [
  // ─── United States ────────────────────────────────────────
  {
    country: "US",
    templates: [
      {
        title: "I-9 Employment Eligibility Verification audit",
        description: "Confirm an I-9 is on file for every employee and re-verify expiring work authorisations.",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "Workers' Compensation Insurance renewal",
        description: "Verify workers' comp policy is current and covers all employees.",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "OSHA Form 300A posting (Feb 1 – Apr 30)",
        description: "Post the prior year's injury & illness summary in a visible workplace location.",
        category: "health_safety",
        recurrence: "annually",
        nextDue: () => nextAnnual(2, 1), // Feb 1
      },
      {
        title: "Federal & state payroll tax filings (Form 941)",
        description: "Submit quarterly Form 941 and state withholding/UI filings.",
        category: "tax",
        recurrence: "quarterly",
        nextDue: () => nextQuarterEndPlus(30), // last day of month following quarter
      },
      {
        title: "Business license renewal",
        description: "Renew the local business operating license before expiration.",
        category: "licensing",
        recurrence: "annually",
      },
      {
        title: "Food handler & food manager certifications",
        description: "Ensure applicable staff hold valid food handler / food manager certifications.",
        category: "licensing",
        recurrence: "annually",
        industries: ["restaurant"],
      },
      {
        title: "Cosmetology license display & renewal",
        description: "Display current cosmetology / barbering licenses and track renewals.",
        category: "licensing",
        recurrence: "annually",
        industries: ["salon"],
      },
      {
        title: "PCI-DSS self-assessment (SAQ)",
        description: "Complete the PCI-DSS self-assessment questionnaire for card payments.",
        category: "data_privacy",
        recurrence: "annually",
        industries: ["retail", "restaurant", "salon"],
      },
    ],
  },
  {
    country: "US",
    state: "CA",
    templates: [
      {
        title: "CalSavers retirement programme registration",
        description: "Confirm CalSavers enrolment or exemption is on file.",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "California Sexual Harassment Prevention Training",
        description: "Provide SB 1343 sexual harassment prevention training to all employees.",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "Prop 65 warning audit",
        description: "Verify required Proposition 65 warnings are posted where applicable.",
        category: "health_safety",
        recurrence: "annually",
      },
    ],
  },
  {
    country: "US",
    state: "NY",
    templates: [
      {
        title: "NY Sexual Harassment Prevention Training",
        description: "Annual sexual harassment training compliant with NY State Labor Law §201-g.",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "NY Paid Sick Leave compliance review",
        description: "Verify accrual, carryover and posting requirements are met.",
        category: "employment",
        recurrence: "annually",
      },
    ],
  },

  // ─── India ────────────────────────────────────────────────
  {
    country: "IN",
    templates: [
      {
        title: "Shops & Establishments Act registration renewal",
        description: "Renew your S&E registration with the local labour department.",
        category: "licensing",
        recurrence: "annually",
      },
      {
        title: "GSTR-3B monthly filing",
        description: "File monthly GSTR-3B by the 20th of the following month.",
        category: "tax",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(20),
      },
      {
        title: "GSTR-1 monthly filing",
        description: "File monthly outward supplies return GSTR-1 by the 11th of the following month.",
        category: "tax",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(11),
      },
      {
        title: "TDS return filing (Form 24Q / 26Q)",
        description: "File quarterly TDS returns by Jul 31, Oct 31, Jan 31, May 31.",
        category: "tax",
        recurrence: "quarterly",
        nextDue: () => {
          const today = new Date();
          const candidates = [
            new Date(today.getFullYear(), 4, 31), // May 31
            new Date(today.getFullYear(), 6, 31), // Jul 31
            new Date(today.getFullYear(), 9, 31), // Oct 31
            new Date(today.getFullYear() + 1, 0, 31), // Jan 31 next year
          ];
          for (const c of candidates) if (c > today) return toYmd(c);
          return toYmd(new Date(today.getFullYear() + 1, 4, 31));
        },
      },
      {
        title: "EPF & ESI monthly contributions",
        description: "Deposit Provident Fund and ESI contributions and file ECR by the 15th.",
        category: "employment",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(15),
      },
      {
        title: "Professional Tax filing",
        description: "Deduct and remit Professional Tax per state schedule.",
        category: "tax",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(10),
      },
      {
        title: "Fire NOC renewal",
        description: "Renew the fire department No Objection Certificate for your premises.",
        category: "health_safety",
        recurrence: "annually",
      },
      {
        title: "FSSAI licence renewal",
        description: "Renew the Food Safety and Standards Authority of India licence.",
        category: "licensing",
        recurrence: "annually",
        industries: ["restaurant"],
      },
      {
        title: "Trade licence renewal",
        description: "Renew the municipal corporation trade licence.",
        category: "licensing",
        recurrence: "annually",
        industries: ["retail", "salon", "restaurant"],
      },
    ],
  },
  {
    country: "IN",
    state: "MH",
    templates: [
      {
        title: "Maharashtra Labour Welfare Fund contribution",
        description: "Remit semi-annual employer + employee LWF contributions.",
        category: "employment",
        recurrence: "annually",
        nextDue: () => nextAnnual(6, 30),
      },
    ],
  },
  {
    country: "IN",
    state: "KA",
    templates: [
      {
        title: "Karnataka Labour Welfare Fund contribution",
        description: "Annual KLWF contribution by Jan 15.",
        category: "employment",
        recurrence: "annually",
        nextDue: () => nextAnnual(1, 15),
      },
    ],
  },

  // ─── United Kingdom ───────────────────────────────────────
  {
    country: "GB",
    templates: [
      {
        title: "VAT return filing",
        description: "Submit Making Tax Digital VAT return — typically 1 month + 7 days after quarter end.",
        category: "tax",
        recurrence: "quarterly",
        nextDue: () => nextQuarterEndPlus(37),
      },
      {
        title: "PAYE / RTI submission",
        description: "Submit Real Time Information PAYE filings on or before each payday.",
        category: "tax",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(19),
      },
      {
        title: "Pensions auto-enrolment review",
        description: "Confirm eligible jobholders are enrolled and contributions are correct.",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "Health & Safety risk assessment",
        description: "Document the workplace risk assessment as required by HSE.",
        category: "health_safety",
        recurrence: "annually",
      },
      {
        title: "Fire risk assessment",
        description: "Update the Regulatory Reform (Fire Safety) Order 2005 fire risk assessment.",
        category: "health_safety",
        recurrence: "annually",
      },
      {
        title: "UK GDPR data audit",
        description: "Review processing activities, lawful basis and ICO registration.",
        category: "data_privacy",
        recurrence: "annually",
      },
    ],
  },

  // ─── Germany ──────────────────────────────────────────────
  {
    country: "DE",
    templates: [
      {
        title: "DSGVO / GDPR Datenaudit",
        description: "Verzeichnis von Verarbeitungstätigkeiten aktualisieren.",
        category: "data_privacy",
        recurrence: "annually",
      },
      {
        title: "Berufsgenossenschaft Mitgliedschaft & Beitrag",
        description: "Jährlichen Beitrag und Lohnnachweis an die zuständige BG melden.",
        category: "employment",
        recurrence: "annually",
        nextDue: () => nextAnnual(2, 11), // Lohnnachweis: 11 Feb
      },
      {
        title: "Umsatzsteuer-Voranmeldung",
        description: "Monatliche Umsatzsteuer-Voranmeldung über ELSTER einreichen — bis zum 10. des Folgemonats.",
        category: "tax",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(10),
      },
      {
        title: "Arbeitsschutz-Gefährdungsbeurteilung",
        description: "Gefährdungsbeurteilung am Arbeitsplatz dokumentieren.",
        category: "health_safety",
        recurrence: "annually",
      },
    ],
  },

  // ─── France ───────────────────────────────────────────────
  {
    country: "FR",
    templates: [
      {
        title: "Document Unique d'Évaluation des Risques (DUERP)",
        description: "Mettre à jour le DUERP au moins une fois par an.",
        category: "health_safety",
        recurrence: "annually",
      },
      {
        title: "Déclaration URSSAF (DSN)",
        description: "Transmettre la Déclaration Sociale Nominative chaque mois — avant le 15.",
        category: "employment",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(15),
      },
      {
        title: "Déclaration de TVA",
        description: "Déposer la déclaration de TVA selon le régime applicable.",
        category: "tax",
        recurrence: "monthly",
        nextDue: () => nextMonthDay(24),
      },
      {
        title: "Affichages obligatoires",
        description: "Vérifier les affichages obligatoires (convention collective, horaires, etc.).",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "Audit RGPD",
        description: "Revue du registre des traitements et des mentions d'information.",
        category: "data_privacy",
        recurrence: "annually",
      },
    ],
  },

  // ─── Japan ────────────────────────────────────────────────
  {
    country: "JP",
    templates: [
      {
        title: "労働保険 年度更新 (Labour insurance annual renewal)",
        description: "毎年6月〜7月に労働保険の年度更新手続きを行う。",
        category: "employment",
        recurrence: "annually",
        nextDue: () => nextAnnual(7, 10),
      },
      {
        title: "社会保険 算定基礎届 (Standard monthly remuneration report)",
        description: "毎年7月10日までに算定基礎届を提出する。",
        category: "employment",
        recurrence: "annually",
        nextDue: () => nextAnnual(7, 10),
      },
      {
        title: "消費税申告 (Consumption tax filing)",
        description: "課税事業者は決算期末から2か月以内に消費税申告を行う。",
        category: "tax",
        recurrence: "annually",
      },
      {
        title: "従業員 健康診断 (Employee health checkups)",
        description: "労働安全衛生法に基づく定期健康診断を年1回実施する。",
        category: "health_safety",
        recurrence: "annually",
      },
      {
        title: "個人情報保護法 監査 (APPI audit)",
        description: "個人情報の取扱状況を年1回見直す。",
        category: "data_privacy",
        recurrence: "annually",
      },
    ],
  },

  // ─── Australia ────────────────────────────────────────────
  {
    country: "AU",
    templates: [
      {
        title: "BAS — Business Activity Statement",
        description: "Lodge the BAS with the ATO — quarter end + 28 days.",
        category: "tax",
        recurrence: "quarterly",
        nextDue: () => nextQuarterEndPlus(28),
      },
      {
        title: "Superannuation Guarantee payments",
        description: "Pay quarterly super contributions for eligible employees by quarter end + 28 days.",
        category: "employment",
        recurrence: "quarterly",
        nextDue: () => nextQuarterEndPlus(28),
      },
      {
        title: "WHS hazard & risk audit",
        description: "Review workplace hazards under the model WHS Act.",
        category: "health_safety",
        recurrence: "annually",
      },
      {
        title: "Fair Work compliance review",
        description: "Audit awards, pay rates, and record-keeping under the Fair Work Act.",
        category: "employment",
        recurrence: "annually",
      },
      {
        title: "Privacy Act / APP audit",
        description: "Review handling of personal information against the Australian Privacy Principles.",
        category: "data_privacy",
        recurrence: "annually",
      },
    ],
  },
  {
    country: "AU",
    state: "NSW",
    templates: [
      {
        title: "SafeWork NSW notifiable incidents log",
        description: "Confirm process for reporting notifiable incidents to SafeWork NSW.",
        category: "health_safety",
        recurrence: "annually",
      },
    ],
  },
  {
    country: "AU",
    state: "VIC",
    templates: [
      {
        title: "WorkSafe Victoria compliance check",
        description: "Review OHS obligations under Victoria's Occupational Health and Safety Act.",
        category: "health_safety",
        recurrence: "annually",
      },
    ],
  },
];

function defaultDueDate(recurrence: TemplateRecurrence): string | null {
  if (recurrence === "one_time") return null;
  const d = new Date();
  switch (recurrence) {
    case "monthly":
      d.setDate(d.getDate() + 30);
      break;
    case "quarterly":
      d.setDate(d.getDate() + 60);
      break;
    case "annually":
      d.setDate(d.getDate() + 90);
      break;
  }
  return toYmd(d);
}

export type ResolvedComplianceItem = {
  title: string;
  description: string;
  category: string;
  recurrence: string;
  dueDate: string | null;
};

/**
 * Resolve the compliance template list for a given workspace profile.
 * - Always includes the GLOBAL set.
 * - Adds country-level templates (state undefined).
 * - Adds state-level templates when state matches.
 * - Filters each template by industry when an `industries` filter is set.
 */
export function resolveComplianceTemplates(profile: {
  country?: string | null;
  state?: string | null;
  industry?: string | null;
}): ResolvedComplianceItem[] {
  const country = profile.country && profile.country.length > 0 ? profile.country : null;
  const state = profile.state && profile.state.length > 0 ? profile.state : null;
  const industry = profile.industry && profile.industry.length > 0 ? profile.industry : null;

  const collected: ComplianceTemplate[] = [...GLOBAL];

  if (country) {
    for (const j of JURISDICTIONS) {
      if (j.country !== country) continue;
      if (j.state && j.state !== state) continue;
      collected.push(...j.templates);
    }
  }

  const seen = new Set<string>();
  const filtered = collected.filter((t) => {
    if (t.industries && (!industry || !t.industries.includes(industry))) return false;
    if (seen.has(t.title)) return false;
    seen.add(t.title);
    return true;
  });

  return filtered.map((t) => ({
    title: t.title,
    description: t.description,
    category: t.category,
    recurrence: t.recurrence,
    dueDate: t.nextDue ? t.nextDue() : defaultDueDate(t.recurrence),
  }));
}
