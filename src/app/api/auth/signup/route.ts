import { NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/storage';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const users = getUsers();
    if (users.find((u: any) => u.username === username)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Basic hashing (In a real app, use bcrypt)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    users.push({ username, password: hashedPassword });
    saveUsers(users);

    return NextResponse.json({ message: 'User created successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
