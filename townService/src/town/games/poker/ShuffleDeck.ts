import { Card } from '../../../types/CoveyTownSocket';

export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['HEARTS', 'DIAMONDS', 'SPADES', 'CLUBS'];
  const values: Card['value'][] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'JACK', 'QUEEN', 'KING', 'ACE'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function getShuffledDeck(): Card[] {
  const deck = createDeck();
  return shuffleDeck(deck);
}
