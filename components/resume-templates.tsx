import React from "react";
import { Image, Text, View } from "react-native";

export type ResumeData = {
  name: string;
  title: string;
  email: string;
  phone: string;
  summary: string;
  photo?: string;
  experience: Array<{
    role: string;
    company: string;
    period: string;
    description: string;
    workType?: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  education: {
    degree: string;
    school: string;
    year: string;
  };
  skills: string;
};

export type TemplateProps = {
  resumeData: ResumeData;
  selectedFont: string;
  width?: number;
  height?: number;
};

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const RESUME_MARGIN = 24;

const GET_BASE_FONT_SIZE = (resumeData: ResumeData) => {
  let length = 0;
  length += (resumeData.name || "").length;
  length += (resumeData.title || "").length;
  length += (resumeData.summary || "").length;
  length += (resumeData.skills || "").length;
  (resumeData.experience || []).forEach(exp => {
    length += (exp.role || "").length + (exp.company || "").length + (exp.description || "").length;
  });
  (resumeData.projects || []).forEach(proj => {
    length += (proj.title || "").length + (proj.description || "").length;
  });
  length += (resumeData.education?.degree || "").length + (resumeData.education?.school || "").length;

  if (length < 500) return 14;
  if (length < 1000) return 12;
  return 10;
};

const SAFE_EXP = (data: any) => data?.experience || [];
const SAFE_PROJ = (data: any) => data?.projects || [];
const SAFE_EDU = (data: any) =>
  data?.education || { degree: "", school: "", year: "" };

const BulletText = ({ children, pFont, style }: any) => (
  <View style={[{ flexDirection: "row", marginBottom: 6 }, style]}>
    <Text style={[pFont, { fontSize: 10, color: "#334155" }]}>• </Text>
    <Text
      style={[
        pFont,
        { fontSize: 10, color: "#334155", flex: 1, lineHeight: 15 },
      ]}
    >
      {children}
    </Text>
  </View>
);

// --- 1. EXECUTIVE ---
export const ExecutiveTemplate = ({
  resumeData,
  selectedFont,
  width = A4_WIDTH,
  height = A4_HEIGHT,
}: TemplateProps) => {
  const pFont = { fontFamily: selectedFont };
  const exp = SAFE_EXP(resumeData);
  const edu = SAFE_EDU(resumeData);
  const baseSize = GET_BASE_FONT_SIZE(resumeData);

  return (
    <View
      style={{
        width,
        height,
        padding: Math.round(width * 0.06),
        backgroundColor: "#fff",
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        {resumeData.photo ? (
          <Image
            source={{ uri: resumeData.photo }}
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              marginBottom: 15,
            }}
          />
        ) : null}
        <Text
          style={[
            pFont,
            {
              fontSize: baseSize + 22,
              fontWeight: "900",
              letterSpacing: 4,
              color: "#000",
              textAlign: "center",
            },
          ]}
        >
          {(resumeData.name || "").toUpperCase()}
        </Text>
        <Text
          style={[
            pFont,
            {
              fontSize: baseSize + 4,
              fontWeight: "600",
              color: "#64748b",
              marginTop: 8,
              letterSpacing: 2,
              textAlign: "center",
            },
          ]}
        >
          {(resumeData.title || "").toUpperCase()}
        </Text>
        <View style={{ flexDirection: "row", marginTop: 15, opacity: 0.8 }}>
          <Text style={[pFont, { fontSize: baseSize }]}>{resumeData.email}</Text>
          <Text style={[pFont, { fontSize: baseSize, marginHorizontal: 12 }]}>|</Text>
          <Text style={[pFont, { fontSize: baseSize }]}>{resumeData.phone}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ marginBottom: 25 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 2,
                fontWeight: "900",
                marginBottom: 10,
                textAlign: "left",
                letterSpacing: 1.5,
                color: "#1e293b",
                borderBottomWidth: 1,
                borderBottomColor: "#cbd5e1",
                paddingBottom: 4,
              },
            ]}
          >
            SUMMARY
          </Text>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize,
                lineHeight: baseSize * 1.5,
                textAlign: "justify",
                color: "#334155",
              },
            ]}
          >
            {resumeData.summary}
          </Text>
        </View>

        <View style={{ marginBottom: 25 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 2,
                fontWeight: "900",
                marginBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: "#000",
                paddingBottom: 6,
                letterSpacing: 1.5,
              },
            ]}
          >
            EXPERIENCE
          </Text>
          {exp.slice(0, 5).map((e: any, idx: number) => (
            <View key={idx} style={{ marginBottom: 18 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={[pFont, { fontSize: baseSize + 1, fontWeight: "900" }]}>
                  {e.role}
                </Text>
                <Text
                  style={[
                    pFont,
                    { fontSize: baseSize, fontWeight: "700", color: "#64748b" },
                  ]}
                >
                  {e.period}
                </Text>
              </View>
              <Text
                style={[
                  pFont,
                  {
                    fontSize: baseSize,
                    fontWeight: "700",
                    color: "#475569",
                    marginBottom: 5,
                  },
                ]}
              >
                {e.company} {e.workType ? `| ${e.workType}` : ""}
              </Text>
              <Text
                style={[
                  pFont,
                  { fontSize: baseSize - 1, color: "#444", lineHeight: baseSize * 1.3 },
                ]}
              >
                • {e.description}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 40 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: 14,
                  fontWeight: "900",
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#000",
                  paddingBottom: 6,
                  letterSpacing: 1.5,
                },
              ]}
            >
              EDUCATION
            </Text>
            <Text style={[pFont, { fontSize: 12, fontWeight: "900" }]}>
              {edu.degree}
            </Text>
            <Text
              style={[pFont, { fontSize: 11, color: "#475569", marginTop: 4 }]}
            >
              {edu.school}
            </Text>
            <Text
              style={[pFont, { fontSize: 11, color: "#94a3b8", marginTop: 4 }]}
            >
              {edu.year}
            </Text>
          </View>
          <View style={{ flex: 1.5 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: 14,
                  fontWeight: "900",
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#000",
                  paddingBottom: 6,
                  letterSpacing: 1.5,
                },
              ]}
            >
              SKILLS
            </Text>
            <Text
              style={[
                pFont,
                { fontSize: 11, lineHeight: 18, color: "#334155" },
              ]}
            >
              {resumeData.skills}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- 2. MODERN ---
export const ModernTemplate = ({
  resumeData,
  selectedFont,
  width = A4_WIDTH,
  height = A4_HEIGHT,
}: TemplateProps) => {
  const pFont = { fontFamily: selectedFont };
  const sidebarColor = "#0f172a";
  const brand = "#3b82f6";
  const exp = SAFE_EXP(resumeData);
  const edu = SAFE_EDU(resumeData);
  const baseSize = GET_BASE_FONT_SIZE(resumeData);

  return (
    <View
      style={{ width, height, backgroundColor: "#fff", flexDirection: "row" }}
    >
      <View
        style={{
          width: Math.round(width * 0.35),
          backgroundColor: sidebarColor,
          padding: 25,
        }}
      >
        {resumeData.photo ? (
          <Image
            source={{ uri: resumeData.photo }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 20,
              alignSelf: "center",
              borderWidth: 3,
              borderColor: brand,
            }}
          />
        ) : (
          <View style={{ height: 30 }} />
        )}

        <View style={{ marginBottom: 30 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 12,
                fontWeight: "900",
                color: "#fff",
                lineHeight: baseSize + 16,
                textTransform: "uppercase",
              },
            ]}
          >
            {(resumeData.name || "").split(" ").join("\n")}
          </Text>
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: brand,
              marginTop: 15,
            }}
          />
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize,
                fontWeight: "900",
                color: brand,
                marginBottom: 12,
                letterSpacing: 1.5,
              },
            ]}
          >
            CONTACT
          </Text>
          <Text
            style={[
              pFont,
              { fontSize: baseSize - 1, color: "#cbd5e1", marginBottom: 8 }
            ]}
          >
            {resumeData.email}
          </Text>
          <Text style={[pFont, { fontSize: baseSize - 1, color: "#cbd5e1" }]}>
            {resumeData.phone}
          </Text>
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize,
                fontWeight: "900",
                color: brand,
                marginBottom: 15,
                letterSpacing: 1.5,
              },
            ]}
          >
            SKILLS
          </Text>
          {(resumeData.skills || "")
            .split(",")
            .slice(0, 12)
            .map((s, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text
                  style={[
                    pFont,
                    { fontSize: baseSize - 1, color: "#fff", marginBottom: 4 },
                  ]}
                >
                  {s.trim()}
                </Text>
                <View
                  style={{
                    height: 3,
                    backgroundColor: "#1e293b",
                    width: "100%",
                    borderRadius: 1.5,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      backgroundColor: brand,
                      width: `${90 - i * 5}%`,
                    }}
                  />
                </View>
              </View>
            ))}
        </View>

        <View style={{ marginTop: "auto" }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize,
                fontWeight: "900",
                color: brand,
                marginBottom: 10,
                letterSpacing: 1.5,
              },
            ]}
          >
            EDUCATION
          </Text>
          <Text
            style={[pFont, { fontSize: baseSize, fontWeight: "900", color: "#fff" }]}
          >
            {edu.degree}
          </Text>
          <Text
            style={[pFont, { fontSize: baseSize - 1, color: "#cbd5e1", marginTop: 4 }]}
          >
            {edu.school}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, padding: 35 }}>
        <View style={{ marginBottom: 30 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 2,
                fontWeight: "900",
                color: "#0f172a",
                marginBottom: 15,
                letterSpacing: 1,
              },
            ]}
          >
            PROFILE
          </Text>
          <Text
            style={[pFont, { fontSize: baseSize, color: "#334155", lineHeight: baseSize * 1.5, textAlign: "justify" }]}
          >
            {resumeData.summary}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 2,
                fontWeight: "900",
                color: "#0f172a",
                marginBottom: 20,
                letterSpacing: 1,
              },
            ]}
          >
            EXPERIENCE
          </Text>
          {exp.slice(0, 5).map((e: any, idx: number) => (
            <View key={idx} style={{ marginBottom: 25 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Text
                  style={[
                    pFont,
                    { fontSize: baseSize + 1, fontWeight: "900", color: "#1e293b" },
                  ]}
                >
                  {e.role}
                </Text>
                <Text
                  style={[
                    pFont,
                    { fontSize: baseSize - 1, fontWeight: "800", color: brand },
                  ]}
                >
                  {e.period}
                </Text>
              </View>
              <Text
                style={[
                  pFont,
                  {
                    fontSize: baseSize,
                    fontWeight: "800",
                    color: "#64748b",
                    marginBottom: 8,
                  },
                ]}
              >
                {e.company} {e.workType ? `| ${e.workType}` : ""}
              </Text>
              <Text
                style={[pFont, { fontSize: baseSize - 1, color: "#444", lineHeight: baseSize * 1.4 }]}
              >
                • {e.description}
              </Text>
            </View>
          ))}

          {resumeData.projects && resumeData.projects.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text
                style={[
                  pFont,
                  {
                    fontSize: 14,
                    fontWeight: "900",
                    color: "#0f172a",
                    marginBottom: 15,
                    letterSpacing: 1,
                  },
                ]}
              >
                PROJECTS
              </Text>
              {resumeData.projects.slice(0, 2).map((p: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 15 }}>
                  <Text style={[pFont, { fontSize: 12, fontWeight: "900", color: "#1e293b" }]}>{p.title}</Text>
                  <Text style={[pFont, { fontSize: 11, color: "#444", marginTop: 4, lineHeight: 15 }]}>{p.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// --- 3. CREATIVE ---
export const CreativeTemplate = ({
  resumeData,
  selectedFont,
  width = A4_WIDTH,
  height = A4_HEIGHT,
}: TemplateProps) => {
  const pFont = { fontFamily: selectedFont };
  const brand = "#d946ef";
  const exp = SAFE_EXP(resumeData);
  const edu = SAFE_EDU(resumeData);
  const baseSize = GET_BASE_FONT_SIZE(resumeData);

  return (
    <View style={{ width, height, backgroundColor: "#fff" }}>
      <View
        style={{
          padding: 35,
          backgroundColor: "#09090b",
          borderBottomWidth: 8,
          borderBottomColor: brand,
          flexDirection: "row",
          alignItems: "center",
          gap: 25,
        }}
      >
        {resumeData.photo ? (
          <Image
            source={{ uri: resumeData.photo }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 3,
              borderColor: brand,
            }}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={[pFont, { fontSize: baseSize + 26, fontWeight: "900", color: "#fff", textTransform: "uppercase" }]}
          >
            {resumeData.name}
          </Text>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 4,
                fontWeight: "700",
                color: brand,
                marginTop: 8,
                letterSpacing: 4,
              },
            ]}
          >
            {(resumeData.title || "").toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={{ padding: 35, flex: 1, flexDirection: "row", gap: 40 }}>
        <View style={{ flex: 1.8 }}>
          <View style={{ marginBottom: 30 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize + 2,
                  fontWeight: "900",
                  color: brand,
                  marginBottom: 15,
                  letterSpacing: 2,
                },
              ]}
            >
              ABOUT ME
            </Text>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize,
                  lineHeight: baseSize * 1.5,
                  color: "#27272a",
                  textAlign: "justify",
                },
              ]}
            >
              {resumeData.summary}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize + 2,
                  fontWeight: "900",
                  color: brand,
                  marginBottom: 20,
                  letterSpacing: 2,
                },
              ]}
            >
              EXPERIENCE
            </Text>
            {exp.slice(0, 5).map((e: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 20 }}>
                <Text
                  style={[
                    pFont,
                    { fontSize: baseSize + 1, fontWeight: "900", color: "#09090b" },
                  ]}
                >
                  {e.role}
                </Text>
                <Text
                  style={[
                    pFont,
                    {
                      fontSize: baseSize - 1,
                      color: brand,
                      fontWeight: "800",
                      marginVertical: 4,
                    },
                  ]}
                >
                  {e.company} | {e.period}
                </Text>
                <Text
                  style={[
                    pFont,
                    { fontSize: baseSize - 1, lineHeight: baseSize * 1.4, color: "#444" },
                  ]}
                >
                  • {e.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 45 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize + 4,
                  fontWeight: "900",
                  color: brand,
                  marginBottom: 20,
                },
              ]}
            >
              SKILLS
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {(resumeData.skills || "")
                .split(",")
                .slice(0, 15)
                .map((s, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: "#fafafa",
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#f4f4f5",
                    }}
                  >
                    <Text
                      style={[
                        pFont,
                        { fontSize: baseSize - 1, fontWeight: "800", color: brand },
                      ]}
                    >
                      {s.trim()}
                    </Text>
                  </View>
                ))}
            </View>
          </View>

          <View style={{ marginBottom: 35 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize + 2,
                  fontWeight: "900",
                  color: brand,
                  marginBottom: 15,
                },
              ]}
            >
              PROJECTS
            </Text>
            {SAFE_PROJ(resumeData).slice(0, 3).map((p: any, i: number) => (
              <View key={p.id || i} style={{ marginBottom: 12 }}>
                <Text style={[pFont, { fontSize: baseSize + 0.5, fontWeight: "900", color: "#09090b" }]}>{p.title}</Text>
                <Text style={[pFont, { fontSize: baseSize - 1.5, color: "#444", marginTop: 4 }]}>{p.description}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginBottom: 35 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize + 2,
                  fontWeight: "900",
                  color: brand,
                  marginBottom: 15,
                },
              ]}
            >
              EDUCATION
            </Text>
            <Text
              style={[
                pFont,
                { fontSize: baseSize, fontWeight: "900", color: "#09090b" },
              ]}
            >
              {edu.degree}
            </Text>
            <Text
              style={[pFont, { fontSize: baseSize - 1, color: "#71717a", marginTop: 6 }]}
            >
              {edu.school}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- 4. PROFESSIONAL ---
export const ProfessionalTemplate = ({
  resumeData,
  selectedFont,
  width = A4_WIDTH,
  height = A4_HEIGHT,
}: TemplateProps) => {
  const pFont = { fontFamily: selectedFont };
  const brand = "#1e3a8a";
  const sidebarLite = "#f8fafc";
  const exp = SAFE_EXP(resumeData);
  const edu = SAFE_EDU(resumeData);
  const baseSize = GET_BASE_FONT_SIZE(resumeData);

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: "#fff",
        flexDirection: "row",
        borderLeftWidth: 12,
        borderLeftColor: brand,
      }}
    >
      <View style={{ flex: 1.8, padding: 35 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 35,
            gap: 25,
          }}
        >
          {resumeData.photo ? (
            <Image
              source={{ uri: resumeData.photo }}
              style={{ width: 90, height: 90, borderRadius: 8 }}
            />
          ) : null}
          <View>
            <Text
              style={[pFont, { fontSize: baseSize + 22, fontWeight: "900", color: brand }]}
            >
              {resumeData.name}
            </Text>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize + 4,
                  fontWeight: "700",
                  color: "#475569",
                  marginTop: 6,
                  letterSpacing: 1,
                },
              ]}
            >
              {resumeData.title}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 25 }}>
            <Text
              style={[
                pFont,
                {
                  fontSize: baseSize + 2,
                  fontWeight: "900",
                  color: "#111827",
                  marginBottom: 15,
                  borderBottomWidth: 3,
                  borderBottomColor: brand,
                  alignSelf: "flex-start",
                  paddingRight: 30,
                  paddingBottom: 6,
                },
              ]}
            >
              EXPERIENCE
            </Text>
            {exp.slice(0, 5).map((e: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={[
                      pFont,
                      { fontSize: baseSize + 1, fontWeight: "900", color: "#111827" },
                    ]}
                  >
                    {e.role}
                  </Text>
                  <Text
                    style={[
                      pFont,
                      { fontSize: baseSize - 1, fontWeight: "800", color: brand },
                    ]}
                  >
                    {e.period}
                  </Text>
                </View>
                <Text
                  style={[
                    pFont,
                    {
                      fontSize: baseSize,
                      fontWeight: "700",
                      color: "#64748b",
                      marginVertical: 4,
                    },
                  ]}
                >
                  {e.company} {e.workType ? `| ${e.workType}` : ""}
                </Text>
                <Text
                  style={[pFont, { fontSize: baseSize - 1, color: "#444", lineHeight: baseSize * 1.4 }]}
                >
                  • {e.description}
                </Text>
              </View>
            ))}
          </View>

          {resumeData.projects && resumeData.projects.length > 0 && (
            <View>
              <Text
                style={[
                  pFont,
                  {
                    fontSize: baseSize + 2,
                    fontWeight: "900",
                    color: "#0f172a",
                    marginBottom: 15,
                    borderBottomWidth: 3,
                    borderBottomColor: brand,
                    alignSelf: "flex-start",
                    paddingRight: 30,
                    paddingBottom: 6,
                  },
                ]}
              >
                PROJECTS
              </Text>
              {resumeData.projects.slice(0, 2).map((p: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 15 }}>
                  <Text style={[pFont, { fontSize: baseSize, fontWeight: "900", color: "#111827" }]}>{p.title}</Text>
                  <Text style={[pFont, { fontSize: baseSize - 1, color: "#444", marginTop: 4, lineHeight: baseSize * 1.3 }]}>{p.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          width: Math.round(width * 0.35),
          backgroundColor: sidebarLite,
          padding: 30,
          borderLeftWidth: 1,
          borderLeftColor: "#e2e8f0",
        }}
      >
        <View style={{ marginBottom: 35 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 2,
                fontWeight: "900",
                color: brand,
                marginBottom: 15,
                letterSpacing: 1.5,
              },
            ]}
          >
            CONTACT
          </Text>
          <Text
            style={[
              pFont,
              { fontSize: baseSize - 1, color: "#1e3a8a", marginBottom: 8, wordBreak: "break-all" },
            ]}
          >
            {resumeData.email}
          </Text>
          <Text style={[pFont, { fontSize: baseSize - 1, color: "#1e3a8a" }]}>
            {resumeData.phone}
          </Text>
        </View>

        <View style={{ marginBottom: 35 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 2,
                fontWeight: "900",
                color: brand,
                marginBottom: 15,
                letterSpacing: 1.5,
              },
            ]}
          >
            EDUCATION
          </Text>
          <Text
            style={[
              pFont,
              { fontSize: baseSize + 2, fontWeight: "900", color: "#1e3a8a" },
            ]}
          >
            {edu.degree}
          </Text>
          <Text
            style={[pFont, { fontSize: baseSize - 1, color: "#64748b", marginTop: 4 }]}
          >
            {edu.school}
          </Text>
          <Text
            style={[
              pFont,
              { fontSize: baseSize - 1, color: brand, marginTop: 4, fontWeight: "800" },
            ]}
          >
            {edu.year}
          </Text>
        </View>

        <View style={{ marginBottom: 35 }}>
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize + 2,
                fontWeight: "900",
                color: brand,
                marginBottom: 18,
                letterSpacing: 1.5,
              },
            ]}
          >
            SKILLS
          </Text>
          {(resumeData.skills || "").split(",").map((s, i) => (
            <View
              key={i}
              style={{
                marginBottom: 12,
                paddingLeft: 12,
                borderLeftWidth: 2,
                borderLeftColor: brand,
              }}
            >
              <Text
                style={[
                  pFont,
                  { fontSize: baseSize - 1, color: "#1e3a8a", fontWeight: "900" },
                ]}
              >
                {s.trim()}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: brand,
            padding: 15,
            borderRadius: 12,
            marginTop: "auto",
          }}
        >
          <Text
            style={[
              pFont,
              {
                fontSize: baseSize - 1,
                color: "#fff",
                textAlign: "center",
                lineHeight: baseSize * 1.3,
                fontWeight: "800",
              },
            ]}
          >
            Ready for new challenges.
          </Text>
        </View>
      </View>
    </View>
  );
};
