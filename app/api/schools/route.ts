import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const schools = await sql`
      SELECT 
        s.school_id,
        s.emis_number,
        s.school_name,
        s.phase,
        d.district_name,
        s.total_capacity,
        s.current_enrollment,
        s.available_desks,
        ST_X(s.location::geometry) AS longitude,
        ST_Y(s.location::geometry) AS latitude
      FROM gde_schools s
      JOIN gde_districts d ON s.district_id = d.district_id
      ORDER BY s.school_name ASC;
    `;

    return NextResponse.json({ success: true, data: schools });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}