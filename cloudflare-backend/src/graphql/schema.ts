export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Query {
    health: String!
    me: Me
    atsReport(id: ID!): AtsReport
    atsReports(limit: Int = 20, offset: Int = 0): [AtsReport!]!
    resumeRecord(id: ID!): ResumeRecord
    resumeRecords(limit: Int = 20, offset: Int = 0): [ResumeRecord!]!
    usageStatus(periodKey: String): UsageStatus
  }

  type Mutation {
    """Extracted text is produced on-device and sent here for server-side AI analysis. Never send resume binaries."""
    submitAtsAnalysis(input: SubmitAtsAnalysisInput!): SubmitAtsAnalysisResult!
    upsertResumeRecord(input: UpsertResumeRecordInput!): ResumeRecord!
  }

  type Me {
    id: ID!
    email: String
    name: String
    isPro: Boolean!
    isPremium: Boolean!
    resumeLimit: Int!
    plan: String
  }

  type ResumeRecord {
    id: ID!
    clientResumeId: String
    resumeName: String!
    fileType: String
    fileSize: Int
    textExtractionStatus: String!
    createdAt: String!
    updatedAt: String!
  }

  type AtsReport {
    id: ID!
    resumeRecordId: ID
    jobDescriptionId: ID
    atsScore: Int
    analysis: JSON
    missingKeywords: JSON
    skillsAnalysis: JSON
    improvementSuggestions: JSON
    jobCompatibilityScore: Int
    createdAt: String!
  }

  type SubmitAtsAnalysisResult {
    report: AtsReport!
    resumeRecord: ResumeRecord
    jobDescriptionId: ID
  }

  type UsageStatus {
    periodKey: String!
    atsRequestsCount: Int!
    aiTokensEstimate: Int!
  }

  input SubmitAtsAnalysisInput {
    clientResumeId: String
    resumeName: String!
    fileType: String
    fileSize: Int
    extractedText: String!
    storeExtractedText: Boolean = false
    jobTitle: String
    company: String
    jobDescription: String
    sourceUrl: String
  }

  input UpsertResumeRecordInput {
    id: ID
    clientResumeId: String
    resumeName: String!
    fileType: String
    fileSize: Int
    textExtractionStatus: String
    extractedText: String
    storeExtractedText: Boolean = false
  }
`;
