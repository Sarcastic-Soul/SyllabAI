import fs from "fs";
import path from "path";
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        getFiles(path.join(dir, file), fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(path.join(dir, file));
    }
}
  return fileList;
}

const replacements = {
  "components/DashboardClient": "components/dashboard/DashboardClient",
  "components/DashboardStats": "components/dashboard/DashboardStats",
  "components/CourseForm": "components/course/CourseForm",
  "components/GenerateWrapper": "components/course/GenerateWrapper",
  "components/GeneratingLesson": "components/course/GeneratingLesson",
  "components/ExportCourseButtons": "components/course/ExportCourseButtons",
  "components/CheatSheetExportButtons": "components/course/CheatSheetExportButtons",
  "components/DeleteCourseButton": "components/course/DeleteCourseButton",
  "components/ShareCourseButton": "components/course/ShareCourseButton",
  "components/FlashcardReview": "components/course/FlashcardReview",
  "components/QuizComponent": "components/course/QuizComponent",
  "components/MermaidDiagram": "components/course/MermaidDiagram",
  "components/PrintTrigger": "components/course/PrintTrigger",
  "components/StudyBuddyInteractive": "components/study-buddy/StudyBuddyInteractive",
  "components/Navbar": "components/shared/Navbar",
  "components/ConditionalNavbar": "components/shared/ConditionalNavbar",
  "components/MobileMenu": "components/shared/MobileMenu",
  "components/NavItems": "components/shared/NavItems",
  "components/SubmitButton": "components/shared/SubmitButton",
};

const files = getFiles(process.cwd());

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let modified = false;

  for (const [oldPath, newPath] of Object.entries(replacements)) {
    // Look for "@/components/..."
    const regex1 = new RegExp(`"@/${oldPath}"`, "g");
    if (regex1.test(content)) {
      content = content.replace(regex1, `"@/${newPath}"`);
      modified = true;
    }
    const regex2 = new RegExp(`'@/${oldPath}'`, "g");
    if (regex2.test(content)) {
      content = content.replace(regex2, `'@/${newPath}'`);
      modified = true;
    }
    // Also look for relative paths like "../../components/..."
    // Just replace the component name if it's imported from components
    // Actually, `@/components` is mostly used. Let's just do `@/components` first.
  }

  // Also fix internal imports within the components themselves
  // e.g. import { ... } from "../ui/button" instead of "@/components/ui/button"
  // If they were in `components/` and moved to `components/course/`, the relative paths `../ui` would be `../../ui` ?
  // wait, the project uses `@/components/ui/button` everywhere! So we don't need to fix relative paths for UI components.

  if (modified) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated imports in ${file}`);
  }
}
