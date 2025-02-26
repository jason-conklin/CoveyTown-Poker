import _ from 'lodash';
import {
  GameArea,
  GameStatus,
  PokerGameState,
  PlayerID,
  Card,
  PokerMoveType,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import GameAreaController, { GameEventTypes } from './GameAreaController';

export const PLAYER_NOT_IN_GAME_ERROR = 'Player is not in game';
export const NO_GAME_IN_PROGRESS_ERROR = 'No game in progress';

export type PokerEvents = GameEventTypes & {
  turnChanged: (isOurTurn: boolean) => void;
  potChanged: (pot: number) => void;
  currentBetChanged: (currentBet: number) => void;
  sidePotChanged: (sidepot: number | undefined) => void;
  betsChanged: (bet: { [player: string]: number }) => void;
  communityCardsChanged: (communityCards: Card[]) => void;
  playerCardsChanged: (cards: { [player: string]: Card[] }) => void;
  foldedPlayersChanged: (foldedPlayers: ReadonlyArray<PlayerID>) => void;
  tableChanged: (table: { communityCards: Card[]; playerHands: Record<PlayerID, Card[]> }) => void;
};

/**
 * This class is responsible for managing the state of a Poker game and for sending commands to the server.
 */
export default class PokerAreaController extends GameAreaController<PokerGameState, PokerEvents> {
  /**
   * Returns true if the game is in progress
   */
  get whoseTurn(): PlayerController | undefined {
    if (this._model.game) {
      return this._townController.players[this._model.game.state.turn];
    }
    return undefined;
  }

  get winner(): PlayerController | undefined {
    if (this._model.game && this._model.game.state.winner) {
      return this._townController.getPlayer(this._model.game?.state.winner);
    }
  }

  get winningHand(): string {
    return this._model.game?.state.winningHand || '';
  }

  /**
   * Returns true if the game is in progress
   */
  get isOurTurn(): boolean {
    return this._townController.ourPlayer === this.whoseTurn;
  }

  get foldedPlayers(): ReadonlyArray<PlayerID> {
    return this._model.game?.state.foldedPlayers || [];
  }

  public isActive(): boolean {
    if (this.status && this.status !== 'OVER') {
      return true;
    }
    return false;
  }

  get currentBet(): number {
    return this._model.game?.state.currentBet || 0;
  }

  /**
   * checks if our player has folded
   */
  get isFolded(): boolean {
    return this.foldedPlayers.includes(this._townController.ourPlayer.id);
  }

  get sidepot(): number | undefined {
    return this._model.game?.state.sidePot;
  }

  get bets(): { [player: string]: number } {
    return this._model.game?.state.bets || {};
  }

  get cards(): { [player: string]: Card[] } {
    return this._model.game?.state.cards || {};
  }

  get chips(): { [player: string]: number } {
    return this._model.game?.state.chips || {};
  }

  get ourCards(): Card[] {
    return this.cards[this._townController.ourPlayer.id];
  }

  /**
   * Returns true if the current player is a player in this game
   */
  get isPlayer(): boolean {
    if (this._model.game?.players.includes(this._townController.ourPlayer.id)) {
      return true;
    }
    return false;
  }

  /**
   * Returns the status of the game.
   * Defaults to 'WAITING_TO_START' if the game is not in progress.
   */
  get status(): GameStatus {
    return this._model.game?.state.status || 'WAITING_TO_START';
  }

  /**
   * Check if the round is over based on the current game status.
   */
  get isRoundOver(): boolean {
    return this._model.game?.state.event === 'SHOWDOWN';
  }

  /**
   * Returns the community cards on the table.
   */
  get communityCards(): Card[] {
    return this._model.game?.state.communityCards || [];
  }

  /**
   * Returns the current player's hand if they are in the game.
   * Throws an error if the player is not part of the game.
   */
  get playerHand(): Card[] {
    const playerID = this._townController.ourPlayer.id;
    const hand = this._model.game?.state.cards[playerID];
    if (!hand) {
      throw new Error(PLAYER_NOT_IN_GAME_ERROR);
    }
    return hand;
  }

  /**
   * Returns the current state of the Poker table.
   * The table includes community cards and player hands, mapped by player ID.
   */
  get table(): { communityCards: Card[]; playerHands: Record<PlayerID, Card[]> } {
    const communityCards = this.communityCards; // The community cards on the table
    const playerHands: Record<PlayerID, Card[]> = {};

    const allPlayers = this._townController.players || [];
    const playerCards = this._model.game?.state.cards || {};

    // Map each player's hand to their player ID
    for (const player of allPlayers) {
      playerHands[player.id] = playerCards[player.id] || [];
    }

    return { communityCards, playerHands };
  }

  /**
   * Returns the ID of the current player.
   */
  public get currentPlayerID(): string {
    return this._townController.ourPlayer.id;
  }

  public get case(): string | undefined {
    return this._model.game?.state.event;
  }

  /**
   * Returns the ID of the current player.
   */
  public get currentPlayerName(): string {
    return this._townController.ourPlayer.userName;
  }

  /**
   * Returns the current pot value.
   */
  get pot(): number {
    return this._model.game?.state.pot || 0;
  }

  /**
   * Updates the internal state of this PokerAreaController to match the new model.
   *
   * Emits events for changes in community cards, the pot, and the current turn.
   */
  protected _updateFrom(newModel: GameArea<PokerGameState>): void {
    const oldCommCards = this.communityCards;
    const oldPot = this.pot;
    const oldBets = this.bets;
    const oldTurn = this.whoseTurn;
    const oldSidePot = this.sidepot;
    const oldCards = this.cards;
    const oldFoldedPlayers = this.foldedPlayers;
    const oldTable = this.table;
    const oldCurentBet = this.currentBet;
    super._updateFrom(newModel);
    if (oldTurn !== this.whoseTurn) {
      this.emit('turnChanged', this.isOurTurn);
    }
    if (oldPot !== this.pot) {
      this.emit('potChanged', this.pot);
    }
    if (this.sidepot != oldSidePot) {
      this.emit('sidePotChanged', this.sidepot);
    }
    if (!_.isEqual(oldBets, this.bets)) {
      this.emit('betsChanged', this.bets);
    }
    if (!_.isEqual(oldCommCards, this.communityCards)) {
      this.emit('communityCardsChanged', this.communityCards);
    }
    if (!_.isEqual(oldCards, this.cards)) {
      this.emit('playerCardsChanged', this.cards);
    }
    if (!_.isEqual(oldFoldedPlayers, this.foldedPlayers)) {
      this.emit('foldedPlayersChanged', this.foldedPlayers);
    }
    if (!_.isEqual(oldTable, this.table)) {
      this.emit('tableChanged', this.table);
    }
    if (oldCurentBet !== this.currentBet) {
      this.emit('currentBetChanged', this.currentBet);
    }
  }

  /**
   * Sends a request to the server to start the game.
   */

  public async startGame() {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'StartGame',
    });
  }

  /**
   * Sends a Poker move to the server.
   *
   * @param moveType The type of move to make (e.g., 'BET', 'CHECK', 'FOLD', 'CALL').
   * @param bet The amount to bet or raise, if applicable (optional).
   */
  public async makeMove(moveType: PokerMoveType, bet?: number): Promise<void> {
    if (this._model.game?.state.status !== 'IN_PROGRESS' || !this._instanceID) {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }

    await this._townController.sendInteractableCommand(this.id, {
      type: 'GameMove',
      gameID: this._instanceID,
      move: {
        moveType: moveType,
        bet: bet, // Optional, needed only for 'BET', 'RAISE', or 'ALL_IN'
      },
    });
  }
}
