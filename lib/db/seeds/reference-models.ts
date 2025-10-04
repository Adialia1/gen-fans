import { db } from '../drizzle';
import { referenceModels } from '../schema';

export async function seedReferenceModels() {
  console.log('Seeding reference models...');

  const models = [
    // Fashion Models (20)
    {
      name: 'Sophia - High Fashion',
      category: 'fashion',
      description: 'Elite runway model with versatile high-fashion looks',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/sophia-1.jpg'],
      characteristics: { ageRange: '20-30', style: 'high-fashion', bodyType: 'athletic' },
      complexityFactor: '1.5',
      popularityScore: 100,
    },
    {
      name: 'Isabella - Editorial',
      category: 'fashion',
      description: 'Editorial fashion model specializing in avant-garde shoots',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/isabella-1.jpg'],
      characteristics: { ageRange: '25-35', style: 'editorial', bodyType: 'slender' },
      complexityFactor: '1.8',
      popularityScore: 95,
    },
    {
      name: 'Olivia - Commercial',
      category: 'fashion',
      description: 'Commercial fashion model for lifestyle brands',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/olivia-1.jpg'],
      characteristics: { ageRange: '20-28', style: 'commercial', bodyType: 'fit' },
      complexityFactor: '1.2',
      popularityScore: 90,
    },
    {
      name: 'Emma - Streetwear',
      category: 'fashion',
      description: 'Urban streetwear and athleisure model',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/emma-1.jpg'],
      characteristics: { ageRange: '18-25', style: 'streetwear', bodyType: 'athletic' },
      complexityFactor: '1.3',
      popularityScore: 85,
    },
    {
      name: 'Ava - Luxury',
      category: 'fashion',
      description: 'Luxury brand ambassador and haute couture model',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/ava-1.jpg'],
      characteristics: { ageRange: '25-35', style: 'luxury', bodyType: 'slender' },
      complexityFactor: '2.0',
      popularityScore: 98,
    },

    // Fitness Influencers (15)
    {
      name: 'Mia - Yoga Instructor',
      category: 'fitness',
      description: 'Yoga and mindfulness fitness influencer',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/mia-1.jpg'],
      characteristics: { ageRange: '25-35', style: 'yoga', bodyType: 'toned' },
      complexityFactor: '1.4',
      popularityScore: 88,
    },
    {
      name: 'Charlotte - CrossFit Athlete',
      category: 'fitness',
      description: 'Competitive CrossFit athlete and trainer',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/charlotte-1.jpg'],
      characteristics: { ageRange: '25-32', style: 'crossfit', bodyType: 'muscular' },
      complexityFactor: '1.6',
      popularityScore: 92,
    },
    {
      name: 'Amelia - Wellness Coach',
      category: 'fitness',
      description: 'Holistic wellness and nutrition coach',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/amelia-1.jpg'],
      characteristics: { ageRange: '28-38', style: 'wellness', bodyType: 'fit' },
      complexityFactor: '1.3',
      popularityScore: 80,
    },
    {
      name: 'Harper - Running Enthusiast',
      category: 'fitness',
      description: 'Marathon runner and endurance athlete',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/harper-1.jpg'],
      characteristics: { ageRange: '22-30', style: 'running', bodyType: 'lean' },
      complexityFactor: '1.2',
      popularityScore: 75,
    },
    {
      name: 'Evelyn - Strength Training',
      category: 'fitness',
      description: 'Powerlifter and strength training specialist',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/evelyn-1.jpg'],
      characteristics: { ageRange: '25-35', style: 'strength', bodyType: 'strong' },
      complexityFactor: '1.7',
      popularityScore: 87,
    },

    // Beauty Creators (15)
    {
      name: 'Abigail - Makeup Artist',
      category: 'beauty',
      description: 'Professional makeup artist and beauty educator',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/abigail-1.jpg'],
      characteristics: { ageRange: '22-32', style: 'makeup', bodyType: 'average' },
      complexityFactor: '1.5',
      popularityScore: 93,
    },
    {
      name: 'Emily - Skincare Expert',
      category: 'beauty',
      description: 'Skincare specialist and clean beauty advocate',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/emily-1.jpg'],
      characteristics: { ageRange: '25-35', style: 'skincare', bodyType: 'average' },
      complexityFactor: '1.3',
      popularityScore: 89,
    },
    {
      name: 'Madison - Hair Stylist',
      category: 'beauty',
      description: 'Celebrity hair stylist and color specialist',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/madison-1.jpg'],
      characteristics: { ageRange: '24-34', style: 'hair', bodyType: 'average' },
      complexityFactor: '1.4',
      popularityScore: 86,
    },
    {
      name: 'Elizabeth - Natural Beauty',
      category: 'beauty',
      description: 'Natural and organic beauty product reviewer',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/elizabeth-1.jpg'],
      characteristics: { ageRange: '28-38', style: 'natural', bodyType: 'average' },
      complexityFactor: '1.2',
      popularityScore: 82,
    },
    {
      name: 'Avery - Glam Creator',
      category: 'beauty',
      description: 'Glamorous makeup and fashion beauty creator',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/avery-1.jpg'],
      characteristics: { ageRange: '20-28', style: 'glam', bodyType: 'average' },
      complexityFactor: '1.6',
      popularityScore: 94,
    },

    // Lifestyle Influencers (10)
    {
      name: 'Sofia - Travel Blogger',
      category: 'lifestyle',
      description: 'Luxury travel and adventure lifestyle blogger',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/sofia-1.jpg'],
      characteristics: { ageRange: '25-35', style: 'travel', bodyType: 'fit' },
      complexityFactor: '1.5',
      popularityScore: 91,
    },
    {
      name: 'Victoria - Mommy Blogger',
      category: 'lifestyle',
      description: 'Family lifestyle and parenting content creator',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/victoria-1.jpg'],
      characteristics: { ageRange: '28-40', style: 'family', bodyType: 'average' },
      complexityFactor: '1.2',
      popularityScore: 84,
    },
    {
      name: 'Grace - Food & Cooking',
      category: 'lifestyle',
      description: 'Food blogger and recipe developer',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/grace-1.jpg'],
      characteristics: { ageRange: '25-38', style: 'food', bodyType: 'average' },
      complexityFactor: '1.3',
      popularityScore: 88,
    },
    {
      name: 'Chloe - Home Decor',
      category: 'lifestyle',
      description: 'Interior design and home organization expert',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/chloe-1.jpg'],
      characteristics: { ageRange: '30-45', style: 'home', bodyType: 'average' },
      complexityFactor: '1.1',
      popularityScore: 79,
    },
    {
      name: 'Zoe - Sustainable Living',
      category: 'lifestyle',
      description: 'Eco-friendly lifestyle and zero-waste advocate',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/zoe-1.jpg'],
      characteristics: { ageRange: '24-34', style: 'sustainable', bodyType: 'average' },
      complexityFactor: '1.4',
      popularityScore: 83,
    },

    // Business Professionals (10)
    {
      name: 'Alexandra - Tech Entrepreneur',
      category: 'business',
      description: 'Tech startup founder and innovation speaker',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/alexandra-1.jpg'],
      characteristics: { ageRange: '28-40', style: 'tech', bodyType: 'average' },
      complexityFactor: '1.3',
      popularityScore: 87,
    },
    {
      name: 'Natalie - Executive Coach',
      category: 'business',
      description: 'Leadership coach and corporate trainer',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/natalie-1.jpg'],
      characteristics: { ageRange: '35-50', style: 'corporate', bodyType: 'average' },
      complexityFactor: '1.2',
      popularityScore: 81,
    },
    {
      name: 'Hannah - Finance Expert',
      category: 'business',
      description: 'Financial advisor and investment strategist',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/hannah-1.jpg'],
      characteristics: { ageRange: '30-45', style: 'finance', bodyType: 'average' },
      complexityFactor: '1.1',
      popularityScore: 78,
    },
    {
      name: 'Lily - Marketing Guru',
      category: 'business',
      description: 'Digital marketing strategist and brand consultant',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/lily-1.jpg'],
      characteristics: { ageRange: '25-38', style: 'marketing', bodyType: 'average' },
      complexityFactor: '1.3',
      popularityScore: 85,
    },
    {
      name: 'Scarlett - Legal Professional',
      category: 'business',
      description: 'Corporate attorney and legal consultant',
      previewImages: ['https://placeholder-ref-models.s3.amazonaws.com/scarlett-1.jpg'],
      characteristics: { ageRange: '30-45', style: 'legal', bodyType: 'average' },
      complexityFactor: '1.2',
      popularityScore: 76,
    },
  ];

  try {
    await db.insert(referenceModels).values(models);
    console.log(`✓ Seeded ${models.length} reference models`);
  } catch (error) {
    console.error('Error seeding reference models:', error);
    throw error;
  }
}
