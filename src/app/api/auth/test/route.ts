import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://kernel-core.yowyob.com/v3/api-docs');
  const swagger = await res.json();
  const signup = swagger.paths['/api/auth/sign-up']?.post?.requestBody;
  const register = swagger.paths['/api/auth/register']?.post?.requestBody;
  
  // also look at responses
  const signupRes = swagger.paths['/api/auth/sign-up']?.post?.responses;
  const registerRes = swagger.paths['/api/auth/register']?.post?.responses;
  
  return NextResponse.json({ signup, register, signupRes, registerRes });
}
