import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting visit distribution...')

    // Call the distribution function
    const { data: distributionResults, error: distributionError } = await supabase
      .rpc('distribute_visits')

    if (distributionError) {
      console.error('Distribution error:', distributionError)
      throw distributionError
    }

    console.log('Distribution completed:', distributionResults)

    // Get current status for all active distributions
    const { data: statusData, error: statusError } = await supabase
      .from('visit_distribution')
      .select(`
        partner_id,
        total_visits,
        total_distributed,
        visits_per_unit,
        time_period,
        is_active,
        start_time,
        end_time,
        last_distribution
      `)
      .eq('is_active', true)

    if (statusError) {
      console.error('Status query error:', statusError)
      throw statusError
    }

    // Get actual visit counts for each partner
    const partnerIds = statusData.map(d => d.partner_id)
    const { data: visitCounts, error: visitCountError } = await supabase
      .from('store_visits')
      .select('partner_id')
      .in('partner_id', partnerIds)

    if (visitCountError) {
      console.error('Visit count error:', visitCountError)
      throw visitCountError
    }

    // Calculate actual visit counts
    const actualCounts = visitCounts.reduce((acc, visit) => {
      acc[visit.partner_id] = (acc[visit.partner_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Combine status with actual counts
    const detailedStatus = statusData.map(distribution => ({
      ...distribution,
      actual_visits: actualCounts[distribution.partner_id] || 0,
      sync_status: distribution.total_distributed === (actualCounts[distribution.partner_id] || 0) ? '✅ In Sync' : '❌ Out of Sync',
      completion_percentage: Math.round((distribution.total_distributed / distribution.total_visits) * 100)
    }))

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Visit distribution completed successfully',
        timestamp: new Date().toISOString(),
        results: distributionResults,
        status: detailedStatus,
        summary: {
          total_distributions_processed: distributionResults.length,
          total_visits_added: distributionResults.reduce((sum, r) => sum + (r.visits_added || 0), 0),
          active_distributions: detailedStatus.length,
          in_sync: detailedStatus.filter(s => s.sync_status === '✅ In Sync').length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in distribute-visits function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
