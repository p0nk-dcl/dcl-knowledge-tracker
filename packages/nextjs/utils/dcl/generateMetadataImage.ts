export interface NFTMetadata {
  authorName: string;
  authorWallet: string;
  title: string;
  contributors: string;
  tags: string;
  copublisherFees: string,
  url: string;
  existingWorkId: string;
  mediaType: string;
  mediaUrl: string;
  createdAt: string;
}

export function generateNFTMetadataImage(metadata: NFTMetadata): string {
  const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <rect width="1200" height="630" fill="#f0f0f0"/>
        <text x="50" y="50" font-family="Arial" font-size="48" font-weight="bold" fill="#333">${escapeXml(metadata.title)}</text>
        ${generateMetadataFields(metadata)}
      </svg>
    `;

  return svgContent.trim();
}

function generateMetadataFields(metadata: NFTMetadata): string {
  const fields = [
    { label: 'Author:', value: metadata.authorName },
    { label: 'Author Wallet:', value: metadata.authorWallet },
    { label: 'Contributors:', value: metadata.contributors },
    { label: 'Tags:', value: metadata.tags },
    { label: 'CoPublisher Fees:', value: metadata.copublisherFees },
    { label: 'URL:', value: metadata.url },
    { label: 'Existing Work ID:', value: metadata.existingWorkId || 'N/A' },
    { label: 'Media Type:', value: metadata.mediaType },
    { label: 'Created At:', value: metadata.createdAt },
    { label: 'Media URL:', value: truncateUrl(metadata.mediaUrl, 80) },
  ];

  return fields.map((field, index) => `
      <text x="50" y="${120 + index * 35}" font-family="Arial" font-size="16" fill="#333">
        <tspan font-weight="bold">${escapeXml(field.label)}</tspan>
        <tspan dx="5">${escapeXml(field.value)}</tspan>
      </text>
    `).join('');
}

function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url;
  const half = Math.floor(maxLength / 2) - 2;
  return url.slice(0, half) + '...' + url.slice(-half);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}