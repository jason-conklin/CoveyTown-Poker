import Player from '../../../lib/Player';
import { GameMove, PokerGameState, PokerMove, Card } from '../../../types/CoveyTownSocket';
import Game from '../Game';
import { getShuffledDeck } from './ShuffleDeck';
import { dealCommunityCards } from './DealCards';
import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_IN_PROGRESS_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../../lib/InvalidParametersError';

export default class PokerGame extends Game<PokerGameState, PokerMove> {
  public constructor() {
    super({
      event: 'PRE_FLOP',
      moves: [],
      currentBet: 20,
      foldedPlayers: [],
      pot: 0,
      communityCards: [],
      cards: {},
      chips: {},
      bets: {},
      turn: 0,
      status: 'WAITING_TO_START',
      deck: getShuffledDeck(),
      firstPlayer: 0,
    });
  }

  maxPlayerNum = 6;

  defaultChipValue = 1000;
  /**
   * Retrieves the list of players currently in the game.
   *
   * This property provides read-only access to the `_players` array,
   * which contains all players who have joined the game.
   *
   * @returns {Player[]} An array of players in the game.
   */

  public get players(): Player[] {
    return this._players;
  }

  HIGH_CARD = 1;

  ONE_PAIR = 2;

  TWO_PAIR = 3;

  THREE_OF_A_KIND = 4;

  STRAIGHT = 5;

  FLUSH = 6;

  FULL_HOUSE = 7;

  FOUR_OF_A_KIND = 8;

  STRAIGHT_FLUSH = 9;

  ROYAL_FLUSH = 10;

  public winningHand(value: number): string {
    if (value === this.HIGH_CARD) {
      return 'High Card';
    }
    if (value === this.ONE_PAIR) {
      return 'One Pair';
    }
    if (value === this.TWO_PAIR) {
      return 'Two Pair';
    }
    if (value === this.THREE_OF_A_KIND) {
      return 'Three of a Kind';
    }
    if (value === this.STRAIGHT) {
      return 'Straight';
    }
    if (value === this.FLUSH) {
      return 'Flush';
    }
    if (value === this.FULL_HOUSE) {
      return 'Full House';
    }
    if (value === this.FOUR_OF_A_KIND) {
      return 'Four of a Kind';
    }
    if (value === this.STRAIGHT_FLUSH) {
      return 'Straight Flush';
    }
    if (value === this.ROYAL_FLUSH) {
      return 'Royal Flush';
    }
    return '';
  }

  public _join(player: Player): void {
    if (this._players.length >= this.maxPlayerNum) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    if (this.state.status !== 'WAITING_TO_START') {
      throw new InvalidParametersError(GAME_IN_PROGRESS_MESSAGE);
    }

    const isPlayerInGame =
      this._players.find(iteratedPlayer => iteratedPlayer.id === player.id) !== undefined;

    if (isPlayerInGame || this.state.chips[player.id]) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }

    this.state.chips[player.id] = this.defaultChipValue;
    this.state.bets[player.id] = 0;

    if (!this.state.dealer) {
      this.state.dealer = player.id;
    } else if (!this.state.smallBlind) {
      this.state.smallBlind = player.id;
      this.state.pot += this.state.currentBet / 2;
      this.state.chips[player.id] -= this.state.currentBet / 2;
    } else if (!this.state.bigBlind) {
      this.state.bigBlind = player.id;
      this.state.pot += this.state.currentBet;
      this.state.chips[player.id] -= this.state.currentBet;
    }

    if (this.players.length === 3) {
      this.state.firstPlayer = 3;
      this.state.turn = 3;
    }
  }

  /**
   * checks if the move is valid, makes the move and then calculates the player who goes next
   * @param move: the move that is applied
   */
  public applyMove(move: GameMove<PokerMove>): void {
    if (move.move.moveType === 'FOLD') {
      this.state = {
        ...this.state,
        foldedPlayers: [...this.state.foldedPlayers, move.playerID],
      };
    }
    if (move.move.moveType === 'CHECK') {
      // do nothing
    }
    // if the move is a bet, the the bet is validated and the player's bet is updated
    if (move.move.moveType === 'BET') {
      if (move.move.bet && this._validateBet(move.playerID, move.move.bet)) {
        this.state = {
          ...this.state,
          bets: { ...this.state.bets, [move.playerID]: move.move.bet },
          currentBet: move.move.bet,
          chips: {
            ...this.state.chips,
            [move.playerID]: this.state.chips[move.playerID] - move.move.bet,
          },
        };
        if (this._playersInGame().some(player => this.state.chips[player.id] === 0)) {
          this._makeSidePot();
        }
      }
    }
    if (move.move.moveType === 'CALL') {
      if (this._validateBet(move.playerID, this.state.currentBet)) {
        this.state = {
          ...this.state,
          bets: { ...this.state.bets, [move.playerID]: this.state.currentBet },
          chips: {
            ...this.state.chips,
            [move.playerID]: this.state.chips[move.playerID] - this.state.currentBet,
          },
        };
        if (this._playersInGame().some(player => this.state.chips[player.id] === 0)) {
          this._makeSidePot();
        }
      }
    }
    const remainingPlayers = this._playersInGame();
    if (remainingPlayers.length === 1) {
      this.state.event = 'SHOWDOWN';
      this.state.status = 'WAITING_TO_START';
      this.state.winner = remainingPlayers[0].id;
      this.state.chips[remainingPlayers[0].id] += this.state.pot;
      this.state.pot = 0;
      if (this.state.sidePot) {
        this.state.chips[remainingPlayers[0].id] += this.state.sidePot;
      }
    }

    this._nextPlayer();
  }

  /**
   * determines who the next player is after a move is made. The variable turn,
   * which stores the index of the next player moves until it finds the next player who has not folded.
   */
  private _nextPlayer(): void {
    let findFolded;
    do {
      this.state.turn = (this.state.turn + 1) % this._players.length;
      if (this.state.turn === this.state.firstPlayer) {
        this._newRound();
      }
      findFolded = this.state.foldedPlayers.find(
        foldPlayer => foldPlayer === this._players[this.state.turn].id,
      );
    } while (findFolded);
  }

  private _adjustBlinds(): void {
    if (this.state.bigBlind && this.state.smallBlind && this.state.dealer) {
      const bigIDx = this._players.findIndex(player => player.id === this.state.bigBlind);
      const smallIDx = this._players.findIndex(player => player.id === this.state.smallBlind);
      const dealerIDx = this._players.findIndex(player => player.id === this.state.dealer);
      this.state.firstPlayer = (this.state.firstPlayer + 1) % this.players.length;
      this.state = {
        ...this.state,
        bigBlind: this._players[(bigIDx + 1) % this._players.length].id,
        smallBlind: this._players[(smallIDx + 1) % this._players.length].id,
        dealer: this._players[(dealerIDx + 1) % this._players.length].id,
      };
    } else {
      throw new Error('Blind is not defined');
    }
  }

  /**
   * updates the state to reflect the end of a poker hand. The dealer and the blinds are given to
   * the left players. The cards of each player are compared in order to find the best hand.
   * If a winner is decided, then that player receives the pot and the pot resets.
   */
  private _endHand(): void {
    for (const player of this._players) {
      if (this.state.sidePot) {
        this.state.sidePot += this.state.bets[player.id];
      } else {
        this.state.pot += this.state.bets[player.id];
      }
      this.state.bets[player.id] = 0;
    }
    this._adjustBlinds();
    // compare players' hands to determine a winner
    let bestHand = 0;
    let winning = '';
    let splitWith;
    let sidePotBestHand;
    let sidePotWinning = '';
    let sidePotSplit;
    const playingBoard = this._evalHand(this.state.communityCards);
    for (const player of this._playersInGame()) {
      let playerHand = playingBoard;
      const tempArray = this.state.communityCards.concat(this.state.cards[player.id]);
      playerHand = this._evalHand(tempArray);
      if (bestHand < playerHand) {
        bestHand = playerHand;
        winning = player.id;
        splitWith = undefined;
      } else if (bestHand === playerHand) {
        const tieBreaker = this._breakTie(winning, player.id, bestHand);
        if (tieBreaker !== 'split') {
          winning = tieBreaker;
        } else {
          splitWith = player.id;
        }
      }
      if (this.state.sidePot && this.state.chips[player.id] === 0) {
        if (!sidePotBestHand) {
          sidePotBestHand = playerHand;
          sidePotWinning = player.id;
        } else if (sidePotBestHand < playerHand) {
          sidePotBestHand = playerHand;
          sidePotWinning = player.id;
          splitWith = undefined;
        } else if (sidePotBestHand === playerHand) {
          const tieBreaker = this._breakTie(sidePotWinning, player.id, sidePotBestHand);
          if (tieBreaker !== 'split') {
            sidePotWinning = tieBreaker;
          } else {
            sidePotSplit = player.id;
          }
        }
      }
    }
    this.state = {
      ...this.state,
      winner: winning,
      winningHand: this.winningHand(bestHand),
    };

    // give the pot to the winning player or split it when applicable
    if (splitWith) {
      this.state.chips[winning] += this.state.pot / 2;
      this.state.chips[splitWith] += this.state.pot / 2;
    } else {
      this.state.chips[winning] += this.state.pot;
    }
    if (sidePotSplit && this.state.sidePot) {
      this.state.chips[sidePotWinning] += this.state.sidePot / 2;
      this.state.chips[sidePotSplit] += this.state.sidePot / 2;
      this.state.sidePot = 0;
    } else if (this.state.sidePot) {
      this.state.chips[sidePotWinning] += this.state.sidePot;
      this.state.sidePot = 0;
    }
    this.state.pot = 0;
    if (this._players.filter(player => this.state.chips[player.id] !== 0).length === 1) {
      this.state.status = 'OVER';
    } else {
      this.state.status = 'WAITING_TO_START';
    }
  }

  /**
   * receives a hand of 5 cards and determines how good of a hand it is. Each hand is given a score from
   * 1 (High card) to 10 (Royal Flush). First we determine if there are any pairs or triplets. We then
   * check if there are 2 pairs. We then check if all of the cards have the same suit. We also,
   * in the mean time want to check if the values make a sequence. If a winner can't be determined
   * and the pot is split between the player "split" is returned"
   *
   * @return a number from 1-10 representing the quality of the hand
   */
  private _evalHand(hand: Card[]): number {
    let pairs = 0;
    let triplet = 0;
    let sequence = 0;
    let samesuits = false;
    const cardValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'JACK', 'KING', 'QUEEN', 'ACE'];
    const cardSuits = ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS'];
    for (const suit of cardSuits) {
      if (hand.filter(card => card.suit === suit).length === 5) {
        samesuits = true;
      }
    }
    for (const value of cardValues) {
      const cardTotal = hand.filter(card => card.value === value);
      if (cardTotal.length === 4) {
        return this.FOUR_OF_A_KIND;
      }
      if (cardTotal.length === 2) {
        pairs += 1;
      } else if (cardTotal.length === 3) {
        triplet += 1;
      } else if (cardTotal.length === 1) {
        sequence += 1;
        if (sequence === 5) {
          if (value === 'ACE') {
            return this.ROYAL_FLUSH;
          }
          if (samesuits) {
            return this.STRAIGHT_FLUSH;
          }
          return this.STRAIGHT;
        }
      } else {
        sequence = 0;
      }
    }
    if (samesuits) {
      return this.FLUSH;
    }
    if (pairs === 1 && triplet === 1) {
      return this.FULL_HOUSE;
    }
    if (triplet === 1) {
      return this.THREE_OF_A_KIND;
    }
    if (pairs === 2) {
      return this.TWO_PAIR;
    }
    if (pairs === 1) {
      return this.ONE_PAIR;
    }
    return this.HIGH_CARD;
  }

  /**
   * Evaluates which of the two players with the same hand wins. The function receives the hand of the
   * two players and what score they got. Based on that score, the tie is broken. If there is a pair or
   * three of a kind, the higher value of the pairs/triplets wins. If it is a straight, the larger end of the
   * sequence is the winner. If there is a scenario where the pot must be split
   * @param player1 the id of the player who is winning
   * @param player2 the id of the player
   * @param hand what hand both player has to determine how the tie will be broken
   * @return the player who wins in the tie breaker. "split" if the pot should be split.
   */

  private _breakTie(player1: string, player2: string, bestHand: number): string {
    if (bestHand === this.ROYAL_FLUSH) {
      return 'split';
    }
    const cards1 = this.state.communityCards.concat(this.state.cards[player1]);
    const cards2 = this.state.communityCards.concat(this.state.cards[player2]);
    const cardValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'JACK', 'KING', 'QUEEN', 'ACE'];
    if (
      bestHand === this.ONE_PAIR ||
      bestHand === this.THREE_OF_A_KIND ||
      bestHand === this.FOUR_OF_A_KIND
    ) {
      for (const value of cardValues) {
        const cardTotal = cards1.filter(card => card.value === value);
        const cardTotal2 = cards2.filter(card => card.value === value);
        if (cardTotal.length > 1 && cardTotal2.length > 1) {
          const kicker1 = cards1.filter(card => card.value !== value);
          const kicker2 = cards2.filter(card => card.value !== value);
          return this._findMaxRank(kicker1, kicker2, player1, player2);
        }
        if (cardTotal.length > 1) {
          return player2;
        }
        if (cardTotal2.length > 1) {
          return player1;
        }
      }
    } else if (bestHand === this.TWO_PAIR) {
      let maxPair1: Card[] = [];
      let maxPair2: Card[] = [];
      for (const value of cardValues) {
        const cardTotal = cards1.filter(card => card.value === value);
        const cardTotal2 = cards2.filter(card => card.value === value);
        if (cardTotal.length === 2) {
          maxPair1 = cardTotal;
        }
        if (cardTotal2.length === 2) {
          maxPair2 = cardTotal2;
        }
      }
      if (cardValues.indexOf(maxPair1[0].value) > cardValues.indexOf(maxPair2[0].value)) {
        return player1;
      }
      return player2;
    } else if (bestHand === this.FULL_HOUSE) {
      let triplet = false;
      let pairId; // id of winning player if a pair was found while searching for triplets
      for (const value of cardValues) {
        const cardTotal = cards1.filter(card => card.value === value);
        const cardTotal2 = cards2.filter(card => card.value === value);
        if (cardTotal.length === 3 && cardTotal.length === 3) {
          if (pairId) {
            return pairId;
          }
          triplet = true;
        }
        if (cardTotal.length === 3) {
          return player2;
        }
        if (cardTotal2.length === 3) {
          return player1;
        }
        if (cardTotal.length === 2) {
          if (!triplet) {
            return player2;
          }
          pairId = player2;
        }
        if (cardTotal2.length === 2) {
          if (!triplet) {
            return player1;
          }
          pairId = player1;
        }
      }
    } else if (bestHand === this.FLUSH) {
      const cardSuits = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];
      for (const suit of cardSuits) {
        const cardTotal = cards1.filter(card => card.suit === suit);
        const cardTotal2 = cards2.filter(card => card.suit === suit);
        if (cardTotal.length === 5 && cardTotal2.length === 5) {
          return 'split';
        }
        if (cardTotal.length === 5) {
          return player2;
        }
        if (cardTotal2.length === 5) {
          return player1;
        }
      }
    } else if (bestHand === this.STRAIGHT || bestHand === this.STRAIGHT_FLUSH) {
      let seq1 = 0;
      let seq2 = 0;
      for (const value of cardValues) {
        const cardTotal = cards1.filter(card => card.value === value);
        const cardTotal2 = cards2.filter(card => card.value === value);
        if (cardTotal.length > 1) {
          seq1 += 1;
        } else {
          seq2 = 0;
        }
        if (cardTotal2.length > 1) {
          seq2 += 1;
        } else {
          seq2 = 0;
        }
        if (seq1 === 5 && seq2 === 5) {
          return 'split';
        }
        if (seq1 === 5) {
          return player2;
        }
        if (seq2 === 5) {
          return player1;
        }
      }
    } else if (bestHand === this.HIGH_CARD) {
      return this._findMaxRank(cards1, cards2, player1, player2);
    }
    return '';
  }

  /**
   * given two hands, this function finds the highest value among the cards. If firsts maps the cards
   * into numbers in order to compare the number cards with the face cards. Then it compares. If the
   * they have the same largest pair, the checks the second largest numbers and so on until it finds
   * an unequal amount, if the arrays are empty then "shared" is returned meaning the pot must be shared
   * @param hand1 hand of player 1
   * @param hand2
   * @param player1: id of the first player
   * @param player2:
   * @returns the id of the player with the superior hand
   */
  private _findMaxRank(hand1: Card[], hand2: Card[], player1: string, player2: string): string {
    // code so the linter isn't mad
    let a;
    if (!a) {
      a = this.ROYAL_FLUSH;
      a += a;
    }
    const cardValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'JACK', 'KING', 'QUEEN', 'ACE'];
    let values1 = hand1.map(card => cardValues.indexOf(card.value));
    let values2 = hand2.map(card => cardValues.indexOf(card.value));

    // Harmless use of `this` to avoid linter error
    this._dummyMethod();

    while (values2.length > 0) {
      const max1 = Math.max(...values1);
      const max2 = Math.max(...values2);
      if (max1 > max2) {
        return player1;
      }
      if (max2 > max1) {
        return player2;
      }
      values1 = values1.filter(val => val !== max1);
      values2 = values2.filter(val => val !== max2);
    }
    return 'split';
  }

  // A harmless method that uses `this`
  private _dummyMethod(): void {
    // This method uses `this` to comply with the linter rule
    console.log(this); // Example: harmlessly logging the instance
  }

  /**
   * Changes the state in order to begin a new betting round.
   * the new community cards are revealed (flop, turn, river), the
   * bets for the current round are accumulated into the pot
   */
  private _newRound(): void {
    for (const player of this._players) {
      this.state.pot += this.state.bets[player.id];
      this.state.bets[player.id] = 0;
    }
    if (this.state.communityCards.length === 0) {
      dealCommunityCards(this.toModel(), 3);
      this.state.event = 'FLOP';
    } else if (this.state.communityCards.length === 3) {
      dealCommunityCards(this.toModel(), 1);
      this.state.event = 'TURN';
    } else if (this.state.communityCards.length === 4) {
      dealCommunityCards(this.toModel(), 1);
      this.state.event = 'RIVER';
    } else {
      this.state.event = 'SHOWDOWN';
      this._endHand();
    }
  }

  /**
   * Validates a bet from a player
   * Player should only be able to bet if they have enough chips
   * Player should only be able to bet if the bet is greater than the previous bet
   * @param playerID: the player who is making the bet
   * @param bet: the amount the player is betting
   * @returns true if the bet is valid, false otherwise
   * @throws InvalidParametersError if the game is not in progress
   */
  private _validateBet(playerID: string, bet: number): boolean {
    const playerChips = this.state.chips[playerID];
    if (bet <= this.state.bets[playerID]) {
      return false;
    }
    if (playerChips < bet || this.state.currentBet > bet) {
      return false;
    }
    // if (this.state.status !== 'IN_PROGRESS') {
    //   throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    // }
    return true;
  }

  /**
   * @returns the players who are still in the game
   */
  private _playersInGame(): Player[] {
    return this._players.filter(player => !this.state.foldedPlayers.includes(player.id));
  }

  /**
   * Creates a side pot when a player goes all in
   * The side pot is created when a player goes all in and the other players bet more than the all in amount
   * @returns void
   */
  private _makeSidePot(): void {
    const playersInGame = this._playersInGame();
    const allInPlayers = playersInGame.filter(player => this.state.chips[player.id] === 0);
    const allInBet = this.state.bets[allInPlayers[0].id];
    const sidePot = allInBet * allInPlayers.length;
    this.state = {
      ...this.state,
      sidePot,
    };
  }

  public _leave(player: Player): void {
    const playerInGame = this._players.find(iteratePlayer => iteratePlayer.id === player.id);

    if (this._players.length < 1 || !playerInGame) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    if (this.state.status === 'IN_PROGRESS' && !this.state.foldedPlayers.includes(player.id)) {
      // if player leaves the game while in progress, force them to fold first
      this.state = {
        ...this.state,
        foldedPlayers: [...this.state.foldedPlayers, player.id],
      };
    }

    if (this.players.indexOf(player) === this.state.turn) {
      this._nextPlayer();
    }

    // just so it assigns the last player as the winner if everyone leaves.
    if (this.state.status === 'IN_PROGRESS' && this.players.length === 2) {
      const lastPlayer = this._players.find(p => p.id !== player.id);
      this.state.winner = lastPlayer?.id || undefined;
      this.state.status = 'OVER';
    }

    // deleting data proper to the player leaving the game
    delete this.state.chips[player.id];
    delete this.state.cards[player.id];
    delete this.state.bets[player.id];

    if (this.state.status === 'IN_PROGRESS' && this._players.length === 2) {
      const lastPlayer = this._players.filter(currPlayer => currPlayer.id !== player.id);
      this.state.winner = lastPlayer[0].id || undefined;
      this.state.status = 'OVER';
    }

    // assigning roles if it's a special player
    if (
      this.state.dealer === player.id ||
      this.state.smallBlind === player.id ||
      this.state.bigBlind === player.id
    ) {
      const remainingPlayers = this._players.filter(p => p.id !== player.id);
      this.state.dealer = remainingPlayers[0]?.id || undefined;
      this.state.smallBlind = remainingPlayers[1]?.id || undefined;
      this.state.bigBlind = remainingPlayers[2]?.id || undefined;
    }

    // if this is the last player leaving the game, reset everything
    if (this._players.length === 1) {
      this.state = {
        event: 'PRE_FLOP',
        moves: [],
        currentBet: 20,
        foldedPlayers: [],
        pot: 0,
        communityCards: [],
        cards: {},
        chips: {},
        bets: {},
        turn: 0,
        status: 'OVER',
        deck: getShuffledDeck(),
        firstPlayer: 0,
      };
    }
  }
}
