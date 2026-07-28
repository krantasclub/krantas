// ── Translation dictionaries ────────────────────────────────────────────
// Scope: static UI chrome only — the stuff that's hardcoded in components,
// never anything pulled from Supabase (about_page, events, artists, store
// products, etc). Those stay exactly as your team writes them in /admin.
//
// Add new keys as you translate more components: nest under the
// component's name so `t("footer.explore")` reads the same way the file
// is organized.
export interface TranslationShape {
  nav: {
    releases: string;
    artists: string;
    events: string;
    radio: string;
    store: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    tagline: string;
    explore: string;
    club: string;
    aboutKrantas: string;
    lostAndFound: string;
    contact: string;
    bookUs: string;
    findUs: string;
    follow: string;
    poweredBy: string;
    allRightsReserved: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    note: string;
    messageSentTitle: string;
    messageSentBody: (firstName: string) => string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    genericError: string;
    findUs: string;
    follow: string;
  };
  admin: {
    controlPanel: string;
    backToSite: string;
    signOut: string;
    signIn: string;
    signingIn: string;
    email: string;
    password: string;
    wrongCredentials: string;
    backToSiteLong: string;
  };
}

export const translations: Record<"lt" | "en", TranslationShape> = {
  lt: {
    nav: {
      releases: "Leidiniai",
      artists: "Atlikėjai",
      events: "Renginiai",
      radio: "Radijas",
      store: "Parduotuvė",
      openMenu: "Atverti meniu",
      closeMenu: "Uždaryti meniu",
    },
    footer: {
      tagline:
        "Naktinis klubas Klaipėdoje. Techno, breaks ir bass nuo tada, kai pasikeitė potvynis.",
      explore: "Naršyti",
      club: "Klubas",
      aboutKrantas: "Apie Krantas",
      lostAndFound: "Pamesta ir rasta",
      contact: "Kontaktai",
      bookUs: "Rezervuokite mus",
      findUs: "Kaip mus rasti",
      follow: "Sekite",
      poweredBy: "Sukūrė",
      allRightsReserved: "Visos teisės saugomos.",
    },
    contact: {
      eyebrow: "Susisiekite",
      title: "Kontaktai",
      note: "Klausimai, žiniasklaida, svečių sąrašai — parašykite mums.",
      messageSentTitle: "Žinutė išsiųsta",
      messageSentBody: (firstName: string) =>
        `Ačiū, ${firstName} — patikrinkite savo pašto dėžutę patvirtinimo laiško. Netrukus su jumis susisieksime.`,
      nameLabel: "Vardas",
      namePlaceholder: "Jūsų vardas",
      emailLabel: "El. paštas",
      emailPlaceholder: "jus@pavyzdys.lt",
      phoneLabel: "Telefonas (nebūtina)",
      phonePlaceholder: "+370...",
      subjectLabel: "Tema (nebūtina)",
      subjectPlaceholder: "Apie ką norėtumėte parašyti?",
      messageLabel: "Žinutė",
      messagePlaceholder: "Papasakokite, kas rūpi...",
      send: "Siųsti žinutę →",
      sending: "Siunčiama...",
      genericError: "Kažkas nutiko — bandykite dar kartą.",
      findUs: "Kaip mus rasti",
      follow: "Sekite",
    },
    admin: {
      controlPanel: "Valdymo skydelis",
      backToSite: "← Svetainė",
      signOut: "Atsijungti →",
      signIn: "Prisijungti",
      signingIn: "Jungiamasi...",
      email: "El. paštas",
      password: "Slaptažodis",
      wrongCredentials: "Neteisingas el. paštas arba slaptažodis.",
      backToSiteLong: "← Grįžti į svetainę",
    },
  },
  en: {
    nav: {
      releases: "Releases",
      artists: "Artists",
      events: "Events",
      radio: "Radio",
      store: "Store",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    footer: {
      tagline:
        "Underground music by the shore. Techno, breaks and bass since the tide turned.",
      explore: "Explore",
      club: "Club",
      aboutKrantas: "About Krantas",
      lostAndFound: "Lost & found",
      contact: "Contact",
      bookUs: "Book us",
      findUs: "Find us",
      follow: "Follow",
      poweredBy: "Powered by",
      allRightsReserved: "All rights reserved.",
    },
    contact: {
      eyebrow: "Get in touch",
      title: "Contact",
      note: "Questions, press, guest lists — drop us a line.",
      messageSentTitle: "Message sent",
      messageSentBody: (firstName: string) =>
        `Thanks, ${firstName} — check your inbox for a confirmation. We'll get back to you soon.`,
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      phoneLabel: "Phone (optional)",
      phonePlaceholder: "+370...",
      subjectLabel: "Subject (optional)",
      subjectPlaceholder: "What's this about?",
      messageLabel: "Message",
      messagePlaceholder: "Tell us what's up...",
      send: "Send message →",
      sending: "Sending...",
      genericError: "Something went wrong — try again.",
      findUs: "Find us",
      follow: "Follow",
    },
    admin: {
      controlPanel: "Control Panel",
      backToSite: "← Site",
      signOut: "Sign out →",
      signIn: "Sign in",
      signingIn: "Signing in...",
      email: "Email",
      password: "Password",
      wrongCredentials: "Wrong email or password.",
      backToSiteLong: "← Back to site",
    },
  },
} as const;
