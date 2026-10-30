import React from 'react';
import './BadgeChip.css';

const BadgeChip = ({ badgeName, badgeIcon, avgScore }) => {
  // Determine the style based on badge name
  const getBadgeStyle = () => {
    switch (badgeName?.toLowerCase()) {
      case 'beginner':
        return 'beginner';
      case 'intermediate':
        return 'intermediate';
      case 'pro':
        return 'pro';
      case 'expert':
        return 'expert';
      case 'master':
        return 'master';
      default:
        return 'beginner'; // default fallback
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <div className={`badge-chip ${badgeStyle}`}>
      <i className={badgeIcon}></i>
      <span className="badge-name">{badgeName}</span>
      <span className="badge-score">({avgScore}%)</span>
    </div>
  );
};

export default BadgeChip;