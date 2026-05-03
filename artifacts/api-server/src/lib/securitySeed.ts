// ─── Built-in catalog for the Security Autopilot module ─────────
// Seeded per workspace on first access. All content is original /
// generic — no third-party copyrighted material.

export interface SeedLesson {
  catalogKey: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  content: {
    steps: Array<{ title: string; body: string }>;
    quiz: Array<{ q: string; choices: string[]; answerIdx: number }>;
  };
}

export const SEED_LESSONS: SeedLesson[] = [
  {
    catalogKey: "phishing-101",
    title: "Spotting Phishing Emails",
    description: "The 5 red flags that give away most phishing attempts.",
    category: "awareness",
    durationMinutes: 5,
    content: {
      steps: [
        {
          title: "What is phishing?",
          body: "Phishing is when an attacker pretends to be someone you trust — your boss, your bank, a vendor — to trick you into clicking a link, opening an attachment, or sharing a password. It's the #1 way small businesses get breached.",
        },
        {
          title: "Red flag #1: Urgency",
          body: "Real urgent requests almost never come by email. 'Your account will be suspended in 1 hour' or 'I need this paid TODAY' is designed to make you act before you think. Slow down.",
        },
        {
          title: "Red flag #2: Mismatched sender",
          body: "Hover over the sender name to see the actual email address. 'Bank of America <support@b0fa-secure.ru>' is not your bank. Look for misspellings, weird domains, or extra subdomains.",
        },
        {
          title: "Red flag #3: Unexpected attachments or links",
          body: "If you weren't expecting an invoice, don't open the PDF. If your CEO 'needs gift cards', call them on the phone first. If a link goes to a login page, type the real URL into your browser instead.",
        },
        {
          title: "Red flag #4: Generic greetings",
          body: "Real companies usually use your name. 'Dear Customer' or 'Dear User' from a service that knows your name is suspicious.",
        },
        {
          title: "Red flag #5: Spelling and weird formatting",
          body: "Big companies have copywriters. Sloppy grammar, off-brand logos, or weird HTML formatting is a tell. Trust your gut.",
        },
        {
          title: "What to do",
          body: "Don't click. Don't reply. Forward to your manager or report it through your company's process, then delete. When in doubt, ask.",
        },
      ],
      quiz: [
        {
          q: "Your CEO emails asking you to urgently buy $500 in gift cards and send the codes. What's the safest first step?",
          choices: [
            "Buy the gift cards quickly — it's the CEO",
            "Call or message the CEO directly to verify",
            "Reply to the email asking which store",
          ],
          answerIdx: 1,
        },
        {
          q: "How do you check if 'support@apple.com' is really from Apple?",
          choices: [
            "Reply and ask",
            "Click the link and see if the page looks right",
            "Hover over the sender name and inspect the actual address + domain",
          ],
          answerIdx: 2,
        },
        {
          q: "Which of these is NOT a phishing red flag?",
          choices: [
            "Generic 'Dear Customer' greeting",
            "An expected invoice from a vendor you work with weekly",
            "Urgent threat that your account will be closed",
          ],
          answerIdx: 1,
        },
      ],
    },
  },
  {
    catalogKey: "passwords-101",
    title: "Password Hygiene Basics",
    description: "Why a password manager is the single best security upgrade you can make.",
    category: "passwords",
    durationMinutes: 4,
    content: {
      steps: [
        {
          title: "The problem",
          body: "Most people reuse the same password across many sites. When one site gets breached (and they do — billions of passwords have leaked), attackers try those email/password combos everywhere. This is called 'credential stuffing' and it's how most accounts get hacked.",
        },
        {
          title: "Use a password manager",
          body: "1Password, Bitwarden, Dashlane, or your browser's built-in manager. It generates a unique random password for every site and remembers them. You only memorize one strong master password.",
        },
        {
          title: "Make it long",
          body: "12+ characters minimum. A passphrase like 'correct-horse-battery-staple-7!' is stronger and easier to remember than 'P@ss1!'.",
        },
        {
          title: "Turn on MFA everywhere",
          body: "Multi-factor authentication (a code from your phone, or a tap to approve) blocks 99% of automated attacks even if your password leaks. Use it on email, banking, and any work tool.",
        },
        {
          title: "Don't write passwords in chat or email",
          body: "Never paste a password into Slack, Teams, or email. If you must share, use your password manager's secure share feature, or a one-time-secret service.",
        },
      ],
      quiz: [
        {
          q: "What's the single best thing you can do for your account security?",
          choices: [
            "Change your password every 30 days",
            "Use a password manager + unique passwords + MFA",
            "Add a number to the end of your password",
          ],
          answerIdx: 1,
        },
        {
          q: "Why is reusing the same password dangerous?",
          choices: [
            "It uses more memory",
            "If one site leaks it, attackers try it on every other site you use",
            "Search engines can find it",
          ],
          answerIdx: 1,
        },
      ],
    },
  },
  {
    catalogKey: "wifi-and-devices",
    title: "Wi-Fi & Device Safety",
    description: "Public Wi-Fi, lost laptops, and the basics of keeping your devices safe.",
    category: "devices",
    durationMinutes: 4,
    content: {
      steps: [
        {
          title: "Public Wi-Fi rules",
          body: "Coffee shop, airport, hotel Wi-Fi: assume someone is watching. Don't log in to banking or work tools on it. Use your phone's hotspot, or a VPN if you must connect.",
        },
        {
          title: "Lock your screen",
          body: "Set your laptop to lock after 5 minutes of inactivity, and require a password to unlock. On Mac: Cmd+Ctrl+Q. On Windows: Win+L. Make it a reflex when you walk away.",
        },
        {
          title: "Turn on disk encryption",
          body: "FileVault (Mac) or BitLocker (Windows) means a thief can't read your files even if they remove the hard drive. Both are free and built in. Turn them on today.",
        },
        {
          title: "Keep software updated",
          body: "Most attacks exploit bugs that have already been patched. Turn on automatic updates for your OS, browser, and any business app. The 'install later' button costs companies millions every year.",
        },
        {
          title: "Phone basics",
          body: "Set a 6-digit (or longer) passcode, not a 4-digit one. Turn on Find My iPhone / Find My Device. Don't install apps from outside the App Store / Play Store.",
        },
      ],
      quiz: [
        {
          q: "You're working from a coffee shop and need to check your bank balance. Best option?",
          choices: [
            "Connect to the cafe Wi-Fi — it has a password",
            "Use your phone's mobile hotspot",
            "Ask the barista if their Wi-Fi is safe",
          ],
          answerIdx: 1,
        },
        {
          q: "Your laptop gets stolen. What single setting saves you the most?",
          choices: [
            "Antivirus software",
            "Disk encryption (FileVault / BitLocker)",
            "A complicated desktop background",
          ],
          answerIdx: 1,
        },
      ],
    },
  },
  {
    catalogKey: "data-handling",
    title: "Handling Customer & Company Data",
    description: "What to share, what not to share, and where data should live.",
    category: "data",
    durationMinutes: 4,
    content: {
      steps: [
        {
          title: "Know what counts as sensitive",
          body: "Customer names, emails, phone numbers, addresses, payment info, IDs, health info, and internal financials. If a customer would be upset to see it leaked, treat it as sensitive.",
        },
        {
          title: "Keep it in approved tools",
          body: "Don't email customer lists to your personal Gmail. Don't store them in random spreadsheets on your desktop. Use the CRM, the accounting tool, the file share your company has approved.",
        },
        {
          title: "Least privilege",
          body: "Only people who need to see customer data should have access. If you're an owner, audit who has access to what every quarter and remove anyone who no longer needs it.",
        },
        {
          title: "Be careful with screen shares",
          body: "Before screen-sharing in a meeting or recording a video, close any tab with sensitive data. Hide notification previews. It's an easy mistake to leak a whole customer list in 1 second.",
        },
        {
          title: "When in doubt, ask",
          body: "If a customer or vendor asks you to send something out of the ordinary — a list, a payment, a credential — verify by phone or in person first. Attackers love impersonation.",
        },
      ],
      quiz: [
        {
          q: "A vendor emails asking for an export of your customer list to 'reconcile their records'. They've never asked before. What do you do?",
          choices: [
            "Send it — they're a known vendor",
            "Call your usual contact at the vendor on a known phone number to verify",
            "Reply asking what format they want",
          ],
          answerIdx: 1,
        },
      ],
    },
  },
  {
    catalogKey: "incident-reporting",
    title: "If Something Goes Wrong, Report It",
    description: "A 30-second course on the most important thing: telling someone fast.",
    category: "awareness",
    durationMinutes: 3,
    content: {
      steps: [
        {
          title: "The cost of silence",
          body: "Almost every major breach gets worse because the person who first noticed didn't speak up — they were embarrassed, or didn't think it mattered. The earlier you tell someone, the smaller the damage.",
        },
        {
          title: "What to report",
          body: "Clicked a sketchy link. Typed your password into a weird page. Lost a laptop or phone. Saw an email that looked off. A customer says their account did something they didn't do. All of it.",
        },
        {
          title: "How to report",
          body: "Tell your manager or the owner directly — Slack, Teams, in person, phone — whatever is fastest. Don't email a generic inbox and wait. Don't try to 'fix it yourself' first.",
        },
        {
          title: "You won't get in trouble",
          body: "A good company treats fast reporting as the right thing, not the thing that gets you blamed. The blame falls on whoever hides a mistake until it becomes a disaster.",
        },
      ],
      quiz: [
        {
          q: "You think you may have entered your password into a phishing page. What's the best move?",
          choices: [
            "Wait and see if anything bad happens",
            "Tell your manager immediately and change the password right away",
            "Delete the email and hope for the best",
          ],
          answerIdx: 1,
        },
      ],
    },
  },
];

export interface SeedPlaybook {
  catalogKey: string;
  title: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  steps: Array<{ title: string; detail: string }>;
}

export const SEED_PLAYBOOKS: SeedPlaybook[] = [
  {
    catalogKey: "ransomware",
    title: "Ransomware / Encrypted Files",
    category: "ransomware",
    severity: "critical",
    description:
      "Files on a device are encrypted, renamed, or display a ransom note. Speed matters — disconnect first.",
    steps: [
      { title: "Disconnect the affected device from the network", detail: "Unplug the ethernet cable, turn off Wi-Fi, and disable Bluetooth on the affected machine. Do NOT power it off — memory may contain useful evidence and shutting down can trigger more damage." },
      { title: "Identify the scope", detail: "Check shared drives, cloud storage (Dropbox/Drive/OneDrive), and other devices on the same network. Look for files with strange new extensions or ransom notes." },
      { title: "Do NOT pay the ransom yet", detail: "Paying funds criminals, doesn't guarantee recovery, and can be illegal in some jurisdictions. Most successful recoveries come from backups, not payments." },
      { title: "Notify your team", detail: "Tell every staff member to stop using shared drives until cleared. Send by phone/text — assume email could be compromised." },
      { title: "Restore from backup", detail: "Identify your most recent clean backup (before the encryption timestamp) and prepare to restore once the affected systems are wiped." },
      { title: "Wipe and reinstall the affected device", detail: "Don't try to 'clean' a ransomware infection. Back up any photos/personal files separately, then erase the disk and reinstall the OS from scratch." },
      { title: "Change all credentials used on the device", detail: "Email, banking, SaaS tools, password manager — assume everything entered on that machine is compromised. Reset from a different, clean device." },
      { title: "File a report", detail: "In the US: ic3.gov (FBI). In the UK: actionfraud.police.uk. Most countries have an equivalent. This helps law enforcement and may be required by your cyber insurance." },
      { title: "Notify customers if data was accessed", detail: "If customer data was on the affected systems, your jurisdiction likely requires breach notification. Consult a lawyer before notifying — wording matters." },
      { title: "Post-incident review", detail: "Within 7 days, document: how it got in, what was lost, what stopped it, and one change to prevent it next time. Add the change to your security backlog." },
    ],
  },
  {
    catalogKey: "lost-device",
    title: "Lost or Stolen Laptop / Phone",
    category: "lost-device",
    severity: "high",
    description: "A device with company access is missing — at the airport, in an Uber, taken from a desk.",
    steps: [
      { title: "Mark the device lost remotely", detail: "iOS: Find My iPhone. Android: Find My Device. Mac: Find My. Windows: Microsoft account device page. This locks the screen and shows a message." },
      { title: "Wipe it remotely if you can't recover within 1 hour", detail: "Same tools above support remote wipe. If disk encryption is on (FileVault/BitLocker), the data is already protected, but wiping is still the safest move." },
      { title: "Sign the device out of every connected service", detail: "Email (Gmail/Outlook), Slack, password manager, banking apps, GitHub, your CRM. Most have 'sign out all devices' in security settings." },
      { title: "Reset the password on the master account", detail: "Whatever account was the 'recovery' (usually personal email or work email), change that password and rotate its recovery codes." },
      { title: "Check for unauthorized activity over the next 7 days", detail: "Review logins, sent emails, and financial transactions daily. Flag anything unusual immediately." },
      { title: "File a police report if stolen", detail: "Required by most insurance policies and may be needed for chain-of-custody if data is later misused." },
      { title: "Order a replacement and restore from backup", detail: "Use this as a chance to set up the new device with fresh disk encryption, MFA on every account, and the latest OS." },
    ],
  },
  {
    catalogKey: "phishing-clicked",
    title: "Someone Clicked a Phishing Link / Entered Credentials",
    category: "phishing",
    severity: "high",
    description: "A staff member clicked a suspicious link or, worse, typed their password on a fake login page.",
    steps: [
      { title: "Reset the affected password immediately", detail: "From a different, trusted device. Use a unique strong password, not a variation of the old one." },
      { title: "Sign out all sessions of that account", detail: "Check 'recent activity' or 'security' in the account settings and force sign-out everywhere. Then sign back in only on trusted devices." },
      { title: "Turn on MFA if it wasn't on already", detail: "Use an authenticator app (not SMS where possible). This blocks the attacker even if they still have the password." },
      { title: "Check for forwarding rules and delegated access", detail: "Email attackers often add a hidden auto-forward rule to siphon your inbox. Check filters/rules in Gmail or Outlook and delete anything you didn't create." },
      { title: "Scan the device for malware", detail: "If a file was downloaded or executed, run a full scan with the OS's built-in tool (Windows Defender, XProtect on Mac) or a reputable AV." },
      { title: "Notify anyone the attacker may have emailed as you", detail: "Check the 'sent' folder. If anything went out, message the recipients on a different channel and warn them." },
      { title: "Log the incident and report to staff", detail: "A short, blame-free internal note ('a phishing email got through, here's what to look out for') prevents the same trick working twice." },
    ],
  },
  {
    catalogKey: "data-leak",
    title: "Suspected Customer Data Leak",
    category: "data-leak",
    severity: "critical",
    description: "A customer reports info they didn't share, a file with PII gets shared publicly, or a database appears online.",
    steps: [
      { title: "Stop the bleeding", detail: "Take down any public link, revoke shared access, or disable the leaking integration before anything else. Save a screenshot first as evidence." },
      { title: "Identify what was exposed", detail: "Names? Emails? Phone numbers? Addresses? Payment info? Health info? The class of data drives every following step." },
      { title: "Identify how many people are affected", detail: "Pull the records that were exposed. Even a rough count matters for notification timelines." },
      { title: "Lock down the source", detail: "Rotate any API keys, database passwords, or webhook secrets that could have allowed the leak. Check logs for misuse." },
      { title: "Engage legal counsel BEFORE notifying anyone publicly", detail: "Wording, timing, and method of notification are governed by laws (GDPR in EU, state laws in the US, etc). Get a lawyer's review even if it costs you a day." },
      { title: "Notify affected customers", detail: "Most jurisdictions require notification within 72 hours of discovery. Be honest, specific, and include what they should do next (change password, watch their accounts)." },
      { title: "Notify regulators if required", detail: "EU GDPR: data protection authority. US: state attorneys general (varies). Check your jurisdiction." },
      { title: "Public statement if media-relevant", detail: "If the leak is large or the data is sensitive, expect questions. Prepare a short, honest statement and a single point of contact." },
      { title: "Post-mortem and policy update", detail: "Within 14 days: document the root cause and add at least one preventive control (access review, encryption, monitoring)." },
    ],
  },
  {
    catalogKey: "suspicious-email",
    title: "Suspicious Email Reported by Staff",
    category: "phishing",
    severity: "low",
    description: "A staff member flags an email that looks like phishing — no one has clicked it (yet).",
    steps: [
      { title: "Get a copy of the email with full headers", detail: "Forward as attachment, or use 'show original' / 'message source' in the email client. Don't just screenshot — headers are the evidence." },
      { title: "Check who else received it", detail: "Search the company inbox or ask staff. Phishing campaigns rarely target one person." },
      { title: "Send a brief warning to the team", detail: "Subject: 'Don't click - phishing'. Include the sender, subject line, and the red flags. People stop clicking once they know what to look for." },
      { title: "Block the sender at the email provider level", detail: "Most providers (Google Workspace, Microsoft 365) let you blocklist a sender or domain for the whole org." },
      { title: "Report to the impersonated brand if relevant", detail: "Most banks/SaaS vendors have a phishing@brand.com address. They appreciate the heads up." },
      { title: "Thank the reporter publicly", detail: "Praising someone for reporting (even a false alarm) keeps the team reporting. Punishing or eye-rolling kills it." },
    ],
  },
];

export interface PhishingTemplate {
  key: string;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  previewBody: string;
  landingTeach: string;
  redFlags: string[];
}

export const PHISHING_TEMPLATES: PhishingTemplate[] = [
  {
    key: "fake-invoice",
    name: "Overdue Invoice",
    difficulty: "easy",
    subject: "Invoice #4471 — Overdue notice (action required)",
    previewBody:
      "Hi,\n\nOur records show invoice #4471 for $2,847.00 is now 14 days overdue. To avoid late fees and a hold on your account, please review and pay using the link below.\n\nView invoice & pay: {{LINK}}\n\nThanks,\nBilling Team",
    landingTeach:
      "If you weren't expecting an invoice, never click. Real vendors will let you log in to your usual portal — no email link required.",
    redFlags: [
      "Vague sender ('Billing Team') with no specific company name",
      "Urgency about late fees / account hold",
      "Link to a payment page from an unexpected email",
    ],
  },
  {
    key: "ceo-gift-cards",
    name: "CEO Gift Card Request",
    difficulty: "medium",
    subject: "Quick favor",
    previewBody:
      "Hey — are you at your desk? I need to grab some gift cards for a client gift, can you help? I'm in a meeting and can't step out. Reply when you see this.\n\n— Sent from my iPhone",
    landingTeach:
      "Classic 'business email compromise'. Real bosses don't need anonymous gift cards from staff. Always verify on a different channel — phone or in person.",
    redFlags: [
      "Urgent vague favor",
      "'Sent from my iPhone' to explain weird tone",
      "No signature, no specifics",
    ],
  },
  {
    key: "shared-document",
    name: "Shared Document Notification",
    difficulty: "medium",
    subject: "A document has been shared with you: Q3-budget.pdf",
    previewBody:
      "Hi,\n\nFinance has shared a document with you: 'Q3-budget.pdf'.\n\nView document: {{LINK}}\n\nThis link will expire in 24 hours.\n\n— Document Service",
    landingTeach:
      "Fake share notifications drive people to credential-harvest pages. Always go to the document tool directly (open Drive/Dropbox in your browser) — never click the email link.",
    redFlags: [
      "Generic sender ('Document Service')",
      "24-hour expiration to create urgency",
      "Can't verify who 'Finance' is",
    ],
  },
  {
    key: "package-delivery",
    name: "Package Delivery Failed",
    difficulty: "easy",
    subject: "Your package could not be delivered — schedule redelivery",
    previewBody:
      "Hello,\n\nWe attempted to deliver your package today but no one was available to sign. Please confirm your address and pay the $1.99 redelivery fee at the link below within 48 hours or your package will be returned.\n\nReschedule: {{LINK}}",
    landingTeach:
      "Real carriers (USPS/UPS/FedEx) don't ask for redelivery fees over email. Go to the carrier's website directly with your tracking number.",
    redFlags: [
      "Tiny fee ($1.99) makes it feel low-risk to pay",
      "Asks for both address confirmation AND payment info",
      "48-hour countdown",
    ],
  },
  {
    key: "password-expiring",
    name: "Password Expiring",
    difficulty: "medium",
    subject: "Your Microsoft 365 password expires in 24 hours",
    previewBody:
      "Hi,\n\nYour password is set to expire in the next 24 hours. To keep your account active, please verify your current password using the secure link below.\n\nKeep current password: {{LINK}}\n\n— IT Helpdesk",
    landingTeach:
      "Real IT teams never ask you to 'verify your current password' via a link. Password expiry, when it exists, is handled inside the app you're logging in to.",
    redFlags: [
      "Asks you to enter your CURRENT password (real resets don't)",
      "Generic 'IT Helpdesk' sender",
      "Urgency / countdown",
    ],
  },
  {
    key: "storage-full",
    name: "Mailbox Full",
    difficulty: "hard",
    subject: "[Action] Your mailbox storage is 98% full",
    previewBody:
      "Your mailbox is almost full. Once it reaches 100%, you will stop receiving new messages. Click below to upgrade your storage at no cost.\n\nUpgrade now: {{LINK}}\n\n— Mail Admin",
    landingTeach:
      "Mailbox-full warnings come from your actual mail provider's interface, not a random email. The 'no cost' framing is bait to lower your guard.",
    redFlags: [
      "'At no cost' to make the click feel safe",
      "'Mail Admin' is not a real role at most companies",
      "Urgency about losing messages",
    ],
  },
];

export const SEED_VENDORS = [
  { name: "Google Workspace", category: "email", dataAccess: "critical" as const, hasMfa: true, hasSso: true },
  { name: "Slack", category: "communication", dataAccess: "high" as const, hasMfa: true, hasSso: true },
  { name: "Stripe", category: "payments", dataAccess: "critical" as const, hasMfa: true, hasSso: true },
  { name: "QuickBooks Online", category: "accounting", dataAccess: "high" as const, hasMfa: true, hasSso: false },
  { name: "Dropbox", category: "file-storage", dataAccess: "high" as const, hasMfa: true, hasSso: true },
  { name: "HubSpot", category: "crm", dataAccess: "high" as const, hasMfa: true, hasSso: true },
  { name: "Zoom", category: "video", dataAccess: "medium" as const, hasMfa: true, hasSso: true },
  { name: "Mailchimp", category: "marketing", dataAccess: "medium" as const, hasMfa: true, hasSso: false },
];
