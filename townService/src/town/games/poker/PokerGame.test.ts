import PokerGame from './PokerGame';
import { createPlayerForTesting } from '../../../TestUtils';
import {
  GAME_FULL_MESSAGE,
  GAME_IN_PROGRESS_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../../lib/InvalidParametersError';
import Player from '../../../lib/Player';

describe('PokerGame', () => {
  let game: PokerGame;
  let player1: Player;
  let player2: Player;
  let player3: Player;
  beforeEach(() => {
    game = new PokerGame();
    player1 = createPlayerForTesting();
    player2 = createPlayerForTesting();
    player3 = createPlayerForTesting();
  });
  describe('Testing the turn system', () => {
    it('has the first player who joins be the one who goes first', () => {
      game.join(player1);
      game.join(player2);
      expect(game.state.turn).toEqual(0);
    });
    it('has player 2 go next', () => {
      game.join(player1);
      game.join(player2);
      game.applyMove({
        playerID: player1.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.turn).toEqual(1);
    });
    it('should skip player 2 since he has folded', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.foldedPlayers = [player2.id];
      game.applyMove({
        playerID: player1.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.turn).toEqual(2);
    });
  });
  describe('Testing the round system', () => {
    it('accumulate the chips into the pot at the end of the round and perform a flop', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.bets = {
        [player1.id]: 130,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(415);
      expect(game.state.communityCards).toHaveLength(3);
    });
    it('At the end of the second betting round, a turn is performed', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 10, suit: 'CLUBS' },
        { value: 9, suit: 'HEARTS' },
        { value: 'JACK', suit: 'DIAMONDS' },
      ];
      game.state.bets = {
        [player1.id]: 130,
        [player2.id]: 54,
        [player3.id]: 200,
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(414);
      expect(game.state.communityCards).toHaveLength(4);
    });
    it('player 1 wins the hand with a straight so he gets the pot', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 10, suit: 'CLUBS' },
        { value: 9, suit: 'HEARTS' },
        { value: 'JACK', suit: 'DIAMONDS' },
        { value: 'QUEEN', suit: 'SPADES' },
        { value: 8, suit: 'DIAMONDS' },
      ];
      game.state.bets = {
        [player1.id]: 130,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 7, suit: 'DIAMONDS' },
          { value: 6, suit: 'HEARTS' },
        ],
        [player2.id]: [
          { value: 10, suit: 'HEARTS' },
          { value: 'ACE', suit: 'SPADES' },
        ],
        [player3.id]: [
          { value: 3, suit: 'CLUBS' },
          { value: 2, suit: 'SPADES' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player1.id);
    });
    it('players 2 and 3 are tied with a pair, since player 3 has the higher value (7) he wins', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 'ACE', suit: 'CLUBS' },
        { value: 2, suit: 'HEARTS' },
        { value: 5, suit: 'DIAMONDS' },
        { value: 7, suit: 'SPADES' },
        { value: 'JACK', suit: 'DIAMONDS' },
      ];
      game.state.bets = {
        [player1.id]: 135,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 5, suit: 'SPADES' },
          { value: 4, suit: 'CLUBS' },
        ],
        [player2.id]: [
          { value: 5, suit: 'SPADES' },
          { value: 5, suit: 'CLUBS' },
        ],
        [player3.id]: [
          { value: 7, suit: 'HEARTS' },
          { value: 7, suit: 'CLUBS' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player3.id);
    });
    it('players 1 and 3 have the same triplet and value 7, player 1 has the higher card with nine so he wins', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 'ACE', suit: 'CLUBS' },
        { value: 7, suit: 'DIAMONDS' },
        { value: 5, suit: 'DIAMONDS' },
        { value: 7, suit: 'SPADES' },
        { value: 'JACK', suit: 'HEARTS' },
      ];
      game.state.bets = {
        [player1.id]: 135,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 7, suit: 'SPADES' },
          { value: 9, suit: 'CLUBS' },
        ],
        [player2.id]: [
          { value: 5, suit: 'SPADES' },
          { value: 6, suit: 'CLUBS' },
        ],
        [player3.id]: [
          { value: 7, suit: 'HEARTS' },
          { value: 2, suit: 'CLUBS' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player1.id);
    });
    it('players 1 and 3 both have 2 pairs, player 1 has the higher value card so he is the winner', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 5, suit: 'SPADES' },
        { value: 7, suit: 'SPADES' },
        { value: 4, suit: 'DIAMONDS' },
        { value: 8, suit: 'SPADES' },
        { value: 'ACE', suit: 'DIAMONDS' },
      ];
      game.state.bets = {
        [player1.id]: 135,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 5, suit: 'SPADES' },
          { value: 7, suit: 'HEARTS' },
        ],
        [player2.id]: [
          { value: 8, suit: 'HEARTS' },
          { value: 4, suit: 'DIAMONDS' },
        ],
        [player3.id]: [
          { value: 'QUEEN', suit: 'SPADES' },
          { value: 'JACK', suit: 'DIAMONDS' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player2.id);
    });
    it('player 3 has a royal flush', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 5, suit: 'HEARTS' },
        { value: 7, suit: 'DIAMONDS' },
        { value: 10, suit: 'SPADES' },
        { value: 'KING', suit: 'SPADES' },
        { value: 'ACE', suit: 'SPADES' },
      ];
      game.state.bets = {
        [player1.id]: 135,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 5, suit: 'SPADES' },
          { value: 7, suit: 'HEARTS' },
        ],
        [player2.id]: [
          { value: 8, suit: 'HEARTS' },
          { value: 4, suit: 'DIAMONDS' },
        ],
        [player3.id]: [
          { value: 'QUEEN', suit: 'SPADES' },
          { value: 'JACK', suit: 'SPADES' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player3.id);
    });
    it('player 3 has a flush', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 5, suit: 'DIAMONDS' },
        { value: 7, suit: 'HEARTS' },
        { value: 10, suit: 'SPADES' },
        { value: 6, suit: 'SPADES' },
        { value: 2, suit: 'SPADES' },
      ];
      game.state.bets = {
        [player1.id]: 135,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 5, suit: 'DIAMONDS' },
          { value: 9, suit: 'HEARTS' },
        ],
        [player2.id]: [
          { value: 8, suit: 'HEARTS' },
          { value: 5, suit: 'DIAMONDS' },
        ],
        [player3.id]: [
          { value: 'QUEEN', suit: 'SPADES' },
          { value: 'JACK', suit: 'SPADES' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player3.id);
    });
    it('players 1 and 3 both have pairs, player one has the higher value card so he is the winner', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 5, suit: 'SPADES' },
        { value: 'JACK', suit: 'SPADES' },
        { value: 4, suit: 'DIAMONDS' },
        { value: 'KING', suit: 'SPADES' },
        { value: 'ACE', suit: 'DIAMONDS' },
      ];
      game.state.bets = {
        [player1.id]: 135,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 8, suit: 'SPADES' },
          { value: 4, suit: 'HEARTS' },
        ],
        [player2.id]: [
          { value: 7, suit: 'HEARTS' },
          { value: 3, suit: 'DIAMONDS' },
        ],
        [player3.id]: [
          { value: 'QUEEN', suit: 'SPADES' },
          { value: 'JACK', suit: 'DIAMONDS' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player3.id);
    });
    it('players 1 and 2 have the same hand so they split the pot', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.turn = 2;
      game.state.communityCards = [
        { value: 'ACE', suit: 'CLUBS' },
        { value: 7, suit: 'DIAMONDS' },
        { value: 5, suit: 'DIAMONDS' },
        { value: 7, suit: 'SPADES' },
        { value: 'JACK', suit: 'HEARTS' },
      ];
      game.state.bets = {
        [player1.id]: 135,
        [player2.id]: 55,
        [player3.id]: 200,
      };
      game.state.cards = {
        [player1.id]: [
          { value: 7, suit: 'SPADES' },
          { value: 9, suit: 'CLUBS' },
        ],
        [player2.id]: [
          { value: 5, suit: 'SPADES' },
          { value: 6, suit: 'CLUBS' },
        ],
        [player3.id]: [
          { value: 7, suit: 'HEARTS' },
          { value: 9, suit: 'CLUBS' },
        ],
      };
      game.applyMove({
        playerID: player3.id,
        gameID: game.id,
        move: {
          moveType: 'CHECK',
        },
      });
      expect(game.state.pot).toEqual(0);
      expect(game.state.winner).toEqual(player1.id);
      expect(game.state.chips[player1.id]).toEqual(1210);
    });
  });
  // Implementing the tests for the join method
  describe('Testing the join function', () => {
    it('should add a player to the game', () => {
      game.join(player1);
      expect(game.state.chips[player1.id]).toEqual(game.defaultChipValue);
      expect(game.players).toContainEqual(player1);
    });

    it('should throw an error if the game is already full', () => {
      const maxPlayers = 6;
      for (let i = 0; i < maxPlayers; i++) {
        game.join(createPlayerForTesting());
      }
      const extraPlayer = createPlayerForTesting();
      expect(() => game.join(extraPlayer)).toThrowError(GAME_FULL_MESSAGE);
    });

    it('should throw an error if the game is in progress', () => {
      game.state.status = 'IN_PROGRESS';
      expect(() => game.join(player1)).toThrowError(GAME_IN_PROGRESS_MESSAGE);
    });

    it('should throw an error if the player is already in the game', () => {
      game.join(player1);
      expect(() => game.join(player1)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });

    it('should assign dealer, small blind, and big blind roles correctly', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);

      expect(game.state.dealer).toEqual(player1.id);
      expect(game.state.smallBlind).toEqual(player2.id);
      expect(game.state.bigBlind).toEqual(player3.id);
    });
    it('should allow a player to join if the game is not full', () => {
      game.join(player1);
      expect(game.players).toContain(player1);
      expect(game.state.status).toEqual('WAITING_TO_START');
    });
    it('should handle joining when the game is in different states', () => {
      game.state.status = 'WAITING_TO_START';
      game.join(player1);
      expect(game.players).toContain(player1);
      game.state.status = 'IN_PROGRESS';
      expect(() => game.join(player2)).toThrowError(GAME_IN_PROGRESS_MESSAGE);
    });
    it('should correctly update the chips object when a player joins', () => {
      game.join(player1);
      expect(game.state.chips[player1.id]).toBeDefined();
      expect(game.state.chips[player1.id]).toBeGreaterThan(0);
    });
  });
  describe('Testing for leave function', () => {
    it('should remove a player from the game when they leave', () => {
      game.join(player1);
      game.join(player2);
      game.leave(player1);
      expect(game.players).not.toContain(player1);
      expect(game.players).toContain(player2);
    });

    it('should not allow a player to leave if they are not in the game', () => {
      const newPlayer = createPlayerForTesting();
      expect(() => game.leave(newPlayer)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    });

    it('should reduce the number of players in the game after a player leaves', () => {
      game.join(player1);
      game.join(player2);
      expect(game.players.length).toEqual(2);
      game.leave(player1);
      expect(game.players.length).toEqual(1);
    });

    it('should handle a player leaving during the game in progress and mark them as folded', () => {
      game.join(player1);
      game.join(player2);
      game.state.status = 'IN_PROGRESS';
      game.leave(player1);
      expect(game.state.foldedPlayers).toContain(player1.id);
      expect(game.players.find(p => p.id === player1.id)).toBeUndefined();
    });

    it('should update dealer, small blind, and big blind roles when a player leaves', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.dealer = player1.id;
      game.state.smallBlind = player2.id;
      game.state.bigBlind = player3.id;
      game.leave(player1);
      expect(game.state.dealer).toBe(player2.id);
      expect(game.state.smallBlind).toBe(player3.id);
      expect(game.state.bigBlind).toBeUndefined();
    });

    it('should handle when there is one last player remaining', () => {
      const player4 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.join(player4);
      game.state.status = 'IN_PROGRESS';
      game.leave(player1);
      game.leave(player2);
      game.leave(player3);
      expect(game.players.length).toEqual(1);
      expect(game.state.status).toEqual('OVER');
      expect(game.state.winner).toEqual(player4.id);
    });
    it('should handle when Everyone leaves the game', () => {
      const player4 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.join(player4);
      game.state.status = 'IN_PROGRESS';
      game.leave(player1);
      game.leave(player2);
      game.leave(player3);
      game.leave(player4);
      expect(game.players.length).toEqual(0);
      expect(game.state.status).toEqual('OVER');
      expect(game.state.foldedPlayers.length).toEqual(0);
    });
    it('should update the chips object when a player leaves', () => {
      game.join(player1);
      game.state.chips[player1.id] = 100;
      game.leave(player1);
      expect(game.state.chips[player1.id]).toBeUndefined();
    });
    it('should update the bet object when a player leaves', () => {
      game.join(player1);
      game.state.bets[player1.id] = 10;
      game.leave(player1);
      expect(game.state.bets[player1.id]).toBeUndefined();
    });

    it('should update the card object when a player leaves', () => {
      game.join(player1);
      game.leave(player1);
      expect(game.state.cards[player1.id]).toBeUndefined();
    });

    // it('should allow a player to leave if they have already folded', () => {
    //   game.join(player1);
    //   game.join(player2);
    //   // check this in case an error appears with any
    //   const state = Object.getPrototypeOf(game).state as any;
    //   state.foldedPlayers = [...state.foldedPlayers, player2.id];
    //   game.leave(player2);
    //   expect(game.state.foldedPlayers).toContain(player2);
    //   expect(game.players).toContain(player2);
    // });
  });
  // Implementing the tests for the applyMove Method
  describe('Testing the applyMove function', () => {
    it('should allow player bet', () => {
      game.join(player1);
      game.state.chips[player1.id] = 100;
      game.applyMove({
        playerID: player1.id,
        gameID: game.id,
        move: {
          moveType: 'BET',
          bet: 50,
        },
      });
      expect(game.state.bets[player1.id]).toEqual(0);
      expect(game.state.currentBet).toEqual(50);
      expect(game.state.chips[player1.id]).toEqual(50);
    });
    it('should not bet the player if the bet is invalid', () => {
      game.join(player1);
      game.state.chips[player1.id] = 100;
      game.applyMove({
        playerID: player1.id,
        gameID: game.id,
        move: {
          moveType: 'BET',
          bet: 200,
        },
      });
      expect(game.state.bets[player1.id]).toEqual(0);
      expect(game.state.chips[player1.id]).toEqual(100);
    });
    it('should create a side pot when a player goes all-in', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.chips[player1.id] = 50;
      game.state.chips[player2.id] = 200;

      game.applyMove({
        playerID: player1.id,
        gameID: game.id,
        move: {
          moveType: 'BET',
          bet: 50,
        },
      });

      game.applyMove({
        playerID: player2.id,
        gameID: game.id,
        move: {
          moveType: 'BET',
          bet: 100,
        },
      });

      expect(game.state.bets[player1.id]).toEqual(50);
      expect(game.state.bets[player2.id]).toEqual(100);
      expect(game.state.chips[player1.id]).toEqual(0);
      expect(game.state.chips[player2.id]).toEqual(100);
      expect(game.state.sidePot).toEqual(50);
    });
    it('should allow a player to call a bet', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.chips[player1.id] = 50;
      game.state.chips[player2.id] = 200;
      game.applyMove({
        playerID: player1.id,
        gameID: game.id,
        move: {
          moveType: 'BET',
          bet: 50,
        },
      });

      game.applyMove({
        playerID: player2.id,
        gameID: game.id,
        move: {
          moveType: 'CALL',
        },
      });

      expect(game.state.bets[player2.id]).toEqual(50); // Player is small blind
      expect(game.state.chips[player2.id]).toEqual(150);
    });

    it('should not allow a player to call if they do not have enough chips', () => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.state.chips[player1.id] = 100;
      game.state.chips[player2.id] = 30; // Set player2's chips to less than the current bet

      game.applyMove({
        playerID: player1.id,
        gameID: game.id,
        move: {
          moveType: 'BET',
          bet: 50,
        },
      });
      game.applyMove({
        playerID: player2.id,
        gameID: game.id,
        move: {
          moveType: 'CALL',
        },
      });

      expect(game.state.bets[player1.id]).toEqual(50);
      expect(game.state.chips[player1.id]).toEqual(50);
      expect(game.state.bets[player2.id]).toEqual(0); // Player is small blind
      expect(game.state.chips[player2.id]).toEqual(30);
    });
  });
});
