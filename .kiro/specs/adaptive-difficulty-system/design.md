# Adaptive Difficulty System - Design Document

## Overview

The Adaptive Difficulty System is an intelligent learning personalization engine that monitors student performance in real-time and dynamically adjusts content difficulty to maintain optimal engagement. The system integrates seamlessly with the existing AiBubu learning platform, leveraging current database structures while adding new tables and API endpoints for adaptation logic.

### Key Design Principles

1. **Non-intrusive Integration**: Works with existing tutorial and progress tracking systems
2. **Real-time Adaptation**: Processes performance data immediately after each interaction
3. **Transparent Operation**: Students and parents can view adaptation decisions and reasoning
4. **Configurable Rules**: Administrators can adjust thresholds and algorithms without code changes
5. **Data-Driven**: All decisions based on quantifiable metrics stored in the database

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tutorial    │  │  Dashboard   │  │   Admin      │      │
│  │  Component   │  │  Analytics   │  │   Panel      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ API Calls        │ API Calls        │ API Calls
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    API Routes Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/adaptation/calculate                           │   │
│  │  /api/adaptation/metrics                             │   │
│  │  /api/adaptation/recommendations                     │   │
│  │  /api/adaptation/settings                            │   │
│  │  /api/adaptation/history                             │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ Business Logic
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Adaptation Engine                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Performance Calculator                              │   │
│  │  - Accuracy scoring                                  │   │
│  │  - Time analysis                                     │   │
│  │  - Attempt tracking                                  │   │
│  └──────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Difficulty Adjuster                                 │   │
│  │  - Rule evaluation                                   │   │
│  │  - Level calculation                                 │   │
│  │  - Threshold checking                                │   │
│  └──────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Recommendation Engine                               │   │
│  │  - Content filtering                                 │   │
│  │  - Skill gap analysis                                │   │
│  │  - Priority ranking                                  │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ Data Access
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Supabase Database                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Existing Tables:                                    │   │
│  │  - players                                           │   │
│  │  - tutorials                                         │   │
│  │  - player_progress                                   │   │
│  │  - tutorial_responses                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  New Tables:                                         │   │
│  │  - adaptation_metrics                                │   │
│  │  - adaptation_history                                │   │
│  │  - adaptation_rules                                  │   │
│  │  - difficulty_recommendations                        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema Extensions

#### adaptation_metrics Table
Stores calculated performance metrics for each student per subject category.

```typescript
interface AdaptationMetrics {
  id: string                          // UUID primary key
  player_id: string                   // Foreign key to players
  category: string                    // 'maths', 'speaking', 'agent', etc.
  current_difficulty_level: number    // 1-10 scale
  accuracy_rate: number               // 0-100 percentage
  average_completion_time: number     // Seconds
  engagement_score: number            // 0-100 calculated metric
  learning_velocity: number           // Tutorials per week
  consecutive_successes: number       // Streak counter
  consecutive_failures: number        // Failure streak counter
  last_adjustment_date: string        // ISO timestamp
  adaptation_enabled: boolean         // User preference
  created_at: string
  updated_at: string
}
```

#### adaptation_history Table
Audit log of all difficulty adjustments with reasoning.

```typescript
interface AdaptationHistory {
  id: string                          // UUID primary key
  player_id: string                   // Foreign key to players
  category: string                    // Subject category
  previous_level: number              // Difficulty before change
  new_level: number                   // Difficulty after change
  trigger_reason: string              // 'consecutive_success', 'low_accuracy', etc.
  metrics_snapshot: Record<string, any> // JSON of metrics at time of change
  created_at: string                  // ISO timestamp
}
```

#### adaptation_rules Table
Configurable rules for triggering difficulty adjustments.

```typescript
interface AdaptationRule {
  id: string                          // UUID primary key
  rule_name: string                   // Descriptive name
  category: string                    // 'all' or specific category
  age_group_min: number               // Minimum age for rule
  age_group_max: number               // Maximum age for rule
  trigger_condition: string           // 'consecutive_success', 'low_accuracy', etc.
  threshold_value: number             // Numeric threshold
  adjustment_amount: number           // +/- difficulty change
  is_active: boolean                  // Enable/disable rule
  priority: number                    // Rule evaluation order
  created_at: string
  updated_at: string
}
```

#### difficulty_recommendations Table
Stores personalized tutorial recommendations.

```typescript
interface DifficultyRecommendation {
  id: string                          // UUID primary key
  player_id: string                   // Foreign key to players
  tutorial_id: string                 // Foreign key to tutorials
  category: string                    // Subject category
  recommendation_score: number        // 0-100 relevance score
  difficulty_match: number            // How well it matches skill level
  skill_gap_addressed: string[]       // Array of skills this helps with
  created_at: string                  // ISO timestamp
  expires_at: string                  // Recommendation validity period
}
```

### 2. API Endpoints

#### POST /api/adaptation/calculate
Calculates performance metrics and determines if difficulty adjustment is needed.

**Request Body:**
```typescript
{
  playerId: string
  tutorialId: string
  category: string
  accuracy: number        // 0-100
  completionTime: number  // seconds
  attempts: number
  isCorrect: boolean
}
```

**Response:**
```typescript
{
  success: boolean
  metrics: AdaptationMetrics
  adjustmentMade: boolean
  newDifficultyLevel?: number
  reasoning?: string
}
```

#### GET /api/adaptation/metrics?playerId={id}&category={category}
Retrieves current adaptation metrics for a student.

**Response:**
```typescript
{
  success: boolean
  metrics: AdaptationMetrics
  recentHistory: AdaptationHistory[]
}
```

#### GET /api/adaptation/recommendations?playerId={id}&category={category}&limit={n}
Gets personalized tutorial recommendations.

**Response:**
```typescript
{
  success: boolean
  recommendations: Array<{
    tutorial: Tutorial
    recommendation: DifficultyRecommendation
    reasoning: string
  }>
}
```

#### GET /api/adaptation/settings?playerId={id}
Retrieves adaptation settings for a student.

**Response:**
```typescript
{
  success: boolean
  settings: {
    adaptationEnabled: boolean
    currentLevels: Record<string, number>  // category -> difficulty level
    parentLocked: boolean
  }
}
```

#### PUT /api/adaptation/settings
Updates adaptation settings.

**Request Body:**
```typescript
{
  playerId: string
  adaptationEnabled?: boolean
  parentLocked?: boolean
}
```

#### GET /api/adaptation/history?playerId={id}&category={category}&days={n}
Retrieves adaptation history for analytics.

**Response:**
```typescript
{
  success: boolean
  history: AdaptationHistory[]
  summary: {
    totalAdjustments: number
    averageDifficulty: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }
}
```

#### Admin Endpoints

#### GET /api/admin/adaptation/rules
Lists all adaptation rules.

#### POST /api/admin/adaptation/rules
Creates a new adaptation rule.

#### PUT /api/admin/adaptation/rules/{id}
Updates an existing rule.

#### DELETE /api/admin/adaptation/rules/{id}
Deactivates a rule.

### 3. Adaptation Engine Logic

#### Performance Calculator

```typescript
class PerformanceCalculator {
  /**
   * Calculates comprehensive performance metrics
   */
  calculateMetrics(
    playerId: string,
    category: string,
    recentResponses: TutorialResponse[]
  ): AdaptationMetrics {
    // Calculate accuracy rate from last 10 responses
    const accuracyRate = this.calculateAccuracyRate(recentResponses)
    
    // Calculate average completion time
    const avgCompletionTime = this.calculateAverageTime(recentResponses)
    
    // Calculate engagement score (composite metric)
    const engagementScore = this.calculateEngagement(
      accuracyRate,
      avgCompletionTime,
      recentResponses
    )
    
    // Calculate learning velocity (tutorials per week)
    const learningVelocity = this.calculateVelocity(playerId, category)
    
    // Track consecutive successes/failures
    const streaks = this.calculateStreaks(recentResponses)
    
    return {
      accuracy_rate: accuracyRate,
      average_completion_time: avgCompletionTime,
      engagement_score: engagementScore,
      learning_velocity: learningVelocity,
      consecutive_successes: streaks.successes,
      consecutive_failures: streaks.failures
    }
  }
  
  /**
   * Engagement score formula:
   * - 40% accuracy rate
   * - 30% completion speed (compared to expected)
   * - 20% consistency (low variance in performance)
   * - 10% learning velocity
   */
  calculateEngagement(
    accuracy: number,
    avgTime: number,
    responses: TutorialResponse[]
  ): number {
    const accuracyComponent = accuracy * 0.4
    
    // Speed component (faster is better, but not too fast)
    const expectedTime = this.getExpectedTime(responses[0]?.tutorial_id)
    const speedRatio = expectedTime / avgTime
    const speedComponent = Math.min(100, speedRatio * 100) * 0.3
    
    // Consistency component (low variance is better)
    const variance = this.calculateVariance(responses)
    const consistencyComponent = (100 - variance) * 0.2
    
    // Velocity component
    const velocityComponent = Math.min(100, learningVelocity * 20) * 0.1
    
    return accuracyComponent + speedComponent + consistencyComponent + velocityComponent
  }
}
```

#### Difficulty Adjuster

```typescript
class DifficultyAdjuster {
  /**
   * Evaluates rules and determines if adjustment is needed
   */
  async evaluateAdjustment(
    playerId: string,
    category: string,
    metrics: AdaptationMetrics
  ): Promise<AdjustmentDecision> {
    // Get player age for age-appropriate rules
    const player = await this.getPlayer(playerId)
    
    // Load applicable rules
    const rules = await this.getActiveRules(category, player.age)
    
    // Sort by priority
    rules.sort((a, b) => a.priority - b.priority)
    
    // Evaluate each rule
    for (const rule of rules) {
      const shouldTrigger = this.evaluateRule(rule, metrics)
      
      if (shouldTrigger) {
        return {
          shouldAdjust: true,
          adjustmentAmount: rule.adjustment_amount,
          triggerReason: rule.rule_name,
          ruleId: rule.id
        }
      }
    }
    
    return { shouldAdjust: false }
  }
  
  /**
   * Evaluates a single rule against metrics
   */
  evaluateRule(rule: AdaptationRule, metrics: AdaptationMetrics): boolean {
    switch (rule.trigger_condition) {
      case 'consecutive_success':
        return metrics.consecutive_successes >= rule.threshold_value
        
      case 'consecutive_failure':
        return metrics.consecutive_failures >= rule.threshold_value
        
      case 'low_accuracy':
        return metrics.accuracy_rate < rule.threshold_value
        
      case 'high_accuracy':
        return metrics.accuracy_rate > rule.threshold_value
        
      case 'low_engagement':
        return metrics.engagement_score < rule.threshold_value
        
      case 'slow_velocity':
        return metrics.learning_velocity < rule.threshold_value
        
      default:
        return false
    }
  }
  
  /**
   * Applies difficulty adjustment with bounds checking
   */
  applyAdjustment(
    currentLevel: number,
    adjustmentAmount: number
  ): number {
    const newLevel = currentLevel + adjustmentAmount
    
    // Clamp between 1 and 10
    return Math.max(1, Math.min(10, newLevel))
  }
}
```

#### Recommendation Engine

```typescript
class RecommendationEngine {
  /**
   * Generates personalized tutorial recommendations
   */
  async generateRecommendations(
    playerId: string,
    category: string,
    limit: number = 5
  ): Promise<DifficultyRecommendation[]> {
    // Get current metrics
    const metrics = await this.getMetrics(playerId, category)
    
    // Get completed tutorials
    const completed = await this.getCompletedTutorials(playerId, category)
    
    // Get available tutorials
    const available = await this.getAvailableTutorials(category)
    
    // Filter by difficulty range (current level ± 2)
    const filtered = available.filter(t => 
      Math.abs(t.difficulty_level - metrics.current_difficulty_level) <= 2 &&
      !completed.includes(t.id)
    )
    
    // Score each tutorial
    const scored = filtered.map(tutorial => ({
      tutorial,
      score: this.calculateRecommendationScore(tutorial, metrics)
    }))
    
    // Sort by score and take top N
    scored.sort((a, b) => b.score - a.score)
    
    return scored.slice(0, limit).map(item => ({
      tutorial_id: item.tutorial.id,
      recommendation_score: item.score,
      difficulty_match: this.calculateDifficultyMatch(
        item.tutorial.difficulty_level,
        metrics.current_difficulty_level
      ),
      skill_gap_addressed: this.identifySkillGaps(metrics, item.tutorial)
    }))
  }
  
  /**
   * Calculates recommendation score (0-100)
   */
  calculateRecommendationScore(
    tutorial: Tutorial,
    metrics: AdaptationMetrics
  ): number {
    // Difficulty match (50% weight)
    const difficultyDiff = Math.abs(
      tutorial.difficulty_level - metrics.current_difficulty_level
    )
    const difficultyScore = Math.max(0, 100 - (difficultyDiff * 20))
    
    // Skill gap relevance (30% weight)
    const skillGapScore = this.calculateSkillGapRelevance(tutorial, metrics)
    
    // Engagement potential (20% weight)
    const engagementScore = this.predictEngagement(tutorial, metrics)
    
    return (
      difficultyScore * 0.5 +
      skillGapScore * 0.3 +
      engagementScore * 0.2
    )
  }
}
```

### 4. React Components

#### AdaptationDashboard Component
Displays adaptation metrics and history for students/parents.

```typescript
interface AdaptationDashboardProps {
  playerId: string
  category?: string
}

const AdaptationDashboard: React.FC<AdaptationDashboardProps> = ({
  playerId,
  category
}) => {
  // Fetches metrics and history
  // Displays:
  // - Current difficulty level per category
  // - Performance trends (line chart)
  // - Recent adjustments timeline
  // - Engagement score gauge
  // - Learning velocity indicator
}
```

#### DifficultyIndicator Component
Shows difficulty compatibility on tutorial cards.

```typescript
interface DifficultyIndicatorProps {
  tutorialDifficulty: number
  playerDifficulty: number
}

const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({
  tutorialDifficulty,
  playerDifficulty
}) => {
  // Visual indicator:
  // - Green: Perfect match (±1 level)
  // - Yellow: Slight challenge (+2 levels)
  // - Orange: Challenging (+3 levels)
  // - Red: Too difficult (>3 levels)
  // - Blue: Review/easier (<0 levels)
}
```

#### AdaptationSettings Component
Allows users to configure adaptation preferences.

```typescript
interface AdaptationSettingsProps {
  playerId: string
  isParent: boolean
}

const AdaptationSettings: React.FC<AdaptationSettingsProps> = ({
  playerId,
  isParent
}) => {
  // Settings:
  // - Enable/disable adaptation toggle
  // - Parent lock toggle (if isParent)
  // - View adaptation history
  // - Manual difficulty override per category
}
```

#### HintSystem Component
Provides contextual hints when student struggles.

```typescript
interface HintSystemProps {
  questionId: string
  attemptCount: number
  onHintRequested: () => void
}

const HintSystem: React.FC<HintSystemProps> = ({
  questionId,
  attemptCount,
  onHintRequested
}) => {
  // Shows hint button after 3 failed attempts
  // Displays progressive hints (25%, 50%, 75% of solution)
  // Tracks hint usage in metrics
}
```

## Data Models

### Metric Calculation Flow

```
Tutorial Completion
        ↓
Extract Response Data
  - Accuracy
  - Time taken
  - Attempts
        ↓
Fetch Recent History
  (last 10 responses)
        ↓
Calculate Metrics
  - Accuracy rate
  - Avg completion time
  - Engagement score
  - Learning velocity
  - Streaks
        ↓
Store in adaptation_metrics
        ↓
Evaluate Rules
        ↓
Adjustment Needed? ──No──→ End
        ↓ Yes
Apply Adjustment
        ↓
Store in adaptation_history
        ↓
Update player difficulty level
        ↓
Generate new recommendations
```

### Recommendation Generation Flow

```
User Requests Recommendations
        ↓
Fetch Current Metrics
        ↓
Identify Skill Gaps
  (weak areas from metrics)
        ↓
Query Available Tutorials
  - Filter by category
  - Filter by difficulty range
  - Exclude completed
        ↓
Score Each Tutorial
  - Difficulty match
  - Skill gap relevance
  - Engagement potential
        ↓
Rank by Score
        ↓
Return Top N
        ↓
Store in difficulty_recommendations
```

## Error Handling

### Graceful Degradation

1. **Metrics Calculation Failure**: Use cached metrics from last successful calculation
2. **Rule Evaluation Error**: Skip problematic rule and continue with others
3. **Database Connection Issues**: Queue adaptation updates for retry
4. **API Timeout**: Return cached recommendations with staleness indicator

### Error Scenarios

```typescript
// Example error handling in API route
try {
  const metrics = await calculateMetrics(playerId, category)
  const adjustment = await evaluateAdjustment(playerId, category, metrics)
  
  if (adjustment.shouldAdjust) {
    await applyAdjustment(playerId, category, adjustment)
  }
  
  return { success: true, metrics, adjustment }
  
} catch (error) {
  console.error('Adaptation error:', error)
  
  // Try to get cached metrics
  const cachedMetrics = await getCachedMetrics(playerId, category)
  
  if (cachedMetrics) {
    return {
      success: true,
      metrics: cachedMetrics,
      warning: 'Using cached data due to calculation error'
    }
  }
  
  // Fallback to default behavior
  return {
    success: false,
    error: 'Adaptation temporarily unavailable',
    fallback: true
  }
}
```

## Testing Strategy

### Unit Tests

1. **Performance Calculator Tests**
   - Test accuracy rate calculation with various response patterns
   - Test engagement score formula with edge cases
   - Test streak counting logic
   - Test learning velocity calculation

2. **Difficulty Adjuster Tests**
   - Test rule evaluation with different conditions
   - Test adjustment bounds (1-10 clamping)
   - Test rule priority ordering
   - Test age-appropriate rule filtering

3. **Recommendation Engine Tests**
   - Test scoring algorithm with various metrics
   - Test difficulty filtering logic
   - Test skill gap identification
   - Test recommendation ranking

### Integration Tests

1. **End-to-End Adaptation Flow**
   - Complete tutorial → metrics calculated → adjustment applied
   - Verify database updates at each step
   - Test with different performance patterns

2. **API Endpoint Tests**
   - Test all endpoints with valid/invalid inputs
   - Test authentication and authorization
   - Test rate limiting and caching

3. **Database Tests**
   - Test foreign key constraints
   - Test RLS policies for new tables
   - Test concurrent updates to metrics

### Performance Tests

1. **Metric Calculation Performance**
   - Should complete within 2 seconds for 100 recent responses
   - Test with varying data volumes

2. **Recommendation Generation Performance**
   - Should return results within 3 seconds
   - Test with large tutorial catalogs (1000+ tutorials)

3. **Concurrent User Load**
   - Test 100 simultaneous metric calculations
   - Verify no race conditions in difficulty updates

### User Acceptance Testing

1. **Student Experience**
   - Verify difficulty adjustments feel natural
   - Test hint system usability
   - Verify recommendations are relevant

2. **Parent/Teacher Dashboard**
   - Verify analytics are clear and actionable
   - Test export functionality
   - Verify historical data accuracy

3. **Admin Configuration**
   - Test rule creation and modification
   - Verify rule changes apply correctly
   - Test rule conflict resolution

## Security Considerations

### Row Level Security (RLS) Policies

```sql
-- adaptation_metrics: Students can only view their own metrics
CREATE POLICY "Students can view own metrics"
  ON adaptation_metrics FOR SELECT
  USING (auth.uid() = player_id);

-- adaptation_history: Students can view their own history
CREATE POLICY "Students can view own history"
  ON adaptation_history FOR SELECT
  USING (auth.uid() = player_id);

-- adaptation_rules: Only admins can modify
CREATE POLICY "Only admins can modify rules"
  ON adaptation_rules FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- difficulty_recommendations: Students can view their own
CREATE POLICY "Students can view own recommendations"
  ON difficulty_recommendations FOR SELECT
  USING (auth.uid() = player_id);
```

### Data Privacy

1. **Metric Anonymization**: When displaying aggregate statistics, ensure individual student data cannot be reverse-engineered
2. **Parent Access Control**: Verify parent-child relationships before granting access to metrics
3. **Admin Audit Logging**: Log all rule changes with admin user ID and timestamp
4. **Data Retention**: Automatically archive adaptation history older than 1 year

### Input Validation

1. **API Request Validation**: Use Zod schemas to validate all incoming requests
2. **Difficulty Level Bounds**: Always clamp difficulty levels to 1-10 range
3. **Metric Value Validation**: Ensure percentages are 0-100, times are positive
4. **SQL Injection Prevention**: Use parameterized queries for all database operations

## Performance Optimization

### Caching Strategy

1. **Metrics Cache**: Cache calculated metrics for 5 minutes
2. **Rules Cache**: Cache active rules for 15 minutes
3. **Recommendations Cache**: Cache recommendations for 1 hour
4. **Player Settings Cache**: Cache adaptation settings for 10 minutes

### Database Indexing

```sql
-- Index for fast metric lookups
CREATE INDEX idx_adaptation_metrics_player_category 
  ON adaptation_metrics(player_id, category);

-- Index for history queries
CREATE INDEX idx_adaptation_history_player_date 
  ON adaptation_history(player_id, created_at DESC);

-- Index for rule evaluation
CREATE INDEX idx_adaptation_rules_active 
  ON adaptation_rules(is_active, priority) 
  WHERE is_active = true;

-- Index for recommendation queries
CREATE INDEX idx_difficulty_recommendations_player_expires 
  ON difficulty_recommendations(player_id, expires_at) 
  WHERE expires_at > NOW();
```

### Batch Processing

1. **Metric Recalculation**: Run nightly job to recalculate all metrics for consistency
2. **Recommendation Refresh**: Regenerate recommendations daily for active users
3. **History Archival**: Move old history records to archive table monthly

## Migration Plan

### Phase 1: Database Setup
1. Create new tables with RLS policies
2. Add indexes for performance
3. Seed default adaptation rules

### Phase 2: API Implementation
1. Implement core API endpoints
2. Add authentication and validation
3. Deploy with feature flag disabled

### Phase 3: Engine Development
1. Implement Performance Calculator
2. Implement Difficulty Adjuster
3. Implement Recommendation Engine
4. Add comprehensive error handling

### Phase 4: UI Integration
1. Add adaptation dashboard to profile page
2. Add difficulty indicators to tutorial cards
3. Add hint system to tutorial pages
4. Add settings panel

### Phase 5: Testing & Rollout
1. Run integration tests
2. Conduct user acceptance testing
3. Enable for beta users (10%)
4. Monitor metrics and adjust rules
5. Gradual rollout to 100%

## Monitoring and Analytics

### Key Metrics to Track

1. **System Health**
   - Metric calculation success rate
   - API response times
   - Database query performance
   - Cache hit rates

2. **Adaptation Effectiveness**
   - Average difficulty level over time
   - Adjustment frequency per student
   - Student retention after adjustments
   - Engagement score trends

3. **Recommendation Quality**
   - Recommendation acceptance rate
   - Tutorial completion rate for recommended content
   - Time to complete recommended tutorials

### Alerting

1. **Performance Alerts**
   - Alert if metric calculation takes >5 seconds
   - Alert if API error rate >5%
   - Alert if database queries timeout

2. **Business Logic Alerts**
   - Alert if >20% of students disable adaptation
   - Alert if average difficulty drops significantly
   - Alert if recommendation acceptance rate <30%
