import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  FileSpreadsheet,
  QrCode,
  BarChart3,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const copy = {
  fr: {
    nav: { login: "Connexion", register: "S'inscrire" },
    hero: {
      title: "La certification numérique, simplifiée pour les écoles",
      subtitle:
        "CertifiCampus permet aux établissements de générer, gérer et envoyer des diplômes numériques sécurisés par QR code, avec des statistiques détaillées.",
      cta: "Commencer gratuitement",
      secondary: "Découvrir",
    },
    featuresTitle: "Tout pour digitaliser votre diplomation",
    features: [
      {
        icon: FileSpreadsheet,
        title: "Import Excel",
        text: "Importez vos listes d’étudiants en masse depuis un fichier Excel.",
      },
      {
        icon: Award,
        title: "Génération de diplômes",
        text: "Générez des certificats personnalisés à partir de vos templates.",
      },
      {
        icon: QrCode,
        title: "QR code unique",
        text: "Chaque diplôme intègre un QR code garantissant son authenticité.",
      },
      {
        icon: Mail,
        title: "Envoi par e-mail",
        text: "Diffusez les certificats aux apprenants en un clic.",
      },
      {
        icon: BarChart3,
        title: "Statistiques",
        text: "Suivez vos taux de réussite et leur évolution annuelle.",
      },
      {
        icon: ShieldCheck,
        title: "Sécurité",
        text: "Authentification par rôles et données protégées.",
      },
    ],
    partners: "Ils nous font confiance",
  },
  en: {
    nav: { login: "Sign in", register: "Sign up" },
    hero: {
      title: "Digital certification, made simple for schools",
      subtitle:
        "CertifiCampus lets institutions generate, manage and send secure QR-coded digital diplomas, with detailed statistics.",
      cta: "Get started free",
      secondary: "Learn more",
    },
    featuresTitle: "Everything to digitise your graduation process",
    features: [
      {
        icon: FileSpreadsheet,
        title: "Excel import",
        text: "Bulk-import your student lists from an Excel file.",
      },
      {
        icon: Award,
        title: "Diploma generation",
        text: "Generate personalised certificates from your templates.",
      },
      {
        icon: QrCode,
        title: "Unique QR code",
        text: "Each diploma carries a QR code guaranteeing its authenticity.",
      },
      {
        icon: Mail,
        title: "Email delivery",
        text: "Send certificates to learners in one click.",
      },
      {
        icon: BarChart3,
        title: "Statistics",
        text: "Track success rates and their year-over-year trend.",
      },
      {
        icon: ShieldCheck,
        title: "Security",
        text: "Role-based authentication and protected data.",
      },
    ],
    partners: "Trusted by",
  },
};

export default function LandingPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = copy[lang];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo className="text-2xl" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="rounded-md border px-3 py-1.5 text-sm font-medium"
              aria-label="Changer de langue"
            >
              {lang === "fr" ? "EN" : "FR"}
            </button>
            <Link to="/login">
              <Button variant="ghost">{t.nav.login}</Button>
            </Link>
            <Link to="/register">
              <Button variant="accent">{t.nav.register}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-brand to-brand-light px-6 py-24 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              {t.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/register">
                <Button variant="accent" size="lg">
                  {t.hero.cta}
                </Button>
              </Link>
              <a href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent text-white hover:bg-white/10"
                >
                  {t.hero.secondary}
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-brand">
              {t.featuresTitle}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {t.features.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
                    <Icon className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/40 px-6 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-8 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t.partners}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10 opacity-60">
              {["H3 Hitema"].map((p) => (
                <span key={p} className="text-xl font-bold text-brand">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-brand px-6 py-10 text-center text-sm text-white/70">
        <Logo light className="text-lg" />
        <p className="mt-3">
          © {new Date().getFullYear()} CertifiCampus — Certifications
          numériques.
        </p>
      </footer>
    </div>
  );
}
