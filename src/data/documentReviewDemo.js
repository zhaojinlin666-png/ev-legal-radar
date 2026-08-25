export const demoDocument = {
  title: 'EV Connect App Privacy Notice — Demo',
  type: 'Demo Privacy Notice',
  disclaimer:
    'For testing and demonstration purposes only. This document does not represent any real company policy.',
  sections: [
    {
      title: '1. Information We Collect',
      introduction: 'The EV Connect App may collect:',
      bullets: [
        'Account information, including name and mobile number;',
        'Vehicle identification information;',
        'Vehicle location data;',
        'Driving records;',
        'In-app usage information.',
      ],
    },
    {
      title: '2. Purpose of Processing',
      introduction: 'The above information may be processed for:',
      bullets: [
        'User account management;',
        'Vehicle status display;',
        'Navigation and location-based services;',
        'Service improvement and troubleshooting.',
      ],
    },
    {
      title: '3. Collection Scenarios',
      paragraphs: [
        'Location information may be collected when users activate navigation or vehicle-location functions.',
        'Users may disable location permissions through the mobile device settings.',
      ],
    },
    {
      title: '4. Storage',
      paragraphs: [
        'Personal information collected in China is stored on servers located in China.',
      ],
    },
    {
      title: '5. User Rights',
      paragraphs: [
        'Users may access, correct or delete certain personal information through the Privacy Center within the App.',
      ],
    },
  ],
}

export const documentReviewBasis = {
  title: '汽车数据安全管理若干规定（试行）',
  article: 'Article 7',
  verificationStatus: 'Source Verified',
}

export const documentReviewResults = [
  {
    reviewItem: 'Information categories disclosed',
    result: 'Found',
    evidence: 'Section 1 — Information We Collect',
    observation:
      'The document identifies account information, vehicle identification information, vehicle location data, driving records and in-app usage information.',
    potentialGap: null,
  },
  {
    reviewItem: 'Collection scenarios disclosed',
    result: 'Found',
    evidence: 'Section 3 — Collection Scenarios',
    observation:
      'The document explains that location information may be collected when navigation or vehicle-location functions are activated.',
    potentialGap: null,
  },
  {
    reviewItem: 'Method to stop collection disclosed',
    result: 'Found',
    evidence: 'Section 3 — Collection Scenarios',
    observation:
      'The document states that users may disable location permissions through mobile device settings.',
    potentialGap: null,
  },
  {
    reviewItem: 'Processing purposes disclosed',
    result: 'Found',
    evidence: 'Section 2 — Purpose of Processing',
    observation:
      'The document identifies account management, vehicle status display, navigation, location-based services, service improvement and troubleshooting as processing purposes.',
    potentialGap: null,
  },
  {
    reviewItem: 'Storage location disclosed',
    result: 'Found',
    evidence: 'Section 4 — Storage',
    observation:
      'The document states that personal information collected in China is stored on servers located in China.',
    potentialGap: null,
  },
  {
    reviewItem: 'Retention period disclosed',
    result: 'Not identified',
    evidence: 'None',
    observation:
      'No explicit retention period or rule for determining the retention period was identified in the reviewed text.',
    potentialGap: {
      legalBasis: 'Article 7',
      recommendedReviewAction:
        'Verify whether retention information is disclosed in another user-facing notice, privacy policy or related document.',
      verificationStatus: 'AI-generated',
    },
  },
  {
    reviewItem: 'User rights mechanism disclosed',
    result: 'Found',
    evidence: 'Section 5 — User Rights',
    observation:
      'The document provides a mechanism for users to access, correct or delete certain personal information through the Privacy Center.',
    potentialGap: null,
  },
  {
    reviewItem: 'Privacy contact information disclosed',
    result: 'Not identified',
    evidence: 'None',
    observation:
      'No user-rights contact person or contact information was identified in the reviewed text.',
    potentialGap: {
      legalBasis: 'Article 7',
      recommendedReviewAction:
        'Verify whether user-rights contact information is provided in another privacy notice, help center or rights-request channel.',
      verificationStatus: 'AI-generated',
    },
  },
]
