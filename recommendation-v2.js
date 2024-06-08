const natural = require("natural");

// Preprocess text
function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

// Convert text to bag-of-words representation, collection of words
function textToBagOfWords(text) {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(preprocessText(text));
  const bagOfWords = {};
  tokens.forEach((token) => {
    bagOfWords[token] = (bagOfWords[token] || 0) + 1;
  });
  return bagOfWords;
}

// Compute cosine similarity
function cosineSimilarity(bow1, bow2) {
  // Taking unique terms with union
  const union = new Set([...Object.keys(bow1), ...Object.keys(bow2)]);

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const term of union) {
    const freq1 = bow1[term] || 0;
    const freq2 = bow2[term] || 0;
    dotProduct += freq1 * freq2;
    norm1 += freq1 * freq1;
    norm2 += freq2 * freq2;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

async function generateRecommendations(user, projects) {
  // Convert user skills and interests to bag-of-words, consider it as text as a collection of its words,
  const skillBags = user.skills.map((text) => textToBagOfWords(text));
  const interestBags = user.interests.map((text) => textToBagOfWords(text));

  // Calculate recommendations,
  const recommendations = projects.map((project) => {
    const projectBag = textToBagOfWords(
      `${project.title} ${project.description}`
    );
    const skillSimilarities = skillBags.map((skillBag) =>
      cosineSimilarity(skillBag, projectBag)
    );
    const interestSimilarities = interestBags.map((interestBag) =>
      cosineSimilarity(interestBag, projectBag)
    );
    const overallSimilarity = [
      ...skillSimilarities,
      ...interestSimilarities,
    ].reduce((a, b) => a + b, 0);
    return { project, overallSimilarity };
  });

  // nomral sorting
  recommendations.sort((a, b) => b.overallSimilarity - a.overallSimilarity);
  return recommendations.map(({ project }) => project);
}

// Example usage
const user = {
  skills: ["Swift"],
  interests: ["Web"],
};

const projects = [
  {
    id: 2,
    title: "ML Image Classifier",
    description:
      "A machine learning model to classify images using TensorFlow.",
  },
  {
    id: 3,
    title: "iOS Mobile Game",
    description: "A 2D platformer game developed in Swift for iOS devices.",
  },
  {
    id: 1,
    title: "Advanced Webite App",
    description:
      "A full-stack web application using React, Node.js, and MongoDB.",
  },
];

generateRecommendations(user, projects)
  .then((recommendations) => console.log(recommendations))
  .catch((error) => console.error("Error:", error));
