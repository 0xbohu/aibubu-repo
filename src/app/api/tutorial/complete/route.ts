import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      tutorialId,
      playerId,
      pointsEarned,
      userAddress
    } = await request.json();

    // Validate required fields
    if (!tutorialId || !playerId) {
      return NextResponse.json(
        { error: 'Tutorial ID and Player ID are required' },
        { status: 400 }
      );
    }

    console.log(`🎓 Tutorial completion: ${tutorialId} by player ${playerId}`);

    // Update tutorial progress in database
    const { data: progressData, error: progressError } = await supabase
      .from('player_progress')
      .upsert({
        player_id: playerId,
        tutorial_id: tutorialId,
        status: 'completed',
        points_earned: pointsEarned || 0,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'player_id,tutorial_id'
      })
      .select();

    if (progressError) {
      console.error('❌ Error updating progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to update tutorial progress' },
        { status: 500 }
      );
    }

    console.log('✅ Tutorial progress updated');

    // Update player total points
    if (pointsEarned && pointsEarned > 0) {
      const { error: pointsError } = await supabase.rpc('add_points_to_player', {
        player_id: playerId,
        points_to_add: pointsEarned
      });

      if (pointsError) {
        console.error('❌ Error updating player points:', pointsError);
      } else {
        console.log(`✅ Added ${pointsEarned} points to player ${playerId}`);
      }
    }

    const response = {
      success: true,
      message: 'Tutorial completed successfully',
      data: {
        tutorialId,
        playerId,
        pointsEarned: pointsEarned || 0,
        progress: progressData
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Tutorial completion error:', error);

    return NextResponse.json(
      {
        error: 'Failed to complete tutorial',
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/tutorial/complete',
    method: 'POST',
    description: 'Complete a tutorial',
    parameters: {
      tutorialId: 'string (required) - Tutorial ID',
      playerId: 'string (required) - Player/User ID',
      pointsEarned: 'number (optional) - Points earned from tutorial'
    },
    example: {
      tutorialId: 'tutorial_123',
      playerId: 'user_456',
      pointsEarned: 10
    }
  });
}