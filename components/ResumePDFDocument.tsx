import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Note: In a real app, you'd register your custom Google Fonts here
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: '12mm', // Standard A4 margin
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    objectFit: 'cover',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000000',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    fontSize: 10,
    color: '#334155',
  },
  contactDivider: {
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
    color: '#334155',
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  periodText: {
    fontSize: 9,
    color: '#64748b',
  },
  companyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 2,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 10,
    color: '#444444',
    lineHeight: 1.4,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  }
});

type Props = {
  data: any;
};

export const ExecutivePDF = ({ data }: Props) => (
  <Document title={`${data.name}_Resume`}>
    <Page size="A4" style={styles.page}>
      {/* Header Section */}
      <View style={styles.header}>
        {data.photo && <Image src={data.photo} style={styles.profilePhoto} />}
        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.contactRow}>
          <Text>{data.email}</Text>
          <Text style={styles.contactDivider}>|</Text>
          <Text>{data.phone}</Text>
        </View>
      </View>

      {/* Summary */}
      <View>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.summary}>{data.summary}</Text>
      </View>

      {/* Experience */}
      <View>
        <Text style={styles.sectionTitle}>Experience</Text>
        {data.experience?.map((exp: any, index: number) => (
          <View key={index} style={styles.experienceItem}>
            <View style={styles.experienceHeader}>
              <Text style={styles.roleText}>{exp.role}</Text>
              <Text style={styles.periodText}>{exp.period}</Text>
            </View>
            <Text style={styles.companyText}>{exp.company}</Text>
            <Text style={styles.descriptionText}>• {exp.description}</Text>
          </View>
        ))}
      </View>

      {/* Skills & Education */}
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <View style={{ flex: 1, paddingRight: 20 }}>
          <Text style={styles.sectionTitle}>Education</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{data.education?.degree}</Text>
          <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{data.education?.school}</Text>
          <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{data.education?.year}</Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.skillText}>{data.skills}</Text>
        </View>
      </View>
    </Page>
  </Document>
);
