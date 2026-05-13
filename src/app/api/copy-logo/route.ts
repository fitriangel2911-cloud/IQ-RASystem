import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), 'make-recolor.ps1');
    
    // Execute powershell in local environment context
    const output = execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { encoding: 'utf-8' });
    
    return NextResponse.json({ 
      success: true, 
      message: "Transparent background logo created successfully!",
      shellOutput: output
    });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      stderr: err.stderr?.toString()
    }, { status: 500 });
  }
}
