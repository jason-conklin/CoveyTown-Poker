import { Card, GameInstance, PokerGameState } from '../../../types/CoveyTownSocket';

/**
 * Deals two cards to each player in the game instance.
 * @param gameInstance The game instance for the poker game.
 */
export function dealPlayerCards(gameInstance: GameInstance<PokerGameState>): void {
  const { deck } = gameInstance.state;
  const { players } = gameInstance;

  for (const playerID of players) {
    const card1 = deck.pop();
    const card2 = deck.pop();

    if (!card1 || !card2) {
      throw new Error('No cards to deal');
    }
    (gameInstance.state.cards as { [key: string]: Card[] })[playerID] = [card1, card2];
  }
}

/**
 * Deals community cards for the current round.
 * @param gameInstance The game instance for the poker game.
 * @param count Number of cards to deal (3 for the flop, 1 for turn and river).
 */
export function dealCommunityCards(
  gameInstance: GameInstance<PokerGameState>,
  count: number,
): void {
  const { deck } = gameInstance.state;
  for (let i = 0; i < count; i++) {
    const dealtCard = deck.pop();
    if (!dealtCard) {
      throw new Error('No cards to deal');
    }
    gameInstance.state.communityCards.push(dealtCard);
  }
}
