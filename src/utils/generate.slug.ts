import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";

export const generateDoctorSlug = (name: string) => {
  const base = slugify(name, { lower: true, strict: true });
  const unique = uuidv4().split("-")[0];
  return `${base}-${unique}`;
};
