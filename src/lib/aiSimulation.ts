/**
 * Rule-based AI simulation for environmental danger recommendations
 * Provides safety scores and actionable recommendations
 */

type DangerData = {
  type: 'aqi' | 'temperature' | 'rain' | 'wind' | 'humidity';
  value: number;
  severity: 'info' | 'warning' | 'danger';
  location: [number, number];
  distance: number; // meters from user
};

type Recommendation = {
  safe: boolean;
  score: number; // 0-10 (0 = very safe, 10 = extreme danger)
  level: 'safe' | 'caution' | 'avoid' | 'emergency';
  recommendation: string;
  reasons: string[];
  bestTime?: string;
  alternativeActions: string[];
};

/**
 * Calculate danger score based on environmental factors
 */
function calculateDangerScore(dangers: DangerData[]): number {
  let score = 0;
  
  dangers.forEach(danger => {
    // Weight by distance (closer = more impact)
    const distanceWeight = danger.distance < 500 ? 1.0 : 
                          danger.distance < 2000 ? 0.7 : 
                          danger.distance < 5000 ? 0.4 : 0.2;
    
    // Weight by danger type and value
    let dangerWeight = 0;
    
    switch (danger.type) {
      case 'aqi':
        if (danger.value > 300) dangerWeight = 4;
        else if (danger.value > 200) dangerWeight = 3;
        else if (danger.value > 150) dangerWeight = 2;
        else if (danger.value > 100) dangerWeight = 1;
        break;
        
      case 'temperature':
        if (danger.value > 40) dangerWeight = 3;
        else if (danger.value > 38) dangerWeight = 2.5;
        else if (danger.value > 35) dangerWeight = 2;
        else if (danger.value < 15) dangerWeight = 1;
        break;
        
      case 'rain':
        if (danger.value > 50) dangerWeight = 4; // Heavy storm
        else if (danger.value > 20) dangerWeight = 3;
        else if (danger.value > 10) dangerWeight = 2;
        else if (danger.value > 5) dangerWeight = 1;
        break;
        
      case 'wind':
        if (danger.value > 75) dangerWeight = 4; // Dangerous winds
        else if (danger.value > 50) dangerWeight = 3;
        else if (danger.value > 30) dangerWeight = 2;
        break;
        
      case 'humidity':
        if (danger.value > 95) dangerWeight = 1.5;
        else if (danger.value > 90) dangerWeight = 1;
        break;
    }
    
    score += dangerWeight * distanceWeight;
  });
  
  return Math.min(score, 10); // Cap at 10
}

/**
 * Generate recommendation based on danger score
 */
export function generateRecommendation(
  dangers: DangerData[],
  currentTime: Date = new Date()
): Recommendation {
  const score = calculateDangerScore(dangers);
  
  const reasons: string[] = [];
  const alternativeActions: string[] = [];
  
  // Analyze each danger type
  const aqiDangers = dangers.filter(d => d.type === 'aqi');
  const tempDangers = dangers.filter(d => d.type === 'temperature');
  const rainDangers = dangers.filter(d => d.type === 'rain');
  const windDangers = dangers.filter(d => d.type === 'wind');
  
  // Build reason list
  if (aqiDangers.length > 0) {
    const maxAQI = Math.max(...aqiDangers.map(d => d.value));
    if (maxAQI > 200) {
      reasons.push(`Air quality is very unhealthy (AQI ${maxAQI})`);
      alternativeActions.push('Wear N95 mask if going outside');
      alternativeActions.push('Limit outdoor activities');
    } else if (maxAQI > 150) {
      reasons.push(`Air quality is unhealthy (AQI ${maxAQI})`);
      alternativeActions.push('Consider wearing a mask');
    }
  }
  
  if (tempDangers.length > 0) {
    const maxTemp = Math.max(...tempDangers.map(d => d.value));
    if (maxTemp > 38) {
      reasons.push(`Extreme heat detected (${maxTemp.toFixed(1)}°C)`);
      alternativeActions.push('Stay hydrated');
      alternativeActions.push('Avoid direct sun exposure');
    } else if (maxTemp > 35) {
      reasons.push(`Very hot conditions (${maxTemp.toFixed(1)}°C)`);
      alternativeActions.push('Take frequent breaks in shade');
    }
  }
  
  if (rainDangers.length > 0) {
    const maxRain = Math.max(...rainDangers.map(d => d.value));
    if (maxRain > 20) {
      reasons.push(`Heavy rain expected (${maxRain.toFixed(1)}mm/h)`);
      alternativeActions.push('Avoid flood-prone areas');
      alternativeActions.push('Bring umbrella or raincoat');
    } else if (maxRain > 10) {
      reasons.push(`Moderate to heavy rain (${maxRain.toFixed(1)}mm/h)`);
    }
  }
  
  if (windDangers.length > 0) {
    const maxWind = Math.max(...windDangers.map(d => d.value));
    if (maxWind > 50) {
      reasons.push(`Strong winds detected (${maxWind.toFixed(1)} km/h)`);
      alternativeActions.push('Secure loose objects');
      alternativeActions.push('Avoid open areas');
    }
  }
  
  // Determine recommendation level
  let level: Recommendation['level'];
  let recommendation: string;
  let bestTime: string | undefined;
  
  if (score >= 8) {
    level = 'emergency';
    recommendation = 'DO NOT GO OUT. Conditions are extremely dangerous.';
    bestTime = 'Wait for conditions to improve';
  } else if (score >= 5) {
    level = 'avoid';
    recommendation = 'Avoid going out unless necessary. High risk detected.';
    bestTime = predictBetterTime(currentTime);
  } else if (score >= 2) {
    level = 'caution';
    recommendation = 'Exercise caution if going out. Moderate risk present.';
    alternativeActions.unshift('Monitor conditions frequently');
  } else {
    level = 'safe';
    recommendation = 'Conditions are generally safe. Normal precautions apply.';
  }
  
  if (reasons.length === 0) {
    reasons.push('No significant environmental hazards detected');
  }
  
  return {
    safe: score < 2,
    score,
    level,
    recommendation,
    reasons,
    bestTime,
    alternativeActions,
  };
}

/**
 * Predict better time based on typical weather patterns
 */
function predictBetterTime(currentTime: Date): string {
  const hour = currentTime.getHours();
  
  // Early morning (5-8 AM) typically has better air quality
  if (hour >= 9 && hour < 17) {
    return 'Early morning (5-8 AM) or evening (after 6 PM)';
  }
  
  // Late afternoon/evening has worst air quality
  if (hour >= 17 && hour < 22) {
    return 'Early morning tomorrow (5-8 AM)';
  }
  
  // Night time
  return 'Early morning (5-8 AM)';
}

/**
 * Get icon for recommendation level
 */
export function getRecommendationIcon(level: Recommendation['level']): string {
  switch (level) {
    case 'safe': return '✅';
    case 'caution': return '⚠️';
    case 'avoid': return '🔴';
    case 'emergency': return '🚨';
  }
}

/**
 * Get color for recommendation level
 */
export function getRecommendationColor(level: Recommendation['level']): string {
  switch (level) {
    case 'safe': return 'text-green-600 bg-green-50';
    case 'caution': return 'text-amber-600 bg-amber-50';
    case 'avoid': return 'text-red-600 bg-red-50';
    case 'emergency': return 'text-red-800 bg-red-100';
  }
}
