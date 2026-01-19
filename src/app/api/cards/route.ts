import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserCards, saveUserCards } from '@/lib/storage';

async function getAuthUser() {
  const cookieStore = await cookies();
  return cookieStore.get('session')?.value;
}

export async function GET() {
  const username = await getAuthUser();
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cards = getUserCards(username);
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const username = await getAuthUser();
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, german, arabic, hint, category, tags, hasAudio, type } = await request.json();
    if (!german || !arabic) {
      return NextResponse.json({ error: 'German and Arabic text required' }, { status: 400 });
    }

    const cards = getUserCards(username);
    const newCard = {
      id: id || crypto.randomUUID(),
      german,
      arabic,
      hint: hint || '',
      category: category || 'category',
      tags: Array.isArray(tags) ? tags : [],
      hasAudio: hasAudio || false,
      type: type || 'word', // Default to 'word'
      createdAt: new Date().toISOString(),
    };

    cards.push(newCard);
    saveUserCards(username, cards);

    return NextResponse.json(newCard);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add card' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const username = await getAuthUser();
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await request.json();
        let cards = getUserCards(username);
        cards = cards.filter((c: any) => c.id !== id);
        saveUserCards(username, cards);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    const username = await getAuthUser();
    if (!username) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, german, arabic, hint, category, tags, hasAudio, type } = await request.json();
        if (!id || !german || !arabic) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let cards = getUserCards(username);
        const cardIndex = cards.findIndex((c: any) => c.id === id);
        
        if (cardIndex === -1) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        cards[cardIndex] = {
            ...cards[cardIndex],
            german,
            arabic,
            hint: hint || '',
            category: category || 'category',
            tags: Array.isArray(tags) ? tags : [],
            hasAudio: hasAudio !== undefined ? hasAudio : cards[cardIndex].hasAudio,
            type: type || cards[cardIndex].type || 'word',
            updatedAt: new Date().toISOString(),
        };

        saveUserCards(username, cards);
        return NextResponse.json(cards[cardIndex]);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
