import {
  ConversationArea,
  Interactable,
  PokerGameState,
  ViewingArea,
  GameArea,
} from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return interactable.type === 'ConversationArea';
}

/**
 * Test to see if an interactable is a viewing area
 */
export function isViewingArea(interactable: Interactable): interactable is ViewingArea {
  return interactable.type === 'ViewingArea';
}

export function isPokerArea(interactable: Interactable): interactable is GameArea<PokerGameState> {
  return interactable.type === 'PokerArea';
}
