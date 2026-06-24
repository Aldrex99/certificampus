import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { User } from "../models/User";
import { School } from "../models/School";
import { Subscription } from "../models/Subscription";
import { Training } from "../models/Training";
import { Speciality } from "../models/Speciality";
import { Student } from "../models/Student";
import { TemplateDiploma } from "../models/TemplateDiploma";
import { Diploma } from "../models/Diploma";

const HASH_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function qrToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

function randomDate(from: Date, to: Date): Date {
  return new Date(
    from.getTime() + Math.random() * (to.getTime() - from.getTime()),
  );
}

// ---------------------------------------------------------------------------
// Template content
// ---------------------------------------------------------------------------

const DEFAULT_TEMPLATE_CONTENT = `
<div style="font-family: Georgia, serif; text-align: center; padding: 60px; border: 8px double #1a3a5c;">
  <h1 style="font-size: 36px; color: #1a3a5c; margin-bottom: 8px;">CERTIFICAMPUS</h1>
  <p style="font-size: 14px; color: #666; letter-spacing: 4px; text-transform: uppercase;">Plateforme de Certification Numérique</p>
  <hr style="border-color: #c8a84b; margin: 24px auto; width: 60%;" />
  <p style="font-size: 18px; margin: 0;">Certifie que</p>
  <h2 style="font-size: 30px; color: #1a3a5c; margin: 16px 0;">{{student_name}}</h2>
  <p style="font-size: 18px;">a obtenu le diplôme de</p>
  <h3 style="font-size: 24px; color: #c8a84b; margin: 12px 0;">{{training_label}}</h3>
  <p style="font-size: 16px; color: #444;">Spécialité : <strong>{{speciality_label}}</strong></p>
  <p style="font-size: 16px;">Mention : <strong>{{grade}}</strong></p>
  <p style="font-size: 14px; color: #666; margin-top: 24px;">Délivré par <strong>{{school_label}}</strong></p>
  <p style="font-size: 14px; color: #666;">Le {{graduation_date}}</p>
  <div style="margin-top: 32px;">
    <img src="{{qr_code_url}}" alt="QR Code" style="width: 80px; height: 80px;" />
    <p style="font-size: 11px; color: #aaa;">Scannez pour vérifier l'authenticité</p>
  </div>
</div>
`.trim();

const SCHOOL_TEMPLATE_CONTENT = `
<div style="font-family: 'Helvetica Neue', sans-serif; padding: 50px; background: #fafafa; border: 4px solid #2c3e50;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h1 style="font-size: 28px; color: #2c3e50; margin: 0;">{{school_label}}</h1>
      <p style="font-size: 13px; color: #7f8c8d; margin: 4px 0;">Établissement d'Enseignement Supérieur</p>
    </div>
    <img src="{{qr_code_url}}" alt="QR" style="width: 70px; height: 70px;" />
  </div>
  <hr style="margin: 28px 0; border-color: #e0e0e0;" />
  <p style="font-size: 15px; text-align: center;">Il est certifié que</p>
  <h2 style="text-align: center; font-size: 26px; color: #2c3e50;">{{student_name}}</h2>
  <p style="text-align: center; font-size: 15px;">a validé avec succès la formation</p>
  <h3 style="text-align: center; font-size: 20px; color: #e67e22;">{{training_label}} — {{speciality_label}}</h3>
  <p style="text-align: center; font-size: 14px; color: #555;">Note obtenue : <strong>{{grade}}</strong> | Date : <strong>{{graduation_date}}</strong></p>
</div>
`.trim();

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  await connectDatabase();

  // Clear all collections in dependency order
  await Promise.all([
    Diploma.deleteMany({}),
    Student.deleteMany({}),
    TemplateDiploma.deleteMany({}),
    Training.deleteMany({}),
    Speciality.deleteMany({}),
    Subscription.deleteMany({}),
    School.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log("[seed] Collections vidées");

  // ---------------------------------------------------------------------------
  // 1. Admin user
  // ---------------------------------------------------------------------------

  const adminPassword = await bcrypt.hash("Admin1234!", HASH_ROUNDS);
  const admin = await User.create({
    firstname: "Super",
    lastname: "Admin",
    email: "admin@certificampus.com",
    password: adminPassword,
    role: "admin",
    isVerified: true,
  });

  console.log("[seed] Admin créé :", admin.email);

  // ---------------------------------------------------------------------------
  // 2. Global diploma template (no school)
  // ---------------------------------------------------------------------------

  const globalTemplate = await TemplateDiploma.create({
    name: "Modèle officiel CertifiCampus",
    content: DEFAULT_TEMPLATE_CONTENT,
    isDefault: true,
    school: null,
  });

  console.log("[seed] Modèle global créé :", globalTemplate.name);

  // ---------------------------------------------------------------------------
  // 3. Schools with their owners, subscriptions, trainings, specialities, etc.
  // ---------------------------------------------------------------------------

  const schoolsData = [
    {
      owner: {
        firstname: "Marie",
        lastname: "Dupont",
        email: "marie.dupont@ecole-tech.fr",
        password: "School1234!",
      },
      school: {
        label: "École de Technologie Avancée",
        address: "12 Rue de l'Innovation, 75001 Paris",
        region: "Île-de-France",
      },
      subscription: {
        name: "Abonnement Annuel Premium",
        type: "yearly" as const,
        price: 1200,
        status: "active" as const,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
      },
      trainings: [
        {
          label: "Développement Web Full Stack",
          description:
            "Formation complète au développement web moderne (React, Node.js, MongoDB)",
          level: "Bac+3",
          specialities: [
            {
              label: "Frontend React",
              description: "Spécialisation React, TypeScript et UI/UX",
            },
            {
              label: "Backend Node.js",
              description: "API REST, bases de données et architecture serveur",
            },
          ],
        },
        {
          label: "Intelligence Artificielle & Data Science",
          description:
            "Maîtrise des algorithmes de ML et de la science des données",
          level: "Bac+5",
          specialities: [
            {
              label: "Machine Learning",
              description: "Algorithmes supervisés et non supervisés",
            },
            {
              label: "Data Engineering",
              description: "Pipelines de données et infrastructure cloud",
            },
          ],
        },
      ],
      students: [
        {
          firstname: "Lucas",
          lastname: "Bernard",
          email: "lucas.bernard@student.fr",
          status: "admis" as const,
          grade: "Très Bien",
          trainingIdx: 0,
          specialityIdx: 0,
        },
        {
          firstname: "Emma",
          lastname: "Leclerc",
          email: "emma.leclerc@student.fr",
          status: "admis" as const,
          grade: "Bien",
          trainingIdx: 0,
          specialityIdx: 1,
        },
        {
          firstname: "Noah",
          lastname: "Martin",
          email: "noah.martin@student.fr",
          status: "admis" as const,
          grade: "Assez Bien",
          trainingIdx: 1,
          specialityIdx: 0,
        },
        {
          firstname: "Chloé",
          lastname: "Petit",
          email: "chloe.petit@student.fr",
          status: "ajourne" as const,
          grade: undefined,
          trainingIdx: 1,
          specialityIdx: 1,
        },
        {
          firstname: "Liam",
          lastname: "Moreau",
          email: "liam.moreau@student.fr",
          status: "admis" as const,
          grade: "Bien",
          trainingIdx: 0,
          specialityIdx: 0,
        },
      ],
    },
    {
      owner: {
        firstname: "Jean-Paul",
        lastname: "Renard",
        email: "jp.renard@business-school.fr",
        password: "School1234!",
      },
      school: {
        label: "Institut Supérieur de Commerce",
        address: "45 Avenue des Affaires, 69002 Lyon",
        region: "Auvergne-Rhône-Alpes",
      },
      subscription: {
        name: "Abonnement Mensuel Standard",
        type: "monthly" as const,
        price: 120,
        status: "active" as const,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-07-01"),
      },
      trainings: [
        {
          label: "Management & Stratégie d'Entreprise",
          description:
            "Formation aux techniques de management moderne et à la stratégie",
          level: "Bac+5",
          specialities: [
            {
              label: "Stratégie Digitale",
              description: "Transformation numérique et marketing digital",
            },
            {
              label: "Finance d'Entreprise",
              description: "Gestion financière et contrôle de gestion",
            },
          ],
        },
        {
          label: "Marketing & Communication",
          description:
            "Maîtrise des outils marketing et de la communication moderne",
          level: "Bac+3",
          specialities: [
            {
              label: "Marketing Digital",
              description: "SEO, SEA, réseaux sociaux et e-commerce",
            },
            {
              label: "Relations Publiques",
              description: "Communication institutionnelle et gestion de crise",
            },
          ],
        },
      ],
      students: [
        {
          firstname: "Sophie",
          lastname: "Laurent",
          email: "sophie.laurent@student.fr",
          status: "admis" as const,
          grade: "Très Bien",
          trainingIdx: 0,
          specialityIdx: 0,
        },
        {
          firstname: "Thomas",
          lastname: "Simon",
          email: "thomas.simon@student.fr",
          status: "admis" as const,
          grade: "Bien",
          trainingIdx: 0,
          specialityIdx: 1,
        },
        {
          firstname: "Inès",
          lastname: "Michel",
          email: "ines.michel@student.fr",
          status: "ajourne" as const,
          grade: undefined,
          trainingIdx: 1,
          specialityIdx: 0,
        },
        {
          firstname: "Axel",
          lastname: "Garcia",
          email: "axel.garcia@student.fr",
          status: "admis" as const,
          grade: "Passable",
          trainingIdx: 1,
          specialityIdx: 1,
        },
      ],
    },
    {
      owner: {
        firstname: "Fatima",
        lastname: "Ouali",
        email: "f.ouali@sante-formation.fr",
        password: "School1234!",
      },
      school: {
        label: "Centre de Formation en Santé",
        address: "8 Boulevard Pasteur, 13005 Marseille",
        region: "Provence-Alpes-Côte d'Azur",
      },
      subscription: {
        name: "Abonnement Unique",
        type: "one-time" as const,
        price: 500,
        status: "active" as const,
        startDate: new Date("2025-03-15"),
        endDate: new Date("2026-03-15"),
      },
      trainings: [
        {
          label: "Aide-Soignant",
          description:
            "Formation aux soins infirmiers et à l'accompagnement des patients",
          level: "CAP",
          specialities: [
            {
              label: "Gériatrie",
              description: "Soins aux personnes âgées en établissement",
            },
            {
              label: "Pédiatrie",
              description: "Accompagnement des enfants et familles",
            },
          ],
        },
      ],
      students: [
        {
          firstname: "Camille",
          lastname: "Rousseau",
          email: "camille.rousseau@student.fr",
          status: "admis" as const,
          grade: "Bien",
          trainingIdx: 0,
          specialityIdx: 0,
        },
        {
          firstname: "Hugo",
          lastname: "Blanc",
          email: "hugo.blanc@student.fr",
          status: "admis" as const,
          grade: "Très Bien",
          trainingIdx: 0,
          specialityIdx: 1,
        },
        {
          firstname: "Léa",
          lastname: "Fontaine",
          email: "lea.fontaine@student.fr",
          status: "ajourne" as const,
          grade: undefined,
          trainingIdx: 0,
          specialityIdx: 0,
        },
      ],
    },
  ];

  for (const data of schoolsData) {
    // Owner user
    const hashedPwd = await bcrypt.hash(data.owner.password, HASH_ROUNDS);
    const owner = await User.create({
      firstname: data.owner.firstname,
      lastname: data.owner.lastname,
      email: data.owner.email,
      password: hashedPwd,
      role: "school",
      isVerified: true,
    });

    // Subscription
    const subscription = await Subscription.create({
      ...data.subscription,
      school: undefined, // will be linked after school creation
    });

    // School
    const school = await School.create({
      ...data.school,
      owner: owner._id,
      subscription: subscription._id,
      isActive: true,
    });

    // Link subscription back to school
    await Subscription.findByIdAndUpdate(subscription._id, {
      school: school._id,
    });

    // Link user to school
    await User.findByIdAndUpdate(owner._id, { school: school._id });

    // School-specific template
    const schoolTemplate = await TemplateDiploma.create({
      name: `Modèle ${data.school.label}`,
      content: SCHOOL_TEMPLATE_CONTENT,
      isDefault: false,
      school: school._id,
    });

    // Trainings & specialities
    const trainingDocs: mongoose.Types.ObjectId[] = [];
    const specialityMatrix: mongoose.Types.ObjectId[][] = [];

    for (const t of data.trainings) {
      const specialityDocs: mongoose.Types.ObjectId[] = [];

      for (const sp of t.specialities) {
        const speciality = await Speciality.create({
          ...sp,
          school: school._id,
        });
        specialityDocs.push(speciality._id as mongoose.Types.ObjectId);
      }

      const training = await Training.create({
        label: t.label,
        description: t.description,
        level: t.level,
        school: school._id,
        specialities: specialityDocs,
      });

      trainingDocs.push(training._id as mongoose.Types.ObjectId);
      specialityMatrix.push(specialityDocs);
    }

    // Students & diplomas
    const admittedStudents: mongoose.Types.ObjectId[] = [];

    for (const s of data.students) {
      const trainingId = trainingDocs[s.trainingIdx];
      const specialityId = specialityMatrix[s.trainingIdx][s.specialityIdx];

      const graduationDate = randomDate(new Date("2024-01-01"), new Date());

      const student = await Student.create({
        firstname: s.firstname,
        lastname: s.lastname,
        email: s.email,
        school: school._id,
        training: trainingId,
        speciality: specialityId,
        status: s.status,
        grade: s.grade,
        graduationDate,
        isCertified: s.status === "admis",
      });

      if (s.status === "admis") {
        admittedStudents.push(student._id as mongoose.Types.ObjectId);

        await Diploma.create({
          student: student._id,
          school: school._id,
          training: trainingId,
          speciality: specialityId,
          template: schoolTemplate._id,
          grade: s.grade,
          graduationDate,
          qrToken: qrToken(),
          state: "published",
          isValid: true,
          generatedAt: graduationDate,
          publishedAt: graduationDate,
        });
      }
    }

    console.log(
      `[seed] École "${data.school.label}" — ${data.students.length} étudiants, ${admittedStudents.length} diplômes publiés`,
    );
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  const counts = await Promise.all([
    User.countDocuments(),
    School.countDocuments(),
    Subscription.countDocuments(),
    Training.countDocuments(),
    Speciality.countDocuments(),
    Student.countDocuments(),
    Diploma.countDocuments(),
    TemplateDiploma.countDocuments(),
  ]);

  console.log("\n[seed] ✓ Base de données peuplée avec succès :");
  console.log(`  Users            : ${counts[0]}`);
  console.log(`  Schools          : ${counts[1]}`);
  console.log(`  Subscriptions    : ${counts[2]}`);
  console.log(`  Trainings        : ${counts[3]}`);
  console.log(`  Specialities     : ${counts[4]}`);
  console.log(`  Students         : ${counts[5]}`);
  console.log(`  Diplomas         : ${counts[6]}`);
  console.log(`  TemplateDiplomas : ${counts[7]}`);
  console.log("\n[seed] Comptes disponibles :");
  console.log("  admin@certificampus.com   / Admin1234!  (role: admin)");
  console.log("  marie.dupont@ecole-tech.fr / School1234! (role: school)");
  console.log("  jp.renard@business-school.fr / School1234! (role: school)");
  console.log("  f.ouali@sante-formation.fr  / School1234! (role: school)");

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error("[seed] Erreur :", err);
  disconnectDatabase().finally(() => process.exit(1));
});
