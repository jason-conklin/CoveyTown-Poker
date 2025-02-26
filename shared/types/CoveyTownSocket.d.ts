export type TownJoinResponse = {
  /** Unique ID that represents this player * */
  userID: string;
  /** Secret token that this player should use to authenticate
   * in future requests to this service * */
  sessionToken: string;
  /** Secret token that this player should use to authenticate
   * in future requests to the video service * */
  providerVideoToken: string;
  /** List of players currently in this town * */
  currentPlayers: Player[];
  /** Friendly name of this town * */
  friendlyName: string;
  /** Is this a private town? * */
  isPubliclyListed: boolean;
  /** Current state of interactables in this town */
  interactables: TypedInteractable[];
}

export type InteractableType = 'ConversationArea' | 'ViewingArea' | 'PokerArea';
export interface Interactable {
  type: InteractableType;
  id: InteractableID;
  occupants: PlayerID[];
}

export type TownSettingsUpdate = {
  friendlyName?: string;
  isPubliclyListed?: boolean;
}

export type Direction = 'front' | 'back' | 'left' | 'right';
export type PlayerID = string;
export interface Player {
  id: PlayerID;
  userName: string;
  location: PlayerLocation;
};

export type XY = { x: number, y: number };

export interface PlayerLocation {
  /* The CENTER x coordinate of this player's location */
  x: number;
  /* The CENTER y coordinate of this player's location */
  y: number;
  /** @enum {string} */
  rotation: Direction;
  moving: boolean;
  interactableID?: string;
};
export type ChatMessage = {
  author: string;
  sid: string;
  body: string;
  dateCreated: Date;
};

export interface ConversationArea extends Interactable{
  topic?: string;
};
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GameStatus = 'IN_PROGRESS' | 'WAITING_TO_START' | 'OVER';
/**
 * Base type for the state of a game
 */
export interface GameState {
  status: GameStatus;
} 

export type InteractableID = string;
export type GameInstanceID = string;

export interface WinnableGameState extends GameState {
  winner?: PlayerID;
}
/**
 * Base type for a move in a game. Implementers should also extend MoveType
 * @see MoveType
 */
export interface GameMove<MoveType> {
  playerID: PlayerID;
  gameID: GameInstanceID;
  move: MoveType;
}

/**
 * Poker Types
 * IMPORTANT: The Poker types are not yet implemented. They are provided as an example of how to implement a new game
 * The GameArea should include the roundHistory
 * InteractableCommand will need to account for GameMoveCommand<PokerMove>
 * GameInstance will need to have maxPlayers
 */

export type CardSuit = 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';

export interface Card {
  suit: CardSuit;
  value: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'KING' | 'QUEEN' | 'JACK' | 'ACE';
};

export type PokerMoveType = 'CHECK' | 'FOLD' | 'BET' | 'CALL'

export interface PokerMove {
  // BET accounts for both raising, betting, and going all in
  moveType: PokerMoveType;
  bet?: number;
}
export interface PlayerCards {
  [playerID: PlayerID]: card[];
}

export interface PlayerChips {
  [playerID: PlayerID]: number;
}

export interface PlayerBets {
  [playerID: PlayerID]: number;
}

export interface PokerGameState extends WinnableGameState {
  event?: 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
  moves: ReadonlyArray<PokerMove>;
  foldedPlayers: ReadonlyArray<PlayerID>;
  bets: PlayerBets;
  currentBet: number;
  chips: PlayerChips
  deck: Card[];
  cards: PlayerCards
  communityCards: Card[];
  pot: number;
  bigBlind?: PlayerID;
  smallBlind?: PlayerID;
  dealer?: PlayerID;
  sidePot?: number;
  turn: number
  winningHand?: string;
  firstPlayer: number;
}

export type InteractableID = string;
export type GameInstanceID = string;

/**
 * defines a move for poker. Records the player who makes his move, the move he wants to make 
 * and if needed, the amount the player want to raise his bet
 */
export interface PokerMove {
  moveType: PokerMoveType;
  bet?: number;
}

/**
 * Base type for an *instance* of a game. An instance of a game
 * consists of the present state of the game (which can change over time),
 * the players in the game, and the result of the game
 * @see GameState
 */
export interface GameInstance<T extends GameState> {
  state: T;
  id: GameInstanceID;
  players: PlayerID[];
  result?: GameResult;
}

export interface GameResult {
  gameID: GameInstanceID;
  scores: { [playerName: string]: number };
}

/**
 * Base type for an area that can host a game
 * @see GameInstance
 */
export interface GameArea<T extends GameState> extends Interactable {
  game: GameInstance<T> | undefined;
  history: GameResult[];
}

export interface ViewingArea extends Interactable {
  id: string;
  video?: string;
  isPlaying: boolean;
  elapsedTimeSec: number;
}

export type CommandID = string;

/**
 * Base type for a command that can be sent to an interactable.
 * This type is used only by the client/server interface, which decorates
 * an @see InteractableCommand with a commandID and interactableID
 */
interface InteractableCommandBase {
  /**
   * A unique ID for this command. This ID is used to match a command against a response
   */
  commandID: CommandID;
  /**
   * The ID of the interactable that this command is being sent to
   */
  interactableID: InteractableID;
  /**
   * The type of this command
   */
  type: string;
}

export type InteractableCommand =  ViewingAreaUpdateCommand | JoinGameCommand | GameMoveCommand<PokerMove> | LeaveGameCommand | StartGameCommand;
export interface ViewingAreaUpdateCommand  {
  type: 'ViewingAreaUpdate';
  update: ViewingArea;
}
export interface JoinGameCommand {
  type: 'JoinGame';
}
export interface LeaveGameCommand {
  type: 'LeaveGame';
  gameID: GameInstanceID;
}
export interface GameMoveCommand<MoveType> {
  type: 'GameMove';
  gameID: GameInstanceID;
  move: MoveType;
}
export interface StartGameCommand {
  type: 'StartGame';
}
export type InteractableCommandReturnType<CommandType extends InteractableCommand> = 
  CommandType extends JoinGameCommand ? { gameID: string}:
  CommandType extends ViewingAreaUpdateCommand ? undefined :
  CommandType extends GameMoveCommand<PokerMove> ? undefined :
  CommandType extends LeaveGameCommand ? undefined :
  CommandType extends StartGameCommand ? undefined :
  never;

export type InteractableCommandResponse<MessageType> = {
  commandID: CommandID;
  interactableID: InteractableID;
  error?: string;
  payload?: InteractableCommandResponseMap[MessageType];
}

export interface ServerToClientEvents {
  playerMoved: (movedPlayer: Player) => void;
  playerDisconnect: (disconnectedPlayer: Player) => void;
  playerJoined: (newPlayer: Player) => void;
  initialize: (initialData: TownJoinResponse) => void;
  townSettingsUpdated: (update: TownSettingsUpdate) => void;
  townClosing: () => void;
  chatMessage: (message: ChatMessage) => void;
  interactableUpdate: (interactable: Interactable) => void;
  commandResponse: (response: InteractableCommandResponse) => void;
}

export interface ClientToServerEvents {
  chatMessage: (message: ChatMessage) => void;
  playerMovement: (movementData: PlayerLocation) => void;
  interactableUpdate: (update: Interactable) => void;
  interactableCommand: (command: InteractableCommand & InteractableCommandBase) => void;
}
