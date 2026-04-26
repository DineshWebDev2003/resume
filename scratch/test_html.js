
const { generateResumeHtml } = require('./components/resume-html-generator');

const data = {
  name: "TEST USER",
  title: "Software Engineer",
  email: "test@example.com",
  phone: "1234567890",
  location: "New York",
  summary: "This is a summary.",
  experience: [],
  education: { school: "University", degree: "CS", year: "2020", honors: "None" },
  skills: "JS, TS",
  languages: "English",
  projects: []
};

try {
  const html = generateResumeHtml(data, "Modern", "#1e293b", "Inter", false);
  console.log("HTML length:", html.length);
  console.log("HTML sample:", html.substring(0, 500));
  if (html.includes("<!DOCTYPE html>")) {
    console.log("SUCCESS: HTML generated correctly.");
  } else {
    console.log("FAILURE: HTML missing doctype.");
  }
} catch (e) {
  console.error("ERROR generating HTML:", e);
}
