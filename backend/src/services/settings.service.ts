import { User, School } from "../models";
import { ApiError } from "../utils/ApiError";
import {
  hashPassword,
  comparePassword,
  isStrongPassword,
} from "../utils/password";
import { sendEmail } from "../utils/email";
import { accountUpdatedEmail } from "../utils/emailTemplates";
import {
  ChangePasswordInput,
  UpdateProfileInput,
} from "../validators/settings.schema";

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("Utilisateur introuvable");
  const school = user.school ? await School.findById(user.school) : null;
  return { user, school };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("Utilisateur introuvable");

  if (input.email && input.email !== user.email) {
    const taken = await User.findOne({ email: input.email });
    if (taken) throw ApiError.conflict("Adresse e-mail déjà utilisée");
    user.email = input.email;
  }
  if (input.firstname) user.firstname = input.firstname;
  if (input.lastname) user.lastname = input.lastname;
  await user.save();

  let school = null;
  if (user.school && (input.schoolName || input.address || input.region)) {
    school = await School.findByIdAndUpdate(
      user.school,
      {
        $set: {
          ...(input.schoolName ? { label: input.schoolName } : {}),
          ...(input.address ? { address: input.address } : {}),
          ...(input.region ? { region: input.region } : {}),
        },
      },
      { new: true },
    );
  } else if (user.school) {
    school = await School.findById(user.school);
  }

  const mail = accountUpdatedEmail(user.firstname);
  await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });

  return { user, school };
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  if (input.newPassword !== input.confirmPassword) {
    throw ApiError.badRequest("Les mots de passe ne correspondent pas");
  }
  if (!isStrongPassword(input.newPassword)) {
    throw ApiError.badRequest(
      "Le mot de passe doit contenir au moins 8 caractères, avec des lettres et des chiffres",
    );
  }

  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.notFound("Utilisateur introuvable");

  const valid = await comparePassword(input.currentPassword, user.password);
  if (!valid) throw ApiError.badRequest("Mot de passe actuel incorrect");

  user.password = await hashPassword(input.newPassword);
  await user.save();
}
