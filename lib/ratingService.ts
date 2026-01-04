// Rating Service
// Handles ratings for farmers and verifiers

import { supabase } from './supabase';

function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

export interface Rating {
  id?: string;
  rater_id: string;
  rated_user_id?: string;
  rated_farmer_id?: string;
  rating_type: 'farmer' | 'verifier' | 'buyer';
  rating: number; // 1-5
  review?: string;
  contract_id?: string;
  milestone_id?: string;
  verification_id?: string;
  quality_rating?: number;
  communication_rating?: number;
  timeliness_rating?: number;
  professionalism_rating?: number;
  created_at?: string;
}

export interface RatingSummary {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryAverages?: {
    quality: number;
    communication: number;
    timeliness: number;
    professionalism: number;
  };
}

// Submit a rating
export async function submitRating(rating: Omit<Rating, 'id' | 'created_at'>): Promise<Rating> {
  const client = checkSupabase();
  
  const { data, error } = await client
    .from('ratings')
    .insert(rating)
    .select()
    .single();

  if (error) throw error;

  // Update the rated entity's average rating
  if (rating.rating_type === 'farmer' && rating.rated_farmer_id) {
    await updateFarmerRating(rating.rated_farmer_id);
  } else if (rating.rating_type === 'verifier' && rating.rated_user_id) {
    await updateVerifierRating(rating.rated_user_id);
  }

  return data;
}

// Get ratings for a farmer
export async function getFarmerRatings(farmerId: string): Promise<Rating[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('ratings')
    .select('*')
    .eq('rated_farmer_id', farmerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get ratings for a verifier
export async function getVerifierRatings(userId: string): Promise<Rating[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('ratings')
    .select('*')
    .eq('rated_user_id', userId)
    .eq('rating_type', 'verifier')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Calculate rating summary for a farmer
export async function getFarmerRatingSummary(farmerId: string): Promise<RatingSummary> {
  const ratings = await getFarmerRatings(farmerId);
  return calculateRatingSummary(ratings);
}

// Calculate rating summary for a verifier
export async function getVerifierRatingSummary(userId: string): Promise<RatingSummary> {
  const ratings = await getVerifierRatings(userId);
  return calculateRatingSummary(ratings);
}

// Calculate rating summary from ratings array
function calculateRatingSummary(ratings: Rating[]): RatingSummary {
  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;
  let qualitySum = 0, qualityCount = 0;
  let commSum = 0, commCount = 0;
  let timeSum = 0, timeCount = 0;
  let profSum = 0, profCount = 0;

  ratings.forEach(r => {
    totalRating += r.rating;
    breakdown[r.rating as keyof typeof breakdown]++;
    
    if (r.quality_rating) { qualitySum += r.quality_rating; qualityCount++; }
    if (r.communication_rating) { commSum += r.communication_rating; commCount++; }
    if (r.timeliness_rating) { timeSum += r.timeliness_rating; timeCount++; }
    if (r.professionalism_rating) { profSum += r.professionalism_rating; profCount++; }
  });

  return {
    averageRating: Math.round((totalRating / ratings.length) * 10) / 10,
    totalRatings: ratings.length,
    ratingBreakdown: breakdown,
    categoryAverages: {
      quality: qualityCount > 0 ? Math.round((qualitySum / qualityCount) * 10) / 10 : 0,
      communication: commCount > 0 ? Math.round((commSum / commCount) * 10) / 10 : 0,
      timeliness: timeCount > 0 ? Math.round((timeSum / timeCount) * 10) / 10 : 0,
      professionalism: profCount > 0 ? Math.round((profSum / profCount) * 10) / 10 : 0,
    },
  };
}

// Update farmer's average rating in farmers table
async function updateFarmerRating(farmerId: string): Promise<void> {
  const client = checkSupabase();
  const summary = await getFarmerRatingSummary(farmerId);
  
  await client
    .from('farmers')
    .update({
      rating: summary.averageRating,
      total_ratings: summary.totalRatings,
    })
    .eq('id', farmerId);
}

// Update verifier's average rating in extension_officers table
async function updateVerifierRating(userId: string): Promise<void> {
  const client = checkSupabase();
  const summary = await getVerifierRatingSummary(userId);
  
  // Update in extension_officers table
  await client
    .from('extension_officers')
    .update({
      rating: summary.averageRating,
      total_ratings: summary.totalRatings,
    })
    .eq('user_id', userId);

  // Also update in users table
  await client
    .from('users')
    .update({
      rating: summary.averageRating,
      total_ratings: summary.totalRatings,
    })
    .eq('id', userId);
}

// Check if user has already rated
export async function hasUserRated(
  raterId: string,
  ratedId: string,
  ratingType: 'farmer' | 'verifier',
  contextId?: string // contract_id or verification_id
): Promise<boolean> {
  const client = checkSupabase();
  
  let query = client
    .from('ratings')
    .select('id')
    .eq('rater_id', raterId)
    .eq('rating_type', ratingType);

  if (ratingType === 'farmer') {
    query = query.eq('rated_farmer_id', ratedId);
  } else {
    query = query.eq('rated_user_id', ratedId);
  }

  if (contextId) {
    query = query.or(`contract_id.eq.${contextId},verification_id.eq.${contextId}`);
  }

  const { data, error } = await query.single();
  
  if (error && error.code === 'PGRST116') return false;
  if (error) throw error;
  return !!data;
}

// Get top rated farmers
export async function getTopRatedFarmers(limit: number = 10): Promise<any[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('farmers')
    .select('*')
    .gte('total_ratings', 3) // At least 3 ratings
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Get top rated verifiers
export async function getTopRatedVerifiers(limit: number = 10): Promise<any[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('extension_officers')
    .select('*')
    .gte('total_ratings', 3)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
