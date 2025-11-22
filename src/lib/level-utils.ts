// Level conversion utilities for mapping between text levels and database integer levels

export interface LevelMapping {
  textLevel: string
  dbLevel: number
  displayName: string
  description: string
  color: string
}

// CEFR Level Mappings (A1-C2 → 1-6)
export const CEFR_LEVEL_MAPPINGS: LevelMapping[] = [
  {
    textLevel: 'a1',
    dbLevel: 1,
    displayName: 'A1 - Beginner',
    description: 'Can understand and use familiar everyday expressions',
    color: 'bg-green-500'
  },
  {
    textLevel: 'a2',
    dbLevel: 2,
    displayName: 'A2 - Elementary', 
    description: 'Can communicate in simple and routine tasks',
    color: 'bg-blue-500'
  },
  {
    textLevel: 'b1',
    dbLevel: 3,
    displayName: 'B1 - Intermediate',
    description: 'Can deal with most situations while travelling',
    color: 'bg-yellow-500'
  },
  {
    textLevel: 'b2',
    dbLevel: 4,
    displayName: 'B2 - Upper Intermediate',
    description: 'Can understand complex texts and interact fluently',
    color: 'bg-orange-500'
  },
  {
    textLevel: 'c1',
    dbLevel: 5,
    displayName: 'C1 - Advanced',
    description: 'Can express ideas fluently and spontaneously',
    color: 'bg-red-500'
  },
  {
    textLevel: 'c2',
    dbLevel: 6,
    displayName: 'C2 - Proficient',
    description: 'Can understand virtually everything with ease',
    color: 'bg-purple-500'
  }
]

// Player Level Mappings (New, beginner, advanced, expert, proficient → 1-6)
export const PLAYER_LEVEL_MAPPINGS: LevelMapping[] = [
  {
    textLevel: 'new',
    dbLevel: 1,
    displayName: 'New',
    description: 'Just starting to learn',
    color: 'bg-gray-500'
  },
  {
    textLevel: 'beginner',
    dbLevel: 2,
    displayName: 'Beginner',
    description: 'Basic understanding and simple phrases',
    color: 'bg-green-500'
  },
  {
    textLevel: 'intermediate',
    dbLevel: 3,
    displayName: 'Intermediate',
    description: 'Can handle everyday conversations',
    color: 'bg-blue-500'
  },
  {
    textLevel: 'advanced',
    dbLevel: 4,
    displayName: 'Advanced',
    description: 'Good fluency and complex conversations',
    color: 'bg-orange-500'
  },
  {
    textLevel: 'expert',
    dbLevel: 5,
    displayName: 'Expert',
    description: 'High proficiency and nuanced expression',
    color: 'bg-red-500'
  },
  {
    textLevel: 'proficient',
    dbLevel: 6,
    displayName: 'Proficient',
    description: 'Near-native level mastery',
    color: 'bg-purple-500'
  }
]

// CEFR to Player Level mapping for assessment results
export const CEFR_TO_PLAYER_LEVEL_MAP: Record<string, string> = {
  'a1': 'new',
  'a2': 'beginner', 
  'b1': 'intermediate',
  'b2': 'advanced',
  'c1': 'expert',
  'c2': 'proficient'
}

/**
 * Convert text level to database integer level
 */
export function textLevelToDbLevel(textLevel: string, isCefr: boolean = false): number {
  const normalizedLevel = textLevel.toLowerCase().trim()
  
  if (isCefr) {
    const cefrMapping = CEFR_LEVEL_MAPPINGS.find(m => m.textLevel === normalizedLevel)
    return cefrMapping?.dbLevel || 1
  } else {
    const playerMapping = PLAYER_LEVEL_MAPPINGS.find(m => m.textLevel === normalizedLevel)
    return playerMapping?.dbLevel || 1
  }
}

/**
 * Convert database integer level to text level
 */
export function dbLevelToTextLevel(dbLevel: number, isCefr: boolean = false): string {
  if (isCefr) {
    const cefrMapping = CEFR_LEVEL_MAPPINGS.find(m => m.dbLevel === dbLevel)
    return cefrMapping?.textLevel || 'a1'
  } else {
    const playerMapping = PLAYER_LEVEL_MAPPINGS.find(m => m.dbLevel === dbLevel)
    return playerMapping?.textLevel || 'new'
  }
}

/**
 * Get level mapping information by text level
 */
export function getLevelMapping(textLevel: string, isCefr: boolean = false): LevelMapping | null {
  const normalizedLevel = textLevel.toLowerCase().trim()
  
  if (isCefr) {
    return CEFR_LEVEL_MAPPINGS.find(m => m.textLevel === normalizedLevel) || null
  } else {
    return PLAYER_LEVEL_MAPPINGS.find(m => m.textLevel === normalizedLevel) || null
  }
}

/**
 * Get level mapping information by database level
 */
export function getLevelMappingByDbLevel(dbLevel: number, isCefr: boolean = false): LevelMapping | null {
  if (isCefr) {
    return CEFR_LEVEL_MAPPINGS.find(m => m.dbLevel === dbLevel) || null
  } else {
    return PLAYER_LEVEL_MAPPINGS.find(m => m.dbLevel === dbLevel) || null
  }
}

/**
 * Map CEFR assessment result to player level
 */
export function mapCefrToPlayerLevel(cefrLevel: string): string {
  const normalizedLevel = cefrLevel.toLowerCase().trim()
  return CEFR_TO_PLAYER_LEVEL_MAP[normalizedLevel] || 'beginner'
}

/**
 * Get all available levels for selection UI
 */
export function getAvailableLevels(isCefr: boolean = false): LevelMapping[] {
  return isCefr ? CEFR_LEVEL_MAPPINGS : PLAYER_LEVEL_MAPPINGS
}

/**
 * Validate if a text level is valid
 */
export function isValidTextLevel(textLevel: string, isCefr: boolean = false): boolean {
  const normalizedLevel = textLevel.toLowerCase().trim()
  
  if (isCefr) {
    return CEFR_LEVEL_MAPPINGS.some(m => m.textLevel === normalizedLevel)
  } else {
    return PLAYER_LEVEL_MAPPINGS.some(m => m.textLevel === normalizedLevel)
  }
}

/**
 * Validate if a database level is valid (1-6)
 */
export function isValidDbLevel(dbLevel: number): boolean {
  return dbLevel >= 1 && dbLevel <= 6
} 