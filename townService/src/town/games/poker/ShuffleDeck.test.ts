import { Card } from '../../../types/CoveyTownSocket';
import { getShuffledDeck, createDeck } from './ShuffleDeck';

function compareCards(a: Card, b: Card): number {
  const suitsOrder = ['HEARTS', 'DIAMONDS', 'SPADES', 'CLUBS'];
  const valuesOrder = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'JACK', 'QUEEN', 'KING', 'ACE'];

  if (a.suit === b.suit) {
    return valuesOrder.indexOf(a.value) - valuesOrder.indexOf(b.value);
  }
  return suitsOrder.indexOf(a.suit) - suitsOrder.indexOf(b.suit);
}

describe('Card Shuffling Tests', () => {
  let deck: ReturnType<typeof createDeck>;

  beforeEach(() => {
    deck = createDeck();
  });

  test('Shuffled deck has a different order than base deck', () => {
    const shuffledDeck = getShuffledDeck();

    expect(shuffledDeck).not.toEqual(deck);
  });

  test('Shuffled deck has 52 cards', () => {
    const shuffledDeck = getShuffledDeck();
    expect(shuffledDeck.length).toBe(52);
  });

  test('Deck and shuffled deck have the same cards', () => {
    const shuffledDeck = getShuffledDeck();
    const sortedDeck = [...deck].sort(compareCards);
    const sortedShuffled = [...shuffledDeck].sort(compareCards);

    expect(sortedShuffled).toEqual(sortedDeck);
  });

  test('Shuffled deck contains no duplicates', () => {
    const shuffledDeck = getShuffledDeck();

    const cardSet = new Set(shuffledDeck.map(card => `${card.value} of ${card.suit}`));
    expect(cardSet.size).toBe(52);
  });
});
