/**
 * Utility functions for calculating and managing user badges based on skill scores
 */

/**
 * Calculate average skill score from user's skillScores array
 * @param {Array} skillScores - Array of skill score objects [{skill, score}]
 * @returns {number} Average skill score (0-100)
 */
const calculateAverageSkillScore = (skillScores = []) => {
  if (!Array.isArray(skillScores) || skillScores.length === 0) {
    return 0;
  }

  const totalScore = skillScores.reduce((sum, item) => {
    // Ensure score is a number and clamp between 0-100
    const score = Math.max(0, Math.min(100, Number(item.score) || 0));
    return sum + score;
  }, 0);

  const avg = totalScore / skillScores.length;
  return Math.round(avg * 100) / 100; // Round to 2 decimal places
};

/**
 * Get badge object based on average skill score
 * @param {number} avg - Average skill score (0-100)
 * @returns {Object} Badge object { name, icon }
 */
const getBadgeFromAvg = (avg) => {
  // Clamp the average to valid range
  const clampedAvg = Math.max(0, Math.min(100, avg));

  if (clampedAvg < 20) {
    return {
      name: "Beginner",
      icon: "bi bi-star"
    };
  } else if (clampedAvg < 40) {
    return {
      name: "Intermediate", 
      icon: "bi bi-lightning-charge"
    };
  } else if (clampedAvg < 60) {
    return {
      name: "Pro",
      icon: "bi bi-patch-check"
    };
  } else if (clampedAvg < 80) {
    return {
      name: "Expert",
      icon: "bi bi-trophy"
    };
  } else {
    return {
      name: "Master",
      icon: "bi bi-gem"
    };
  }
};

/**
 * Apply badge to user based on their skill scores
 * @param {Object} user - User object with skillScores property
 * @returns {Object} Updated user object with avgSkillScore and badge
 */
const applyBadgeToUser = (user) => {
  // Calculate average skill score
  const avgSkillScore = calculateAverageSkillScore(user.skillScores);
  
  // Get badge based on average
  const badge = getBadgeFromAvg(avgSkillScore);
  
  // Update user object
  user.avgSkillScore = avgSkillScore;
  user.badge = {
    ...badge,
    updatedAt: new Date()
  };
  
  return user;
};

module.exports = {
  calculateAverageSkillScore,
  getBadgeFromAvg,
  applyBadgeToUser
};