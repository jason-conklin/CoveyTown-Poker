import { dealPlayerCards, dealCommunityCards } from './DealCards';
import { GameInstance, PokerGameState, Card } from '../../../types/CoveyTownSocket';
import { getShuffledDeck } from './ShuffleDeck';

describe('dealPlayerCards & dealCommunityCards', () => {
  let gameInstance: GameInstance<PokerGameState>;
  let mockPlayerIDs: string[];

  beforeEach(() => {
    mockPlayerIDs = ['player1', 'player2', 'player3'];
    gameInstance = {
      id: 'testGame',
      players: mockPlayerIDs,
      state: {
        moves: [],
        foldedPlayers: [],
        bigBlind: 'player1',
        smallBlind: 'player2',
        dealer: 'player3',
        deck: getShuffledDeck(),
        communityCards: [],
        pot: 0,
        cards: {},
        chips: {},
        bets: {},
        currentBet: 0,
        status: 'IN_PROGRESS',
        turn: 0,
        firstPlayer: 0,
      },
    };
  });

  describe('dealPlayerCards', () => {
    test('deals two cards to each player', () => {
      dealPlayerCards(gameInstance);

      for (const playerID of mockPlayerIDs) {
        expect((gameInstance.state.cards as { [key: string]: Card[] })[playerID]).toBeDefined();
        expect((gameInstance.state.cards as { [key: string]: Card[] })[playerID].length).toBe(2);
      }
    });

    test('deals unique cards to each player', () => {
      dealPlayerCards(gameInstance);

      const dealtCards = mockPlayerIDs
        .map(playerID => (gameInstance.state.cards as { [key: string]: Card[] })[playerID])
        .flat() as Card[];
      const uniqueCards = new Set(dealtCards.map(card => `${card.value}-${card.suit}`));
      expect(uniqueCards.size).toBe(dealtCards.length);
    });
  });

  describe('dealCommunityCards', () => {
    test('deals the correct number of community cards', () => {
      // Deal 3 cards for the "flop"
      dealCommunityCards(gameInstance, 3);
      expect(gameInstance.state.communityCards.length).toBe(3);

      // Deal 1 more card for the "turn"
      dealCommunityCards(gameInstance, 1);
      expect(gameInstance.state.communityCards.length).toBe(4);

      // Deal 1 more card for the "river"
      dealCommunityCards(gameInstance, 1);
      expect(gameInstance.state.communityCards.length).toBe(5);
    });

    test('deals unique community cards', () => {
      // Deal 5 community cards
      dealCommunityCards(gameInstance, 5);

      // Check that all community cards are unique
      const uniqueCards = new Set(
        gameInstance.state.communityCards.map(card => `${card.value}-${card.suit}`),
      );
      expect(uniqueCards.size).toBe(gameInstance.state.communityCards.length);
    });

    test('throws an error if there are not enough cards to deal', () => {
      gameInstance.state.deck = [];

      expect(() => dealCommunityCards(gameInstance, 5)).toThrow('No cards to deal');
    });
  });
});
